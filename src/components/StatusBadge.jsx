import React from 'react';
import { Badge } from 'react-bootstrap';

export default function StatusBadge({ status }) {
    let variant = 'secondary';
    switch (status.toLowerCase()) {
        case 'pending':
            variant = 'warning';
            break;
        case 'assigned':
            variant = 'info';
            break;
        case 'quoted':
            variant = 'info';
            break;
        case 'in progress':
            variant = 'primary';
            break;
        case 'completed':
            variant = 'success';
            break;
        case 'finished':
            variant = 'dark';
            break;
        case 'cancelled':
            variant = 'danger';
            break;
        default:
            variant = 'secondary';
    }

    return (
        <Badge bg={variant} text={variant === 'warning' ? 'dark' : 'white'} className="px-3 py-2 rounded-pill">
            {status}
        </Badge>
    );
}
