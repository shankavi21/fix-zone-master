import React, { useState, useEffect } from 'react';
import { Card, Table, Form, InputGroup, Badge, Button, Modal, Row, Col } from 'react-bootstrap';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import AdminLayout from '../components/AdminLayout';

export default function AdminTechnicians() {
    const [technicians, setTechnicians] = useState([]);
    const [filteredTechs, setFilteredTechs] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedTech, setSelectedTech] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    useEffect(() => {
        const q = query(collection(db, 'users'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const allUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const techData = allUsers.filter(u => u.role?.toLowerCase() === 'technician');
            setTechnicians(techData);
            setFilteredTechs(techData);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const handleDelete = async (techId) => {
        if (window.confirm('Are you sure you want to delete this expert? This will also remove their user account.')) {
            try {
                // Delete from users collection
                await deleteDoc(doc(db, 'users', techId));
                // Delete from technicians collection if exists
                try {
                    await deleteDoc(doc(db, 'technicians', techId));
                } catch (e) {
                    console.log('No extra tech record found');
                }
            } catch (error) {
                console.error('Error deleting expert:', error);
                alert('Failed to delete expert');
            }
        }
    };

    const handleToggleVerify = async (techId, currentStatus) => {
        try {
            const userRef = doc(db, 'users', techId);
            await updateDoc(userRef, { isVerified: !currentStatus });
        } catch (error) {
            console.error('Error updating verification status:', error);
        }
    };

    useEffect(() => {
        if (searchTerm) {
            const filtered = technicians.filter(t =>
                t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.email?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredTechs(filtered);
        } else {
            setFilteredTechs(technicians);
        }
    }, [searchTerm, technicians]);

    return (
        <AdminLayout>
            <div className="admin-technicians">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="fw-bold mb-1">Expert Management</h2>
                        <p className="text-muted mb-0">Manage all registered service experts</p>
                    </div>
                    <Badge bg="info" className="px-3 py-2 fs-6">
                        {filteredTechs.length} Experts
                    </Badge>
                </div>

                {/* Search */}
                <Card className="border-0 shadow-sm rounded-4 mb-4">
                    <Card.Body className="p-4">
                        <InputGroup>
                            <InputGroup.Text className="bg-light border-0">
                                <i className="bi bi-search"></i>
                            </InputGroup.Text>
                            <Form.Control
                                placeholder="Search experts..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="border-0 bg-light"
                            />
                        </InputGroup>
                    </Card.Body>
                </Card>

                {/* Table */}
                <Card className="border-0 shadow-sm rounded-4">
                    <Card.Body className="p-0">
                        {loading ? (
                            <div className="text-center py-5">
                                <div className="spinner-border text-danger" role="status"></div>
                            </div>
                        ) : filteredTechs.length > 0 ? (
                            <Table responsive hover className="mb-0">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="fw-bold text-uppercase small text-muted px-4 py-3">Expert</th>
                                        <th className="fw-bold text-uppercase small text-muted py-3">Specialization</th>
                                        <th className="fw-bold text-uppercase small text-muted py-3">Experience</th>
                                        <th className="fw-bold text-uppercase small text-muted py-3">Joined</th>
                                        <th className="fw-bold text-uppercase small text-muted py-3">Status</th>
                                        <th className="fw-bold text-uppercase small text-muted py-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTechs.map(tech => (
                                        <tr key={tech.id}>
                                            <td className="px-4 py-3">
                                                <div className="d-flex align-items-center gap-3">
                                                    {tech.photoURL ? (
                                                        <img src={tech.photoURL} alt={tech.name} className="rounded-circle" style={{ width: '45px', height: '45px', objectFit: 'cover' }} />
                                                    ) : (
                                                        <div className="bg-danger text-white rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '45px', height: '45px' }}>
                                                            {tech.name?.charAt(0) || 'T'}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="fw-bold text-dark">{tech.name || 'Expert'}</div>
                                                        <div className="text-muted small">{tech.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3">
                                                <div className="d-flex flex-wrap gap-1">
                                                    {(tech.serviceCategories || tech.services)?.slice(0, 2).map((cat, i) => (
                                                        <Badge key={i} bg="white" className="text-danger border border-danger-subtle small fw-bold px-2">
                                                            {cat}
                                                        </Badge>
                                                    ))}
                                                    {(tech.serviceCategories || tech.services)?.length > 2 && (
                                                        <Badge bg="light" className="text-muted border small fw-normal">+{(tech.serviceCategories || tech.services).length - 2}</Badge>
                                                    )}
                                                    {(!tech.serviceCategories && !tech.services) && <span className="text-muted small">Not specified</span>}
                                                </div>
                                            </td>
                                            <td className="py-3">
                                                <div className="fw-black text-dark">{tech.experienceYears || tech.experience || '0'} Years</div>
                                                <div className="text-muted small" style={{ fontSize: '0.7rem' }}>Professional Exp.</div>
                                            </td>
                                            <td className="py-3">
                                                <span className="text-muted small fw-bold">
                                                    {tech.createdAt?.toDate ? tech.createdAt.toDate().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                                                </span>
                                            </td>
                                            <td className="py-3">
                                                {tech.isVerified ? (
                                                    <Badge bg="success" className="px-3 py-2 rounded-pill shadow-sm">
                                                        <i className="bi bi-patch-check-fill me-1"></i> Verified
                                                    </Badge>
                                                ) : (
                                                    <Badge bg="warning" className="px-3 py-2 rounded-pill shadow-sm text-dark">
                                                        <i className="bi bi-clock-fill me-1"></i> Pending
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="py-3">
                                                <div className="d-flex gap-2">
                                                    <Button
                                                        variant="link"
                                                        size="sm"
                                                        className="text-danger fw-bold p-0 me-2"
                                                        onClick={() => {
                                                            setSelectedTech(tech);
                                                            setShowDetailModal(true);
                                                        }}
                                                    >
                                                        Details
                                                    </Button>
                                                    <Button
                                                        variant="link"
                                                        size="sm"
                                                        className="text-danger fw-bold p-0"
                                                        onClick={() => handleDelete(tech.id)}
                                                    >
                                                        Delete
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        ) : (
                            <div className="text-center py-5">
                                <i className="bi bi-person-badge text-muted opacity-25" style={{ fontSize: '4rem' }}></i>
                                <p className="text-muted mt-3">No technicians found</p>
                            </div>
                        )}
                    </Card.Body>
                </Card>
            </div>

            {/* Detail Modal */}
            <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg" centered>
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold">Expert Profile</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    {selectedTech && (
                        <div>
                            <div className="text-center mb-4 pb-4 border-bottom">
                                {selectedTech.photoURL ? (
                                    <img src={selectedTech.photoURL} alt={selectedTech.name} className="rounded-circle mb-3 shadow-sm" style={{ width: '100px', height: '100px', objectFit: 'cover', border: '3px solid #f8f9fa' }} />
                                ) : (
                                    <div className="bg-danger text-white rounded-circle d-flex align-items-center justify-content-center fw-bold mx-auto mb-3 shadow-sm" style={{ width: '100px', height: '100px', fontSize: '2.5rem' }}>
                                        {selectedTech.name?.charAt(0) || 'E'}
                                    </div>
                                )}
                                <h4 className="fw-bold mb-1">{selectedTech.name}</h4>
                                <p className="text-muted mb-3">{selectedTech.email}</p>
                                <div className="d-flex justify-content-center gap-2">
                                    <Badge bg={selectedTech.isVerified ? 'success' : 'warning'} className="px-3 py-2 rounded-pill">
                                        {selectedTech.isVerified ? 'Verified Expert' : 'Pending Verification'}
                                    </Badge>
                                    <Button
                                        variant={selectedTech.isVerified ? "outline-warning" : "outline-success"}
                                        size="sm"
                                        className="rounded-pill px-3"
                                        onClick={() => handleToggleVerify(selectedTech.id, selectedTech.isVerified)}
                                    >
                                        {selectedTech.isVerified ? 'Revoke Verification' : 'Approve Expert'}
                                    </Button>
                                </div>
                            </div>

                            <Row className="g-4 mb-4">
                                <Col md={6}>
                                    <div className="mb-3">
                                        <small className="text-muted text-uppercase fw-bold">Phone Number</small>
                                        <div className="fw-semibold">{selectedTech.phone || selectedTech.contactNumber || 'Not provided'}</div>
                                    </div>
                                    <div className="mb-3">
                                        <small className="text-muted text-uppercase fw-bold">Experience</small>
                                        <div className="fw-semibold">{selectedTech.experienceYears || selectedTech.experience || '0'} Years</div>
                                    </div>
                                    <div className="mb-3">
                                        <small className="text-muted text-uppercase fw-bold">NIC / ID Number</small>
                                        <div className="fw-semibold">{selectedTech.nicNumber || selectedTech.nic || 'Not provided'}</div>
                                    </div>
                                </Col>
                                <Col md={6}>
                                    <div className="mb-3">
                                        <small className="text-muted text-uppercase fw-bold">Specializations</small>
                                        <div className="d-flex flex-wrap gap-2 mt-1">
                                            {(selectedTech.serviceCategories || selectedTech.services || [])?.map((service, i) => (
                                                <Badge key={i} bg="light" className="text-dark border px-2 py-1">{service}</Badge>
                                            ))}
                                            {(!selectedTech.serviceCategories && !selectedTech.services) && <div className="text-muted">None listed</div>}
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <small className="text-muted text-uppercase fw-bold">Operating Districts</small>
                                        <div className="fw-semibold">{selectedTech.operatingDistricts?.join(', ') || selectedTech.districts?.join(', ') || 'Not specified'}</div>
                                    </div>
                                </Col>
                            </Row>

                            <hr />

                            <div className="mb-0">
                                <small className="text-muted text-uppercase fw-bold">Professional Summary</small>
                                <p className="mt-2 text-dark" style={{ lineHeight: '1.6' }}>
                                    {selectedTech.professionalSummary || selectedTech.bio || 'No professional summary provided.'}
                                </p>
                            </div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer className="border-0 pt-0">
                    <Button variant="light" className="rounded-pill px-4" onClick={() => setShowDetailModal(false)}>Close</Button>
                    <Button variant="danger" className="rounded-pill px-4" onClick={() => { if (selectedTech) handleDelete(selectedTech.id); setShowDetailModal(false); }}>Delete Expert</Button>
                </Modal.Footer>
            </Modal>
        </AdminLayout>
    );
}
