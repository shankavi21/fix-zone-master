import React from 'react';
import { Card } from 'react-bootstrap';
import StatusBadge from './StatusBadge';
import { useNavigate } from 'react-router-dom';

export default function TicketCard({ ticket }) {
    const navigate = useNavigate();

    return (
        <Card className="mb-3" onClick={() => navigate(`/customer/tickets/${ticket.id}`)} style={{ cursor: 'pointer', transition: 'transform 0.2s' }}>
            <Card.Body>
                <div className="d-flex justify-content-between align-items-start mb-2">
                    <h5 className="card-title text-primary-red mb-0 fw-bold">{ticket.applianceType} - {ticket.brand}</h5>
                    <StatusBadge status={ticket.status} />
                </div>
                <Card.Text className="text-muted text-truncate">
                    {ticket.description}
                </Card.Text>
                <div className="d-flex justify-content-between align-items-center text-muted small">
                    <span>{ticket.createdAt ? new Date(ticket.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}</span>
                    <span>ID: {ticket.id ? ticket.id.slice(0, 8) : '...'}</span>
                </div>
            </Card.Body>
        </Card>
    );
}
