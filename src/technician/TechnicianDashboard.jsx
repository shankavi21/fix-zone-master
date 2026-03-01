import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Table, ProgressBar, Alert, Form, Spinner } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc, orderBy, limit, updateDoc, addDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';

export default function TechnicianDashboard() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [technicianData, setTechnicianData] = useState(null);
    const [stats, setStats] = useState({
        activeJobs: 0,
        completedJobs: 0,
        totalEarnings: 0,
        pendingPayments: 0,
        rating: 0,
        reviewCount: 0
    });
    const [recentJobs, setRecentJobs] = useState([]);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Simulation States
    const [actionLoading, setActionLoading] = useState(false);
    const [simQuote, setSimQuote] = useState('');
    const [selectedJobId, setSelectedJobId] = useState('');

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        let unsubscribe;
        if (currentUser) {
            unsubscribe = fetchTechnicianData();
        }
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [currentUser]);

    const fetchTechnicianData = () => {
        if (!currentUser) return;

        // 1. Get Technician Profile (one-time fetch or separate listener if needed)
        getDoc(doc(db, 'technicians', currentUser.uid)).then(techDoc => {
            if (techDoc.exists()) {
                setTechnicianData(techDoc.data());
            }
        });

        // 2. Real-time Ticket Sync
        const ticketsQuery = query(
            collection(db, 'tickets'),
            where('assignedTechId', '==', currentUser.uid),
            limit(50)
        );

        const unsubscribe = onSnapshot(ticketsQuery, (ticketsSnapshot) => {
            const tickets = ticketsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Client-side sort to avoid index requirement
            tickets.sort((a, b) => {
                const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
                const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
                return timeB - timeA;
            });
            setRecentJobs(tickets);

            const activeJobs = tickets.filter(t => t.status === 'In Progress' || t.status === 'Assigned' || t.status === 'Pending').length;
            const completedJobs = tickets.filter(t => t.status === 'Completed').length;
            const totalEarnings = tickets
                .filter(t => t.status === 'Completed')
                .reduce((sum, t) => sum + (t.serviceFee || 0), 0);
            const pendingPayments = tickets
                .filter(t => t.status === 'Completed' && !t.paid)
                .reduce((sum, t) => sum + (t.serviceFee || 0), 0);

            setStats(prev => ({
                ...prev,
                activeJobs,
                completedJobs,
                totalEarnings,
                pendingPayments,
                rating: prev.rating, // Keep existing or update from techDoc
                reviewCount: prev.reviewCount
            }));
            setLoading(false);
        }, (error) => {
            console.error('Error fetching tickets:', error);
            setLoading(false);
        });

        return unsubscribe;
    };

    // --- SIMULATION HANDLERS ---
    const handleSimAction = async (actionType) => {
        if (!selectedJobId) return alert("Please select a job first.");

        setActionLoading(true);
        try {
            const ticketRef = doc(db, 'tickets', selectedJobId);
            const job = recentJobs.find(j => j.id === selectedJobId);

            if (actionType === 'ASSIGN') {
                await updateDoc(ticketRef, {
                    status: 'Assigned',
                    assignedTechId: currentUser.uid,
                    assignedTechName: technicianData.fullName,
                    updatedAt: serverTimestamp()
                });
            } else if (actionType === 'QUOTE') {
                if (!simQuote) return alert("Enter quote amount");
                await updateDoc(ticketRef, {
                    status: 'Quoted',
                    finalQuoteAmount: parseInt(simQuote),
                    updatedAt: serverTimestamp()
                });

                // Add notification for customer
                await addDoc(collection(db, 'notifications'), {
                    userId: job.customerId || '', // Assuming customerId exists on ticket
                    type: 'warning',
                    icon: 'bi-receipt',
                    title: 'New Quote Received',
                    message: `A final quote of LKR ${simQuote} has been sent for your approval.`,
                    link: `/customer/tickets/${selectedJobId}`,
                    read: false,
                    createdAt: serverTimestamp()
                });
            } else if (actionType === 'COMPLETE') {
                await updateDoc(ticketRef, {
                    status: 'Completed',
                    workDoneAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });

                await addDoc(collection(db, 'notifications'), {
                    userId: job.customerId || '',
                    type: 'success',
                    icon: 'bi-patch-check-fill',
                    title: 'Repair Completed',
                    message: `Technician has finished the work. Please confirm and rate.`,
                    link: `/customer/tickets/${selectedJobId}`,
                    read: false,
                    createdAt: serverTimestamp()
                });
            }

            alert("Simulation action successful!");
            fetchTechnicianData(); // Refresh data
        } catch (err) {
            console.error(err);
            alert("Action failed: " + err.message);
        }
        setActionLoading(false);
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            'Pending': { bg: 'warning', icon: 'bi-clock' },
            'Assigned': { bg: 'info', icon: 'bi-person-check' },
            'In Progress': { bg: 'primary', icon: 'bi-gear-wide-connected' },
            'Completed': { bg: 'success', icon: 'bi-check-circle' },
            'Cancelled': { bg: 'danger', icon: 'bi-x-circle' }
        };
        const config = statusMap[status] || { bg: 'secondary', icon: 'bi-question-circle' };
        return (
            <Badge bg={config.bg} className="d-flex align-items-center gap-1 px-2 py-1">
                <i className={`bi ${config.icon}`}></i> {status}
            </Badge>
        );
    };

    if (loading) {
        return (
            <Layout>
                <div className="loading-screen">
                    <div className="loading-content">
                        <div className="loading-spinner"></div>
                        <p>Loading dashboard...</p>
                    </div>
                </div>
                <style dangerouslySetInnerHTML={{
                    __html: `
                    .loading-screen {
                        min-height: 80vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    .loading-content {
                        text-align: center;
                        color: #64748b;
                    }
                    .loading-spinner {
                        width: 50px;
                        height: 50px;
                        border: 4px solid #f3f3f3;
                        border-top: 4px solid #dc3545;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                        margin: 0 auto 1rem;
                    }
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}} />
            </Layout>
        );
    }

    if (!technicianData) {
        return (
            <Layout>
                <Container className="py-5">
                    <Alert className="modern-alert border-0 rounded-4 shadow-sm">
                        <div className="d-flex align-items-center gap-3">
                            <div className="alert-icon-wrapper">
                                <i className="bi bi-hourglass-split"></i>
                            </div>
                            <div>
                                <h5 className="fw-bold mb-1">Application Under Review</h5>
                                <p className="mb-0 text-muted">Your technician application is being processed. You'll be notified once approved.</p>
                            </div>
                        </div>
                    </Alert>
                </Container>
                <style dangerouslySetInnerHTML={{
                    __html: `
                    .modern-alert {
                        background: linear-gradient(135deg, #fef3c7, #fde68a);
                        padding: 1.5rem;
                    }
                    .alert-icon-wrapper {
                        width: 50px;
                        height: 50px;
                        background: #f59e0b;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        font-size: 1.5rem;
                    }
                `}} />
            </Layout>
        );
    }

    const quickStats = [
        {
            title: 'Active Jobs',
            value: stats.activeJobs,
            icon: 'bi-clipboard-check',
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            change: 'Live',
            subtitle: 'Currently assigned'
        },
        {
            title: 'Completed',
            value: stats.completedJobs,
            icon: 'bi-trophy',
            gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
            change: '+8%',
            subtitle: 'Jobs finished'
        },
        {
            title: 'Total Earnings',
            value: `LKR ${stats.totalEarnings.toLocaleString()}`,
            icon: 'bi-wallet2',
            gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            change: '+15%',
            subtitle: 'All time'
        },
        {
            title: 'Pending Payment',
            value: `LKR ${stats.pendingPayments.toLocaleString()}`,
            icon: 'bi-hourglass-split',
            gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            change: 'Awaiting',
            subtitle: 'To be paid'
        }
    ];

    const profileStats = [
        { title: 'Rating', value: stats.rating.toFixed(1), icon: 'bi-star-fill', color: '#f59e0b' },
        { title: 'Experience', value: `${technicianData.experience || 0} yrs`, icon: 'bi-briefcase', color: '#8b5cf6' },
        { title: 'Reviews', value: stats.reviewCount, icon: 'bi-chat-quote', color: '#10b981' }
    ];

    return (
        <Layout>
            <div className="technician-dashboard-pro">
                {/* Header Section */}
                <div className="dashboard-header mb-5">
                    <Row className="align-items-center">
                        <Col>
                            <div className="d-flex align-items-center gap-3 mb-2">
                                <div className="header-icon">
                                    <i className="bi bi-tools"></i>
                                </div>
                                <div>
                                    <h1 className="dashboard-title mb-0">
                                        Welcome, {technicianData.fullName?.split(' ')[0] || 'Technician'}!
                                    </h1>
                                    <p className="dashboard-subtitle mb-0">
                                        Here's what's happening with your jobs today.
                                    </p>
                                </div>
                            </div>
                        </Col>
                        <Col xs="auto" className="d-none d-md-block">
                            <div className="live-time-card">
                                <div className="d-flex align-items-center gap-3">
                                    <div className={`pulse-circle ${technicianData.isAvailable !== false ? 'active' : 'inactive'}`}></div>
                                    <div>
                                        <div className="time-display">{currentTime.toLocaleTimeString()}</div>
                                        <div className="date-display">
                                            {technicianData.isAvailable !== false ? 'Available for Jobs' : 'Currently Offline'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </div>

                {/* Quick Stats Grid */}
                <Row className="g-4 mb-5">
                    {quickStats.map((stat, idx) => (
                        <Col lg={3} md={6} key={idx}>
                            <div className="stat-card-pro" style={{ background: stat.gradient }}>
                                <div className="stat-content">
                                    <div className="stat-icon-wrapper">
                                        <i className={`bi ${stat.icon}`}></i>
                                    </div>
                                    <div className="stat-info">
                                        <span className="stat-title">{stat.title}</span>
                                        <h2 className="stat-value">{stat.value}</h2>
                                        <div className="stat-footer">
                                            <span className="stat-change">
                                                <i className="bi bi-arrow-up-short"></i> {stat.change}
                                            </span>
                                            <span className="stat-subtitle">{stat.subtitle}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="stat-decoration"></div>
                            </div>
                        </Col>
                    ))}
                </Row>

                {/* Main Content Grid */}
                <Row className="g-4 mb-5">
                    {/* Recent Jobs Table */}
                    <Col lg={8}>
                        <Card className="glass-card h-100">
                            <Card.Header className="glass-header">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="header-badge">
                                            <i className="bi bi-briefcase"></i>
                                        </div>
                                        <div>
                                            <h5 className="fw-bold mb-0">Recent Jobs</h5>
                                            <small className="text-muted">Your latest assignments</small>
                                        </div>
                                    </div>
                                    <Button as={Link} to="/technician/jobs" className="btn-modern">
                                        View All <i className="bi bi-arrow-right ms-2"></i>
                                    </Button>
                                </div>
                            </Card.Header>
                            <Card.Body className="p-0">
                                {recentJobs.length > 0 ? (
                                    <div className="table-responsive">
                                        <Table className="modern-table mb-0">
                                            <thead>
                                                <tr>
                                                    <th>Job ID</th>
                                                    <th>Customer</th>
                                                    <th>Appliance</th>
                                                    <th>Status</th>
                                                    <th>Fee</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {recentJobs.slice(0, 6).map(job => (
                                                    <tr key={job.id} className="job-row" onClick={() => navigate(`/technician/jobs`)}>
                                                        <td>
                                                            <div className="job-id">
                                                                #{job.id.slice(0, 8).toUpperCase()}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="customer-info">
                                                                <div className="customer-avatar">
                                                                    {(job.customerName || 'C').charAt(0).toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <span className="customer-name">{job.customerName || 'Customer'}</span>
                                                                    <small className="d-block text-muted">{job.city}</small>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="service-type">
                                                                <i className="bi bi-gear me-2"></i>
                                                                {job.applianceType}
                                                            </div>
                                                        </td>
                                                        <td>{getStatusBadge(job.status)}</td>
                                                        <td>
                                                            <span className="fee-amount">LKR {(job.serviceFee || 0).toLocaleString()}</span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    </div>
                                ) : (
                                    <div className="empty-state">
                                        <i className="bi bi-inbox"></i>
                                        <h5>No Jobs Yet</h5>
                                        <p>New assignments will appear here</p>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Right Sidebar */}
                    <Col lg={4}>
                        {/* Profile Summary */}
                        <Card className="glass-card mb-4">
                            <Card.Header className="glass-header">
                                <div className="d-flex align-items-center gap-3">
                                    <div className="header-badge">
                                        <i className="bi bi-person"></i>
                                    </div>
                                    <div>
                                        <h5 className="fw-bold mb-0">Your Profile</h5>
                                        <small className="text-muted">Performance overview</small>
                                    </div>
                                </div>
                            </Card.Header>
                            <Card.Body className="text-center py-4">
                                {technicianData.uploads?.profileUrl ? (
                                    <img src={technicianData.uploads.profileUrl} alt="Profile" className="profile-image-large" />
                                ) : (
                                    <div className="profile-placeholder-large">
                                        {technicianData.fullName?.charAt(0) || 'T'}
                                    </div>
                                )}
                                <h5 className="fw-bold mt-3 mb-1">{technicianData.fullName}</h5>
                                <p className="text-muted small mb-3">{technicianData.email}</p>

                                <div className="profile-stats-row">
                                    {profileStats.map((stat, idx) => (
                                        <div key={idx} className="profile-stat-item">
                                            <div className="profile-stat-icon" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                                                <i className={`bi ${stat.icon}`}></i>
                                            </div>
                                            <div className="profile-stat-value">{stat.value}</div>
                                            <div className="profile-stat-label">{stat.title}</div>
                                        </div>
                                    ))}
                                </div>
                            </Card.Body>
                        </Card>

                        {/* Quick Actions */}
                        <Card className="glass-card">
                            <Card.Header className="glass-header">
                                <div className="d-flex align-items-center gap-3">
                                    <div className="header-badge">
                                        <i className="bi bi-lightning"></i>
                                    </div>
                                    <div>
                                        <h5 className="fw-bold mb-0">Quick Actions</h5>
                                        <small className="text-muted">Navigate faster</small>
                                    </div>
                                </div>
                            </Card.Header>
                            <Card.Body className="p-3">
                                <div className="quick-actions-grid">
                                    <Link to="/technician/jobs" className="quick-action-tile">
                                        <i className="bi bi-clipboard-check"></i>
                                        <span>My Jobs</span>
                                    </Link>
                                    <Link to="/technician/earnings" className="quick-action-tile">
                                        <i className="bi bi-wallet2"></i>
                                        <span>Earnings</span>
                                    </Link>
                                    <Link to="/technician/profile" className="quick-action-tile">
                                        <i className="bi bi-person-circle"></i>
                                        <span>Profile</span>
                                    </Link>
                                    <Link to="/technician/settings" className="quick-action-tile">
                                        <i className="bi bi-gear"></i>
                                        <span>Settings</span>
                                    </Link>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Performance Cards */}
                <Row className="g-4">
                    <Col md={6}>
                        <Card className="performance-card">
                            <Card.Body>
                                <div className="d-flex align-items-center gap-4">
                                    <div className="performance-icon success">
                                        <i className="bi bi-graph-up-arrow"></i>
                                    </div>
                                    <div>
                                        <h4 className="fw-bold mb-1">Great Performance!</h4>
                                        <p className="text-muted mb-0">You're maintaining a {stats.rating.toFixed(1)} rating. Keep up the excellent work!</p>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={6}>
                        <Card className="performance-card highlight">
                            <Card.Body>
                                <div className="d-flex align-items-center gap-4">
                                    <div className="performance-icon warning">
                                        <i className="bi bi-cash-stack"></i>
                                    </div>
                                    <div className="flex-grow-1">
                                        <h4 className="fw-bold mb-1">Pending: LKR {stats.pendingPayments.toLocaleString()}</h4>
                                        <p className="text-muted mb-2">Earnings awaiting payment</p>
                                        <Button as={Link} to="/technician/earnings" size="sm" className="btn-action">
                                            View Earnings <i className="bi bi-arrow-right ms-1"></i>
                                        </Button>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Technician Simulation Panel (Debug Tool) */}
                <hr className="my-5" />
                <Card className="border-0 shadow-sm bg-white mb-5 rounded-4 overflow-hidden">
                    <Card.Header className="bg-dark text-white p-3 border-0">
                        <div className="d-flex align-items-center gap-2">
                            <Badge bg="danger">PROTOTYPE ONLY</Badge>
                            <h6 className="fw-bold mb-0 text-white">Technician Task Simulator</h6>
                        </div>
                    </Card.Header>
                    <Card.Body className="p-4 bg-light bg-opacity-50">
                        <p className="small text-muted mb-4">Use this tool to simulate full repair lifecycle. Select a job from your recent list to begin.</p>

                        <Row className="g-4">
                            <Col lg={12}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="small fw-bold text-muted text-uppercase">Select Job to Simulate</Form.Label>
                                    <Form.Select
                                        className="rounded-3 border-light shadow-sm"
                                        value={selectedJobId}
                                        onChange={(e) => setSelectedJobId(e.target.value)}
                                    >
                                        <option value="">-- Select a Recent Job --</option>
                                        {recentJobs.map(job => (
                                            <option key={job.id} value={job.id}>
                                                #{job.id.slice(0, 8).toUpperCase()} - {job.applianceType} ({job.status})
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            <Col md={4}>
                                <div className="p-4 bg-white rounded-4 border border-light shadow-sm h-100">
                                    <div className="d-flex align-items-center gap-2 mb-3">
                                        <div className="bg-primary bg-opacity-10 text-primary rounded-circle p-2" style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>1</div>
                                        <h6 className="fw-bold mb-0 small text-uppercase">Self-Assignment</h6>
                                    </div>
                                    <Button
                                        variant="outline-primary"
                                        className="w-100 rounded-pill fw-bold btn-sm py-2"
                                        onClick={() => handleSimAction('ASSIGN')}
                                        disabled={actionLoading || !selectedJobId}
                                    >
                                        {actionLoading ? <Spinner size="sm" /> : 'MARK AS ASSIGNED'}
                                    </Button>
                                    <p className="tiny mt-2 mb-0 text-muted">Bypasses admin to set status to 'Assigned'</p>
                                </div>
                            </Col>

                            <Col md={4}>
                                <div className="p-4 bg-white rounded-4 border border-light shadow-sm h-100">
                                    <div className="d-flex align-items-center gap-2 mb-3">
                                        <div className="bg-warning bg-opacity-10 text-warning rounded-circle p-2" style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>2</div>
                                        <h6 className="fw-bold mb-0 small text-uppercase">Cost Quotation</h6>
                                    </div>
                                    <div className="mb-2">
                                        <Form.Control
                                            type="number"
                                            placeholder="Final Quote (LKR)"
                                            className="form-control-sm rounded-pill mb-2"
                                            value={simQuote}
                                            onChange={(e) => setSimQuote(e.target.value)}
                                            disabled={actionLoading || !selectedJobId}
                                        />
                                        <Button
                                            variant="warning"
                                            className="w-100 text-white rounded-pill fw-bold btn-sm py-2"
                                            onClick={() => handleSimAction('QUOTE')}
                                            disabled={actionLoading || !selectedJobId}
                                        >
                                            {actionLoading ? <Spinner size="sm" /> : 'SEND QUOTATION'}
                                        </Button>
                                    </div>
                                    <p className="tiny mt-2 mb-0 text-muted">Sets 'Quoted' status for customer approval.</p>
                                </div>
                            </Col>

                            <Col md={4}>
                                <div className="p-4 bg-white rounded-4 border border-light shadow-sm h-100">
                                    <div className="d-flex align-items-center gap-2 mb-3">
                                        <div className="bg-success bg-opacity-10 text-success rounded-circle p-2" style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>3</div>
                                        <h6 className="fw-bold mb-0 small text-uppercase">Work Done</h6>
                                    </div>
                                    <Button
                                        variant="success"
                                        className="w-100 rounded-pill fw-bold btn-sm py-2"
                                        onClick={() => handleSimAction('COMPLETE')}
                                        disabled={actionLoading || !selectedJobId}
                                    >
                                        {actionLoading ? <Spinner size="sm" /> : 'MARK AS COMPLETED'}
                                    </Button>
                                    <p className="tiny mt-2 mb-0 text-muted">Sets status to 'Completed' (Awaiting Customer Finished).</p>
                                </div>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .technician-dashboard-pro {
                    min-height: 100vh;
                    padding: 0;
                    background: #f8fafc;
                }

                /* Header Styles */
                .dashboard-header {
                    padding-bottom: 1rem;
                    border-bottom: 1px solid rgba(0,0,0,0.05);
                }
                .header-icon {
                    width: 56px;
                    height: 56px;
                    background: linear-gradient(135deg, #dc3545, #c82333);
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.5rem;
                    color: white;
                    box-shadow: 0 8px 20px rgba(220, 53, 69, 0.3);
                }
                .dashboard-title {
                    font-size: 2rem;
                    font-weight: 800;
                    color: #1a1a2e;
                    letter-spacing: -0.02em;
                }
                .dashboard-subtitle {
                    color: #64748b;
                    font-size: 0.95rem;
                }
                .live-time-card {
                    background: white;
                    padding: 1rem 1.5rem;
                    border-radius: 16px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.05);
                    border: 1px solid rgba(0,0,0,0.05);
                }
                .pulse-circle {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    animation: pulse 2s infinite;
                }
                .pulse-circle.active {
                    background: #10b981;
                }
                .pulse-circle.inactive {
                    background: #94a3b8;
                }
                @keyframes pulse {
                    0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
                    70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
                }
                .time-display {
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: #1a1a2e;
                    font-family: 'JetBrains Mono', monospace;
                }
                .date-display {
                    font-size: 0.8rem;
                    color: #64748b;
                }

                /* Stat Cards */
                .stat-card-pro {
                    border-radius: 20px;
                    padding: 1.5rem;
                    color: white;
                    position: relative;
                    overflow: hidden;
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 10px 40px rgba(0,0,0,0.15);
                }
                .stat-card-pro:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 20px 50px rgba(0,0,0,0.25);
                }
                .stat-content {
                    position: relative;
                    z-index: 2;
                    display: flex;
                    align-items: flex-start;
                    gap: 1rem;
                }
                .stat-icon-wrapper {
                    width: 50px;
                    height: 50px;
                    background: rgba(255,255,255,0.2);
                    backdrop-filter: blur(10px);
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.5rem;
                }
                .stat-info {
                    flex: 1;
                }
                .stat-title {
                    font-size: 0.8rem;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    opacity: 0.9;
                }
                .stat-value {
                    font-size: 1.75rem;
                    font-weight: 800;
                    margin: 0.25rem 0;
                    letter-spacing: -0.02em;
                }
                .stat-footer {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    font-size: 0.75rem;
                }
                .stat-change {
                    background: rgba(255,255,255,0.2);
                    padding: 0.2rem 0.5rem;
                    border-radius: 20px;
                    font-weight: 600;
                }
                .stat-subtitle {
                    opacity: 0.8;
                }
                .stat-decoration {
                    position: absolute;
                    right: -20px;
                    bottom: -20px;
                    width: 120px;
                    height: 120px;
                    background: rgba(255,255,255,0.1);
                    border-radius: 50%;
                }

                /* Glass Cards */
                .glass-card {
                    background: white;
                    border: 1px solid rgba(0,0,0,0.05);
                    border-radius: 20px;
                    box-shadow: 0 4px 30px rgba(0,0,0,0.05);
                    overflow: hidden;
                    transition: all 0.3s ease;
                }
                .glass-card:hover {
                    box-shadow: 0 10px 40px rgba(0,0,0,0.08);
                }
                .glass-header {
                    background: linear-gradient(180deg, #fafafa 0%, #fff 100%);
                    border-bottom: 1px solid rgba(0,0,0,0.05);
                    padding: 1.25rem 1.5rem;
                }
                .header-badge {
                    width: 42px;
                    height: 42px;
                    background: linear-gradient(135deg, #dc3545, #c82333);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 1.1rem;
                }
                .btn-modern {
                    background: linear-gradient(135deg, #1a1a2e, #16213e);
                    border: none;
                    border-radius: 10px;
                    padding: 0.5rem 1.25rem;
                    font-weight: 600;
                    font-size: 0.85rem;
                    color: white;
                    transition: all 0.3s ease;
                    text-decoration: none;
                }
                .btn-modern:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 5px 20px rgba(26, 26, 46, 0.3);
                    color: white;
                }

                /* Modern Table */
                .modern-table {
                    margin: 0;
                }
                .modern-table thead tr {
                    background: #f8fafc;
                }
                .modern-table th {
                    padding: 1rem 1.5rem;
                    font-size: 0.7rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    color: #64748b;
                    border: none;
                }
                .modern-table td {
                    padding: 1rem 1.5rem;
                    vertical-align: middle;
                    border-color: #f1f5f9;
                }
                .job-row {
                    transition: all 0.2s ease;
                    cursor: pointer;
                }
                .job-row:hover {
                    background: #f8fafc;
                }
                .job-id {
                    font-family: 'JetBrains Mono', monospace;
                    font-weight: 700;
                    color: #dc3545;
                    font-size: 0.85rem;
                }
                .customer-info {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }
                .customer-avatar {
                    width: 36px;
                    height: 36px;
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: 700;
                    font-size: 0.9rem;
                }
                .customer-name {
                    font-weight: 600;
                    color: #1a1a2e;
                }
                .service-type {
                    color: #475569;
                    font-weight: 500;
                }
                .fee-amount {
                    font-weight: 700;
                    color: #10b981;
                }

                /* Profile Card */
                .profile-image-large {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    object-fit: cover;
                    border: 4px solid white;
                    box-shadow: 0 8px 30px rgba(0,0,0,0.12);
                }
                .profile-placeholder-large {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #dc3545, #c82333);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 2rem;
                    font-weight: 700;
                    margin: 0 auto;
                    box-shadow: 0 8px 30px rgba(220, 53, 69, 0.3);
                }
                .profile-stats-row {
                    display: flex;
                    justify-content: center;
                    gap: 1.5rem;
                    padding: 1rem 0;
                    border-top: 1px solid #f1f5f9;
                    margin-top: 1rem;
                }
                .profile-stat-item {
                    text-align: center;
                }
                .profile-stat-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1rem;
                    margin: 0 auto 0.5rem;
                }
                .profile-stat-value {
                    font-size: 1.1rem;
                    font-weight: 700;
                    color: #1a1a2e;
                }
                .profile-stat-label {
                    font-size: 0.7rem;
                    color: #94a3b8;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                /* Quick Actions Grid */
                .quick-actions-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 0.75rem;
                }
                .quick-action-tile {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 1.25rem 0.75rem;
                    background: #f8fafc;
                    border-radius: 14px;
                    text-decoration: none;
                    color: #475569;
                    transition: all 0.3s ease;
                    border: 1px solid transparent;
                }
                .quick-action-tile:hover {
                    background: white;
                    border-color: #dc3545;
                    color: #dc3545;
                    transform: translateY(-3px);
                    box-shadow: 0 8px 25px rgba(220, 53, 69, 0.15);
                }
                .quick-action-tile i {
                    font-size: 1.5rem;
                    margin-bottom: 0.5rem;
                }
                .quick-action-tile span {
                    font-size: 0.75rem;
                    font-weight: 600;
                }

                /* Performance Cards */
                .performance-card {
                    background: white;
                    border: 1px solid rgba(0,0,0,0.05);
                    border-radius: 20px;
                    overflow: hidden;
                    transition: all 0.3s ease;
                }
                .performance-card:hover {
                    box-shadow: 0 10px 40px rgba(0,0,0,0.08);
                }
                .performance-card.highlight {
                    background: linear-gradient(135deg, #fff5f5 0%, #fff 100%);
                    border-color: rgba(220, 53, 69, 0.1);
                }
                .performance-icon {
                    width: 60px;
                    height: 60px;
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.75rem;
                }
                .performance-icon.success {
                    background: linear-gradient(135deg, #10b981, #059669);
                    color: white;
                }
                .performance-icon.warning {
                    background: linear-gradient(135deg, #f59e0b, #d97706);
                    color: white;
                }
                .btn-action {
                    background: linear-gradient(135deg, #dc3545, #c82333);
                    border: none;
                    border-radius: 8px;
                    padding: 0.5rem 1rem;
                    font-weight: 600;
                    font-size: 0.8rem;
                    color: white;
                    text-decoration: none;
                }
                .btn-action:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 5px 20px rgba(220, 53, 69, 0.3);
                    color: white;
                }

                /* Empty State */
                .empty-state {
                    padding: 4rem 2rem;
                    text-align: center;
                    color: #64748b;
                }
                .empty-state i {
                    font-size: 4rem;
                    opacity: 0.3;
                    margin-bottom: 1rem;
                    display: block;
                }
                .empty-state h5 {
                    color: #1a1a2e;
                    margin-bottom: 0.5rem;
                }
            `}} />
        </Layout>
    );
}
