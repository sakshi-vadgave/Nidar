/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, PhoneOff, Mic, Volume2, Grid, Plus } from 'lucide-react';

interface FakeCallProps {
  isOpen: boolean;
  onClose: () => void;
  callerName: string;
  callerNumber: string;
}

export default function FakeCallOverlay({ isOpen, onClose, callerName, callerNumber }: FakeCallProps) {
  const [callState, setCallState] = useState<'ringing' | 'connected' | 'ended'>('ringing');
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setCallState('ringing');
      setCallDuration(0);
      return;
    }

    // Audio synthesis ring sound
    let audioCtx: AudioContext | null = null;
    let ringInterval: any;

    if (callState === 'ringing') {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioCtx = new AudioContextClass();
        const playRing = () => {
          if (!audioCtx) return;
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.frequency.setValueAtTime(440, audioCtx.currentTime); // Standard UK double ring or US tone
          gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
          osc.start();
          osc.stop(audioCtx.currentTime + 1.2);
        };

        playRing();
        ringInterval = setInterval(playRing, 3000);
      } catch (e) {
        console.warn('Audio synthesis not permitted or supported:', e);
      }
    }

    return () => {
      if (ringInterval) clearInterval(ringInterval);
      if (audioCtx) {
        audioCtx.close().catch(() => {});
      }
    };
  }, [isOpen, callState]);

  // Duration Timer
  useEffect(() => {
    let timer: any;
    if (callState === 'connected') {
      timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [callState]);

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const handleAnswer = () => {
    setCallState('connected');
  };

  const handleDecline = () => {
    setCallState('ended');
    setTimeout(() => {
      onClose();
    }, 800);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        id="fake-call-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex flex-col justify-between bg-[#111827] text-white p-8 font-sans"
      >
        {/* Call Info Header */}
        <div className="flex flex-col items-center mt-12 space-y-2">
          <p className="text-sm font-light text-slate-400 tracking-widest text-center">SIMULATED INCOMING CALL</p>
          <h2 className="text-3xl font-semibold tracking-tight">{callerName}</h2>
          <p className="text-slate-400 font-mono text-sm">{callerNumber}</p>
          <div className="mt-4">
            {callState === 'ringing' ? (
              <span className="text-xs bg-indigo-600/50 text-indigo-200 border border-indigo-400/30 font-medium px-3 py-1 rounded-full animate-pulse">
                Ringing...
              </span>
            ) : callState === 'connected' ? (
              <span className="text-xs bg-emerald-600/50 text-emerald-100 border border-emerald-400/30 px-3 py-1 rounded-full font-mono">
                Connected {formatDuration(callDuration)}
              </span>
            ) : (
              <span className="text-xs bg-red-600/50 text-red-200 px-3 py-1 rounded-full">
                Call Ended
              </span>
            )}
          </div>
        </div>

        {/* Dynamic Connected screen console panel */}
        {callState === 'connected' ? (
          <div className="grid grid-cols-3 gap-8 justify-items-center max-w-xs mx-auto my-auto py-12">
            <button className="flex flex-col items-center space-y-2 hover:opacity-80">
              <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                <Mic className="w-6 h-6 text-slate-300" />
              </div>
              <span className="text-xs text-slate-400">Mute</span>
            </button>
            <button className="flex flex-col items-center space-y-2 hover:opacity-80">
              <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                <Grid className="w-6 h-6 text-slate-300" />
              </div>
              <span className="text-xs text-slate-400">Keypad</span>
            </button>
            <button className="flex flex-col items-center space-y-2 hover:opacity-80">
              <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                <Volume2 className="w-6 h-6 text-slate-300" />
              </div>
              <span className="text-xs text-slate-400">Speaker</span>
            </button>
            <button className="flex flex-col items-center space-y-2 hover:opacity-80">
              <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                <Plus className="w-6 h-6 text-slate-300" />
              </div>
              <span className="text-xs text-slate-400">Add Call</span>
            </button>
            <button className="flex flex-col items-center space-y-2 hover:opacity-80">
              <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                <Phone className="w-6 h-6 rotate-135 text-indigo-400" />
              </div>
              <span className="text-xs text-slate-400">FaceTime</span>
            </button>
            <button className="flex flex-col items-center space-y-2 hover:opacity-80">
              <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                <Grid className="w-6 h-6 text-slate-300" />
              </div>
              <span className="text-xs text-slate-400">Contacts</span>
            </button>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            {/* Ambient shadow avatar backdrop */}
            <div className="relative w-36 h-36 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-2xl">
              <Phone className="w-12 h-12 text-indigo-400/80 animate-bounce" />
              <div className="absolute inset-0 rounded-full border border-indigo-400/20 scale-125 animate-ping opacity-30" />
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex justify-around items-center mb-16 max-w-sm mx-auto w-full">
          {callState === 'ringing' ? (
            <>
              {/* Decline Call Button */}
              <button
                id="fake-call-decline-btn"
                onClick={handleDecline}
                className="flex flex-col items-center space-y-2 active:scale-95 transition-transform"
              >
                <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center shadow-lg shadow-red-900/30 border border-red-500">
                  <PhoneOff className="w-7 h-7 text-white" />
                </div>
                <span className="text-sm font-medium text-slate-300">Decline</span>
              </button>

              {/* Accept Call Button */}
              <button
                id="fake-call-accept-btn"
                onClick={handleAnswer}
                className="flex flex-col items-center space-y-2 active:scale-95 transition-transform animate-bounce"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-900/30 border border-emerald-400">
                  <Phone className="w-7 h-7 text-white" />
                </div>
                <span className="text-sm font-medium text-emerald-200">Answer</span>
              </button>
            </>
          ) : (
            /* Solo End Call button */
            <button
              id="fake-call-disconnect-btn"
              onClick={handleDecline}
              className="flex flex-col items-center space-y-2 active:scale-95 transition-transform"
            >
              <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center shadow-xl shadow-red-900/40 border border-red-500 animate-pulse">
                <PhoneOff className="w-7 h-7 text-white" />
              </div>
              <span className="text-sm font-semibold text-red-400 tracking-wider">END CALL</span>
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
