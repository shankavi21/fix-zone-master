import React from 'react';
import { Container } from 'react-bootstrap';
import { useLocation } from 'react-router-dom';
import CustomerNavbar from './CustomerNavbar';
import TechnicianNavbar from './TechnicianNavbar';
import Footer from './Footer';

export default function Layout({ children }) {
    const location = useLocation();
    const isTechnicianRoute = location.pathname.startsWith('/technician');

    return (
        <div className="min-vh-100 d-flex flex-column" style={{ backgroundColor: '#FFFFFF' }}>
            {isTechnicianRoute ? <TechnicianNavbar /> : <CustomerNavbar />}
            <main className="flex-grow-1">
                {children}
            </main>
            <Footer />
        </div>
    );
}

