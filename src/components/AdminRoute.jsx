import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

/**
 * AdminRoute - Protects admin routes
 * Redirects to customer dashboard if user is not an admin
 */
export default function AdminRoute({ children }) {
    const { currentUser, userRole } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        console.log("AdminRoute Check -> User:", currentUser ? currentUser.uid : "null", "Role:", userRole);

        if (!currentUser) {
            console.log("AdminRoute: No user, redirecting to login");
            navigate('/login');
        }
        // Logic to redirect if not admin is REMOVED to show debug screen
        else if (userRole === 'admin') {
            console.log("AdminRoute: Access granted");
        }
    }, [currentUser, userRole, navigate]);

    // Show loading while checking
    if (!currentUser || !userRole) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
                <div className="text-center">
                    <div className="spinner-border text-danger mb-3" role="status"></div>
                    <p className="text-muted">Verifying access...</p>
                </div>
            </div>
        );
    }

    // Only render if admin
    if (userRole === 'admin') {
        return children;
    }

    // If we get here, user is logged in but NOT admin (and loading is done)
    // Instead of redirecting, show a debug screen
    return (
        <div className="d-flex justify-content-center align-items-center bg-light" style={{ minHeight: '100vh' }}>
            <div className="text-center p-5 bg-white shadow rounded-4" style={{ maxWidth: '500px' }}>
                <div className="mb-4">
                    <i className="bi bi-shield-lock-fill text-danger" style={{ fontSize: '4rem' }}></i>
                </div>
                <h2 className="fw-bold text-danger mb-3">Access Denied</h2>
                <p className="text-muted mb-4">You do not have permission to view the Admin Dashboard.</p>

                <div className="alert alert-warning text-start mb-4">
                    <small className="d-block fw-bold text-uppercase mb-1">Debug Info:</small>
                    <div className="d-flex justify-content-between">
                        <span>Status:</span> <span className="fw-bold text-success">Logged In</span>
                    </div>
                    <div className="d-flex justify-content-between">
                        <span>User ID:</span>
                        <span className="font-monospace user-select-all">{currentUser.uid.substring(0, 10)}...</span>
                    </div>
                    <div className="d-flex justify-content-between">
                        <span>Current Role:</span>
                        <span className="badge bg-dark ms-2">{userRole || 'NULL'}</span>
                    </div>
                </div>

                <div className="d-grid gap-2">
                    <button onClick={() => navigate('/customer/dashboard')} className="btn btn-dark btn-lg">
                        Go to Customer Dashboard
                    </button>
                    <button onClick={() => window.location.reload()} className="btn btn-outline-secondary">
                        Refresh Page
                    </button>
                </div>
            </div>
        </div>
    );
}
