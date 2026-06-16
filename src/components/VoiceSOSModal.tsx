/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, X, AlertTriangle, Play, HelpCircle, ShieldAlert, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface VoiceSOSModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VoiceSOSModal({ isOpen, onClose }: VoiceSOSModalProps) {
  const { triggerSOS, activeSOS } = useApp();
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [recognitionError, setRecognitionError] = useState<string | null>(null);
  const [matchedKeyword, setMatchedKeyword] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const countdownIntervalRef = useRef<any>(null);
  const autoRestartRef = useRef<boolean>(true);

  // Clear countdown timer helper
  const clearCountdown = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setCountdown(null);
    setMatchedKeyword(null);
  };

  // Safe method to abort countdown and reset
  const handleAbort = () => {
    clearCountdown();
    setLiveTranscript('');
    // Resume listening if active
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        // already started or ignored
      }
    }
  };

  // Sound generator for countdown beep to provide audit-friendly alerts
  const playBeepTone = (freq: number, duration: number) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (_) {
      // Audio context block ignored
    }
  };

  // Initialize Speech Recognition locally in modal context
  useEffect(() => {
    if (!isOpen) {
      setIsListening(false);
      setLiveTranscript('');
      setRecognitionError(null);
      clearCountdown();
      return;
    }

    // Reset transcription state
    setLiveTranscript('Ready to listen. Say "Help" or "Emergency"');
    setRecognitionError(null);
    clearCountdown();
    autoRestartRef.current = true;

    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      setRecognitionError('Speech Recognition API is not supported in this browser. Please use Chrome, Safari, or Edge.');
      return;
    }

    try {
      const rec = new SpeechRecognitionClass();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
        setRecognitionError(null);
      };

      rec.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPiece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptPiece;
          } else {
            interimTranscript += transcriptPiece;
          }
        }

        const currentText = (finalTranscript || interimTranscript).toLowerCase();
        if (currentText.trim()) {
          setLiveTranscript(currentText);
        }

        // Test trigger phrases
        const triggerPhrases = ['emergency', 'help', 'help help', 'danger', 'alert', 'save me', 'nidar'];
        const foundKeyword = triggerPhrases.find(keyword => currentText.includes(keyword));

        if (foundKeyword && !matchedKeyword && !countdownIntervalRef.current) {
          // Pause local speech recognition to avoid multiple triggers
          try {
            autoRestartRef.current = false;
            rec.stop();
          } catch (_) {}

          setMatchedKeyword(foundKeyword);
          playTriggerSequence(foundKeyword);
        }
      };

      rec.onerror = (err: any) => {
        console.warn('Modal voice recognition error:', err.error);
        if (err.error === 'not-allowed') {
          setRecognitionError('Microphone permission block: Please allow mic access to activate real-time Speech SOS.');
          autoRestartRef.current = false;
        } else if (err.error === 'no-speech') {
          // ignore no speech alerts, keep polling
        } else {
          setRecognitionError(`Recognition trigger error: ${err.error}`);
        }
      };

      rec.onend = () => {
        setIsListening(false);
        if (autoRestartRef.current && isOpen && !matchedKeyword) {
          try {
            rec.start();
          } catch (e) {
            // ignore restart errors
          }
        }
      };

      rec.start();
      recognitionRef.current = rec;
    } catch (err: any) {
      console.error('Failed to boot modal SpeechRecognition:', err);
      setRecognitionError('Initialization error: Unable to bind microphone stream.');
    }

    return () => {
      autoRestartRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
      clearCountdown();
    };
  }, [isOpen]);

  // Execute safe dispatch sequence with 3-second cancel option
  const playTriggerSequence = (keyword: string) => {
    playBeepTone(880, 0.45);
    let secondsLeft = 3;
    setCountdown(secondsLeft);

    countdownIntervalRef.current = setInterval(() => {
      secondsLeft -= 1;
      if (secondsLeft <= 0) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
        dispatchEmergencySOS(keyword);
      } else {
        setCountdown(secondsLeft);
        playBeepTone(880, 0.15);
      }
    }, 1000);
  };

  // Fire main emergency coordinate dispatch
  const dispatchEmergencySOS = async (keyword: string) => {
    try {
      await triggerSOS(`Voice Recognition: "${keyword.toUpperCase()}" phrase command triggered.`);
      onClose();
    } catch (e) {
      console.error('Error dispatching SOS via voice:', e);
    }
  };

  // Simulate Trigger helper button (super friendly for sandbox developers, guarantees execution)
  const handleSimulatedTrigger = (phrase: string) => {
    if (countdownIntervalRef.current) return;
    setLiveTranscript(phrase);
    
    // Halt micro recognition
    autoRestartRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }

    const keyword = 'SIMULATED: ' + phrase;
    setMatchedKeyword(keyword);
    playTriggerSequence(keyword);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.65 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900"
        />

        {/* Modal Sheet body */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 24 }}
          transition={{ type: 'spring', duration: 0.38, bounce: 0.15 }}
          className="relative bg-white w-full max-w-md rounded-3xl border border-slate-105 shadow-2xl p-6 overflow-hidden z-10"
        >
          {/* Header */}
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <h3 className="text-base font-black text-slate-800 flex items-center space-x-2">
              <Mic className="w-5 h-5 text-[#FF5A7A] animate-pulse" />
              <span>Real-Time Voice SOS Trigger</span>
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Active Countdown overlay overlay */}
          {countdown !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-[#FF5A7A] text-white flex flex-col items-center justify-center p-6 text-center z-20"
            >
              <ShieldAlert className="w-16 h-16 text-white animate-bounce mb-3" />
              <h2 className="text-2xl font-black uppercase tracking-tight">EMERGENCY SOS INITIATED</h2>
              <p className="text-xs font-semibold py-1 px-4 bg-white/20 rounded-full mt-1.5">
                Matched voice trigger: &quot;{matchedKeyword}&quot;
              </p>

              <div className="my-8 flex items-center justify-center">
                <span className="text-8xl font-black font-mono leading-none tracking-tighter">
                  {countdown}
                </span>
              </div>

              <p className="text-xs text-white/80 max-w-xs leading-relaxed mb-6">
                Broadcasting emergency coordinates to production databases, dispatching alerts & triggering sonic backup deterrents.
              </p>

              <button
                id="voice-abort-btn"
                onClick={handleAbort}
                className="w-full py-4 rounded-2xl bg-white text-[#FF5A7A] font-black text-xs tracking-widest uppercase hover:bg-slate-50 shadow-lg active:scale-95 transition-all"
              >
                🚨 ABORT DISPATCH
              </button>
            </motion.div>
          )}

          {/* Body content */}
          <div className="py-5 space-y-5 text-center">
            
            {/* Pulsing Visual soundwave representation */}
            <div className="relative flex justify-center items-center my-6">
              {isListening && !recognitionError && (
                <>
                  <div className="absolute w-28 h-28 bg-[#FF5A7A]/10 rounded-full animate-ping scale-110 opacity-30" style={{ animationDuration: '2s' }} />
                  <div className="absolute w-36 h-36 bg-[#FF5A7A]/5 rounded-full animate-ping scale-125 opacity-20" style={{ animationDuration: '3s' }} />
                </>
              )}
              
              <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-md transition-all ${
                recognitionError 
                  ? 'bg-amber-50 text-amber-500 border border-amber-200' 
                  : isListening 
                    ? 'bg-rose-50 border-rose-150 text-[#FF5A7A] scale-105' 
                    : 'bg-slate-50 text-slate-400'
              }`}>
                {recognitionError ? (
                  <MicOff className="w-8 h-8" />
                ) : (
                  <Mic className={`w-8 h-8 ${isListening ? 'animate-pulse' : ''}`} />
                )}
              </div>
            </div>

            {/* Status & Alerts section */}
            <div className="space-y-1.5">
              <span className={`text-[10px] font-black px-3 py-1 rounded-full border tracking-wide uppercase ${
                recognitionError 
                  ? 'bg-amber-50 text-amber-600 border-amber-200' 
                  : isListening 
                    ? 'bg-[#E0F2FE] text-[#0369A1] border-[#BAE6FD] animate-pulse' 
                    : 'bg-slate-50 text-slate-400 border-slate-150'
              }`}>
                {recognitionError ? 'HARDWARE FEED LIMITATION' : isListening ? 'ACTIVELY LISTENING...' : 'MIC OFFLINE'}
              </span>

              {recognitionError ? (
                <div className="bg-amber-50 border border-amber-100 p-3.5 rounded-xl text-left flex items-start space-x-2 text-amber-900 text-xs font-semibold mt-3">
                  <AlertTriangle className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="leading-snug">{recognitionError}</p>
                    <p className="text-[10.5px] text-amber-700 font-medium">Don&apos;t worry! You can use the fully functional voice triggers simulator below to test emergency broadcasts.</p>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl min-h-16 flex items-center justify-center text-center">
                  <p className="text-xs font-black text-slate-800 italic leading-relaxed font-sans">
                    🎙️ &quot;{liveTranscript}&quot;
                  </p>
                </div>
              )}
            </div>

            {/* Monitored Trigger words help indicator */}
            <div className="text-left bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100/50">
              <span className="text-[10px] font-black text-[#6366F1] uppercase tracking-wider block mb-1 flex items-center">
                <HelpCircle className="w-3.5 h-3.5 mr-1" />
                <span>Monitored Trigger Words</span>
              </span>
              <p className="text-slate-500 font-medium text-[11px] leading-relaxed">
                If the safety engine detects you continuously shouting any of these target phrases, it initiates immediate emergency sequences:
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {['help', 'emergency', 'danger', 'alert', 'save me'].map((word) => (
                  <span key={word} className="px-2 py-0.5 bg-white border border-indigo-150 text-[10px] font-bold text-indigo-700 rounded-md font-mono">
                    &quot;{word}&quot;
                  </span>
                ))}
              </div>
            </div>

            {/* Developer/Testing Simulation section */}
            <div className="pt-2 border-t border-slate-100 text-left">
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block mb-2 flex items-center">
                <Sparkles className="w-3 h-3 text-[#FF5A7A] mr-1" />
                <span>Instant Voice Simulation Panel</span>
              </span>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleSimulatedTrigger('Emergency')}
                  className="px-3 py-2.5 bg-slate-50 border border-slate-150 rounded-xl text-left text-[11.5px] font-bold text-slate-700 hover:bg-rose-50 hover:border-rose-200 hover:text-[#FF5A7A] transition-all flex items-center space-x-2"
                >
                  <Play className="w-3 h-3 shrink-0" />
                  <span className="truncate">Say &quot;Emergency&quot;</span>
                </button>
                <button
                  onClick={() => handleSimulatedTrigger('Help help!')}
                  className="px-3 py-2.5 bg-slate-50 border border-slate-150 rounded-xl text-left text-[11.5px] font-bold text-slate-700 hover:bg-rose-50 hover:border-rose-200 hover:text-[#FF5A7A] transition-all flex items-center space-x-2"
                >
                  <Play className="w-3 h-3 shrink-0" />
                  <span className="truncate">Say &quot;Help help!&quot;</span>
                </button>
              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
