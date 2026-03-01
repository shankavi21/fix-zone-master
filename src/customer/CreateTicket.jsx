import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Form, Button, Badge, Alert, Spinner, Modal } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { uploadToCloudinary } from '../utils/cloudinary';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
import Layout from '../components/Layout';
import LocationPicker from '../components/LocationPicker';

const APPLIANCE_CATEGORIES = [
    { id: 'Refrigerator', icon: 'bi-snow2', label: 'Refrigerator', color: 'rgba(128, 0, 0, 0.05)', iconColor: 'var(--primary-red)' },
    { id: 'Washing Machine', icon: 'bi-droplet-fill', label: 'Washing Machine', color: 'rgba(128, 0, 0, 0.05)', iconColor: 'var(--primary-red)' },
    { id: 'Air Conditioner', icon: 'bi-wind', label: 'AC Service', color: 'rgba(128, 0, 0, 0.05)', iconColor: 'var(--primary-red)' },
    { id: 'Microwave', icon: 'bi-circle-square', label: 'Microwave', color: 'rgba(128, 0, 0, 0.05)', iconColor: 'var(--primary-red)' },
    { id: 'Television', icon: 'bi-tv', label: 'Television', color: 'rgba(128, 0, 0, 0.05)', iconColor: 'var(--primary-red)' },
    { id: 'Gas Stove', icon: 'bi-fire', label: 'Gas Stove', color: 'rgba(128, 0, 0, 0.05)', iconColor: 'var(--primary-red)' },
    { id: 'Water Purifier', icon: 'bi-droplet-half', label: 'Water Purifier', color: 'rgba(128, 0, 0, 0.05)', iconColor: 'var(--primary-red)' },
    { id: 'Oven', icon: 'bi-box-seam', label: 'Oven Repair', color: 'rgba(128, 0, 0, 0.05)', iconColor: 'var(--primary-red)' },
    { id: 'Dishwasher', icon: 'bi-asterisk', label: 'Dishwasher', color: 'rgba(128, 0, 0, 0.05)', iconColor: 'var(--primary-red)' },
    { id: 'Electric Kettle & Iron', icon: 'bi-plug', label: 'Kettle & Iron', color: 'rgba(128, 0, 0, 0.05)', iconColor: 'var(--primary-red)' },
    { id: 'Fan & Cooler', icon: 'bi-fan', label: 'Fan & Cooler', color: 'rgba(128, 0, 0, 0.05)', iconColor: 'var(--primary-red)' },
    { id: 'Inverter & UPS', icon: 'bi-battery-charging', label: 'Inverter & UPS', color: 'rgba(128, 0, 0, 0.05)', iconColor: 'var(--primary-red)' },
    { id: 'Laptop', icon: 'bi-cpu', label: 'Laptop/PC', color: 'rgba(128, 0, 0, 0.05)', iconColor: 'var(--primary-red)' },
    { id: 'IPTV', icon: 'bi-tv-fill', label: 'IPTV/Setup Box', color: 'rgba(128, 0, 0, 0.05)', iconColor: 'var(--primary-red)' }
];

const COMMON_ISSUES = {
    'Refrigerator': ['Not Cooling', 'Leaking Water', 'Making Noise', 'Ice Build-up', 'Power Issue'],
    'Washing Machine': ['Not Draining', 'Not Spinning', 'Leaking', 'Noisy', 'Door Stuck'],
    'Air Conditioner': ['Not Cooling', 'Water Leaking', 'Bad Smell', 'Noisy', 'Remote Not Working'],
    'IPTV': ['No Signal', 'Remote Not Working', 'Pixelated Picture', 'Audio Issues', 'Channel Missing'],
    'default': ['Not Working', 'Power Issue', 'Strange Noise', 'Physical Damage', 'Maintenance']
};

const BRANDS = ['Samsung', 'LG', 'Whirlpool', 'Panasonic', 'Singer', 'Abans', 'Hitachi', 'Sony', 'Philips', 'Electrolux', 'Damro', 'Other'];
const DISTRICTS = [
    "Ampara", "Anuradhapura", "Badulla", "Batticaloa", "Colombo", "Galle", "Gampaha",
    "Hambantota", "Jaffna", "Kalutara", "Kandy", "Kegalle", "Kilinochchi", "Kurunegala",
    "Mannar", "Matale", "Matara", "Monaragala", "Mullaitivu", "Nuwara Eliya",
    "Polonnaruwa", "Puttalam", "Ratnapura", "Trincomalee", "Vavuniya"
];

const DISTRICT_COORDS = {
    "Ampara": { lat: 7.2842, lng: 81.6747 },
    "Anuradhapura": { lat: 8.3114, lng: 80.4037 },
    "Badulla": { lat: 6.9934, lng: 81.0550 },
    "Batticaloa": { lat: 7.7310, lng: 81.6747 },
    "Colombo": { lat: 6.9271, lng: 79.8612 },
    "Galle": { lat: 6.0535, lng: 80.2210 },
    "Gampaha": { lat: 7.0840, lng: 80.0098 },
    "Hambantota": { lat: 6.1245, lng: 81.1185 },
    "Jaffna": { lat: 9.6615, lng: 80.0255 },
    "Kalutara": { lat: 6.5854, lng: 79.9607 },
    "Kandy": { lat: 7.2906, lng: 80.6337 },
    "Kegalle": { lat: 7.2513, lng: 80.3464 },
    "Kilinochchi": { lat: 9.3803, lng: 80.4037 },
    "Kurunegala": { lat: 7.4818, lng: 80.3609 },
    "Mannar": { lat: 8.9810, lng: 79.9044 },
    "Matale": { lat: 7.4675, lng: 80.6234 },
    "Matara": { lat: 5.9549, lng: 80.5550 },
    "Monaragala": { lat: 6.8724, lng: 81.3507 },
    "Mullaitivu": { lat: 9.2671, lng: 80.8144 },
    "Nuwara Eliya": { lat: 6.9497, lng: 80.7891 },
    "Polonnaruwa": { lat: 7.9403, lng: 81.0188 },
    "Puttalam": { lat: 8.0362, lng: 79.8601 },
    "Ratnapura": { lat: 6.7056, lng: 80.3847 },
    "Trincomalee": { lat: 8.5711, lng: 81.2335 },
    "Vavuniya": { lat: 8.7542, lng: 80.4982 }
};

const TIME_SLOTS = [
    { id: 'Morning', label: 'Morning (9 AM - 12 PM)' },
    { id: 'Afternoon', label: 'Afternoon (12 PM - 4 PM)' },
    { id: 'Evening', label: 'Evening (4 PM - 8 PM)' }
];

const MOCK_TECHNICIANS = [
    {
        id: 'M1',
        name: 'Aruna Perera',
        image: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=200&h=200&fit=crop',
        rating: 4.9,
        reviews: 156,
        experience: '12 Years',
        districts: ['Colombo', 'Gampaha', 'Kalutara'],
        services: ['Refrigerator', 'Washing Machine', 'Air Conditioner'],
        baseServiceCharge: 1500,
        warranty: '90-Day Warranty',
        verified: true,
        bio: 'Senior technician specialized in cooling systems and major home appliances.',
        certifications: ['Certified HVAC Engineer'],
        availability: 'Available Today • 8 AM - 8 PM'
    },
    {
        id: 'M2',
        name: 'Sameera Silva',
        image: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200&h=200&fit=crop',
        rating: 4.7,
        reviews: 89,
        experience: '8 Years',
        districts: ['Colombo', 'Kandy', 'Matale'],
        services: ['Television', 'Microwave', 'Oven'],
        baseServiceCharge: 1200,
        warranty: '60-Day Warranty',
        verified: true,
        bio: 'Expert in consumer electronics and kitchen appliance motherboard repairs.',
        certifications: ['Electronics Diploma'],
        availability: 'Mon - Sat • 9 AM - 6 PM'
    },
    {
        id: 'M3',
        name: 'Technician Risi',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
        rating: 4.9,
        reviews: 45,
        experience: '7 Years',
        districts: ['Jaffna', 'Colombo', 'Gampaha'],
        services: ['Refrigerator', 'Television', 'Air Conditioner', 'Washing Machine'],
        baseServiceCharge: 1100,
        warranty: '60-Day Warranty',
        verified: true,
        bio: 'Specialist in cooling systems and smart television repairs.',
        certifications: ['Home Appliance Master'],
        availability: 'Mon - Sun • 8 AM - 7 PM'
    },
    {
        id: 'M4',
        name: 'Tharshan',
        image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop',
        rating: 4.8,
        reviews: 28,
        experience: '5 Years',
        districts: ['Jaffna', 'Kilinochchi'],
        services: ['Laptop', 'Inverter & UPS', 'Air Conditioner'],
        baseServiceCharge: 1500,
        warranty: '30-Day Warranty',
        verified: true,
        bio: 'Certified computer and laptop technician. Hardware and AC specialist.',
        certifications: ['B.Sc in IT'],
        availability: 'Mon - Fri • 9 AM - 5 PM'
    }
];

const VISIT_CHARGE = 500;

export default function CreateTicket() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // State
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [allTechnicians, setAllTechnicians] = useState([]);
    const [matchedTechs, setMatchedTechs] = useState([]);
    const [selectedTech, setSelectedTech] = useState(null);
    const [showTechModal, setShowTechModal] = useState(false);
    const [activeTechDetail, setActiveTechDetail] = useState(null);
    const [showAllExperts, setShowAllExperts] = useState(false);

    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        appliance: '',
        brand: '',
        model: '',
        description: '',
        issues: [],
        date: '',
        timeSlot: '',
        address: '',
        city: 'Colombo',
        lat: null,
        lng: null,
        agreed: false
    });

    const [mapCenter, setMapCenter] = useState(null);

    // Photos
    const [photos, setPhotos] = useState([]);
    const [previews, setPreviews] = useState([]);
    const fileInputRef = useRef(null);

    // Live Firebase Technician Sync (Service Wide Separation)
    useEffect(() => {
        if (!formData.appliance) return;

        const q = query(
            collection(db, 'technicians'),
            where('status', '==', 'approved'),
            where('services', 'array-contains', formData.appliance)
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const techs = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                name: doc.data().fullName,
                image: doc.data().uploads?.profileUrl || 'https://i.pravatar.cc/150?u=tech',
                rating: doc.data().rating || 4.8,
                reviews: doc.data().reviewCount || 12,
                experience: `${doc.data().experience || 2} Years`,
                districts: doc.data().districts || [],
                services: doc.data().services || [],
                baseServiceCharge: 1000,
                verified: doc.data().isVerified || true
            }));

            // Filter relevant mock data for this service
            const relevantMock = MOCK_TECHNICIANS.filter(t => t.services.includes(formData.appliance));

            // Combine Live Experts + Relevant Mock Experts
            setAllTechnicians([...techs, ...relevantMock]);
        }, (err) => {
            console.error("Error fetching technicians:", err);
            // Fallback: still show mock technicians even if Firebase query fails
            const relevantMock = MOCK_TECHNICIANS.filter(t => t.services.includes(formData.appliance));
            setAllTechnicians([...relevantMock]);
        });

        return () => unsubscribe();
    }, [formData.appliance]);

    // Initial User Data Load
    useEffect(() => {
        const fetchUserData = async () => {
            if (currentUser) {
                try {
                    const docSnap = await getDoc(doc(db, 'users', currentUser.uid));
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setFormData(prev => ({
                            ...prev,
                            address: data.address || '',
                            city: data.city || 'Colombo'
                        }));
                    }
                } catch (err) {
                    console.error("Error fetching user data:", err);
                }
            }
            if (location.state?.city) {
                setFormData(prev => ({ ...prev, city: location.state.city }));
            }

            if (location.state?.applianceType) {
                const query = location.state.applianceType.toLowerCase();
                // Attempt to find a matching category
                const matchedCat = APPLIANCE_CATEGORIES.find(cat =>
                    cat.label.toLowerCase().includes(query) ||
                    cat.id.toLowerCase().includes(query) ||
                    query.includes(cat.label.toLowerCase()) ||
                    query.includes(cat.id.toLowerCase())
                );

                if (matchedCat) {
                    setFormData(prev => ({ ...prev, appliance: matchedCat.id }));
                } else {
                    setFormData(prev => ({ ...prev, appliance: location.state.applianceType }));
                }
            }
            setPageLoading(false);
        };
        fetchUserData();
    }, [currentUser, location]);

    useEffect(() => {
        if (formData.city && formData.appliance && allTechnicians.length > 0) {
            const matches = allTechnicians.filter(tech =>
                tech.districts.includes(formData.city) &&
                tech.services.includes(formData.appliance)
            );

            // Stricter matching: Only show experts who actually match both city and appliance
            setMatchedTechs([...matches].sort((a, b) => b.rating - a.rating));
        } else if (allTechnicians.length > 0) {
            setMatchedTechs([]);
        }
    }, [formData.city, formData.appliance, allTechnicians]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // If district (city) changes, move map to that district
        if (name === 'city' && DISTRICT_COORDS[value]) {
            setMapCenter(DISTRICT_COORDS[value]);
        }
    };

    const handleIssueToggle = (issue) => {
        setFormData(prev => {
            const issues = prev.issues.includes(issue)
                ? prev.issues.filter(i => i !== issue)
                : [...prev.issues, issue];
            return { ...prev, issues };
        });
    };

    const handlePhotoSelect = (e) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            if (photos.length + files.length > 5) {
                setError("Maximum 5 photos allowed.");
                return;
            }
            const newPhotos = [...photos, ...files];
            setPhotos(newPhotos);
            const newPreviews = files.map(file => URL.createObjectURL(file));
            setPreviews(prev => [...prev, ...newPreviews]);
            setError('');
        }
    };

    const removePhoto = (index) => {
        const newPhotos = [...photos];
        newPhotos.splice(index, 1);
        setPhotos(newPhotos);
        const newPreviews = [...previews];
        URL.revokeObjectURL(newPreviews[index]);
        newPreviews.splice(index, 1);
        setPreviews(newPreviews);
    };

    const isSubmitting = useRef(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Synchronous lock to prevent any double clicks racing the state update
        if (isSubmitting.current || loading) return;
        isSubmitting.current = true;

        if (!formData.appliance || !formData.brand || !formData.description || !formData.date || !formData.timeSlot || !formData.address) {
            setError("Please fill in all required fields.");
            window.scrollTo(0, 0);
            isSubmitting.current = false;
            return;
        }
        if (!formData.agreed) {
            setError("You must agree to the visit charge and terms before booking.");
            isSubmitting.current = false;
            return;
        }

        setError('');
        setLoading(true);

        const ticketData = {
            customerId: currentUser.uid,
            customerName: currentUser.displayName || 'Customer',
            customerEmail: currentUser.email,
            applianceType: formData.appliance,
            brand: formData.brand,
            model: formData.model,
            description: formData.description,
            issues: formData.issues,
            preferredDate: formData.date,
            preferredTimeSlot: formData.timeSlot,
            address: formData.address,
            city: formData.city,
            location: formData.lat && formData.lng ? {
                lat: formData.lat,
                lng: formData.lng
            } : null,
            assignedTechId: selectedTech?.id,
            assignedTechName: selectedTech?.name,
            visitCharge: VISIT_CHARGE,
            serviceFee: selectedTech?.baseServiceCharge,
            totalEstimate: VISIT_CHARGE + (selectedTech?.baseServiceCharge || 0),
            status: 'Pending',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        try {
            // Helper function to compress image before upload
            const compressImage = (file, maxWidth = 1200, quality = 0.7) => {
                return new Promise((resolve) => {
                    // Skip compression for small files (< 500KB)
                    if (file.size < 500 * 1024) {
                        resolve(file);
                        return;
                    }

                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const img = new Image();

                    img.onload = () => {
                        let { width, height } = img;

                        // Scale down if larger than maxWidth
                        if (width > maxWidth) {
                            height = (height * maxWidth) / width;
                            width = maxWidth;
                        }

                        canvas.width = width;
                        canvas.height = height;
                        ctx.drawImage(img, 0, 0, width, height);

                        canvas.toBlob(
                            (blob) => {
                                if (blob) {
                                    resolve(new File([blob], file.name, { type: 'image/jpeg' }));
                                } else {
                                    resolve(file); // Fallback to original if compression fails
                                }
                            },
                            'image/jpeg',
                            quality
                        );
                    };

                    img.onerror = () => resolve(file); // Fallback to original on error
                    img.src = URL.createObjectURL(file);
                });
            };

            // Upload single photo helper (using Cloudinary)
            const uploadPhoto = async (file, index) => {
                const compressedFile = await compressImage(file);
                return await uploadToCloudinary(compressedFile, `tickets/${currentUser.uid}`);
            };

            // Upload all photos in PARALLEL for faster performance
            const photoURLs = photos.length > 0
                ? await Promise.all(photos.map((file, index) => uploadPhoto(file, index)))
                : [];

            const docRef = await addDoc(collection(db, 'tickets'), { ...ticketData, photoURLs });

            // Add automatic notification to Customer
            await addDoc(collection(db, 'notifications'), {
                userId: currentUser.uid,
                type: 'success',
                icon: 'bi-check2-circle',
                title: 'Request Submitted 🚀',
                message: `Your ${formData.appliance} repair request #${docRef.id.slice(0, 5).toUpperCase()} has been received.`,
                link: `/customer/tickets/${docRef.id}`,
                read: false,
                createdAt: serverTimestamp()
            });

            // Notify Admins
            const adminQuery = query(collection(db, 'users'), where('role', '==', 'admin'));
            const adminDocs = await getDocs(adminQuery);
            adminDocs.docs.forEach(async (adminDoc) => {
                await addDoc(collection(db, 'notifications'), {
                    userId: adminDoc.id,
                    title: 'New Service Ticket',
                    message: `New ${formData.appliance} repair requested by ${currentUser.displayName || 'Customer'}.`,
                    type: 'alert',
                    icon: 'bi-clipboard-plus-fill',
                    read: false,
                    createdAt: serverTimestamp()
                });
            });

            // 📢 Notify the Assigned Technician immediately
            if (selectedTech?.id) {
                await addDoc(collection(db, 'notifications'), {
                    userId: selectedTech.id,
                    title: 'New Job Assigned! 🛠️',
                    message: `You have a new ${formData.appliance} repair request in ${formData.city}.`,
                    link: `/technician/dashboard`, // Link to their dashboard
                    type: 'info',
                    icon: 'bi-tools',
                    read: false,
                    createdAt: serverTimestamp()
                });
            }


            setSuccess("Ticket created successfully! Redirecting...");

            // Do NOT set loading to false here. Keep it true to prevent button re-enabling during redirect.
            setTimeout(() => {
                navigate(`/customer/tickets/${docRef.id}`);
            }, 2000);

            // We do NOT release the lock (isSubmitting.current = false) because we are navigating away.
            // This prevents the user from clicking again during the 2s delay.

        } catch (err) {
            console.error("Submission Error:", err);
            setError(`Error: ${err.message || 'Submission failed'}`);
            setLoading(false); // Only stop loading on error
            isSubmitting.current = false; // Release lock on error to allow retry
        }
    };

    const today = new Date().toISOString().split('T')[0];

    if (pageLoading) {
        return (
            <Layout>
                <div className="d-flex align-items-center justify-content-center py-5" style={{ minHeight: '60vh' }}>
                    <Spinner animation="border" variant="danger" />
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="create-ticket-premium pb-5">
                {/* Header Section */}
                <section className="booking-header py-4 mb-4 text-center">
                    <Container>
                        <h2 className="fw-extrabold text-dark mb-2">Book a <span className="text-primary-red">Professional Repair</span></h2>
                        <p className="text-secondary small">Follow the steps below to schedule your expert technician visit.</p>
                    </Container>
                </section>

                <Container>
                    {/* Professional Stepper */}
                    <div className="modern-stepper mb-5 px-3">
                        <div className="stepper-track">
                            {[1, 2, 3, 4, 5, 6].map((step) => (
                                <div key={step} className={`step-item ${currentStep === step ? 'active' : ''} ${currentStep > step ? 'completed' : ''}`}>
                                    <div className="step-dot">
                                        {currentStep > step ? <i className="bi bi-check-lg"></i> : step}
                                    </div>
                                    <span className="step-label d-none d-md-block">
                                        {['Appliance', 'Details', 'Photos', 'Schedule', 'Technicians', 'Confirm'][step - 1]}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="row justify-content-center">
                        <div className="col-lg-9">
                            {error && <Alert variant="danger" className="premium-alert">{error}</Alert>}
                            {success && <Alert variant="success" className="premium-alert">{success}</Alert>}

                            <Form onSubmit={handleSubmit}>
                                {/* Step 1: Appliance Selection */}
                                {currentStep === 1 && (
                                    <div className="animate-fade-in">
                                        <Card className="premium-card border-0 shadow-premium p-4 mb-4">
                                            <h4 className="fw-bold mb-4 text-dark ms-2">What appliance needs fixing?</h4>
                                            <Row className="g-3">
                                                {APPLIANCE_CATEGORIES.map(cat => (
                                                    <Col xs={6} md={4} lg={3} key={cat.id}>
                                                        <div
                                                            className={`selection-box transition-all ${formData.appliance === cat.id ? 'active' : ''}`}
                                                            onClick={() => setFormData(prev => ({ ...prev, appliance: cat.id }))}
                                                        >
                                                            <div className="selection-icon-platform" style={{ background: cat.color }}>
                                                                <i className={`bi ${cat.icon} fs-2`} style={{ color: cat.iconColor }}></i>
                                                            </div>
                                                            <span className="selection-label fw-bold">{cat.label}</span>
                                                            {formData.appliance === cat.id && <div className="selected-check"><i className="bi bi-check-circle-fill"></i></div>}
                                                        </div>
                                                    </Col>
                                                ))}
                                            </Row>
                                            <div className="d-flex justify-content-end mt-5">
                                                <Button
                                                    type="button"
                                                    variant="danger"
                                                    className="rounded-pill px-5 py-3 fw-bold shadow-sm"
                                                    disabled={!formData.appliance}
                                                    onClick={() => setCurrentStep(2)}
                                                    style={{ backgroundColor: 'var(--primary-red)' }}
                                                >
                                                    CONTINUE <i className="bi bi-arrow-right ms-2"></i>
                                                </Button>
                                            </div>
                                        </Card>
                                    </div>
                                )}

                                {/* Step 2: Appliance Details */}
                                {currentStep === 2 && (
                                    <div className="animate-fade-in">
                                        <Card className="premium-card border-0 shadow-premium p-4">
                                            <h4 className="fw-bold mb-4 text-dark">Tell us more about the issue</h4>
                                            <Row className="g-4 mb-4">
                                                <Col md={6}>
                                                    <Form.Group>
                                                        <Form.Label className="premium-label">Brand <span className="text-danger">*</span></Form.Label>
                                                        <Form.Select name="brand" value={formData.brand} onChange={handleChange} className="premium-input">
                                                            <option value="">Select Brand</option>
                                                            {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                                                        </Form.Select>
                                                    </Form.Group>
                                                </Col>
                                                <Col md={6}>
                                                    <Form.Group>
                                                        <Form.Label className="premium-label">Model Number (Optional)</Form.Label>
                                                        <Form.Control name="model" value={formData.model} onChange={handleChange} placeholder="e.g. RT28T3022S8" className="premium-input" />
                                                    </Form.Group>
                                                </Col>
                                            </Row>

                                            <Form.Group className="mb-4">
                                                <Form.Label className="premium-label">Problem Description <span className="text-danger">*</span></Form.Label>
                                                <Form.Control
                                                    as="textarea"
                                                    rows={4}
                                                    name="description"
                                                    value={formData.description}
                                                    onChange={handleChange}
                                                    placeholder="Describe the problem in detail (e.g. Refrigerators bottom part is not cooling, making a clicking sound...)"
                                                    className="premium-input p-3"
                                                />
                                            </Form.Group>

                                            <div className="mb-4">
                                                <Form.Label className="premium-label d-block mb-3">Common Issues (Select all that apply)</Form.Label>
                                                <div className="d-flex flex-wrap gap-2">
                                                    {(COMMON_ISSUES[formData.appliance] || COMMON_ISSUES['default']).map(issue => (
                                                        <div
                                                            key={issue}
                                                            className={`premium-chip ${formData.issues.includes(issue) ? 'active' : ''}`}
                                                            onClick={() => handleIssueToggle(issue)}
                                                        >
                                                            {issue}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="d-flex justify-content-between mt-5 pt-3 border-top">
                                                <Button type="button" variant="link" className="text-secondary text-decoration-none fw-bold" onClick={() => setCurrentStep(1)}>
                                                    <i className="bi bi-arrow-left"></i> Change Appliance
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="danger"
                                                    className="rounded-pill px-5 py-2 fw-bold"
                                                    disabled={!formData.brand || !formData.description}
                                                    onClick={() => setCurrentStep(3)}
                                                    style={{ backgroundColor: 'var(--primary-red)' }}
                                                >
                                                    CONTINUE
                                                </Button>
                                            </div>
                                        </Card>
                                    </div>
                                )}

                                {/* Step 3: Photo Upload */}
                                {currentStep === 3 && (
                                    <div className="animate-fade-in">
                                        <Card className="premium-card border-0 shadow-premium p-4">
                                            <h4 className="fw-bold mb-2 text-dark">Add clear photos of the issue</h4>
                                            <p className="text-muted small mb-4">Photos help our technicians diagnose the problem faster and bring the right parts.</p>

                                            <div
                                                className="upload-zone rounded-4 text-center mb-4 transition-all"
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                <div className="upload-content py-5">
                                                    <div className="upload-icon-circle mb-3 mx-auto">
                                                        <i className="bi bi-camera-fill"></i>
                                                    </div>
                                                    <h5 className="fw-bold mb-1">Click to Capture or Upload</h5>
                                                    <p className="text-muted small">JPG or PNG format • Max 5 photos • Up to 5MB each</p>
                                                    <input type="file" ref={fileInputRef} multiple accept="image/*" className="d-none" onChange={handlePhotoSelect} />
                                                </div>
                                            </div>

                                            {previews.length > 0 && (
                                                <div className="mb-4">
                                                    <h6 className="fw-bold text-dark mb-3">Selected Photos ({previews.length}/5)</h6>
                                                    <Row xs={3} md={5} className="g-3">
                                                        {previews.map((src, idx) => (
                                                            <Col key={idx}>
                                                                <div className="preview-container ratio ratio-1x1 position-relative">
                                                                    <img src={src} alt="Preview" className="rounded-4 object-fit-cover shadow-sm border" />
                                                                    <button type="button" onClick={() => removePhoto(idx)} className="btn-remove-photo">
                                                                        <i className="bi bi-x"></i>
                                                                    </button>
                                                                </div>
                                                            </Col>
                                                        ))}
                                                    </Row>
                                                </div>
                                            )}

                                            <div className="d-flex justify-content-between mt-5 pt-3 border-top">
                                                <Button type="button" variant="link" className="text-secondary text-decoration-none fw-bold" onClick={() => setCurrentStep(2)}>
                                                    <i className="bi bi-arrow-left"></i> Back to Details
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="danger"
                                                    className="rounded-pill px-5 py-2 fw-bold"
                                                    onClick={() => setCurrentStep(4)}
                                                    style={{ backgroundColor: 'var(--primary-red)' }}
                                                >
                                                    {previews.length > 0 ? 'CONTINUE' : 'SKIP & CONTINUE'}
                                                </Button>
                                            </div>
                                        </Card>
                                    </div>
                                )}

                                {/* Step 4: Schedule & Location */}
                                {currentStep === 4 && (
                                    <div className="animate-fade-in">
                                        <Card className="premium-card border-0 shadow-premium p-4">
                                            <h4 className="fw-bold mb-4 text-dark">When should we visit?</h4>

                                            <Row className="g-4 mb-5">
                                                <Col md={6}>
                                                    <Form.Group>
                                                        <Form.Label className="premium-label">Preferred Date <span className="text-danger">*</span></Form.Label>
                                                        <Form.Control type="date" min={today} name="date" value={formData.date} onChange={handleChange} className="premium-input py-3" />
                                                    </Form.Group>
                                                </Col>
                                                <Col md={6}>
                                                    <Form.Label className="premium-label">Select Time Slot <span className="text-danger">*</span></Form.Label>
                                                    <div className="d-flex flex-column gap-2">
                                                        {TIME_SLOTS.map(slot => (
                                                            <div
                                                                key={slot.id}
                                                                className={`time-slot-box ${formData.timeSlot === slot.id ? 'active' : ''}`}
                                                                onClick={() => setFormData(prev => ({ ...prev, timeSlot: slot.id }))}
                                                            >
                                                                <div className="d-flex align-items-center gap-3">
                                                                    <div className={`radio-indicator ${formData.timeSlot === slot.id ? 'active' : ''}`}></div>
                                                                    <span className="fw-bold">{slot.label}</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </Col>
                                            </Row>

                                            <h5 className="fw-bold mb-4 text-dark">Service Address</h5>
                                            <Row className="g-4">
                                                <Col md={12}>
                                                    <Alert variant="info" className="d-flex align-items-center gap-2 small py-2 mb-0">
                                                        <i className="bi bi-info-circle-fill"></i>
                                                        <span>We use your location to find the nearest available technicians.</span>
                                                    </Alert>
                                                </Col>
                                                <Col md={6}>
                                                    <Form.Group>
                                                        <Form.Label className="premium-label">District <span className="text-danger">*</span></Form.Label>
                                                        <Form.Select name="city" value={formData.city} onChange={handleChange} className="premium-input">
                                                            {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                                                        </Form.Select>
                                                    </Form.Group>
                                                </Col>
                                                <Col md={12}>
                                                    <Form.Group>
                                                        <Form.Label className="premium-label">Exact Location <span className="text-danger">*</span></Form.Label>
                                                        <LocationPicker
                                                            initialAddress={formData.address}
                                                            onLocationSelect={(addr, coords, district) => {
                                                                setFormData(prev => {
                                                                    const updates = {
                                                                        ...prev,
                                                                        address: addr,
                                                                        lat: coords?.lat || null,
                                                                        lng: coords?.lng || null
                                                                    };

                                                                    // Auto-update district dropdown if a valid SRI LANKAN district is found
                                                                    if (district && DISTRICTS.includes(district)) {
                                                                        updates.city = district;
                                                                    }

                                                                    return updates;
                                                                });
                                                            }}
                                                            externalCenter={mapCenter}
                                                        />
                                                    </Form.Group>
                                                </Col>
                                            </Row>

                                            <div className="d-flex justify-content-between mt-5 pt-3 border-top">
                                                <Button type="button" variant="link" className="text-secondary text-decoration-none fw-bold" onClick={() => setCurrentStep(3)}>
                                                    <i className="bi bi-arrow-left"></i> Back
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="danger"
                                                    className="rounded-pill px-5 py-2 fw-bold"
                                                    disabled={!formData.date || !formData.timeSlot || !formData.address}
                                                    onClick={() => setCurrentStep(5)}
                                                    style={{ backgroundColor: 'var(--primary-red)' }}
                                                >
                                                    FIND TECHNICIANS
                                                </Button>
                                            </div>
                                        </Card>
                                    </div>
                                )}

                                {/* Step 5: Technician Selection */}
                                {currentStep === 5 && (
                                    <div className="animate-fade-in">
                                        <Card className="premium-card border-0 shadow-premium p-4 mb-4">
                                            <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
                                                <div>
                                                    <h4 className="fw-bold mb-1 text-dark">Available Experts</h4>
                                                    <p className="text-secondary small mb-0">
                                                        {showAllExperts
                                                            ? `Showing all ${allTechnicians.length} technicians`
                                                            : `Found ${matchedTechs.length} technicians available in ${formData.city} for ${formData.appliance} repair.`
                                                        }
                                                    </p>
                                                </div>
                                                <div className="d-flex align-items-center gap-2">
                                                    <Button
                                                        variant={showAllExperts ? "danger" : "outline-secondary"}
                                                        size="sm"
                                                        className="rounded-pill px-3 fw-bold"
                                                        onClick={() => setShowAllExperts(!showAllExperts)}
                                                    >
                                                        <i className={`bi ${showAllExperts ? 'bi-funnel-fill' : 'bi-people-fill'} me-2`}></i>
                                                        {showAllExperts ? 'Show Filtered' : 'View All Experts'}
                                                    </Button>
                                                    {!showAllExperts && (
                                                        <Badge bg="danger" className="bg-opacity-10 text-danger rounded-pill px-3 py-2">
                                                            Match Accuracy: 98%
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>

                                            <Row className="g-4">
                                                {(showAllExperts ? allTechnicians : matchedTechs).map(tech => (
                                                    <Col md={12} xl={12} key={tech.id}>
                                                        <div className={`tech-selection-card p-3 rounded-4 border transition-all ${selectedTech?.id === tech.id ? 'active' : ''}`}>
                                                            <div className="d-flex align-items-center gap-3 flex-wrap flex-md-nowrap">
                                                                <div className="tech-avatar position-relative">
                                                                    <img src={tech.image} alt={tech.name} className="rounded-circle border border-2 border-white shadow-sm" style={{ width: '80px', height: '80px', objectFit: 'cover' }} />
                                                                    <div className="status-indicator online"></div>
                                                                </div>
                                                                <div className="flex-grow-1">
                                                                    <div className="d-flex align-items-center gap-2 mb-1">
                                                                        <h5 className="fw-bold mb-0">{tech.name}</h5>
                                                                        {tech.verified && <i className="bi bi-patch-check-fill text-success" title="Verified Professional"></i>}
                                                                    </div>
                                                                    <div className="d-flex align-items-center gap-3 mb-2 flex-wrap">
                                                                        <div className="text-warning small fw-bold">
                                                                            <i className="bi bi-star-fill me-1"></i>{tech.rating} ({tech.reviews} Reviews)
                                                                        </div>
                                                                        <div className="text-secondary small fw-bold">
                                                                            <i className="bi bi-briefcase me-1"></i>{tech.experience} Exp.
                                                                        </div>
                                                                        {showAllExperts && (
                                                                            <div className="text-info small fw-bold">
                                                                                <i className="bi bi-geo-alt me-1"></i>{tech.districts.slice(0, 2).join(', ')}{tech.districts.length > 2 ? '...' : ''}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-muted small mb-0 text-truncate" style={{ maxWidth: '400px' }}>{tech.bio}</p>
                                                                    {showAllExperts && (
                                                                        <div className="mt-2 d-flex flex-wrap gap-1">
                                                                            {tech.services.slice(0, 3).map(s => (
                                                                                <Badge key={s} bg="light" text="dark" className="small fw-normal">{s}</Badge>
                                                                            ))}
                                                                            {tech.services.length > 3 && <Badge bg="light" text="muted" className="small">+{tech.services.length - 3} more</Badge>}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="text-md-end text-start border-start-md ps-md-4 mt-3 mt-md-0 d-flex flex-column gap-2 justify-content-center" style={{ minWidth: '180px' }}>
                                                                    <div className="pricing-info mb-1">
                                                                        <div className="small text-muted mb-0">Visit Fee: <span className="fw-bold text-dark">LKR {VISIT_CHARGE}</span></div>
                                                                        <div className="small text-muted">Service starts at: <span className="fw-bold text-dark">LKR {tech.baseServiceCharge}</span></div>
                                                                    </div>
                                                                    <div className="d-flex gap-2">
                                                                        <Button
                                                                            type="button" variant="outline-secondary"
                                                                            className="rounded-pill px-3 py-2 small fw-bold flex-grow-1"
                                                                            onClick={() => {
                                                                                setActiveTechDetail(tech);
                                                                                setShowTechModal(true);
                                                                            }}
                                                                        >
                                                                            View Profile
                                                                        </Button>
                                                                        <Button
                                                                            type="button" variant={selectedTech?.id === tech.id ? 'danger' : 'outline-danger'}
                                                                            className="rounded-pill px-3 py-2 small fw-bold flex-grow-1"
                                                                            onClick={() => setSelectedTech(tech)}
                                                                        >
                                                                            {selectedTech?.id === tech.id ? 'Selected' : 'Select'}
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </Col>
                                                ))}
                                            </Row>

                                            <div className="d-flex justify-content-between mt-5 pt-3 border-top">
                                                <Button type="button" variant="link" className="text-secondary text-decoration-none fw-bold" onClick={() => setCurrentStep(4)}>
                                                    <i className="bi bi-arrow-left"></i> Back to Schedule
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="danger"
                                                    className="rounded-pill px-5 py-2 fw-bold"
                                                    disabled={!selectedTech}
                                                    onClick={() => setCurrentStep(6)}
                                                    style={{ backgroundColor: 'var(--primary-red)' }}
                                                >
                                                    REVIEW FINAL BOOKING
                                                </Button>
                                            </div>
                                        </Card>
                                    </div>
                                )}

                                {/* Step 6: Final Review */}
                                {currentStep === 6 && (
                                    <div className="animate-fade-in">
                                        <Card className="premium-card border-0 shadow-premium overflow-hidden mb-4">
                                            <div className="p-4 border-bottom bg-light bg-opacity-50">
                                                <h4 className="fw-extrabold mb-0 text-dark">Final Review</h4>
                                            </div>

                                            <div className="p-4">
                                                {/* Summary Grid */}
                                                <div className="summary-section mb-4">
                                                    <div className="d-flex align-items-center justify-content-between mb-3">
                                                        <h6 className="fw-bold text-uppercase small text-muted ls-1 mb-0">Service & Appliance</h6>
                                                        <Button type="button" variant="link" className="text-danger p-0 small fw-bold text-decoration-none" onClick={() => setCurrentStep(1)}>Edit</Button>
                                                    </div>
                                                    <div className="bg-light bg-opacity-25 rounded-4 p-3 border">
                                                        <div className="d-flex align-items-center gap-3">
                                                            <div className="bg-danger bg-opacity-10 p-2 rounded-3">
                                                                <i className={`bi ${APPLIANCE_CATEGORIES.find(c => c.id === formData.appliance)?.icon || 'bi-tools'} fs-4 text-danger`}></i>
                                                            </div>
                                                            <div>
                                                                <h6 className="fw-bold mb-0">{formData.appliance} Repair</h6>
                                                                <small className="text-secondary">{formData.brand} {formData.model && `• ${formData.model}`}</small>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="summary-section mb-4">
                                                    <div className="d-flex align-items-center justify-content-between mb-3">
                                                        <h6 className="fw-bold text-uppercase small text-muted ls-1 mb-0">Schedule & Location</h6>
                                                        <Button type="button" variant="link" className="text-danger p-0 small fw-bold text-decoration-none" onClick={() => setCurrentStep(4)}>Edit</Button>
                                                    </div>
                                                    <Row className="g-3">
                                                        <Col md={6}>
                                                            <div className="bg-light bg-opacity-25 rounded-4 p-3 border h-100">
                                                                <div className="d-flex align-items-center gap-2 mb-1">
                                                                    <i className="bi bi-calendar3 text-danger"></i>
                                                                    <span className="small text-muted">Arrival Date</span>
                                                                </div>
                                                                <p className="fw-bold mb-0">{new Date(formData.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                                                <p className="small text-secondary mb-0">{TIME_SLOTS.find(s => s.id === formData.timeSlot)?.label}</p>
                                                            </div>
                                                        </Col>
                                                        <Col md={6}>
                                                            <div className="bg-light bg-opacity-25 rounded-4 p-3 border h-100">
                                                                <div className="d-flex align-items-center gap-2 mb-1">
                                                                    <i className="bi bi-geo-alt text-danger"></i>
                                                                    <span className="small text-muted">Service Address</span>
                                                                </div>
                                                                <p className="small fw-bold mb-0 text-truncate">{formData.address}</p>
                                                                <p className="small text-secondary mb-0">{formData.city}</p>
                                                            </div>
                                                        </Col>
                                                    </Row>
                                                </div>

                                                {/* Assigned Tech Preview */}
                                                <div className="summary-section mb-4 pt-3 border-top">
                                                    <div className="d-flex align-items-center justify-content-between mb-3">
                                                        <h6 className="fw-bold text-uppercase small text-muted ls-1 mb-0">Selected Technician</h6>
                                                        <Button type="button" variant="link" className="text-danger p-0 small fw-bold text-decoration-none" onClick={() => setCurrentStep(5)}>Change</Button>
                                                    </div>
                                                    <div className="tech-assigned-card p-3 rounded-4 border d-flex align-items-center gap-3">
                                                        <div className="tech-avatar position-relative">
                                                            <img
                                                                src={selectedTech?.image || 'https://i.pravatar.cc/150?u=tech'}
                                                                className="rounded-circle border border-2 border-white shadow-sm"
                                                                style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                                                                alt="Tech"
                                                            />
                                                            <div className="status-indicator online"></div>
                                                        </div>
                                                        <div className="flex-grow-1">
                                                            <h6 className="fw-bold mb-0">{selectedTech?.name || 'Authorized Professional'}</h6>
                                                            <div className="d-flex align-items-center gap-2 text-success small fw-bold">
                                                                <i className="bi bi-patch-check-fill"></i>
                                                                {selectedTech?.experience || 'Verified'} Expert • {selectedTech?.warranty || '30-Day Warranty'}
                                                            </div>
                                                            <div className="text-muted tiny">{selectedTech?.bio}</div>
                                                        </div>
                                                        <div className="text-end">
                                                            <Badge bg="success" className="rounded-pill px-2 py-1">
                                                                <i className="bi bi-star-fill me-1"></i> {selectedTech?.rating || '4.8'}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Visit Charge Section */}
                                                <div className="pricing-summary-premium p-4 rounded-4 mb-4">
                                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                                        <span className="text-secondary">Visiting & Diagnostic Charge</span>
                                                        <span className="fw-bold text-dark">LKR {VISIT_CHARGE}.00</span>
                                                    </div>
                                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                                        <span className="text-secondary">Expected Service Fee ({formData.appliance})</span>
                                                        <span className="fw-bold text-dark">LKR {selectedTech?.baseServiceCharge || '1,000'}.00</span>
                                                    </div>
                                                    <hr className="opacity-10" />
                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <h5 className="fw-extrabold mb-0">Total Estimate</h5>
                                                        <h4 className="fw-extrabold text-primary-red mb-0">LKR {(VISIT_CHARGE + (selectedTech?.baseServiceCharge || 0)).toLocaleString()}.00</h4>
                                                    </div>
                                                </div>

                                                {/* Cancellation Policy Note */}
                                                <div className="policy-note-card p-3 rounded-4 mb-4" style={{ backgroundColor: 'rgba(52, 58, 64, 0.02)', border: '1px dashed #dee2e6' }}>
                                                    <div className="d-flex align-items-center gap-2 mb-2">
                                                        <i className="bi bi-info-circle-fill text-dark small"></i>
                                                        <h6 className="fw-bold small text-uppercase mb-0 ls-1">Cancellation Policy</h6>
                                                    </div>
                                                    <ul className="ps-3 mb-0 text-dark fw-bold" style={{ fontSize: '0.75rem', lineHeight: '1.6' }}>
                                                        <li className="mb-1">
                                                            Free: Up to 4 hours before appointment.
                                                        </li>
                                                        <li className="mb-1">
                                                            Late (2-4h): Full visiting charge (LKR 500) applies if rescheduled/cancelled.
                                                        </li>
                                                        <li className="mb-0">
                                                            Emergency: Admin discretion for emergencies.
                                                        </li>
                                                    </ul>
                                                </div>

                                                {/* Agreement */}
                                                <Form.Check
                                                    type="checkbox"
                                                    id="agree-checkbox"
                                                    className="mb-4 custom-check-premium"
                                                >
                                                    <Form.Check.Input
                                                        type="checkbox"
                                                        required
                                                        checked={formData.agreed}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, agreed: e.target.checked }))}
                                                        className="d-none"
                                                    />
                                                    <Form.Check.Label className={`d-flex align-items-start gap-3 p-3 rounded-4 border transition-all cursor-pointer ${formData.agreed ? 'active' : ''}`}>
                                                        <div className="check-outer">
                                                            <div className="check-inner"><i className="bi bi-check-lg"></i></div>
                                                        </div>
                                                        <div className="flex-grow-1">
                                                            <span className="fw-bold text-dark small d-block mb-1">
                                                                I agree to the LKR {VISIT_CHARGE} visitation fee and the <Link to="/terms" target="_blank" className="text-danger text-decoration-underline" onClick={(e) => e.stopPropagation()}>Terms and Conditions</Link>
                                                            </span>
                                                            <p className="text-muted tiny mb-0">I understand that a final repair quote will be provided after inspection and I approve before work starts.</p>
                                                        </div>
                                                    </Form.Check.Label>
                                                </Form.Check>

                                                <Button
                                                    type="submit"
                                                    disabled={loading || !formData.agreed || success}
                                                    variant="danger"
                                                    className="w-100 rounded-pill py-3 fw-bold shadow-lg border-0 d-flex align-items-center justify-content-center gap-3 transition-all confirm-btn"
                                                    style={{ backgroundColor: 'var(--primary-red)' }}
                                                >
                                                    {loading ? <Spinner animation="border" size="sm" /> : (
                                                        <>
                                                            <i className="bi bi-shield-fill-check fs-4"></i>
                                                            CONFIRM & BOOK TECHNICIAN
                                                        </>
                                                    )}
                                                </Button>
                                                <p className="text-center text-muted tiny mt-3">Protected by FixZone Trust Guarantee</p>
                                            </div>
                                        </Card>
                                    </div>
                                )}
                            </Form>
                        </div>
                    </div>
                </Container>
            </div>

            {/* Technician Detail Modal */}
            <Modal show={showTechModal} onHide={() => setShowTechModal(false)} centered scrollable size="lg" className="modal-premium">
                <div className="modal-close-btn" onClick={() => setShowTechModal(false)} style={{ cursor: 'pointer' }}>
                    <i className="bi bi-x-lg"></i>
                </div>
                {activeTechDetail && (
                    <Modal.Body className="p-0 overflow-auto">
                        <div className="tech-modal-header p-5 text-center border-bottom">
                            <div className="position-relative d-inline-block mb-4">
                                <img
                                    src={activeTechDetail.image}
                                    alt={activeTechDetail.name}
                                    className="rounded-circle shadow-lg border border-4 border-white"
                                    style={{ width: '140px', height: '140px', objectFit: 'cover' }}
                                />
                                <div className="status-indicator shadow-sm" style={{ width: '24px', height: '24px', right: '10px', bottom: '10px', border: '4px solid white' }}></div>
                            </div>
                            <h2 className="fw-extrabold text-dark mb-1">{activeTechDetail.name}</h2>
                            <div className="d-flex align-items-center justify-content-center gap-3 mb-3">
                                <div className="text-warning fw-bold">
                                    <i className="bi bi-star-fill me-1"></i> {activeTechDetail.rating} ({activeTechDetail.reviews} Reviews)
                                </div>
                                <div className="text-success fw-bold">
                                    <i className="bi bi-patch-check-fill me-1"></i> Verified Pro
                                </div>
                            </div>
                            <p className="text-muted mx-auto" style={{ maxWidth: '500px' }}>{activeTechDetail.bio}</p>
                        </div>

                        <div className="p-5">
                            <Row className="g-4">
                                <Col md={6}>
                                    <h6 className="fw-bold text-uppercase small text-muted ls-1 mb-3">Experience & Specialty</h6>
                                    <div className="d-flex flex-column gap-3">
                                        <div className="d-flex align-items-center gap-3">
                                            <div className="bg-light p-2 rounded-3 text-danger"><i className="bi bi-calendar-check fs-5"></i></div>
                                            <div>
                                                <div className="small text-muted">Field Experience</div>
                                                <div className="fw-bold text-dark">{activeTechDetail.experience}</div>
                                            </div>
                                        </div>
                                        <div className="d-flex align-items-center gap-3">
                                            <div className="bg-light p-2 rounded-3 text-danger"><i className="bi bi-tools fs-5"></i></div>
                                            <div>
                                                <div className="small text-muted">Expertise Area</div>
                                                <div className="fw-bold text-dark">{activeTechDetail.services.join(', ')}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <h6 className="fw-bold text-uppercase small text-muted ls-1 mb-3 mt-5">Certifications</h6>
                                    <div className="d-flex flex-wrap gap-2">
                                        {activeTechDetail.certifications.map((cert, i) => (
                                            <div key={i} className="certification-badge">
                                                <i className="bi bi-award-fill"></i> {cert}
                                            </div>
                                        ))}
                                    </div>
                                </Col>

                                <Col md={6}>
                                    <h6 className="fw-bold text-uppercase small text-muted ls-1 mb-3">Pricing & Service Details</h6>
                                    <div className="bg-light bg-opacity-50 p-4 rounded-4 border">
                                        <div className="d-flex justify-content-between mb-2">
                                            <span className="text-secondary small">Visiting Charge</span>
                                            <span className="fw-bold text-dark">LKR {VISIT_CHARGE}</span>
                                        </div>
                                        <div className="d-flex justify-content-between mb-3">
                                            <span className="text-secondary small">Service Rate ({formData.appliance})</span>
                                            <span className="fw-bold text-dark">LKR {activeTechDetail.baseServiceCharge}</span>
                                        </div>
                                        <hr className="opacity-10" />
                                        <div className="d-flex justify-content-between">
                                            <span className="fw-bold text-dark">Total Initial Estimate</span>
                                            <span className="fw-extrabold text-primary-red">LKR {VISIT_CHARGE + activeTechDetail.baseServiceCharge}</span>
                                        </div>
                                    </div>

                                    <h6 className="fw-bold text-uppercase small text-muted ls-1 mb-3 mt-4">Coverage & Availability</h6>
                                    <div className="d-flex flex-column gap-2">
                                        <div className="d-flex align-items-center gap-2 small text-dark fw-medium">
                                            <i className="bi bi-geo-alt-fill text-danger"></i> {activeTechDetail.districts.join(', ')}
                                        </div>
                                        <div className="d-flex align-items-center gap-2 small text-dark fw-medium">
                                            <i className="bi bi-clock-fill text-danger"></i> {activeTechDetail.availability}
                                        </div>
                                        <div className="d-flex align-items-center gap-2 small text-dark fw-medium">
                                            <i className="bi bi-shield-check text-danger"></i> {activeTechDetail.warranty}
                                        </div>
                                    </div>
                                </Col>
                            </Row>

                            <div className="mt-5">
                                <Button
                                    variant="danger"
                                    className="w-100 rounded-pill py-3 fw-bold shadow-lg border-0"
                                    style={{ backgroundColor: 'var(--primary-red)' }}
                                    onClick={() => {
                                        setSelectedTech(activeTechDetail);
                                        setShowTechModal(false);
                                        setCurrentStep(6);
                                    }}
                                >
                                    BOOK THIS TECHNICIAN
                                </Button>
                            </div>
                        </div>
                    </Modal.Body>
                )}
            </Modal>

            <style dangerouslySetInnerHTML={{
                __html: `
                .create-ticket-premium { background-color: #fbfbfb; min-height: 90vh; }
                .booking-header { background: white; border-bottom: 1px solid #f1f5f9; }
                .fw-extrabold { font-weight: 850; }
                
                /* Stepper Styles */
                .modern-stepper { max-width: 800px; margin: 0 auto; }
                .stepper-track { display: flex; justify-content: space-between; position: relative; }
                .stepper-track::before {
                    content: '';
                    position: absolute;
                    top: 16px;
                    left: 0;
                    right: 0;
                    height: 2px;
                    background: #e2e8f0;
                    z-index: 0;
                }
                .step-item { position: relative; z-index: 1; display: flex; flex-column: column; align-items: center; width: 40px; }
                .step-dot {
                    width: 32px;
                    height: 32px;
                    background: white;
                    border: 2px solid #e2e8f0;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 800;
                    font-size: 14px;
                    transition: all 0.4s ease;
                    color: #94a3b8;
                }
                .step-label {
                    position: absolute;
                    top: 40px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 100px;
                    text-align: center;
                    font-size: 11px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    color: #94a3b8;
                }
                .step-item.active .step-dot {
                    background: var(--primary-red);
                    border-color: var(--primary-red);
                    color: white;
                    box-shadow: 0 0 15px rgba(185, 28, 28, 0.4);
                }
                .step-item.active .step-label { color: var(--primary-red); }
                .step-item.completed .step-dot {
                    background: #10b981;
                    border-color: #10b981;
                    color: white;
                }

                /* Selection Boxes */
                .selection-box {
                    background: white;
                    border: 1.5px solid #f1f5f9;
                    border-radius: 20px;
                    padding: 20px 10px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 12px;
                    cursor: pointer;
                    position: relative;
                    text-align: center;
                }
                .selection-box:hover {
                    box-shadow: 0 10px 25px rgba(0,0,0,0.05);
                    transform: translateY(-5px);
                    border-color: rgba(185, 28, 28, 0.2);
                }
                .selection-box.active {
                    border-color: var(--primary-red);
                    background-color: rgba(185, 28, 28, 0.02);
                }
                .selection-icon-platform {
                    width: 60px;
                    height: 60px;
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s ease;
                }
                .selection-label { font-size: 0.85rem; color: #334155; }
                .selected-check {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    color: var(--primary-red);
                    font-size: 1.2rem;
                }

                /* Premium Input */
                .premium-label { font-weight: 700; color: #475569; font-size: 0.9rem; margin-bottom: 8px; }
                .premium-input {
                    border-radius: 12px;
                    border: 1.5px solid #e2e8f0;
                    font-weight: 500;
                    transition: all 0.3s ease;
                }
                .premium-input:focus {
                    border-color: var(--primary-red);
                    box-shadow: 0 0 0 0.2rem rgba(185, 28, 28, 0.08);
                }

                /* Chips */
                .premium-chip {
                    padding: 8px 18px;
                    background: white;
                    border: 1.5px solid #e2e8f0;
                    border-radius: 100px;
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: #64748b;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .premium-chip:hover { border-color: #cbd5e1; background: #f8fafc; }
                .premium-chip.active {
                    background: var(--primary-red);
                    border-color: var(--primary-red);
                    color: white;
                    box-shadow: 0 4px 12px rgba(185, 28, 28, 0.2);
                }

                /* Upload Zone */
                .upload-zone {
                    background: #f8fafc;
                    border: 2px dashed #cbd5e1;
                    cursor: pointer;
                }
                .upload-zone:hover {
                    background: #f1f5f9;
                    border-color: var(--primary-red);
                }
                .upload-icon-circle {
                    width: 64px;
                    height: 64px;
                    background: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.8rem;
                    color: #94a3b8;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.05);
                }
                .btn-remove-photo {
                    position: absolute;
                    top: -8px;
                    right: -8px;
                    width: 24px;
                    height: 24px;
                    background: var(--primary-red);
                    color: white;
                    border: none;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                }

                /* Time Slots */
                .time-slot-box {
                    padding: 16px 20px;
                    background: white;
                    border: 1.5px solid #e2e8f0;
                    border-radius: 14px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .time-slot-box:hover { border-color: #cbd5e1; background: #f8fafc; }
                .time-slot-box.active { border-color: var(--primary-red); background: rgba(185, 28, 28, 0.03); }
                .radio-indicator {
                    width: 20px;
                    height: 20px;
                    border: 2px solid #e2e8f0;
                    border-radius: 50%;
                    position: relative;
                }
                .radio-indicator.active { border-color: var(--primary-red); }
                .radio-indicator.active::after {
                    content: '';
                    width: 10px;
                    height: 10px;
                    background: var(--primary-red);
                    border-radius: 50%;
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                }

                /* Custom Check Premium */
                .custom-check-premium .active {
                    background: rgba(185, 28, 28, 0.05) !important;
                    border-color: var(--primary-red) !important;
                }
                .check-outer {
                    width: 22px;
                    height: 22px;
                    border-radius: 6px;
                    background: white;
                    border: 2px solid #e2e8f0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }
                .active .check-outer { background: var(--primary-red); border-color: var(--primary-red); }
                .check-inner { color: white; display: none; font-size: 14px; }
                .active .check-inner { display: block; }

                .pricing-summary-premium { background: #fffafa; border: 1px dashed rgba(185, 28, 28, 0.2); }
                .status-indicator {
                    position: absolute;
                    bottom: 0px;
                    right: 4px;
                    width: 14px;
                    height: 14px;
                    border: 2.5px solid white;
                    border-radius: 50%;
                    background: #10b981;
                }
                .tiny { font-size: 0.75rem; }
                .ls-1 { letter-spacing: 0.5px; }
                .ls-2 { letter-spacing: 1.5px; }

                .animate-fade-in { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                
                .confirm-btn:hover {
                    box-shadow: 0 15px 35px rgba(185, 28, 28, 0.4) !important;
                    transform: scale(1.02);
                }

                .tech-selection-card {
                    background: white;
                    cursor: pointer;
                    border: 1.5px solid #f1f5f9 !important;
                }
                .tech-selection-card:hover {
                    border-color: rgba(185, 28, 28, 0.3) !important;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.05);
                    transform: translateY(-2px);
                }
                .tech-selection-card.active {
                    border-color: var(--primary-red) !important;
                    background-color: rgba(185, 28, 28, 0.02);
                    box-shadow: 0 5px 15px rgba(185, 28, 28, 0.08);
                }
                .border-start-md { border-left: 1px solid #f1f5f9; }
                @media (max-width: 767px) {
                    .border-start-md { border-left: none; border-top: 1px solid #f1f5f9; padding-top: 1rem; }
                }

                .modal-premium .modal-content { border-radius: 24px; overflow: hidden; border: none; }
                .tech-modal-header { background: linear-gradient(135deg, #fff 0%, #fffafa 100%); position: relative; }
                .modal-close-btn { 
                    position: absolute; top: 20px; right: 20px; 
                    background: white; border: none; border-radius: 50%;
                    width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.1); z-index: 10;
                }
                .certification-badge {
                    background: #f0fdf4; color: #166534;
                    padding: 6px 12px; border-radius: 8px; font-size: 0.75rem; font-weight: 700;
                    display: inline-flex; align-items: center; gap: 6px;
                }
            `}} />
        </Layout>
    );
}
