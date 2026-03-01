import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import Layout from '../components/Layout';

export default function Terms() {
    return (
        <Layout>
            <div className="bg-light py-5">
                <Container>
                    <div className="bg-white p-5 rounded-4 shadow-sm">
                        <h1 className="fw-bold mb-4">Terms of Service</h1>
                        <p className="text-muted mb-5">Last updated: January 2026</p>

                        <section className="mb-5">
                            <h4 className="fw-bold mb-3">1. Acceptance of Terms</h4>
                            <p>By accessing and using FixZone, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.</p>
                        </section>

                        <section className="mb-5">
                            <h4 className="fw-bold mb-3">2. Service Description</h4>
                            <p>FixZone provides a platform connecting customers with appliance repair technicians. While we vet our partners, the service contract is between the customer and the service provider.</p>
                        </section>

                        <section className="mb-5">
                            <h4 className="fw-bold mb-3">3. Payments and Cancellations</h4>
                            <p>Orders are subject to a visiting charge. Cancellations made within 2 hours of the scheduled slot may incur a fee. All payments are processed through our secure payment partners.</p>
                        </section>

                        <section className="mb-5">
                            <h4 className="fw-bold mb-3">4. Warranty</h4>
                            <p>We provide a 30-day warranty on the labor performed by our technicians. Parts used are subject to the manufacturer's warranty.</p>
                        </section>
                    </div>
                </Container>
            </div>
        </Layout>
    );
}
