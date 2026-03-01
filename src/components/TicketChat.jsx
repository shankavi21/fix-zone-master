import React, { useState, useEffect, useRef } from 'react';
import { Card, Form, Button, Spinner } from 'react-bootstrap';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export default function TicketChat({ ticketId, currentUser, role, assignedTechId, assignedTechName }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (!ticketId) return;

        const q = query(
            collection(db, 'tickets', ticketId, 'messages'),
            orderBy('createdAt', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMessages(msgs);
            scrollToBottom();
        });

        return unsubscribe;
    }, [ticketId]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        setSending(true);
        try {
            await addDoc(collection(db, 'tickets', ticketId, 'messages'), {
                text: newMessage,
                senderId: currentUser.uid,
                senderName: currentUser.displayName || (role === 'customer' ? 'Customer' : 'Technician'),
                role: role,
                createdAt: serverTimestamp()
            });
            setNewMessage('');
            scrollToBottom();

            // SIMULATED AUTO REPLY (Demo Feature)
            // If the sender is a customer and it's their first message (or no tech reply yet), allow a simulated response
            if (role === 'customer') {
                const hasTechReply = messages.some(m => m.role === 'technician');
                if (!hasTechReply) {
                    setTimeout(async () => {
                        await addDoc(collection(db, 'tickets', ticketId, 'messages'), {
                            text: "Thanks for your message! I've been notified and will get back to you shortly.",
                            senderId: assignedTechId || 'system_tech',
                            senderName: `Auto (${assignedTechName || 'Expert'})`,
                            role: 'technician',
                            createdAt: serverTimestamp()
                        });
                    }, 2000);
                }
            }

        } catch (error) {
            console.error("Error sending message:", error);
        }
        setSending(false);
    };

    const isOwnMessage = (msg) => msg.senderId === currentUser.uid;

    if (!assignedTechId && role === 'customer') {
        return (
            <div className="text-center py-5 bg-light rounded border border-dashed">
                <i className="bi bi-chat-dots text-muted fs-1 mb-3 d-block"></i>
                <h6 className="fw-bold text-muted">Chat Unavailable</h6>
                <p className="text-muted small mb-0">
                    You can chat with the technician once one has been assigned to your ticket.
                </p>
            </div>
        );
    }

    return (
        <div className="d-flex flex-column h-100">
            {/* Messages Area */}
            <div className="flex-grow-1 mb-3 pe-2" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                {messages.length === 0 ? (
                    <div className="text-center py-5 text-muted small">
                        <i className="bi bi-chat-dots fs-3 mb-2 d-block"></i>
                        Start the conversation...
                    </div>
                ) : (
                    <div className="d-flex flex-column gap-2">
                        {messages.map(msg => (
                            <div
                                key={msg.id}
                                className={`d-flex ${msg.type === 'system' ? 'justify-content-center' : (isOwnMessage(msg) ? 'justify-content-end' : 'justify-content-start')}`}
                            >
                                {msg.type === 'system' ? (
                                    <div className="small text-muted text-center my-2 bg-light px-3 py-1 rounded-pill border">
                                        <i className="bi bi-info-circle me-1"></i> {msg.text}
                                    </div>
                                ) : (
                                    <div
                                        className={`p-3 rounded-4 shadow-sm ${isOwnMessage(msg)
                                            ? 'bg-danger text-white rounded-bottom-right-0'
                                            : 'bg-white text-dark border rounded-bottom-left-0'
                                            }`}
                                        style={{ maxWidth: '80%', minWidth: '120px' }}
                                    >
                                        <div className={`tiny fw-bold mb-1 ${isOwnMessage(msg) ? 'text-white-50' : 'text-muted'}`}>
                                            {isOwnMessage(msg) ? 'You' : msg.senderName}
                                        </div>
                                        <div style={{ wordBreak: 'break-word', fontSize: '0.95rem' }}>{msg.text}</div>
                                    </div>
                                )}
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Input Area */}
            <Form onSubmit={handleSend} className="d-flex gap-2">
                <Form.Control
                    type="text"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="rounded-pill bg-light border-0 px-4"
                    disabled={sending}
                />
                <Button
                    type="submit"
                    variant="danger"
                    className="rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                    style={{ width: '45px', height: '45px' }}
                    disabled={!newMessage.trim() || sending}
                >
                    {sending ? <Spinner size="sm" /> : <i className="bi bi-send-fill"></i>}
                </Button>
            </Form>
        </div>
    );
}
