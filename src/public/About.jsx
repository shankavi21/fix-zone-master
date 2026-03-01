import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import Layout from '../components/Layout';

export default function About() {
    return (
        <Layout>
            <div className="bg-white">
                {/* Hero Section */}
                <div className="bg-light py-5 mb-5">
                    <Container className="text-center py-5">
                        <h1 className="display-3 fw-bold mb-3">About <span className="text-primary-red">FixZone</span></h1>
                        <p className="lead text-secondary mx-auto" style={{ maxWidth: '700px' }}>
                            We are Sri Lanka's leading digital platform for appliance repairs,
                            committed to bringing reliability and professional expertise to every home.
                        </p>
                    </Container>
                </div>

                <Container className="mb-5">
                    <Row className="align-items-center g-5 mb-5">
                        <Col lg={6}>
                            <h2 className="fw-bold mb-4">Our Mission</h2>
                            <p className="text-secondary fs-5">
                                Our mission is to simplify home maintenance by providing a seamless,
                                transparent, and high-quality repair experience. We empower local
                                technicians while ensuring customers get the best value and peace of mind.
                            </p>
                        </Col>
                        <Col lg={6}>
                            <div className="bg-light rounded-5 p-5 text-center">
                                <i className="bi bi-bullseye text-primary-red" style={{ fontSize: '5rem' }}></i>
                            </div>
                        </Col>
                    </Row>

                    <Row className="g-4 py-5">
                        <Col md={4}>
                            <div className="text-center p-4">
                                <h1 className="fw-black text-primary-red mb-2">10k+</h1>
                                <p className="fw-bold text-dark">Repairs Completed</p>
                            </div>
                        </Col>
                        <Col md={4}>
                            <div className="text-center p-4">
                                <h1 className="fw-black text-primary-red mb-2">500+</h1>
                                <p className="fw-bold text-dark">Expert Technicians</p>
                            </div>
                        </Col>
                        <Col md={4}>
                            <div className="text-center p-4">
                                <h1 className="fw-black text-primary-red mb-2">25+</h1>
                                <p className="fw-bold text-dark">Districts Covered</p>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </div>
        </Layout>
    );
}
