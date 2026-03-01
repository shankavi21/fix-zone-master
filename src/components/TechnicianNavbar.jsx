import React, { useState, useEffect } from 'react';
import { Container, Navbar, Nav, Dropdown, Badge, Button } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, limit, onSnapshot, orderBy } from 'firebase/firestore';
import 'bootstrap-icons/font/bootstrap-icons.css';
import Logo from './Logo';

export default function TechnicianNavbar() {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [techData, setTechData] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!currentUser) return;

        // Fetch technician data
        const fetchTechData = async () => {
            const techDoc = await getDoc(doc(db, 'technicians', currentUser.uid));
            if (techDoc.exists()) {
                setTechData(techDoc.data());
            }
        };
        fetchTechData();

        // Listen for all unread notifications to get accurate count
        const unreadQ = query(
            collection(db, 'notifications'),
            where('userId', '==', currentUser.uid),
            where('read', '==', false)
        );
        const unsubscribeUnread = onSnapshot(unreadQ, (snapshot) => {
            setUnreadCount(snapshot.size);
        });

        // Listen for recent 5 notifications for the dropdown
        const q = query(
            collection(db, 'notifications'),
            where('userId', '==', currentUser.uid),
            limit(20) // Get more items to sort client-side
        );

        const unsubscribeNotifs = onSnapshot(q, (snapshot) => {
            const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Client-side sort to avoid requiring a composite index
            notifs.sort((a, b) => {
                const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
                const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
                return timeB - timeA;
            });
            setNotifications(notifs.slice(0, 5));
        });

        return () => {
            unsubscribeUnread();
            unsubscribeNotifs();
        };
    }, [currentUser]);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (e) {
            console.error("Failed to log out", e);
        }
    };

    const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

    const CustomToggle = React.forwardRef(({ children, onClick }, ref) => (
        <div
            ref={ref}
            onClick={(e) => {
                e.preventDefault();
                onClick(e);
            }}
            className="clickable d-flex align-items-center"
            style={{ cursor: 'pointer' }}
        >
            {children}
        </div>
    ));

    return (
        <Navbar bg="white" expand="lg" className="border-bottom sticky-top py-0 shadow-sm" style={{ height: '75px' }}>
            <Container fluid className="px-lg-5 h-100">
                {/* Logo */}
                <Navbar.Brand as={Link} to="/technician/dashboard" className="d-flex align-items-center">
                    <Logo size="normal" />
                    <Badge bg="danger" className="ms-2 d-none d-sm-inline-block" style={{ fontSize: '10px' }}>TECH</Badge>
                </Navbar.Brand>

                <Navbar.Toggle aria-controls="tech-navbar" />

                <Navbar.Collapse id="tech-navbar" className="h-100">
                    {/* Navigation Links */}
                    <Nav className="mx-auto gap-4 h-100">
                        <Nav.Link
                            as={Link}
                            to="/technician/dashboard"
                            className={`nav-link-web d-flex align-items-center px-0 ${isActive('/technician/dashboard') ? 'active-nav' : ''}`}
                        >
                            <i className="bi bi-house-door me-2 d-lg-none"></i>Dashboard
                        </Nav.Link>
                        <Nav.Link
                            as={Link}
                            to="/technician/jobs"
                            className={`nav-link-web d-flex align-items-center px-0 ${isActive('/technician/jobs') ? 'active-nav' : ''}`}
                        >
                            <i className="bi bi-clipboard-check me-2 d-lg-none"></i>My Jobs
                        </Nav.Link>
                        <Nav.Link
                            as={Link}
                            to="/technician/earnings"
                            className={`nav-link-web d-flex align-items-center px-0 ${isActive('/technician/earnings') ? 'active-nav' : ''}`}
                        >
                            <i className="bi bi-wallet2 me-2 d-lg-none"></i>Earnings
                        </Nav.Link>
                        <Nav.Link
                            as={Link}
                            to="/technician/profile"
                            className={`nav-link-web d-flex align-items-center px-0 ${isActive('/technician/profile') ? 'active-nav' : ''}`}
                        >
                            <i className="bi bi-person me-2 d-lg-none"></i>Profile
                        </Nav.Link>
                    </Nav>

                    {/* Right Side */}
                    <div className="d-flex align-items-center gap-3">
                        <div className="d-none d-lg-block">
                            <Button
                                variant="outline-danger"
                                size="sm"
                                className="rounded-pill px-3 fw-bold bg-white"
                                onClick={() => window.open('/?guest=true', '_blank')}
                            >
                                <i className="bi bi-window me-2"></i>View Website
                            </Button>
                        </div>

                        {/* Availability Status */}
                        <div className="d-none d-lg-flex align-items-center gap-2 me-2">
                            <div className={`rounded-circle ${techData?.isAvailable !== false ? 'bg-success' : 'bg-secondary'}`}
                                style={{ width: '10px', height: '10px' }}></div>
                            <span className="small text-muted">
                                {techData?.isAvailable !== false ? 'Available' : 'Offline'}
                            </span>
                        </div>

                        {/* Notifications */}
                        <Dropdown align="end">
                            <Dropdown.Toggle as={CustomToggle}>
                                <div className="position-relative p-2 rounded-circle hover-bg-light clickable">
                                    <i className="bi bi-bell text-dark fs-5"></i>
                                    {unreadCount > 0 && (
                                        <Badge pill bg="danger" className="position-absolute top-0 end-0 border border-2 border-white"
                                            style={{ padding: '0.35em', fontSize: '10px' }}>
                                            {unreadCount}
                                        </Badge>
                                    )}
                                </div>
                            </Dropdown.Toggle>
                            <Dropdown.Menu className="shadow-lg border-0 rounded-4 mt-2 p-0 overflow-hidden" style={{ width: '320px' }}>
                                <div className="px-3 py-3 border-bottom d-flex justify-content-between align-items-center bg-light">
                                    <span className="fw-bold text-dark">Notifications</span>
                                    {unreadCount > 0 && <Badge bg="danger" pill style={{ fontSize: '10px' }}>{unreadCount} New</Badge>}
                                </div>
                                <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                                    {notifications.length > 0 ? (
                                        notifications.map(notif => (
                                            <Dropdown.Item key={notif.id} className={`px-3 py-3 border-bottom transition-all ${!notif.read ? 'bg-light bg-opacity-50' : ''}`} style={{ whiteSpace: 'normal' }}>
                                                <div className="d-flex gap-3">
                                                    <div className={`rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 ${notif.type === 'success' ? 'bg-success' : 'bg-primary'} bg-opacity-10`} style={{ width: '35px', height: '35px' }}>
                                                        <i className={`bi ${notif.icon || 'bi-bell'} ${notif.type === 'success' ? 'text-success' : 'text-primary'}`}></i>
                                                    </div>
                                                    <div className="flex-grow-1">
                                                        <div className="small fw-bold text-dark mb-1">{notif.title}</div>
                                                        <div className="text-muted tiny mb-0" style={{ fontSize: '0.78rem', lineHeight: '1.4' }}>{notif.message}</div>
                                                        {notif.createdAt && (
                                                            <div className="tiny text-uppercase fw-bold text-muted mt-2" style={{ fontSize: '9px', letterSpacing: '0.5px' }}>
                                                                {notif.createdAt?.toDate ? new Date(notif.createdAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </Dropdown.Item>
                                        ))
                                    ) : (
                                        <div className="text-center py-5 px-3">
                                            <i className="bi bi-bell-slash text-muted opacity-25 fs-1 d-block mb-3"></i>
                                            <p className="text-muted small mb-0">No new notifications</p>
                                        </div>
                                    )}
                                </div>
                                {notifications.length > 0 && (
                                    <div className="p-2 border-top bg-light text-center">
                                        <Button variant="link" size="sm" className="text-decoration-none text-danger fw-bold fs-7 p-0">View All Notifications</Button>
                                    </div>
                                )}
                            </Dropdown.Menu>
                        </Dropdown>

                        {/* User Menu */}
                        <Dropdown align="end">
                            <Dropdown.Toggle as={CustomToggle}>
                                <div className="d-flex align-items-center gap-2 clickable p-1 rounded-pill hover-bg-light">
                                    {techData?.uploads?.profileUrl ? (
                                        <img
                                            src={techData.uploads.profileUrl}
                                            alt="Profile"
                                            className="rounded-circle"
                                            style={{ width: '38px', height: '38px', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <div className="bg-danger text-white rounded-circle d-flex align-items-center justify-content-center fw-bold"
                                            style={{ width: '38px', height: '38px', fontSize: '15px' }}>
                                            {techData?.fullName?.charAt(0) || 'T'}
                                        </div>
                                    )}
                                    <i className="bi bi-chevron-down text-muted d-none d-lg-inline" style={{ fontSize: '12px' }}></i>
                                </div>
                            </Dropdown.Toggle>

                            <Dropdown.Menu className="shadow border-0 rounded-3 mt-2 p-0" style={{ minWidth: '240px' }}>
                                <div className="px-4 py-3 bg-light border-bottom">
                                    <div className="fw-bold">{techData?.fullName || 'Technician'}</div>
                                    <div className="text-muted small">{currentUser?.email}</div>
                                </div>
                                <div className="py-2">
                                    <Dropdown.Item as={Link} to="/technician/profile" className="py-2 px-4">
                                        <i className="bi bi-person text-secondary me-3"></i>My Profile
                                    </Dropdown.Item>
                                    <Dropdown.Item as={Link} to="/technician/settings" className="py-2 px-4">
                                        <i className="bi bi-gear text-secondary me-3"></i>Settings
                                    </Dropdown.Item>
                                    <Dropdown.Divider className="my-2" />
                                    <Dropdown.Item onClick={handleLogout} className="py-2 px-4 text-danger">
                                        <i className="bi bi-box-arrow-right me-3"></i>Logout
                                    </Dropdown.Item>
                                </div>
                            </Dropdown.Menu>
                        </Dropdown>

                        <div className="vr mx-2 d-none d-md-block opacity-25" style={{ height: '30px' }}></div>

                        <Button
                            variant="outline-danger"
                            size="sm"
                            className="rounded-pill px-3 fw-black d-flex align-items-center gap-2 transition-all text-uppercase"
                            style={{ fontSize: '11px', letterSpacing: '0.05rem', borderWidth: '1.5px' }}
                            onClick={handleLogout}
                        >
                            <i className="bi bi-box-arrow-right"></i>
                            <span className="d-none d-sm-inline">Logout</span>
                        </Button>
                    </div>
                </Navbar.Collapse>
            </Container>

            <style dangerouslySetInnerHTML={{
                __html: `
                .nav-link-web {
                    font-weight: 600;
                    color: #000 !important;
                    transition: all 0.25s ease;
                    font-size: 0.95rem;
                    position: relative;
                }
                .nav-link-web:hover {
                    color: var(--primary-red) !important;
                }
                .active-nav {
                    color: var(--primary-red) !important;
                }
                .active-nav::after {
                    content: '';
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    width: 100%;
                    height: 3px;
                    background-color: var(--primary-red);
                    border-radius: 3px 3px 0 0;
                }
                .hover-bg-light:hover { background: #f8f9fa; }
                @media (max-width: 991px) {
                    .nav-link-web { padding: 15px 0 !important; border-bottom: 1px solid #eee; }
                    .active-nav::after { height: 0; }
                    .active-nav { color: var(--primary-red) !important; padding-left: 10px !important; border-left: 3px solid var(--primary-red); }
                }
                .fw-black { font-weight: 850 !important; }
                .btn-outline-danger { border-width: 1.5px !important; }
                .btn-outline-danger:hover {
                    background-color: #dc3545 !important;
                    color: white !important;
                    box-shadow: 0 4px 12px rgba(220, 53, 69, 0.2);
                }
            ` }} />
        </Navbar>
    );
}
