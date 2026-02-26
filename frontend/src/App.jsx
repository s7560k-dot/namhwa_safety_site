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

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ResourceCenter />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfUse />} />
        <Route path="/support" element={<ContactSupport />} />
        <Route path="/dashboard/:siteId" element={<SafetyDashboard />} />
        <Route path="/board/global" element={<GlobalBoard />} />
        <Route path="/calculator" element={<MaterialCalculator />} />
        <Route path="/civil-calc" element={<CivilQuantityTakeoff />} />
        <Route path="/floorplan-3d" element={<FloorPlanTo3DApp />} />
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
