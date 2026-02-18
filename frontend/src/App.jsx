import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SafetyDashboard from './SafetyDashboard';
import ResourceCenter from './ResourceCenter';
import Login from './Login';
import FirestoreScanner from './components/FirestoreScanner';

function App() {
  return (
    <Router>
      <FirestoreScanner />
      <Routes>
        <Route path="/" element={<ResourceCenter />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard/:siteId" element={<SafetyDashboard />} />
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
