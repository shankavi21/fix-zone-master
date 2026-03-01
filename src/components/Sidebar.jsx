import React from 'react';
import { Nav } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import Logo from './Logo';

export default function Sidebar() {
    const location = useLocation();
    const active = location.pathname;

    const isActive = (path) => active === path;

    return (
        <div className="sidebar p-3 d-flex flex-column h-100">
            <div className="mb-4 pb-2 border-bottom d-flex justify-content-center">
                <Logo textColor="white" size="normal" />
            </div>
            <Nav className="flex-column flex-grow-1">
                <Nav.Link as={Link} to="/customer/dashboard" className={`mb-2 px-3 py-2 transition-all ${isActive('/customer/dashboard') ? 'bg-danger text-white shadow-sm fw-bold' : 'text-secondary'}`} style={{ borderRadius: '12px' }}>
                    <i className="bi bi-grid-fill me-2"></i> Dashboard
                </Nav.Link>
                <Nav.Link as={Link} to="/customer/create-ticket" className={`mb-2 px-3 py-2 transition-all ${isActive('/customer/create-ticket') ? 'bg-danger text-white shadow-sm fw-bold' : 'text-secondary'}`} style={{ borderRadius: '12px' }}>
                    <i className="bi bi-plus-circle-fill me-2"></i> New Repair
                </Nav.Link>
                <Nav.Link as={Link} to="/customer/my-tickets" className={`mb-2 px-3 py-2 transition-all ${isActive('/customer/my-tickets') ? 'bg-danger text-white shadow-sm fw-bold' : 'text-secondary'}`} style={{ borderRadius: '12px' }}>
                    <i className="bi bi-clock-history me-2"></i> My Repairs
                </Nav.Link>
                <Nav.Link as={Link} to="/customer/profile" className={`mb-2 px-3 py-2 transition-all ${isActive('/customer/profile') ? 'bg-danger text-white shadow-sm fw-bold' : 'text-secondary'}`} style={{ borderRadius: '12px' }}>
                    <i className="bi bi-person-fill me-2"></i> Profile
                </Nav.Link>
            </Nav>
            <div className="mt-auto">
                <small className="text-secondary text-center d-block">Project13 v1.0</small>
            </div>
        </div>
    );
}
