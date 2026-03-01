import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Modal, Row, Col, Form } from 'react-bootstrap';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import AdminLayout from '../components/AdminLayout';

export default function AdminApplications() {
    const [applications, setApplications] = useState([]);
    const [selectedApp, setSelectedApp] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'technician_applications'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const appData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Sort manually
            appData.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
            setApplications(appData);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const handleDownload = async (url, filename) => {
        try {
            // If it's a Cloudinary URL, we can force download by adding fl_attachment
            let downloadUrl = url;
            if (url.includes('cloudinary.com')) {
                const parts = url.split('/upload/');
                if (parts.length === 2) {
                    downloadUrl = `${parts[0]}/upload/fl_attachment/${parts[1]}`;
                }
            }

            const response = await fetch(downloadUrl);
            if (!response.ok) throw new Error('Network response was not ok');

            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();

            // Cleanup
            setTimeout(() => {
                document.body.removeChild(link);
                window.URL.revokeObjectURL(blobUrl);
            }, 100);
        } catch (error) {
            console.error('Download error:', error);
            // Fallback for CORS or other issues
            const link = document.createElement('a');
            link.href = url;
            link.target = '_blank';
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleApprove = async (appId, applicantData) => {
        try {
            // Update application status
            const appRef = doc(db, 'technician_applications', appId);
            await updateDoc(appRef, { status: 'approved', reviewedAt: new Date() });

            // Update user role to technician if userId exists
            if (applicantData.userId) {
                const userRef = doc(db, 'users', applicantData.userId);
                await updateDoc(userRef, {
                    role: 'technician',
                    name: applicantData.fullName || '',
                    isVerified: true,
                    updatedAt: new Date()
                });

                // ALSO Update technician profile status to approved
                const techRef = doc(db, 'technicians', applicantData.userId);
                await updateDoc(techRef, {
                    status: 'approved',
                    fullName: applicantData.fullName || '',
                    isVerified: true,
                    updatedAt: new Date()
                });
            }

            // Send notification to technician
            await addDoc(collection(db, 'notifications'), {
                userId: applicantData.userId,
                title: 'Application Approved! 🎉',
                message: 'Your expert application has been approved. You can now access your Expert Dashboard and start accepting jobs.',
                type: 'success',
                icon: 'bi-check-circle-fill',
                read: false,
                createdAt: serverTimestamp()
            });

            alert('Application approved successfully!');
            setShowDetailModal(false);
        } catch (error) {
            console.error('Error approving application:', error);
            alert('Failed to approve application');
        }
    };

    const handleReject = async (appId) => {
        if (window.confirm('Are you sure you want to reject this application?')) {
            try {
                const appRef = doc(db, 'technician_applications', appId);
                await updateDoc(appRef, { status: 'rejected', reviewedAt: new Date() });

                // Get application data for notification
                const appData = applications.find(a => a.id === appId);
                if (appData && appData.userId) {
                    await addDoc(collection(db, 'notifications'), {
                        userId: appData.userId,
                        title: 'Expert Application Update',
                        message: 'We have reviewed your application to join as an expert. Unfortunately, we cannot approve your application at this time.',
                        type: 'danger',
                        icon: 'bi-exclamation-circle-fill',
                        read: false,
                        createdAt: serverTimestamp()
                    });
                }

                alert('Application rejected');
                setShowDetailModal(false);
            } catch (error) {
                console.error('Error rejecting application:', error);
            }
        }
    };

    const handleDelete = async (appId) => {
        if (window.confirm('Are you sure you want to delete this application?')) {
            try {
                await deleteDoc(doc(db, 'technician_applications', appId));
            } catch (error) {
                console.error('Error deleting application:', error);
            }
        }
    };

    const getStatusBadge = (status) => {
        const badgeMap = {
            'pending': 'warning',
            'approved': 'success',
            'rejected': 'danger'
        };
        return badgeMap[status] || 'secondary';
    };

    const pendingCount = applications.filter(a => a.status === 'pending').length;

    return (
        <AdminLayout>
            <div className="admin-applications">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="fw-bold mb-1">Expert Applications</h2>
                        <p className="text-muted mb-0">Review and approve expert registrations</p>
                    </div>
                    <Badge bg="warning" className="px-3 py-2 fs-6">
                        {pendingCount} Pending
                    </Badge>
                </div>

                {/* Applications Table */}
                <Card className="border-0 shadow-sm rounded-4">
                    <Card.Body className="p-0">
                        {loading ? (
                            <div className="text-center py-5">
                                <div className="spinner-border text-danger" role="status"></div>
                            </div>
                        ) : applications.length > 0 ? (
                            <Table responsive hover className="mb-0">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="fw-bold text-uppercase small text-muted px-4 py-3">Applicant</th>
                                        <th className="fw-bold text-uppercase small text-muted py-3">Phone</th>
                                        <th className="fw-bold text-uppercase small text-muted py-3">Services</th>
                                        <th className="fw-bold text-uppercase small text-muted py-3">Experience</th>
                                        <th className="fw-bold text-uppercase small text-muted py-3">Status</th>
                                        <th className="fw-bold text-uppercase small text-muted py-3">Date</th>
                                        <th className="fw-bold text-uppercase small text-muted py-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {applications.map(app => (
                                        <tr key={app.id}>
                                            <td className="px-4 py-3">
                                                <div className="d-flex align-items-center gap-3">
                                                    {(app.uploads?.profileUrl || app.profilePhoto) ? (
                                                        <img src={app.uploads?.profileUrl || app.profilePhoto} alt={app.fullName} className="rounded-circle" style={{ width: '40px', height: '40px', objectFit: 'cover' }} />
                                                    ) : (
                                                        <div className="bg-info text-white rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '40px', height: '40px' }}>
                                                            {app.fullName?.charAt(0) || 'T'}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="fw-semibold">{app.fullName}</div>
                                                        <div className="text-muted small">{app.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3">
                                                <span className="text-muted small">{app.contactNumber}</span>
                                            </td>
                                            <td className="py-3">
                                                <span className="text-muted small">
                                                    {app.services ? `${app.services.length} services` : (app.serviceCategories ? `${app.serviceCategories.length} services` : 'N/A')}
                                                </span>
                                            </td>
                                            <td className="py-3">
                                                <span className="text-muted small">{app.experience || app.experienceYears || 'N/A'} years</span>
                                            </td>
                                            <td className="py-3">
                                                <Badge bg={getStatusBadge(app.status)} className="px-3 py-2">
                                                    {app.status || 'pending'}
                                                </Badge>
                                            </td>
                                            <td className="py-3">
                                                <span className="text-muted small">
                                                    {app.createdAt?.toDate ? app.createdAt.toDate().toLocaleDateString() : 'N/A'}
                                                </span>
                                            </td>
                                            <td className="py-3">
                                                <Button
                                                    variant="link"
                                                    size="sm"
                                                    className="text-danger fw-bold p-0 me-3"
                                                    onClick={() => {
                                                        setSelectedApp(app);
                                                        setShowDetailModal(true);
                                                    }}
                                                >
                                                    Review
                                                </Button>
                                                <Button
                                                    variant="link"
                                                    size="sm"
                                                    className="text-danger fw-bold p-0"
                                                    onClick={() => handleDelete(app.id)}
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
                                <i className="bi bi-file-earmark-text text-muted opacity-25" style={{ fontSize: '4rem' }}></i>
                                <p className="text-muted mt-3">No applications found</p>
                            </div>
                        )}
                    </Card.Body>
                </Card>
            </div>

            {/* Detail Modal */}
            <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg" centered scrollable>
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold">Application Review</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    {selectedApp && (
                        <div>
                            {/* Header */}
                            <div className="text-center mb-4 pb-4 border-bottom">
                                {(selectedApp.uploads?.profileUrl || selectedApp.profilePhoto) ? (
                                    <img src={selectedApp.uploads?.profileUrl || selectedApp.profilePhoto} alt={selectedApp.fullName} className="rounded-circle mb-3" style={{ width: '100px', height: '100px', objectFit: 'cover' }} />
                                ) : (
                                    <div className="bg-info text-white rounded-circle d-flex align-items-center justify-content-center fw-bold mx-auto mb-3" style={{ width: '100px', height: '100px', fontSize: '2.5rem' }}>
                                        {selectedApp.fullName?.charAt(0) || 'T'}
                                    </div>
                                )}
                                <h4 className="fw-bold mb-1">{selectedApp.fullName}</h4>
                                <p className="text-muted mb-2">{selectedApp.email}</p>
                                <Badge bg={getStatusBadge(selectedApp.status)} className="px-3 py-2">
                                    {selectedApp.status || 'pending'}
                                </Badge>
                            </div>

                            {/* Details */}
                            <Row className="g-4">
                                <Col md={6}>
                                    <div className="mb-3">
                                        <small className="text-muted text-uppercase fw-bold">Contact Number</small>
                                        <div className="fw-semibold">{selectedApp.contactNumber || selectedApp.phone}</div>
                                    </div>
                                    <div className="mb-3">
                                        <small className="text-muted text-uppercase fw-bold">NIC Number</small>
                                        <div className="fw-semibold">{selectedApp.nic || selectedApp.nicNumber || 'N/A'}</div>
                                    </div>
                                    <div className="mb-3">
                                        <small className="text-muted text-uppercase fw-bold">Experience</small>
                                        <div className="fw-semibold">{selectedApp.experience || selectedApp.experienceYears} years</div>
                                    </div>
                                </Col>
                                <Col md={6}>
                                    <div className="mb-3">
                                        <small className="text-muted text-uppercase fw-bold">Operating Districts</small>
                                        <div className="fw-semibold">
                                            {selectedApp.districts ? selectedApp.districts.join(', ') : (selectedApp.operatingDistricts ? selectedApp.operatingDistricts.join(', ') : 'N/A')}
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <small className="text-muted text-uppercase fw-bold">Service Categories</small>
                                        <div className="d-flex flex-wrap gap-2 mt-2">
                                            {(selectedApp.services || selectedApp.serviceCategories)?.map((service, i) => (
                                                <Badge key={i} bg="secondary" className="px-2 py-1">{service}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                </Col>
                            </Row>

                            <hr />

                            <div className="mb-3">
                                <small className="text-muted text-uppercase fw-bold">Professional Summary</small>
                                <p className="mt-2">{selectedApp.bio || selectedApp.professionalSummary || 'No summary provided'}</p>
                            </div>

                            {/* Documents */}
                            {(selectedApp.uploads?.nicUrl || selectedApp.nicCopy || selectedApp.uploads?.certUrls || selectedApp.certificates || selectedApp.workPhotos) && (
                                <>
                                    <hr />
                                    <div className="mb-3">
                                        <small className="text-muted text-uppercase fw-bold">Verification Documents</small>
                                        <div className="d-grid gap-4 mt-3">
                                            {(selectedApp.uploads?.nicUrl || selectedApp.nicCopy) && (
                                                <Card className="border-0 shadow-sm overflow-hidden bg-light">
                                                    <Card.Header className="bg-white border-0 py-3 d-flex justify-content-between align-items-center">
                                                        <span className="fw-bold small text-muted text-uppercase">
                                                            <i className="bi bi-person-badge text-danger me-2"></i>NIC / Identity Document
                                                        </span>
                                                        <Button variant="light" size="sm" className="rounded-circle shadow-sm" onClick={() => handleDownload(selectedApp.uploads?.nicUrl || selectedApp.nicCopy, `NIC_${selectedApp.fullName.replace(/\s+/g, '_')}.jpg`)}>
                                                            <i className="bi bi-download text-danger"></i>
                                                        </Button>
                                                    </Card.Header>
                                                    <div className="p-2">
                                                        <img
                                                            src={selectedApp.uploads?.nicUrl || selectedApp.nicCopy}
                                                            alt="NIC"
                                                            className="img-fluid rounded-3"
                                                            style={{ maxHeight: '350px', width: '100%', objectFit: 'contain', cursor: 'zoom-in', background: '#f8f9fa' }}
                                                            onClick={() => window.open(selectedApp.uploads?.nicUrl || selectedApp.nicCopy, '_blank')}
                                                        />
                                                    </div>
                                                </Card>
                                            )}

                                            {(selectedApp.uploads?.certUrls || selectedApp.certificates) && (selectedApp.uploads?.certUrls || selectedApp.certificates).length > 0 && (
                                                <div>
                                                    <h6 className="fw-bold small text-muted text-uppercase mb-3">
                                                        <i className="bi bi-award text-danger me-2"></i>Certificates & Qualifications
                                                    </h6>
                                                    <Row className="g-3">
                                                        {(selectedApp.uploads?.certUrls || selectedApp.certificates).map((cert, i) => (
                                                            <Col md={6} key={i}>
                                                                <Card className="border-0 shadow-sm overflow-hidden bg-light h-100">
                                                                    <Card.Header className="bg-white border-0 py-2 d-flex justify-content-between align-items-center">
                                                                        <span className="fw-bold small text-muted">Cert {i + 1}</span>
                                                                        <Button variant="light" size="sm" className="rounded-circle" onClick={() => handleDownload(cert, `Certificate_${i + 1}_${selectedApp.fullName.replace(/\s+/g, '_')}.jpg`)}>
                                                                            <i className="bi bi-download text-danger"></i>
                                                                        </Button>
                                                                    </Card.Header>
                                                                    <div className="p-2">
                                                                        <img
                                                                            src={cert}
                                                                            alt={`Certificate ${i + 1}`}
                                                                            className="img-fluid rounded-2"
                                                                            style={{ height: '180px', width: '100%', objectFit: 'cover', cursor: 'zoom-in' }}
                                                                            onClick={() => window.open(cert, '_blank')}
                                                                            title="Click to view full size"
                                                                        />
                                                                    </div>
                                                                </Card>
                                                            </Col>
                                                        ))}
                                                    </Row>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Action Buttons */}
                            {selectedApp.status === 'pending' && (
                                <div className="d-flex gap-3 mt-4 pt-4 border-top">
                                    <Button
                                        variant="success"
                                        className="flex-grow-1 rounded-pill py-2 fw-bold"
                                        onClick={() => handleApprove(selectedApp.id, selectedApp)}
                                    >
                                        <i className="bi bi-check-circle me-2"></i> Approve Application
                                    </Button>
                                    <Button
                                        variant="outline-danger"
                                        className="flex-grow-1 rounded-pill py-2 fw-bold"
                                        onClick={() => handleReject(selectedApp.id)}
                                    >
                                        <i className="bi bi-x-circle me-2"></i> Reject
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </Modal.Body>
            </Modal>
        </AdminLayout>
    );
}
