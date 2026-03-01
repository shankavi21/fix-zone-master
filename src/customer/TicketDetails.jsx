import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebase';
import { doc, onSnapshot, updateDoc, serverTimestamp, setDoc, getDoc, collection, addDoc } from 'firebase/firestore';
import Layout from '../components/Layout';
import { Card, Row, Col, Image, Alert, Button, Badge, Modal, Form, Spinner } from 'react-bootstrap';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../contexts/AuthContext';
import TicketChat from '../components/TicketChat';

export default function TicketDetails() {
    const { id } = useParams();
    const { currentUser } = useAuth();
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Rating Modal
    const [showRateModal, setShowRateModal] = useState(false);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    // Cancellation States
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [cancellationPolicy, setCancellationPolicy] = useState({ allowed: true, charge: 0, reason: '' });

    useEffect(() => {
        const docRef = doc(db, 'tickets', id);
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.id ? { id: docSnap.id, ...docSnap.data() } : null;
                setTicket(data);

                // Show rating modal if status just became 'Finished' and not yet rated
                if (data?.status === 'Finished' && !data?.rating) {
                    setShowRateModal(true);
                }
            }
            setLoading(false);
        });
        return unsubscribe;
    }, [id]);

    const handleApproveQuote = async () => {
        setActionLoading(true);
        try {
            await updateDoc(doc(db, 'tickets', id), {
                status: 'In Progress',
                quoteStatus: 'Approved',
                updatedAt: serverTimestamp()
            });

            await addDoc(collection(db, 'notifications'), {
                userId: currentUser.uid,
                type: 'success',
                icon: 'bi-play-circle-fill',
                title: 'Repair Started',
                message: `The technician has started working on your ${ticket.applianceType}.`,
                link: `/customer/tickets/${id}`,
                read: false,
                createdAt: serverTimestamp()
            });

            // Add System Message to Chat
            await addDoc(collection(db, 'tickets', id, 'messages'), {
                text: "Repair started. The technician is now working on the appliance.",
                type: 'system',
                createdAt: serverTimestamp()
            });
        } catch (err) {
            console.error(err);
        }
        setActionLoading(false);
    };

    const handleConfirmCompletion = async () => {
        setActionLoading(true);
        try {
            await updateDoc(doc(db, 'tickets', id), {
                status: 'Finished',
                customerConfirmedAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            setShowRateModal(true);
        } catch (err) {
            console.error(err);
        }
        setActionLoading(false);
    };

    const handleSubmitRating = async () => {
        if (!rating) return;
        setActionLoading(true);
        try {
            // Update ticket with rating
            await updateDoc(doc(db, 'tickets', id), {
                rating: rating,
                reviewComment: comment,
                ratedAt: serverTimestamp()
            });

            // Post-process: Update technician average (complex, usually a cloud function)
            // For now, let's assume we update a 'technicians' collection if we had one in DB
            setShowRateModal(false);
        } catch (err) {
            console.error(err);
        }
        setActionLoading(false);
    };

    const getCancellationTerms = () => {
        if (!ticket || !ticket.preferredDate) return { allowed: true, charge: 0, type: 'FREE', message: 'No appointment set.' };

        // Parse appointment time
        const [year, month, day] = ticket.preferredDate.split('-').map(Number);
        const apptDate = new Date(year, month - 1, day);

        let hour = 9;
        if (ticket.preferredTimeSlot?.includes('Afternoon')) hour = 14;
        if (ticket.preferredTimeSlot?.includes('Evening')) hour = 18;
        apptDate.setHours(hour, 0, 0, 0);

        const now = new Date();
        const diffMs = apptDate - now;
        const diffHours = diffMs / (1000 * 60 * 60);

        if (diffHours > 24) {
            return { allowed: true, charge: 0, type: 'FREE', message: 'Cancellations more than 24h in advance are free.' };
        } else if (diffHours >= 4) {
            return { allowed: true, charge: 0, type: 'WINDOW', message: 'Free cancellation is allowed up to 4 hours before.' };
        } else if (diffHours >= 2) {
            return { allowed: true, charge: 500, type: 'RESTRICTED', message: 'Late cancellation (within 2-4h). A visiting charge of LKR 500.00 will apply.' };
        } else {
            return { allowed: false, charge: 500, type: 'BLOCKED', message: 'Cancellations within 2 hours are not allowed online. Please contact support.' };
        }
    };

    const handleCancelInitiate = () => {
        const terms = getCancellationTerms();
        setCancellationPolicy(terms);
        setShowCancelModal(true);
    };

    const handleCancelConfirm = async () => {
        if (!cancelReason && cancellationPolicy.allowed) {
            alert("Please provide a reason for cancellation.");
            return;
        }

        setActionLoading(true);
        try {
            await updateDoc(doc(db, 'tickets', id), {
                status: 'Cancelled',
                cancelReason: cancelReason,
                cancellationCharge: cancellationPolicy.charge,
                cancelledAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            await addDoc(collection(db, 'notifications'), {
                userId: currentUser.uid,
                type: 'danger',
                icon: 'bi-x-circle-fill',
                title: 'Request Cancelled',
                message: `Your repair request #${id.slice(0, 5).toUpperCase()} has been cancelled.`,
                link: `/customer/tickets/${id}`,
                read: false,
                createdAt: serverTimestamp()
            });
            setShowCancelModal(false);
        } catch (err) {
            console.error(err);
        }
        setActionLoading(false);
    };

    if (loading) return <Layout><div className="p-4">Loading...</div></Layout>;
    if (!ticket) return <Layout><div className="p-4">Ticket not found.</div></Layout>;

    return (
        <Layout>
            <div className="mb-4 d-flex align-items-center gap-3">
                <h2 className="fw-bold mb-0">Repair #{ticket.id.slice(0, 8).toUpperCase()}</h2>
                <StatusBadge status={ticket.status} />
            </div>

            {/* Completion Modals */}
            <Modal show={showRateModal} onHide={() => !actionLoading && setShowRateModal(false)} centered className="rate-modal-premium">
                <Modal.Body className="p-5 text-center">
                    <div className="mb-4">
                        <div className="bg-success bg-opacity-10 text-success rounded-circle d-inline-flex p-4 mb-3">
                            <i className="bi bi-patch-check-fill fs-1"></i>
                        </div>
                        <h3 className="fw-extrabold text-dark">How was your service?</h3>
                        <p className="text-secondary">Your feedback helps us maintain the highest quality of service.</p>
                    </div>

                    <div className="star-rating mb-4 d-flex justify-content-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <i
                                key={star}
                                className={`bi bi-star${star <= rating ? '-fill' : ''} fs-2 cursor-pointer transition-all ${star <= rating ? 'text-warning' : 'text-light'}`}
                                onClick={() => setRating(star)}
                                style={{ cursor: 'pointer' }}
                            ></i>
                        ))}
                    </div>

                    <Form.Group className="mb-4 text-start">
                        <Form.Label className="fw-bold small text-muted text-uppercase ls-1">Your Comments</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            placeholder="Share your experience..."
                            className="rounded-4 border-light-subtle bg-light bg-opacity-50"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                        />
                    </Form.Group>

                    <Button
                        variant="danger"
                        className="w-100 rounded-pill py-3 fw-bold shadow-lg"
                        onClick={handleSubmitRating}
                        disabled={actionLoading}
                    >
                        {actionLoading ? <Spinner size="sm" /> : 'SUBMIT REVIEWS'}
                    </Button>
                </Modal.Body>
            </Modal>

            {/* Cancellation Modal */}
            <Modal show={showCancelModal} onHide={() => !actionLoading && setShowCancelModal(false)} centered className="cancel-modal-premium">
                <Modal.Body className="p-4">
                    <div className="text-center mb-4">
                        <div className="bg-danger bg-opacity-10 text-danger rounded-circle d-inline-flex p-3 mb-3">
                            <i className="bi bi-x-circle-fill fs-2"></i>
                        </div>
                        <h4 className="fw-bold text-dark">Cancel Repair Request?</h4>
                        <Alert variant={cancellationPolicy.type === 'RESTRICTED' ? 'warning' : (cancellationPolicy.allowed ? 'info' : 'danger')} className="small border-0 rounded-4 mt-3">
                            <i className="bi bi-info-circle me-2"></i>
                            {cancellationPolicy.message}
                        </Alert>
                    </div>

                    {cancellationPolicy.allowed ? (
                        <>
                            <Form.Group className="mb-4">
                                <Form.Label className="fw-bold small text-muted text-uppercase ls-1">Reason for cancellation</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    placeholder="e.g., Change of plans, found another solution..."
                                    className="rounded-4 border-light-subtle bg-light bg-opacity-50"
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                />
                            </Form.Group>

                            {cancellationPolicy.charge > 0 && (
                                <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded-4 mb-4 border border-warning border-opacity-25">
                                    <span className="fw-bold text-dark">Cancellation Fee</span>
                                    <span className="fw-extrabold text-danger">LKR {cancellationPolicy.charge}.00</span>
                                </div>
                            )}

                            <div className="d-flex gap-3">
                                <Button variant="light" className="w-100 rounded-pill py-2 fw-bold" onClick={() => setShowCancelModal(false)} disabled={actionLoading}>
                                    Keep Request
                                </Button>
                                <Button variant="danger" className="w-100 rounded-pill py-2 fw-bold shadow-sm" onClick={handleCancelConfirm} disabled={actionLoading}>
                                    {actionLoading ? <Spinner size="sm" /> : 'Confirm Cancel'}
                                </Button>
                            </div>
                        </>
                    ) : (
                        <div className="d-grid gap-2">
                            <Button variant="danger" className="w-100 rounded-pill py-3 fw-bold shadow-sm" onClick={() => window.open('https://wa.me/94771234567', '_blank')}>
                                <i className="bi bi-whatsapp me-2"></i> Contact Support
                            </Button>
                            <Button variant="light" className="w-100 rounded-pill py-2 fw-bold" onClick={() => setShowCancelModal(false)}>
                                Back
                            </Button>
                        </div>
                    )}
                </Modal.Body>
            </Modal>

            {ticket.status === 'Completed' && (
                <Alert variant="warning" className="mb-4 border-warning shadow-sm">
                    <div className="d-flex align-items-center">
                        <i className="bi bi-exclamation-triangle-fill fs-4 me-3"></i>
                        <div>
                            <h6 className="fw-bold mb-1">Confirmation Required</h6>
                            <p className="mb-0 small">Please confirm if the work was completed to your satisfaction. If no action is taken within 48 hours, this repair will be automatically marked as finished.</p>
                        </div>
                    </div>
                </Alert>
            )}

            {ticket.status === 'Cancelled' && (
                <Alert variant="secondary" className="mb-4 border-secondary shadow-sm bg-light">
                    <div className="d-flex align-items-center">
                        <i className="bi bi-x-circle-fill fs-4 me-3 text-secondary"></i>
                        <div>
                            <h6 className="fw-bold mb-1">Service Cancelled</h6>
                            <p className="mb-1 small">Reason: <strong>{ticket.cancelReason || 'No reason provided'}</strong></p>
                            {ticket.cancellationCharge > 0 && <p className="mb-0 tiny text-danger fw-bold">Note: A cancellation fee of LKR {ticket.cancellationCharge}.00 was applied based on the policy.</p>}
                        </div>
                    </div>
                </Alert>
            )}

            {ticket.applianceType === 'IPTV' && (
                <Alert variant="info" className="mb-4 border-info shadow-sm">
                    <div className="d-flex align-items-center">
                        <i className="bi bi-info-circle-fill fs-4 me-3"></i>
                        <div>
                            <h6 className="fw-bold mb-1">IPTV Service Referral</h6>
                            <p className="mb-0 small">For IPTV issues, we refer customers to the nearest available technician or our specialized company technicians. We are currently processing your request.</p>
                        </div>
                    </div>
                </Alert>
            )}

            <Row>
                <Col md={8}>
                    <Card className="mb-4 shadow-sm border-0">
                        <Card.Body>
                            <h5 className="fw-bold text-primary-red mb-3">Issue Details</h5>

                            <Row className="mb-3">
                                <Col sm={6}><strong>Appliance:</strong> {ticket.applianceType}</Col>
                                <Col sm={6}><strong>Brand/Model:</strong> {ticket.brand} / {ticket.model || 'N/A'}</Col>
                            </Row>
                            <div className="bg-light p-3 rounded mb-4">
                                <strong>Description:</strong>
                                <p className="mb-0 mt-2">{ticket.description}</p>
                            </div>

                            <h6 className="fw-bold mb-3">Photos</h6>
                            {ticket.photoURLs && ticket.photoURLs.length > 0 ? (
                                <Row xs={2} md={4} className="g-2">
                                    {ticket.photoURLs.map((url, idx) => (
                                        <Col key={idx}>
                                            <a href={url} target="_blank" rel="noreferrer">
                                                <Image src={url} thumbnail style={{ height: '100px', width: '100%', objectFit: 'cover' }} />
                                            </a>
                                        </Col>
                                    ))}
                                </Row>
                            ) : (
                                <p className="text-muted small">No photos uploaded.</p>
                            )}
                        </Card.Body>
                    </Card>

                    <Card className="shadow-sm border-0">
                        <Card.Body>
                            <h5 className="fw-bold mb-3">Updates & Chat</h5>
                            <div className="bg-light p-3 rounded border border-dash">
                                <TicketChat
                                    ticketId={id}
                                    currentUser={currentUser}
                                    role="customer"
                                    assignedTechId={ticket.assignedTechId}
                                    assignedTechName={ticket.assignedTechName || ticket.technicianName || ticket.techName}
                                />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="shadow-sm border-0 border-top border-danger border-4 mb-3">
                        <Card.Body>
                            <h6 className="fw-bold text-dark mb-3">Service Charges</h6>
                            <div className="pricing-summary bg-light p-3 rounded-4 mb-3">
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-muted small">Visiting Charge</span>
                                    <span className="fw-bold">LKR {ticket.visitCharge || 500}.00</span>
                                </div>
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-muted small">
                                        {ticket.status === 'Quoted' || ticket.status === 'In Progress' || ticket.status === 'Completed' || ticket.status === 'Finished'
                                            ? 'Final Service Fee' : (ticket.status === 'Cancelled' ? 'Cancellation Fee' : 'Estimated Fee')}
                                    </span>
                                    <span className={`fw-bold ${ticket.status === 'Pending' ? 'text-secondary' : (ticket.status === 'Cancelled' ? 'text-danger' : 'text-dark')}`}>
                                        {ticket.status === 'Cancelled'
                                            ? `LKR ${ticket.cancellationCharge || 0}.00`
                                            : `LKR ${ticket.finalQuoteAmount || ticket.serviceFee || '0'}.00`}
                                    </span>
                                </div>
                                <hr className="my-2 opacity-10" />
                                <div className="d-flex justify-content-between">
                                    <span className="fw-bold">Total {ticket.status === 'Cancelled' ? 'Charge' : 'Estimate'}</span>
                                    <span className="fw-extrabold text-primary-red">
                                        LKR {ticket.status === 'Cancelled'
                                            ? (ticket.cancellationCharge || 0)
                                            : (ticket.visitCharge || 500) + (ticket.finalQuoteAmount || ticket.serviceFee || 0)}.00
                                    </span>
                                </div>
                            </div>

                            <h6 className="fw-bold text-dark mb-3">Service Provider</h6>
                            <div className="d-flex align-items-center gap-3 mb-3">
                                <div className="bg-danger bg-opacity-10 text-danger rounded p-2 text-center" style={{ minWidth: '45px' }}>
                                    <i className="bi bi-person-badge fs-4"></i>
                                </div>
                                <div className="flex-grow-1">
                                    <div className="fw-bold text-dark">{ticket.assignedTechName || 'Assigning Expert...'}</div>
                                    <div className="small text-muted">{ticket.status === 'Pending' ? 'Finding best match' : 'Authorized Tech'}</div>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>

                    <Card className="shadow-sm border-0 mb-3 bg-white">
                        <Card.Body>
                            <h6 className="fw-bold text-dark mb-3">Status Actions</h6>
                            <div className="d-grid gap-2">
                                {ticket.status === 'Quoted' && (
                                    <div className="p-3 bg-warning bg-opacity-10 border border-warning rounded-4 mb-2">
                                        <p className="small mb-2 fw-bold text-dark"><i className="bi bi-info-circle me-1"></i> Technician has provided a final quote. Please approve to start work.</p>
                                        <Button variant="danger" className="w-100 rounded-pill fw-bold" onClick={handleApproveQuote} disabled={actionLoading}>
                                            {actionLoading ? <Spinner size="sm" /> : 'Approve & Start Repair'}
                                        </Button>
                                    </div>
                                )}

                                {ticket.status === 'Completed' && (
                                    <div className="p-3 bg-success bg-opacity-10 border border-success rounded-4 mb-2">
                                        <p className="small mb-2 fw-bold text-dark"><i className="bi bi-check-circle me-1"></i> Technician marked work as done. Confirm satisfaction?</p>
                                        <Button variant="success" className="w-100 rounded-pill fw-bold" onClick={handleConfirmCompletion} disabled={actionLoading}>
                                            {actionLoading ? <Spinner size="sm" /> : 'Yes, Confirm Finished'}
                                        </Button>
                                    </div>
                                )}

                                {ticket.status === 'Finished' && ticket.rating && (
                                    <div className="p-3 bg-light rounded-4 text-center">
                                        <div className="text-warning mb-1">
                                            {[...Array(5)].map((_, i) => (
                                                <i key={i} className={`bi bi-star${i < ticket.rating ? '-fill' : ''} me-1`}></i>
                                            ))}
                                        </div>
                                        <p className="text-muted small mb-0 italic">"{ticket.reviewComment}"</p>
                                    </div>
                                )}

                                {ticket.status === 'Pending' && (
                                    <>
                                        <Button variant="outline-primary" className="fw-bold rounded-pill" onClick={handleCancelInitiate}>
                                            <i className="bi bi-calendar2-plus me-2"></i> Reschedule
                                        </Button>
                                        <Button variant="outline-danger" className="fw-bold rounded-pill" onClick={handleCancelInitiate}>
                                            <i className="bi bi-x-circle me-2"></i> Cancel Ticket
                                        </Button>
                                    </>
                                )}
                            </div>
                        </Card.Body>
                    </Card>

                    <Card className="shadow-sm border-0 mb-3 text-white" style={{ backgroundColor: '#25D366' }}>
                        <Card.Body>
                            <h6 className="fw-bold mb-2">Need help fast?</h6>
                            <p className="small mb-3">Chat with our support team on WhatsApp for any urgent queries.</p>
                            <a href="https://wa.me/94771234567" target="_blank" rel="noreferrer" className="btn btn-light w-100 rounded-pill fw-bold text-success">
                                <i className="bi bi-whatsapp me-2"></i> WhatsApp Support
                            </a>
                        </Card.Body>
                    </Card>

                    <Card className="shadow-sm border-0 mb-3">
                        <Card.Body>
                            <h6 className="fw-bold text-secondary">Service Address</h6>
                            <p className="mb-0 fw-medium text-dark">{ticket.address}, {ticket.city}</p>
                        </Card.Body>
                    </Card>

                    <Card className="shadow-sm border-0">
                        <Card.Body>
                            <h6 className="fw-bold text-secondary">Timeline</h6>
                            <div className="small">
                                <div className="mb-2">
                                    <strong>Created:</strong><br />
                                    <span className="text-dark">{ticket.createdAt?.toDate ? ticket.createdAt.toDate().toLocaleString() : new Date(ticket.createdAt?.seconds * 1000).toLocaleString()}</span>
                                </div>
                                <div>
                                    <strong>Last Update:</strong><br />
                                    <span className="text-dark">{ticket.updatedAt?.toDate ? ticket.updatedAt.toDate().toLocaleString() : new Date(ticket.updatedAt?.seconds * 1000).toLocaleString()}</span>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

        </Layout>
    );
}
