import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Badge } from 'react-bootstrap';
import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import AdminLayout from '../components/AdminLayout';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

export default function AdminAnalytics() {
    const [analytics, setAnalytics] = useState({
        totalRevenue: 0,
        monthlyTickets: [],
        statusDistribution: {},
        applianceDistribution: {},
        topTechnicians: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                // Fetch tickets
                const ticketsSnapshot = await getDocs(collection(db, 'tickets'));
                const tickets = ticketsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // Calculate revenue
                const totalRevenue = tickets.reduce((sum, ticket) => {
                    return sum + (ticket.totalCost || 500);
                }, 0);

                // Status distribution
                const statusDist = {};
                tickets.forEach(ticket => {
                    statusDist[ticket.status] = (statusDist[ticket.status] || 0) + 1;
                });

                // Appliance distribution
                const applianceDist = {};
                tickets.forEach(ticket => {
                    applianceDist[ticket.applianceType] = (applianceDist[ticket.applianceType] || 0) + 1;
                });

                setAnalytics({
                    totalRevenue,
                    monthlyTickets: tickets,
                    statusDistribution: statusDist,
                    applianceDistribution: applianceDist,
                    topTechnicians: []
                });
                setLoading(false);
            } catch (error) {
                console.error('Error fetching analytics:', error);
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, []);

    const statusChartData = {
        labels: Object.keys(analytics.statusDistribution),
        datasets: [{
            label: 'Tickets by Status',
            data: Object.values(analytics.statusDistribution),
            backgroundColor: [
                '#f59e0b',
                '#3b82f6',
                '#10b981',
                '#ef4444',
                '#8b5cf6',
                '#ec4899'
            ]
        }]
    };

    const applianceChartData = {
        labels: Object.keys(analytics.applianceDistribution),
        datasets: [{
            label: 'Tickets by Appliance',
            data: Object.values(analytics.applianceDistribution),
            backgroundColor: 'rgba(128, 0, 0, 0.6)',
            borderColor: 'rgba(128, 0, 0, 1)',
            borderWidth: 2
        }]
    };

    return (
        <AdminLayout>
            <div className="admin-analytics">
                <div className="mb-4">
                    <h2 className="fw-bold mb-1">Analytics & Reports</h2>
                    <p className="text-muted">Platform performance insights</p>
                </div>

                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-danger" role="status"></div>
                    </div>
                ) : (
                    <>
                        {/* Key Metrics */}
                        <Row className="g-4 mb-4">
                            <Col lg={4}>
                                <Card className="border-0 shadow-sm rounded-4 h-100">
                                    <Card.Body className="p-4">
                                        <div className="d-flex align-items-center gap-3 mb-3">
                                            <div className="bg-success bg-opacity-10 p-3 rounded-3">
                                                <i className="bi bi-currency-dollar fs-3 text-success"></i>
                                            </div>
                                            <div>
                                                <div className="text-muted small">Total Revenue</div>
                                                <h3 className="fw-bold mb-0">LKR {analytics.totalRevenue.toLocaleString()}</h3>
                                            </div>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col lg={4}>
                                <Card className="border-0 shadow-sm rounded-4 h-100">
                                    <Card.Body className="p-4">
                                        <div className="d-flex align-items-center gap-3 mb-3">
                                            <div className="bg-primary bg-opacity-10 p-3 rounded-3">
                                                <i className="bi bi-card-checklist fs-3 text-primary"></i>
                                            </div>
                                            <div>
                                                <div className="text-muted small">Total Tickets</div>
                                                <h3 className="fw-bold mb-0">{analytics.monthlyTickets.length}</h3>
                                            </div>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col lg={4}>
                                <Card className="border-0 shadow-sm rounded-4 h-100">
                                    <Card.Body className="p-4">
                                        <div className="d-flex align-items-center gap-3 mb-3">
                                            <div className="bg-warning bg-opacity-10 p-3 rounded-3">
                                                <i className="bi bi-graph-up fs-3 text-warning"></i>
                                            </div>
                                            <div>
                                                <div className="text-muted small">Avg. Ticket Value</div>
                                                <h3 className="fw-bold mb-0">
                                                    LKR {analytics.monthlyTickets.length > 0
                                                        ? Math.round(analytics.totalRevenue / analytics.monthlyTickets.length).toLocaleString()
                                                        : 0}
                                                </h3>
                                            </div>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>

                        {/* Charts */}
                        <Row className="g-4">
                            <Col lg={6}>
                                <Card className="border-0 shadow-sm rounded-4">
                                    <Card.Header className="bg-white border-0 p-4">
                                        <h5 className="fw-bold mb-0">Ticket Status Distribution</h5>
                                    </Card.Header>
                                    <Card.Body className="p-4">
                                        <Doughnut data={statusChartData} options={{ maintainAspectRatio: true }} />
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col lg={6}>
                                <Card className="border-0 shadow-sm rounded-4">
                                    <Card.Header className="bg-white border-0 p-4">
                                        <h5 className="fw-bold mb-0">Services by Appliance Type</h5>
                                    </Card.Header>
                                    <Card.Body className="p-4">
                                        <Bar data={applianceChartData} options={{ maintainAspectRatio: true, scales: { y: { beginAtZero: true } } }} />
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    </>
                )}
            </div>
        </AdminLayout>
    );
}
