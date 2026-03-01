import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Form, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { uploadToCloudinary } from '../utils/cloudinary';
import Layout from '../components/Layout';

export default function TechnicianProfile() {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [technicianData, setTechnicianData] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [success, setSuccess] = useState('');
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchTechnicianData();
    }, [currentUser]);

    const fetchTechnicianData = async () => {
        if (!currentUser) return;

        try {
            const techDoc = await getDoc(doc(db, 'technicians', currentUser.uid));
            if (techDoc.exists()) {
                setTechnicianData(techDoc.data());
            }
        } catch (error) {
            console.error('Error fetching technician data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoUpload = async (e) => {
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

        setUploading(true);
        try {
            const downloadURL = await uploadToCloudinary(file, `technicians/${currentUser.uid}/profile`);

            await updateDoc(doc(db, 'technicians', currentUser.uid), {
                'uploads.profileUrl': downloadURL
            });

            await updateDoc(doc(db, 'users', currentUser.uid), {
                photoURL: downloadURL
            });

            setTechnicianData(prev => ({
                ...prev,
                uploads: { ...prev.uploads, profileUrl: downloadURL }
            }));

            setSuccess('Profile photo updated!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            console.error('Error uploading photo:', error);
            alert('Failed to upload photo.');
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateDoc(doc(db, 'technicians', currentUser.uid), {
                phone: technicianData.phone,
                bio: technicianData.bio,
                experience: technicianData.experience,
                tools: technicianData.tools,
                vehicle: technicianData.vehicle,
                workingHours: technicianData.workingHours,
                services: technicianData.services,
                districts: technicianData.districts
            });

            setSuccess('Profile updated successfully!');
            setEditMode(false);
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile.');
        } finally {
            setSaving(false);
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

    if (!technicianData) {
        return (
            <Layout>
                <Container className="py-5">
                    <Alert variant="warning">Technician profile not found.</Alert>
                </Container>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="technician-profile bg-light min-vh-100 py-4">
                <Container>
                    <div className="mb-4">
                        <h2 className="fw-bold text-dark mb-1">My Profile</h2>
                        <p className="text-muted">Manage your technician profile and settings</p>
                    </div>

                    {success && (
                        <Alert variant="success" className="mb-4">{success}</Alert>
                    )}

                    <Row className="g-4">
                        {/* Profile Card */}
                        <Col lg={4}>
                            <Card className="border-0 shadow-sm">
                                <Card.Body className="text-center py-5">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handlePhotoUpload}
                                        accept="image/*"
                                        className="d-none"
                                    />
                                    <div className="position-relative d-inline-block mb-4">
                                        {technicianData.uploads?.profileUrl ? (
                                            <img
                                                src={technicianData.uploads.profileUrl}
                                                alt="Profile"
                                                className="rounded-circle"
                                                style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                                            />
                                        ) : (
                                            <div className="bg-danger text-white rounded-circle d-flex align-items-center justify-content-center"
                                                style={{ width: '150px', height: '150px', fontSize: '4rem' }}>
                                                {technicianData.fullName?.charAt(0) || 'T'}
                                            </div>
                                        )}
                                        <Button
                                            variant="light"
                                            className="position-absolute bottom-0 end-0 rounded-circle p-2 shadow"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploading}
                                        >
                                            {uploading ? (
                                                <Spinner animation="border" size="sm" />
                                            ) : (
                                                <i className="bi bi-camera-fill text-danger"></i>
                                            )}
                                        </Button>
                                    </div>
                                    <h4 className="fw-bold mb-1">{technicianData.fullName}</h4>
                                    <p className="text-muted mb-3">{technicianData.email}</p>
                                    <Badge bg={technicianData.status === 'approved' ? 'success' : 'warning'} className="mb-3">
                                        {technicianData.status === 'approved' ? 'Verified Technician' : 'Pending Verification'}
                                    </Badge>
                                    <div className="d-flex justify-content-center gap-3 mb-3">
                                        <div className="text-center">
                                            <h4 className="fw-bold text-danger mb-0">{technicianData.completedJobs || 0}</h4>
                                            <small className="text-muted">Jobs</small>
                                        </div>
                                        <div className="text-center">
                                            <h4 className="fw-bold text-warning mb-0">
                                                <i className="bi bi-star-fill me-1"></i>{technicianData.rating || '0.0'}
                                            </h4>
                                            <small className="text-muted">Rating</small>
                                        </div>
                                        <div className="text-center">
                                            <h4 className="fw-bold text-primary mb-0">{technicianData.experience || 0}</h4>
                                            <small className="text-muted">Years Exp</small>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>

                        {/* Profile Details */}
                        <Col lg={8}>
                            <Card className="border-0 shadow-sm">
                                <Card.Header className="bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
                                    <h5 className="fw-bold mb-0">Profile Details</h5>
                                    {!editMode ? (
                                        <Button variant="outline-danger" size="sm" onClick={() => setEditMode(true)}>
                                            <i className="bi bi-pencil me-2"></i>Edit
                                        </Button>
                                    ) : (
                                        <div className="d-flex gap-2">
                                            <Button variant="light" size="sm" onClick={() => setEditMode(false)}>Cancel</Button>
                                            <Button variant="danger" size="sm" onClick={handleSave} disabled={saving}>
                                                {saving ? 'Saving...' : 'Save Changes'}
                                            </Button>
                                        </div>
                                    )}
                                </Card.Header>
                                <Card.Body className="p-4">
                                    <Row className="g-4">
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label className="small text-muted fw-bold">FULL NAME</Form.Label>
                                                <Form.Control
                                                    value={technicianData.fullName || ''}
                                                    disabled
                                                    className="bg-light"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label className="small text-muted fw-bold">EMAIL</Form.Label>
                                                <Form.Control
                                                    value={technicianData.email || ''}
                                                    disabled
                                                    className="bg-light"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label className="small text-muted fw-bold">PHONE NUMBER</Form.Label>
                                                <Form.Control
                                                    value={technicianData.phone || ''}
                                                    onChange={(e) => setTechnicianData({ ...technicianData, phone: e.target.value })}
                                                    disabled={!editMode}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label className="small text-muted fw-bold">EXPERIENCE (YEARS)</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    value={technicianData.experience || ''}
                                                    onChange={(e) => setTechnicianData({ ...technicianData, experience: e.target.value })}
                                                    disabled={!editMode}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={12}>
                                            <Form.Group>
                                                <Form.Label className="small text-muted fw-bold">BIO / ABOUT ME</Form.Label>
                                                <Form.Control
                                                    as="textarea"
                                                    rows={3}
                                                    value={technicianData.bio || ''}
                                                    onChange={(e) => setTechnicianData({ ...technicianData, bio: e.target.value })}
                                                    disabled={!editMode}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label className="small text-muted fw-bold">WORKING HOURS</Form.Label>
                                                <Form.Select
                                                    value={technicianData.workingHours || ''}
                                                    onChange={(e) => setTechnicianData({ ...technicianData, workingHours: e.target.value })}
                                                    disabled={!editMode}
                                                >
                                                    <option>Full Time (8am - 6pm)</option>
                                                    <option>Part Time (Morning)</option>
                                                    <option>Part Time (Evening)</option>
                                                    <option>Flexible</option>
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label className="small text-muted fw-bold">VEHICLE</Form.Label>
                                                <Form.Select
                                                    value={technicianData.vehicle || ''}
                                                    onChange={(e) => setTechnicianData({ ...technicianData, vehicle: e.target.value })}
                                                    disabled={!editMode}
                                                >
                                                    <option>None</option>
                                                    <option>Motorcycle</option>
                                                    <option>Car</option>
                                                    <option>Van</option>
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                        <Col md={12}>
                                            <Form.Group>
                                                <Form.Label className="small text-muted fw-bold">SERVICES OFFERED</Form.Label>
                                                <div className="d-flex flex-wrap gap-2">
                                                    {technicianData.services?.map(service => (
                                                        <Badge key={service} bg="danger" className="bg-opacity-10 text-danger py-2 px-3">
                                                            {service}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </Form.Group>
                                        </Col>
                                        <Col md={12}>
                                            <Form.Group>
                                                <Form.Label className="small text-muted fw-bold">SERVICE AREAS</Form.Label>
                                                <div className="d-flex flex-wrap gap-2">
                                                    {technicianData.districts?.map(district => (
                                                        <Badge key={district} bg="primary" className="bg-opacity-10 text-primary py-2 px-3">
                                                            {district}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </Layout>
    );
}
