import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, InputGroup, Button } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import 'bootstrap-icons/font/bootstrap-icons.css';

const SERVICES = [
    { icon: "bi-snow2", title: "Refrigerator", id: "Refrigerator", color: "rgba(128, 0, 0, 0.05)", iconColor: "var(--primary-red)", desc: "Cooling, compressor & gas leak fixes" },
    { icon: "bi-droplet-fill", title: "Washing Machine", id: "Washing Machine", color: "rgba(128, 0, 0, 0.05)", iconColor: "var(--primary-red)", desc: "Drum, motor & drain system servicing" },
    { icon: "bi-wind", title: "AC Service", id: "Air Conditioner", color: "rgba(128, 0, 0, 0.05)", iconColor: "var(--primary-red)", desc: "Deep cleaning, gas filling & PCB repair" },
    { icon: "bi-circle-square", title: "Microwave", id: "Microwave", color: "rgba(128, 0, 0, 0.05)", iconColor: "var(--primary-red)", desc: "Magnetron, heating & keypad repairs" },
    { icon: "bi-tv", title: "Television", id: "Television", color: "rgba(128, 0, 0, 0.05)", iconColor: "var(--primary-red)", desc: "Display panels, backlight & logic boards" },
    { icon: "bi-fire", title: "Gas Stove", id: "Gas Stove", color: "rgba(128, 0, 0, 0.05)", iconColor: "var(--primary-red)", desc: "Burner cleaning, ignition & leak repairs" },
    { icon: "bi-droplet-half", title: "Water Purifier", id: "Water Purifier", color: "rgba(128, 0, 0, 0.05)", iconColor: "var(--primary-red)", desc: "Filtration system & pump replacement" },
    { icon: "bi-box-seam", title: "Oven Repair", id: "Oven", color: "rgba(128, 0, 0, 0.05)", iconColor: "var(--primary-red)", desc: "Heating elements & thermostat servicing" },
    { icon: "bi-asterisk", title: "Dishwasher", id: "Dishwasher", color: "rgba(128, 0, 0, 0.05)", iconColor: "var(--primary-red)", desc: "Pump, drainage & spraying arm repairs" },
    { icon: "bi-plug", title: "Kettle & Iron", id: "Electric Kettle & Iron", color: "rgba(128, 0, 0, 0.05)", iconColor: "var(--primary-red)", desc: "Cord replacement & heating fixes" },
    { icon: "bi-fan", title: "Fan & Cooler", id: "Fan & Cooler", color: "rgba(128, 0, 0, 0.05)", iconColor: "var(--primary-red)", desc: "Motor winding, regulator & noise fixes" },
    { icon: "bi-battery-charging", title: "Inverter & UPS", id: "Inverter & UPS", color: "rgba(128, 0, 0, 0.05)", iconColor: "var(--primary-red)", desc: "Battery checks & circuit board repairs" }
];

export default function Services() {
    const navigate = useNavigate();
    const location = useLocation();
    const [search, setSearch] = useState('');

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const q = queryParams.get('q');
        if (q) {
            setSearch(q);
        }
    }, [location.search]);

    const filteredServices = SERVICES.filter(s =>
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.desc.toLowerCase().includes(search.toLowerCase())
    );

    const handleSelect = (id) => {
        navigate('/customer/create-ticket', { state: { applianceType: id } });
    };

    return (
        <Layout>
            <div className="services-page-premium pb-5">
                {/* Hero Header Section */}
                <section className="services-hero py-5 mb-5 text-center position-relative overflow-hidden">
                    <div className="hero-bg-accent"></div>
                    <Container className="position-relative z-1">
                        <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill bg-danger bg-opacity-10 text-danger fw-bold small mb-3">
                            <span className="pulsing-dot-small"></span>
                            24/7 EXPERT SUPPORT
                        </div>
                        <h1 className="fw-extrabold display-4 text-dark mb-3 ls-n1">
                            Our Specialist <span className="text-primary-red">Repair Services</span>
                        </h1>
                        <p className="text-secondary fs-5 mx-auto mb-5" style={{ maxWidth: '700px' }}>
                            Choose from our range of verified expert solutions for all your home and office appliances.
                            Transparent pricing and guaranteed quality.
                        </p>

                        {/* Integrated Ultra-Sleek Search */}
                        <div className="search-container-premium mx-auto shadow-premium">
                            <InputGroup className="bg-white rounded-pill overflow-hidden border-0 p-1">
                                <InputGroup.Text className="bg-white border-0 ps-4">
                                    <i className="bi bi-search text-danger fs-5"></i>
                                </InputGroup.Text>
                                <Form.Control
                                    placeholder="Search for an appliance (e.g. Refrigerator, AC...)"
                                    className="border-0 shadow-none py-3 fw-medium"
                                    style={{ fontSize: '1.05rem' }}
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                                {search && (
                                    <Button variant="link" className="text-muted pe-4 text-decoration-none" onClick={() => setSearch('')}>
                                        <i className="bi bi-x-circle-fill"></i>
                                    </Button>
                                )}
                            </InputGroup>
                        </div>
                    </Container>
                </section>

                <Container>
                    <div className="d-flex align-items-center justify-content-between mb-4 px-2">
                        <h4 className="fw-bold text-dark mb-0">All Available Services</h4>
                        <div className="text-muted small fw-semibold">{filteredServices.length} appliances found</div>
                    </div>

                    <Row className="g-4">
                        {filteredServices.map((service) => (
                            <Col key={service.id} xs={12} sm={6} md={4} lg={3}>
                                <div
                                    className="professional-service-card h-100 bg-white rounded-5 border-0 shadow-premium clickable overflow-hidden position-relative group"
                                    onClick={() => handleSelect(service.id)}
                                >
                                    {/* Card Accent Color Top */}
                                    <div className="card-accent" style={{ backgroundColor: service.iconColor, height: '6px', width: '100%' }}></div>

                                    <div className="p-4 text-center d-flex flex-column h-100">
                                        <div className="icon-platform mx-auto mb-4 rounded-4 d-flex align-items-center justify-content-center shadow-sm"
                                            style={{ width: '80px', height: '80px', background: `${service.color}` }}>
                                            <i className={`bi ${service.icon} fs-1`} style={{ color: service.iconColor }}></i>
                                        </div>

                                        <h5 className="fw-extrabold text-dark mb-2 ls-n1">{service.title}</h5>
                                        <p className="text-muted small mb-4 flex-grow-1 px-2">{service.desc}</p>

                                        <Button
                                            className="w-100 rounded-pill py-2 fw-bold shadow-sm border-0 transition-all btn-book-oval"
                                            style={{ backgroundColor: 'var(--primary-red)', fontSize: '0.85rem', letterSpacing: '0.05em' }}
                                        >
                                            BOOK NOW
                                        </Button>
                                    </div>
                                </div>
                            </Col>
                        ))}
                    </Row>

                    {filteredServices.length === 0 && (
                        <div className="text-center py-5 my-5 animate-fade-in">
                            <i className="bi bi-search-heart display-1 text-danger opacity-10 mb-4 d-block"></i>
                            <h3 className="fw-bold text-dark">No matches found for "{search}"</h3>
                            <p className="text-secondary fs-5">Try searching for another appliance or browse our categories above.</p>
                            <Button variant="outline-danger" className="rounded-pill px-4 mt-3" onClick={() => setSearch('')}>
                                Clear Search Results
                            </Button>
                        </div>
                    )}
                </Container>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .services-page-premium { min-height: 80vh; background-color: #fcfcfc; }
                .services-hero { background: white; border-bottom: 1px solid #f1f5f9; position: relative; }
                .hero-bg-accent {
                    position: absolute;
                    top: -50%;
                    left: 50%;
                    width: 100%;
                    height: 100%;
                    background: radial-gradient(circle, rgba(185, 28, 28, 0.03) 0%, transparent 70%);
                    transform: translateX(-50%);
                    z-index: 0;
                }
                .search-container-premium {
                    max-width: 650px;
                    background: white;
                    padding: 8px;
                    border-radius: 100px;
                    border: 1px solid #f1f5f9;
                }
                .professional-service-card {
                    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    cursor: pointer;
                }
                .professional-service-card:hover {
                    transform: translateY(-12px);
                    box-shadow: 0 25px 50px rgba(185, 28, 28, 0.1) !important;
                }
                .btn-book-oval:hover {
                    background-color: maroon !important;
                    transform: scale(1.02);
                }
                .fw-extrabold { font-weight: 850; }
                .ls-n1 { letter-spacing: -0.01em; }
                
                .pulsing-dot-small {
                    width: 6px;
                    height: 6px;
                    background-color: var(--primary-red);
                    border-radius: 50%;
                    margin-right: 4px;
                    animation: pulse-small 2s infinite;
                }
                @keyframes pulse-small {
                    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(185, 28, 28, 0.7); }
                    70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(185, 28, 28, 0); }
                    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(185, 28, 28, 0); }
                }

                .animate-fade-in { animation: fadeIn 0.5s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            `}} />
        </Layout>
    );
}
