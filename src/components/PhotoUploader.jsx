import React, { useState } from 'react';
import { Form, Row, Col, Image } from 'react-bootstrap';

export default function PhotoUploader({ onFilesChange }) {
    const [previews, setPreviews] = useState([]);

    const handleFileChange = (e) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            onFilesChange(files);

            // Cleanup old previews
            previews.forEach(p => URL.revokeObjectURL(p));

            const newPreviews = files.map(file => URL.createObjectURL(file));
            setPreviews(newPreviews);
        }
    };

    return (
        <div>
            <Form.Group controlId="formFileMultiple" className="mb-3">
                <Form.Label>Upload Photos of the Appliance/Issue</Form.Label>
                <Form.Control type="file" multiple accept="image/*" onChange={handleFileChange} />
                <Form.Text className="text-muted">
                    You can select multiple images.
                </Form.Text>
            </Form.Group>
            <Row xs={3} md={4} className="g-2">
                {previews.map((src, idx) => (
                    <Col key={idx}>
                        <Image src={src} thumbnail style={{ height: '100px', objectFit: 'cover', width: '100%' }} />
                    </Col>
                ))}
            </Row>
        </div>
    );
}
