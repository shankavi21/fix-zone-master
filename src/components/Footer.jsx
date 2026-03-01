import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
import Logo from './Logo';

export default function Footer() {
    return (
        <footer style={{ backgroundColor: '#111827', color: 'white' }} className="py-5 mt-auto border-top border-secondary border-opacity-10">
            <Container>
                <Row className="gy-4">
                    <Col md={4} className="mb-4 mb-md-0">
                        <div className="mb-3">
                            <Logo textColor="white" size="normal" />
                        </div>
                        <p className="text-secondary small">
                            Sri Lanka's most trusted on-demand appliance repair service.
                            Quality workmanship, guaranteed.
                        </p>
                        <p className="text-secondary small mb-0">
                            &copy; {new Date().getFullYear()} FixZone. All rights reserved.
                        </p>
                    </Col>
                    <Col md={4} className="mb-4 mb-md-0">
                        <h6 className="fw-bold text-white mb-3 text-uppercase small" style={{ letterSpacing: '1px' }}>Quick Links</h6>
                        <ul className="list-unstyled text-secondary small">
                            <li className="mb-2"><Link to="/about" className="text-decoration-none text-secondary hover-white transition-all">About Us</Link></li>
                            <li className="mb-2"><Link to="/privacy" className="text-decoration-none text-secondary hover-white transition-all">Privacy Policy</Link></li>
                            <li className="mb-2"><Link to="/terms" className="text-decoration-none text-secondary hover-white transition-all">Terms of Service</Link></li>
                            <li className="mb-2"><Link to="/contact" className="text-decoration-none text-secondary hover-white transition-all">Contact Support</Link></li>
                        </ul>
                    </Col>
                    <Col md={4}>
                        <h6 className="fw-bold text-white mb-3 text-uppercase small" style={{ letterSpacing: '1px' }}>Contact Us</h6>
                        <ul className="list-unstyled text-secondary small mb-4">
                            <li className="mb-2"><i className="bi bi-envelope me-2"></i> support@fixzone.lk</li>
                            <li className="mb-2"><i className="bi bi-telephone me-2"></i> +94 11 234 5678</li>
                            <li className="mb-2"><i className="bi bi-geo-alt me-2"></i> Colombo, Sri Lanka</li>
                        </ul>
                        <div className="d-flex gap-3">
                            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="text-secondary fs-5 hover-white"><i className="bi bi-facebook"></i></a>
                            <a href="https://twitter.com" target="_blank" rel="noreferrer" className="text-secondary fs-5 hover-white"><i className="bi bi-twitter"></i></a>
                            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="text-secondary fs-5 hover-white"><i className="bi bi-instagram"></i></a>
                            <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="text-secondary fs-5 hover-white"><i className="bi bi-linkedin"></i></a>
                        </div>
                    </Col>
                </Row>
            </Container>
        </footer>
    );
}
