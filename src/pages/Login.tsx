/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Mail, Lock, Phone, Key, HelpCircle, ArrowRight, BookOpen } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

export default function Login() {
  const { signInWithGoogle, signInWithGuestMock, user, needsOnboarding } = useApp();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'google' | 'guest' | 'email' | 'phone'>('google');
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNum, setPhoneNum] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Handle redirect if authenticated
  useEffect(() => {
    if (user && !loading) {
      if (needsOnboarding) {
        navigate('/onboarding', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, loading, needsOnboarding, navigate]);

  const handleGoogleLogin = async () => {
    setErrorMessage('');
    try {
      await signInWithGoogle();
      // AppContext will trigger redirect to onboarding/dashboard automatically
    } catch (err: any) {
      setErrorMessage(err.message || 'Google Authentication failed.');
    }
  };

  const handleGuestLogin = async () => {
    setErrorMessage('');
    setLoading(true);
    try {
      const mockUser = {
        uid: 'guest_' + Math.random().toString(36).substring(2, 11),
        email: 'guest@nidar-safety.com',
        displayName: 'Guest Citizen',
        emailVerified: true,
        photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256&h=256',
        isAnonymous: true
      };
      await signInWithGuestMock(mockUser);
    } catch (err: any) {
      setErrorMessage(err.message || 'Guest Sandbox session initiation failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!email || !password) {
      setErrorMessage('Please fill in both email and password fields.');
      return;
    }
    setLoading(true);
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!phoneNum || phoneNum.length < 8) {
      setErrorMessage('Please enter a valid phone number with country code.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setOtpSent(true);
      setLoading(false);
    }, 1200);
  };

  const handleOtpVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (otpCode !== '123456') {
      setErrorMessage('Verification failed. For simulated Phone auth, use code 123456.');
      return;
    }
    setErrorMessage('Simulated phone verify successful! Redirecting...');
    setLoading(true);
    setTimeout(async () => {
      try {
        const mockPhoneUser = {
          uid: 'guest_phone_' + Math.random().toString(36).substring(2, 11),
          email: '', // empty initially, can be populated during onboarding
          phoneNumber: phoneNum || '+1 555-0199',
          displayName: 'Phone Citizen',
          emailVerified: true,
          photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256&h=256',
          isAnonymous: true
        };
        await signInWithGuestMock(mockPhoneUser);
      } catch (err: any) {
        setErrorMessage(err.message || 'Phone Sandbox initiation failed.');
      } finally {
        setLoading(false);
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full space-y-8 bg-white/85 backdrop-blur-md p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
        
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-tr from-primary to-[#FF7A59] border border-white flex items-center justify-center shadow-lg shadow-primary/25">
            <Shield className="h-8 w-8 text-white fill-white/10" />
          </div>
          <div>
            <h2 className="text-3xl font-display font-bold tracking-tight text-slate-800">
              Welcome to NIDAR
            </h2>
            <p className="text-sm text-slate-500 font-medium">
              Zero-Trust Personal Protection Network
            </p>
          </div>
        </div>

        {/* Tab Selection Row */}
        <div id="auth-tabbar" className="flex flex-wrap border-b border-slate-150 py-1 bg-slate-50 rounded-xl p-1 gap-0.5">
          {(['google', 'guest', 'email', 'phone'] as const).map((tab) => (
            <button
              id={`auth-tab-${tab}`}
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setErrorMessage('');
              }}
              className={`flex-1 min-w-[70px] py-2 text-xs font-semibold rounded-lg capitalize tracking-wide transition-all ${
                activeTab === tab
                  ? 'bg-white shadow text-slate-900 border border-slate-100'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab === 'guest' ? 'Guest/Demo' : tab}
            </button>
          ))}
        </div>

        {/* Error Messaging Banner */}
        {errorMessage && (
          <div className="p-3 bg-red-50 text-red-500 text-xs font-medium border border-red-100 rounded-xl animate-shake">
            {errorMessage}
          </div>
        )}

        {/* Auth Panel Switching */}
        <div className="min-h-[220px]">
          <AnimatePresence mode="wait">
            {activeTab === 'google' && (
              <motion.div
                key="google-pane"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 flex flex-col items-center justify-center py-6"
              >
                <p className="text-center text-xs text-slate-500 max-w-xs font-medium leading-relaxed">
                  Sign in instantly using your Google credentials.
                </p>
                <button
                  id="google-signin-btn"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full flex justify-center items-center space-x-3 py-3 border border-slate-200 rounded-2xl bg-white hover:bg-slate-50 active:scale-98 font-semibold text-slate-700 shadow-sm transition-all"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12.24 10.285V14.4h6.887c-.275 1.564-1.88 4.593-6.887 4.593-4.32 0-7.843-3.576-7.843-7.994s3.522-7.994 7.843-7.994c2.457 0 4.103 1.025 5.042 1.926l3.245-3.21C18.256 1.706 15.5 1 12.24 1c-6.077 0-11 4.923-11 11s4.923 11 11 11c6.34 0 10.556-4.461 10.556-10.749 0-.726-.078-1.282-.175-1.966H12.24z"
                    />
                  </svg>
                  <span>Sign In with Google</span>
                </button>
                <p className="text-[10px] text-slate-400 text-center px-4 leading-normal">
                  ⚠️ If Google popups are blocked inside this sandboxed container, please select the <strong className="text-indigo-600 font-semibold cursor-pointer" onClick={() => setActiveTab('guest')}>Guest/Demo</strong> tab to test all safety systems instantly.
                </p>
              </motion.div>
            )}

            {activeTab === 'guest' && (
              <motion.div
                key="guest-pane"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 flex flex-col items-center justify-center py-6"
              >
                <p className="text-center text-xs text-slate-500 max-w-xs font-medium leading-relaxed">
                  Bypass pops and Firestore security rules. Launch a high-fidelity sandbox session with robust local-storage session state.
                </p>
                <button
                  id="sandbox-guest-btn"
                  onClick={handleGuestLogin}
                  disabled={loading}
                  className="w-full flex justify-center items-center space-x-3 py-3 border border-emerald-200 rounded-2xl bg-emerald-50 hover:bg-emerald-100 active:scale-98 font-semibold text-emerald-800 shadow-sm transition-all shadow-emerald-100/50"
                >
                  <Shield className="w-5 h-5 text-emerald-600 fill-emerald-600/10" />
                  <span>Launch Guest Sandbox Session</span>
                </button>
                <p className="text-[10px] text-slate-400 text-center px-4 leading-normal bg-emerald-50/40 p-2.5 rounded-xl border border-emerald-100/50">
                  ⚡ <strong>100% Secure Sandbox Mode:</strong> Real-time journey mapping, SOS dispatcher alarms, notifications feed, and priority guardian lists all remain persistent on your device.
                </p>
              </motion.div>
            )}

            {activeTab === 'email' && (
              <motion.form
                key="email-pane"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleEmailAuth}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 block">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      id="login-email-input"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@email.com"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 block">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      id="login-password-input"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                </div>

                <button
                  id="email-auth-submit-btn"
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white rounded-xl font-semibold text-sm transition-all mt-4 flex items-center justify-center space-x-2"
                >
                  <span>{loading ? 'Processing...' : isRegistering ? 'Register Safety Profile' : 'Sign In'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="text-center mt-3">
                  <button
                    type="button"
                    onClick={() => setIsRegistering(!isRegistering)}
                    className="text-xs text-primary font-semibold hover:underline"
                  >
                    {isRegistering ? 'Already have an account? Sign In' : 'Need an account? Register'}
                  </button>
                </div>
              </motion.form>
            )}

            {activeTab === 'phone' && (
              <motion.div
                key="phone-pane"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {!otpSent ? (
                  <form onSubmit={handlePhoneSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-600 block">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                        <input
                          id="login-phone-input"
                          type="tel"
                          value={phoneNum}
                          onChange={(e) => setPhoneNum(e.target.value)}
                          placeholder="+1 555-0199"
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 font-mono"
                        />
                      </div>
                    </div>
                    <button
                      id="phone-otp-request-btn"
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-all flex items-center justify-center space-x-2"
                    >
                      <span>{loading ? 'Sending OTP...' : 'Send Verification OTP'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleOtpVerify} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-600 block">Enter One-Time PIN (OTP)</label>
                      <div className="relative">
                        <Key className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                        <input
                          id="login-otp-input"
                          type="text"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          placeholder="Type code 123456"
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 font-mono tracking-widest text-center text-lg"
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 text-center font-medium">
                        Verification code sent. Use test code <strong className="text-primary font-bold">123456</strong>
                      </p>
                    </div>
                    <button
                      id="phone-otp-verify-btn"
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-emerald-500 text-white rounded-xl font-semibold text-sm hover:bg-emerald-600 transition-all"
                    >
                      {loading ? 'Verifying...' : 'Verify Pin & Connect'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="w-full text-center text-xs text-slate-400 font-semibold hover:underline mt-2"
                    >
                      Change Phone Number
                    </button>
                  </form>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Integration Console Guideline Block */}
        {(activeTab === 'email' || activeTab === 'phone') && (
          <div className="mt-8 pt-6 border-t border-slate-100 bg-slate-50 p-4 rounded-2xl flex flex-col space-y-2.5">
            <div className="flex items-center space-x-2 text-indigo-700 font-display font-semibold text-xs">
              <BookOpen className="w-4.5 h-4.5" />
              <span>Developer Setup Manual</span>
            </div>
            <p className="text-[10.5px] text-slate-600 leading-relaxed">
              Google Auth works out-of-the-box. To enable additional Email or Phone triggers securely inside your project console:
            </p>
            <ul className="text-[10px] list-disc list-inside text-slate-500 space-y-1">
              <li>Open your Firebase Project Dashboard</li>
              <li>Under <strong className="font-semibold text-slate-700">Authentication</strong>, go to <strong className="font-semibold text-slate-700">Sign-in Method</strong></li>
              <li>Enable <span className="font-mono text-indigo-600 bg-indigo-50 font-bold px-1 rounded">Email/Password</span> or <span className="font-mono text-indigo-600 bg-indigo-50 font-bold px-1 rounded">Phone</span> templates</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
