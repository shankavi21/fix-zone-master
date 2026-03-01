import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Row, Col, Alert, Spinner } from 'react-bootstrap';
import AdminLayout from '../components/AdminLayout';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function AdminSettings() {
    const [settings, setSettings] = useState({
        visitCharge: 500,
        serviceFee: 1000,
        platformFee: 10,
        enableBookings: true,
        maintenanceMode: false
    });
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const defaultSettings = {
        visitCharge: 500,
        serviceFee: 1000,
        platformFee: 10,
        enableBookings: true,
        maintenanceMode: false
    };

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const docRef = doc(db, 'platform_settings', 'general');
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setSettings(docSnap.data());
                } else {
                    // Initialize with defaults if not exists
                    await setDoc(docRef, defaultSettings);
                    setSettings(defaultSettings); // Set state after initializing
                }
            } catch (error) {
                console.error('Error fetching settings:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const docRef = doc(db, 'platform_settings', 'general');
            await setDoc(docRef, {
                ...settings,
                updatedAt: new Date()
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = async () => {
        if (window.confirm('Are you sure you want to reset all platform settings to default values?')) {
            setSettings(defaultSettings);
            // Optionally save immediately
            try {
                const docRef = doc(db, 'platform_settings', 'general');
                await setDoc(docRef, {
                    ...defaultSettings,
                    updatedAt: new Date()
                });
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            } catch (e) {
                console.error('Reset save error:', e);
                alert('Failed to reset settings');
            }
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
                    <div className="text-center">
                        <Spinner animation="border" variant="danger" className="mb-3" />
                        <p className="text-muted fw-bold">Synchronizing Platform Settings...</p>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="admin-settings">
                <div className="mb-4">
                    <h2 className="fw-bold mb-1">Platform Settings</h2>
                    <p className="text-muted">Configure system-wide preferences</p>
                </div>

                {saved && (
                    <Alert variant="success" className="rounded-4 border-0 shadow-sm mb-4">
                        <i className="bi bi-check-circle-fill me-2"></i> Settings saved successfully!
                    </Alert>
                )}

                <Form onSubmit={handleSave}>
                    <Row className="g-4">
                        {/* Pricing Settings */}
                        <Col lg={6}>
                            <Card className="border-0 shadow-sm rounded-4 h-100">
                                <Card.Header className="bg-white border-0 p-4">
                                    <h5 className="fw-bold mb-0">Pricing Configuration</h5>
                                </Card.Header>
                                <Card.Body className="p-4">
                                    <Form.Group className="mb-4">
                                        <Form.Label className="fw-semibold">Visiting Charge (LKR)</Form.Label>
                                        <Form.Control
                                            type="number"
                                            value={settings.visitCharge}
                                            onChange={(e) => setSettings({ ...settings, visitCharge: Number(e.target.value) })}
                                            className="rounded-3"
                                        />
                                        <Form.Text className="text-muted">
                                            Default charge for technician visit
                                        </Form.Text>
                                    </Form.Group>

                                    <Form.Group className="mb-4">
                                        <Form.Label className="fw-semibold">Base Service Fee (LKR)</Form.Label>
                                        <Form.Control
                                            type="number"
                                            value={settings.serviceFee}
                                            onChange={(e) => setSettings({ ...settings, serviceFee: Number(e.target.value) })}
                                            className="rounded-3"
                                        />
                                        <Form.Text className="text-muted">
                                            Minimum service charge
                                        </Form.Text>
                                    </Form.Group>

                                    <Form.Group className="mb-0">
                                        <Form.Label className="fw-semibold">Platform Fee (%)</Form.Label>
                                        <Form.Control
                                            type="number"
                                            value={settings.platformFee}
                                            onChange={(e) => setSettings({ ...settings, platformFee: Number(e.target.value) })}
                                            className="rounded-3"
                                        />
                                        <Form.Text className="text-muted">
                                            Commission percentage per transaction
                                        </Form.Text>
                                    </Form.Group>
                                </Card.Body>
                            </Card>
                        </Col>

                        {/* System Settings */}
                        <Col lg={6}>
                            <Card className="border-0 shadow-sm rounded-4 h-100">
                                <Card.Header className="bg-white border-0 p-4">
                                    <h5 className="fw-bold mb-0">System Configuration</h5>
                                </Card.Header>
                                <Card.Body className="p-4">
                                    <div className="mb-4 p-3 bg-light rounded-3">
                                        <Form.Check
                                            type="switch"
                                            id="enable-bookings"
                                            label="Enable New Bookings"
                                            checked={settings.enableBookings}
                                            onChange={(e) => setSettings({ ...settings, enableBookings: e.target.checked })}
                                            className="fw-semibold"
                                        />
                                        <Form.Text className="text-muted d-block mt-2">
                                            Allow customers to create new service requests
                                        </Form.Text>
                                    </div>

                                    <div className="mb-4 p-3 bg-warning bg-opacity-10 rounded-3 border border-warning border-opacity-25">
                                        <Form.Check
                                            type="switch"
                                            id="maintenance-mode"
                                            label="Maintenance Mode"
                                            checked={settings.maintenanceMode}
                                            onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                                            className="fw-semibold text-warning"
                                        />
                                        <Form.Text className="text-warning d-block mt-2">
                                            <i className="bi bi-exclamation-triangle me-1"></i>
                                            Platform will be unavailable to customers
                                        </Form.Text>
                                    </div>

                                    <div className="bg-light rounded-3 p-3">
                                        <h6 className="fw-bold mb-2">System Information</h6>
                                        <div className="d-flex justify-content-between text-muted small mb-2">
                                            <span>Version:</span>
                                            <span className="fw-bold">v2.5.0</span>
                                        </div>
                                        <div className="d-flex justify-content-between text-muted small">
                                            <span>Last Updated:</span>
                                            <span className="fw-bold">{new Date().toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>

                        {/* Notification Settings */}
                        <Col lg={12}>
                            <Card className="border-0 shadow-sm rounded-4">
                                <Card.Header className="bg-white border-0 p-4">
                                    <h5 className="fw-bold mb-0">Notification Settings</h5>
                                </Card.Header>
                                <Card.Body className="p-4">
                                    <Row className="g-3">
                                        <Col md={6}>
                                            <div className="p-3 border rounded-3">
                                                <Form.Check
                                                    type="checkbox"
                                                    id="email-notif"
                                                    label="Email Notifications"
                                                    defaultChecked
                                                    className="fw-semibold"
                                                />
                                            </div>
                                        </Col>
                                        <Col md={6}>
                                            <div className="p-3 border rounded-3">
                                                <Form.Check
                                                    type="checkbox"
                                                    id="sms-notif"
                                                    label="SMS Notifications"
                                                    defaultChecked
                                                    className="fw-semibold"
                                                />
                                            </div>
                                        </Col>
                                        <Col md={6}>
                                            <div className="p-3 border rounded-3">
                                                <Form.Check
                                                    type="checkbox"
                                                    id="push-notif"
                                                    label="Push Notifications"
                                                    defaultChecked
                                                    className="fw-semibold"
                                                />
                                            </div>
                                        </Col>
                                        <Col md={6}>
                                            <div className="p-3 border rounded-3">
                                                <Form.Check
                                                    type="checkbox"
                                                    id="admin-alerts"
                                                    label="Admin Alerts"
                                                    defaultChecked
                                                    className="fw-semibold"
                                                />
                                            </div>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    <div className="mt-4 d-flex gap-3">
                        <Button
                            type="submit"
                            variant="danger"
                            className="px-5 py-3 rounded-pill fw-bold"
                            disabled={saving}
                        >
                            {saving ? (
                                <><Spinner animation="border" size="sm" className="me-2" /> Saving...</>
                            ) : (
                                <><i className="bi bi-save me-2"></i> Save Changes</>
                            )}
                        </Button>
                        <Button
                            type="button"
                            variant="outline-secondary"
                            className="px-5 py-3 rounded-pill fw-bold"
                            onClick={handleReset}
                            disabled={saving}
                        >
                            Reset to Default
                        </Button>
                    </div>
                </Form>
            </div>
        </AdminLayout>
    );
}
