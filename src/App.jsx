import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './auth/Login';
import Signup from './auth/Signup';
import ForgotPassword from './auth/ForgotPassword';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import TechnicianRoute from './components/TechnicianRoute';
import Dashboard from './customer/Dashboard';
import CreateTicket from './customer/CreateTicket';
import MyTickets from './customer/MyTickets';
import TicketDetails from './customer/TicketDetails';
import Profile from './customer/Profile';
import Services from './customer/Services';
import Tracking from './customer/Tracking';
import Settings from './customer/Settings';
import Notifications from './customer/Notifications';
import About from './public/About';
import Terms from './public/Terms';
import Privacy from './public/Privacy';
import Contact from './public/Contact';
import AdminDashboard from './admin/AdminDashboard';
import AdminTickets from './admin/AdminTickets';
import AdminUsers from './admin/AdminUsers';
import AdminTechnicians from './admin/AdminTechnicians';
import AdminApplications from './admin/AdminApplications';
import AdminAnalytics from './admin/AdminAnalytics';
import AdminSettings from './admin/AdminSettings';
import AdminNotifications from './admin/AdminNotifications';
import TechnicianDashboard from './technician/TechnicianDashboard';
import TechnicianJobs from './technician/TechnicianJobs';
import TechnicianProfile from './technician/TechnicianProfile';
import TechnicianEarnings from './technician/TechnicianEarnings';
import TechnicianSettings from './technician/TechnicianSettings';

function AppRoutes() {
  const { currentUser, userRole } = useAuth();

  // Role-based redirect after login
  const getDefaultRedirect = () => {
    if (userRole === 'admin') return '/admin/dashboard';
    if (userRole === 'technician') return '/technician/dashboard';
    return '/customer/dashboard';
  };

  return (
    <Routes>
      <Route path="/login" element={!currentUser ? <Login /> : <Navigate to={getDefaultRedirect()} />} />
      <Route path="/signup" element={!currentUser ? <Signup /> : <Navigate to={getDefaultRedirect()} />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route path="/customer/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/customer/create-ticket" element={<PrivateRoute><CreateTicket /></PrivateRoute>} />
      <Route path="/customer/my-tickets" element={<PrivateRoute><MyTickets /></PrivateRoute>} />
      <Route path="/customer/tickets/:id" element={<PrivateRoute><TicketDetails /></PrivateRoute>} />
      <Route path="/customer/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
      <Route path="/customer/services" element={<Services />} />
      <Route path="/customer/tracking" element={<PrivateRoute><Tracking /></PrivateRoute>} />
      <Route path="/customer/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
      <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />

      <Route path="/about" element={<About />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/contact" element={<Contact />} />

      <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/tickets" element={<AdminRoute><AdminTickets /></AdminRoute>} />
      <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
      <Route path="/admin/technicians" element={<AdminRoute><AdminTechnicians /></AdminRoute>} />
      <Route path="/admin/applications" element={<AdminRoute><AdminApplications /></AdminRoute>} />
      <Route path="/admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
      <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
      <Route path="/admin/notifications" element={<AdminRoute><AdminNotifications /></AdminRoute>} />

      {/* Technician Routes */}
      <Route path="/technician/dashboard" element={<TechnicianRoute><TechnicianDashboard /></TechnicianRoute>} />
      <Route path="/technician/jobs" element={<TechnicianRoute><TechnicianJobs /></TechnicianRoute>} />
      <Route path="/technician/jobs/:id" element={<TechnicianRoute><TechnicianJobs /></TechnicianRoute>} />
      <Route path="/technician/profile" element={<TechnicianRoute><TechnicianProfile /></TechnicianRoute>} />
      <Route path="/technician/earnings" element={<TechnicianRoute><TechnicianEarnings /></TechnicianRoute>} />
      <Route path="/technician/settings" element={<TechnicianRoute><TechnicianSettings /></TechnicianRoute>} />
      <Route path="/technician/availability" element={<TechnicianRoute><TechnicianSettings /></TechnicianRoute>} />

      <Route path="/" element={<Dashboard />} />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
