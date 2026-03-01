import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Spinner } from 'react-bootstrap';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, writeBatch, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import AdminLayout from '../components/AdminLayout';

export default function AdminNotifications() {
    const { currentUser } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) return;

        const q = query(
            collection(db, 'notifications'),
            where('userId', '==', currentUser.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            notifs.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
            setNotifications(notifs);
            setLoading(false);
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

    const deleteNotification = async (id) => {
        try {
            await deleteDoc(doc(db, 'notifications', id));
        } catch (error) {
            console.error("Error deleting notification:", error);
        }
    };

    const toggleReadStatus = async (id, currentStatus) => {
        try {
            await updateDoc(doc(db, 'notifications', id), { read: !currentStatus });
        } catch (error) {
            console.error("Error updating notification status:", error);
        }
    };

    const deleteAllNotifications = async () => {
        if (!notifications.length) return;
        if (!window.confirm("Are you sure you want to permanently delete all your notifications?")) return;

        const batch = writeBatch(db);
        notifications.forEach((notif) => {
            batch.delete(doc(db, 'notifications', notif.id));
        });

        try {
            await batch.commit();
        } catch (error) {
            console.error("Error deleting all notifications:", error);
        }
    };

    return (
        <AdminLayout>
            <Container fluid className="py-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="fw-bold mb-1">Notifications</h2>
                        <p className="text-muted text-secondary">Stay updated with system alerts.</p>
                    </div>
                    {notifications.some(n => !n.read) && (
                        <Button variant="outline-primary" size="sm" onClick={markAllAsRead}>
                            Mark all as read
                        </Button>
                    )}
                </div>

                {loading ? (
                    <div className="text-center py-5">
                        <Spinner animation="border" variant="primary" />
                    </div>
                ) : (
                    <Row>
                        <Col lg={8}>
                            {notifications.length > 0 ? (
                                <div className="d-flex flex-column gap-3">
                                    {notifications.map((notif) => (
                                        <Card key={notif.id} className={`border-0 shadow-sm rounded-4 ${!notif.read ? 'border-start border-5 border-primary' : ''} bg-white`}>
                                            <Card.Body className="d-flex align-items-start gap-3 p-4">
                                                <div className={`rounded-circle p-2 d-flex align-items-center justify-content-center ${!notif.read ? 'bg-primary-subtle text-primary' : 'bg-light text-secondary'}`} style={{ width: '45px', height: '45px', minWidth: '45px' }}>
                                                    <i className={`bi ${notif.type === 'alert' ? 'bi-exclamation-triangle' : 'bi-info-circle'} fs-5`}></i>
                                                </div>
                                                <div className="flex-grow-1">
                                                    <div className="d-flex justify-content-between align-items-start mb-1">
                                                        <h6 className={`mb-0 ${!notif.read ? 'fw-bold text-dark' : 'fw-medium text-secondary'}`}>{notif.title}</h6>
                                                        <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                                                            {notif.createdAt?.toDate ? notif.createdAt.toDate().toLocaleDateString() : 'Just now'}
                                                        </small>
                                                    </div>
                                                    <p className="text-muted small mb-0">{notif.message}</p>
                                                </div>
                                                <div className="d-flex gap-2 ms-3">
                                                    <Button
                                                        variant="link"
                                                        className={`p-0 text-${notif.read ? 'secondary' : 'primary'}`}
                                                        onClick={() => toggleReadStatus(notif.id, notif.read)}
                                                        title={notif.read ? "Mark as unread" : "Mark as read"}
                                                    >
                                                        <i className={`bi ${notif.read ? 'bi-envelope' : 'bi-envelope-open'}`}></i>
                                                    </Button>
                                                    <Button
                                                        variant="link"
                                                        className="p-0 text-danger"
                                                        onClick={() => deleteNotification(notif.id)}
                                                        title="Delete"
                                                    >
                                                        <i className="bi bi-trash"></i>
                                                    </Button>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-5 bg-white rounded-4 shadow-sm">
                                    <div className="bg-light rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: '60px', height: '60px' }}>
                                        <i className="bi bi-bell-slash text-muted fs-4"></i>
                                    </div>
                                    <h6 className="fw-bold text-dark">No Notifications</h6>
                                    <p className="text-muted small">You're all caught up!</p>
                                </div>
                            )}
                        </Col>
                    </Row>
                )}
            </Container>
        </AdminLayout>
    );
}
