import React, { useRef, useState } from "react";
import { Form, Button, Alert, Spinner, Container, Row, Col } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import Logo from "../components/Logo";
import bgTexture from "../assets/login-bg-dark.png";
import heroImg from "../assets/login-hero-red.jpg";

export default function Signup() {
    const emailRef = useRef();
    const passwordRef = useRef();
    const passwordConfirmRef = useRef();
    const { signup } = useAuth();
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();

        if (passwordRef.current.value !== passwordConfirmRef.current.value) {
            return setError("Passwords do not match");
        }

        try {
            setError("");
            setLoading(true);
            const userCredential = await signup(emailRef.current.value, passwordRef.current.value);
            const user = userCredential.user;

            await setDoc(doc(db, "users", user.uid), {
                email: user.email,
                role: 'customer',
                createdAt: new Date(),
                name: '',
                photoURL: ''
            });

            navigate("/customer/dashboard");
        } catch (e) {
            setError("Failed to create an account. It might already exist.");
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
                                        Join the <br />
                                        FixZone Team!
                                    </h1>
                                    <p className="fw-normal text-white-50 mb-4" style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>
                                        Create an account to track your repairs,
                                        book new services, and connect with
                                        Sri Lanka's best technicians.
                                    </p>
                                    <p className="small fw-bold tracking-wider mb-0 opacity-50">YOUR JOURNEY STARTS HERE.</p>
                                </div>
                            </div>
                        </Col>

                        {/* Right Side: Authentication Form */}
                        <Col lg={6} className="form-side bg-light-cool d-flex flex-column justify-content-center p-4 p-md-5">
                            <div className="login-form-box shadow-sm animate-slide-up mx-auto w-100 p-4 p-md-5">
                                <div className="mb-4 text-center">
                                    <h2 className="fw-800 text-dark mb-2">CREATE ACCOUNT</h2>
                                    <p className="text-secondary fw-500">Sign up today to start your journey.</p>
                                </div>

                                {error && (
                                    <Alert variant="danger" className="border-0 rounded-3 py-3 mb-4 animate-shake">
                                        <i className="bi bi-exclamation-triangle-fill me-2"></i> {error}
                                    </Alert>
                                )}

                                <Form onSubmit={handleSubmit} className="reference-form">
                                    <Form.Group className="mb-3">
                                        <Form.Label className="small fw-bold text-dark mb-2">Email Address</Form.Label>
                                        <Form.Control
                                            type="email"
                                            ref={emailRef}
                                            required
                                            placeholder="Enter your email"
                                            className="custom-form-input"
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label className="small fw-bold text-dark mb-2">Create Password</Form.Label>
                                        <div className="password-input-group position-relative">
                                            <Form.Control
                                                type={showPassword ? "text" : "password"}
                                                ref={passwordRef}
                                                required
                                                placeholder="••••••••"
                                                className="custom-form-input pe-5"
                                            />
                                            <button
                                                type="button"
                                                className="password-toggle-btn"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                                            </button>
                                        </div>
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label className="small fw-bold text-dark mb-2">Confirm Password</Form.Label>
                                        <Form.Control
                                            type="password"
                                            ref={passwordConfirmRef}
                                            required
                                            placeholder="••••••••"
                                            className="custom-form-input"
                                        />
                                    </Form.Group>

                                    <div className="mb-3">
                                        <Form.Check
                                            type="checkbox"
                                            id="terms"
                                            required
                                            label={<span className="small text-dark fw-bold">I agree to the <Link to="/terms" className="text-dark-accent">Terms</Link> & <Link to="/privacy" className="text-dark-accent">Privacy Policy</Link></span>}
                                        />
                                    </div>

                                    <Button
                                        disabled={loading}
                                        type="submit"
                                        className="w-100 py-3 rounded-2 fw-bold signin-btn mb-3"
                                    >
                                        {loading ? <Spinner size="sm" animation="border" /> : "Sign up"}
                                    </Button>
                                </Form>

                                <div className="text-center mt-3">
                                    <span className="text-secondary small fw-bold">Already have an account?</span>
                                    <Link to="/login" className="text-dark-accent fw-800 ms-2 text-decoration-none">Log in</Link>
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
                    filter: blur(4px) brightness(0.3);
                    transform: scale(1.05);
                    z-index: -1;
                }

                .login-main-card {
                    background: transparent;
                    width: 100%;
                    max-width: 1150px;
                    min-height: 720px;
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
                    object-fit: contain;
                    background-color: #111;
                }

                .image-overlay {
                    position: absolute;
                    top: 0;
                    right: 0;
                    bottom: 0;
                    left: 0;
                    background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(220, 53, 69, 0.15) 100%);
                    z-index: 1;
                }

                .form-side {
                    background: #FDFDFD;
                    border-top-right-radius: 2.5rem;
                    border-bottom-right-radius: 2.5rem;
                }

                .bg-light-cool { background-color: #FDFDFD; }

                .login-form-box {
                    background: #fff;
                    border-radius: 2.5rem;
                    border: 1px solid #F1F1F1;
                    min-height: 600px;
                    max-width: 480px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.04) !important;
                }

                .fw-800 { font-weight: 800; }
                .tracking-wider { letter-spacing: 0.1em; }
                .max-w-400 { max-width: 400px; }
                .text-dark-accent { color: #dc3545; }

                .custom-form-input {
                    padding: 0.85rem 1.25rem !important;
                    border: 2px solid #F1F1F1 !important;
                    border-radius: 0.75rem !important;
                    font-size: 0.9rem !important;
                    background: #fff !important;
                    font-weight: 500;
                    transition: border-color 0.2s !important;
                }

                .custom-form-input:focus {
                    border-color: #dc3545 !important;
                    box-shadow: none !important;
                }

                .password-toggle-btn {
                    position: absolute;
                    right: 15px;
                    top: 50%;
                    transform: translateY(-50%);
                    background: transparent;
                    border: none;
                    color: #94A3B8;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .signin-btn {
                    background-color: #dc3545 !important;
                    border: none !important;
                    font-size: 1rem !important;
                    letter-spacing: 0.5px;
                    box-shadow: 0 4px 15px rgba(220, 53, 69, 0.3) !important;
                    height: 54px;
                }

                .signin-btn:hover {
                    background-color: #c82333 !important;
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(220, 53, 69, 0.4) !important;
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

                .form-check-input:checked {
                    background-color: #E63946;
                    border-color: #E63946;
                }

                @media (max-width: 991px) {
                    .login-main-card { border-radius: 2rem; min-height: auto; }
                    .form-side { padding: 3rem 1.5rem !important; }
                }
            `}} />
        </div>
    );
}
