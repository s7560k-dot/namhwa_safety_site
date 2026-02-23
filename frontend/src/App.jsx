import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SafetyDashboard from './SafetyDashboard';
import ResourceCenter from './ResourceCenter';
import Login from './Login';
import Admin from './Admin';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfUse from './components/TermsOfUse';
import ContactSupport from './components/ContactSupport';
import FirestoreScanner from './components/FirestoreScanner';
import GlobalBoard from './GlobalBoard';

function App() {
  return (
    <Router>
      <FirestoreScanner />
      <Routes>
        <Route path="/" element={<ResourceCenter />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfUse />} />
        <Route path="/support" element={<ContactSupport />} />
        <Route path="/dashboard/:siteId" element={<SafetyDashboard />} />
        <Route path="/board/global" element={<GlobalBoard />} />
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
