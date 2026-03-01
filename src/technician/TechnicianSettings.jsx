import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Spinner, Alert, ListGroup } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

export default function TechnicianSettings() {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        isAvailable: true,
        acceptNewJobs: true,
        notificationsEnabled: true,
        emailNotifications: true,
        smsNotifications: false
    });
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchSettings();
    }, [currentUser]);

    const fetchSettings = async () => {
        if (!currentUser) return;

        try {
            const techDoc = await getDoc(doc(db, 'technicians', currentUser.uid));
            if (techDoc.exists()) {
                const data = techDoc.data();
                setSettings({
                    isAvailable: data.isAvailable ?? true,
                    acceptNewJobs: data.acceptNewJobs ?? true,
                    notificationsEnabled: data.notificationsEnabled ?? true,
                    emailNotifications: data.emailNotifications ?? true,
                    smsNotifications: data.smsNotifications ?? false
                });
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateDoc(doc(db, 'technicians', currentUser.uid), settings);
            setSuccess('Settings saved successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Failed to save settings.');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Error logging out:', error);
        }
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
            <div className="technician-settings bg-light min-vh-100 py-4">
                <Container>
                    <div className="mb-4">
                        <h2 className="fw-bold text-dark mb-1">Settings</h2>
                        <p className="text-muted">Manage your preferences and account settings</p>
                    </div>

                    {success && (
                        <Alert variant="success" className="mb-4">{success}</Alert>
                    )}

                    <Row className="g-4">
                        {/* Availability Settings */}
                        <Col lg={6}>
                            <Card className="border-0 shadow-sm h-100">
                                <Card.Header className="bg-white border-bottom py-3">
                                    <h5 className="fw-bold mb-0">
                                        <i className="bi bi-calendar-check text-danger me-2"></i>
                                        Availability
                                    </h5>
                                </Card.Header>
                                <Card.Body>
                                    <Form.Check
                                        type="switch"
                                        id="isAvailable"
                                        label="I'm currently available for work"
                                        checked={settings.isAvailable}
                                        onChange={(e) => setSettings({ ...settings, isAvailable: e.target.checked })}
                                        className="mb-3"
                                    />
                                    <Form.Check
                                        type="switch"
                                        id="acceptNewJobs"
                                        label="Accept new job assignments"
                                        checked={settings.acceptNewJobs}
                                        onChange={(e) => setSettings({ ...settings, acceptNewJobs: e.target.checked })}
                                        className="mb-3"
                                    />
                                    <p className="text-muted small">
                                        When turned off, you won't receive new job assignments until you're available again.
                                    </p>
                                </Card.Body>
                            </Card>
                        </Col>

                        {/* Notification Settings */}
                        <Col lg={6}>
                            <Card className="border-0 shadow-sm h-100">
                                <Card.Header className="bg-white border-bottom py-3">
                                    <h5 className="fw-bold mb-0">
                                        <i className="bi bi-bell text-danger me-2"></i>
                                        Notifications
                                    </h5>
                                </Card.Header>
                                <Card.Body>
                                    <Form.Check
                                        type="switch"
                                        id="notificationsEnabled"
                                        label="Enable notifications"
                                        checked={settings.notificationsEnabled}
                                        onChange={(e) => setSettings({ ...settings, notificationsEnabled: e.target.checked })}
                                        className="mb-3"
                                    />
                                    <Form.Check
                                        type="switch"
                                        id="emailNotifications"
                                        label="Email notifications"
                                        checked={settings.emailNotifications}
                                        onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                                        className="mb-3"
                                        disabled={!settings.notificationsEnabled}
                                    />
                                    <Form.Check
                                        type="switch"
                                        id="smsNotifications"
                                        label="SMS notifications"
                                        checked={settings.smsNotifications}
                                        onChange={(e) => setSettings({ ...settings, smsNotifications: e.target.checked })}
                                        className="mb-3"
                                        disabled={!settings.notificationsEnabled}
                                    />
                                </Card.Body>
                            </Card>
                        </Col>

                        {/* Quick Links */}
                        <Col lg={6}>
                            <Card className="border-0 shadow-sm">
                                <Card.Header className="bg-white border-bottom py-3">
                                    <h5 className="fw-bold mb-0">
                                        <i className="bi bi-link-45deg text-danger me-2"></i>
                                        Quick Links
                                    </h5>
                                </Card.Header>
                                <Card.Body className="p-0">
                                    <ListGroup variant="flush">
                                        <ListGroup.Item
                                            className="py-3 px-4 hover-bg-light"
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => navigate('/technician/profile')}
                                        >
                                            <i className="bi bi-person text-danger me-3"></i>
                                            Edit Profile
                                        </ListGroup.Item>
                                        <ListGroup.Item
                                            className="py-3 px-4 hover-bg-light"
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => navigate('/technician/earnings')}
                                        >
                                            <i className="bi bi-currency-dollar text-success me-3"></i>
                                            View Earnings
                                        </ListGroup.Item>
                                        <ListGroup.Item
                                            className="py-3 px-4 hover-bg-light"
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => navigate('/terms')}
                                        >
                                            <i className="bi bi-file-text text-primary me-3"></i>
                                            Terms & Conditions
                                        </ListGroup.Item>
                                        <ListGroup.Item
                                            className="py-3 px-4 hover-bg-light"
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => navigate('/contact')}
                                        >
                                            <i className="bi bi-headset text-secondary me-3"></i>
                                            Contact Support
                                        </ListGroup.Item>
                                    </ListGroup>
                                </Card.Body>
                            </Card>
                        </Col>

                        {/* Account Actions */}
                        <Col lg={6}>
                            <Card className="border-0 shadow-sm">
                                <Card.Header className="bg-white border-bottom py-3">
                                    <h5 className="fw-bold mb-0">
                                        <i className="bi bi-shield-lock text-danger me-2"></i>
                                        Account
                                    </h5>
                                </Card.Header>
                                <Card.Body>
                                    <p className="text-muted small mb-4">
                                        Logged in as: <strong>{currentUser?.email}</strong>
                                    </p>
                                    <div className="d-grid gap-2">
                                        <Button
                                            variant="outline-danger"
                                            onClick={handleLogout}
                                        >
                                            <i className="bi bi-box-arrow-right me-2"></i>
                                            Log Out
                                        </Button>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>

                        {/* Save Button */}
                        <Col xs={12}>
                            <Card className="border-0 shadow-sm">
                                <Card.Body className="d-flex justify-content-end">
                                    <Button
                                        variant="danger"
                                        className="px-5"
                                        onClick={handleSave}
                                        disabled={saving}
                                    >
                                        {saving ? (
                                            <>
                                                <Spinner animation="border" size="sm" className="me-2" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-check-lg me-2"></i>
                                                Save Settings
                                            </>
                                        )}
                                    </Button>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .hover-bg-light:hover {
                    background-color: #f8f9fa !important;
                }
            `}} />
        </Layout>
    );
}
