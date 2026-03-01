import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Alert } from 'react-bootstrap';
import Layout from '../components/Layout';
import emailjs from '@emailjs/browser';

export default function Contact() {
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const formRef = React.useRef();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Send email using EmailJS
            await emailjs.sendForm(
                'service_t7ls76k',
                'template_5wk2r0q',
                formRef.current,
                '362M_KS_FKLSo_vpN'
            );

            setSent(true);
        } catch (error) {
            console.error("Failed to send email:", error);
            alert("Failed to send message. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="bg-white py-5">
                <Container>
                    <Row className="g-5">
                        <Col lg={6}>
                            <h1 className="fw-bold mb-4">Get in Touch</h1>
                            <p className="text-secondary fs-5 mb-5">
                                Have a question or need assistance? Our support team is here to help you 24/7.
                            </p>

                            <div className="d-flex align-items-center gap-4 mb-4">
                                <div className="bg-light p-3 rounded-circle text-primary-red">
                                    <i className="bi bi-envelope fs-3"></i>
                                </div>
                                <div>
                                    <h6 className="fw-bold mb-0">Email Us</h6>
                                    <p className="text-secondary mb-0">support@fixzone.lk</p>
                                </div>
                            </div>

                            <div className="d-flex align-items-center gap-4 mb-4">
                                <div className="bg-light p-3 rounded-circle text-primary-red">
                                    <i className="bi bi-telephone fs-3"></i>
                                </div>
                                <div>
                                    <h6 className="fw-bold mb-0">Call Us</h6>
                                    <p className="text-secondary mb-0">+94 11 234 5678</p>
                                </div>
                            </div>

                            <div className="d-flex align-items-center gap-4">
                                <div className="bg-light p-3 rounded-circle text-primary-red">
                                    <i className="bi bi-geo-alt fs-3"></i>
                                </div>
                                <div>
                                    <h6 className="fw-bold mb-0">Our Office</h6>
                                    <p className="text-secondary mb-0">Colombo, Sri Lanka</p>
                                </div>
                            </div>
                        </Col>

                        <Col lg={6}>
                            <div className="bg-light p-5 rounded-5">
                                {sent ? (
                                    <Alert variant="success" className="rounded-4 border-0 shadow-sm py-4 text-center">
                                        <i className="bi bi-check-circle-fill fs-1 d-block mb-3"></i>
                                        <h4 className="fw-bold">Message Sent!</h4>
                                        <p className="mb-0">We'll get back to you as soon as possible.</p>
                                    </Alert>
                                ) : (
                                    <Form ref={formRef} onSubmit={handleSubmit}>
                                        <Form.Group className="mb-4">
                                            <Form.Label className="small fw-bold text-muted">YOUR NAME</Form.Label>
                                            <Form.Control name="name" required className="rounded-3 border-0 py-3 px-4 shadow-sm" placeholder="John Doe" />
                                        </Form.Group>
                                        <Form.Group className="mb-4">
                                            <Form.Label className="small fw-bold text-muted">EMAIL ADDRESS</Form.Label>
                                            <Form.Control name="email" required type="email" className="rounded-3 border-0 py-3 px-4 shadow-sm" placeholder="john@example.com" />
                                        </Form.Group>
                                        <Form.Group className="mb-4">
                                            <Form.Label className="small fw-bold text-muted">MESSAGE</Form.Label>
                                            <Form.Control name="message" required as="textarea" rows={4} className="rounded-3 border-0 py-3 px-4 shadow-sm" placeholder="How can we help you?" />
                                        </Form.Group>
                                        <Button type="submit" disabled={loading} className="w-100 py-3 rounded-pill fw-bold border-0" style={{ backgroundColor: 'var(--primary-red)' }}>
                                            {loading ? 'SENDING...' : 'SEND MESSAGE'}
                                        </Button>
                                    </Form>
                                )}
                            </div>
                        </Col>
                    </Row>
                </Container>
            </div>
        </Layout>
    );
}
