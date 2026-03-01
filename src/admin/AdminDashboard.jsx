import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Table, ProgressBar } from 'react-bootstrap';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import AdminLayout from '../components/AdminLayout';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalTickets: 0,
        activeTickets: 0,
        completedTickets: 0,
        totalUsers: 0,
        totalTechnicians: 0,
        pendingApplications: 0,
        todayRevenue: 0
    });
    const [recentTickets, setRecentTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const ticketsQuery = query(collection(db, 'tickets'));
                const ticketsSnapshot = await getDocs(ticketsQuery);
                const tickets = ticketsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                const activeStatuses = ['Pending', 'Assigned', 'Scheduled', 'On the Way', 'In Progress', 'Quoted'];
                const activeTickets = tickets.filter(t => activeStatuses.includes(t.status));
                const completedTickets = tickets.filter(t => ['Completed', 'Finished'].includes(t.status));

                const usersSnapshot = await getDocs(collection(db, 'users'));
                const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                const technicians = users.filter(u => u.role?.toLowerCase() === 'technician');

                const appsSnapshot = await getDocs(query(collection(db, 'technician_applications'), where('status', '==', 'pending')));

                // Calculate revenue from completed tickets
                const revenue = completedTickets.reduce((sum, t) => sum + (t.serviceFee || 0), 0);

                setStats({
                    totalTickets: tickets.length,
                    activeTickets: activeTickets.length,
                    completedTickets: completedTickets.length,
                    totalUsers: users.length,
                    totalTechnicians: technicians.length,
                    pendingApplications: appsSnapshot.docs.length,
                    todayRevenue: revenue
                });

                setRecentTickets(tickets.slice(0, 6));
                setLoading(false);
            } catch (error) {
                console.error('Error fetching stats:', error);
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const getStatusBadge = (status) => {
        const statusMap = {
            'Pending': { bg: 'warning', icon: 'bi-clock' },
            'Assigned': { bg: 'info', icon: 'bi-person-check' },
            'Scheduled': { bg: 'primary', icon: 'bi-calendar-event' },
            'In Progress': { bg: 'info', icon: 'bi-gear-wide-connected' },
            'Completed': { bg: 'success', icon: 'bi-check-circle' },
            'Finished': { bg: 'success', icon: 'bi-trophy' },
            'Cancelled': { bg: 'danger', icon: 'bi-x-circle' }
        };
        const config = statusMap[status] || { bg: 'secondary', icon: 'bi-question-circle' };
        return (
            <Badge bg={config.bg} className="d-flex align-items-center gap-1 px-2 py-1">
                <i className={`bi ${config.icon}`}></i> {status}
            </Badge>
        );
    };

    const quickStats = [
        {
            title: 'Total Tickets',
            value: stats.totalTickets,
            icon: 'bi-ticket-detailed',
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            change: '+12%',
            subtitle: 'All time'
        },
        {
            title: 'Active Now',
            value: stats.activeTickets,
            icon: 'bi-lightning-charge',
            gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            change: '+5%',
            subtitle: 'In progress'
        },
        {
            title: 'Completed',
            value: stats.completedTickets,
            icon: 'bi-check2-all',
            gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            change: '+18%',
            subtitle: 'Successfully done'
        },
        {
            title: 'Revenue',
            value: `LKR ${stats.todayRevenue.toLocaleString()}`,
            icon: 'bi-currency-dollar',
            gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            change: '+25%',
            subtitle: 'Total earnings'
        }
    ];

    const teamStats = [
        { title: 'Total Users', value: stats.totalUsers, icon: 'bi-people', color: '#8b5cf6' },
        { title: 'Registered Experts', value: stats.totalTechnicians, icon: 'bi-person-badge', color: '#dc3545' },
        { title: 'Applications', value: stats.pendingApplications, icon: 'bi-file-earmark-person', color: '#ec4899' }
    ];

    return (
        <AdminLayout>
            <div className="admin-dashboard-pro">
                {/* Header Section */}
                <div className="dashboard-header mb-5">
                    <Row className="align-items-center">
                        <Col>
                            <div className="d-flex align-items-center gap-3 mb-2">
                                <div className="header-icon">
                                    <i className="bi bi-speedometer2"></i>
                                </div>
                                <div>
                                    <h1 className="dashboard-title mb-0">Command Center</h1>
                                    <p className="dashboard-subtitle mb-0">
                                        Welcome back, Administrator
                                    </p>
                                </div>
                            </div>
                        </Col>
                        <Col xs="auto" className="d-none d-md-block">
                            <div className="live-time-card">
                                <div className="d-flex align-items-center gap-3">
                                    <div className="pulse-circle"></div>
                                    <div>
                                        <div className="time-display">{currentTime.toLocaleTimeString()}</div>
                                        <div className="date-display">{currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</div>
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
                    {/* Recent Tickets */}
                    <Col lg={8}>
                        <Card className="glass-card h-100">
                            <Card.Header className="glass-header">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="header-badge">
                                            <i className="bi bi-ticket-detailed"></i>
                                        </div>
                                        <div>
                                            <h5 className="fw-bold mb-0">Recent Tickets</h5>
                                            <small className="text-muted">Latest service requests</small>
                                        </div>
                                    </div>
                                    <Button as={Link} to="/admin/tickets" className="btn-modern">
                                        View All <i className="bi bi-arrow-right ms-2"></i>
                                    </Button>
                                </div>
                            </Card.Header>
                            <Card.Body className="p-0">
                                {loading ? (
                                    <div className="loading-state">
                                        <div className="loading-spinner"></div>
                                        <p>Loading tickets...</p>
                                    </div>
                                ) : recentTickets.length > 0 ? (
                                    <div className="table-responsive">
                                        <Table className="modern-table mb-0">
                                            <thead>
                                                <tr>
                                                    <th>Ticket</th>
                                                    <th>Customer</th>
                                                    <th>Service</th>
                                                    <th>Status</th>
                                                    <th>Date</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {recentTickets.map(ticket => (
                                                    <tr key={ticket.id} className="ticket-row">
                                                        <td>
                                                            <div className="ticket-id">
                                                                #{ticket.id.slice(0, 8).toUpperCase()}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="customer-info">
                                                                <div className="customer-avatar">
                                                                    {(ticket.customerName || 'U').charAt(0).toUpperCase()}
                                                                </div>
                                                                <span>{ticket.customerName || 'Unknown'}</span>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="service-type">
                                                                <i className="bi bi-gear me-2"></i>
                                                                {ticket.applianceType}
                                                            </div>
                                                        </td>
                                                        <td>{getStatusBadge(ticket.status)}</td>
                                                        <td>
                                                            <span className="date-text">
                                                                {ticket.createdAt?.toDate ? ticket.createdAt.toDate().toLocaleDateString() : 'N/A'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    </div>
                                ) : (
                                    <div className="empty-state">
                                        <i className="bi bi-inbox"></i>
                                        <h5>No Tickets Yet</h5>
                                        <p>New service requests will appear here</p>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Right Sidebar */}
                    <Col lg={4}>
                        {/* Team Overview */}
                        <Card className="glass-card mb-4">
                            <Card.Header className="glass-header">
                                <div className="d-flex align-items-center gap-3">
                                    <div className="header-badge">
                                        <i className="bi bi-people"></i>
                                    </div>
                                    <div>
                                        <h5 className="fw-bold mb-0">Team Overview</h5>
                                        <small className="text-muted">Platform members</small>
                                    </div>
                                </div>
                            </Card.Header>
                            <Card.Body>
                                {teamStats.map((stat, idx) => (
                                    <div key={idx} className="team-stat-item">
                                        <div className="d-flex align-items-center gap-3">
                                            <div className="team-stat-icon" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                                                <i className={`bi ${stat.icon}`}></i>
                                            </div>
                                            <div className="flex-grow-1">
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <span className="team-stat-title">{stat.title}</span>
                                                    <span className="team-stat-value" style={{ color: stat.color }}>{stat.value}</span>
                                                </div>
                                                <ProgressBar
                                                    now={Math.min(stat.value * 10, 100)}
                                                    className="team-progress"
                                                    style={{ '--progress-color': stat.color }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
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
                                        <small className="text-muted">Common tasks</small>
                                    </div>
                                </div>
                            </Card.Header>
                            <Card.Body className="p-3">
                                <div className="quick-actions-grid">
                                    <Link to="/admin/tickets" className="quick-action-tile">
                                        <i className="bi bi-ticket-detailed"></i>
                                        <span>Tickets</span>
                                    </Link>
                                    <Link to="/admin/users" className="quick-action-tile">
                                        <i className="bi bi-people"></i>
                                        <span>Users</span>
                                    </Link>
                                    <Link to="/admin/technicians" className="quick-action-tile">
                                        <i className="bi bi-person-badge"></i>
                                        <span>Experts</span>
                                    </Link>
                                    <Link to="/admin/applications" className="quick-action-tile">
                                        <i className="bi bi-file-earmark-text"></i>
                                        <span>Apply</span>
                                    </Link>
                                    <Link to="/admin/analytics" className="quick-action-tile">
                                        <i className="bi bi-graph-up"></i>
                                        <span>Analytics</span>
                                    </Link>
                                    <Link to="/admin/settings" className="quick-action-tile">
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
                                        <h4 className="fw-bold mb-1">Platform Growing!</h4>
                                        <p className="text-muted mb-0">Your service requests have increased this month. Keep up the momentum!</p>
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
                                        <i className="bi bi-bell"></i>
                                    </div>
                                    <div className="flex-grow-1">
                                        <h4 className="fw-bold mb-1">{stats.pendingApplications} Pending Applications</h4>
                                        <p className="text-muted mb-2">Review new expert applications</p>
                                        <Button as={Link} to="/admin/applications" size="sm" className="btn-action">
                                            Review Now <i className="bi bi-arrow-right ms-1"></i>
                                        </Button>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .admin-dashboard-pro {
                    min-height: 100vh;
                    padding: 0;
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
                    background: #10b981;
                    border-radius: 50%;
                    animation: pulse 2s infinite;
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
                .stat-decoration::after {
                    content: '';
                    position: absolute;
                    right: 30px;
                    top: 30px;
                    width: 60px;
                    height: 60px;
                    background: rgba(255,255,255,0.08);
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
                }
                .btn-modern:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 5px 20px rgba(26, 26, 46, 0.3);
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
                .ticket-row {
                    transition: all 0.2s ease;
                }
                .ticket-row:hover {
                    background: #f8fafc;
                }
                .ticket-id {
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
                .service-type {
                    color: #475569;
                    font-weight: 500;
                }
                .date-text {
                    color: #64748b;
                    font-size: 0.85rem;
                }

                /* Team Stats */
                .team-stat-item {
                    padding: 1rem 0;
                    border-bottom: 1px solid #f1f5f9;
                }
                .team-stat-item:last-child {
                    border-bottom: none;
                }
                .team-stat-icon {
                    width: 44px;
                    height: 44px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.25rem;
                }
                .team-stat-title {
                    font-size: 0.9rem;
                    color: #475569;
                }
                .team-stat-value {
                    font-size: 1.1rem;
                    font-weight: 700;
                }
                .team-progress {
                    height: 4px;
                    background: #e2e8f0;
                    border-radius: 2px;
                    margin-top: 0.5rem;
                }
                .team-progress .progress-bar {
                    background: var(--progress-color) !important;
                    border-radius: 2px;
                }

                /* Quick Actions Grid */
                .quick-actions-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
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
                }
                .btn-action:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 5px 20px rgba(220, 53, 69, 0.3);
                }

                /* Loading & Empty States */
                .loading-state, .empty-state {
                    padding: 4rem 2rem;
                    text-align: center;
                    color: #64748b;
                }
                .loading-spinner {
                    width: 40px;
                    height: 40px;
                    border: 3px solid #f3f3f3;
                    border-top: 3px solid #dc3545;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 1rem;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                .empty-state i {
                    font-size: 4rem;
                    opacity: 0.3;
                    margin-bottom: 1rem;
                }
            `}} />
        </AdminLayout>
    );
}
