import React, { useEffect, useState } from 'react';
import { Container, Button, Row, Col, Badge, Form } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, limit, onSnapshot } from 'firebase/firestore';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
import Layout from '../components/Layout';
import TechnicianApplicationModal from '../components/TechnicianApplicationModal';
import technicianImg from '../assets/technician-main.jpg';
import heroImg from '../assets/hero-main.jpg';

// --- Constants ---
const CATEGORIES = [
    { icon: "bi-snow2", title: "Refrigerator", id: "Refrigerator", gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" },
    { icon: "bi-droplet-fill", title: "Washing Machine", id: "Washing Machine", gradient: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)" },
    { icon: "bi-wind", title: "Air Conditioner", id: "Air Conditioner", gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" },
    { icon: "bi-tv", title: "Television", id: "Television", gradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)" },
    { icon: "bi-circle-square", title: "Microwave", id: "Microwave", gradient: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)" },
    { icon: "bi-fire", title: "Gas Stove", id: "Gas Stove", gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" },
    { icon: "bi-droplet-half", title: "Water Purifier", id: "Water Purifier", gradient: "linear-gradient(135deg, #5ee7df 0%, #b490ca 100%)" },
    { icon: "bi-cpu", title: "Laptop/PC", id: "Laptop", gradient: "linear-gradient(135deg, #c471f5 0%, #fa71cd 100%)" }
];

const DISTRICTS = [
    "Ampara", "Anuradhapura", "Badulla", "Batticaloa", "Colombo", "Galle", "Gampaha",
    "Hambantota", "Jaffna", "Kalutara", "Kandy", "Kegalle", "Kilinochchi", "Kurunegala",
    "Mannar", "Matale", "Matara", "Moneragala", "Mullaitivu", "Nuwara Eliya",
    "Polonnaruwa", "Puttalam", "Ratnapura", "Trincomalee", "Vavuniya"
];

export default function Home() {
    const { currentUser, userRole } = useAuth();
    const [recentTickets, setRecentTickets] = useState([]);
    const [showApplicationModal, setShowApplicationModal] = useState(false);
    const [heroSearch, setHeroSearch] = useState('');
    const [heroLocation, setHeroLocation] = useState('Jaffna');
    const [currentTime, setCurrentTime] = useState(new Date());
    const navigate = useNavigate();
    const location = useLocation();
    const isGuestMode = new URLSearchParams(location.search).get('guest') === 'true';
    const isStaff = userRole === 'admin' || userRole === 'technician';
    // Hide user stats if in guest mode or if the user is staff (admin/tech)
    const showStats = currentUser && !isStaff && !isGuestMode;

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!currentUser?.uid) return;

        const q = query(
            collection(db, 'tickets'),
            where('customerId', '==', currentUser.uid),
            limit(5)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const tickets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRecentTickets(tickets);
        }, (error) => {
            console.error("Dashboard Tickets Error:", error);
        });

        return unsubscribe;
    }, [currentUser?.uid]);

    const handleCreateClick = (appliance) => {
        navigate('/customer/create-ticket', { state: { applianceType: appliance } });
    };

    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    const getStatusConfig = (status) => {
        const statusMap = {
            'Pending': { bg: 'warning', color: '#f59e0b' },
            'Assigned': { bg: 'info', color: '#3b82f6' },
            'Scheduled': { bg: 'info', color: '#0ea5e9' },
            'On the Way': { bg: 'success', color: '#22c55e' },
            'In Progress': { bg: 'primary', color: '#8b5cf6' },
            'Completed': { bg: 'success', color: '#10b981' },
            'Cancelled': { bg: 'danger', color: '#ef4444' }
        };
        return statusMap[status] || { bg: 'secondary', color: '#64748b' };
    };

    const stats = {
        active: recentTickets.filter(t => !['Completed', 'Cancelled'].includes(t.status)).length,
        completed: recentTickets.filter(t => t.status === 'Completed').length,
        total: recentTickets.length
    };

    return (
        <Layout>
            <div className="customer-dashboard-pro">
                {/* Hero Section */}
                <section className="hero-section-pro">
                    <div className="hero-background">
                        <div className="hero-gradient-overlay"></div>
                        <div className="hero-pattern"></div>
                    </div>

                    <Container className="hero-content position-relative">
                        <Row className="align-items-center min-vh-75">
                            <Col lg={6} className="py-5">
                                <div className="hero-text">
                                    <div className="greeting-pill">
                                        <i className="bi bi-hand-wave"></i>
                                        <span>
                                            {getGreeting()}
                                            {(!isStaff && currentUser?.displayName) ? `, ${currentUser.displayName.split(' ')[0]}!` : '!'}
                                        </span>
                                    </div>

                                    <h1 className="hero-title">
                                        Expert Repairs for Your
                                        <span className="gradient-text"> Modern Home</span>
                                    </h1>

                                    <p className="hero-description">
                                        Verified technicians, genuine parts, and transparent pricing.
                                        Experience Sri Lanka's most trusted appliance repair platform.
                                    </p>

                                    {/* Search Bar */}
                                    <div className="hero-search-container">
                                        <div className="search-bar-pro">
                                            <div className="search-location">
                                                <i className="bi bi-geo-alt-fill"></i>
                                                <Form.Select
                                                    className="location-select"
                                                    value={heroLocation}
                                                    onChange={(e) => setHeroLocation(e.target.value)}
                                                >
                                                    {DISTRICTS.map(district => (
                                                        <option key={district} value={district}>{district}</option>
                                                    ))}
                                                </Form.Select>
                                            </div>
                                            <div className="search-divider"></div>
                                            <div className="search-input-wrapper">
                                                <i className="bi bi-search"></i>
                                                <Form.Control
                                                    placeholder="What needs fixing?"
                                                    className="search-input"
                                                    value={heroSearch}
                                                    onChange={(e) => setHeroSearch(e.target.value)}
                                                />
                                            </div>
                                            <Button
                                                className="search-button"
                                                onClick={() => navigate('/customer/create-ticket', {
                                                    state: {
                                                        applianceType: heroSearch,
                                                        city: heroLocation
                                                    }
                                                })}
                                            >
                                                Book Now
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Trust Badges */}
                                    <div className="trust-badges">
                                        <div className="trust-badge">
                                            <i className="bi bi-shield-check"></i>
                                            <span>Warranty Protection</span>
                                        </div>
                                        <div className="trust-badge">
                                            <i className="bi bi-clock-history"></i>
                                            <span>Same Day Service</span>
                                        </div>
                                        <div className="trust-badge">
                                            <i className="bi bi-star-fill"></i>
                                            <span>5-Star Rated</span>
                                        </div>
                                    </div>
                                </div>
                            </Col>

                            <Col lg={6} className="d-none d-lg-block">
                                <div className="hero-image-wrapper">
                                    <div className="hero-image-container">
                                        <img src={heroImg} alt="Repair Service" className="hero-image" />
                                        <div className="floating-card card-1">
                                            <i className="bi bi-check-circle-fill text-success"></i>
                                            <span>100+ Jobs Today</span>
                                        </div>
                                        <div className="floating-card card-2">
                                            <i className="bi bi-people-fill text-primary"></i>
                                            <span>500+ Technicians</span>
                                        </div>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                    </Container>
                </section>

                {/* Quick Stats */}
                {showStats && (
                    <section className="stats-section">
                        <Container>
                            <Row className="g-4">
                                <Col md={4}>
                                    <div className="stat-card-minimal">
                                        <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                                            <i className="bi bi-gear-wide-connected"></i>
                                        </div>
                                        <div className="stat-content">
                                            <h3 className="stat-value">{stats.active}</h3>
                                            <p className="stat-label">Active Repairs</p>
                                        </div>
                                        <div className="stat-trend positive">
                                            <i className="bi bi-arrow-up"></i> Live
                                        </div>
                                    </div>
                                </Col>
                                <Col md={4}>
                                    <div className="stat-card-minimal">
                                        <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }}>
                                            <i className="bi bi-patch-check"></i>
                                        </div>
                                        <div className="stat-content">
                                            <h3 className="stat-value">{stats.completed}</h3>
                                            <p className="stat-label">Completed Jobs</p>
                                        </div>
                                        <div className="stat-trend positive">
                                            <i className="bi bi-check2"></i> Done
                                        </div>
                                    </div>
                                </Col>
                                <Col md={4}>
                                    <div className="stat-card-minimal">
                                        <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                                            <i className="bi bi-receipt"></i>
                                        </div>
                                        <div className="stat-content">
                                            <h3 className="stat-value">{stats.total}</h3>
                                            <p className="stat-label">Total Requests</p>
                                        </div>
                                        <div className="stat-trend">
                                            <i className="bi bi-bar-chart"></i> All time
                                        </div>
                                    </div>
                                </Col>
                            </Row>
                        </Container>
                    </section>
                )}

                {/* Services Section */}
                <section className="services-section-pro">
                    <Container>
                        <div className="section-header">
                            <div className="section-badge">
                                <i className="bi bi-tools"></i> Our Services
                            </div>
                            <h2 className="section-title">What Can We Fix For You?</h2>
                            <p className="section-subtitle">
                                Professional repairs for all your home appliances. Select a service to get started.
                            </p>
                        </div>

                        <Row className="g-4">
                            {CATEGORIES.map((cat, index) => (
                                <Col lg={3} md={4} sm={6} key={cat.id}>
                                    <div
                                        className="service-card-pro"
                                        onClick={() => handleCreateClick(cat.id)}
                                        style={{ '--card-gradient': cat.gradient }}
                                    >
                                        <div className="service-icon-wrapper" style={{ background: cat.gradient }}>
                                            <i className={`bi ${cat.icon}`}></i>
                                        </div>
                                        <h5 className="service-title">{cat.title}</h5>
                                        <p className="service-description">Expert repair & maintenance</p>
                                        <Button className="service-button">
                                            Book Now <i className="bi bi-arrow-right"></i>
                                        </Button>
                                    </div>
                                </Col>
                            ))}
                        </Row>

                        <div className="text-center mt-5">
                            <Button as={Link} to="/customer/services" variant="link" className="view-all-link">
                                Explore All 25+ Services <i className="bi bi-arrow-right"></i>
                            </Button>
                        </div>
                    </Container>
                </section>

                {/* Recent Tickets Section */}
                {recentTickets.filter(t => !['Completed', 'Cancelled'].includes(t.status)).length > 0 && (
                    <section className="tickets-section-pro">
                        <Container>
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <div>
                                    <h3 className="section-title mb-1">Your Active Requests</h3>
                                    <p className="text-muted mb-0">Track your ongoing repairs in real-time</p>
                                </div>
                                <Button as={Link} to="/customer/my-tickets" className="btn-outline-pro">
                                    View All <i className="bi bi-arrow-right ms-2"></i>
                                </Button>
                            </div>

                            <Row className="g-4">
                                {recentTickets
                                    .filter(t => !['Completed', 'Cancelled'].includes(t.status))
                                    .slice(0, 3)
                                    .map(ticket => {
                                        const statusConfig = getStatusConfig(ticket.status);
                                        return (
                                            <Col lg={4} md={6} key={ticket.id}>
                                                <div className="ticket-card-pro h-100 d-flex flex-column">
                                                    <div className="ticket-header">
                                                        <div className="ticket-icon-wrapper">
                                                            <i className="bi bi-tools"></i>
                                                        </div>
                                                        <div className="ticket-info">
                                                            <h6 className="ticket-appliance">{ticket.applianceType}</h6>
                                                            <span className="ticket-id">#{ticket.id.slice(-6).toUpperCase()}</span>
                                                        </div>
                                                        <Badge bg={statusConfig.bg} className="ticket-status px-3 py-2 rounded-pill fw-bold">
                                                            {ticket.status}
                                                        </Badge>
                                                    </div>
                                                    <p className="ticket-description flex-grow-1">{ticket.issue || ticket.description?.substring(0, 80)}...</p>

                                                    {ticket.status === 'On the Way' && (
                                                        <div className="mb-3">
                                                            <Button
                                                                variant="success"
                                                                className="w-100 rounded-pill fw-bold d-flex align-items-center justify-content-center gap-2 py-2"
                                                                style={{ animation: 'statusPulse 2.5s infinite' }}
                                                                onClick={() => navigate('/customer/tracking')}
                                                            >
                                                                <i className="bi bi-geo-alt-fill"></i> Track Expert Live
                                                            </Button>
                                                        </div>
                                                    )}

                                                    <div className="ticket-footer">
                                                        <div className="ticket-date">
                                                            <i className="bi bi-calendar3"></i>
                                                            <span>
                                                                {ticket.createdAt?.toDate ?
                                                                    ticket.createdAt.toDate().toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
                                                                    : 'Today'}
                                                            </span>
                                                        </div>
                                                        <Link to={ticket.status === 'On the Way' ? "/customer/tracking" : `/customer/tickets/${ticket.id}`} className="track-link fw-black d-flex align-items-center gap-1">
                                                            {ticket.status === 'On the Way' ? 'Live Map' : 'Details'} <i className="bi bi-chevron-right"></i>
                                                        </Link>
                                                    </div>
                                                </div>
                                            </Col>
                                        );
                                    })}
                            </Row>
                        </Container>
                    </section>
                )}

                {/* Why FixZone Section */}
                <section className="why-section-pro">
                    <Container>
                        <Row className="align-items-center g-5">
                            <Col lg={6}>
                                <div className="section-badge mb-4">
                                    <i className="bi bi-award"></i> Why Choose Us
                                </div>
                                <h2 className="why-title">The FixZone Difference</h2>

                                <div className="features-list">
                                    <div className="feature-item">
                                        <div className="feature-icon">
                                            <i className="bi bi-receipt-cutoff"></i>
                                        </div>
                                        <div className="feature-content">
                                            <h5>Transparent Pricing</h5>
                                            <p>See fixed prices before you book. No hidden charges ever.</p>
                                        </div>
                                    </div>
                                    <div className="feature-item">
                                        <div className="feature-icon">
                                            <i className="bi bi-patch-check-fill"></i>
                                        </div>
                                        <div className="feature-content">
                                            <h5>Verified Experts</h5>
                                            <p>All technicians are background-checked and certified.</p>
                                        </div>
                                    </div>
                                    <div className="feature-item">
                                        <div className="feature-icon">
                                            <i className="bi bi-tools"></i>
                                        </div>
                                        <div className="feature-content">
                                            <h5>Fully Equipped</h5>
                                            <p>We bring everything needed to get the job done right.</p>
                                        </div>
                                    </div>
                                </div>
                            </Col>

                            <Col lg={6}>
                                <div className="quality-card">
                                    <div className="quality-badge">
                                        <i className="bi bi-shield-fill-check"></i>
                                    </div>
                                    <h3>100% Quality Assured</h3>
                                    <p>If you don't love our service, we will make it right. That's our promise.</p>
                                    <div className="quality-stats">
                                        <div className="quality-stat">
                                            <span className="stat-number">50K+</span>
                                            <span className="stat-label">Happy Customers</span>
                                        </div>
                                        <div className="quality-stat">
                                            <span className="stat-number">4.9</span>
                                            <span className="stat-label">Average Rating</span>
                                        </div>
                                        <div className="quality-stat">
                                            <span className="stat-number">98%</span>
                                            <span className="stat-label">Satisfaction</span>
                                        </div>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                    </Container>
                </section>

                {/* Become a Technician CTA */}
                <section className="cta-section-pro">
                    <Container>
                        <div className="cta-card">
                            <Row className="g-0 align-items-stretch">
                                <Col lg={6} className="cta-content">
                                    <div className="cta-badge">
                                        <span className="pulse-dot"></span>
                                        We're Hiring Experts
                                    </div>
                                    <h2 className="cta-title">
                                        Turn Your Skills Into
                                        <span className="highlight"> Significant Earnings</span>
                                    </h2>
                                    <p className="cta-description">
                                        Join Sri Lanka's #1 repair network. We provide the customers,
                                        you provide the expertise. Simple, transparent, and rewarding.
                                    </p>

                                    <div className="cta-features">
                                        <div className="cta-feature">
                                            <i className="bi bi-wallet2 text-success"></i>
                                            <div>
                                                <h6>Weekly Payouts</h6>
                                                <small>Direct to bank</small>
                                            </div>
                                        </div>
                                        <div className="cta-feature">
                                            <i className="bi bi-calendar-check text-primary"></i>
                                            <div>
                                                <h6>Flexible Hours</h6>
                                                <small>You're the boss</small>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="cta-actions">
                                        <Button className="btn-apply" onClick={() => setShowApplicationModal(true)}>
                                            Apply Now <i className="bi bi-arrow-right ms-2"></i>
                                        </Button>
                                        <a
                                            href="#how-it-works"
                                            className="learn-more-link"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                document.getElementById('how-it-works')?.scrollIntoView({
                                                    behavior: 'smooth',
                                                    block: 'start'
                                                });
                                            }}
                                        >
                                            How it works
                                        </a>
                                    </div>
                                </Col>
                                <Col lg={6} className="cta-image-col d-none d-lg-block">
                                    <div className="cta-image-wrapper">
                                        <img src={technicianImg} alt="Join our team" className="cta-image" />
                                        <div className="cta-overlay-card">
                                            <div className="avatar-stack">
                                                <img src="https://i.pravatar.cc/150?u=1" alt="" />
                                                <img src="https://i.pravatar.cc/150?u=2" alt="" />
                                                <img src="https://i.pravatar.cc/150?u=3" alt="" />
                                            </div>
                                            <div>
                                                <strong>Join 1.2k+ Pros</strong>
                                                <small className="d-block text-muted">"FixZone changed my life!"</small>
                                            </div>
                                        </div>
                                    </div>
                                </Col>
                            </Row>
                        </div>
                    </Container>
                </section>

                {/* How It Works Section */}
                <section id="how-it-works" className="py-5 bg-light">
                    <Container className="py-5">
                        <div className="text-center mb-5">
                            <span className="badge bg-white text-danger border border-danger-subtle rounded-pill px-3 py-2 mb-3 shadow-sm">
                                <i className="bi bi-info-circle-fill me-2"></i>PROCESS
                            </span>
                            <h2 className="fw-bold display-6 mb-3">How It Works</h2>
                            <p className="text-muted lead mx-auto" style={{ maxWidth: '600px' }}>
                                Joining FixZone as a professional is simple. Start earning in 3 easy steps.
                            </p>
                        </div>

                        <Row className="g-4">
                            <Col md={4}>
                                <div className="card h-100 border-0 shadow-sm bg-white text-center p-4 rounded-4 hover-lift transition-all">
                                    <div className="mb-4 position-relative mx-auto mt-3" style={{ width: '80px', height: '80px' }}>
                                        <div className="position-absolute top-0 start-0 w-100 h-100 rounded-circle bg-danger bg-opacity-10 animate-pulse"></div>
                                        <div className="position-relative w-100 h-100 rounded-circle bg-white shadow-sm d-flex align-items-center justify-content-center border border-danger border-opacity-10">
                                            <span className="fw-black fs-2 text-danger">1</span>
                                        </div>
                                    </div>
                                    <h4 className="fw-bold mb-3">Apply Online</h4>
                                    <p className="text-muted mb-0">
                                        Fill out our simple application form with your skills and experience details. It only takes 5 minutes.
                                    </p>
                                </div>
                            </Col>
                            <Col md={4}>
                                <div className="card h-100 border-0 shadow-sm bg-white text-center p-4 rounded-4 hover-lift transition-all">
                                    <div className="mb-4 position-relative mx-auto mt-3" style={{ width: '80px', height: '80px' }}>
                                        <div className="position-absolute top-0 start-0 w-100 h-100 rounded-circle bg-danger bg-opacity-10 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                                        <div className="position-relative w-100 h-100 rounded-circle bg-white shadow-sm d-flex align-items-center justify-content-center border border-danger border-opacity-10">
                                            <span className="fw-black fs-2 text-danger">2</span>
                                        </div>
                                    </div>
                                    <h4 className="fw-bold mb-3">Get Verified</h4>
                                    <p className="text-muted mb-0">
                                        Our team will review your profile and verify your credentials to ensure quality standards.
                                    </p>
                                </div>
                            </Col>
                            <Col md={4}>
                                <div className="card h-100 border-0 shadow-sm bg-white text-center p-4 rounded-4 hover-lift transition-all">
                                    <div className="mb-4 position-relative mx-auto mt-3" style={{ width: '80px', height: '80px' }}>
                                        <div className="position-absolute top-0 start-0 w-100 h-100 rounded-circle bg-danger bg-opacity-10 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                                        <div className="position-relative w-100 h-100 rounded-circle bg-white shadow-sm d-flex align-items-center justify-content-center border border-danger border-opacity-10">
                                            <span className="fw-black fs-2 text-danger">3</span>
                                        </div>
                                    </div>
                                    <h4 className="fw-bold mb-3">Start Earning</h4>
                                    <p className="text-muted mb-0">
                                        Once approved, you'll start receiving job requests in your area immediately.
                                    </p>
                                </div>
                            </Col>
                        </Row>
                    </Container>
                </section>

                <TechnicianApplicationModal
                    show={showApplicationModal}
                    onHide={() => setShowApplicationModal(false)}
                />
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .customer-dashboard-pro {
                    overflow-x: hidden;
                    background: #fff;
                }

                /* Hero Section */
                .hero-section-pro {
                    position: relative;
                    min-height: 85vh;
                    display: flex;
                    align-items: center;
                    overflow: hidden;
                }
                .hero-background {
                    position: absolute;
                    inset: 0;
                    z-index: 0;
                }
                .hero-gradient-overlay {
                    position: absolute;
                    top: 0;
                    right: 0;
                    width: 50%;
                    height: 100%;
                    background: linear-gradient(135deg, #dc3545 0%, #b91c1c 100%);
                    clip-path: polygon(20% 0, 100% 0, 100% 100%, 0% 100%);
                }
                .hero-pattern {
                    position: absolute;
                    inset: 0;
                    background-image: radial-gradient(circle at 2px 2px, rgba(0,0,0,0.03) 1px, transparent 0);
                    background-size: 40px 40px;
                }
                .hero-content {
                    position: relative;
                    z-index: 10;
                }
                .min-vh-75 {
                    min-height: 75vh;
                }
                .greeting-pill {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 1rem;
                    background: linear-gradient(135deg, #fef3c7, #fde68a);
                    border-radius: 30px;
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: #92400e;
                    margin-bottom: 1.5rem;
                }
                .hero-title {
                    font-size: 3.5rem;
                    font-weight: 800;
                    color: #1e293b;
                    line-height: 1.1;
                    margin-bottom: 1.5rem;
                    letter-spacing: -0.02em;
                }
                .gradient-text {
                    background: linear-gradient(135deg, #dc3545, #b91c1c);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                .hero-description {
                    font-size: 1.15rem;
                    color: #64748b;
                    max-width: 480px;
                    margin-bottom: 2rem;
                    line-height: 1.7;
                }

                /* Search Bar */
                .hero-search-container {
                    margin-bottom: 2rem;
                }
                .search-bar-pro {
                    display: flex;
                    align-items: center;
                    background: white;
                    border-radius: 60px;
                    padding: 0.5rem;
                    box-shadow: 0 10px 50px rgba(0,0,0,0.1);
                    border: 1px solid #e2e8f0;
                    max-width: 600px;
                }
                .search-location {
                    display: flex;
                    align-items: center;
                    padding: 0 1rem;
                    color: #dc3545;
                }
                .location-select {
                    border: none;
                    background: transparent;
                    font-weight: 600;
                    color: #1e293b;
                    cursor: pointer;
                    width: 130px;
                }
                .location-select:focus {
                    box-shadow: none;
                }
                .search-divider {
                    width: 1px;
                    height: 30px;
                    background: #e2e8f0;
                }
                .search-input-wrapper {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    padding: 0 1rem;
                    color: #94a3b8;
                }
                .search-input {
                    border: none;
                    background: transparent;
                    font-weight: 500;
                }
                .search-input:focus {
                    box-shadow: none;
                }
                .search-button {
                    background: linear-gradient(135deg, #dc3545, #b91c1c);
                    border: none;
                    border-radius: 50px;
                    padding: 0.85rem 2rem;
                    font-weight: 700;
                    color: white;
                    transition: all 0.3s ease;
                }
                .search-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 30px rgba(220, 53, 69, 0.4);
                }

                /* Trust Badges */
                .trust-badges {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 1.5rem;
                }
                .trust-badge {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: #475569;
                }
                .trust-badge i {
                    color: #10b981;
                    font-size: 1.1rem;
                }

                /* Hero Image */
                .hero-image-wrapper {
                    position: relative;
                    padding: 2rem;
                }
                .hero-image-container {
                    position: relative;
                }
                .hero-image {
                    width: 100%;
                    height: 500px;
                    object-fit: cover;
                    border-radius: 30px;
                    box-shadow: 0 30px 60px rgba(0,0,0,0.15);
                }
                .floating-card {
                    position: absolute;
                    background: white;
                    padding: 1rem 1.5rem;
                    border-radius: 16px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.12);
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    font-weight: 600;
                    animation: float 3s ease-in-out infinite;
                }
                .floating-card.card-1 {
                    top: 10%;
                    left: -10%;
                }
                .floating-card.card-2 {
                    bottom: 15%;
                    right: -5%;
                    animation-delay: 1.5s;
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }

                /* Stats Section */
                .stats-section {
                    padding: 3rem 0;
                    margin-top: -3rem;
                    position: relative;
                    z-index: 20;
                }
                .stat-card-minimal {
                    background: white;
                    border-radius: 20px;
                    padding: 1.5rem;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    box-shadow: 0 4px 30px rgba(0,0,0,0.05);
                    border: 1px solid rgba(0,0,0,0.05);
                    transition: all 0.3s ease;
                }
                .stat-card-minimal:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 15px 40px rgba(0,0,0,0.1);
                }
                .stat-icon-wrapper {
                    width: 56px;
                    height: 56px;
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 1.5rem;
                }
                .stat-content {
                    flex: 1;
                }
                .stat-value {
                    font-size: 1.75rem;
                    font-weight: 800;
                    color: #1e293b;
                    margin: 0;
                }
                .stat-label {
                    font-size: 0.85rem;
                    color: #64748b;
                    margin: 0;
                }
                .stat-trend {
                    font-size: 0.75rem;
                    padding: 0.35rem 0.75rem;
                    border-radius: 20px;
                    background: #f1f5f9;
                    color: #64748b;
                    font-weight: 600;
                }
                .stat-trend.positive {
                    background: #dcfce7;
                    color: #16a34a;
                }

                /* Services Section */
                .services-section-pro {
                    padding: 5rem 0;
                    background: linear-gradient(180deg, #f8fafc 0%, #fff 100%);
                }
                .section-header {
                    text-align: center;
                    max-width: 600px;
                    margin: 0 auto 3rem;
                }
                .section-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 1rem;
                    background: linear-gradient(135deg, #fef2f2, #fee2e2);
                    color: #dc3545;
                    border-radius: 30px;
                    font-size: 0.85rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    margin-bottom: 1rem;
                }
                .section-title {
                    font-size: 2.5rem;
                    font-weight: 800;
                    color: #1e293b;
                    margin-bottom: 1rem;
                    letter-spacing: -0.02em;
                }
                .section-subtitle {
                    color: #64748b;
                    font-size: 1.1rem;
                }

                /* Service Cards */
                .service-card-pro {
                    background: white;
                    border-radius: 24px;
                    padding: 2rem;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    border: 1px solid rgba(0,0,0,0.05);
                    box-shadow: 0 4px 20px rgba(0,0,0,0.03);
                }
                .service-card-pro:hover {
                    transform: translateY(-10px);
                    box-shadow: 0 20px 50px rgba(0,0,0,0.1);
                    border-color: transparent;
                }
                .service-icon-wrapper {
                    width: 70px;
                    height: 70px;
                    border-radius: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 1.5rem;
                    font-size: 1.75rem;
                    color: white;
                    transition: all 0.3s ease;
                }
                .service-card-pro:hover .service-icon-wrapper {
                    transform: scale(1.1) rotate(5deg);
                }
                .service-title {
                    font-weight: 700;
                    color: #1e293b;
                    margin-bottom: 0.5rem;
                }
                .service-description {
                    font-size: 0.85rem;
                    color: #94a3b8;
                    margin-bottom: 1.5rem;
                }
                .service-button {
                    background: #1e293b;
                    border: none;
                    border-radius: 12px;
                    padding: 0.75rem 1.5rem;
                    font-weight: 600;
                    font-size: 0.85rem;
                    color: white;
                    transition: all 0.3s ease;
                    width: 100%;
                }
                .service-button:hover {
                    background: #0f172a;
                    transform: translateY(-2px);
                }
                .view-all-link {
                    color: #dc3545;
                    font-weight: 700;
                    text-decoration: none;
                    font-size: 1.1rem;
                }
                .view-all-link:hover {
                    text-decoration: underline;
                }

                /* Tickets Section */
                .tickets-section-pro {
                    padding: 5rem 0;
                    background: #f8fafc;
                }
                .btn-outline-pro {
                    background: transparent;
                    border: 2px solid #1e293b;
                    color: #1e293b;
                    border-radius: 12px;
                    padding: 0.75rem 1.5rem;
                    font-weight: 600;
                    transition: all 0.3s ease;
                }
                .btn-outline-pro:hover {
                    background: #1e293b;
                    color: white;
                }
                .ticket-card-pro {
                    background: white;
                    border-radius: 20px;
                    padding: 1.5rem;
                    transition: all 0.3s ease;
                    border: 1px solid rgba(0,0,0,0.05);
                }
                .ticket-card-pro:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 15px 40px rgba(0,0,0,0.08);
                }
                .ticket-header {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 1rem;
                }
                .ticket-icon-wrapper {
                    width: 48px;
                    height: 48px;
                    background: linear-gradient(135deg, #fef2f2, #fee2e2);
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #dc3545;
                    font-size: 1.25rem;
                }
                .ticket-info {
                    flex: 1;
                }
                .ticket-appliance {
                    font-weight: 700;
                    color: #1e293b;
                    margin-bottom: 0.2rem;
                }
                .ticket-id {
                    font-size: 0.75rem;
                    color: #94a3b8;
                    font-family: monospace;
                }
                .ticket-status {
                    font-size: 0.75rem;
                    padding: 0.4rem 0.8rem;
                    border-radius: 20px;
                }
                .ticket-description {
                    color: #64748b;
                    font-size: 0.9rem;
                    margin-bottom: 1rem;
                    line-height: 1.5;
                }
                .ticket-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding-top: 1rem;
                    border-top: 1px solid #f1f5f9;
                }
                .ticket-date {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.8rem;
                    color: #94a3b8;
                }
                .track-link {
                    color: #dc3545;
                    font-weight: 600;
                    font-size: 0.85rem;
                    text-decoration: none;
                }
                .track-link:hover {
                    text-decoration: underline;
                }

                /* Why Section */
                .why-section-pro {
                    padding: 5rem 0;
                }
                .why-title {
                    font-size: 2.5rem;
                    font-weight: 800;
                    color: #1e293b;
                    margin-bottom: 2rem;
                }
                .features-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }
                .feature-item {
                    display: flex;
                    gap: 1.25rem;
                    padding: 1.5rem;
                    background: #f8fafc;
                    border-radius: 20px;
                    transition: all 0.3s ease;
                }
                .feature-item:hover {
                    background: white;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.08);
                }
                .feature-icon {
                    width: 56px;
                    height: 56px;
                    background: linear-gradient(135deg, #dc3545, #b91c1c);
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 1.5rem;
                    flex-shrink: 0;
                }
                .feature-content h5 {
                    font-weight: 700;
                    color: #1e293b;
                    margin-bottom: 0.5rem;
                }
                .feature-content p {
                    color: #64748b;
                    margin: 0;
                }
                .quality-card {
                    background: linear-gradient(135deg, #fef2f2 0%, #fff1f2 100%);
                    border-radius: 30px;
                    padding: 3rem;
                    text-align: center;
                }
                .quality-badge {
                    width: 80px;
                    height: 80px;
                    background: linear-gradient(135deg, #dc3545, #b91c1c);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 2.5rem;
                    margin: 0 auto 1.5rem;
                    box-shadow: 0 10px 40px rgba(220, 53, 69, 0.3);
                }
                .quality-card h3 {
                    font-size: 2rem;
                    font-weight: 800;
                    color: #1e293b;
                    margin-bottom: 1rem;
                }
                .quality-card p {
                    color: #64748b;
                    font-size: 1.1rem;
                    margin-bottom: 2rem;
                }
                .quality-stats {
                    display: flex;
                    justify-content: center;
                    gap: 2.5rem;
                }
                .quality-stat {
                    text-align: center;
                }
                .quality-stat .stat-number {
                    display: block;
                    font-size: 1.75rem;
                    font-weight: 800;
                    color: #dc3545;
                }
                .quality-stat .stat-label {
                    font-size: 0.85rem;
                    color: #64748b;
                }

                /* CTA Section */
                .cta-section-pro {
                    padding: 5rem 0;
                    background: #f8fafc;
                }
                .cta-card {
                    background: white;
                    border-radius: 30px;
                    overflow: hidden;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.08);
                }
                .cta-content {
                    padding: 4rem;
                }
                .cta-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 1rem;
                    background: linear-gradient(135deg, #fef2f2, #fee2e2);
                    color: #dc3545;
                    border-radius: 30px;
                    font-size: 0.85rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    margin-bottom: 1.5rem;
                }
                .pulse-dot {
                    width: 8px;
                    height: 8px;
                    background: #dc3545;
                    border-radius: 50%;
                    animation: pulse 2s infinite;
                }
                @keyframes pulse {
                    0% { box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.4); }
                    70% { box-shadow: 0 0 0 10px rgba(220, 53, 69, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(220, 53, 69, 0); }
                }
                .cta-title {
                    font-size: 2.5rem;
                    font-weight: 800;
                    color: #1e293b;
                    line-height: 1.2;
                    margin-bottom: 1rem;
                }
                .cta-title .highlight {
                    color: #dc3545;
                }
                .cta-description {
                    font-size: 1.1rem;
                    color: #64748b;
                    margin-bottom: 2rem;
                    line-height: 1.7;
                }
                .cta-features {
                    display: flex;
                    gap: 2rem;
                    margin-bottom: 2rem;
                }
                .cta-feature {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }
                .cta-feature i {
                    font-size: 1.5rem;
                }
                .cta-feature h6 {
                    font-weight: 700;
                    color: #1e293b;
                    margin: 0;
                }
                .cta-feature small {
                    color: #94a3b8;
                }
                .cta-actions {
                    display: flex;
                    align-items: center;
                    gap: 2rem;
                }
                .btn-apply {
                    background: linear-gradient(135deg, #dc3545, #b91c1c);
                    border: none;
                    border-radius: 14px;
                    padding: 1rem 2.5rem;
                    font-weight: 700;
                    color: white;
                    font-size: 1rem;
                    transition: all 0.3s ease;
                    box-shadow: 0 10px 30px rgba(220, 53, 69, 0.3);
                }
                .btn-apply:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 15px 40px rgba(220, 53, 69, 0.4);
                }
                .learn-more-link {
                    color: #1e293b;
                    font-weight: 700;
                    text-decoration: none;
                    border-bottom: 2px solid #1e293b;
                    padding-bottom: 0.25rem;
                }
                .cta-image-col {
                    position: relative;
                }
                .cta-image-wrapper {
                    height: 100%;
                    position: relative;
                }
                .cta-image {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .cta-overlay-card {
                    position: absolute;
                    bottom: 2rem;
                    left: 2rem;
                    right: 2rem;
                    background: white;
                    border-radius: 16px;
                    padding: 1.25rem;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.15);
                }
                .avatar-stack {
                    display: flex;
                }
                .avatar-stack img {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    border: 2px solid white;
                    margin-left: -8px;
                }
                .avatar-stack img:first-child {
                    margin-left: 0;
                }

                @media (max-width: 768px) {
                    .hero-title {
                        font-size: 2.25rem;
                    }
                    .section-title, .why-title, .cta-title {
                        font-size: 1.75rem;
                    }
                    .cta-content {
                        padding: 2rem;
                    }
                    .cta-features {
                        flex-direction: column;
                        gap: 1rem;
                    }
                    .quality-stats {
                        flex-direction: column;
                        gap: 1rem;
                    }
                }
            `}} />
        </Layout>
    );
}
