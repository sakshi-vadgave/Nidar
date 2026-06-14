/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldAlert,
  Phone,
  Mic,
  MapPin,
  Activity,
  Heart,
  Navigation as NavIcon,
  Bell,
  Trash2,
  X,
  Volume2,
  AlertTriangle,
  Compass,
  Battery
} from 'lucide-react';
import FakeCallOverlay from '../components/FakeCallOverlay';

export default function Dashboard() {
  const {
    profile,
    guardians,
    contacts,
    alerts,
    activeSOS,
    activeJourney,
    triggerSOS,
    resolveSOS,
    isOffline,
    batteryStatus,
    networkType,
    fakeCallActive,
    setFakeCallActive
  } = useApp();

  const navigate = useNavigate();

  // Fake call parameters state
  const [callerName, setCallerName] = useState('Home (Mom)');
  const [callerNumber, setCallerNumber] = useState('+1 (555) 321-0988');

  // SOS States
  const [sosCountdown, setSosCountdown] = useState<number | null>(null);
  const [countdownTimer, setCountdownTimer] = useState<any>(null);

  // Stop countdown on accidental triggers
  const handleSOSPress = () => {
    if (activeSOS) {
      // If already active, don't trigger countdown, let user cancel directly from resolver
      return;
    }
    // Start standard 5-second countdown
    setSosCountdown(5);
  };

  useEffect(() => {
    if (sosCountdown === null) return;

    if (sosCountdown === 0) {
      triggerSOS('User Tap Emergency SOS');
      setSosCountdown(null);
      return;
    }

    const t = setTimeout(() => {
      setSosCountdown(prev => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(t);
  }, [sosCountdown]);

  const cancelCountDown = () => {
    setSosCountdown(null);
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'fake_call':
        setFakeCallActive(true);
        break;
      case 'voice_sos':
        navigate('/tools');
        break;
      case 'police':
        navigate('/maps?focus=police');
        break;
      case 'hospital':
        navigate('/maps?focus=hospital');
        break;
      default:
        break;
    }
  };

  return (
    <div id="home-dashboard" className="space-y-6 pb-24 font-sans">
      
      {/* Welcome & Profile Header */}
      <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-xl shadow-slate-100/50 flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-[#FF5A7A] tracking-widest uppercase">NIDAR VITALITY</p>
          <h2 className="text-xl font-display font-extrabold text-slate-950 tracking-tight leading-none mt-1">
            Welcome, <span className="text-[#6366F1]">{profile?.fullName ? profile.fullName.split(' ')[0] : 'Jessica'}</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">You are secure. Sentinel tracking live.</p>
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          {activeSOS ? (
            <span className="text-xs bg-red-50 text-red-500 border border-red-100 font-bold px-3 py-1.5 rounded-full flex items-center space-x-1.5 animate-pulse shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
              <span>SOS Active</span>
            </span>
          ) : (
            <span className="text-xs bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold px-3 py-1.5 rounded-full flex items-center space-x-1.5 h-8 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Vault Secure</span>
            </span>
          )}
        </div>
      </div>

      {/* Main SOS button */}
      <div className="bg-white rounded-[32px] p-8 flex flex-col items-center justify-center border border-slate-100 shadow-xl shadow-slate-100/50 select-none">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">EMERGENCY SOS TRANSMITTER</h3>

        {activeSOS ? (
          /* Active SOS resolver button panel */
          <div className="flex flex-col items-center space-y-4 w-full">
            <div className="relative flex items-center justify-center mb-6 h-52 w-full">
              <div className="absolute w-52 h-52 bg-red-500/10 rounded-full animate-pulse" />
              <div className="absolute w-40 h-40 bg-red-500/20 rounded-full animate-ping" />
              <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-red-600 to-red-500 text-white flex flex-col items-center justify-center shadow-2xl shadow-red-400 border-4 border-white animate-sos-pulse">
                <ShieldAlert className="w-12 h-12" />
              </div>
            </div>
            <div className="text-center space-y-1">
              <h4 className="text-red-600 font-extrabold text-lg tracking-tight">DISPATCH ACTIVE</h4>
              <p className="text-xs text-slate-500 font-semibold px-4">Alert generated from {activeSOS.type}</p>
            </div>
            <button
              id="sos-resolver-btn"
              onClick={() => resolveSOS(activeSOS.id)}
              className="py-3 px-8 bg-slate-900 text-white hover:bg-slate-800 active:scale-95 transition-all rounded-xl font-bold text-xs tracking-wider shadow-md shadow-slate-900/10"
            >
              RESOLVE EMERGENCY THREAT
            </button>
          </div>
        ) : (
          /* Static Trigger button */
          <div className="flex flex-col items-center justify-center w-full">
            <div className="relative flex items-center justify-center mb-6 h-52 w-full">
              <div className="absolute w-52 h-52 bg-[#FF5A7A]/10 rounded-full animate-pulse" />
              <div className="absolute w-40 h-40 bg-[#FF5A7A]/20 rounded-full" />
              <button
                id="main-sos-btn"
                onClick={handleSOSPress}
                className="relative w-32 h-32 rounded-full bg-gradient-to-br from-[#FF5A7A] to-[#FF7A59] text-white flex flex-col items-center justify-center shadow-2xl shadow-pink-400/50 transform active:scale-95 hover:scale-103 transition-all border-4 border-white"
              >
                <ShieldAlert className="w-10 h-10 mb-1" />
                <span className="text-xl font-black uppercase tracking-wider">SOS</span>
                <span className="text-[9px] opacity-90 font-bold uppercase tracking-tighter mt-0.5">Press to Alert</span>
              </button>
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">Emergency Alert Dispatch</h3>
            <p className="text-center text-slate-450 text-xs px-6 max-w-sm">
              One tap streams live location patterns and system health metrics to all priority protectors.
            </p>
          </div>
        )}
      </div>

      {/* Accidental SOS Overlay */}
      <AnimatePresence>
        {sosCountdown !== null && (
          <motion.div
            id="sos-countdown-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col justify-center items-center bg-[#FF5A7A] text-white p-8 font-sans"
          >
            <div className="text-center space-y-6 max-w-sm">
              <AlertTriangle className="w-16 h-16 text-white animate-bounce mx-auto" />
              <h2 className="text-3xl font-bold tracking-tight">TRIGGERING EMERGENCY SOS</h2>
              <p className="text-pink-100 text-sm leading-relaxed">
                NIDAR Safety is dispatching coordinates to all {guardians.length || 6} guardians. Hold to cancel if this is accidental.
              </p>

              {/* Big Circular Ring Countdown */}
              <div className="w-32 h-32 rounded-full border-4 border-white/30 flex items-center justify-center mx-auto relative">
                <span className="text-5xl font-extrabold font-mono">{sosCountdown}</span>
                <div className="absolute inset-0 rounded-full border-4 border-white border-t-transparent animate-spin" />
              </div>

              <button
                id="sos-abort-btn"
                onClick={cancelCountDown}
                className="w-full py-4 bg-white text-[#FF5A7A] hover:bg-slate-50 active:scale-98 transition-all font-bold tracking-wide rounded-2xl shadow-xl"
              >
                CANCEL EMERGENCY ALARM
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div
          id="action-fake-call"
          onClick={() => handleQuickAction('fake_call')}
          className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-3.5 cursor-pointer hover:border-[#FF5A7A]/30 hover:shadow-md transition-all h-20"
        >
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shrink-0 shadow-sm">
            <Phone className="w-5 h-5" />
          </div>
          <div className="overflow-hidden space-y-0.5">
            <h4 className="text-sm font-bold text-slate-800 leading-tight">Fake Call</h4>
            <p className="text-[10px] text-slate-400 font-medium leading-none truncate">Simulate escape ring</p>
          </div>
        </div>

        <div
          id="action-voice-sos"
          onClick={() => handleQuickAction('voice_sos')}
          className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-3.5 cursor-pointer hover:border-[#FF5A7A]/30 hover:shadow-md transition-all h-20"
        >
          <div className="w-10 h-10 bg-pink-50 rounded-xl flex items-center justify-center text-[#FF5A7A] shrink-0 shadow-sm">
            <Mic className="w-5 h-5 animate-pulse" />
          </div>
          <div className="overflow-hidden space-y-0.5">
            <h4 className="text-sm font-bold text-slate-800 leading-tight">Voice SOS</h4>
            <p className="text-[10px] text-slate-400 font-medium leading-none truncate font-sans">Keyword trigger</p>
          </div>
        </div>

        <div
          id="action-police-nearby"
          onClick={() => handleQuickAction('police')}
          className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-3.5 cursor-pointer hover:border-[#FF5A7A]/30 hover:shadow-md transition-all h-20"
        >
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0 shadow-sm">
            <Compass className="w-5 h-5" />
          </div>
          <div className="overflow-hidden space-y-0.5">
            <h4 className="text-sm font-bold text-slate-800 leading-tight">Police Base</h4>
            <p className="text-[10px] text-slate-400 font-medium leading-none truncate">Locate local safety</p>
          </div>
        </div>

        <div
          id="action-hospital-nearby"
          onClick={() => handleQuickAction('hospital')}
          className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-3.5 cursor-pointer hover:border-[#FF5A7A]/30 hover:shadow-md transition-all h-20"
        >
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shrink-0 shadow-sm">
            <Activity className="w-5 h-5" />
          </div>
          <div className="overflow-hidden space-y-0.5">
            <h4 className="text-sm font-bold text-slate-800 leading-tight">Hospitals</h4>
            <p className="text-[10px] text-slate-400 font-medium leading-none truncate">Medical coordinate</p>
          </div>
        </div>
      </div>

      {/* Live Tracking Card (Dynamic Route monitor concept) */}
      <div
        onClick={() => navigate('/maps')}
        className="bg-white rounded-[24px] border border-slate-100 shadow-xl shadow-slate-100/30 p-5 cursor-pointer hover:border-[#FF5A7A]/30 hover:shadow-md transition-all flex items-center justify-between"
      >
        <div className="space-y-1.5 overflow-hidden">
          <p className="text-[9px] text-[#6366F1] font-extrabold tracking-widest uppercase">AREA MAP FEED</p>
          <h4 className="text-sm font-bold text-slate-800 tracking-tight flex items-center space-x-1.5 leading-none">
            <Compass className="w-4 h-4 text-primary animate-spin" style={{ animationDuration: '6s' }} />
            <span>Interactive Safety Map</span>
          </h4>
          <p className="text-xs text-slate-500 truncate pr-4">Active Coordinates: 19.076, 72.877 • Tap to view nearby bases</p>
        </div>
        <div className="p-2.5 bg-gradient-to-br from-[#FF5A7A] to-[#FF7A59] text-white rounded-xl shadow-sm rotate-45 shrink-0">
          <NavIcon className="w-4 h-4" />
        </div>
      </div>

      {/* Guardian Status Card */}
      <div
        onClick={() => navigate('/guardians')}
        className="bg-white rounded-[24px] border border-slate-105 shadow-xl shadow-slate-100/20 p-5 space-y-4 cursor-pointer hover:border-[#6366F1]/30 hover:shadow-md transition-all"
      >
        <div className="flex justify-between items-center border-b border-slate-50 pb-2">
          <h3 className="text-sm font-extrabold text-[#0F172A] flex items-center space-x-1.5">
            <Heart className="w-4.5 h-4.5 text-primary fill-primary/10" />
            <span>Active Guardians Status</span>
          </h3>
          <span className="text-xs font-bold text-[#FF5A7A] bg-pink-50/50 px-2.5 py-1 rounded-full">{guardians.length} connected</span>
        </div>
        {guardians.length === 0 ? (
          <p className="text-xs text-slate-450 bg-slate-50/50 p-3.5 rounded-xl border border-slate-100">No champions connected. Set your priority protectors immediately.</p>
        ) : (
          <div className="flex items-center justify-between py-1">
            <div className="flex -space-x-1.5 overflow-hidden">
              {guardians.map((g, idx) => (
                <div
                  key={g.id}
                  style={{ zIndex: 10 - idx }}
                  className="w-9 h-9 rounded-full border-2 border-white bg-[#6366F1]/10 text-[#6366F1] flex items-center justify-center text-xs font-extrabold font-sans shadow-sm"
                >
                  {g.name.charAt(0).toUpperCase()}
                </div>
              ))}
            </div>
            <span className="text-xs text-slate-400 font-semibold tracking-wide">3 Guardians tracking stream</span>
          </div>
        )}
      </div>

      {/* Journey Monitoring Card */}
      {activeJourney && (
        <div
          onClick={() => navigate('/journey')}
          className="bg-indigo-50/70 rounded-[24px] p-5.5 border border-indigo-100 shadow-md shadow-indigo-50 flex items-center justify-between cursor-pointer"
        >
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-indigo-600 bg-indigo-100 border border-indigo-200/50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              JOURNEY TRACKING ACTIVE
            </span>
            <h4 className="text-sm font-bold text-slate-800 mt-2">{activeJourney.destinationName}</h4>
            <p className="text-xs text-slate-500 font-semibold">ETA: {activeJourney.eta}</p>
          </div>
          <span className="h-2 w-2 rounded-full bg-indigo-600 animate-ping" />
        </div>
      )}

      {/* Recent Alerts Logs card */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-800">Recent Alarms</h3>
          <div className="space-y-2 max-h-36 overflow-y-auto">
            {alerts.slice(0, 3).map((a) => (
              <div key={a.id} className="flex justify-between items-center text-xs p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="space-y-0.5">
                  <p className="font-semibold text-slate-800">{a.type}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{new Date(a.timestamp).toLocaleTimeString()}</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                  a.status === 'active' ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-slate-200 text-slate-600'
                }`}>
                  {a.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fake Call overlay */}
      <FakeCallOverlay
        isOpen={fakeCallActive}
        onClose={() => setFakeCallActive(false)}
        callerName={callerName}
        callerNumber={callerNumber}
      />
    </div>
  );
}
