/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Shield, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Splash() {
  const { user, loading, needsOnboarding } = useApp();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);

  // loading simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress === 100) {
          clearInterval(timer);
          return 100;
        }
        const diff = Math.random() * 25;
        return Math.min(oldProgress + diff, 100);
      });
    }, 180);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (progress === 100 && !loading) {
      if (!user) {
        navigate('/login');
      } else if (needsOnboarding) {
        navigate('/onboarding');
      } else {
        navigate('/dashboard');
      }
    }
  }, [progress, loading, user, needsOnboarding, navigate]);

  return (
    <div className="fixed inset-0 bg-[#F8FAFC] flex flex-col items-center justify-between p-8 font-sans">
      <div className="flex-1 flex flex-col items-center justify-center space-y-6">
        {/* Animated Main Logo Shield */}
        <motion.div
          animate={{
            scale: [1, 1.06, 1],
            boxShadow: [
              '0 10px 15px -3px rgba(255, 90, 122, 0.1)',
              '0 20px 25px -5px rgba(255, 90, 122, 0.25)',
              '0 10px 15px -3px rgba(255, 90, 122, 0.1)'
            ]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-primary to-[#FF7A59] flex items-center justify-center border border-white/40 shadow-xl"
        >
          <Shield className="w-12 h-12 text-white fill-white/20" />
        </motion.div>

        {/* Brand Information */}
        <div className="text-center space-y-2">
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="font-display font-bold text-4xl tracking-tight text-slate-800"
          >
            NIDAR <span className="text-primary font-medium font-sans">Safety</span>
          </motion.h1>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex items-center justify-center space-x-1.5 text-slate-500 font-medium text-xs tracking-wider uppercase"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>Never Alone • Safety Enforced</span>
          </motion.div>
        </div>
      </div>

      {/* Progress metrics and copyright footer */}
      <div className="w-full max-w-xs space-y-6 mb-8 text-center">
        <div className="space-y-2">
          <div className="w-full bg-slate-200/50 rounded-full h-1.5 overflow-hidden p-[1px] border border-slate-100">
            <motion.div
              className="bg-gradient-to-r from-primary to-indigo-500 h-full rounded-full"
              style={{ width: `${progress}%` }}
              transition={{ ease: "easeOut" }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
            <span>SECURE BOOT</span>
            <span className="font-bold text-primary">{Math.round(progress)}%</span>
          </div>
        </div>
        
        <p className="text-[10px] text-slate-400 font-medium">
          NIDAR Safety Core v1.4.0 • Zero Trust System
        </p>
      </div>
    </div>
  );
}
