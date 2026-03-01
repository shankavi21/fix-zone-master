import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Button, Spinner, Badge } from 'react-bootstrap';
import { db } from '../firebase';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';

export default function Tracking() {
    const { currentUser } = useAuth();
    const [activeTicket, setActiveTicket] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) return;

        // Fetch the most recent active ticket (Scheduled, On the Way, or In Progress)
        const q = query(
            collection(db, 'tickets'),
            where('customerId', '==', currentUser.uid),
            where('status', 'in', ['Assigned', 'Scheduled', 'On the Way', 'In Progress']),
            // orderBy('createdAt', 'desc'), // Temporarily disabled for index issue
            limit(1)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                setActiveTicket({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
            } else {
                setActiveTicket(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    if (loading) {
        return (
            <Layout>
                <div className="d-flex align-items-center justify-content-center py-5">
                    <Spinner animation="border" variant="danger" />
                </div>
            </Layout>
        );
    }

    if (!activeTicket) {
        return (
            <Layout>
                <div className="text-center py-5">
                    <div className="bg-light rounded-circle d-flex align-items-center justify-content-center mx-auto mb-4" style={{ width: '120px', height: '120px' }}>
                        <i className="bi bi-geo-alt text-secondary opacity-25" style={{ fontSize: '4rem' }}></i>
                    </div>
                    <h4 className="fw-bold mb-2">No Active Repairs</h4>
                    <p className="text-secondary mb-4">You don't have any repairs currently in progress or on the way.</p>
                    <Button href="/customer/create-ticket" variant="danger" className="rounded-pill px-4 fw-bold">
                        Book a Repair
                    </Button>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="tracking-screen animate-fade-in pb-5">
                <div className="mb-4 pt-2">
                    <h2 className="fw-bold mb-1">Live Tracking</h2>
                    <p className="text-secondary small">Follow your expert in real-time.</p>
                </div>

                {/* Map Placeholder */}
                <Card className="border-0 shadow-sm rounded-4 overflow-hidden mb-4 position-relative" style={{ height: '350px', backgroundColor: '#e5e7eb' }}>
                    <div className="w-100 h-100 d-flex align-items-center justify-content-center flex-column bg-light">
                        <i className="bi bi-map text-secondary opacity-25 mb-2" style={{ fontSize: '3rem' }}></i>
                        <span className="text-secondary small fw-bold">Live Map Tracking</span>
                        <div className="position-absolute" style={{ top: '40%', left: '45%' }}>
                            <div className="expert-marker pulse-danger">
                                <i className="bi bi-truck text-white"></i>
                            </div>
                        </div>
                        <div className="position-absolute" style={{ top: '60%', left: '70%' }}>
                            <div className="home-marker shadow-sm">
                                <i className="bi bi-house-door-fill text-danger"></i>
                            </div>
                        </div>
                    </div>
                    <div className="position-absolute bottom-0 start-0 m-3 px-3 py-2 bg-white rounded-pill shadow-sm border d-flex align-items-center gap-2">
                        <Badge bg="success" pill style={{ width: '8px', height: '8px', padding: 0 }}></Badge>
                        <span className="small fw-bold text-dark">Expert is On the Way</span>
                    </div>
                </Card>

                {/* Expert Details Card */}
                <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
                    <Card.Body className="p-4">
                        <div className="d-flex align-items-center justify-content-between mb-4">
                            <div className="d-flex align-items-center gap-3">
                                <div className="expert-avatar rounded-circle overflow-hidden shadow-sm" style={{ width: '60px', height: '60px' }}>
                                    <img
                                        src="https://images.unsplash.com/photo-1540560714872-46c7d3ba4f03?q=80&w=200&h=200&auto=format&fit=crop"
                                        alt="Expert"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                </div>
                                <div>
                                    <h5 className="fw-bold mb-0">Arun Perera</h5>
                                    <div className="d-flex align-items-center gap-1 text-warning small">
                                        <i className="bi bi-star-fill"></i>
                                        <span className="fw-bold text-dark ms-1">4.9</span>
                                        <span className="text-muted">(120+ jobs)</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-end">
                                <h4 className="fw-bold text-danger mb-0">20 min</h4>
                                <small className="text-secondary fw-bold">EST. ARRIVAL</small>
                            </div>
                        </div>

                        <div className="bg-light rounded-4 p-3 mb-4 d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center gap-3">
                                <div className="bg-white p-2 rounded-circle shadow-xs">
                                    <i className="bi bi-tools text-danger"></i>
                                </div>
                                <div>
                                    <small className="text-muted d-block">Repairing</small>
                                    <span className="fw-bold small">{activeTicket.appliance}</span>
                                </div>
                            </div>
                            <div className="text-end border-start ps-3">
                                <small className="text-muted d-block">Booking ID</small>
                                <span className="fw-bold small text-uppercase">#{activeTicket.id.slice(0, 8)}</span>
                            </div>
                        </div>

                        <Row className="g-3">
                            <Col xs={6}>
                                <Button href="tel:+94771234567" variant="outline-dark" className="w-100 rounded-pill py-2 fw-bold d-flex align-items-center justify-content-center gap-2 border-2">
                                    <i className="bi bi-telephone-fill"></i> Call Expert
                                </Button>
                            </Col>
                            <Col xs={6}>
                                <Button variant="success" className="w-100 rounded-pill py-2 fw-bold d-flex align-items-center justify-content-center gap-2 border-0 shadow-sm" style={{ backgroundColor: '#25D366' }}>
                                    <i className="bi bi-whatsapp"></i> WhatsApp
                                </Button>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .expert-marker {
                    width: 40px;
                    height: 40px;
                    background-color: var(--primary-red);
                    border-radius: 50% 50% 50% 0;
                    transform: rotate(-45deg);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 3px solid white;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.2);
                }
                .expert-marker i { transform: rotate(45deg); font-size: 1.2rem; }
                
                .home-marker {
                    width: 32px;
                    height: 32px;
                    background: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 2px solid var(--primary-red);
                }

                .pulse-danger {
                    animation: pulse-red 2s infinite;
                }

                @keyframes pulse-red {
                    0% { box-shadow: 0 0 0 0 rgba(var(--primary-red-rgb), 0.7); }
                    70% { box-shadow: 0 0 0 15px rgba(var(--primary-red-rgb), 0); }
                    100% { box-shadow: 0 0 0 0 rgba(var(--primary-red-rgb), 0); }
                }
                .shadow-xs { box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
            ` }} />
        </Layout>
    );
}
