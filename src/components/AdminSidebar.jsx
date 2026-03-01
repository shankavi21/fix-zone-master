import React from 'react';
import { Nav } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
import Logo from './Logo';

export default function AdminSidebar() {
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    const menuItems = [
        { path: '/admin/dashboard', icon: 'bi-speedometer2', label: 'Dashboard' },
        { path: '/admin/tickets', icon: 'bi-card-checklist', label: 'Tickets' },
        { path: '/admin/users', icon: 'bi-people', label: 'Users' },
        { path: '/admin/technicians', icon: 'bi-person-badge', label: 'Experts' },
        { path: '/admin/applications', icon: 'bi-file-earmark-text', label: 'Applications' },
        { path: '/admin/analytics', icon: 'bi-graph-up', label: 'Analytics' },
        { path: '/admin/settings', icon: 'bi-gear', label: 'Settings' }
    ];

    return (
        <div className="admin-sidebar bg-white border-end h-100 d-flex flex-column" style={{ width: '260px', position: 'fixed', top: '0', left: '0', zIndex: 1000 }}>
            {/* Logo */}
            <div className="p-4 border-bottom">
                <Logo size="normal" className="mb-1" />
                <div className="ps-5">
                    <span className="badge bg-danger bg-opacity-10 text-danger rounded-pill fw-bold border border-danger border-opacity-25" style={{ fontSize: '0.65rem', letterSpacing: '1px' }}>ADMIN PANEL</span>
                </div>
            </div>

            {/* Navigation */}
            <Nav className="flex-column p-3 flex-grow-1">
                {menuItems.map((item, index) => (
                    <Nav.Link
                        key={index}
                        as={Link}
                        to={item.path}
                        className={`admin-nav-item rounded-3 mb-2 d-flex align-items-center gap-3 px-3 py-3 ${isActive(item.path) ? 'active' : ''}`}
                    >
                        <i className={`bi ${item.icon} fs-5`}></i>
                        <span className="fw-semibold">{item.label}</span>
                    </Nav.Link>
                ))}
            </Nav>

            {/* Footer */}
            <div className="p-3 border-top">
                <div className="d-flex align-items-center gap-3 p-3 bg-light rounded-3">
                    <div className="bg-danger text-white rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '36px', height: '36px', fontSize: '14px' }}>
                        A
                    </div>
                    <div className="flex-grow-1">
                        <div className="fw-bold small">Admin User</div>
                        <div className="text-muted tiny">administrator</div>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .admin-nav-item {
                    color: #64748b;
                    transition: all 0.2s ease;
                    text-decoration: none;
                    border: 1px solid transparent;
                }
                .admin-nav-item:hover {
                    background-color: rgba(128, 0, 0, 0.05);
                    color: var(--primary-red);
                }
                .admin-nav-item.active {
                    background-color: rgba(128, 0, 0, 0.1);
                    color: var(--primary-red);
                    border-color: var(--primary-red);
                    font-weight: 700;
                }
                .tiny { font-size: 0.7rem; }
            `}} />
        </div>
    );
}
