import React, { useState, useEffect, useRef } from 'react';
import { Form, Button, Card, ListGroup, Badge, Row, Col, Spinner, Nav, Tab, Table, Container } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { uploadToCloudinary } from '../utils/cloudinary';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';

const DISTRICTS = [
    "Ampara", "Anuradhapura", "Badulla", "Batticaloa", "Colombo", "Galle", "Gampaha",
    "Hambantota", "Jaffna", "Kalutara", "Kandy", "Kegalle", "Kilinochchi", "Kurunegala",
    "Mannar", "Matale", "Matara", "Moneragala", "Mullaitivu", "Nuwara Eliya",
    "Polonnaruwa", "Puttalam", "Ratnapura", "Trincomalee", "Vavuniya"
];

export default function Profile() {
    const { currentUser, userRole, logout } = useAuth();
    const navigate = useNavigate();
    const [profileData, setProfileData] = useState({
        name: '',
        phone: '',
        address: '',
        district: 'Colombo',
        photoURL: ''
    });
    const [loading, setLoading] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [photoUploading, setPhotoUploading] = useState(false);
    const [activeTickets, setActiveTickets] = useState([]);
    const [ticketHistory, setTicketHistory] = useState([]);
    const [fetchingTickets, setFetchingTickets] = useState(true);
    const fileInputRef = useRef(null);

    const isAdmin = userRole === 'admin';

    useEffect(() => {
        let isMounted = true;
        async function fetchProfile() {
            if (currentUser) {
                try {
                    const docRef = doc(db, 'users', currentUser.uid);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists() && isMounted) {
                        setProfileData(prev => ({ ...prev, ...docSnap.data() }));
                    }
                } catch (error) {
                    console.error("Error fetching profile:", error);
                }
            }
        }
        fetchProfile();
        return () => { isMounted = false; };
    }, [currentUser]);

    // Fetch Tickets (Active & History)
    useEffect(() => {
        if (!currentUser?.uid) return;

        const q = query(
            collection(db, 'tickets'),
            where('customerId', '==', currentUser.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const allTickets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Active: Not Completed/Cancelled
            setActiveTickets(allTickets.filter(t => !['Completed', 'Cancelled'].includes(t.status)));

            // History: Completed/Cancelled
            setTicketHistory(allTickets.filter(t => ['Completed', 'Cancelled'].includes(t.status))
                .sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)));

            setFetchingTickets(false);
        });

        return unsubscribe;
    }, [currentUser?.uid]);

    async function handleSave() {
        if (isAdmin) return;
        setLoading(true);
        try {
            const docRef = doc(db, 'users', currentUser.uid);
            await updateDoc(docRef, profileData);
            setEditMode(false);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    async function handlePhotoUpload(e) {
        if (isAdmin) return;
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please select an image file.');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('Image size should be less than 5MB.');
            return;
        }

        setPhotoUploading(true);
        try {
            const downloadURL = await uploadToCloudinary(file, `profilePhotos/${currentUser.uid}`);
            const docRef = doc(db, 'users', currentUser.uid);
            await updateDoc(docRef, { photoURL: downloadURL });
            setProfileData(prev => ({ ...prev, photoURL: downloadURL }));
        } catch (error) {
            console.error('Error uploading photo:', error);
            alert('Failed to upload photo. Please try again.');
        } finally {
            setPhotoUploading(false);
        }
    }

    return (
        <Layout>
            <div className="profile-dashboard min-vh-100 bg-light-cool pb-5 animate-fade-in">
                <Container className="py-4 py-lg-5">
                    {/* Header Section */}
                    <div className="mb-5 d-flex flex-column flex-md-row justify-content-between align-items-center gap-4">
                        <div className="d-flex align-items-center gap-4 text-center text-md-start flex-column flex-md-row">
                            <div className="position-relative">
                                <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" className="d-none" />
                                {profileData.photoURL ? (
                                    <img src={profileData.photoURL} alt="Profile avatar" className="rounded-circle shadow-premium border border-4 border-white object-fit-cover" style={{ width: '120px', height: '120px' }} />
                                ) : (
                                    <div className="bg-maroon text-white rounded-circle d-flex align-items-center justify-content-center fw-black shadow-premium" style={{ width: '120px', height: '120px', fontSize: '3.5rem' }}>
                                        {profileData.name ? profileData.name.charAt(0).toUpperCase() : 'U'}
                                    </div>
                                )}
                                {!isAdmin && (
                                    <button className="position-absolute bottom-0 end-0 bg-white shadow-sm border rounded-circle p-2 hover-scale transition-all" onClick={() => fileInputRef.current?.click()} style={{ width: '40px', height: '40px' }}>
                                        {photoUploading ? <Spinner animation="border" size="sm" variant="danger" /> : <i className="bi bi-camera text-danger"></i>}
                                    </button>
                                )}
                            </div>
                            <div>
                                <h2 className="fw-black text-dark mb-1">{profileData.name || 'Your Profile'}</h2>
                                <p className="text-muted mb-0 fw-medium">{currentUser?.email}</p>
                                <Badge bg="success" className="bg-opacity-10 text-success mt-2 px-3 py-2 rounded-pill fw-bold">Verified Customer</Badge>
                            </div>
                        </div>
                        {!isAdmin && (
                            <div className="d-flex gap-2">
                                <Button variant={editMode ? "light" : "outline-danger"} className="rounded-pill px-4 py-2 fw-black transition-all" onClick={() => setEditMode(!editMode)}>
                                    {editMode ? 'Cancel' : 'Edit Profile'}
                                </Button>
                                {editMode && (
                                    <Button className="rounded-pill px-4 py-2 fw-black btn-maroon shadow-premium" onClick={handleSave} disabled={loading}>
                                        {loading ? <Spinner size="sm" /> : 'Save Changes'}
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>

                    <Tab.Container defaultActiveKey="personal">
                        <Row>
                            <Col lg={3} className="mb-4">
                                <Nav variant="pills" className="flex-column bg-white shadow-premium rounded-4 p-2 gap-2">
                                    <Nav.Item>
                                        <Nav.Link eventKey="personal" className="rounded-3 d-flex align-items-center gap-3 py-3 px-4 fw-black">
                                            <i className="bi bi-person fs-5"></i> Personal Details
                                        </Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link eventKey="active" className="rounded-3 d-flex align-items-center gap-3 py-3 px-4 fw-black">
                                            <i className="bi bi-clock-history fs-5"></i> Active Bookings
                                            {activeTickets.length > 0 && <Badge pill bg="danger" className="ms-auto">{activeTickets.length}</Badge>}
                                        </Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link eventKey="history" className="rounded-3 d-flex align-items-center gap-3 py-3 px-4 fw-black">
                                            <i className="bi bi-journal-text fs-5"></i> Service History
                                        </Nav.Link>
                                    </Nav.Item>
                                    <Nav.Item>
                                        <Nav.Link eventKey="security" className="rounded-3 d-flex align-items-center gap-3 py-3 px-4 fw-black">
                                            <i className="bi bi-shield-lock fs-5"></i> Account Security
                                        </Nav.Link>
                                    </Nav.Item>
                                </Nav>
                            </Col>

                            <Col lg={9}>
                                <Tab.Content className="animate-slide-up">
                                    <Tab.Pane eventKey="personal">
                                        <Card className="border-0 shadow-premium rounded-4 overflow-hidden">
                                            <Card.Body className="p-4 p-lg-5">
                                                <Row className="g-4">
                                                    <Col md={6}>
                                                        <Form.Group>
                                                            <Form.Label className="small fw-black text-muted text-uppercase ls-1">Full Name</Form.Label>
                                                            <Form.Control
                                                                value={profileData.name}
                                                                disabled={!editMode || isAdmin}
                                                                onChange={e => setProfileData({ ...profileData, name: e.target.value })}
                                                                className="rounded-3 border-light py-3 px-4 fw-bold bg-light bg-opacity-50"
                                                            />
                                                        </Form.Group>
                                                    </Col>
                                                    <Col md={6}>
                                                        <Form.Group>
                                                            <Form.Label className="small fw-black text-muted text-uppercase ls-1">Mobile Number</Form.Label>
                                                            <Form.Control
                                                                value={profileData.phone}
                                                                disabled={!editMode || isAdmin}
                                                                onChange={e => setProfileData({ ...profileData, phone: e.target.value })}
                                                                className="rounded-3 border-light py-3 px-4 fw-bold bg-light bg-opacity-50"
                                                            />
                                                        </Form.Group>
                                                    </Col>
                                                    <Col md={12}>
                                                        <Form.Group>
                                                            <Form.Label className="small fw-black text-muted text-uppercase ls-1">Home Address</Form.Label>
                                                            <Form.Control
                                                                as="textarea" rows={3}
                                                                value={profileData.address}
                                                                disabled={!editMode || isAdmin}
                                                                onChange={e => setProfileData({ ...profileData, address: e.target.value })}
                                                                className="rounded-3 border-light py-3 px-4 fw-bold bg-light bg-opacity-50"
                                                            />
                                                        </Form.Group>
                                                    </Col>
                                                    <Col md={6}>
                                                        <Form.Group>
                                                            <Form.Label className="small fw-black text-muted text-uppercase ls-1">Default Service Location (District)</Form.Label>
                                                            <Form.Select
                                                                value={profileData.district}
                                                                disabled={!editMode || isAdmin}
                                                                onChange={e => setProfileData({ ...profileData, district: e.target.value })}
                                                                className="rounded-3 border-light py-3 px-4 fw-bold bg-light bg-opacity-50"
                                                            >
                                                                {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                                                            </Form.Select>
                                                        </Form.Group>
                                                    </Col>
                                                </Row>
                                            </Card.Body>
                                        </Card>
                                    </Tab.Pane>

                                    <Tab.Pane eventKey="active">
                                        {fetchingTickets ? (
                                            <div className="text-center py-5"><Spinner animation="border" variant="danger" /></div>
                                        ) : activeTickets.length === 0 ? (
                                            <Card className="border-0 shadow-premium rounded-4 text-center py-5 p-4">
                                                <i className="bi bi-calendar-x text-muted display-4 mb-3"></i>
                                                <h5 className="fw-black">No Active Bookings</h5>
                                                <p className="text-muted">You don't have any ongoing service requests at the moment.</p>
                                                <Button className="btn-maroon rounded-pill px-4 mx-auto mt-2 fw-black" onClick={() => navigate('/customer/dashboard')}>Book a Service</Button>
                                            </Card>
                                        ) : (
                                            <div className="d-flex flex-column gap-3">
                                                {activeTickets.map(ticket => (
                                                    <Card key={ticket.id} className="border-0 shadow-premium rounded-4 overflow-hidden clickable transition-all hover-lift" onClick={() => navigate(`/customer/tickets/${ticket.id}`)}>
                                                        <Card.Body className="p-4">
                                                            <div className="d-flex justify-content-between align-items-start mb-3">
                                                                <div>
                                                                    <Badge bg="danger" className="bg-opacity-10 text-danger mb-2">#{ticket.id.slice(-6).toUpperCase()}</Badge>
                                                                    <h5 className="fw-black mb-1">{ticket.applianceType} - {ticket.issue}</h5>
                                                                    <small className="text-muted fw-bold"><i className="bi bi-clock me-1"></i> Requested: {ticket.createdAt?.toDate().toLocaleDateString()}</small>
                                                                </div>
                                                                <StatusBadge status={ticket.status} />
                                                            </div>
                                                            <hr className="opacity-10" />
                                                            <div className="d-flex align-items-center gap-3">
                                                                <div className="bg-light rounded-circle p-2" style={{ width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                    <i className="bi bi-person-gear text-maroon fs-5"></i>
                                                                </div>
                                                                <div>
                                                                    <small className="text-muted d-block fw-bold text-uppercase ls-1" style={{ fontSize: '10px' }}>TECHNICIAN</small>
                                                                    <span className="fw-bold">{ticket.assignedTechName || ticket.technicianName || 'Assigning soon...'}</span>
                                                                </div>
                                                                <div className="ms-auto d-flex gap-2">
                                                                    {ticket.status === 'On the Way' && (
                                                                        <Button variant="outline-success" className="rounded-pill px-3 py-1 fw-bold small shadow-sm animate-pulse" onClick={(e) => { e.stopPropagation(); navigate('/customer/tracking'); }}>
                                                                            <i className="bi bi-geo-alt-fill me-1"></i> Track Live
                                                                        </Button>
                                                                    )}
                                                                    <Button variant="light" className="rounded-pill px-3 py-1 fw-black small border">Details</Button>
                                                                </div>
                                                            </div>
                                                        </Card.Body>
                                                    </Card>
                                                ))}
                                            </div>
                                        )}
                                    </Tab.Pane>

                                    <Tab.Pane eventKey="history">
                                        <Card className="border-0 shadow-premium rounded-4 overflow-hidden">
                                            <Card.Body className="p-0">
                                                <div className="p-4 bg-light border-bottom">
                                                    <h6 className="fw-black mb-0">Past Service Requests</h6>
                                                </div>
                                                <div className="table-responsive">
                                                    <Table borderless hover className="mb-0">
                                                        <thead className="bg-light bg-opacity-50">
                                                            <tr className="small text-muted fw-black text-uppercase ls-1">
                                                                <th className="px-4 py-3">Service</th>
                                                                <th className="py-3">Date</th>
                                                                <th className="py-3">Technician</th>
                                                                <th className="py-3">Status</th>
                                                                <th className="py-3 text-end px-4">Amount</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {ticketHistory.map(ticket => (
                                                                <tr key={ticket.id} className="border-bottom clickable" onClick={() => navigate(`/customer/tickets/${ticket.id}`)}>
                                                                    <td className="px-4 py-4 fw-bold">{ticket.applianceType}</td>
                                                                    <td className="py-4 text-muted small fw-bold">{ticket.createdAt?.toDate().toLocaleDateString()}</td>
                                                                    <td className="py-4 small fw-bold">{ticket.assignedTechName || ticket.technicianName || 'N/A'}</td>
                                                                    <td className="py-4 text-center"><StatusBadge status={ticket.status} /></td>
                                                                    <td className="py-4 text-end px-4 fw-black text-dark">LKR {ticket.finalBill || '0.00'}</td>
                                                                </tr>
                                                            ))}
                                                            {ticketHistory.length === 0 && (
                                                                <tr><td colSpan="5" className="text-center py-5 text-muted">No history found</td></tr>
                                                            )}
                                                        </tbody>
                                                    </Table>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Tab.Pane>

                                    <Tab.Pane eventKey="security">
                                        <Card className="border-0 shadow-premium rounded-4">
                                            <Card.Body className="p-4 p-lg-5">
                                                <div className="d-flex flex-column gap-4">
                                                    <div className="d-flex align-items-center justify-content-between p-4 bg-light bg-opacity-50 rounded-4 border">
                                                        <div className="d-flex align-items-center gap-3">
                                                            <div className="bg-white rounded-circle shadow-sm d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px' }}>
                                                                <i className="bi bi-key text-primary fs-4"></i>
                                                            </div>
                                                            <div>
                                                                <h6 className="fw-black mb-1">Passowrd & Auth</h6>
                                                                <small className="text-muted fw-medium">Last changed: Recently</small>
                                                            </div>
                                                        </div>
                                                        <Button variant="outline-dark" className="rounded-pill px-4 fw-black small" onClick={() => navigate('/customer/settings', { state: { tab: 'security' } })}>Update</Button>
                                                    </div>

                                                    <div className="d-flex align-items-center justify-content-between p-4 bg-light bg-opacity-50 rounded-4 border">
                                                        <div className="d-flex align-items-center gap-3">
                                                            <div className="bg-white rounded-circle shadow-sm d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px' }}>
                                                                <i className="bi bi-bell text-warning fs-4"></i>
                                                            </div>
                                                            <div>
                                                                <h6 className="fw-black mb-1">Notifications</h6>
                                                                <small className="text-muted fw-medium">Email, SMS & App Alerts</small>
                                                            </div>
                                                        </div>
                                                        <Button variant="outline-dark" className="rounded-pill px-4 fw-black small" onClick={() => navigate('/customer/settings', { state: { tab: 'notifications' } })}>Manage</Button>
                                                    </div>

                                                    {!isAdmin && (
                                                        <div className="mt-4 p-4 rounded-4 d-flex justify-content-between align-items-center" style={{ backgroundColor: 'rgba(220, 53, 69, 0.05)', border: '1px solid rgba(220, 53, 69, 0.2)' }}>
                                                            <div>
                                                                <h6 className="fw-black text-danger mb-1">Delete Account</h6>
                                                                <p className="text-muted small mb-0 fw-bold">Permanently remove all your data from FixZone</p>
                                                            </div>
                                                            <Button variant="outline-danger" className="rounded-pill px-4 fw-black small shadow-sm bg-white" onClick={() => navigate('/customer/settings', { state: { tab: 'security' } })}>Delete Account</Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Tab.Pane>
                                </Tab.Content>
                            </Col>
                        </Row>
                    </Tab.Container>
                </Container>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .bg-light-cool { background-color: #F8FAFC; }
                .fw-black { font-weight: 850 !important; }
                .btn-maroon { background-color: #dc3545 !important; color: white !important; border: none !important; }
                .btn-maroon:hover { background-color: #b91c1c !important; transform: translateY(-2px); }
                .ls-1 { letter-spacing: 0.05rem; }
                .shadow-premium { box-shadow: 0 10px 30px rgba(0,0,0,0.05) !important; }
                .object-fit-cover { object-fit: cover !important; }
                .nav-pills .nav-link { 
                    color: #64748b; 
                    background: transparent;
                    transition: all 0.25s ease;
                }
                .nav-pills .nav-link.active {
                    background: #dc3545 !important;
                    color: white !important;
                    box-shadow: 0 4px 15px rgba(220, 53, 69, 0.25);
                }
                .nav-pills .nav-link:hover:not(.active) {
                    background: #f1f5f9;
                    color: #dc3545;
                }
                .text-maroon { color: #dc3545 !important; }
                .bg-maroon { background-color: #dc3545 !important; }
                .hover-scale:hover { transform: scale(1.1); }
                .hover-lift { transition: all 0.3s ease; }
                .hover-lift:hover { transform: translateY(-5px); box-shadow: 0 15px 40px rgba(0,0,0,0.1) !important; }
                .animate-slide-up { animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
                @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                .animate-pulse { animation: statusPulse 2s infinite; }
                @keyframes statusPulse {
                    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(25, 135, 84, 0.4); }
                    70% { transform: scale(1.02); box-shadow: 0 0 0 10px rgba(25, 135, 84, 0); }
                    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(25, 135, 84, 0); }
                }
                .clickable { cursor: pointer; }
            ` }} />
        </Layout>
    );
}
