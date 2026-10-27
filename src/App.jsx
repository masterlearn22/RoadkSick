import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import DashboardPage from './pages/DashboardPage';
import DetectionPage from './pages/DetectionPage';
import MapPage from './pages/MapPage';
import InventoryPage from './pages/InventoryPage';
import './index.css';

function App() {
  return (
    <HashRouter>
      <Routes>
        {/* Root redirect to Dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Layout wrapper with AppShell */}
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/detection" element={<DetectionPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
