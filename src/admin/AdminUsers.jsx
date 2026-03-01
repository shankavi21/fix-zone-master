import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Form, InputGroup, Modal, Row, Col } from 'react-bootstrap';
import { db } from '../firebase';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import AdminLayout from '../components/AdminLayout';

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('All');
    const [selectedUser, setSelectedUser] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'users'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const userData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setUsers(userData);
            setFilteredUsers(userData);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    useEffect(() => {
        let filtered = users;

        if (roleFilter !== 'All') {
            filtered = filtered.filter(u => u.role === roleFilter.toLowerCase());
        }

        if (searchTerm) {
            filtered = filtered.filter(u =>
                u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                u.email?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredUsers(filtered);
    }, [searchTerm, roleFilter, users]);

    const handleRoleChange = async (userId, newRole, isVerified = null) => {
        try {
            const userRef = doc(db, 'users', userId);
            const updates = { role: newRole };
            if (isVerified !== null) {
                updates.isVerified = isVerified;
            }
            await updateDoc(userRef, updates);
        } catch (error) {
            console.error('Error updating role:', error);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                await deleteDoc(doc(db, 'users', userId));
            } catch (error) {
                console.error('Error deleting user:', error);
            }
        }
    };

    const roles = ['All', 'Customer', 'Technician', 'Admin'];

    return (
        <AdminLayout>
            <div className="admin-users">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="fw-bold mb-1">User Management</h2>
                        <p className="text-muted mb-0">Manage all platform users</p>
                    </div>
                    <Badge bg="primary" className="px-3 py-2 fs-6">
                        {filteredUsers.length} Users
                    </Badge>
                </div>

                {/* Filters */}
                <Card className="border-0 shadow-sm rounded-4 mb-4">
                    <Card.Body className="p-4">
                        <Row className="g-3">
                            <Col md={6}>
                                <InputGroup>
                                    <InputGroup.Text className="bg-light border-0">
                                        <i className="bi bi-search"></i>
                                    </InputGroup.Text>
                                    <Form.Control
                                        placeholder="Search by name or email..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="border-0 bg-light"
                                    />
                                </InputGroup>
                            </Col>
                            <Col md={6}>
                                <Form.Select
                                    value={roleFilter}
                                    onChange={(e) => setRoleFilter(e.target.value)}
                                    className="bg-light border-0"
                                >
                                    {roles.map(role => (
                                        <option key={role} value={role}>{role}</option>
                                    ))}
                                </Form.Select>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* Users Table */}
                <Card className="border-0 shadow-sm rounded-4">
                    <Card.Body className="p-0">
                        {loading ? (
                            <div className="text-center py-5">
                                <div className="spinner-border text-danger" role="status"></div>
                            </div>
                        ) : filteredUsers.length > 0 ? (
                            <Table responsive hover className="mb-0">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="fw-bold text-uppercase small text-muted px-4 py-3">User</th>
                                        <th className="fw-bold text-uppercase small text-muted py-3">Email</th>
                                        <th className="fw-bold text-uppercase small text-muted py-3">Role</th>
                                        <th className="fw-bold text-uppercase small text-muted py-3">Phone</th>
                                        <th className="fw-bold text-uppercase small text-muted py-3">Status</th>
                                        <th className="fw-bold text-uppercase small text-muted py-3">Joined</th>
                                        <th className="fw-bold text-uppercase small text-muted py-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map(user => (
                                        <tr key={user.id}>
                                            <td className="px-4 py-3">
                                                <div className="d-flex align-items-center gap-3">
                                                    <div className="bg-danger text-white rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '40px', height: '40px', fontSize: '14px' }}>
                                                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                                    </div>
                                                    <div>
                                                        <div className="fw-semibold">{user.name || 'No Name'}</div>
                                                        <div className="text-muted small">{user.id.slice(0, 8)}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3">
                                                <span className="text-muted small">{user.email}</span>
                                            </td>
                                            <td className="py-3">
                                                <Form.Select
                                                    size="sm"
                                                    value={user.role || 'customer'}
                                                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                    className="w-auto"
                                                    style={{ minWidth: '120px' }}
                                                >
                                                    <option value="customer">Customer</option>
                                                    <option value="technician">Technician</option>
                                                    <option value="admin">Admin</option>
                                                </Form.Select>
                                            </td>
                                            <td className="py-3">
                                                <span className="text-muted small">{user.phone || 'N/A'}</span>
                                            </td>
                                            <td className="py-3">
                                                {user.role === 'technician' ? (
                                                    <Badge
                                                        bg={user.isVerified ? 'success' : 'warning'}
                                                        className="px-2 py-1 cursor-pointer"
                                                        onClick={() => handleRoleChange(user.id, user.role, !user.isVerified)}
                                                        style={{ cursor: 'pointer' }}
                                                    >
                                                        {user.isVerified ? 'Verified' : 'Pending'}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-muted small">-</span>
                                                )}
                                            </td>
                                            <td className="py-3">
                                                <span className="text-muted small">
                                                    {user.createdAt?.toDate ? user.createdAt.toDate().toLocaleDateString() : 'N/A'}
                                                </span>
                                            </td>
                                            <td className="py-3">
                                                <Button
                                                    variant="link"
                                                    size="sm"
                                                    className="text-danger fw-bold p-0 me-3"
                                                    onClick={() => {
                                                        setSelectedUser(user);
                                                        setShowDetailModal(true);
                                                    }}
                                                >
                                                    View
                                                </Button>
                                                <Button
                                                    variant="link"
                                                    size="sm"
                                                    className="text-danger fw-bold p-0"
                                                    onClick={() => handleDeleteUser(user.id)}
                                                >
                                                    Delete
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        ) : (
                            <div className="text-center py-5">
                                <i className="bi bi-people text-muted opacity-25" style={{ fontSize: '4rem' }}></i>
                                <p className="text-muted mt-3">No users found</p>
                            </div>
                        )}
                    </Card.Body>
                </Card>
            </div>

            {/* Detail Modal */}
            <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} centered>
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold">User Details</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    {selectedUser && (
                        <div>
                            <div className="text-center mb-4">
                                <div className="bg-danger text-white rounded-circle d-flex align-items-center justify-content-center fw-bold mx-auto mb-3" style={{ width: '80px', height: '80px', fontSize: '2rem' }}>
                                    {selectedUser.name ? selectedUser.name.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <h5 className="fw-bold mb-1">{selectedUser.name || 'No Name'}</h5>
                                <Badge bg={selectedUser.role === 'admin' ? 'danger' : selectedUser.role === 'technician' ? 'info' : 'secondary'} className="px-3 py-1">
                                    {selectedUser.role || 'customer'}
                                </Badge>
                            </div>
                            <hr />
                            <div className="mb-3">
                                <small className="text-muted text-uppercase fw-bold">Email</small>
                                <div className="fw-semibold">{selectedUser.email}</div>
                            </div>
                            <div className="mb-3">
                                <small className="text-muted text-uppercase fw-bold">Phone</small>
                                <div className="fw-semibold">{selectedUser.phone || 'Not provided'}</div>
                            </div>
                            <div className="mb-3">
                                <small className="text-muted text-uppercase fw-bold">Address</small>
                                <div className="fw-semibold">{selectedUser.address || 'Not provided'}</div>
                            </div>
                            <div className="mb-3">
                                <small className="text-muted text-uppercase fw-bold">User ID</small>
                                <div className="font-monospace small">{selectedUser.id}</div>
                            </div>
                        </div>
                    )}
                </Modal.Body>
            </Modal>
        </AdminLayout>
    );
}
