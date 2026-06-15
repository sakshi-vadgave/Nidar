/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Shield, Heart, Activity, PhoneCall, AlertCircle } from 'lucide-react';

export default function SafetyTools() {
  const emergencyNumbers = [
    {
      id: 'police',
      name: 'Police Patrol Force',
      number: '112',
      description: 'Law enforcement, dispatch coordination & active crisis situations.',
      icon: Shield,
      badgeText: '🚔 Police Dispatch',
      badgeType: 'police',
      borderClass: 'border-indigo-150/60 hover:border-indigo-400/40',
      badgeClass: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      iconClass: 'bg-indigo-50 text-indigo-650',
      buttonClass: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/10 hover:shadow-indigo-600/20 text-white',
    },
    {
      id: 'women-helpline',
      name: 'Women Help Desk',
      number: '1091',
      description: 'Immediate counseling support, physical protection & crisis advocacy.',
      icon: Heart,
      badgeText: '👩 Women Support',
      badgeType: 'women',
      borderClass: 'border-purple-150/60 hover:border-purple-400/40',
      badgeClass: 'bg-purple-50 text-purple-600 border-purple-100',
      iconClass: 'bg-purple-50 text-purple-650',
      buttonClass: 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/10 hover:shadow-purple-600/20 text-white',
    },
    {
      id: 'ambulance',
      name: 'Ambulance Systems',
      number: '108',
      description: 'Emergency trauma response, first-aid medical support & critical transit.',
      icon: Activity,
      badgeText: '🚑 Medical Care',
      badgeType: 'ambulance',
      borderClass: 'border-red-150/60 hover:border-red-400/40',
      badgeClass: 'bg-red-50 text-red-600 border-red-100',
      iconClass: 'bg-red-50 text-red-650',
      buttonClass: 'bg-red-600 hover:bg-red-700 shadow-red-600/10 hover:shadow-red-600/20 text-white',
    }
  ];

  return (
    <div id="emergency-numbers-page" className="space-y-6 pb-26 font-sans">
      
      {/* Header Info */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
        <h2 className="text-xl font-display font-black text-slate-900 flex items-center space-x-2">
          <PhoneCall className="w-5.5 h-5.5 text-[#FF5A7A]" />
          <span>Emergency Helplines</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
          Access instant one-tap voice dispatches to local tactical units and medical emergency response centers. Always verify and contact immediately when in threat environments.
        </p>
      </div>

      {/* Safety Notice Tip */}
      <div className="bg-amber-50 border border-amber-100/70 p-3.5 rounded-xl flex items-start space-x-3 text-amber-800 text-xs font-semibold">
        <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
        <p className="leading-relaxed text-amber-750">
          <strong>Direct Line Backup:</strong> Calls are routed directly via your mobile carrier network to ensure reliability even in areas with offline or highly limited internet coverage.
        </p>
      </div>

      {/* List of Emergency Cards */}
      <div className="space-y-4">
        {emergencyNumbers.map((item) => {
          const IconComponent = item.icon;
          return (
            <motion.div
              id={`helpline-card-${item.id}`}
              key={item.id}
              whileHover={{ y: -2 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className={`bg-white p-5 rounded-[24px] border ${item.borderClass} shadow-xl shadow-slate-100/40 flex flex-col md:flex-row items-stretch justify-between gap-4 transition-all`}
            >
              {/* Left Column: Icon & Info labels */}
              <div className="flex items-start space-x-4 flex-1">
                <div className={`p-3 rounded-2xl shrink-0 mt-1 shadow-sm ${item.iconClass}`}>
                  <IconComponent className="w-6 h-6" />
                </div>
                
                <div className="space-y-1.5 min-w-0">
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border tracking-wide inline-block ${item.badgeClass}`}>
                    {item.badgeText}
                  </span>
                  <h3 className="text-base font-black text-slate-900 tracking-tight leading-none pt-0.5">
                    {item.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Right Column: Numeric & Direct Speed Dial Action Button */}
              <div className="flex flex-row md:flex-col justify-between md:justify-center items-center gap-3.5 border-t md:border-t-0 border-slate-100/70 pt-3 md:pt-0 shrink-0 md:min-w-[170px]">
                {/* Visual Number Indicator */}
                <div className="text-left md:text-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-1">
                    HELPLINE DIAL
                  </span>
                  <span className="text-2xl font-mono font-black text-slate-900 tracking-tight leading-none block">
                    {item.number}
                  </span>
                </div>

                {/* Highly tap-friendly primary Phone Call button */}
                <a
                  id={`dial-button-${item.id}`}
                  href={`tel:${item.number}`}
                  className={`w-full md:w-auto px-6 py-3 rounded-xl font-extrabold text-xs tracking-wider uppercase text-center flex items-center justify-center space-x-2 transition-all active:scale-95 shadow-md ${item.buttonClass}`}
                >
                  <PhoneCall className="w-4 h-4 shrink-0" />
                  <span>Call {item.number}</span>
                </a>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Warning Notice Disclaimer */}
      <div className="text-center pt-2">
        <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase flex items-center justify-center space-x-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
          <span>Please initiate speed dials only in actual emergency situations</span>
        </p>
      </div>

    </div>
  );
}
