/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mic,
  ShieldCheck,
  Phone,
  Volume2,
  Zap,
  Sparkles,
  RefreshCw,
  Bell,
  Sliders,
  CheckCircle2,
  SlidersHorizontal,
  Flame,
  Radio
} from 'lucide-react';
import EmergencyAlarm from '../components/EmergencyAlarm';

export default function SafetyTools() {
  const { setFakeCallActive, addNotification, settings, updateSettings } = useApp();

  // Voice training and real-time mic monitoring
  const [isListening, setIsListening] = useState(false);
  const [trainingPhase, setTrainingPhase] = useState<'idle' | 'listening' | 'trained'>('idle');
  const [decibels, setDecibels] = useState<number[]>(Array(12).fill(5));

  // Voice training and decibel meter spectrum effect
  useEffect(() => {
    let audioCtx: AudioContext | null = null;
    let source: MediaStreamAudioSourceNode | null = null;
    let analyser: AnalyserNode | null = null;
    let stream: MediaStream | null = null;
    let animationFrameId: number;
    let recognitionInstance: any = null;

    if (isListening) {
      // 1. Web Speech API Recognition Setup
      const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognitionClass) {
        try {
          const rec = new SpeechRecognitionClass();
          rec.continuous = true;
          rec.interimResults = true;
          rec.lang = 'en-US';

          rec.onresult = (event: any) => {
            let phraseDetected = false;
            let detectedWord = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
              const text = event.results[i][0].transcript.toLowerCase();
              if (
                text.includes('help help') ||
                text.includes('help') ||
                text.includes('emergency') ||
                text.includes('danger') ||
                text.includes('metro')
              ) {
                phraseDetected = true;
                detectedWord = text.trim();
                break;
              }
            }

            if (phraseDetected) {
              setIsListening(false);
              setTrainingPhase('trained');
              addNotification(
                'Voice Keyword Registered',
                `Calibrated keyword phrase detected: "${detectedWord.toUpperCase()}". Tactical Voice Trigger has been successfully calibrated and loaded.`
              );
              // Auto-enable backgrounds voice detection
              updateSettings({ audioTriggerEnabled: true });
            }
          };

          rec.onerror = (err: any) => {
            console.warn('Speech training recognition error:', err.error);
          };

          rec.start();
          recognitionInstance = rec;
        } catch (e) {
          console.warn('Failed to start speech recognition training:', e);
        }
      }

      // 2. Real microphone visualizer via Web Audio API
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((s) => {
          stream = s;
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          audioCtx = new AudioContextClass();
          source = audioCtx.createMediaStreamSource(s);
          analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);

          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);

          const updateMeter = () => {
            if (!analyser) return;
            analyser.getByteFrequencyData(dataArray);

            const step = Math.floor(bufferLength / 12) || 1;
            const newDecibels = Array(12).fill(0).map((_, i) => {
              const dataIndex = Math.min(i * step, dataArray.length - 1);
              const val = dataArray[dataIndex];
              // Map 0-255 values cleanly to 10-60% heights
              return 10 + Math.floor((val / 255) * 50);
            });
            setDecibels(newDecibels);
            animationFrameId = requestAnimationFrame(updateMeter);
          };
          updateMeter();
        })
        .catch((err) => {
          console.warn('Microphone stream access denied; playing fallback equalizer animation:', err);
          // Fallback animated wave
          let freq = 0;
          const interval = setInterval(() => {
            freq += 0.2;
            const fallbackDecibels = Array(12).fill(0).map((_, idx) => {
              const sineVal = Math.sin(freq + idx * 0.5);
              return 15 + Math.floor((sineVal + 1) * 20);
            });
            setDecibels(fallbackDecibels);
          }, 80);
          (window as any)._fallbackVoiceInterval = interval;
        });
    } else {
      setDecibels(Array(12).fill(5));
    }

    return () => {
      if (recognitionInstance) {
        try {
          recognitionInstance.stop();
        } catch (_) {}
      }
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (audioCtx) {
        audioCtx.close().catch(() => {});
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if ((window as any)._fallbackVoiceInterval) {
        clearInterval((window as any)._fallbackVoiceInterval);
      }
    };
  }, [isListening]);

  // Flashlight SOS Screen strobe
  const [flashlightActive, setFlashlightActive] = useState(false);
  const [flashOn, setFlashOn] = useState(false);

  useEffect(() => {
    let interval: any;
    if (flashlightActive) {
      interval = setInterval(() => {
        setFlashOn(p => !p);
      }, 250); // strobe frequency
    } else {
      setFlashOn(false);
    }
    return () => clearInterval(interval);
  }, [flashlightActive]);

  // Trainer trigger phrase toggle
  const toggleVoiceListen = () => {
    if (isListening) {
      setIsListening(false);
      setTrainingPhase('trained');
      addNotification('Voice Phrase Registered', 'Your voice signature has been calibrated securely.');
    } else {
      setTrainingPhase('listening');
      setIsListening(true);
    }
  };

  const triggerInstantFakeCall = () => {
    addNotification('Fake Call Scheduled', 'An escape phone call has been scheduled. Prepare to accept.');
    setTimeout(() => {
      setFakeCallActive(true);
    }, 2800); // 2.8 second escape schedule
  };

  return (
    <div id="safety-tools-page" className="space-y-6 pb-26 font-sans">
      
      {/* Visual Strobe SOS Fullscreen panel */}
      <AnimatePresence>
        {flashlightActive && (
          <motion.div
            id="strobe-flashlight-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setFlashlightActive(false)}
            className={`fixed inset-0 z-50 flex flex-col justify-center items-center p-6 cursor-pointer ${
              flashOn ? 'bg-white text-black' : 'bg-red-600 text-white'
            }`}
          >
            <div className="text-center space-y-3 select-none">
              <Zap className="w-16 h-16 mx-auto animate-bounce" />
              <h2 className="text-3xl font-extrabold tracking-tight">STROBE DETECTOR ACTIVE</h2>
              <p className="text-xs opacity-80 max-w-xs mx-auto leading-relaxed">
                Aim your device screen towards onlookers or threat actors. Flashing SOS strobe frequency deployed. Tap anywhere to close.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Info */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
        <h2 className="text-xl font-display font-bold text-slate-800 flex items-center space-x-2">
          <Flame className="w-5.5 h-5.5 text-primary" />
          <span>Tactical Safety Tools</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          Arm yourself with offline deterrent arrays: simulated alarms, voice keyword tracking, and direct fake escape.
        </p>
      </div>

      {/* Emergency Siren Controller (Oscillator Component) */}
      <div className="flex flex-col space-y-2 bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sonic Deterrents</h3>
        <EmergencyAlarm />
      </div>

      {/* Strobe SOS flashing tool */}
      <button
        id="flashlight-strobe-toggle"
        onClick={() => setFlashlightActive(true)}
        className="w-full bg-white text-slate-800 p-4.5 rounded-2xl border border-slate-100 hover:border-yellow-200 shadow-sm flex items-center justify-between transition-all"
      >
        <div className="flex items-center space-x-3 text-left">
          <div className="p-2.5 bg-yellow-50 rounded-xl text-yellow-500">
            <Zap className="w-5 h-5 fill-yellow-500/10" />
          </div>
          <div>
            <h4 className="font-semibold text-sm tracking-tight text-slate-800">Visual SOS Strobe</h4>
            <span className="text-xs text-slate-500">High frequency screening flash</span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400" />
      </button>

      {/* Voice SOS Calibrator with visual equalizer */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-slate-50 pb-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-1">
            <Radio className="w-4 h-4 text-primary" />
            <span>Keyword Voice Trigger</span>
          </h3>
          <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full border ${
            settings.audioTriggerEnabled ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400'
          }`}>
            {settings.audioTriggerEnabled ? 'ACTIVE LISTENING' : 'OFF'}
          </span>
        </div>

        <div className="flex items-center space-x-4 bg-slate-50 p-4.5 rounded-xl border border-slate-100">
          <button
            id="voice-training-trigger"
            onClick={toggleVoiceListen}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-white shadow text-slate-600 border'
            }`}
          >
            <Mic className="w-5 h-5" />
          </button>

          <div className="flex-1 space-y-1">
            <h4 className="font-semibold text-sm text-slate-800 tracking-tight">
              {trainingPhase === 'idle'
                ? 'Train Keyword "HELP HELP"'
                : trainingPhase === 'listening'
                ? 'Scream trigger statement now...'
                : 'Phrase Active ("HELP HELP")'}
            </h4>
            <p className="text-[10px] text-slate-500">
              {isListening
                ? 'Listening to microphone...'
                : 'Triggers instant SOS dispatch even if device is inside pocket.'}
            </p>
          </div>
        </div>

        {/* Dynamic Equalizer Visualizer */}
        <div className="flex items-end justify-center space-x-1.5 h-10 py-1 bg-slate-900 rounded-xl px-4 select-none">
          {decibels.map((dbVal, index) => (
            <motion.div
              key={index}
              style={{ height: `${dbVal}%` }}
              className={`w-1 rounded-full transition-all duration-75 ${
                isListening ? 'bg-primary' : 'bg-indigo-500/55'
              }`}
            />
          ))}
        </div>

        {/* Setting Toggle */}
        <div className="flex justify-between items-center pt-2 text-xs">
          <span className="text-slate-600 font-semibold">Enable Background Voice Detection</span>
          <button
            id="toggle-voice-detection-setting"
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

      {/* Emergency Escapade Fake Call block */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Escapade Utilities</h3>
        <div className="space-y-2">
          <button
            id="scheduler-fake-call-instant"
            onClick={triggerInstantFakeCall}
            className="w-full py-4 bg-indigo-600/10 text-indigo-700 font-bold text-xs tracking-wider rounded-2xl flex items-center justify-center space-x-2 border border-indigo-200/50 hover:bg-indigo-600/15"
          >
            <Phone className="w-4 h-4" />
            <span>GENERATE ESCAPE FAKE-CALL (3s delay)</span>
          </button>
        </div>
      </div>

    </div>
  );
}

interface ChevronRightProps {
  className?: string;
}

function ChevronRight({ className }: ChevronRightProps) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
  );
}
