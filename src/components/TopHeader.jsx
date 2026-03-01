import React, { useState } from 'react';
import { Nav, Dropdown, Badge, Container } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function TopHeader() {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [notifications] = useState([
        { id: 1, text: "Expert assigned to your repair", time: "2m ago", unread: true },
        { id: 2, text: "On the way – ETA 20 mins", time: "15m ago", unread: true }
    ]);

    async function handleLogout() {
        try {
            await logout();
            navigate('/login');
        } catch (e) {
            console.error("Failed to log out", e);
        }
    }

    const unreadCount = notifications.filter(n => n.unread).length;
    const isActive = (path) => location.pathname === path;

    const navItems = [
        { label: 'Home', path: '/customer/dashboard' },
        { label: 'Services', path: '/customer/services' },
        { label: 'My Tickets', path: '/customer/my-tickets' },
        { label: 'Tracking', path: '/customer/tracking' }
    ];

    return (
        <header className="fixed-top bg-white border-bottom shadow-sm z-3" style={{ height: '70px' }}>
            <Container fluid className="h-100 px-lg-4 px-3 d-flex align-items-center justify-content-between">

                {/* Left Side: Logo */}
                <div className="d-flex align-items-center flex-shrink-0" style={{ width: '150px' }}>
                    <Link to="/customer/dashboard" className="d-flex align-items-center text-decoration-none">
                        <div className="bg-danger text-white rounded-circle d-flex align-items-center justify-content-center me-2" style={{ width: '32px', height: '32px' }}>
                            <i className="bi bi-wrench" style={{ fontSize: '1rem' }}></i>
                        </div>
                        <span className="text-dark fw-bold fs-5 mb-0" style={{ letterSpacing: '-0.5px' }}>Fix<span className="text-danger">Zone</span></span>
                    </Link>
                </div>

                {/* Center: Navigation Tabs */}
                <div className="d-none d-md-flex justify-content-center flex-grow-1 h-100">
                    <Nav className="h-100 gap-4">
                        {navItems.map((item) => (
                            <Nav.Link
                                key={item.path}
                                as={Link}
                                to={item.path}
                                className={`h-100 d-flex align-items-center px-2 fw-bold transition-all position-relative border-0 ${isActive(item.path) ? 'text-danger' : 'text-secondary opacity-75'}`}
                                style={{ fontSize: '0.9rem' }}
                            >
                                {item.label}
                                {isActive(item.path) && (
                                    <div className="position-absolute bottom-0 start-0 w-100 bg-danger" style={{ height: '3px', borderRadius: '3px 3px 0 0' }}></div>
                                )}
                            </Nav.Link>
                        ))}
                    </Nav>
                </div>

                {/* Mobile Center: Nav - simpler for small screens */}
                <div className="d-flex d-md-none justify-content-center flex-grow-1 overflow-auto scrollbar-none px-2 h-100">
                    <Nav className="h-100 gap-3 flex-nowrap align-items-center">
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`text-decoration-none fw-bold text-nowrap transition-all position-relative pb-2 ${isActive(item.path) ? 'text-danger' : 'text-secondary opacity-75'}`}
                                style={{ fontSize: '0.8rem' }}
                            >
                                {item.label}
                                {isActive(item.path) && (
                                    <div className="position-absolute bottom-0 start-0 w-100 bg-danger" style={{ height: '3px', borderRadius: '3px 3px 0 0' }}></div>
                                )}
                            </Link>
                        ))}
                    </Nav>
                </div>

                {/* Right Side: Bell + Avatar */}
                <div className="d-flex align-items-center justify-content-end gap-3 flex-shrink-0" style={{ width: '150px' }}>
                    <Dropdown align="end">
                        <Dropdown.Toggle as="div" className="position-relative cursor-pointer p-1">
                            <i className="bi bi-bell fs-4 text-dark"></i>
                            {unreadCount > 0 && (
                                <Badge bg="danger" pill className="position-absolute top-0 start-50 translate-middle p-1 border border-white" style={{ width: '10px', height: '10px' }}>
                                    <span className="visually-hidden">unread notifications</span>
                                </Badge>
                            )}
                        </Dropdown.Toggle>
                        <Dropdown.Menu className="shadow-lg border-0 rounded-4 p-2 mt-2" style={{ width: '280px' }}>
                            <div className="px-3 py-2 border-bottom mb-2">
                                <h6 className="fw-bold m-0">Notifications</h6>
                            </div>
                            {notifications.length > 0 ? (
                                notifications.map(notif => (
                                    <Dropdown.Item key={notif.id} className="rounded-3 py-2 px-3 mb-1 border-bottom-0">
                                        <div className="small fw-bold">{notif.text}</div>
                                        <div className="text-muted" style={{ fontSize: '0.7rem' }}>{notif.time}</div>
                                    </Dropdown.Item>
                                ))
                            ) : (
                                <div className="text-center py-4 text-muted small">No new notifications</div>
                            )}
                        </Dropdown.Menu>
                    </Dropdown>

                    {currentUser && (
                        <Dropdown align="end">
                            <Dropdown.Toggle as="div" className="cursor-pointer p-1">
                                <div className="bg-danger text-white rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm" style={{ width: '38px', height: '38px', fontSize: '1rem' }}>
                                    {currentUser.displayName ? currentUser.displayName.charAt(0) : (currentUser.email ? currentUser.email.charAt(0).toUpperCase() : 'U')}
                                </div>
                            </Dropdown.Toggle>
                            <Dropdown.Menu className="shadow-lg border-0 rounded-4 p-2 mt-2" style={{ minWidth: '220px' }}>
                                <Dropdown.Item onClick={() => navigate('/customer/profile')} className="rounded-3 py-2 gap-3 d-flex align-items-center">
                                    <i className="bi bi-person text-danger fs-5"></i> My Profile
                                </Dropdown.Item>
                                <Dropdown.Item className="rounded-3 py-2 gap-3 d-flex align-items-center">
                                    <i className="bi bi-geo-alt text-danger fs-5"></i> Saved Addresses
                                </Dropdown.Item>
                                <Dropdown.Item className="rounded-3 py-2 gap-3 d-flex align-items-center">
                                    <i className="bi bi-headset text-danger fs-5"></i> Support / Help
                                </Dropdown.Item>
                                <Dropdown.Divider />
                                <Dropdown.Item onClick={handleLogout} className="rounded-3 py-2 gap-3 d-flex align-items-center text-danger fw-bold">
                                    <i className="bi bi-box-arrow-right fs-5"></i> Logout
                                </Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                    )}
                </div>
            </Container>

            <style dangerouslySetInnerHTML={{
                __html: `
                .cursor-pointer { cursor: pointer; }
                .dropdown-toggle::after { display: none; }
                .scrollbar-none::-webkit-scrollbar { display: none; }
                .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
                .transition-all { transition: all 0.2s ease; }
                .nav-link:hover { opacity: 1; color: var(--bs-danger); }
            ` }} />
        </header>
    );
}
