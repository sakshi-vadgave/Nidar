/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Bell, Shield, Battery, Signal, Wifi, Settings } from 'lucide-react';

export default function Header() {
  const { profile, notifications, isOffline, batteryStatus, networkType } = useApp();
  const navigate = useNavigate();

  const unreadCount = notifications.filter(n => n.status === 'unread').length;

  const handleAvatarClick = () => {
    navigate('/profile');
  };

  return (
    <header
      id="app-header"
      className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-100 px-5 py-4 flex items-center justify-between"
    >
      {/* Brand Logo & Welcome */}
      <div className="flex items-center space-x-3.5">
        {profile?.profilePhoto ? (
          <img
            id="profile-header-avatar"
            src={profile.profilePhoto}
            alt={profile.fullName}
            referrerPolicy="no-referrer"
            onClick={handleAvatarClick}
            className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-md hover:scale-105 active:scale-95 transition-transform cursor-pointer"
          />
        ) : (
          <div
            id="profile-header-avatar-placeholder"
            onClick={handleAvatarClick}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF5A7A] to-[#FF7A59] text-white flex items-center justify-center font-bold text-sm tracking-wide cursor-pointer hover:scale-105 active:scale-95 transition-transform border border-white shadow-md"
          >
            {profile?.fullName ? profile.fullName.split(' ')[0].substring(0, 2).toUpperCase() : 'JD'}
          </div>
        )}
        <div>
          <div className="flex items-center space-x-1">
            <span className="font-display font-extrabold text-[#0F172A] text-lg tracking-tight leading-none">
              NIDAR <span className="text-[#FF5A7A]">Safety</span>
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase mt-0.5">Secure Shield</p>
        </div>
      </div>

      {/* Dynamic Hardware/Status Indicators Grid */}
      <div className="flex items-center space-x-2.5">
        {/* Device Health Metrics Panel with beautiful design */}
        <div className="flex items-center space-x-2.5 bg-white border border-slate-200 rounded-full px-3 py-1.5 shadow-sm text-slate-700 text-[11px] font-semibold">
          {/* Connection Status Indicator */}
          <div className="flex items-center space-x-1.5">
            {isOffline ? (
              <>
                <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-amber-600 font-bold">Offline</span>
              </>
            ) : (
              <>
                <span className="flex h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-slate-700">{networkType === 'wifi' ? 'WiFi' : 'Cellular'}</span>
              </>
            )}
          </div>

          <span className="w-[1px] h-3 bg-slate-200" />

          {/* Battery level status */}
          <div className="flex items-center space-x-1">
            <Battery className={`w-3.5 h-3.5 ${batteryStatus <= 20 ? 'text-red-500 animate-pulse' : 'text-slate-500'}`} />
            <span className={batteryStatus <= 20 ? 'text-red-500 font-extrabold' : 'text-slate-600'}>{batteryStatus}%</span>
          </div>
        </div>

        {/* Notifications and Settings Icons */}
        <div className="flex items-center space-x-1.5">
          <Link
            id="header-notification-bell"
            to="/notifications"
            className="relative p-2 text-slate-600 hover:text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 rounded-full shadow-sm transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#FF5A7A] rounded-full ring-1 ring-white animate-pulse" />
            )}
          </Link>
          
          <Link
            id="header-settings-cog"
            to="/settings"
            className="p-2 text-slate-600 hover:text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 rounded-full shadow-sm transition-colors"
          >
            <Settings className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
