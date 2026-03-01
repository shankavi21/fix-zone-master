import React, { useState, useEffect } from 'react';
import { Badge, Modal, Button } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import 'bootstrap-icons/font/bootstrap-icons.css';

export default function BottomNav() {
    const location = useLocation();
    const navigate = useNavigate();
    const active = location.pathname;
    const { currentUser, logout } = useAuth();
    const [activeCount, setActiveCount] = useState(0);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const isActive = (path) => active === path;

    useEffect(() => {
        if (!currentUser) return;

        const q = query(
            collection(db, 'tickets'),
            where('customerId', '==', currentUser.uid),
            where('status', 'in', ['Pending', 'Assigned', 'Scheduled', 'In Progress', 'On the Way'])
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setActiveCount(snapshot.docs.length);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (e) {
            console.error(e);
        }
    };

    const NavItem = ({ to, icon, label, badgeCount }) => {
        const isCurrentlyActive = isActive(to);
        return (
            <Link
                to={to}
                className={`flex-grow-1 d-flex flex-column align-items-center text-decoration-none transition-all py-2 position-relative ${isCurrentlyActive ? 'text-danger' : 'text-secondary'}`}
            >
                <div className="position-relative">
                    <i className={`bi ${icon}${isCurrentlyActive ? '-fill' : ''} fs-3`}></i>
                    {badgeCount > 0 && (
                        <Badge
                            pill
                            bg="danger"
                            className="position-absolute top-0 start-100 translate-middle border border-2 border-white"
                            style={{ fontSize: '0.55rem', padding: '0.25em 0.5em', marginTop: '-2px', marginLeft: '-2px' }}
                        >
                            {badgeCount}
                        </Badge>
                    )}
                </div>
                <span className="fw-bold mt-1" style={{ fontSize: '0.65rem' }}>{label}</span>
            </Link>
        );
    };

    return (
        <>
            <div className="bottom-nav-container fixed-bottom bg-white border-top shadow-lg z-3">
                <div className="container-fluid max-width-mobile mx-auto px-0">
                    <div className="d-flex align-items-center justify-content-between h-100 py-1">
                        <NavItem to="/customer/dashboard" icon="bi-house" label="Home" />
                        <NavItem to="/customer/services" icon="bi-wrench-adjustable" label="Services" />
                        <NavItem to="/customer/my-tickets" icon="bi-ticket-detailed" label="Tickets" badgeCount={activeCount} />
                        <NavItem to="/customer/tracking" icon="bi-geo-alt" label="Tracking" />

                        <div
                            onClick={() => setShowLogoutModal(true)}
                            className="flex-grow-1 d-flex flex-column align-items-center text-secondary cursor-pointer py-2"
                        >
                            <i className="bi bi-box-arrow-right fs-3"></i>
                            <span className="fw-bold mt-1" style={{ fontSize: '0.65rem' }}>Logout</span>
                        </div>
                    </div>
                </div>

                <style dangerouslySetInnerHTML={{
                    __html: `
                    .bottom-nav-container {
                        height: 75px;
                        border-top: 1px solid rgba(0,0,0,0.08) !important;
                    }
                    .max-width-mobile {
                        max-width: 500px;
                    }
                    .cursor-pointer { cursor: pointer; }
                    .transition-all { transition: all 0.2s ease; }
                    .bottom-nav-container :active { transform: scale(0.92); opacity: 0.8; }
                ` }} />
            </div>

            {/* Logout Confirmation Modal */}
            <Modal show={showLogoutModal} onHide={() => setShowLogoutModal(false)} centered className="logout-modal px-3">
                <Modal.Body className="p-4 text-center">
                    <div className="bg-danger bg-opacity-10 text-danger rounded-circle d-flex align-items-center justify-content-center mx-auto mb-4" style={{ width: '70px', height: '70px' }}>
                        <i className="bi bi-box-arrow-right fs-1"></i>
                    </div>
                    <h4 className="fw-bold mb-2">Confirm Logout</h4>
                    <p className="text-secondary mb-4 px-2">Are you sure you want to log out of your FixZone account?</p>
                    <div className="d-grid gap-2">
                        <Button variant="danger" className="py-2 fw-bold rounded-pill" onClick={handleLogout}>
                            Yes, Logout
                        </Button>
                        <Button variant="light" className="py-2 fw-bold rounded-pill border" onClick={() => setShowLogoutModal(false)}>
                            Cancel
                        </Button>
                    </div>
                </Modal.Body>
            </Modal>
        </>
    );
}
