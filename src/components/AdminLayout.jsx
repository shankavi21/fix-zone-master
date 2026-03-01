import React from 'react';
import AdminSidebar from './AdminSidebar';
import { Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function AdminLayout({ children }) {
    const navigate = useNavigate();
    const { logout } = useAuth();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <div className="admin-layout d-flex">
            <AdminSidebar />
            <div className="admin-content flex-grow-1" style={{ marginLeft: '260px', minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
                {/* Top Bar */}
                <div className="admin-topbar bg-white border-bottom px-4 py-3 d-flex justify-content-between align-items-center sticky-top">
                    <div className="d-flex align-items-center gap-3">
                        <i className="bi bi-calendar3 text-muted"></i>
                        <span className="text-muted small fw-bold">
                            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                    </div>
                    <div className="d-flex align-items-center gap-3">
                        <Button
                            variant="outline-primary"
                            size="sm"
                            className="rounded-pill px-3 fw-bold d-none d-md-block"
                            onClick={() => window.open('/?guest=true', '_blank')}
                        >
                            <i className="bi bi-window me-2"></i>View Website
                        </Button>

                        <Button
                            variant="light"
                            size="sm"
                            className="rounded-circle position-relative me-2"
                            onClick={() => navigate('/admin/notifications')}
                        >
                            <i className="bi bi-bell fs-5 text-muted"></i>
                            <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle">
                                <span className="visually-hidden">New alerts</span>
                            </span>
                        </Button>

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
                </div>

                {/* Main Content */}
                <div className="p-4">
                    {children}
                </div>
            </div>
            <style dangerouslySetInnerHTML={{
                __html: `
                .fw-black { font-weight: 850 !important; }
                .btn-outline-danger { border-width: 1.5px !important; }
                .btn-outline-danger:hover {
                    background-color: #dc3545 !important;
                    color: white !important;
                    box-shadow: 0 4px 12px rgba(220, 53, 69, 0.2);
                }
            ` }} />
        </div>
    );
}
