import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import TeamPage from './components/TeamPage';
import ParentDashboard from './components/ParentDashboard';
import DistrictDashboard from './components/DistrictDashboard';
import AdminDashboard from './components/AdminDashboard';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/team" element={<TeamPage />} />
      <Route path="/parent-dashboard" element={<ParentDashboard />} />
      <Route path="/district-dashboard" element={<DistrictDashboard />} />
      <Route path="/admin-dashboard" element={<AdminDashboard />} />
    </Routes>
  );
}

export default App;
