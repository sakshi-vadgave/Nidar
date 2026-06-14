/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Sliders,
  Bell,
  Eye,
  MapPin,
  Clock,
  ShieldAlert,
  SlidersHorizontal,
  FolderHeart,
  User,
  LogOut,
  Sliders as ConfigIcon,
  Zap
} from 'lucide-react';

export default function Settings() {
  const { settings, updateSettings, logOut } = useApp();

  return (
    <div id="settings-page" className="space-y-6 pb-26 font-sans">
      
      {/* Header Bio */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-bold text-slate-800 flex items-center space-x-2">
            <ConfigIcon className="w-5.5 h-5.5 text-primary" />
            <span>Telemetry Settings</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">Configure active protective and hardware system triggers.</p>
        </div>
      </div>

      {/* Safety triggers controls */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-800 text-sm border-b pb-2 flex items-center space-x-1.5">
          <ShieldAlert className="w-4 h-4 text-primary" />
          <span>Automatic Triggers</span>
        </h3>

        {/* Shake detection trigger */}
        <div className="flex justify-between items-center text-xs">
          <div className="space-y-0.5 text-left pr-4">
            <p className="font-semibold text-slate-700">Shake to Trigger SOS</p>
            <p className="text-[10px] text-slate-450">Triggers alert if device is violently shaken</p>
          </div>
          <button
            id="toggle-setting-shake"
            onClick={() => updateSettings({ shakeTriggerEnabled: !settings.shakeTriggerEnabled })}
            className={`w-11 h-6 rounded-full transition-all ${
              settings.shakeTriggerEnabled ? 'bg-emerald-500' : 'bg-slate-200'
            } relative flex items-center p-0.5`}
          >
            <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
              settings.shakeTriggerEnabled ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </button>
        </div>

        {/* Microphones tracking */}
        <div className="flex justify-between items-center text-xs pt-2">
          <div className="space-y-0.5 text-left pr-4">
            <p className="font-semibold text-slate-700">Voice Keyword Listening</p>
            <p className="text-[10px] text-slate-450">Active word signature ("HELP HELP") triggers</p>
          </div>
          <button
            id="toggle-setting-voice"
            onClick={() => updateSettings({ audioTriggerEnabled: !settings.audioTriggerEnabled })}
            className={`w-11 h-6 rounded-full transition-all ${
              settings.audioTriggerEnabled ? 'bg-emerald-500' : 'bg-slate-200'
            } relative flex items-center p-0.5`}
          >
            <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
              settings.audioTriggerEnabled ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </button>
        </div>
      </div>

      {/* Notifications settings */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-800 text-sm border-b pb-2 flex items-center space-x-1.5">
          <Bell className="w-4 h-4 text-indigo-500" />
          <span>Notification Envelope</span>
        </h3>

        <div className="flex justify-between items-center text-xs">
          <div className="space-y-0.5 text-left pr-4">
            <p className="font-semibold text-slate-700">Push Notifications Dispatch</p>
            <p className="text-[10px] text-slate-450">Dispatches warnings and system updates</p>
          </div>
          <button
            id="toggle-setting-notifications"
            onClick={() => updateSettings({ pushNotificationsEnabled: !settings.pushNotificationsEnabled })}
            className={`w-11 h-6 rounded-full transition-all ${
              settings.pushNotificationsEnabled ? 'bg-emerald-500' : 'bg-slate-200'
            } relative flex items-center p-0.5`}
          >
            <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
              settings.pushNotificationsEnabled ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </button>
        </div>
      </div>

      {/* Emergency configuration settings */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-800 text-sm border-b pb-2 flex items-center space-x-1.5">
          <Zap className="w-4 h-4 text-rose-500" />
          <span>SOS Dispatch Policy</span>
        </h3>

        <div className="p-4 bg-rose-50/60 rounded-xl border border-rose-100 flex items-start space-x-3 text-left">
          <div className="p-2 bg-rose-100 text-[#FF5A7A] rounded-xl shrink-0">
            <Zap className="w-4 h-4 animate-pulse" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-black text-rose-700 uppercase tracking-wide">
              Zero-Delay Mode Active
            </p>
            <p className="text-[11px] text-slate-650 leading-relaxed font-semibold">
              Emergency SOS alerts dispatch immediately when requested. There is absolutely no countdown delay or buffering period. Live telemetry feeds lock instantly.
            </p>
          </div>
        </div>
      </div>

      {/* Connection profile log outs */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-800 text-sm border-b pb-2 flex items-center space-x-1.5">
          <User className="w-4 h-4 text-slate-500" />
          <span>Security Administration</span>
        </h3>

        <button
          id="settings-logout-btn"
          onClick={logOut}
          className="w-full py-3 text-center text-red-600 hover:bg-slate-50 border bg-white border-red-150 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2"
        >
          <LogOut className="w-4 h-4" />
          <span>DISCONNECT SECURE SESSION</span>
        </button>
      </div>

    </div>
  );
}
