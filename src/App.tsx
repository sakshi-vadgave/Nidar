/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { motion, AnimatePresence } from 'motion/react';

// Platform Pages
import Splash from './pages/Splash';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Maps from './pages/Maps';
import Guardians from './pages/Guardians';
import EmergencyContacts from './pages/EmergencyContacts';
import JourneyMonitoring from './pages/Journey';
import SafetyTools from './pages/SafetyTools';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import EvidenceHistory from './pages/EvidenceHistory';
import Fearless from './pages/Fearless';

// Platform Components
import Header from './components/Header';
import Navigation from './components/Navigation';

// Animated layout envelope wrapping all protected core screens
function ProtectedLayout() {
  const { user, loading, needsOnboarding } = useApp();
  const location = useLocation();

  if (loading) {
    // Elegant system checking anchor
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center">
        <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <span className="text-xs text-slate-400 font-semibold mt-4 tracking-widest font-mono">RETRIEVING SECURITY KEY</span>
      </div>
    );
  }

  // Redirect to authorization trigger if session is missing
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (location.pathname === '/') {
    return <Navigate to="/dashboard" replace />;
  }

  // Force onboarding collection if profile details are blank
  if (needsOnboarding && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  const isTabRoute = ['/dashboard', '/maps', '/fearless', '/guardians', '/journey', '/tools', '/profile'].includes(location.pathname);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col max-w-lg mx-auto border-x border-slate-100 shadow-xl relative pb-20">
      {/* Header displayed on core routes only */}
      {location.pathname !== '/onboarding' && <Header />}

      {/* Primary viewport framing with state-preserving persistent caching */}
      <main className="flex-1 px-5 pt-4">
        {isTabRoute ? (
          <div className="w-full h-full relative">
            <div className={location.pathname === '/dashboard' ? 'block w-full h-full' : 'hidden'}>
              <Dashboard />
            </div>
            <div className={location.pathname === '/maps' ? 'block w-full h-full' : 'hidden'}>
              <Maps />
            </div>
            <div className={location.pathname === '/fearless' ? 'block w-full h-full' : 'hidden'}>
              <Fearless />
            </div>
            <div className={location.pathname === '/guardians' ? 'block w-full h-full' : 'hidden'}>
              <Guardians />
            </div>
            <div className={location.pathname === '/journey' ? 'block w-full h-full' : 'hidden'}>
              <JourneyMonitoring />
            </div>
            <div className={location.pathname === '/tools' ? 'block w-full h-full' : 'hidden'}>
              <SafetyTools />
            </div>
            <div className={location.pathname === '/profile' ? 'block w-full h-full' : 'hidden'}>
              <Profile />
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12, filter: 'blur(3px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -12, filter: 'blur(3px)' }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="w-full h-full"
            >
              <Routes>
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/contacts" element={<EmergencyContacts />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/evidence" element={<EvidenceHistory />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* Floating Bottom Navigator displayed on core pages only */}
      {location.pathname !== '/onboarding' && <Navigation />}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          {/* Splash screen acts as baseline entry routing check */}
          <Route path="/" element={<Splash />} />
          <Route path="/login" element={<Login />} />
          
          {/* Protected routes */}
          <Route path="/*" element={<ProtectedLayout />} />
        </Routes>
      </HashRouter>
    </AppProvider>
  );
}
