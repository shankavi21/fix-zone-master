import React, { useState, useEffect } from 'react';
import { Container, Navbar, Nav, Button, Dropdown, Form, InputGroup, Badge } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, limit, updateDoc, doc, writeBatch } from 'firebase/firestore';
import 'bootstrap-icons/font/bootstrap-icons.css';

import Logo from './Logo';

export default function CustomerNavbar() {
    const { currentUser, userRole, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchQuery, setSearchQuery] = useState('');
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!currentUser) return;

        const q = query(
            collection(db, 'notifications'),
            where('userId', '==', currentUser.uid),
            limit(5)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setNotifications(notifs);
            setUnreadCount(notifs.filter(n => !n.read).length);
        }, (error) => {
            console.error("Notifications listener failed:", error);
        });

        return unsubscribe;
    }, [currentUser]);

    const markAllAsRead = async () => {
        const unreadNotifs = notifications.filter(n => !n.read);
        if (unreadNotifs.length === 0) return;

        const batch = writeBatch(db);
        unreadNotifs.forEach((notif) => {
            batch.update(doc(db, 'notifications', notif.id), { read: true });
        });

        try {
            await batch.commit();
        } catch (error) {
            console.error("Error marking notifications as read:", error);
        }
    };

    async function handleLogout() {
        try {
            await logout();
            navigate('/login');
        } catch (e) {
            console.error("Failed to log out", e);
        }
    }

    const isActive = (path) => location.pathname === path;
    const isGuestMode = new URLSearchParams(location.search).get('guest') === 'true';
    const isStaff = userRole === 'admin' || userRole === 'technician';
    // Show user menu only if logged in AND is a customer AND guest mode is not forced
    const showUserMenu = currentUser && !isStaff && !isGuestMode;

    // Custom Toggle for Notification and Avatar to match design
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
                {/* Left: Logo */}
                <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
                    <Logo size="normal" />
                </Navbar.Brand>

                <Navbar.Toggle aria-controls="navbar-web-layout" />

                <Navbar.Collapse id="navbar-web-layout" className="h-100">
                    {/* Center: Navigation Links */}
                    <Nav className="mx-auto gap-4 h-100">
                        <Nav.Link as={Link} to="/" className={`nav-link-web d-flex align-items-center px-0 ${isActive('/') ? 'active-nav' : ''}`}>Home</Nav.Link>
                        <Nav.Link as={Link} to="/customer/services" className={`nav-link-web d-flex align-items-center px-0 ${isActive('/customer/services') ? 'active-nav' : ''}`}>Services</Nav.Link>
                        {!isStaff && (
                            <Nav.Link as={Link} to="/customer/my-tickets" className={`nav-link-web d-flex align-items-center px-0 ${isActive('/customer/my-tickets') ? 'active-nav' : ''}`}>My Tickets</Nav.Link>
                        )}
                    </Nav>

                    {/* Right Side: Search, Notifications, Avatar */}
                    <div className="d-flex align-items-center gap-3">
                        {/* Search Bar */}
                        <Form className="d-none d-xl-block" onSubmit={(e) => {
                            e.preventDefault();
                            if (searchQuery.trim()) {
                                const targetPath = location.pathname.includes('my-tickets')
                                    ? '/customer/my-tickets'
                                    : '/customer/services';
                                navigate(`${targetPath}?q=${encodeURIComponent(searchQuery)}`);
                            }
                        }}>
                            <InputGroup className="bg-light border rounded-pill px-3 py-1" style={{ width: '220px', borderColor: '#eee' }}>
                                <i
                                    className="bi bi-search text-muted my-auto clickable"
                                    style={{ fontSize: '0.8rem' }}
                                    onClick={() => {
                                        if (searchQuery.trim()) {
                                            const targetPath = location.pathname.includes('my-tickets')
                                                ? '/customer/my-tickets'
                                                : '/customer/services';
                                            navigate(`${targetPath}?q=${encodeURIComponent(searchQuery)}`);
                                        }
                                    }}
                                ></i>
                                <Form.Control
                                    placeholder="Search repairs..."
                                    className="bg-transparent border-0 shadow-none"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{ fontSize: '0.85rem', color: '#666' }}
                                />
                            </InputGroup>
                        </Form>

                        {showUserMenu ? (
                            <>
                                {/* Notification Bell */}
                                <Dropdown align="end" onToggle={(isOpen) => isOpen && markAllAsRead()}>
                                    <Dropdown.Toggle as={CustomToggle}>
                                        <div className="position-relative p-2 rounded-circle hover-bg-light clickable transition-all">
                                            <i className="bi bi-bell text-dark fs-5"></i>
                                            {unreadCount > 0 && (
                                                <Badge pill bg="danger" className="position-absolute top-0 end-0 border border-2 border-white translate-middle" style={{ padding: '0.35em', fontSize: '10px' }}>
                                                    {unreadCount}
                                                </Badge>
                                            )}
                                        </div>
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu className="shadow-premium border-0 rounded-4 mt-3 py-2" style={{ width: '320px' }}>
                                        <div className="px-4 py-3 border-bottom d-flex justify-content-between align-items-center">
                                            <span className="fw-bold text-dark">Notifications</span>
                                            {unreadCount > 0 && (
                                                <span className="badge bg-danger bg-opacity-10 text-danger rounded-pill px-2 py-1" style={{ fontSize: '11px' }}>{unreadCount} New</span>
                                            )}
                                        </div>
                                        {notifications.length > 0 ? (
                                            notifications.map(notif => (
                                                <Dropdown.Item key={notif.id} className={`py-3 px-4 border-bottom ${!notif.read ? 'bg-light bg-opacity-25' : ''}`}>
                                                    <div className="d-flex gap-3">
                                                        <div className={`bg-${notif.type === 'success' ? 'success' : 'danger'} bg-opacity-10 p-2 rounded-circle`} style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <i className={`bi ${notif.icon || 'bi-info-circle'} text-${notif.type === 'success' ? 'success' : 'danger'}`}></i>
                                                        </div>
                                                        <div className="flex-grow-1 overflow-hidden">
                                                            <div className="fw-bold small text-dark text-truncate">{notif.title}</div>
                                                            <div className="text-muted text-truncate" style={{ fontSize: '11px' }}>{notif.message}</div>
                                                            <div className="text-muted tiny mt-1" style={{ fontSize: '10px' }}>
                                                                {notif.createdAt?.toDate ? notif.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Dropdown.Item>
                                            ))
                                        ) : (
                                            <div className="py-4 text-center text-muted small">No notifications yet</div>
                                        )}
                                        <div className="text-center py-2">
                                            <Link to="/notifications" className="text-danger small fw-bold text-decoration-none">View All Notifications</Link>
                                        </div>
                                    </Dropdown.Menu>
                                </Dropdown>

                                {/* User Profile Dropdown */}
                                <Dropdown align="end">
                                    <Dropdown.Toggle as={CustomToggle}>
                                        <div className="d-flex align-items-center gap-1 clickable transition-all p-1 rounded-circle hover-bg-light">
                                            <div className="bg-danger text-white rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm" style={{ width: '38px', height: '38px', fontSize: '15px' }}>
                                                {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : (currentUser.email ? currentUser.email.charAt(0).toUpperCase() : 'U')}
                                            </div>
                                            <i className="bi bi-chevron-down text-muted" style={{ fontSize: '12px' }}></i>
                                        </div>
                                    </Dropdown.Toggle>

                                    <Dropdown.Menu className="shadow-premium border-0 rounded-4 mt-3 overflow-hidden p-0" style={{ minWidth: '260px' }}>
                                        <div className="px-4 py-4 bg-light border-bottom">
                                            <div className="d-flex align-items-center gap-3">
                                                <div className="bg-danger text-white rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm" style={{ width: '48px', height: '48px', fontSize: '20px' }}>
                                                    {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : (currentUser.email ? currentUser.email.charAt(0).toUpperCase() : 'U')}
                                                </div>
                                                <div className="flex-grow-1 overflow-hidden">
                                                    <div className="fw-bold text-dark text-truncate h6 mb-0">{currentUser.displayName || 'Member'}</div>
                                                    <div className="text-muted small text-truncate" style={{ fontSize: '12px' }}>{currentUser.email}</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="py-2">
                                            <Dropdown.Item as={Link} to="/customer/profile" className="py-2 px-4 d-flex align-items-center gap-3 text-dark fw-medium hover-bg-light transition-all">
                                                <i className="bi bi-person text-secondary fs-5"></i>
                                                <div className="flex-grow-1">
                                                    <div>My Profile</div>
                                                    <div className="text-muted tiny fw-normal">Manage your personal info</div>
                                                </div>
                                            </Dropdown.Item>
                                            <Dropdown.Item as={Link} to="/customer/settings" className="py-2 px-4 d-flex align-items-center gap-3 text-dark fw-medium hover-bg-light transition-all">
                                                <i className="bi bi-gear text-secondary fs-5"></i>
                                                <div className="flex-grow-1">
                                                    <div>Settings</div>
                                                    <div className="text-muted tiny fw-normal">Preferences & notifications</div>
                                                </div>
                                            </Dropdown.Item>
                                            <Dropdown.Divider className="my-2" />
                                            <Dropdown.Item onClick={handleLogout} className="py-3 px-4 d-flex align-items-center gap-3 text-danger fw-bold hover-bg-light transition-all">
                                                <i className="bi bi-box-arrow-right fs-5"></i> Logout
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
                            </>
                        ) : currentUser ? (
                            <div className="d-flex gap-3 align-items-center">
                                {isStaff && (
                                    <Button as={Link} to={userRole === 'admin' ? '/admin/dashboard' : '/technician/dashboard'} variant="outline-danger" className="rounded-pill px-3 py-1 fw-bold" style={{ fontSize: '0.85rem' }}>
                                        Back to {userRole.charAt(0).toUpperCase() + userRole.slice(1)} Dashboard
                                    </Button>
                                )}
                                <Button onClick={handleLogout} variant="link" className="text-decoration-none text-dark fw-bold small p-0 ms-2">Logout</Button>
                            </div>
                        ) : (
                            <div className="d-flex gap-3 align-items-center">
                                <Link to="/login" className="text-decoration-none text-dark fw-bold small">Login</Link>
                                <Button as={Link} to="/signup" className="rounded-pill px-4 py-2 fw-bold shadow-sm" style={{ backgroundColor: 'var(--primary-red)', border: 'none', fontSize: '0.9rem' }}>Join Now</Button>
                            </div>
                        )}
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
                .dropdown-item.text-danger:hover {
                    background-color: rgba(220, 53, 69, 0.08) !important;
                    color: #b91c1c !important;
                }
                .shadow-premium { box-shadow: 0 15px 40px rgba(0,0,0,0.1) !important; }
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
