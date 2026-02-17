import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SafetyDashboard from './SafetyDashboard';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard/siteA" replace />} />
        <Route path="/dashboard/:siteId" element={<SafetyDashboard />} />
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/dashboard/siteA" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
