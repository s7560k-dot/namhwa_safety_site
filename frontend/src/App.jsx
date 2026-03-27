import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SafetyDashboard from './SafetyDashboard';
import ResourceCenter from './ResourceCenter';
import Login from './Login';
import Admin from './Admin';
import GlobalBoard from './GlobalBoard';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfUse from './components/TermsOfUse';
import ContactSupport from './components/ContactSupport';
import MaterialCalculator from './components/MaterialCalculator';
import CivilQuantityTakeoff from './components/CivilQuantityTakeoff';
import FloorPlanTo3DApp from './components/FloorPlanTo3DApp';
import NetworkScheduleDashboard from './components/evm/NetworkScheduleDashboard';

import { AuthProvider } from './context/AuthContext';
import { AuthenticatedRoute, ApprovedRoute, AdminRoute } from './components/auth/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<ResourceCenter />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={
            <AdminRoute>
              <Admin />
            </AdminRoute>
          } />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfUse />} />
          <Route path="/support" element={<ContactSupport />} />
          
          {/* Approved users only routes */}
          <Route path="/dashboard/:siteId" element={
            <ApprovedRoute>
              <SafetyDashboard />
            </ApprovedRoute>
          } />
          <Route path="/board/global" element={
            <ApprovedRoute>
              <GlobalBoard />
            </ApprovedRoute>
          } />
          <Route path="/calculator" element={
            <ApprovedRoute>
              <MaterialCalculator />
            </ApprovedRoute>
          } />
          <Route path="/civil-calc" element={
            <ApprovedRoute>
              <CivilQuantityTakeoff />
            </ApprovedRoute>
          } />
          <Route path="/floorplan-3d" element={
            <ApprovedRoute>
              <FloorPlanTo3DApp />
            </ApprovedRoute>
          } />
          <Route path="/network-schedule/:siteId" element={
            <ApprovedRoute>
              <NetworkScheduleDashboard />
            </ApprovedRoute>
          } />
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
