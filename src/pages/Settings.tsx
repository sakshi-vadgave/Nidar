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
  Sliders as ConfigIcon
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
          <Clock className="w-4 h-4 text-amber-500" />
          <span>Emergency Countdowns</span>
        </h3>

        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-700">SOS Delay buffer</span>
            <span className="font-mono font-bold text-slate-500 bg-slate-50 border p-1 rounded">
              {settings.emergencySOSCountdown} seconds
            </span>
          </div>

          {/* Range Slider for countdown */}
          <input
            id="settings-sos-countdown-range"
            type="range"
            min={3}
            max={15}
            value={settings.emergencySOSCountdown}
            onChange={(e) => updateSettings({ emergencySOSCountdown: Number(e.target.value) })}
            className="w-full accent-primary h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-medium">
            <span>Fast (3s)</span>
            <span>Buffered (15s)</span>
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
