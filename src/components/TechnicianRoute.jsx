import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Spinner } from 'react-bootstrap';

export default function TechnicianRoute({ children }) {
    const { currentUser, userRole, loading } = useAuth();

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
                <Spinner animation="border" variant="danger" />
            </div>
        );
    }

    if (!currentUser) {
        return <Navigate to="/login" />;
    }

    if (userRole !== 'technician') {
        return <Navigate to="/customer/dashboard" />;
    }

    return children;
}
