import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';

import Login from './pages/auth/Login';
import RegisterDoctor from './pages/auth/RegisterDoctor';
import RegisterPatient from './pages/auth/RegisterPatient';
import RegisterPharmacy from './pages/auth/RegisterPharmacy';
import DoctorDashboard from './pages/doctor/Dashboard';
import NewPrescription from './pages/doctor/NewPrescription';
import PrescriptionDetail from './pages/doctor/PrescriptionDetail';
import PrescriptionPDF from './pages/doctor/PrescriptionPDF';
import Invoice from './pages/pharmacy/Invoice';
import PharmacyAnalytics from './pages/pharmacy/PharmacyAnalytics';
import PatientSummaryPDF from './pages/patient/PatientSummaryPDF';
import PrescriptionTracker from './pages/patient/PrescriptionTracker';
import ForgotPassword from './pages/auth/ForgotPassword';
import PharmacyDashboard from './pages/pharmacy/Dashboard';
import PatientDashboard from './pages/patient/Dashboard';
import AdminDashboard from './pages/admin/Dashboard';
import Analytics from './pages/admin/Analytics';
import DoctorProfile from './pages/doctor/Profile';
import PharmacyProfile from './pages/pharmacy/Profile';
import UserGuide from './pages/info/UserGuide';
import TermsAndConditions from './pages/info/TermsAndConditions';
import PrivacyPolicy from './pages/info/PrivacyPolicy';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const routes = { doctor: '/doctor', pharmacy: '/pharmacy', patient: '/patient', admin: '/admin' };
    return <Navigate to={routes[user.role] || '/login'} replace />;
  }
  return <Layout>{children}</Layout>;
};

const RootRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  const routes = { doctor: '/doctor', pharmacy: '/pharmacy', patient: '/patient', admin: '/admin' };
  return <Navigate to={routes[user.role] || '/login'} replace />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/register/doctor" element={<RegisterDoctor />} />
      <Route path="/register/patient" element={<RegisterPatient />} />
      <Route path="/register/pharmacy" element={<RegisterPharmacy />} />
      <Route path="/" element={<RootRedirect />} />

      <Route path="/doctor" element={<ProtectedRoute allowedRoles={['doctor']}><DoctorDashboard /></ProtectedRoute>} />
      <Route path="/doctor/new-prescription" element={<ProtectedRoute allowedRoles={['doctor']}><NewPrescription /></ProtectedRoute>} />
      <Route path="/doctor/profile" element={<ProtectedRoute allowedRoles={['doctor']}><DoctorProfile /></ProtectedRoute>} />
      <Route path="/doctor/prescription/:id" element={<ProtectedRoute allowedRoles={['doctor','pharmacy','patient']}><PrescriptionDetail /></ProtectedRoute>} />
      <Route path="/prescription/:id/pdf" element={<ProtectedRoute allowedRoles={['doctor','pharmacy','patient','admin']}><PrescriptionPDF /></ProtectedRoute>} />
      <Route path="/prescription/:id/invoice" element={<ProtectedRoute allowedRoles={['pharmacy','admin']}><Invoice /></ProtectedRoute>} />

      <Route path="/pharmacy/analytics" element={<ProtectedRoute allowedRoles={['pharmacy']}><PharmacyAnalytics /></ProtectedRoute>} />
      <Route path="/pharmacy/profile" element={<ProtectedRoute allowedRoles={['pharmacy']}><PharmacyProfile /></ProtectedRoute>} />
      <Route path="/pharmacy" element={<ProtectedRoute allowedRoles={['pharmacy']}><PharmacyDashboard /></ProtectedRoute>} />

      <Route path="/patient/tracker" element={<ProtectedRoute allowedRoles={['patient']}><PrescriptionTracker /></ProtectedRoute>} />
      <Route path="/patient/summary-pdf" element={<ProtectedRoute allowedRoles={['patient']}><PatientSummaryPDF /></ProtectedRoute>} />
      <Route path="/patient" element={<ProtectedRoute allowedRoles={['patient']}><PatientDashboard /></ProtectedRoute>} />

      <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={['admin']}><Analytics /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />

      <Route path="/guide" element={<UserGuide />} />
      <Route path="/terms" element={<TermsAndConditions />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
