/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { motion } from 'motion/react';
import { Shield, User, Phone, Mail, Activity, HeartCrack, Plus } from 'lucide-react';

export default function Onboarding() {
  const { user, completeOnboarding, needsOnboarding } = useApp();
  const navigate = useNavigate();

  // Redirect if they do not need onboarding
  useEffect(() => {
    if (user && !needsOnboarding) {
      navigate('/');
    }
  }, [user, needsOnboarding, navigate]);

  const [fullName, setFullName] = useState(user?.displayName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [email, setEmail] = useState(user?.email || '');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [medicalNotes, setMedicalNotes] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(user?.photoURL || '');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!fullName || !phoneNumber || !email) {
      setErrorMsg('Full Name, Phone Number, and Email are strictly required for security protocols.');
      return;
    }
    setLoading(true);
    try {
      await completeOnboarding({
        fullName,
        phoneNumber,
        email,
        profilePhoto,
        bloodGroup,
        medicalNotes,
      });
      navigate('/');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error configuring onboarding.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-xl mx-auto bg-white/85 backdrop-blur-md rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/40">
        
        {/* Step Indicator Header */}
        <div className="text-center space-y-4 mb-8">
          <div className="relative inline-flex items-center justify-center p-3.5 bg-primary/10 rounded-full border border-primary/20">
            <User className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold text-slate-800">
              Safety Verification Profile
            </h2>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              Please finalize your security credentials. This telemetry is transmitted instantly on any SOS alarm.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 mb-6 bg-red-50 text-red-500 text-xs font-semibold border border-red-100 rounded-xl">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Main User details panel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 flex items-center space-x-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Full Name</span>
              </label>
              <input
                id="onboard-name-input"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Alice Johnson"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary/40"
              />
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 flex items-center space-x-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>Phone Number</span>
              </label>
              <input
                id="onboard-phone-input"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1 555-0199"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary/40 text-slate-700 font-mono"
              />
            </div>

            {/* Email prefilled */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 flex items-center space-x-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>E-mail Address</span>
              </label>
              <input
                id="onboard-email-input"
                type="email"
                value={email}
                disabled
                className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-400 cursor-not-allowed font-mono"
              />
            </div>

            {/* Blood Type Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 flex items-center space-x-1">
                <Activity className="w-3.5 h-3.5 text-slate-400" />
                <span>Blood Type</span>
              </label>
              <select
                id="onboard-blood-selector"
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
              >
                {bloodGroups.map((bg) => (
                  <option key={bg} value={bg}>
                    {bg} Type
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Profile Photo input URL or prefilled */}
          <div className="space-y-2 bg-slate-50 p-4.5 rounded-2xl border border-slate-100">
            <h4 className="text-xs font-semibold text-slate-700">Safety Profile Picture URL</h4>
            <div className="flex items-center space-x-4">
              {profilePhoto ? (
                <img
                  src={profilePhoto}
                  alt="Avatar prefilled"
                  className="w-12 h-12 rounded-full object-cover border border-primary/20"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center">
                  <User className="w-6 h-6 text-slate-400" />
                </div>
              )}
              <input
                id="onboard-avatar-input"
                type="text"
                value={profilePhoto}
                onChange={(e) => setProfilePhoto(e.target.value)}
                placeholder="Paste Image URL"
                className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none text-xs font-mono"
              />
            </div>
          </div>

          {/* Emergency Medical Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 flex items-center space-x-1">
              <HeartCrack className="w-3.5 h-3.5 text-slate-400" />
              <span>Medical Conditions / Emergency Notes (Allergies, Medications)</span>
            </label>
            <textarea
              id="onboard-notes-input"
              rows={3}
              value={medicalNotes}
              onChange={(e) => setMedicalNotes(e.target.value)}
              placeholder="e.g. Asthmatic (inhaler in backpack), Penicillin allergy, taking specific daily medications."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary/40 placeholder:text-slate-400"
            />
          </div>

          {/* Active Protection Register Button */}
          <button
            id="onboarding-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full py-4 text-center text-white bg-primary hover:bg-primary-hover active:scale-99 transition-all text-sm font-semibold rounded-2xl shadow-lg shadow-primary/25 bg-gradient-to-tr from-primary to-[#FF7A59]"
          >
            {loading ? 'Activating Protective Vault...' : 'Activate NIDAR Protection Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}
