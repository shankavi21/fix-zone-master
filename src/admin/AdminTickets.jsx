import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Form, InputGroup, Modal, Row, Col, Tabs, Tab } from 'react-bootstrap';
import { db } from '../firebase';
import { collection, query, onSnapshot, doc, updateDoc, orderBy, getDocs, where, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import AdminLayout from '../components/AdminLayout';
import { useAuth } from '../contexts/AuthContext';
import TicketChat from '../components/TicketChat';

export default function AdminTickets() {
    const { currentUser } = useAuth();
    const [tickets, setTickets] = useState([]);
    const [filteredTickets, setFilteredTickets] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [experts, setExperts] = useState([]);

    useEffect(() => {
        const q = query(collection(db, 'tickets'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const ticketData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Sort manually by createdAt
            ticketData.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
            setTickets(ticketData);
            setFilteredTickets(ticketData);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    useEffect(() => {
        const fetchExperts = async () => {
            const q = query(collection(db, 'users'), where('role', '==', 'technician'));
            const snapshot = await getDocs(q);
            setExperts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        };
        fetchExperts();
    }, []);

    useEffect(() => {
        let filtered = tickets;

        if (statusFilter !== 'All') {
            filtered = filtered.filter(t => t.status === statusFilter);
        }

        if (searchTerm) {
            filtered = filtered.filter(t =>
                t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.applianceType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredTickets(filtered);
    }, [searchTerm, statusFilter, tickets]);

    const handleStatusChange = async (ticketId, newStatus) => {
        try {
            const ticketRef = doc(db, 'tickets', ticketId);
            await updateDoc(ticketRef, { status: newStatus });
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const handleAssignExpert = async (ticketId, expertId) => {
        if (!expertId) return;
        try {
            const expert = experts.find(e => e.id === expertId);
            const ticketRef = doc(db, 'tickets', ticketId);
            await updateDoc(ticketRef, {
                assignedTechId: expertId,
                assignedTechName: expert.name || 'Expert',
                status: 'Assigned',
                updatedAt: new Date()
            });

            // Notify Expert
            await addDoc(collection(db, 'notifications'), {
                userId: expertId,
                title: 'New Job Assigned!',
                message: `You have been assigned to a new ticket: #${ticketId.slice(0, 8).toUpperCase()} (${selectedTicket.applianceType})`,
                type: 'info',
                icon: 'bi-briefcase-fill',
                read: false,
                createdAt: serverTimestamp()
            });

            // Notify Customer
            if (selectedTicket.userId) {
                await addDoc(collection(db, 'notifications'), {
                    userId: selectedTicket.userId,
                    title: 'Expert Assigned!',
                    message: `${expert.name} has been assigned to your repair request for ${selectedTicket.applianceType}. You can expect a call soon.`,
                    type: 'success',
                    icon: 'bi-person-check-fill',
                    read: false,
                    createdAt: serverTimestamp()
                });
            }

            setShowDetailModal(false);
            alert('Expert assigned successfully!');
        } catch (error) {
            console.error('Error assigning expert:', error);
        }
    };

    const handleDeleteTicket = async (ticketId) => {
        if (window.confirm('Are you sure you want to delete this ticket?')) {
            try {
                await deleteDoc(doc(db, 'tickets', ticketId));
                alert('Ticket deleted');
            } catch (error) {
                console.error('Error deleting ticket:', error);
            }
        }
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            'Pending': 'warning',
            'Assigned': 'info',
            'Scheduled': 'primary',
            'On the Way': 'info',
            'In Progress': 'info',
            'Completed': 'success',
            'Finished': 'success',
            'Cancelled': 'danger',
            'Quoted': 'secondary'
        };
        return statusMap[status] || 'secondary';
    };

    const statuses = ['All', 'Pending', 'Assigned', 'Scheduled', 'On the Way', 'In Progress', 'Quoted', 'Completed', 'Cancelled'];

    return (
        <AdminLayout>
            <div className="admin-tickets">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="fw-bold mb-1">Ticket Management</h2>
                        <p className="text-muted mb-0">Manage and track all repair tickets</p>
                    </div>
                    <Badge bg="primary" className="px-3 py-2 fs-6">
                        {filteredTickets.length} Tickets
                    </Badge>
                </div>

                {/* Filters */}
                <Card className="border-0 shadow-sm rounded-4 mb-4">
                    <Card.Body className="p-4">
                        <Row className="g-3">
                            <Col md={6}>
                                <InputGroup>
                                    <InputGroup.Text className="bg-light border-0">
                                        <i className="bi bi-search"></i>
                                    </InputGroup.Text>
                                    <Form.Control
                                        placeholder="Search by ID, appliance, or customer..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="border-0 bg-light"
                                    />
                                </InputGroup>
                            </Col>
                            <Col md={6}>
                                <Form.Select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="bg-light border-0"
                                >
                                    {statuses.map(status => (
                                        <option key={status} value={status}>{status}</option>
                                    ))}
                                </Form.Select>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* Tickets Table */}
                <Card className="border-0 shadow-sm rounded-4">
                    <Card.Body className="p-0">
                        {loading ? (
                            <div className="text-center py-5">
                                <div className="spinner-border text-danger" role="status"></div>
                            </div>
                        ) : filteredTickets.length > 0 ? (
                            <Table responsive hover className="mb-0">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="fw-bold text-uppercase small text-muted px-4 py-3">ID</th>
                                        <th className="fw-bold text-uppercase small text-muted py-3">Customer</th>
                                        <th className="fw-bold text-uppercase small text-muted py-3">Appliance</th>
                                        <th className="fw-bold text-uppercase small text-muted py-3">Location</th>
                                        <th className="fw-bold text-uppercase small text-muted py-3">Status</th>
                                        <th className="fw-bold text-uppercase small text-muted py-3">Date</th>
                                        <th className="fw-bold text-uppercase small text-muted py-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTickets.map(ticket => (
                                        <tr key={ticket.id}>
                                            <td className="px-4 py-3">
                                                <span className="font-monospace fw-bold small">#{ticket.id.slice(0, 8).toUpperCase()}</span>
                                            </td>
                                            <td className="py-3">
                                                <div className="fw-semibold">{ticket.customerName || 'N/A'}</div>
                                                <div className="text-muted small">{ticket.customerEmail}</div>
                                            </td>
                                            <td className="py-3">
                                                <div className="fw-semibold">{ticket.applianceType}</div>
                                                <div className="text-muted small">{ticket.brand}</div>
                                            </td>
                                            <td className="py-3">
                                                <div className="text-muted small">{ticket.city}</div>
                                            </td>
                                            <td className="py-3">
                                                <Form.Select
                                                    size="sm"
                                                    value={ticket.status}
                                                    onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                                                    className="w-auto"
                                                    style={{ minWidth: '130px' }}
                                                >
                                                    {statuses.filter(s => s !== 'All').map(status => (
                                                        <option key={status} value={status}>{status}</option>
                                                    ))}
                                                </Form.Select>
                                            </td>
                                            <td className="py-3">
                                                <span className="text-muted small">
                                                    {ticket.createdAt?.toDate ? ticket.createdAt.toDate().toLocaleDateString() : 'N/A'}
                                                </span>
                                            </td>
                                            <td className="py-3">
                                                <Button
                                                    variant="link"
                                                    size="sm"
                                                    className="text-danger fw-bold p-0 me-3"
                                                    onClick={() => {
                                                        setSelectedTicket(ticket);
                                                        setShowDetailModal(true);
                                                    }}
                                                >
                                                    View
                                                </Button>
                                                <Button
                                                    variant="link"
                                                    size="sm"
                                                    className="text-danger fw-bold p-0"
                                                    onClick={() => handleDeleteTicket(ticket.id)}
                                                >
                                                    Delete
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        ) : (
                            <div className="text-center py-5">
                                <i className="bi bi-inbox text-muted opacity-25" style={{ fontSize: '4rem' }}></i>
                                <p className="text-muted mt-3">No tickets found</p>
                            </div>
                        )}
                    </Card.Body>
                </Card>
            </div>

            {/* Detail Modal */}
            <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg" centered>
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold">Ticket Details</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-0">
                    {selectedTicket && (
                        <Tabs defaultActiveKey="details" className="bg-light border-bottom px-3 pt-2">
                            <Tab eventKey="details" title="Details" className="p-4">
                                <Row className="g-4">
                                    <Col md={6}>
                                        <div className="mb-3">
                                            <small className="text-muted text-uppercase fw-bold">Ticket ID</small>
                                            <div className="fw-bold">#{selectedTicket.id.slice(0, 12).toUpperCase()}</div>
                                        </div>
                                        <div className="mb-3">
                                            <small className="text-muted text-uppercase fw-bold">Customer</small>
                                            <div className="fw-bold">{selectedTicket.customerName}</div>
                                            <div className="text-muted small">{selectedTicket.customerEmail}</div>
                                        </div>
                                        <div className="mb-3">
                                            <small className="text-muted text-uppercase fw-bold">Appliance</small>
                                            <div className="fw-bold">{selectedTicket.applianceType}</div>
                                            <div className="text-muted small">{selectedTicket.brand} {selectedTicket.model}</div>
                                        </div>
                                    </Col>
                                    <Col md={6}>
                                        <div className="mb-3">
                                            <small className="text-muted text-uppercase fw-bold">Status</small>
                                            <div><Badge bg={getStatusBadge(selectedTicket.status)} className="px-3 py-2">{selectedTicket.status}</Badge></div>
                                        </div>
                                        <div className="mb-3">
                                            <small className="text-muted text-uppercase fw-bold">Location</small>
                                            <div className="fw-bold">{selectedTicket.city}</div>
                                            <div className="text-muted small">{selectedTicket.address}</div>
                                        </div>
                                        <div className="mb-3">
                                            <small className="text-muted text-uppercase fw-bold">Scheduled Date</small>
                                            <div className="fw-bold">
                                                {selectedTicket.scheduledDate ? new Date(selectedTicket.scheduledDate).toLocaleDateString() : 'Not scheduled'}
                                            </div>
                                        </div>
                                    </Col>
                                </Row>
                                <hr />
                                <div className="mb-3">
                                    <small className="text-muted text-uppercase fw-bold">Problem Description</small>
                                    <p className="mb-0 mt-2 p-3 bg-light rounded">{selectedTicket.description || 'No description provided'}</p>
                                </div>

                                <hr />

                                <div className="assignment-section">
                                    <h6 className="fw-bold mb-3">Assign Expert</h6>
                                    <Row className="align-items-end g-3">
                                        <Col md={8}>
                                            <Form.Group>
                                                <Form.Label className="small text-muted">Select Verified Expert</Form.Label>
                                                <Form.Select
                                                    defaultValue={selectedTicket.assignedTechId || ""}
                                                    id="expertSelect"
                                                    className="rounded-pill"
                                                >
                                                    <option value="" disabled>Choose an expert...</option>
                                                    {experts.map(exp => (
                                                        <option key={exp.id} value={exp.id}>
                                                            {exp.name} ({exp.isVerified ? 'Verified' : 'Pending'})
                                                        </option>
                                                    ))}
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Button
                                                variant="danger"
                                                className="w-100 rounded-pill fw-bold"
                                                onClick={() => handleAssignExpert(selectedTicket.id, document.getElementById('expertSelect').value)}
                                            >
                                                Assign
                                            </Button>
                                        </Col>
                                    </Row>
                                    {selectedTicket.assignedTechName && (
                                        <div className="mt-3 p-2 bg-success bg-opacity-10 text-success rounded border border-success border-opacity-25 small text-center">
                                            <i className="bi bi-person-check-fill me-2"></i>
                                            Currently Assigned: <strong>{selectedTicket.assignedTechName}</strong>
                                        </div>
                                    )}
                                </div>
                            </Tab>
                            <Tab eventKey="chat" title="Communication" className="p-4">
                                <div style={{ height: '400px' }}>
                                    <TicketChat
                                        ticketId={selectedTicket.id}
                                        currentUser={currentUser}
                                        role="admin"
                                        assignedTechId={selectedTicket.assignedTechId}
                                        assignedTechName={selectedTicket.assignedTechName}
                                    />
                                </div>
                            </Tab>
                        </Tabs>
                    )}
                </Modal.Body>
            </Modal>
        </AdminLayout>
    );
}
