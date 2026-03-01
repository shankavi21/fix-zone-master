import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Form, InputGroup, Spinner, Modal, Alert, Tabs, Tab } from 'react-bootstrap';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc, orderBy, onSnapshot } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import TicketChat from '../components/TicketChat';

// Fix for default marker icon missing in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const ChangeView = ({ center, zoom }) => {
    const map = useMapEvents({});
    useEffect(() => {
        map.setView(center, zoom);
    }, [center, zoom, map]);
    return null;
};

export default function TechnicianJobs() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [jobs, setJobs] = useState([]);
    const [filteredJobs, setFilteredJobs] = useState([]);
    const [filter, setFilter] = useState('all'); // all, active, completed
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedJob, setSelectedJob] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        let unsubscribe;
        if (currentUser) {
            unsubscribe = fetchJobs();
        }
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [currentUser]);

    useEffect(() => {
        applyFilters();
    }, [jobs, filter, searchTerm]);

    const fetchJobs = () => {
        if (!currentUser) return;

        const jobsQuery = query(
            collection(db, 'tickets'),
            where('assignedTechId', '==', currentUser.uid)
        );

        const unsubscribe = onSnapshot(jobsQuery, (querySnapshot) => {
            const jobsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Client-side sort
            jobsData.sort((a, b) => {
                const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
                const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
                return timeB - timeA;
            });
            setJobs(jobsData);
            setLoading(false);
        }, (error) => {
            console.error('Error fetching jobs:', error);
            setLoading(false);
        });

        return unsubscribe;
    };

    const applyFilters = () => {
        let filtered = [...jobs];

        // Status filter
        if (filter === 'active') {
            filtered = filtered.filter(job =>
                job.status === 'Assigned' || job.status === 'In Progress' || job.status === 'Pending'
            );
        } else if (filter === 'completed') {
            filtered = filtered.filter(job => job.status === 'Completed');
        }

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(job =>
                job.applianceType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                job.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                job.city?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredJobs(filtered);
    };

    const handleUpdateStatus = async (jobId, newStatus) => {
        setUpdating(true);
        try {
            await updateDoc(doc(db, 'tickets', jobId), {
                status: newStatus,
                updatedAt: new Date()
            });

            // Update local state
            setJobs(jobs.map(job =>
                job.id === jobId ? { ...job, status: newStatus } : job
            ));

            if (selectedJob?.id === jobId) {
                setSelectedJob({ ...selectedJob, status: newStatus });
            }

            alert(`Job status updated to: ${newStatus}`);
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status');
        } finally {
            setUpdating(false);
        }
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            'Pending': { bg: 'warning', text: 'Pending' },
            'Assigned': { bg: 'info', text: 'Assigned' },
            'In Progress': { bg: 'primary', text: 'In Progress' },
            'Completed': { bg: 'success', text: 'Completed' },
            'Cancelled': { bg: 'danger', text: 'Cancelled' }
        };
        const config = statusMap[status] || { bg: 'secondary', text: status };
        return <Badge bg={config.bg}>{config.text}</Badge>;
    };

    const openJobDetails = (job) => {
        setSelectedJob(job);
        setShowDetailModal(true);
    };

    if (loading) {
        return (
            <Layout>
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '70vh' }}>
                    <Spinner animation="border" variant="danger" />
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="technician-jobs bg-light min-vh-100 py-4">
                <Container>
                    <div className="mb-4">
                        <h2 className="fw-bold text-dark mb-1">My Jobs</h2>
                        <p className="text-muted">Manage all your assigned repair jobs</p>
                    </div>

                    {/* Filters */}
                    <Card className="border-0 shadow-sm mb-4">
                        <Card.Body>
                            <Row className="g-3">
                                <Col md={4}>
                                    <InputGroup>
                                        <InputGroup.Text className="bg-white">
                                            <i className="bi bi-search"></i>
                                        </InputGroup.Text>
                                        <Form.Control
                                            placeholder="Search jobs..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </InputGroup>
                                </Col>
                                <Col md={8}>
                                    <div className="d-flex gap-2">
                                        <Button
                                            variant={filter === 'all' ? 'danger' : 'outline-secondary'}
                                            onClick={() => setFilter('all')}
                                            className="rounded-pill"
                                        >
                                            All ({jobs.length})
                                        </Button>
                                        <Button
                                            variant={filter === 'active' ? 'danger' : 'outline-secondary'}
                                            onClick={() => setFilter('active')}
                                            className="rounded-pill"
                                        >
                                            Active ({jobs.filter(j => j.status === 'Assigned' || j.status === 'In Progress').length})
                                        </Button>
                                        <Button
                                            variant={filter === 'completed' ? 'danger' : 'outline-secondary'}
                                            onClick={() => setFilter('completed')}
                                            className="rounded-pill"
                                        >
                                            Completed ({jobs.filter(j => j.status === 'Completed').length})
                                        </Button>
                                    </div>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>

                    {/* Jobs List */}
                    {filteredJobs.length > 0 ? (
                        <Row className="g-4">
                            {filteredJobs.map(job => (
                                <Col key={job.id} lg={6}>
                                    <Card className="border-0 shadow-sm h-100 hover-lift" style={{ cursor: 'pointer' }}>
                                        <Card.Body onClick={() => openJobDetails(job)}>
                                            <div className="d-flex align-items-start justify-content-between mb-3">
                                                <div>
                                                    <h5 className="fw-bold mb-1">{job.applianceType}</h5>
                                                    {getStatusBadge(job.status)}
                                                </div>
                                                <h5 className="text-danger fw-bold mb-0">
                                                    LKR {(job.serviceFee || 0).toLocaleString()}
                                                </h5>
                                            </div>

                                            <p className="text-muted small mb-3">
                                                {job.description?.substring(0, 120)}...
                                            </p>

                                            <div className="mb-3">
                                                <div className="d-flex align-items-center gap-2 small text-muted mb-1">
                                                    <i className="bi bi-person"></i>
                                                    <span>{job.customerName}</span>
                                                </div>
                                                <div className="d-flex align-items-center gap-2 small text-muted mb-1">
                                                    <i className="bi bi-telephone"></i>
                                                    <span>{job.customerPhone || 'Not provided'}</span>
                                                </div>
                                                <div className="d-flex align-items-center gap-2 small text-muted mb-1">
                                                    <i className="bi bi-geo-alt"></i>
                                                    <span>{job.address}, {job.city}</span>
                                                </div>
                                                <div className="d-flex align-items-center gap-2 small text-muted">
                                                    <i className="bi bi-calendar"></i>
                                                    <span>{job.preferredDate} • {job.preferredTimeSlot}</span>
                                                </div>
                                            </div>

                                            <div className="d-flex flex-wrap gap-2">
                                                {job.issues?.map(issue => (
                                                    <Badge key={issue} bg="light" text="dark" className="small">
                                                        {issue}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </Card.Body>
                                        <Card.Footer className="bg-white border-top">
                                            <div className="d-flex gap-2">
                                                {job.status === 'Assigned' && (
                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        className="flex-grow-1"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleUpdateStatus(job.id, 'In Progress');
                                                        }}
                                                        disabled={updating}
                                                    >
                                                        Start Job
                                                    </Button>
                                                )}
                                                {job.status === 'In Progress' && (
                                                    <Button
                                                        variant="success"
                                                        size="sm"
                                                        className="flex-grow-1"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleUpdateStatus(job.id, 'Completed');
                                                        }}
                                                        disabled={updating}
                                                    >
                                                        Mark Complete
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openJobDetails(job);
                                                    }}
                                                >
                                                    View Details
                                                </Button>
                                            </div>
                                        </Card.Footer>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    ) : (
                        <Card className="border-0 shadow-sm">
                            <Card.Body className="text-center py-5">
                                <i className="bi bi-inbox fs-1 text-muted d-block mb-3"></i>
                                <h5 className="text-muted">No jobs found</h5>
                                <p className="text-muted small">Try adjusting your filters</p>
                            </Card.Body>
                        </Card>
                    )}
                </Container>
            </div>

            {/* Job Detail Modal */}
            <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg" centered>
                {selectedJob && (
                    <>
                        <Modal.Header closeButton>
                            <Modal.Title>Job Details</Modal.Title>
                        </Modal.Header>
                        <Modal.Body className="p-0">
                            <Tabs defaultActiveKey="details" className="bg-light border-bottom px-3 pt-2">
                                <Tab eventKey="details" title="Details" className="p-4">
                                    <Row className="g-4">
                                        <Col md={6}>
                                            <h6 className="text-muted small">APPLIANCE</h6>
                                            <p className="fw-bold">{selectedJob.applianceType}</p>
                                        </Col>
                                        <Col md={6}>
                                            <h6 className="text-muted small">BRAND</h6>
                                            <p className="fw-bold">{selectedJob.brand}</p>
                                        </Col>
                                        <Col md={12}>
                                            <h6 className="text-muted small">PROBLEM DESCRIPTION</h6>
                                            <p>{selectedJob.description}</p>
                                        </Col>
                                        <Col md={12}>
                                            <h6 className="text-muted small">ISSUES REPORTED</h6>
                                            <div className="d-flex flex-wrap gap-2">
                                                {selectedJob.issues?.map(issue => (
                                                    <Badge key={issue} bg="danger" className="bg-opacity-10 text-danger">
                                                        {issue}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </Col>
                                        <Col md={6}>
                                            <h6 className="text-muted small">CUSTOMER NAME</h6>
                                            <p className="fw-bold">{selectedJob.customerName}</p>
                                        </Col>
                                        <Col md={6}>
                                            <h6 className="text-muted small">CONTACT</h6>
                                            <p className="fw-bold">{selectedJob.customerPhone || selectedJob.customerEmail}</p>
                                        </Col>
                                        <Col md={12}>
                                            <h6 className="text-muted small">SERVICE ADDRESS</h6>
                                            <div className="d-flex justify-content-between align-items-start">
                                                <p className="mb-2">{selectedJob.address}, {selectedJob.city}</p>
                                                {selectedJob.location && (
                                                    <Button
                                                        variant="outline-primary"
                                                        size="sm"
                                                        className="rounded-pill px-3"
                                                        onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${selectedJob.location.lat},${selectedJob.location.lng}`, '_blank')}
                                                    >
                                                        <i className="bi bi-geo-fill me-1"></i> Get Directions
                                                    </Button>
                                                )}
                                            </div>

                                            {selectedJob.location && (
                                                <div className="rounded-3 overflow-hidden border mt-2" style={{ height: '200px', width: '100%' }}>
                                                    <MapContainer
                                                        center={[selectedJob.location.lat, selectedJob.location.lng]}
                                                        zoom={15}
                                                        style={{ height: '100%', width: '100%' }}
                                                        scrollWheelZoom={false}
                                                    >
                                                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                                        <ChangeView center={[selectedJob.location.lat, selectedJob.location.lng]} zoom={15} />
                                                        <Marker position={[selectedJob.location.lat, selectedJob.location.lng]} />
                                                    </MapContainer>
                                                </div>
                                            )}
                                        </Col>
                                        <Col md={6}>
                                            <h6 className="text-muted small">SCHEDULED DATE</h6>
                                            <p className="fw-bold">{selectedJob.preferredDate}</p>
                                        </Col>
                                        <Col md={6}>
                                            <h6 className="text-muted small">TIME SLOT</h6>
                                            <p className="fw-bold">{selectedJob.preferredTimeSlot}</p>
                                        </Col>
                                        <Col md={6}>
                                            <h6 className="text-muted small">SERVICE FEE</h6>
                                            <p className="fw-bold text-danger">LKR {(selectedJob.serviceFee || 0).toLocaleString()}</p>
                                        </Col>
                                        <Col md={6}>
                                            <h6 className="text-muted small">STATUS</h6>
                                            {getStatusBadge(selectedJob.status)}
                                        </Col>
                                        {selectedJob.photoURLs && selectedJob.photoURLs.length > 0 && (
                                            <Col md={12}>
                                                <h6 className="text-muted small">CUSTOMER PHOTOS</h6>
                                                <div className="d-flex gap-2 flex-wrap">
                                                    {selectedJob.photoURLs.map((url, idx) => (
                                                        <img
                                                            key={idx}
                                                            src={url}
                                                            alt={`Photo ${idx + 1}`}
                                                            className="rounded"
                                                            style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                                                        />
                                                    ))}
                                                </div>
                                            </Col>
                                        )}
                                    </Row>
                                </Tab>
                                <Tab eventKey="chat" title="Chat" className="p-4">
                                    <div style={{ height: '450px' }}>
                                        <TicketChat
                                            ticketId={selectedJob.id}
                                            currentUser={currentUser}
                                            role="technician"
                                            assignedTechId={currentUser.uid}
                                            assignedTechName={currentUser.displayName}
                                        />
                                    </div>
                                </Tab>
                            </Tabs>
                        </Modal.Body>
                        <Modal.Footer>
                            {(selectedJob.status === 'Pending' || selectedJob.status === 'Assigned') && (
                                <Button
                                    variant="primary"
                                    onClick={() => handleUpdateStatus(selectedJob.id, 'In Progress')}
                                    disabled={updating}
                                >
                                    {updating ? 'Updating...' : (selectedJob.status === 'Pending' ? 'Accept & Start Job' : 'Start Job')}
                                </Button>
                            )}
                            {selectedJob.status === 'In Progress' && (
                                <Button
                                    variant="success"
                                    onClick={() => handleUpdateStatus(selectedJob.id, 'Completed')}
                                    disabled={updating}
                                >
                                    {updating ? 'Updating...' : 'Mark as Completed'}
                                </Button>
                            )}
                            <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
                                Close
                            </Button>
                        </Modal.Footer>
                    </>
                )}
            </Modal>

            <style dangerouslySetInnerHTML={{
                __html: `
                .hover-lift {
                    transition: all 0.3s ease;
                }
                .hover-lift:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important;
                }
            `}} />
        </Layout>
    );
}
