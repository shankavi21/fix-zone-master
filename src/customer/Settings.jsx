import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, ListGroup, Modal, Spinner } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, deleteDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword, deleteUser } from 'firebase/auth';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Settings() {
    const { currentUser } = useAuth();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState(location.state?.tab || 'notifications');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Notifications State
    const [notifications, setNotifications] = useState({
        bookingUpdates: true,
        arrivalAlerts: true,
        promotions: true,
        billing: true
    });

    // Language State
    const [language, setLanguage] = useState("English");

    // Payment State
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [newCard, setNewCard] = useState({
        number: '',
        expiry: '',
        cvc: '',
        name: ''
    });

    // Password State
    const [passwordData, setPasswordData] = useState({
        current: '',
        new: '',
        confirm: ''
    });

    // Fetch User Settings on Load
    useEffect(() => {
        async function fetchSettings() {
            if (currentUser) {
                try {
                    const docRef = doc(db, 'users', currentUser.uid);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        const data = docSnap.data();

                        // Safe merge for notifications
                        if (data.settings?.notifications) {
                            setNotifications(prev => ({
                                ...prev,
                                ...data.settings.notifications
                            }));
                        }

                        // Safe set for language
                        if (data.settings?.language) {
                            setLanguage(data.settings.language);
                        } else {
                            setLanguage("English");
                        }

                        if (data.paymentMethods) {
                            setPaymentMethods(data.paymentMethods);
                        }
                    }
                } catch (error) {
                    console.error("Error fetching settings:", error);
                }
            }
        }
        fetchSettings();
    }, [currentUser]);

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    };

    // --- Handlers ---

    const handleSaveNotifications = async () => {
        setLoading(true);
        try {
            await updateDoc(doc(db, 'users', currentUser.uid), {
                'settings.notifications': notifications
            });
            showMessage('success', "Notification preferences saved!");
        } catch (error) {
            showMessage('danger', "Failed to save notifications.");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveLanguage = async () => {
        setLoading(true);
        try {
            await updateDoc(doc(db, 'users', currentUser.uid), {
                'settings.language': language
            });
            showMessage('success', "Language preference saved!");
        } catch (error) {
            showMessage('danger', "Failed to save language.");
        } finally {
            setLoading(false);
        }
    };

    const handleAddPayment = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Basic validation
            if (newCard.number.length < 16 || newCard.cvc.length < 3) throw new Error("Invalid card details");

            const maskedCard = {
                id: Date.now(),
                last4: newCard.number.slice(-4),
                expiry: newCard.expiry,
                brand: 'Visa', // Placeholder logic
                name: newCard.name
            };

            await updateDoc(doc(db, 'users', currentUser.uid), {
                paymentMethods: arrayUnion(maskedCard)
            });

            setPaymentMethods(prev => [...prev, maskedCard]);
            setShowPaymentModal(false);
            setNewCard({ number: '', expiry: '', cvc: '', name: '' });
            showMessage('success', "Payment method added successfully!");
        } catch (error) {
            showMessage('danger', error.message || "Failed to add card");
        } finally {
            setLoading(false);
        }
    };

    const handleRemovePayment = async (methodToRemove) => {
        if (!window.confirm("Are you sure you want to remove this card?")) return;

        setLoading(true);
        try {
            await updateDoc(doc(db, 'users', currentUser.uid), {
                paymentMethods: arrayRemove(methodToRemove)
            });

            setPaymentMethods(prev => prev.filter(m => m.id !== methodToRemove.id));
            showMessage('success', "Payment method removed.");
        } catch (error) {
            console.error(error);
            showMessage('danger', "Failed to remove card.");
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwordData.new !== passwordData.confirm) {
            showMessage('danger', "New passwords do not match");
            return;
        }
        if (passwordData.new.length < 6) {
            showMessage('danger', "Password must be at least 6 characters");
            return;
        }

        setLoading(true);
        try {
            const credential = EmailAuthProvider.credential(currentUser.email, passwordData.current);
            await reauthenticateWithCredential(currentUser, credential);
            await updatePassword(currentUser, passwordData.new);

            setPasswordData({ current: '', new: '', confirm: '' });
            showMessage('success', "Password updated successfully!");
        } catch (error) {
            console.error(error);
            showMessage('danger', "Failed to update password. Check your current password.");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!window.confirm("WARNING: This action cannot be undone. Are you sure you want to permanently delete your account?")) return;
        if (!window.confirm("Final check: All your data, tickets, and settings will be lost forever. Delete Account?")) return;

        setLoading(true);
        try {
            // 1. Delete Firestore Data
            await deleteDoc(doc(db, 'users', currentUser.uid));

            // 2. Delete Auth Account
            await deleteUser(currentUser);

            // AuthContext will handle the redirect automatically when user becomes null
        } catch (error) {
            console.error(error);
            if (error.code === 'auth/requires-recent-login') {
                showMessage('danger', "Security Check: Please log out and log back in to delete your account.");
            } else {
                showMessage('danger', "Failed to delete account. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };


    // --- Styles & Render ---

    const activeStyle = {
        background: 'linear-gradient(135deg, #dc3545, #b91c1c)',
        color: 'white',
        fontWeight: '600',
        border: 'none'
    };

    const inactiveStyle = {
        background: 'transparent',
        color: 'var(--bs-body-color)',
        border: 'none'
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'security':
                return (
                    <Card className="border-0 shadow-sm rounded-4 p-4 animate-fade-in">
                        <h5 className="fw-bold mb-4">Password & Security</h5>

                        <div className="mb-4">
                            <h6 className="fw-bold mb-3">Change Password</h6>
                            <Form onSubmit={handleChangePassword}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="small fw-bold">Current Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        value={passwordData.current}
                                        onChange={e => setPasswordData({ ...passwordData, current: e.target.value })}
                                        required
                                        className="rounded-3"
                                    />
                                </Form.Group>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="small fw-bold">New Password</Form.Label>
                                            <Form.Control
                                                type="password"
                                                value={passwordData.new}
                                                onChange={e => setPasswordData({ ...passwordData, new: e.target.value })}
                                                required
                                                className="rounded-3"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="small fw-bold">Confirm New Password</Form.Label>
                                            <Form.Control
                                                type="password"
                                                value={passwordData.confirm}
                                                onChange={e => setPasswordData({ ...passwordData, confirm: e.target.value })}
                                                required
                                                className="rounded-3"
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <Button type="submit" variant="danger" className="rounded-pill px-4 fw-bold mt-2" disabled={loading}>
                                    {loading ? <Spinner size="sm" animation="border" /> : 'Update Password'}
                                </Button>
                            </Form>
                        </div>
                    </Card>
                );
            case 'payment':
                return (
                    <Card className="border-0 shadow-sm rounded-4 p-4 animate-fade-in">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h5 className="fw-bold mb-0">Payment Methods</h5>
                            <Button variant="danger" size="sm" className="rounded-pill px-3 fw-bold" onClick={() => setShowPaymentModal(true)}>
                                <i className="bi bi-plus-lg me-1"></i> Add New
                            </Button>
                        </div>

                        {paymentMethods.length > 0 ? (
                            <div className="d-flex flex-column gap-3">
                                {paymentMethods.map((method, idx) => (
                                    <div key={idx} className="d-flex align-items-center justify-content-between p-3 border rounded-4 bg-white">
                                        <div className="d-flex align-items-center gap-3">
                                            <div className="bg-light p-2 rounded-3">
                                                <i className="bi bi-credit-card-2-front fs-4 text-dark"></i>
                                            </div>
                                            <div>
                                                <p className="mb-0 fw-bold">{method.brand} •••• {method.last4}</p>
                                                <small className="text-muted">Expires {method.expiry}</small>
                                            </div>
                                        </div>
                                        <Button variant="link" className="text-danger p-0" onClick={() => handleRemovePayment(method)}>Remove</Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-5 bg-light rounded-4 border border-dashed">
                                <div className="bg-white rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3 shadow-sm" style={{ width: '60px', height: '60px' }}>
                                    <i className="bi bi-credit-card text-muted fs-4"></i>
                                </div>
                                <h6 className="fw-bold text-dark">No Payment Methods</h6>
                                <p className="text-muted small mb-0">You haven't saved any cards yet.</p>
                            </div>
                        )}
                    </Card>
                );
            case 'language':
                return (
                    <Card className="border-0 shadow-sm rounded-4 p-4 animate-fade-in">
                        <h5 className="fw-bold mb-4">Language & Region</h5>
                        <Form>
                            <Form.Group className="mb-4">
                                <Form.Label className="fw-bold small text-uppercase text-muted">Display Language</Form.Label>
                                <Form.Select
                                    className="rounded-3 p-3 bg-light border-0 fw-medium"
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value)}
                                >
                                    <option value="English">English (US)</option>
                                    <option value="Sinhala">Sinhala (Sri Lanka)</option>
                                    <option value="Tamil">Tamil (Sri Lanka)</option>
                                </Form.Select>
                            </Form.Group>

                            <Button onClick={handleSaveLanguage} variant="danger" className="px-5 py-2 fw-bold text-white shadow-sm" disabled={loading}>
                                {loading ? <Spinner size="sm" animation="border" /> : 'Save Preferences'}
                            </Button>
                        </Form>
                    </Card>
                );
            default: // notifications
                return (
                    <Card className="border-0 shadow-sm rounded-4 p-4 mb-4 animate-fade-in">
                        <h5 className="fw-bold mb-4">Notification Preferences</h5>

                        <div className="d-flex justify-content-between align-items-center py-3 border-bottom">
                            <div>
                                <h6 className="fw-bold mb-1">Booking Updates</h6>
                                <p className="text-muted small mb-0">Receive real-time progress updates on your service requests.</p>
                            </div>
                            <Form.Check
                                type="switch"
                                checked={notifications.bookingUpdates}
                                onChange={() => setNotifications({ ...notifications, bookingUpdates: !notifications.bookingUpdates })}
                            />
                        </div>

                        <div className="d-flex justify-content-between align-items-center py-3 border-bottom">
                            <div>
                                <h6 className="fw-bold mb-1">Technician Arrival Alerts</h6>
                                <p className="text-muted small mb-0">Get notified when your expert is on the way or has arrived.</p>
                            </div>
                            <Form.Check
                                type="switch"
                                checked={notifications.arrivalAlerts}
                                onChange={() => setNotifications({ ...notifications, arrivalAlerts: !notifications.arrivalAlerts })}
                            />
                        </div>

                        <div className="d-flex justify-content-between align-items-center py-3 border-bottom">
                            <div>
                                <h6 className="fw-bold mb-1">Promotional Offers</h6>
                                <p className="text-muted small mb-0">Stay updated on exclusive deals and seasonal discounts.</p>
                            </div>
                            <Form.Check
                                type="switch"
                                checked={notifications.promotions}
                                onChange={() => setNotifications({ ...notifications, promotions: !notifications.promotions })}
                            />
                        </div>

                        <div className="d-flex justify-content-between align-items-center py-3 border-bottom">
                            <div>
                                <h6 className="fw-bold mb-1">Billing & Invoices</h6>
                                <p className="text-muted small mb-0">Digital receipts and payment confirmation alerts.</p>
                            </div>
                            <Form.Check
                                type="switch"
                                checked={notifications.billing}
                                onChange={() => setNotifications({ ...notifications, billing: !notifications.billing })}
                            />
                        </div>

                        <div className="mt-5">
                            <Button onClick={handleSaveNotifications} className="px-5 py-2 fw-bold" style={{ backgroundColor: '#dc3545', border: 'none' }} disabled={loading}>
                                {loading ? <Spinner size="sm" animation="border" /> : 'Save Preferences'}
                            </Button>
                        </div>
                    </Card>
                );
        }
    };

    return (
        <Layout>
            <div className="py-5 bg-light min-vh-100">
                <Container>
                    <div className="mb-5">
                        <h2 className="fw-bold mb-1">Account Settings</h2>
                        <p className="text-secondary">Manage your preferences and account security.</p>
                    </div>

                    {message.text && (
                        <Alert
                            variant={message.type}
                            className="rounded-4 border-0 shadow-sm mb-4"
                            dismissible
                            onClose={() => setMessage({ type: '', text: '' })}
                        >
                            {message.text}
                        </Alert>
                    )}

                    <Row className="g-4">
                        <Col lg={4}>
                            <Card className="border-0 shadow-sm rounded-4 overflow-hidden mb-4">
                                <ListGroup variant="flush">
                                    {['notifications', 'security', 'payment', 'language'].map(tab => (
                                        <ListGroup.Item
                                            key={tab}
                                            action
                                            onClick={() => setActiveTab(tab)}
                                            className="py-3 px-4 text-capitalize"
                                            style={activeTab === tab ? activeStyle : inactiveStyle}
                                        >
                                            <i className={`bi bi-${tab === 'notifications' ? 'bell' :
                                                tab === 'security' ? 'shield-lock' :
                                                    tab === 'payment' ? 'credit-card' : 'globe'
                                                } me-3`}></i>
                                            {tab === 'payment' ? 'Payment Methods' : tab}
                                        </ListGroup.Item>
                                    ))}
                                </ListGroup>
                            </Card>

                            <Card className="border border-danger border-opacity-25 shadow-sm rounded-4 bg-danger-subtle py-3 px-4">
                                <h6 className="fw-bold text-danger mb-2">Danger Zone</h6>
                                <p className="small text-danger mb-3 opacity-75">Once you delete your account, there is no going back. Please be certain.</p>
                                <Button variant="outline-danger" size="sm" className="rounded-pill fw-bold" onClick={handleDeleteAccount} disabled={loading}>
                                    {loading ? <Spinner size="sm" animation="border" /> : 'Delete Account'}
                                </Button>
                            </Card>
                        </Col>

                        <Col lg={8}>
                            {renderContent()}
                        </Col>
                    </Row>
                </Container>

                {/* Add Payment Modal */}
                <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)} centered className="rounded-4">
                    <Modal.Header border="0" closeButton>
                        <Modal.Title className="fw-bold">Add Payment Method</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form onSubmit={handleAddPayment}>
                            <Form.Group className="mb-3">
                                <Form.Label className="small fw-bold">Card Number</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="0000 0000 0000 0000"
                                    value={newCard.number}
                                    onChange={e => setNewCard({ ...newCard, number: e.target.value })}
                                    required
                                />
                            </Form.Group>
                            <Row>
                                <Col>
                                    <Form.Group className="mb-3">
                                        <Form.Label className="small fw-bold">Expiry Date</Form.Label>
                                        <Form.Control
                                            type="text"
                                            placeholder="MM/YY"
                                            value={newCard.expiry}
                                            onChange={e => setNewCard({ ...newCard, expiry: e.target.value })}
                                            required
                                        />
                                    </Form.Group>
                                </Col>
                                <Col>
                                    <Form.Group className="mb-3">
                                        <Form.Label className="small fw-bold">CVC</Form.Label>
                                        <Form.Control
                                            type="text"
                                            placeholder="123"
                                            value={newCard.cvc}
                                            onChange={e => setNewCard({ ...newCard, cvc: e.target.value })}
                                            required
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                            <Form.Group className="mb-4">
                                <Form.Label className="small fw-bold">Cardholder Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="e.g. John Doe"
                                    value={newCard.name}
                                    onChange={e => setNewCard({ ...newCard, name: e.target.value })}
                                    required
                                />
                            </Form.Group>
                            <Button type="submit" variant="danger" className="w-100 py-2 fw-bold rounded-pill" disabled={loading}>
                                {loading ? <Spinner size="sm" animation="border" /> : 'Save Card'}
                            </Button>
                        </Form>
                    </Modal.Body>
                </Modal>

                <style dangerouslySetInnerHTML={{
                    __html: `
                    .animate-fade-in {
                        animation: fadeIn 0.4s ease-in-out;
                    }
                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(10px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    .border-dashed { border-style: dashed !important; }
                `}} />
            </div>
        </Layout>
    );
}
