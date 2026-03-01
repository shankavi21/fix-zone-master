import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import Layout from '../components/Layout';

export default function Privacy() {
    return (
        <Layout>
            <div className="bg-light py-5">
                <Container>
                    <div className="bg-white p-5 rounded-4 shadow-sm">
                        <h1 className="fw-bold mb-4">Privacy Policy</h1>
                        <p className="text-muted mb-5">Last updated: January 2026</p>

                        <section className="mb-5">
                            <h4 className="fw-bold mb-3">1. Information We Collect</h4>
                            <p>We collect information you provide directly to us, such as when you create an account, request a service, or contact customer support. This includes your name, email, phone number, and address.</p>
                        </section>

                        <section className="mb-5">
                            <h4 className="fw-bold mb-3">2. How We Use Your Information</h4>
                            <p>We use the information we collect to provide, maintain, and improve our services, to process your transactions, and to communicate with you about your bookings.</p>
                        </section>

                        <section className="mb-5">
                            <h4 className="fw-bold mb-3">3. Data Security</h4>
                            <p>We take reasonable measures to help protect information about you from loss, theft, misuse, and unauthorized access, disclosure, alteration, and destruction.</p>
                        </section>

                        <section className="mb-5">
                            <h4 className="fw-bold mb-3">4. Your Choices</h4>
                            <p>You may update or correct information about yourself at any time by logging into your account or contacting us.</p>
                        </section>
                    </div>
                </Container>
            </div>
        </Layout>
    );
}
