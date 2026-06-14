/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, ShieldAlert } from 'lucide-react';

export default function EmergencyAlarm() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const osc2Ref = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const lfoRef = useRef<OscillatorNode | null>(null);

  const startSiren = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();

      // Configure frequencies
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600, ctx.currentTime);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(605, ctx.currentTime);

      // Low Frequency Oscillator (LFO) to modulate siren warble
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(2.5, ctx.currentTime); // 2.5 cycles per second
      lfoGain.gain.setValueAtTime(150, ctx.currentTime); // sweep range

      // Connections
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfoGain.connect(osc2.frequency);

      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + 0.1);

      // Start sound
      lfo.start();
      osc.start();
      osc2.start();

      lfoRef.current = lfo;
      oscRef.current = osc;
      osc2Ref.current = osc2;
      gainRef.current = gain;
      setIsPlaying(true);
    } catch (e) {
      console.warn('Web Audio SIREN cannot initialize:', e);
    }
  };

  const stopSiren = () => {
    if (gainRef.current && audioCtxRef.current) {
      try {
        gainRef.current.gain.cancelScheduledValues(audioCtxRef.current.currentTime);
        gainRef.current.gain.setValueAtTime(gainRef.current.gain.value, audioCtxRef.current.currentTime);
        gainRef.current.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + 0.1);
        
        setTimeout(() => {
          lfoRef.current?.stop();
          oscRef.current?.stop();
          osc2Ref.current?.stop();
          audioCtxRef.current?.close();
          lfoRef.current = null;
          oscRef.current = null;
          osc2Ref.current = null;
          gainRef.current = null;
          audioCtxRef.current = null;
        }, 120);
      } catch (err) {
        console.error(err);
      }
    }
    setIsPlaying(false);
  };

  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        try {
          audioCtxRef.current.close();
        } catch (_) {}
      }
    };
  }, []);

  const handleToggle = () => {
    if (isPlaying) {
      stopSiren();
    } else {
      startSiren();
    }
  };

  return (
    <button
      id="emergency-siren-toggle"
      onClick={handleToggle}
      className={`relative py-4 px-6 rounded-2xl flex items-center justify-between transition-all duration-300 font-sans ${
        isPlaying
          ? 'bg-red-500 text-white shadow-xl shadow-red-500/20 ring-2 ring-red-400 animate-pulse'
          : 'bg-white text-slate-800 border border-slate-200 hover:border-red-200 shadow-sm'
      }`}
    >
      <div className="flex items-center space-x-3">
        <div className={`p-2.5 rounded-lg ${isPlaying ? 'bg-white/20' : 'bg-red-50 text-red-500'}`}>
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div className="text-left">
          <p className="font-semibold text-sm tracking-tight">Emergency Siren</p>
          <p className={`text-xs ${isPlaying ? 'text-red-100' : 'text-slate-500'}`}>
            {isPlaying ? 'Alarming Loud siren' : 'High volume deterrent'}
          </p>
        </div>
      </div>
      {isPlaying ? (
        <Volume2 className="w-5 h-5 text-white animate-bounce" />
      ) : (
        <VolumeX className="w-5 h-5 text-slate-400" />
      )}
    </button>
  );
}
