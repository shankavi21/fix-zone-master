import React from 'react';
import { Navbar, Container, Button, Nav } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Logo from './Logo';

export default function AppNavbar() {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();

    async function handleLogout() {
        try {
            await logout();
            navigate('/login');
        } catch (e) {
            console.error("Failed to log out", e);
        }
    }

    return (
        <Navbar bg="white" expand="lg" className="border-bottom shadow-sm sticky-top">
            <Container fluid>
                <Navbar.Brand className="d-md-none p-0">
                    <Logo size="small" />
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav" className="justify-content-end">
                    <Nav className="align-items-center">
                        <span className="navbar-text me-3 text-dark fw-medium">
                            {currentUser?.displayName || currentUser?.email}
                        </span>
                        <Button variant="outline-danger" size="sm" onClick={handleLogout}>Logout</Button>
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}
