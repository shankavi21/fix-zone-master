import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Spinner, Table } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import Layout from '../components/Layout';

export default function TechnicianEarnings() {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [earnings, setEarnings] = useState([]);
    const [stats, setStats] = useState({
        totalEarnings: 0,
        pendingPayment: 0,
        paidAmount: 0,
        thisMonthEarnings: 0
    });

    useEffect(() => {
        fetchEarnings();
    }, [currentUser]);

    const fetchEarnings = async () => {
        if (!currentUser) return;

        try {
            const ticketsQuery = query(
                collection(db, 'tickets'),
                where('assignedTechId', '==', currentUser.uid),
                where('status', '==', 'Completed'),
                orderBy('createdAt', 'desc')
            );
            const querySnapshot = await getDocs(ticketsQuery);
            const earningsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setEarnings(earningsData);

            // Calculate stats
            const totalEarnings = earningsData.reduce((sum, e) => sum + (e.serviceFee || 0), 0);
            const paidAmount = earningsData.filter(e => e.paid).reduce((sum, e) => sum + (e.serviceFee || 0), 0);
            const pendingPayment = totalEarnings - paidAmount;

            // This month earnings
            const now = new Date();
            const thisMonthEarnings = earningsData
                .filter(e => {
                    const date = e.createdAt?.toDate?.() || new Date(e.createdAt);
                    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                })
                .reduce((sum, e) => sum + (e.serviceFee || 0), 0);

            setStats({ totalEarnings, pendingPayment, paidAmount, thisMonthEarnings });
        } catch (error) {
            console.error('Error fetching earnings:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '70vh' }}>
                    <Spinner animation="border" variant="danger" />
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="technician-earnings bg-light min-vh-100 py-4">
                <Container>
                    <div className="mb-4">
                        <h2 className="fw-bold text-dark mb-1">My Earnings</h2>
                        <p className="text-muted">Track your income and payments</p>
                    </div>

                    {/* Stats Cards */}
                    <Row className="g-4 mb-4">
                        <Col md={6} lg={3}>
                            <Card className="border-0 shadow-sm h-100 bg-gradient-danger text-white">
                                <Card.Body>
                                    <div className="d-flex align-items-center justify-content-between">
                                        <div>
                                            <p className="small mb-1 opacity-75">Total Earnings</p>
                                            <h3 className="fw-bold mb-0">LKR {stats.totalEarnings.toLocaleString()}</h3>
                                        </div>
                                        <div className="bg-white bg-opacity-25 p-3 rounded-circle">
                                            <i className="bi bi-currency-dollar fs-4"></i>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={6} lg={3}>
                            <Card className="border-0 shadow-sm h-100">
                                <Card.Body>
                                    <div className="d-flex align-items-center justify-content-between">
                                        <div>
                                            <p className="text-muted small mb-1">This Month</p>
                                            <h3 className="fw-bold mb-0 text-primary">LKR {stats.thisMonthEarnings.toLocaleString()}</h3>
                                        </div>
                                        <div className="bg-primary bg-opacity-10 p-3 rounded-circle">
                                            <i className="bi bi-calendar-month text-primary fs-4"></i>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={6} lg={3}>
                            <Card className="border-0 shadow-sm h-100">
                                <Card.Body>
                                    <div className="d-flex align-items-center justify-content-between">
                                        <div>
                                            <p className="text-muted small mb-1">Paid</p>
                                            <h3 className="fw-bold mb-0 text-success">LKR {stats.paidAmount.toLocaleString()}</h3>
                                        </div>
                                        <div className="bg-success bg-opacity-10 p-3 rounded-circle">
                                            <i className="bi bi-check-circle text-success fs-4"></i>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={6} lg={3}>
                            <Card className="border-0 shadow-sm h-100">
                                <Card.Body>
                                    <div className="d-flex align-items-center justify-content-between">
                                        <div>
                                            <p className="text-muted small mb-1">Pending</p>
                                            <h3 className="fw-bold mb-0 text-warning">LKR {stats.pendingPayment.toLocaleString()}</h3>
                                        </div>
                                        <div className="bg-warning bg-opacity-10 p-3 rounded-circle">
                                            <i className="bi bi-hourglass-split text-warning fs-4"></i>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    {/* Earnings Table */}
                    <Card className="border-0 shadow-sm">
                        <Card.Header className="bg-white border-bottom py-3">
                            <h5 className="fw-bold mb-0">Earnings History</h5>
                        </Card.Header>
                        <Card.Body className="p-0">
                            {earnings.length > 0 ? (
                                <Table responsive className="mb-0">
                                    <thead className="bg-light">
                                        <tr>
                                            <th className="border-0 py-3 ps-4">Job Details</th>
                                            <th className="border-0 py-3">Customer</th>
                                            <th className="border-0 py-3">Date</th>
                                            <th className="border-0 py-3">Amount</th>
                                            <th className="border-0 py-3 pe-4">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {earnings.map(earning => (
                                            <tr key={earning.id}>
                                                <td className="py-3 ps-4">
                                                    <div>
                                                        <strong>{earning.applianceType}</strong>
                                                        <p className="text-muted small mb-0">{earning.brand}</p>
                                                    </div>
                                                </td>
                                                <td className="py-3">
                                                    <div>
                                                        <span>{earning.customerName}</span>
                                                        <p className="text-muted small mb-0">{earning.city}</p>
                                                    </div>
                                                </td>
                                                <td className="py-3 text-muted">
                                                    {earning.preferredDate || 'N/A'}
                                                </td>
                                                <td className="py-3">
                                                    <strong className="text-danger">LKR {(earning.serviceFee || 0).toLocaleString()}</strong>
                                                </td>
                                                <td className="py-3 pe-4">
                                                    <Badge bg={earning.paid ? 'success' : 'warning'}>
                                                        {earning.paid ? 'Paid' : 'Pending'}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            ) : (
                                <div className="text-center py-5">
                                    <i className="bi bi-wallet2 fs-1 text-muted d-block mb-3"></i>
                                    <h5 className="text-muted">No earnings yet</h5>
                                    <p className="text-muted small">Complete jobs to start earning!</p>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Container>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .bg-gradient-danger {
                    background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
                }
            `}} />
        </Layout>
    );
}
