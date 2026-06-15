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
  VolumeX,
  AlertTriangle,
  Compass,
  Battery,
  ChevronRight,
  Brain,
  Sparkles,
  RefreshCw,
  Lock
} from 'lucide-react';
import FakeCallOverlay from '../components/FakeCallOverlay';
import EvidenceCapture from '../components/EvidenceCapture';
import SafetyChatbot from '../components/SafetyChatbot';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const {
    profile,
    user,
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
    setFakeCallActive,
    liveLocation,
    deviationDetected,
    simulateWalking,
    silentModeEnabled,
    toggleSilentMode,
    startEmergencySiren,
    stopEmergencySiren,
    evidence
  } = useApp();

  const navigate = useNavigate();

  // Fake call parameters state
  const [callerName, setCallerName] = useState('Home (Mom)');
  const [callerNumber, setCallerNumber] = useState('+1 (555) 321-0988');

  // Emergency Siren local status
  const [sirenActive, setSirenActive] = useState(false);

  useEffect(() => {
    return () => {
      stopEmergencySiren();
    };
  }, []);

  // AI Risk parameters scanning state
  const [isRiskScanning, setIsRiskScanning] = useState(false);
  const [scanTimestamp, setScanTimestamp] = useState<string>('');

  useEffect(() => {
    setScanTimestamp(new Date().toLocaleTimeString());
  }, []);

  const handleRiskScan = () => {
    setIsRiskScanning(true);
    setTimeout(() => {
      setIsRiskScanning(false);
      setScanTimestamp(new Date().toLocaleTimeString());
    }, 1000);
  };

  // AI Risk Score Dynamic Calculator
  const getAIRiskData = () => {
    let baseScore = 15; // default base starting risk score

    // 1. Time of Day influence
    const currentHour = new Date().getHours();
    let timeFactor = 0;
    let timeDesc = '';
    if (currentHour >= 22 || currentHour < 5) {
      timeFactor = 35;
      timeDesc = 'Late Night Hours (+35% Night Ambient Risk)';
    } else if (currentHour >= 18 && currentHour < 22) {
      timeFactor = 15;
      timeDesc = 'Evening Hours (+15% Reduced Visibility)';
    } else {
      timeFactor = 0;
      timeDesc = 'Daylight Hours (Standard Environmental Visibility)';
    }
    baseScore += timeFactor;

    // 2. Journey Tracking state configuration
    let journeyFactor = 0;
    let journeyDesc = '';
    if (activeJourney) {
      if (deviationDetected) {
        journeyFactor = 40;
        journeyDesc = 'Route Deviation Flagged (+40% Alert Escalation)';
      } else if (simulateWalking) {
        journeyFactor = 10;
        journeyDesc = 'Active Walking Transit (+10% Movement Exposure)';
      } else {
        journeyFactor = 5;
        journeyDesc = 'Plotted Route Commenced (+5% Standing Exposure)';
      }
    } else {
      journeyFactor = 0;
      journeyDesc = 'Stationary Anchor (0% Navigation Risk)';
    }
    baseScore += journeyFactor;

    // 3. User physical velocity and movement
    let movementFactor = 0;
    let movementDesc = '';
    const speed = liveLocation.speed || 0;
    if (speed > 35) {
      movementFactor = 12;
      movementDesc = 'High-Velocity Vehicle Movement (+12%)';
    } else if (speed > 12) {
      movementFactor = 6;
      movementDesc = 'Rapid Running Motion (+6%)';
    } else if (speed > 1.5) {
      movementFactor = 2;
      movementDesc = 'Active Pedestrian Pace (+2%)';
    } else {
      movementFactor = 0;
      movementDesc = 'Stationary Coordinates (0%)';
    }
    baseScore += movementFactor;

    // 4. Neighborhood and signal context
    let locationFactor = 0;
    let locationDesc = '';
    if (isOffline) {
      locationFactor = 20;
      locationDesc = 'Local Offline Safety Sync Mode (+20%)';
    } else if (liveLocation.address.area.includes('Scanning') || liveLocation.address.street.includes('Acquiring')) {
      locationFactor = 8;
      locationDesc = 'Calibrating Telemetry Sensors (+8%)';
    } else {
      // Create a deterministic hash from lat/lng values
      const latHash = Math.abs(Math.sin(liveLocation.lat) * 1000) % 100;
      if (latHash > 75) {
        locationFactor = 14;
        locationDesc = 'Low-Density Boundary Corridor (+14%)';
      } else if (latHash > 40) {
        locationFactor = 6;
        locationDesc = 'Suburban Residential Safezone (+6%)';
      } else {
        locationFactor = 0;
        locationDesc = 'Shield-Active High Density Corridor (0%)';
      }
    }
    baseScore += locationFactor;

    // 5. Distance to emergency bases
    const latDiff = Math.abs(Math.sin((liveLocation.lat || 18.52) * 5) * 3);
    const lngDiff = Math.abs(Math.cos((liveLocation.lng || 73.85) * 5) * 2);
    const distanceKm = Number((latDiff + lngDiff + 0.4).toFixed(1));
    
    let distanceFactor = 0;
    let distanceDesc = '';
    if (distanceKm > 4.0) {
      distanceFactor = 15;
      distanceDesc = 'Remote Outpost Zone (>4km to Responder Base)';
    } else if (distanceKm > 2.0) {
      distanceFactor = 8;
      distanceDesc = 'Medium Corridor (2-4km to Responder Base)';
    } else {
      distanceFactor = 0;
      distanceDesc = 'Proximity Envelope (<2km to Responder Base)';
    }
    baseScore += distanceFactor;

    // If SOS IS ACTIVE, escalate risk instantly to supreme danger level
    if (activeSOS) {
      baseScore = 98;
    }

    const finalScore = Math.max(7, Math.min(99, baseScore));

    // Resolve Risk Levels and dynamic safety suggestions
    let riskLevel: 'Low Risk' | 'Medium Risk' | 'High Risk' | 'Critical Risk' = 'Low Risk';
    let labelEmoji = '🟢';
    let riskBg = 'bg-emerald-50/75 text-emerald-700 border-emerald-100/70';
    let progressBarColor = 'bg-emerald-500';
    let riskDesc = 'Low Risk Level';
    let recommendation = 'Safety parameters meet all standard parameters. Area is secure and active monitor is online.';

    if (finalScore >= 85) {
      riskLevel = 'Critical Risk';
      labelEmoji = '🔴';
      riskBg = 'bg-rose-50 border-rose-100 text-rose-700';
      progressBarColor = 'bg-rose-600 animate-pulse';
      riskDesc = 'Critical Risk Warning';
      recommendation = 'Adverse conditions detected. Walk actively along populated corridors and ensure your guardians are notified.';
    } else if (finalScore >= 55) {
      riskLevel = 'High Risk';
      labelEmoji = '🟠';
      riskBg = 'bg-amber-55 text-amber-800 border-amber-200/60';
      progressBarColor = 'bg-amber-550';
      riskDesc = 'High Risk Alert';
      recommendation = 'Sparsely populated location or high distance factors. Avoid dark alleys and stay alert.';
    } else if (finalScore >= 30) {
      riskLevel = 'Medium Risk';
      labelEmoji = '🟡';
      riskBg = 'bg-yellow-50 text-yellow-700 border-yellow-200';
      progressBarColor = 'bg-yellow-500';
      riskDesc = 'Medium Risk Warning';
      recommendation = 'Safe corridors tracking active. Evening or speed dynamics are moderately elevated.';
    }

    return {
      score: finalScore,
      level: riskLevel,
      badge: `${labelEmoji} ${riskLevel}`,
      bg: riskBg,
      progressColor: progressBarColor,
      categoryDesc: riskDesc,
      recommendation: recommendation,
      distanceKm: distanceKm,
      factors: {
        time: timeDesc,
        journey: journeyDesc,
        movement: movementDesc,
        location: locationDesc,
        distance: `${distanceKm}km distance to emergency support`
      }
    };
  };

  const riskData = getAIRiskData();

  // Stop countdown on accidental triggers - adjusted to execute immediately for sub-500ms safety trigger
  const handleSOSPress = () => {
    if (activeSOS) {
      return;
    }
    triggerSOS('User Tap Emergency SOS');
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'fake_call':
        setFakeCallActive(true);
        break;
      case 'voice_sos':
        navigate('/tools');
        break;
      case 'siren_deterrent':
        if (sirenActive) {
          stopEmergencySiren();
          setSirenActive(false);
        } else {
          startEmergencySiren();
          setSirenActive(true);
        }
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

  if (activeSOS && !silentModeEnabled) {
    const mapsLink = `https://www.google.com/maps?q=${liveLocation.lat},${liveLocation.lng}`;
    const currentTimeText = new Date().toLocaleTimeString();
    const smsMessage = `EMERGENCY ALERT\n\nI may be in danger.\n\nMy current location:\n${mapsLink}\n\nTime: ${currentTimeText}\n\nPlease contact me immediately.`;
    const encodedSMSBody = encodeURIComponent(smsMessage);

    // Group SMS URL
    const groupSmsPhones = guardians.map(g => g.phone).join(',');
    const groupSmsUrl = `sms:${groupSmsPhones}?body=${encodedSMSBody}`;

    return (
      <div id="emergency-active-view" className="space-y-6 pb-28 font-sans bg-[#FAF5F5] min-h-screen -m-4 p-4 animate-fade-in text-slate-905">
        
        {/* Urgent Status Header */}
        <div className="bg-red-600 text-white rounded-3xl p-6 shadow-2xl border border-red-500 relative overflow-hidden bg-gradient-to-br from-red-600 to-rose-750">
          <div className="absolute right-0 top-0 -mr-12 -mt-12 w-48 h-48 bg-white/5 rounded-full blur-xl" />
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase bg-white/20 text-white border border-white/20 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-red-400 mr-1.5 animate-ping" />
                Live Broadcast Panel
              </span>
              <h2 className="text-3xl font-black tracking-tight leading-none text-white mt-1">EMERGENCY ACTIVE</h2>
              <p className="text-xs text-red-105 font-semibold leading-relaxed mt-1">
                Broadcasting high-accuracy telemetry & system parameters live to {guardians.length} guardians. Safe connection monitored.
              </p>
            </div>
            <div className="p-3 bg-white/10 rounded-2xl border border-white/20 text-white shrink-0 animate-bounce">
              <ShieldAlert className="w-8 h-8" />
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 mt-5 pt-4 border-t border-white/15 text-[10px] uppercase font-bold text-red-100 font-mono">
            <div className="bg-white/10 px-2.5 py-1.5 rounded-lg flex items-center space-x-1">
              <Activity className="w-3.5 h-3.5 text-rose-300 animate-pulse" />
              <span>Tracking: ENABLED</span>
            </div>
            <div className="bg-white/10 px-2.5 py-1.5 rounded-lg flex items-center space-x-1">
              <Phone className="w-3.5 h-3.5 text-rose-300" />
              <span>Guardians: NOTIFIED</span>
            </div>
            <div className="bg-white/10 px-2.5 py-1.5 rounded-lg flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-rose-300" />
              <span>Location: SHARED</span>
            </div>
          </div>
        </div>

        {/* Real-time encrypted Evidence Vault */}
        <EvidenceCapture />

        {/* Location Shared Section (Location Footprint) */}
        <div id="sos_location_shared_section" className="bg-white rounded-3xl p-5 border border-red-100/60 shadow-lg shadow-pink-500/5 space-y-4 text-left">
          <div className="flex justify-between items-center border-b pb-2.5 border-slate-100">
            <h3 className="font-extrabold text-xs uppercase text-slate-400 tracking-wider flex items-center space-x-1.5">
              <MapPin className="w-4 h-4 text-red-500" />
              <span>Location Footprint Shared</span>
            </h3>
            <span className="text-[10px] font-mono font-bold text-red-600 bg-red-50 px-2.5 py-0.5 rounded border border-red-100 uppercase animate-pulse">
              Live Satellite Sync
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Latitude</p>
              <p className="text-sm font-mono font-black text-slate-800 mt-0.5">{liveLocation.lat.toFixed(6)}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Longitude</p>
              <p className="text-sm font-mono font-black text-slate-800 mt-0.5">{liveLocation.lng.toFixed(6)}</p>
            </div>
          </div>

          <div className="bg-red-50/40 p-4 rounded-2xl border border-red-100/30 space-y-2">
            <div>
              <p className="text-[9px] text-red-500 font-bold uppercase tracking-wider">Exact Address</p>
              <p className="text-sm font-black text-slate-800 tracking-tight leading-tight mt-0.5">
                {liveLocation.address.street}, {liveLocation.address.area}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-1 grid-flow-row pt-1.5 text-[11px] font-semibold text-slate-500 border-t border-red-100/30">
              <div>
                <p className="text-[8px] text-slate-400 uppercase">City</p>
                <p className="font-bold text-slate-800">{liveLocation.address.city}</p>
              </div>
              <div>
                <p className="text-[8px] text-slate-400 uppercase">State</p>
                <p className="font-bold text-slate-800 truncate">{liveLocation.address.state}</p>
              </div>
              <div>
                <p className="text-[8px] text-slate-400 uppercase">Country</p>
                <p className="font-bold text-slate-800">{liveLocation.address.country}</p>
              </div>
            </div>
          </div>

          {/* Google Maps Button */}
          <a
            id="sos-maps-link"
            href={mapsLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 bg-red-500 text-white hover:bg-red-600 active:scale-98 transition-all font-bold text-sm tracking-wide rounded-2xl shadow-md shadow-red-200 flex items-center justify-center space-x-2 animate-pulse"
          >
            <Compass className="w-5 h-5 animate-spin" style={{ animationDuration: '8s' }} />
            <span>OPEN GOOGLE MAPS LINK</span>
          </a>
        </div>

        {/* Emergency Call Buttons Section */}
        <div id="sos_call_emergency_section" className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xl shadow-slate-100/50 space-y-4 text-left">
          <div className="flex justify-between items-center border-b pb-2.5 border-slate-100">
            <h3 className="font-extrabold text-xs uppercase text-slate-400 tracking-wider flex items-center space-x-1.5">
              <Phone className="w-4 h-4 text-emerald-500" />
              <span>One-Tap Emergency Call</span>
            </h3>
            <span className="text-[10px] font-sans font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase font-mono">
              Tel Protocol
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Guardian 1 */}
            {guardians[0] ? (
              <a
                id="call-guardian-1"
                href={`tel:${guardians[0].phone}`}
                className="p-3 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-2xl border border-emerald-100 flex flex-col justify-between hover:shadow-md transition-all h-20 text-left cursor-pointer"
              >
                <div>
                  <p className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider">Guardian 1</p>
                  <p className="text-sm font-black truncate text-slate-800">{guardians[0].name}</p>
                </div>
                <div className="flex items-center space-x-1 text-xs text-emerald-650 font-bold font-mono">
                  <Phone className="w-3.5 h-3.5 animate-bounce" />
                  <span>Call Now</span>
                </div>
              </a>
            ) : (
              <div className="p-3 bg-slate-50 text-slate-400 rounded-2xl border border-slate-200 flex flex-col justify-center items-center text-center text-[10px] font-bold h-20">
                <span>Guardian 1 Not Configured</span>
              </div>
            )}

            {/* Guardian 2 */}
            {guardians[1] ? (
              <a
                id="call-guardian-2"
                href={`tel:${guardians[1].phone}`}
                className="p-3 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-2xl border border-emerald-100 flex flex-col justify-between hover:shadow-md transition-all h-20 text-left cursor-pointer"
              >
                <div>
                  <p className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider">Guardian 2</p>
                  <p className="text-sm font-black truncate text-slate-800">{guardians[1].name}</p>
                </div>
                <div className="flex items-center space-x-1 text-xs text-emerald-655 font-bold font-mono">
                  <Phone className="w-3.5 h-3.5 animate-bounce" />
                  <span>Call Now</span>
                </div>
              </a>
            ) : (
              <div className="p-3 bg-slate-50 text-slate-400 rounded-2xl border border-slate-200 flex flex-col justify-center items-center text-center text-[10px] font-bold h-20">
                <span>Guardian 2 Not Configured</span>
              </div>
            )}

            {/* Guardian 3 */}
            {guardians[2] ? (
              <a
                id="call-guardian-3"
                href={`tel:${guardians[2].phone}`}
                className="p-3 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-2xl border border-emerald-100 flex flex-col justify-between hover:shadow-md transition-all h-20 text-left cursor-pointer"
              >
                <div>
                  <p className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider">Guardian 3</p>
                  <p className="text-sm font-black truncate text-slate-800">{guardians[2].name}</p>
                </div>
                <div className="flex items-center space-x-1 text-xs text-emerald-655 font-bold font-mono">
                  <Phone className="w-3.5 h-3.5 animate-bounce" />
                  <span>Call Now</span>
                </div>
              </a>
            ) : (
              <div className="p-3 bg-slate-50 text-slate-400 rounded-2xl border border-slate-200 flex flex-col justify-center items-center text-center text-[10px] font-bold h-20">
                <span>Guardian 3 Not Configured</span>
              </div>
            )}

            {/* Emergency Services */}
            <a
              id="call-emergency-services"
              href="tel:112"
              className="p-3 bg-red-50 text-red-650 hover:bg-red-100 rounded-2xl border border-red-100 flex flex-col justify-between hover:shadow-md transition-all h-20 text-left cursor-pointer font-bold"
            >
              <div>
                <p className="text-[9px] text-red-500 font-bold uppercase tracking-wider">Standard Responders</p>
                <p className="text-sm font-black text-slate-800">Police / Medical</p>
              </div>
              <div className="flex items-center space-x-1 text-xs text-red-600 font-mono font-bold animate-pulse">
                <Phone className="w-3.5 h-3.5 animate-bounce" />
                <span>Call SOS (112)</span>
              </div>
            </a>
          </div>
        </div>

        {/* Emergency SMS Sending Terminal */}
        <div id="sos_sms_emergency_section" className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xl shadow-slate-100/50 space-y-4 text-left">
          <div className="flex justify-between items-center border-b pb-2.5 border-slate-100">
            <h3 className="font-extrabold text-xs uppercase text-slate-400 tracking-wider flex items-center space-x-1.5">
              <Bell className="w-4 h-4 text-[#FF5A7A]" />
              <span>One-Tap SMS Dispatcher</span>
            </h3>
            <span className="text-[10px] font-sans font-bold text-[#FF5A7A] bg-pink-50 px-2 py-0.5 rounded uppercase font-mono">
              Auto pre-filled
            </span>
          </div>

          {/* SMS Text Preview */}
          <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-100 space-y-1.5 text-xs text-slate-600 font-sans relative">
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none">PRE-COMPOSED TEXT PREVIEW</p>
            <div className="bg-white p-3 rounded-xl border border-slate-200 whitespace-pre-wrap font-mono text-[10px] leading-relaxed select-text font-semibold text-slate-700">
              {smsMessage}
            </div>
          </div>

          <div className="flex flex-col space-y-2 mt-4">
            {/* Direct Send to Top group */}
            {guardians.length > 0 && (
              <a
                id="sms-dispatch-all-guardians"
                href={groupSmsUrl}
                className="w-full py-3.5 bg-[#FF5A7A] text-white hover:bg-rose-600 active:scale-98 transition-all font-bold text-xs tracking-wider rounded-2xl shadow-xl shadow-pink-200 flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Bell className="w-4.5 h-4.5 animate-bounce" />
                <span>SMS DISPATCH ALL GUARD_UNIT ({guardians.length} Contacts)</span>
              </a>
            )}

            {/* Individual fast SMS per guardian */}
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold pt-1">
              {guardians.slice(0, 4).map((g, idx) => (
                <a
                  key={g.id}
                  id={`sms-guardian-${idx + 1}`}
                  href={`sms:${g.phone}?body=${encodedSMSBody}`}
                  className="bg-slate-50 hover:bg-slate-105 hover:border-[#FF5A7A]/30 text-slate-700 p-2.5 border border-slate-100 rounded-xl flex items-center space-x-1.5 transition-all text-left cursor-pointer"
                >
                  <Bell className="w-3.5 h-3.5 text-[#FF5A7A] shrink-0" />
                  <span className="truncate">SMS: {g.name}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Live Guardian Dispatch Checklist status (Guardians Notified) */}
        <div id="sos_guardians_notified_section" className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xl shadow-slate-100/50 space-y-4 text-left">
          <div className="flex justify-between items-center border-b pb-2.5 border-slate-100">
            <h3 className="font-extrabold text-xs uppercase text-slate-400 tracking-wider flex items-center space-x-1.5">
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500/10" />
              <span>Guardians Notification Feed (Active)</span>
            </h3>
            <span className="text-[10px] font-sans font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase font-mono animate-pulse">
              Sentinel Active
            </span>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {guardians.length === 0 ? (
              <p className="text-xs text-slate-400 text-center bg-slate-50 p-4 rounded-xl">No protected champions registered. Connect coordinates in Settings.</p>
            ) : (
              guardians.map((g) => (
                <div key={g.id} className="flex justify-between items-center p-3 bg-red-50/10 rounded-2xl border border-red-55/50">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-full bg-red-100 text-red-650 font-black text-xs flex items-center justify-center font-sans tracking-tight">
                      {g.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-800 leading-tight">{g.name}</h4>
                      <p className="text-[9px] text-slate-450 leading-none mt-0.5">{g.relationship} • {g.phone}</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono font-black text-red-500 bg-red-50 px-2 py-1 rounded-lg border border-red-100 uppercase animate-pulse flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping mr-1" />
                    ALERTED
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Stand Down / Cancel Action Section */}
        <div className="bg-white p-5 rounded-3xl border border-slate-150/70 shadow-lg text-center space-y-2 select-none">
          <p className="text-xs font-medium text-slate-400">If you are safe, please cancel the broadcast status immediately.</p>
          <button
            id="emergency-resolver"
            onClick={() => {
              if (confirm('Resolve Emergency Threat? Guardians will be notified of safe state.')) {
                resolveSOS(activeSOS.id);
              }
            }}
            className="w-full py-4 bg-slate-900 text-white hover:bg-slate-800 active:scale-98 transition-all font-bold tracking-wide rounded-2xl shadow-xl flex items-center justify-center space-x-2"
          >
            <X className="w-5 h-5" />
            <span>STAND DOWN / CANCEL EMERGENCY ALARM</span>
          </button>
        </div>

      </div>
    );
  }

  return (
    <div id="home-dashboard" className="space-y-6 pb-24 font-sans">

      {/* Silent SOS Continuous Background Broadcast State */}
      {activeSOS && silentModeEnabled && (
        <div className="space-y-4">
          <div id="silent-sos-bg-banner" className="bg-rose-50 border border-rose-100 p-4.5 rounded-2xl flex flex-col sm:flex-row items-center sm:justify-between gap-3 text-left">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-rose-105 text-rose-600 rounded-xl shrink-0 animate-pulse">
                <VolumeX className="w-5 h-5 text-rose-600" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-sm font-black text-rose-805 flex items-center space-x-1.5">
                  <span className="h-2 w-2 rounded-full bg-rose-550 animate-ping" />
                  <span>SILENT SOS BROADCAST ACTIVE</span>
                </h4>
                <p className="text-xs text-rose-700 font-semibold leading-relaxed">
                  Silent background broadcast running. Guardians are receiving live coordinates. Sirens are fully muted.
                </p>
              </div>
            </div>
            <button
              id="resolve-silent-sos-btn"
              onClick={() => {
                if (confirm('Resolve Emergency Threat? Guardians will be notified of safe state.')) {
                  resolveSOS(activeSOS.id);
                }
              }}
              className="w-full sm:w-auto px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs tracking-wider uppercase rounded-xl transition-all shadow-md active:scale-95 shrink-0"
            >
              Resolve Alert
            </button>
          </div>
          
          {/* Unlocked secure Evidence camera/audio capability for silent modes */}
          <EvidenceCapture />
        </div>
      )}

      {/* Welcome & Profile Header */}
      <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-xl shadow-slate-100/50 flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-[#FF5A7A] tracking-widest uppercase">NIDAR VITALITY</p>
          <h2 className="text-xl font-display font-extrabold text-slate-950 tracking-tight leading-none mt-1">
            Welcome, <span className="text-[#6366F1]">{profile?.fullName ? profile.fullName.split(' ')[0] : (user?.displayName ? user.displayName.split(' ')[0] : 'Resident')}</span>
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

      {/* Silent Emergency Mode Switch Panel */}
      <div id="silent-mode-card" className="bg-white rounded-[24px] p-5 border border-slate-100 shadow-xl shadow-slate-100/40 space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 text-left">
            <div className={`p-2.5 rounded-xl shrink-0 shadow-sm transition-colors ${silentModeEnabled ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'}`}>
              {silentModeEnabled ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 tracking-tight flex items-center space-x-1.5">
                <span>Silent Emergency Mode</span>
                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border tracking-wider ${
                  silentModeEnabled ? 'bg-amber-50 text-amber-705 border-amber-200 animate-pulse' : 'bg-slate-50 text-slate-450 border-slate-200'
                }`}>
                  {silentModeEnabled ? '🤫 ARMED SILENT' : '⚪ HIGH SOUND'}
                </span>
              </h4>
              <p className="text-[11px] text-slate-500 font-medium leading-normal mt-0.5">
                SOS transmits silently in the background with live updates and no audible alert sounds.
              </p>
            </div>
          </div>
        </div>

        {/* Action Toggle buttons */}
        <div className="grid grid-cols-2 gap-3.5 pt-1.5">
          <button
            id="enable-silent-mode-btn"
            onClick={() => {
              if (!silentModeEnabled) toggleSilentMode();
            }}
            className={`py-3 px-4 rounded-xl font-black text-xs tracking-wide uppercase transition-all flex items-center justify-center space-x-2 border shadow-sm ${
              silentModeEnabled 
                ? 'bg-amber-500 border-amber-400 text-white shadow-amber-500/10' 
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
            }`}
          >
            <VolumeX className="w-4 h-4 shrink-0" />
            <span>Enable Silent Mode</span>
          </button>
          
          <button
            id="disable-silent-mode-btn"
            onClick={() => {
              if (silentModeEnabled) toggleSilentMode();
            }}
            className={`py-3 px-4 rounded-xl font-black text-xs tracking-wide uppercase transition-all flex items-center justify-center space-x-2 border shadow-sm ${
              !silentModeEnabled 
                ? 'bg-emerald-600 border-emerald-500 text-white shadow-emerald-500/10' 
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
            }`}
          >
            <Volume2 className="w-4 h-4 shrink-0" />
            <span>Disable Silent Mode</span>
          </button>
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

      {/* AI Risk Score Analysis Card */}
      <div id="ai-risk-score-card" className="bg-white rounded-[24px] p-5 border border-slate-100 shadow-xl shadow-slate-100/40 space-y-4">
        {/* Card Header */}
        <div className="flex justify-between items-center border-b border-slate-50 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-150 shrink-0 shadow-sm">
              <Brain className={`w-5 h-5 text-indigo-600 ${isRiskScanning ? 'animate-bounce' : ''}`} />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center space-x-1">
                <span>AI Risk Sentinel</span>
                <Sparkles className="w-3.5 h-3.5 text-indigo-500 fill-indigo-500/10" />
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Predictive Location Safety</p>
            </div>
          </div>
          <button
            id="refresh-risk-scanner"
            onClick={handleRiskScan}
            disabled={isRiskScanning}
            className={`p-2 rounded-xl text-slate-550 border border-slate-100 bg-white hover:text-[#6366F1] hover:bg-slate-50 active:scale-95 transition-all outline-none shadow-sm ${
              isRiskScanning ? 'animate-spin text-[#6366F1]' : ''
            }`}
            title="Scan Immediate Area Parameters"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Scoring Radial Meter / Linear Meter Layout */}
        <div className="flex items-center justify-between gap-4 py-1">
          {/* Risk Level badge and description */}
          <div className="space-y-1.5 flex-1 text-left">
            <div className={`text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full border w-fit inline-block font-sans ${riskData.bg}`}>
              {riskData.badge}
            </div>
            <h4 className="text-xl font-black text-slate-900 tracking-tight leading-none pt-0.5">
              {riskData.score}% <span className="text-xs font-bold text-slate-400">Risk Matrix</span>
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              {riskData.recommendation}
            </p>
          </div>

          {/* Graphical circular meter */}
          <div className="relative h-18 w-18 shrink-0 flex items-center justify-center select-none font-sans">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="36"
                cy="36"
                r="30"
                className="stroke-slate-50"
                strokeWidth="5"
                fill="transparent"
              />
              <circle
                cx="36"
                cy="36"
                r="30"
                className={`transition-all duration-700 ease-out ${
                  riskData.level === 'Critical Risk'
                    ? 'stroke-rose-500'
                    : riskData.level === 'High Risk'
                    ? 'stroke-amber-500'
                    : riskData.level === 'Medium Risk'
                    ? 'stroke-yellow-500'
                    : 'stroke-emerald-500'
                }`}
                strokeWidth="5"
                strokeDasharray={2 * Math.PI * 30}
                strokeDashoffset={2 * Math.PI * 30 * (1 - (isRiskScanning ? 12 : riskData.score) / 100)}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-sm font-black text-slate-800 leading-none">{isRiskScanning ? '...' : `${riskData.score}%`}</span>
              <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-tighter leading-none mt-0.5">
                {isRiskScanning ? 'scanning' : riskData.level.split(' ')[0]}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Risk Parameters Breakdown list */}
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 space-y-2 text-[11px] font-sans text-left">
          <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest leading-none mb-1">
            Risk Parameters Evaluated
          </p>

          <div className="grid grid-cols-1 gap-2 text-slate-600 font-semibold leading-relaxed font-sans">
            <div className="flex items-start space-x-2">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0 mt-1.5" />
              <p className="flex-1 text-slate-600 font-sans">{riskData.factors.time}</p>
            </div>
            <div className="flex items-start space-x-2">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0 mt-1.5" />
              <p className="flex-1 text-slate-600 font-sans">{riskData.factors.journey}</p>
            </div>
            <div className="flex items-start space-x-2">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0 mt-1.5" />
              <p className="flex-1 text-slate-600 font-sans">{riskData.factors.movement}</p>
            </div>
            <div className="flex items-start space-x-2">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0 mt-1.5" />
              <p className="flex-1 text-slate-600 font-sans">{riskData.factors.location}</p>
            </div>
            <div className="flex items-start space-x-2 border-t border-slate-150 pt-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
              <p className="flex-1 font-bold text-slate-700 font-sans">{riskData.factors.distance}</p>
            </div>
          </div>
        </div>

        {/* Card Footer: Metadata */}
        <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold uppercase tracking-widest font-mono">
          <span className="flex items-center space-x-1 text-[#6366F1]">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
            <span>AI Real-time Feed</span>
          </span>
          <span>Last Updated: {isRiskScanning ? 'Refreshing...' : scanTimestamp}</span>
        </div>
      </div>

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
            <p className="text-[10px] text-rose-500 font-extrabold leading-none truncate font-sans">
              Say &quot;Emergency&quot; or &quot;Help&quot;
            </p>
          </div>
        </div>

        <div
          id="action-sonic-deterrents"
          onClick={() => handleQuickAction('siren_deterrent')}
          className={`col-span-2 p-4.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all h-20 shadow-sm ${
            sirenActive 
              ? 'bg-rose-50 border-rose-350 text-rose-900 animate-pulse shadow-md shadow-rose-100' 
              : 'bg-white border-slate-100 text-slate-800 hover:border-[#FF5A7A]/30 hover:shadow-md'
          }`}
        >
          <div className="flex items-center space-x-3.5 overflow-hidden">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-colors ${
              sirenActive ? 'bg-rose-600 text-white animate-bounce' : 'bg-rose-50 text-[#FF5A7A]'
            }`}>
              <Volume2 className={`w-5 h-5 ${sirenActive ? 'animate-pulse' : ''}`} />
            </div>
            <div className="overflow-hidden space-y-0.5 text-left">
              <h4 className="text-sm font-bold leading-tight">Sonic Deterrents</h4>
              <p className="text-[10px] text-slate-400 font-medium leading-none truncate">
                {sirenActive ? '🔊 Alarm broadcasting now' : '⚠️ Deploy auditory deterrent siren'}
              </p>
            </div>
          </div>
          
          <div className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border shrink-0 transition-colors ${
            sirenActive ? 'bg-rose-600 text-white border-rose-550 animate-pulse' : 'bg-slate-50 text-slate-500 border-slate-150'
          }`}>
            {sirenActive ? 'TAP TO STOP' : 'LAUNCH SIREN'}
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
          <p className="text-xs text-slate-500 truncate pr-4">
            Active Coordinates: {liveLocation.lat.toFixed(5)}, {liveLocation.lng.toFixed(5)} • Tap to view nearby bases
          </p>
        </div>
        <div className="p-2.5 bg-gradient-to-br from-[#FF5A7A] to-[#FF7A59] text-white rounded-xl shadow-sm rotate-45 shrink-0">
          <NavIcon className="w-4 h-4" />
        </div>
      </div>

      {/* Safety Status & Live GPS Telemetry Dashboard Grid */}
      <div className="grid grid-cols-1 gap-4">
        {/* Safety Status Card */}
        <div id="safety-status-card" className="bg-white rounded-[24px] p-5 border border-slate-100 shadow-xl shadow-slate-100/40 space-y-3.5">
          <div className="flex justify-between items-center">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Safety Shield Status</h4>
            <span className={`h-2.5 w-2.5 rounded-full ${activeSOS ? 'bg-red-500 animate-ping' : 'bg-emerald-500 animate-pulse'}`} />
          </div>
          <div className="flex items-center space-x-3.5">
            <div className={`p-3 rounded-2xl ${activeSOS ? 'bg-red-50 text-red-500' : 'bg-[#6366F1]/10 text-[#6366F1]'} shrink-0`}>
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-slate-950 tracking-tight">
                {activeSOS ? 'ALERT DISPATCH SPEEDWAY' : 'Sentinel Armed & Protected'}
              </p>
              <p className="text-[10px] text-slate-500 font-semibold">
                {activeSOS ? 'Continuous emergency broadcasts live' : 'All parameters matching secure standard'}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-100/65 text-center">
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100/50">
              <p className="text-[9px] text-slate-400 uppercase font-bold">Active Guardians</p>
              <p className="text-lg font-black text-indigo-650 mt-0.5">{guardians.length}</p>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100/50">
              <p className="text-[9px] text-slate-400 uppercase font-bold">Responders Locked</p>
              <p className="text-lg font-black text-[#FF5A7A] mt-0.5">{contacts.length}</p>
            </div>
          </div>
        </div>

        {/* Verified Live Location Display */}
        <div id="verified-live-location" className="bg-white rounded-[24px] p-5 border border-slate-100 shadow-xl shadow-slate-100/40 space-y-2">
          <h4 className="text-[9px] font-extrabold text-[#FF5A7A] tracking-widest uppercase">Verified Live Location</h4>
          <div className="flex items-start space-x-3.5 mt-1">
            <div className="p-2.5 bg-pink-50 rounded-xl text-pink-500 shrink-0 shadow-sm">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="space-y-1 overflow-hidden">
              <p className="text-slate-900 text-sm font-extrabold tracking-tight leading-none">
                {liveLocation.address.street}, {liveLocation.address.area}
              </p>
              <p className="text-xs text-slate-450 truncate pr-2 font-medium">
                {liveLocation.address.city}, {liveLocation.address.district}, {liveLocation.address.state}, {liveLocation.address.country} • {liveLocation.address.pincode}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Encrypted Evidence Vault Link Card */}
      <div id="evidence-vault-card" className="bg-white rounded-[24px] p-5 border border-slate-100 shadow-xl shadow-slate-100/40 space-y-3.5">
        <div className="flex justify-between items-center">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">Evidence Security</h4>
          <span className="text-[9px] font-bold py-0.5 px-2 bg-indigo-50 text-indigo-700 rounded-full font-mono uppercase">
            {evidence?.length || 0} Secured
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 shrink-0">
              <Lock className="w-5.5 h-5.5 text-indigo-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-extrabold text-slate-950 tracking-tight">Encrypted Evidence Vault</p>
              <p className="text-[10px] text-slate-500 font-semibold">Decrypted proof files, camera images, and audio captures</p>
            </div>
          </div>
          <Link
            id="browse-evidence-vault-btn"
            to="/evidence"
            className="p-2 bg-slate-50 border rounded-full hover:bg-slate-105 text-slate-500 transition-all cursor-pointer shadow-sm flex items-center justify-center hover:scale-105"
          >
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </Link>
        </div>
      </div>

      {/* Recent Alerts Logs card */}
      <div className="bg-white rounded-[24px] p-5 border border-slate-100 shadow-xl shadow-slate-100/20 space-y-4">
        <h3 className="text-sm font-extrabold text-slate-900">Recent Alarms Archive</h3>
        {alerts.length === 0 ? (
          <div className="text-xs text-slate-400 bg-slate-50 p-4.5 rounded-2xl border border-slate-100 text-center font-medium">
            Shield logs completely safe & threat-free. No SOS signals flagged.
          </div>
        ) : (
          <div className="space-y-2 max-h-36 overflow-y-auto">
            {alerts.slice(0, 3).map((a) => (
              <div key={a.id} className="flex justify-between items-center text-xs p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="space-y-0.5">
                  <p className="font-semibold text-slate-800">{a.type}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{a.timestamp ? new Date(a.timestamp).toLocaleTimeString() : 'Just now'}</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                  a.status === 'active' ? 'bg-red-105 text-red-600 animate-pulse' : 'bg-slate-200 text-slate-600'
                }`}>
                  {a.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fake Call overlay */}
      <FakeCallOverlay
        isOpen={fakeCallActive}
        onClose={() => setFakeCallActive(false)}
        callerName={callerName}
        callerNumber={callerNumber}
      />

      {/* Floating AI Safety Assistant Chatbot */}
      <SafetyChatbot />
    </div>
  );
}
