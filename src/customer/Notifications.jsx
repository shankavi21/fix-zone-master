import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Spinner } from 'react-bootstrap';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc, writeBatch, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';

export default function Notifications() {
    const { currentUser } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) return;

        const q = query(
            collection(db, 'notifications'),
            where('userId', '==', currentUser.uid),
            // orderBy('createdAt', 'desc') // Leave commented or enable if user created index
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Sort manually if index is missing
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
        if (!window.confirm("Are you sure you want to delete all your notifications?")) return;

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
        <Layout>
            <div className="py-5 bg-light min-vh-100">
                <Container>
                    <div className="d-flex justify-content-between align-items-end mb-5">
                        <div>
                            <h2 className="fw-bold mb-1">Notifications</h2>
                            <p className="text-secondary mb-0">Stay updated with your repair status and offers.</p>
                        </div>
                        <div className="d-flex gap-3">
                            {notifications.length > 0 && (
                                <Button variant="link" className="text-secondary fw-bold text-decoration-none p-0" onClick={deleteAllNotifications}>
                                    Delete All
                                </Button>
                            )}
                            {notifications.some(n => !n.read) && (
                                <Button variant="link" className="text-danger fw-bold text-decoration-none p-0" onClick={markAllAsRead}>
                                    Mark all as read
                                </Button>
                            )}
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="danger" />
                        </div>
                    ) : notifications.length > 0 ? (
                        <div className="notifications-list">
                            {notifications.map(notif => (
                                <Card key={notif.id} className={`border-0 shadow-sm rounded-4 mb-3 overflow-hidden ${!notif.read ? 'border-start border-4 border-danger' : ''}`}>
                                    <Card.Body className="p-4">
                                        <div className="d-flex gap-4">
                                            <div className={`bg-${notif.type === 'success' ? 'success' : 'danger'} bg-opacity-10 p-3 rounded-4 d-flex align-items-center justify-content-center`} style={{ width: '60px', height: '60px', flexShrink: 0 }}>
                                                <i className={`bi ${notif.icon || 'bi-info-circle'} fs-3 text-${notif.type === 'success' ? 'success' : 'danger'}`}></i>
                                            </div>
                                            <div className="flex-grow-1">
                                                <div className="d-flex justify-content-between align-items-start mb-1">
                                                    <h6 className={`fw-bold mb-0 ${!notif.read ? 'text-dark' : 'text-secondary'}`}>{notif.title}</h6>
                                                    <span className="text-muted small">
                                                        {notif.createdAt?.toDate ? notif.createdAt.toDate().toLocaleDateString() : 'Just now'}
                                                    </span>
                                                </div>
                                                <p className="text-secondary mb-0 small">{notif.message}</p>
                                                <div className="mt-2">
                                                    <span className="text-muted tiny fw-bold uppercase ls-1">
                                                        {notif.createdAt?.toDate ? notif.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </Card.Body>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-5">
                            <div className="bg-white rounded-circle d-flex align-items-center justify-content-center mx-auto mb-4 shadow-sm" style={{ width: '120px', height: '120px' }}>
                                <i className="bi bi-bell-slash text-muted opacity-50" style={{ fontSize: '3rem' }}></i>
                            </div>
                            <h4 className="fw-bold text-dark">All Caught Up!</h4>
                            <p className="text-secondary">You don't have any notifications at the moment.</p>
                        </div>
                    )}
                </Container>
            </div>
            <style dangerouslySetInnerHTML={{
                __html: `
                .uppercase { text-transform: uppercase; }
                .ls-1 { letter-spacing: 0.1em; }
                .tiny { font-size: 0.7rem; }
            `}} />
        </Layout>
    );
}
