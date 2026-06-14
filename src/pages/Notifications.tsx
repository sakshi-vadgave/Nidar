/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../context/AppContext';
import { Bell, Trash2, CheckSquare, ChevronLeft, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Notifications() {
  const { notifications, markNotificationRead, clearNotifications } = useApp();
  const navigate = useNavigate();

  const handleMarkAllRead = () => {
    notifications.forEach((n) => {
      if (n.status === 'unread') {
        markNotificationRead(n.id);
      }
    });
  };

  return (
    <div id="notifications-page" className="space-y-6 pb-26 font-sans">
      
      {/* Header card with action items */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-display font-bold text-slate-800 flex items-center space-x-2">
            <Bell className="w-5.5 h-5.5 text-primary" />
            <span>Telemetry Inbox</span>
          </h2>
          <span className="text-[10px] bg-indigo-50 text-indigo-600 border border-indigo-150 font-bold px-2.5 py-0.5 rounded-full uppercase">
            {notifications.filter(n => n.status === 'unread').length} New
          </span>
        </div>

        {notifications.length > 0 && (
          <div className="flex space-x-3 text-xs border-t border-slate-50 pt-3">
            <button
              id="notif-mark-all-read"
              onClick={handleMarkAllRead}
              className="font-bold text-slate-600 hover:text-indigo-600 flex items-center space-x-1 hover:underline"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
            <span className="text-slate-200">|</span>
            <button
              id="notif-clear-all"
              onClick={clearNotifications}
              className="font-bold text-slate-400 hover:text-red-500 flex items-center space-x-1 hover:underline"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear inbox</span>
            </button>
          </div>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto border border-slate-100">
            <Shield className="w-6 h-6 text-slate-400/80" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Inbox is empty</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mt-0.5 leading-relaxed">
              No recent network warning dispatches or safety check-ins logged. Your telemetry signal is clean.
            </p>
          </div>
        </div>
      ) : (
        /* Settle feed logs with clean visual dividers */
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              id={`notification-item-${n.id}`}
              key={n.id}
              onClick={() => n.status === 'unread' && markNotificationRead(n.id)}
              className={`p-4 bg-white rounded-2xl border transition-all cursor-pointer flex justify-between items-start ${
                n.status === 'unread'
                  ? 'border-indigo-150 shadow-sm relative overflow-hidden ring-1 ring-indigo-50/50'
                  : 'border-slate-100 hover:border-slate-200'
              }`}
            >
              {/* Unread dot highlight pillow */}
              {n.status === 'unread' && (
                <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />
              )}
              
              <div className="space-y-1 pr-4">
                <h4 className={`text-sm text-slate-800 tracking-tight ${n.status === 'unread' ? 'font-bold' : 'font-semibold'}`}>
                  {n.title}
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed pr-2">{n.body}</p>
                <span className="text-[9px] text-slate-400 font-mono block pt-1">
                  {new Date(n.timestamp).toLocaleTimeString()}
                </span>
              </div>

              {n.status === 'unread' && (
                <span className="w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-indigo-100 inline-block mt-1.5" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
