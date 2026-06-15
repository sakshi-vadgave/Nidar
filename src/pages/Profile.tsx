/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import {
  User,
  Phone,
  Mail,
  Activity,
  Calendar,
  Heart,
  Users,
  LogOut,
  Edit3,
  CheckCircle2,
  Lock,
  HeartCrack,
  Camera,
  Database
} from 'lucide-react';

export default function Profile() {
  const { profile, guardians, contacts, logOut, updateProfileData } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(profile?.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState(profile?.phoneNumber || '');
  const [bloodGroup, setBloodGroup] = useState(profile?.bloodGroup || 'O+');
  const [medicalNotes, setMedicalNotes] = useState(profile?.medicalNotes || '');
  const [profilePhoto, setProfilePhoto] = useState(profile?.profilePhoto || '');

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfileData({
      fullName,
      phoneNumber,
      bloodGroup,
      medicalNotes,
      profilePhoto,
    });
    setIsEditing(false);
  };

  return (
    <div id="profile-view-page" className="space-y-6 pb-26 font-sans">
      
      {/* Profile Bio Details layout */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative overflow-hidden flex flex-col justify-between items-center text-center">
        
        {/* Profile Picture */}
        <div className="relative">
          {profile?.profilePhoto ? (
            <img
              src={profile.profilePhoto}
              alt={profile.fullName}
              className="w-20 h-20 rounded-full object-cover border-2 border-primary/25 shadow-md"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-3xl shadow-sm border border-primary/15">
              {profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : 'N'}
            </div>
          )}
          {isEditing && (
            <div className="absolute bottom-0 right-0 p-1.5 bg-indigo-600 rounded-full text-white border-2 border-white shadow">
              <Camera className="w-3.5 h-3.5" />
            </div>
          )}
        </div>

        <div className="space-y-1.5 mt-4">
          <h2 className="text-xl font-display font-bold text-slate-800">
            {profile?.fullName || 'Resident Profile'}
          </h2>
          <p className="text-xs text-slate-500 font-mono flex items-center justify-center space-x-1.5">
            <Mail className="w-3 h-3 text-slate-400" />
            <span>{profile?.email}</span>
          </p>
          <div className="flex justify-center space-x-2 pt-1">
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {profile?.bloodGroup || 'O+'} Type
            </span>
            <span className="text-[10px] font-semibold text-slate-500 bg-slate-50 border border-slate-150 px-2.5 py-0.5 rounded-full uppercase">
              Core Verified
            </span>
          </div>
        </div>

        {!isEditing && (
          <button
            id="profile-toggle-edit"
            onClick={() => setIsEditing(true)}
            className="absolute top-4 right-4 p-2 bg-slate-50 border rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Editing Panel vs Static panel display switching */}
      {isEditing ? (
        <form onSubmit={handleSave} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="font-bold text-slate-800 text-sm">Edit Credentials</h3>
            <button
              onClick={() => setIsEditing(false)}
              className="text-xs text-slate-400 font-semibold hover:underline"
            >
              Cancel
            </button>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 block">Full Name</label>
              <input
                id="edit-profile-name"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 block">Phone Number</label>
              <input
                id="edit-profile-phone"
                type="tel"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none text-slate-700 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 block">Avatar Photo URL</label>
              <input
                id="edit-profile-avatar"
                type="text"
                value={profilePhoto}
                onChange={(e) => setProfilePhoto(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 block">Blood Group</label>
              <select
                id="edit-profile-blood"
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
              >
                {bloodGroups.map((bg) => (
                  <option key={bg} value={bg}>
                    {bg} Type
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 block">Medical Conditions</label>
              <textarea
                id="edit-profile-notes"
                rows={3}
                value={medicalNotes}
                onChange={(e) => setMedicalNotes(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
              />
            </div>

            <button
              id="profile-save-btn"
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs tracking-wider rounded-xl shadow-md"
            >
              COMMIT PROFILE MODIFICATIONS
            </button>
          </div>
        </form>
      ) : (
        /* Static credentials listings */
        <div className="space-y-4">
          
          {/* Bento grid safety metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-xl text-primary">
                <Users className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-[10px] text-slate-400 font-bold uppercase">CONNECTS</p>
                <p className="text-sm font-extrabold text-slate-800">{guardians.length} Guardians</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-3">
              <div className="p-2 bg-indigo-50 rounded-xl text-indigo-500">
                <Heart className="w-5 h-5 fill-indigo-500/10" />
              </div>
              <div className="text-left">
                <p className="text-[10px] text-slate-400 font-bold uppercase">DIAL KEYS</p>
                <p className="text-sm font-extrabold text-slate-800">{contacts.length} Shortcuts</p>
              </div>
            </div>
          </div>

          {/* Secure Bio Credentials and records panel */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm border-b border-slate-50 pb-2">Medical Metadata</h3>
            
            <div className="flex items-start space-x-3.5 text-xs">
              <div className="p-2 bg-red-50 rounded-xl text-red-500">
                <HeartCrack className="w-4.5 h-4.5" />
              </div>
              <div className="text-left space-y-1">
                <p className="font-semibold text-slate-600">Urgent Allergy / Condition Records</p>
                <p className="text-slate-500 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100 italic">
                  {profile?.medicalNotes || 'No urgent medical notes registered.'}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3.5 text-xs pt-2">
              <div className="p-2 bg-slate-50 rounded-xl text-slate-400">
                <Calendar className="w-4.5 h-4.5" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-slate-600">Onboarding Activation Date</p>
                <p className="text-slate-400 font-mono mt-0.5">
                  {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Secure Evidence Vault Fast Shortcut Link */}
          <Link
            id="profile-evidence-vault-link"
            to="/evidence"
            className="w-full py-4 text-center text-slate-700 hover:bg-slate-50 border border-slate-200/60 bg-white rounded-2xl font-bold text-xs tracking-wider flex items-center justify-center space-x-2 shadow-sm transition-colors cursor-pointer"
          >
            <Database className="w-4 h-4 text-indigo-500" />
            <span>OPEN ENCRYPTED EVIDENCE VAULT</span>
          </Link>

          {/* Active Log Out */}
          <button
            id="profile-logout-btn"
            onClick={logOut}
            className="w-full py-4 text-center text-red-600 hover:bg-slate-100 border border-slate-200/60 bg-white rounded-2xl font-bold text-xs tracking-wider flex items-center justify-center space-x-2 shadow-sm transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>DISCONNECT SECURE SESSION</span>
          </button>
        </div>
      )}
    </div>
  );
}
