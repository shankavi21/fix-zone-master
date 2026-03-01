import React, { useState } from 'react';
import { Modal, Button, Form, Row, Col, Alert, Image, Badge } from 'react-bootstrap';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, setDoc, getDocs, query, where } from 'firebase/firestore';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { uploadToCloudinary } from '../utils/cloudinary';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const SERVICES = [
    "Refrigerator", "Washing Machine", "Air Conditioner",
    "Television", "Microwave", "Gas Stove", "Water Purifier",
    "Laptop/PC", "Electric Oven", "Water Heater", "Dishwasher",
    "Vacuum Cleaner", "Food Processor", "Iron", "Hair Dryer"
];

const DISTRICTS = [
    "Ampara", "Anuradhapura", "Badulla", "Batticaloa", "Colombo",
    "Galle", "Gampaha", "Hambantota", "Jaffna", "Kalutara",
    "Kandy", "Kegalle", "Kilinochchi", "Kurunegala", "Mannar",
    "Matale", "Matara", "Moneragala", "Mullaitivu", "Nuwara Eliya",
    "Polonnaruwa", "Puttalam", "Ratnapura", "Trincomalee", "Vavuniya"
];

const WORKING_HOURS = [
    "Full Time (8am - 6pm)", "Part Time (Evening)", "Weekends Only", "Flexible / On-Call"
];

const VEHICLE_TYPES = [
    "None", "Motorcycle", "Three-Wheeler", "Van / Mini-Truck", "Car"
];

export default function TechnicianApplicationModal({ show, onHide }) {
    const navigate = useNavigate();
    const { currentUser, userRole } = useAuth();
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        nic: '',
        dob: '',
        districts: [],
        services: [],
        experience: '',
        bio: '',
        tools: '',
        vehicle: 'None',
        workingHours: 'Full Time (8am - 6pm)',
        otherServices: '',
        declaration: false
    });

    const [files, setFiles] = useState({
        profilePhoto: null,
        nicPhoto: null,
        certificates: [],
        workPhotos: []
    });

    const [previews, setPreviews] = useState({
        profilePhoto: null,
        nicPhoto: null,
        certificates: [],
        workPhotos: []
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleToggleList = (name, item) => {
        setFormData(prev => {
            const list = prev[name].includes(item)
                ? prev[name].filter(i => i !== item)
                : [...prev[name], item];
            return { ...prev, [name]: list };
        });
    };

    const handleFileChange = (e, type) => {
        const selectedFiles = Array.from(e.target.files);
        if (selectedFiles.length === 0) return;

        if (type === 'certificates' || type === 'workPhotos') {
            setFiles(prev => ({ ...prev, [type]: [...prev[type], ...selectedFiles] }));
            const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
            setPreviews(prev => ({ ...prev, [type]: [...prev[type], ...newPreviews] }));
        } else {
            setFiles(prev => ({ ...prev, [type]: selectedFiles[0] }));
            setPreviews(prev => ({ ...prev, [type]: URL.createObjectURL(selectedFiles[0]) }));
        }
    };

    const uploadFile = async (file, path) => {
        if (!file) return null;
        return await uploadToCloudinary(file, `technician_applications/${path}`);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.services.length === 0) {
            setError("Please select at least one service category.");
            return;
        }
        if (formData.districts.length === 0) {
            setError("Please select at least one district.");
            return;
        }
        if (!formData.declaration) {
            setError("You must agree to the declaration before submitting.");
            return;
        }

        // Check for password field
        if (!formData.password || formData.password.length < 6) {
            setError("Please enter a password with at least 6 characters.");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            // 1. Check if the current logged-in user is already a tech or admin
            if (currentUser) {
                if (userRole === 'admin') {
                    setError("Admin can't be registered as a technician.");
                    setLoading(false);
                    return;
                }
                if (userRole === 'technician') {
                    setError("Already registered as technician & please login.");
                    setLoading(false);
                    return;
                }
            }

            // 2. Check if the email provided is already an admin or technician in the database
            try {
                const userQuery = query(collection(db, 'users'), where('email', '==', formData.email));
                const querySnapshot = await getDocs(userQuery);

                if (!querySnapshot.empty) {
                    const existingUser = querySnapshot.docs[0].data();
                    if (existingUser.role === 'admin') {
                        setError("Admin can't be registered as a technician.");
                        setLoading(false);
                        return;
                    }
                    if (existingUser.role === 'technician') {
                        setError("Already registered as technician & please login.");
                        setLoading(false);
                        return;
                    }
                }
            } catch (e) {
                // Ignore permission errors if unauthenticated
                console.warn("Could not query users collection:", e);
            }

            // Upload files first
            const profileUrl = await uploadFile(files.profilePhoto, 'profile');
            const nicUrl = await uploadFile(files.nicPhoto, 'nic');

            const certUrls = [];
            for (const file of files.certificates) {
                const url = await uploadFile(file, 'cert');
                certUrls.push(url);
            }

            const workUrls = [];
            for (const file of files.workPhotos) {
                const url = await uploadFile(file, 'work');
                workUrls.push(url);
            }

            let userId;
            let userObj;

            // If already logged in with same email, use existing account
            if (currentUser && currentUser.email === formData.email) {
                userId = currentUser.uid;
                userObj = currentUser;
            } else {
                // Create Firebase Auth account
                const userCredential = await createUserWithEmailAndPassword(
                    auth,
                    formData.email,
                    formData.password
                );
                userId = userCredential.user.uid;
                userObj = userCredential.user;
            }

            // Create user document with technician role
            await setDoc(doc(db, 'users', userId), {
                email: formData.email,
                name: formData.fullName,
                phone: formData.phone,
                role: 'user', // Set to user initially, admin will change to technician upon approval
                photoURL: profileUrl,
                isVerified: false,
                createdAt: serverTimestamp()
            }, { merge: true }); // Use merge: true to avoid overwriting existing properties if upgrading

            // Create technician profile document
            await setDoc(doc(db, 'technicians', userId), {
                ...formData,
                userId: userId,
                uploads: {
                    profileUrl,
                    nicUrl,
                    certUrls,
                    workUrls
                },
                status: 'pending', // Reverted to pending - requires Admin approval
                rating: 5.0,
                reviewCount: 0,
                completedJobs: 0,
                isVerified: false,
                createdAt: serverTimestamp()
            }, { merge: true });

            // Send Email Verification (only if they are new or unverified)
            if (userObj && !userObj.emailVerified) {
                await sendEmailVerification(userObj).catch(e => console.warn("Email verification could not be sent", e));
            }

            // Also save to applications for admin reference
            await addDoc(collection(db, 'technician_applications'), {
                ...formData,
                userId: userId,
                uploads: {
                    profileUrl,
                    nicUrl,
                    certUrls,
                    workUrls
                },
                status: 'pending',
                createdAt: serverTimestamp()
            });

            // Notify Admins
            try {
                const adminQuery = query(collection(db, 'users'), where('role', '==', 'admin'));
                const adminDocs = await getDocs(adminQuery);
                adminDocs.docs.forEach(async (adminDoc) => {
                    await addDoc(collection(db, 'notifications'), {
                        userId: adminDoc.id,
                        title: 'New Expert Application',
                        message: `${formData.fullName} has applied to join as an expert.`,
                        type: 'alert',
                        icon: 'bi-person-badge-fill',
                        read: false,
                        createdAt: serverTimestamp()
                    });
                });
            } catch (e) {
                console.warn("Could not notify admins, possibly due to security rules:", e);
            }

            setSuccess(true);

            // Redirect to technician dashboard after short delay
            setTimeout(() => {
                onHide();
                navigate('/technician/dashboard');
            }, 2000);

        } catch (err) {
            console.error(err);
            if (err.code === 'auth/email-already-in-use') {
                setError("This email is already registered. Please login instead.");
            } else if (err.code === 'auth/weak-password') {
                setError("Password should be at least 6 characters.");
            } else {
                setError(`Failed to submit application: ${err.message || err}`);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} size="xl" centered className="premium-tech-modal">
            <Modal.Body className="p-0 overflow-hidden">
                <Row className="g-0" style={{ minHeight: '85vh' }}>
                    {/* Left Side: Branding & Info */}
                    <Col lg={4} className="d-none d-lg-block bg-primary-red p-5 text-white position-relative overflow-hidden"
                        style={{
                            background: 'linear-gradient(135deg, var(--fz-red-600) 0%, var(--fz-red-800) 100%)'
                        }}>
                        <div className="position-relative z-1 h-100 d-flex flex-column">
                            <div className="mb-5">
                                <i className="bi bi-wrench-adjustable-circle-fill fs-1"></i>
                                <h3 className="fw-bold mt-2">FixZone Pro</h3>
                            </div>

                            <div className="flex-grow-1">
                                <h2 className="display-6 fw-bold mb-4">Your Professional Journey Starts Here</h2>
                                <div className="space-y-4">
                                    <div className="d-flex gap-3 mb-4">
                                        <div className="feature-icon-circle"><i className="bi bi-person-badge"></i></div>
                                        <div>
                                            <h6 className="fw-bold mb-1">Personal Verification</h6>
                                            <p className="small text-white-50 mb-0">We ensure all our technicians are verified for safety.</p>
                                        </div>
                                    </div>
                                    <div className="d-flex gap-3 mb-4">
                                        <div className="feature-icon-circle"><i className="bi bi-tools"></i></div>
                                        <div>
                                            <h6 className="fw-bold mb-1">Equipment Check</h6>
                                            <p className="small text-white-50 mb-0">Having your own tools and vehicle speeds up your approval.</p>
                                        </div>
                                    </div>
                                    <div className="d-flex gap-3 mb-4">
                                        <div className="feature-icon-circle"><i className="bi bi-clock-history"></i></div>
                                        <div>
                                            <h6 className="fw-bold mb-1">Work on Your Terms</h6>
                                            <p className="small text-white-50 mb-0">Choose your operating districts and working hours.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-auto pt-4 border-top border-white border-opacity-10 opacity-75 small text-center">
                                <i className="bi bi-shield-lock me-2"></i>
                                Your data is protected by FixZone Security.
                            </div>
                        </div>
                        <div className="position-absolute" style={{ top: '-10%', right: '-30%', width: '300px', height: '300px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}></div>
                    </Col>

                    {/* Right Side: The Form */}
                    <Col lg={8} className="p-4 p-md-5 bg-white position-relative" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
                        <Button
                            variant="white"
                            className="position-absolute top-0 end-0 m-3 rounded-circle shadow-sm border z-10"
                            onClick={onHide}
                            style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <i className="bi bi-x-lg"></i>
                        </Button>

                        {success ? (
                            <div className="text-center py-5 h-100 d-flex flex-column justify-content-center animate-fade-in">
                                <div className="rounded-circle bg-success bg-opacity-10 d-flex align-items-center justify-content-center mx-auto mb-4 animate-scale-up" style={{ width: '120px', height: '120px' }}>
                                    <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '5rem' }}></i>
                                </div>
                                <h1 className="fw-bold text-dark mb-3">Submission Successful</h1>
                                <p className="text-secondary fs-5 mb-0 px-md-5">
                                    Our team will review your application within 3-5 business days.
                                    Keep an eye on your phone for a call from FixZone.
                                </p>
                            </div>
                        ) : (
                            <div className="animate-fade-in">
                                <div className="mb-5">
                                    <Badge bg="danger" className="mb-2 px-3 py-2 rounded-pill bg-opacity-10 text-danger fw-bold lh-1">OFFICIAL ONBOARDING</Badge>
                                    <h2 className="fw-bold text-dark">Apply to become a Partner</h2>
                                    <p className="text-secondary">Please provide accurate information for background verification.</p>
                                </div>

                                {error && <Alert variant="danger" className="rounded-4 border-0 shadow-sm mb-4">{error}</Alert>}

                                <Form onSubmit={handleSubmit}>
                                    {/* --- Section 1: Personal Info --- */}
                                    <div className="form-section mb-5">
                                        <h5 className="fw-bold text-dark mb-4 border-start border-4 border-danger ps-3">Personal Information</h5>
                                        <Row className="g-4">
                                            <Col md={12}>
                                                <div className="form-floating mb-1">
                                                    <Form.Control required id="fullName" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Full Name" className="sleek-input" />
                                                    <label htmlFor="fullName" className="text-muted fw-bold small">FULL NAME (AS PER NIC)</label>
                                                </div>
                                            </Col>
                                            <Col md={6}>
                                                <div className="form-floating mb-1">
                                                    <Form.Control required id="phone" name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone" className="sleek-input" />
                                                    <label htmlFor="phone" className="text-muted fw-bold small">PHONE NUMBER</label>
                                                </div>
                                            </Col>
                                            <Col md={6}>
                                                <div className="form-floating mb-1">
                                                    <Form.Control required type="email" id="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" className="sleek-input" />
                                                    <label htmlFor="email" className="text-muted fw-bold small">EMAIL ADDRESS</label>
                                                </div>
                                            </Col>
                                            <Col md={6}>
                                                <div className="form-floating mb-1">
                                                    <Form.Control required type="password" id="password" name="password" value={formData.password || ''} onChange={handleChange} placeholder="Password" className="sleek-input" minLength={6} />
                                                    <label htmlFor="password" className="text-muted fw-bold small">CREATE PASSWORD</label>
                                                </div>
                                            </Col>
                                            <Col md={6}>
                                                <div className="form-floating mb-1">
                                                    <Form.Control required id="nic" name="nic" value={formData.nic} onChange={handleChange} placeholder="NIC" className="sleek-input" />
                                                    <label htmlFor="nic" className="text-muted fw-bold small">NIC NUMBER</label>
                                                </div>
                                            </Col>
                                            <Col md={6}>
                                                <div className="form-floating mb-1">
                                                    <Form.Control required type="date" id="dob" name="dob" value={formData.dob} onChange={handleChange} placeholder="DOB" className="sleek-input" />
                                                    <label htmlFor="dob" className="text-muted fw-bold small">DATE OF BIRTH</label>
                                                </div>
                                            </Col>
                                        </Row>
                                    </div>

                                    {/* --- Section 2: Services & Locations --- */}
                                    <div className="form-section mb-5">
                                        <h5 className="fw-bold text-dark mb-3 border-start border-4 border-danger ps-3">Services & Logistics</h5>

                                        <div className="mb-4">
                                            <Form.Label className="fw-bold small text-muted mb-3">SERVICE CATEGORIES (WHAT CAN YOU FIX?)</Form.Label>
                                            <Row className="g-3 px-2 mb-3">
                                                {SERVICES.map(service => (
                                                    <Col xs={6} md={4} key={service}>
                                                        <div className="p-3 border rounded-4 bg-light bg-opacity-50 transition-all hover-border-danger">
                                                            <Form.Check
                                                                type="checkbox"
                                                                id={`service-${service}`}
                                                                label={<span className="fw-semibold small ms-1">{service}</span>}
                                                                checked={formData.services.includes(service)}
                                                                onChange={() => handleToggleList('services', service)}
                                                                className="custom-form-check"
                                                            />
                                                        </div>
                                                    </Col>
                                                ))}
                                            </Row>

                                            <Form.Group className="mt-4">
                                                <Form.Label className="fw-bold small text-muted mb-2">OTHER SERVICES</Form.Label>
                                                <Form.Control
                                                    name="otherServices"
                                                    value={formData.otherServices}
                                                    onChange={handleChange}
                                                    placeholder="If you fix other appliances not listed above, please specify here..."
                                                    className="sleek-input"
                                                />
                                            </Form.Group>
                                        </div>

                                        <div className="mb-4">
                                            <Form.Label className="fw-bold small text-muted mb-2">OPERATING DISTRICTS (WHERE CAN YOU WORK?)</Form.Label>
                                            <div className="d-flex flex-wrap gap-2">
                                                {DISTRICTS.map(district => (
                                                    <div key={district} onClick={() => handleToggleList('districts', district)} className={`selectable-chip ${formData.districts.includes(district) ? 'active' : ''}`}>
                                                        {formData.districts.includes(district) ? <i className="bi bi-geo-alt-fill me-2"></i> : <i className="bi bi-geo-alt me-2"></i>}
                                                        {district}
                                                    </div>
                                                ))}
                                            </div>
                                            <Form.Text className="text-muted tiny">Select all 25 districts where you can provide services.</Form.Text>
                                        </div>
                                    </div>

                                    {/* --- Section 3: Experience & Bio --- */}
                                    <div className="form-section mb-5">
                                        <h5 className="fw-bold text-dark mb-4 border-start border-4 border-danger ps-3">Professional Background</h5>
                                        <Row className="g-4">
                                            <Col md={12}>
                                                <div className="form-floating mb-1">
                                                    <Form.Control required type="number" id="experience" name="experience" value={formData.experience} onChange={handleChange} placeholder="Years" className="sleek-input" />
                                                    <label htmlFor="experience" className="text-muted fw-bold small">YEARS OF PROFESSIONAL EXPERIENCE</label>
                                                </div>
                                            </Col>
                                            <Col md={12}>
                                                <Form.Group>
                                                    <Form.Label className="fw-bold small text-muted mb-2">TELL US ABOUT YOUR EXPERTISE (BIO)</Form.Label>
                                                    <Form.Control as="textarea" rows={3} name="bio" value={formData.bio} onChange={handleChange} placeholder="Briefly describe your background, skills and certifications..." className="sleek-textarea" />
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                    </div>

                                    {/* --- Section 4: Logistics --- */}
                                    <div className="form-section mb-5">
                                        <h5 className="fw-bold text-dark mb-4 border-start border-4 border-danger ps-3">Logistical Information</h5>
                                        <Row className="g-4">
                                            <Col md={12}>
                                                <Form.Group>
                                                    <Form.Label className="fw-bold small text-muted mb-2">LIST TOOLS / EQUIPMENT YOU OWN</Form.Label>
                                                    <Form.Control as="textarea" rows={2} name="tools" value={formData.tools} onChange={handleChange} placeholder="e.g. Multimeter, Drill set, Gauges, Pressure washer..." className="sleek-textarea" />
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <div className="form-floating mb-1">
                                                    <Form.Select id="vehicle" name="vehicle" value={formData.vehicle} onChange={handleChange} className="sleek-input">
                                                        {VEHICLE_TYPES.map(v => <option key={v} value={v}>{v}</option>)}
                                                    </Form.Select>
                                                    <label htmlFor="vehicle" className="text-muted fw-bold small">MODE OF TRANSPORT</label>
                                                </div>
                                            </Col>
                                            <Col md={6}>
                                                <div className="form-floating mb-1">
                                                    <Form.Select id="workingHours" name="workingHours" value={formData.workingHours} onChange={handleChange} className="sleek-input">
                                                        {WORKING_HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                                                    </Form.Select>
                                                    <label htmlFor="workingHours" className="text-muted fw-bold small">PREFERRED WORKING HOURS</label>
                                                </div>
                                            </Col>
                                        </Row>
                                    </div>

                                    {/* --- Section 5: Uploads --- */}
                                    <div className="form-section mb-5">
                                        <h5 className="fw-bold text-dark mb-4 border-start border-4 border-danger ps-3">Required Documents & Photos</h5>

                                        <Row className="g-3">
                                            <Col md={6}>
                                                <div className="upload-box" onClick={() => document.getElementById('file-profile').click()}>
                                                    <input id="file-profile" type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'profilePhoto')} hidden />
                                                    {previews.profilePhoto ? <Image src={previews.profilePhoto} className="w-100 h-100 object-fit-cover rounded-3" /> : (
                                                        <div className="p-3 text-center">
                                                            <i className="bi bi-person-bounding-box fs-3 text-danger mb-1"></i>
                                                            <p className="tiny fw-bold mb-0">Profile Photo</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </Col>
                                            <Col md={6}>
                                                <div className="upload-box" onClick={() => document.getElementById('file-nic').click()}>
                                                    <input id="file-nic" type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'nicPhoto')} hidden />
                                                    {previews.nicPhoto ? <Image src={previews.nicPhoto} className="w-100 h-100 object-fit-cover rounded-3" /> : (
                                                        <div className="p-3 text-center">
                                                            <i className="bi bi-card-text fs-3 text-danger mb-1"></i>
                                                            <p className="tiny fw-bold mb-0">NIC Copy (Front)</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </Col>
                                            <Col md={12}>
                                                <div className="upload-zone rounded-4 p-4 text-center mb-3" onClick={() => document.getElementById('file-certs').click()}>
                                                    <input id="file-certs" type="file" multiple accept="image/*" onChange={(e) => handleFileChange(e, 'certificates')} hidden />
                                                    <i className="bi bi-patch-check fs-2 text-primary-red mb-2 d-block"></i>
                                                    <p className="mb-0 fw-bold text-dark small">Upload Certificates & Qualifications</p>
                                                    <p className="text-muted tiny mb-0">You can select multiple files</p>
                                                </div>
                                                <div className="d-flex flex-wrap gap-2 mb-4">
                                                    {previews.certificates.map((src, idx) => <Image key={idx} src={src} className="preview-thumb" />)}
                                                </div>
                                            </Col>
                                            <Col md={12}>
                                                <div className="upload-zone rounded-4 p-4 text-center" onClick={() => document.getElementById('file-work').click()}>
                                                    <input id="file-work" type="file" multiple accept="image/*" onChange={(e) => handleFileChange(e, 'workPhotos')} hidden />
                                                    <i className="bi bi-camera fs-2 text-primary-red mb-2 d-block"></i>
                                                    <p className="mb-0 fw-bold text-dark small">Recent Work Showcase Photos</p>
                                                    <p className="text-muted tiny mb-0">Show us some of your previous repairs</p>
                                                </div>
                                                <div className="d-flex flex-wrap gap-2 mt-3">
                                                    {previews.workPhotos.map((src, idx) => <Image key={idx} src={src} className="preview-thumb" />)}
                                                </div>
                                            </Col>
                                        </Row>
                                    </div>

                                    {/* --- Section 6: Declaration --- */}
                                    <div className="form-section mb-5 p-4 bg-light rounded-4">
                                        <Form.Check
                                            type="checkbox"
                                            id="declaration"
                                            name="declaration"
                                            checked={formData.declaration}
                                            onChange={handleChange}
                                            className="custom-checkbox"
                                            label={<span className="small fw-medium text-secondary">
                                                I hereby declare that all information provided is true and accurate. I understand that any false information may lead to rejection of my application or termination of partnership.
                                            </span>}
                                        />
                                    </div>

                                    <div className="mt-5 pb-5">
                                        <Button type="submit" disabled={loading} className="w-100 py-4 fw-bold rounded-4 btn-apply-tech">
                                            {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : 'SUBMIT PARTNERSHIP APPLICATION'}
                                        </Button>
                                    </div>
                                </Form>
                            </div>
                        )}
                    </Col>
                </Row>
            </Modal.Body>
            <style dangerouslySetInnerHTML={{
                __html: `
                .premium-tech-modal .modal-content { border-radius: 32px; border: none; overflow: hidden; box-shadow: 0 50px 100px -20px rgba(0,0,0,0.3); }
                .feature-icon-circle { width: 40px; height: 40px; background: rgba(255,255,255,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
                .sleek-input, .sleek-textarea { background: #f8fafc !important; border: 2px solid #f1f5f9 !important; border-radius: 12px !important; padding: 1.2rem 1rem !important; font-weight: 500; transition: all 0.3s ease; }
                .sleek-input:focus, .sleek-textarea:focus { background: #ffffff !important; border-color: var(--primary-red) !important; box-shadow: 0 0 0 4px rgba(185, 28, 28, 0.1) !important; }
                .selectable-chip { padding: 0.6rem 1.2rem; border-radius: 12px; background: #f1f5f9; border: 2px solid transparent; color: #475569; font-weight: 600; font-size: 0.85rem; cursor: pointer; transition: all 0.2s ease; display: inline-flex; align-items: center; }
                .selectable-chip:hover { background: #e2e8f0; }
                .selectable-chip.active { background: rgba(185, 28, 28, 0.1); border-color: var(--primary-red); color: var(--primary-red); }
                .upload-zone { border: 2px dashed #cbd5e1; cursor: pointer; transition: all 0.3s ease; }
                .upload-zone:hover { border-color: var(--primary-red); background: rgba(185, 28, 28, 0.02); }
                .upload-box { height: 120px; border: 2px dashed #cbd5e1; border-radius: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; overflow: hidden; transition: all 0.3s ease; }
                .upload-box:hover { border-color: var(--primary-red); }
                .preview-thumb { width: 70px; height: 70px; object-fit: cover; border-radius: 12px; border: 1px solid #e2e8f0; }
                .btn-apply-tech { background: var(--primary-red) !important; border: none; color: white; letter-spacing: 0.1rem; box-shadow: 0 10px 20px -5px rgba(185, 28, 28, 0.3); transition: all 0.3s ease; font-size: 1.1rem; }
                .btn-apply-tech:hover { transform: translateY(-2px); box-shadow: 0 15px 30px -5px rgba(185, 28, 28, 0.4); }
                .custom-checkbox .form-check-input:checked { background-color: var(--primary-red); border-color: var(--primary-red); }
                .custom-form-check .form-check-input { width: 1.25rem; height: 1.25rem; cursor: pointer; border: 2px solid #cbd5e1; }
                .custom-form-check .form-check-input:checked { background-color: var(--primary-red); border-color: var(--primary-red); }
                .hover-border-danger:hover { border-color: var(--primary-red) !important; background: white !important; }
                .tiny { font-size: 0.75rem; }
                .z-10 { z-index: 10; }
                @keyframes scaleUp { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                .animate-scale-up { animation: scaleUp 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
            `}} />
        </Modal>
    );
}
