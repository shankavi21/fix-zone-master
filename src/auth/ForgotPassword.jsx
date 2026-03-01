import React, { useRef, useState } from "react";
import { Form, Button, Alert, Spinner, Container, Row, Col } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";
import Logo from "../components/Logo";
import bgTexture from "../assets/login-bg.png";
import heroImg from "../assets/login-hero.png";

export default function ForgotPassword() {
    const emailRef = useRef();
    const { resetPassword } = useAuth();
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        try {
            setMessage("");
            setError("");
            setLoading(true);
            await resetPassword(emailRef.current.value);
            setMessage("Recovery instructions have been sent to your email.");
        } catch (e) {
            setError("Failed to reset password. Please verify your email.");
        }
        setLoading(false);
    }

    return (
        <div className="login-reference-wrapper">
            <div className="bg-image-overlay" style={{ backgroundImage: `url(${heroImg})` }}></div>
            <Container className="d-flex align-items-center justify-content-center min-vh-100 p-3 p-md-5">
                <div className="login-main-card shadow-lg animate-fade-in">
                    <Row className="g-0 h-100">
                        {/* Left Side: Brand Visual (Full Height, Half Width) */}
                        <Col lg={6} className="visual-side d-none d-lg-flex flex-column p-0 position-relative overflow-hidden">
                            <div className="image-overlay"></div>
                            <img src={heroImg} alt="Technician" className="side-hero-img" />

                            <div className="visual-content d-flex flex-column h-100 p-5 text-white position-relative" style={{ zIndex: 10 }}>
                                <div className="mb-auto">
                                    <Logo textColor="white" size="normal" />
                                </div>
                                <div className="mt-auto">
                                    <h1 className="display-5 fw-800 mb-3 text-uppercase">
                                        Don't Worry, <br />
                                        We're Here!
                                    </h1>
                                    <p className="fw-normal text-white-50 mb-4" style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>
                                        Enter your email and we'll send you
                                        instructions to get you back on track
                                        with Sri Lanka's best technicians.
                                    </p>
                                    <p className="small fw-bold tracking-wider mb-0 opacity-50">YOUR JOURNEY CONTINUES HERE.</p>
                                </div>
                            </div>
                        </Col>

                        {/* Right Side: Authentication Form */}
                        <Col lg={6} className="form-side bg-light-cool d-flex flex-column justify-content-center p-4 p-md-5">
                            <div className="login-form-box shadow-sm animate-slide-up mx-auto w-100 p-4 p-md-5">
                                <div className="mb-5 text-center">
                                    <h2 className="fw-800 text-dark mb-2">RESET PASSWORD</h2>
                                    <p className="text-secondary fw-500">Recover your account access efficiently.</p>
                                </div>

                                {error && (
                                    <Alert variant="danger" className="border-0 rounded-3 py-3 mb-4 animate-shake">
                                        <i className="bi bi-exclamation-triangle-fill me-2"></i> {error}
                                    </Alert>
                                )}
                                {message && (
                                    <Alert variant="success" className="border-0 rounded-3 py-3 mb-4 text-success" style={{ backgroundColor: 'rgba(230, 57, 70, 0.05)' }}>
                                        <i className="bi bi-check-circle-fill me-2"></i> {message}
                                    </Alert>
                                )}

                                <Form onSubmit={handleSubmit} className="reference-form">
                                    <Form.Group className="mb-5">
                                        <Form.Label className="small fw-bold text-dark mb-2">Account Email Address</Form.Label>
                                        <Form.Control
                                            type="email"
                                            ref={emailRef}
                                            required
                                            placeholder="yourname@domain.com"
                                            className="custom-form-input"
                                        />
                                    </Form.Group>

                                    <Button
                                        disabled={loading}
                                        type="submit"
                                        className="w-100 py-3 rounded-2 fw-bold signin-btn mb-4"
                                    >
                                        {loading ? <Spinner size="sm" animation="border" /> : "Send Recovery Link"}
                                    </Button>
                                </Form>

                                <div className="text-center mt-3">
                                    <Link to="/login" className="text-decoration-none text-secondary fw-bold small hover-dark">
                                        <i className="bi bi-arrow-left me-2"></i>Back to Sign In
                                    </Link>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </div>
            </Container>

            <style dangerouslySetInnerHTML={{
                __html: `
                @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap');
                
                .login-reference-wrapper {
                    font-family: 'Montserrat', sans-serif;
                    min-height: 100vh;
                    position: relative;
                    overflow-x: hidden;
                }

                .bg-image-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-size: cover;
                    background-position: center;
                    filter: blur(8px) brightness(0.4);
                    transform: scale(1.1);
                    z-index: -1;
                }

                .login-main-card {
                    background: transparent;
                    width: 100%;
                    max-width: 1100px;
                    min-height: 700px;
                    overflow: hidden;
                    border: none;
                }

                .visual-side {
                    background-color: #000;
                    border-top-left-radius: 2.5rem;
                    border-bottom-left-radius: 2.5rem;
                    position: relative;
                }

                .side-hero-img {
                    position: absolute;
                    top: 0;
                    right: 0;
                    bottom: 0;
                    left: 0;
                    height: 100%;
                    width: 100%;
                    object-fit: cover;
                }

                .image-overlay {
                    position: absolute;
                    top: 0;
                    right: 0;
                    bottom: 0;
                    left: 0;
                    background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.1) 100%);
                    z-index: 1;
                }

                .form-side {
                    background: #F8FAFC;
                    border-top-right-radius: 2.5rem;
                    border-bottom-right-radius: 2.5rem;
                }

                .bg-light-cool { background-color: #F8FAFC; }

                .login-form-box {
                    background: #fff;
                    border-radius: 2.5rem;
                    border: 1px solid #E2E8F0;
                    min-height: 600px;
                    max-width: 480px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                }

                .fw-800 { font-weight: 800; }
                .tracking-wider { letter-spacing: 0.1em; }
                .max-w-400 { max-width: 400px; }
                .text-dark-accent { color: #E63946; }

                .custom-form-input {
                    padding: 0.85rem 1rem !important;
                    border: 1.5px solid #E2E8F0 !important;
                    border-radius: 0.75rem !important;
                    font-size: 0.9rem !important;
                    background: #fff !important;
                    font-weight: 500;
                    transition: border-color 0.2s !important;
                }

                .custom-form-input:focus {
                    border-color: #E63946 !important;
                    box-shadow: none !important;
                }

                .signin-btn {
                    background-color: #E63946 !important;
                    border: none !important;
                    font-size: 1rem !important;
                    letter-spacing: 0.5px;
                    box-shadow: 0 4px 12px rgba(230, 57, 70, 0.25) !important;
                }

                .signin-btn:hover {
                    background-color: #D62828 !important;
                    transform: translateY(-1px);
                }

                .animate-fade-in {
                    animation: fadeIn 0.8s ease-out;
                }

                .animate-slide-up {
                    animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1);
                }

                .animate-shake {
                    animation: shake 0.5s linear;
                }

                @keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-10px); }
                    75% { transform: translateX(10px); }
                }

                .hover-dark:hover { color: #E63946 !important; }

                @media (max-width: 991px) {
                    .login-main-card { border-radius: 2rem; min-height: auto; }
                    .form-side { padding: 3rem 1.5rem !important; }
                }
            `}} />
        </div>
    );
}
