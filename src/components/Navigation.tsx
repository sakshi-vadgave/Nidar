/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Home, Map, Phone, HeartHandshake, User, Sparkles } from 'lucide-react';

export default function Navigation() {
  const location = useLocation();
  const currentPath = location.pathname;

  const tabs = [
    { name: 'Home', path: '/dashboard', icon: Home },
    { name: 'Emergency Map', path: '/maps', icon: Map },
    { name: 'Guardians', path: '/guardians', icon: HeartHandshake },
    { name: 'Helpline', path: '/tools', icon: Phone },
    { name: 'Fearless', path: '/fearless', icon: Sparkles },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <nav
      id="bottom-navbar"
      className="fixed bottom-4 left-4 right-4 z-40 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 flex justify-between px-1 py-1.5 sm:max-w-md sm:mx-auto"
    >
      {tabs.map((tab) => {
        const isActive = currentPath === tab.path;
        const Icon = tab.icon;

        return (
          <Link
            id={`nav-link-${tab.name.toLowerCase()}`}
            key={tab.name}
            to={tab.path}
            className="relative flex flex-col items-center flex-1 py-0.5 text-center select-none"
          >
            {/* Visual highlight pillow backdrop */}
            {isActive && (
              <div
                className="absolute inset-0 bg-primary/10 rounded-xl"
              />
            )}

            <div className={`relative flex flex-col items-center transition-colors duration-200 ${
              isActive ? 'text-primary' : 'text-slate-500 hover:text-slate-700'
            }`}>
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[9px] sm:text-[10px] font-bold tracking-tight">
                {tab.name}
              </span>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
