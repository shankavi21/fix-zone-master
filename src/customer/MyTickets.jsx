import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Spinner, Nav } from 'react-bootstrap';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, limit } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import 'bootstrap-icons/font/bootstrap-icons.css';

export default function MyTickets() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const q = queryParams.get('q');
        if (q !== null) setSearchQuery(q);
    }, [location.search]);

    const tabs = ['All', 'Active', 'Completed', 'Cancelled'];

    useEffect(() => {
        if (!currentUser) return;

        // Only show spinner if we don't have any tickets yet
        if (tickets.length === 0) setLoading(true);
        setError(null);

        const q = query(
            collection(db, 'tickets'),
            where('customerId', '==', currentUser.uid),
            // orderBy('createdAt', 'desc'), // Temporarily disabled to bypass index error
            limit(20)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const ticketData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTickets(ticketData);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching tickets:", err);
            setError("Failed to load tickets. " + err.message);
            setLoading(false);
        });

        return unsubscribe;
    }, [currentUser?.uid]); // Use uid for more stable dependency

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending': return 'warning';
            case 'assigned':
            case 'scheduled':
            case 'on the way':
            case 'in progress': return 'info';
            case 'completed': return 'success';
            case 'cancelled': return 'secondary';
            default: return 'primary';
        }
    };

    const getFilteredTickets = () => {
        let filtered = tickets;

        // Status filter
        if (filter === 'Active') {
            filtered = tickets.filter(t => !['Completed', 'Cancelled'].includes(t.status));
        } else if (filter !== 'All') {
            filtered = tickets.filter(t => t.status === filter);
        }

        // Search query filter
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(t =>
                t.applianceType?.toLowerCase().includes(q) ||
                t.description?.toLowerCase().includes(q) ||
                t.id?.toLowerCase().includes(q)
            );
        }

        return filtered;
    };

    if (loading) {
        return (
            <Layout>
                <div className="d-flex flex-column align-items-center justify-content-center py-5 mt-5">
                    <Spinner animation="border" variant="danger" />
                    <p className="mt-3 text-muted fw-medium">Loading your repairs...</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="my-tickets-screen animate-fade-in px-2 px-lg-0 pb-5">
                <div className="d-flex flex-column mb-4 mt-2">
                    <div className="d-flex justify-content-between align-items-center">
                        <h2 className="fw-black m-0">My Repairs</h2>
                        <Button variant="danger" className="rounded-pill px-4 shadow-sm fw-bold" onClick={() => navigate('/customer/create-ticket')}>
                            <i className="bi bi-plus-lg me-2"></i>New Repair
                        </Button>
                    </div>
                    {error && (
                        <div className="alert alert-danger mt-3 shadow-sm rounded-4 border-0">
                            <i className="bi bi-exclamation-triangle-fill me-2"></i>
                            {error.includes("index") ? (
                                <span>
                                    Index required for this query. Check console for link.
                                </span>
                            ) : error}
                        </div>
                    )}
                </div>

                {/* Filter Tabs */}
                <Nav className="mb-4 gap-2 flex-wrap pb-2 border-bottom">
                    {tabs.map(tab => (
                        <Nav.Item key={tab}>
                            <div
                                onClick={() => setFilter(tab)}
                                className={`px-4 py-2 rounded-2 fw-bold clickable transition-all ${filter === tab ? 'bg-danger text-white' : 'bg-light text-secondary border'}`}
                                style={{ fontSize: '0.85rem', cursor: 'pointer' }}
                            >
                                {tab}
                            </div>
                        </Nav.Item>
                    ))}
                </Nav>

                {getFilteredTickets().length === 0 ? (
                    <div className="text-center py-5 glass rounded-5 border-dashed mt-4">
                        <div className="bg-light rounded-circle d-flex align-items-center justify-content-center mx-auto mb-4" style={{ width: '80px', height: '80px' }}>
                            <i className="bi bi-ticket-perforated fs-1 text-muted opacity-50"></i>
                        </div>
                        <h4 className="fw-bold text-dark">No repairs found</h4>
                        <p className="text-muted mb-4 px-4">You don't have any {filter.toLowerCase()} repairs at the moment.</p>
                        <Button variant="danger" className="rounded-pill px-5 py-2 fw-bold" onClick={() => navigate('/customer/create-ticket')}>
                            Book Your First Repair
                        </Button>
                    </div>
                ) : (
                    <Row className="g-4">
                        {getFilteredTickets().map(ticket => (
                            <Col xs={12} lg={6} key={ticket.id}>
                                <Card className="border-0 shadow-premium hover-up overflow-hidden h-100">
                                    <div className={`p-1 bg-${getStatusColor(ticket.status)} bg-opacity-25`}></div>
                                    <Card.Body className="p-4">
                                        <div className="d-flex justify-content-between align-items-start mb-3">
                                            <div className="d-flex align-items-center gap-3">
                                                <div className={`bg-${getStatusColor(ticket.status)} bg-opacity-10 rounded-4 p-2 d-flex align-items-center justify-content-center`} style={{ width: '56px', height: '56px' }}>
                                                    <i className="bi bi-tools fs-3 text-dark"></i>
                                                </div>
                                                <div>
                                                    <h5 className="fw-bold mb-1 text-dark">{ticket.applianceType} Repair</h5>
                                                    <div className="text-muted small d-flex align-items-center gap-1">
                                                        <i className="bi bi-hash"></i>
                                                        {ticket.id.slice(0, 8).toUpperCase()}
                                                    </div>
                                                </div>
                                            </div>
                                            <Badge bg={getStatusColor(ticket.status)} className="bg-opacity-10 text-dark rounded-pill px-3 py-2 fw-bold" style={{ fontSize: '0.75rem' }}>
                                                {ticket.status}
                                            </Badge>
                                        </div>

                                        <hr className="my-3 opacity-10" />

                                        <Row className="mb-4 g-2">
                                            <Col xs={6}>
                                                <div className="small text-muted mb-1">Scheduled Date</div>
                                                <div className="fw-bold text-dark">
                                                    <i className="bi bi-calendar-check me-2 text-danger"></i>
                                                    {ticket.preferredDate || 'TBD'}
                                                </div>
                                            </Col>
                                            <Col xs={6}>
                                                <div className="small text-muted mb-1">Time Slot</div>
                                                <div className="fw-bold text-dark">
                                                    <i className="bi bi-clock me-2 text-danger"></i>
                                                    {ticket.preferredTimeSlot || 'Anytime'}
                                                </div>
                                            </Col>
                                        </Row>

                                        <div className="d-flex gap-2 flex-wrap">
                                            <Button
                                                variant="outline-dark"
                                                className="flex-grow-1 py-2 rounded-pill fw-bold border-light bg-light bg-opacity-50"
                                                onClick={() => navigate(`/customer/tickets/${ticket.id}`)}
                                            >
                                                Details
                                            </Button>
                                            {ticket.status !== 'Cancelled' && ticket.status !== 'Completed' && (
                                                <Button
                                                    variant="danger"
                                                    className="flex-grow-1 py-2 rounded-pill fw-bold shadow-sm"
                                                    onClick={() => navigate('/customer/tracking')}
                                                >
                                                    Track Service
                                                </Button>
                                            )}
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                )}
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .fw-black { font-weight: 850 !important; }
                .hover-up:hover { transform: translateY(-8px); transition: all 0.3s ease; }
                .border-dashed { border: 2px dashed #E2E8F0 !important; }
                .bg-info.bg-opacity-10 { background-color: rgba(59, 130, 246, 0.1) !important; color: #1e40af !important; }
                .bg-warning.bg-opacity-10 { background-color: rgba(245, 158, 11, 0.1) !important; color: #92400e !important; }
                .bg-success.bg-opacity-10 { background-color: rgba(16, 185, 129, 0.1) !important; color: #065f46 !important; }
            ` }} />
        </Layout>
    );
}
