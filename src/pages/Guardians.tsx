/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, User, Phone, Heart, Users, Trash2, Edit2, PhoneCall, MailCheck, Sparkles, X } from 'lucide-react';
import { Guardian } from '../types';

export default function Guardians() {
  const { guardians, addGuardian, updateGuardian, deleteGuardian } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState('');
  const [priorityLevel, setPriorityLevel] = useState<'high' | 'medium' | 'low'>('high');

  const handleOpenEdit = (g: Guardian) => {
    setEditingId(g.id);
    setName(g.name);
    setPhone(g.phone);
    setRelationship(g.relationship);
    setPriorityLevel(g.priorityLevel);
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingId(null);
    setName('');
    setPhone('');
    setRelationship('');
    setPriorityLevel('high');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !relationship) return;

    if (editingId) {
      // Update Guardian
      await updateGuardian(editingId, { name, phone, relationship, priorityLevel });
    } else {
      // Create new Guardian
      await addGuardian({ name, phone, relationship, priorityLevel });
    }
    handleCloseModal();
  };

  const handleCall = (phoneNum: string) => {
    // Open cellular dialogue
    window.location.href = `tel:${phoneNum}`;
  };

  const handleMessage = (gName: string, phoneNum: string) => {
    // SMS dispatch simulation
    const messageText = encodeURIComponent(`NIDAR Safety Warning Alert: Active tracing dispatched. View coordinates at preview track.`);
    window.location.href = `sms:${phoneNum}?body=${messageText}`;
  };

  return (
    <div id="guardians-view-page" className="space-y-6 pb-24 font-sans">
      {/* Header section with summaries */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
        <div className="space-y-1.5">
          <h2 className="text-xl font-display font-bold text-slate-800 flex items-center space-x-2">
            <Users className="w-5.5 h-5.5 text-primary" />
            <span>Trusted Guardians ({guardians.length})</span>
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
            These priority protectors are notified instantly on any SOS dispatch or trajectory anomaly.
          </p>
        </div>
        <button
          id="add-guardian-btn"
          onClick={() => setShowAddModal(true)}
          className="p-3 bg-gradient-to-tr from-primary to-[#FF7A59] text-white hover:opacity-95 active:scale-95 transition-all rounded-full flex items-center justify-center border border-white"
        >
          <Plus className="w-5.5 h-5.5" />
        </button>
      </div>

      {guardians.length === 0 ? (
        /* Empty layout */
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 text-center p-12 space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-50 mx-auto flex items-center justify-center border border-slate-100">
            <User className="w-6 h-6 text-slate-400" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">No connected Guardians</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 leading-relaxed">
              Your network is currently blank. Tap the plus button to securely enroll priority safety guardians.
            </p>
          </div>
        </div>
      ) : (
        /* Settle card listings with beautiful bento animations */
        <div className="space-y-4">
          {guardians.map((g) => (
            <div
              id={`guardian-card-${g.id}`}
              key={g.id}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4 flex flex-col justify-between"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3.5">
                  <div className="w-11 h-11 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-base border border-primary/20">
                    {g.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">{g.name}</h3>
                    <div className="flex items-center space-x-1.5 text-xs text-slate-500 mt-0.5">
                      <span className="capitalize">{g.relationship}</span>
                      <span className="w-1 h-1 bg-slate-300 rounded-full" />
                      <span className="font-mono">{g.phone}</span>
                    </div>
                  </div>
                </div>

                {/* Priority badges */}
                <span className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                  g.priorityLevel === 'high'
                    ? 'bg-red-50 text-red-600 border-red-100'
                    : g.priorityLevel === 'medium'
                    ? 'bg-amber-50 text-amber-600 border-amber-100'
                    : 'bg-slate-50 text-slate-500 border-slate-200'
                }`}>
                  {g.priorityLevel} priority
                </span>
              </div>

              {/* Utility action blocks inside individual cards */}
              <div className="border-t border-slate-50 pt-3 flex justify-between items-center bg-slate-50 rounded-xl px-4 py-2">
                <div className="flex items-center space-x-3 text-slate-600">
                  <button
                    id={`guardian-edit-${g.id}`}
                    onClick={() => handleOpenEdit(g)}
                    className="p-1 px-1.5 hover:text-indigo-600 text-xs font-semibold flex items-center space-x-1 hover:bg-white rounded"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    id={`guardian-delete-${g.id}`}
                    onClick={() => deleteGuardian(g.id)}
                    className="p-1 px-1.5 hover:text-red-500 text-xs font-semibold flex items-center space-x-1 hover:bg-white rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  {/* SMS triggered simulation link */}
                  <button
                    id={`guardian-msg-${g.id}`}
                    onClick={() => handleMessage(g.name, g.phone)}
                    className="p-2 bg-white border border-slate-200 hover:border-indigo-100 rounded-lg text-slate-600"
                  >
                    <MailCheck className="w-4 h-4 text-indigo-500" />
                  </button>

                  {/* Standard Call anchor */}
                  <button
                    id={`guardian-call-${g.id}`}
                    onClick={() => handleCall(g.phone)}
                    className="p-2 bg-primary/10 border border-primary/20 hover:border-primary/40 rounded-lg text-primary"
                  >
                    <PhoneCall className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CRUD Overlay Dialog Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="absolute inset-0 bg-slate-900"
            />

            {/* Modal Body card */}
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="relative w-full max-w-sm bg-white rounded-3xl p-6 border shadow-2xl border-slate-100 z-10 font-sans space-y-4"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h3 className="font-display font-bold text-slate-800 text-lg">
                  {editingId ? 'Edit Safety Guardian' : 'Register Trusted Guardian'}
                </h3>
                <button onClick={handleCloseModal} className="p-1 hover:bg-slate-50 rounded-full text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block">Defender Name</label>
                  <input
                    id="guardian-form-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Martha (Sister)"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block">Phone Number</label>
                  <input
                    id="guardian-form-phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none text-slate-700 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block">Relationship</label>
                  <input
                    id="guardian-form-rel"
                    type="text"
                    required
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    placeholder="Sister, Parent, Partner"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block">Priority Ring Alert Level</label>
                  <div className="flex bg-slate-50 border border-slate-150 p-1 rounded-xl text-xs font-semibold">
                    {(['high', 'medium', 'low'] as const).map((lvl) => (
                      <button
                        id={`guardian-form-priority-${lvl}`}
                        type="button"
                        key={lvl}
                        onClick={() => setPriorityLevel(lvl)}
                        className={`flex-1 py-1.5 rounded-lg capitalize border ${
                          priorityLevel === lvl
                            ? 'bg-white text-slate-900 shadow border-slate-100'
                            : 'text-slate-400 border-transparent hover:text-slate-500'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  id="guardian-form-submit"
                  type="submit"
                  className="w-full py-3.5 bg-primary text-white rounded-2xl font-bold text-sm tracking-wide bg-gradient-to-tr from-primary to-[#FF7A59]"
                >
                  {editingId ? 'Modify Safety Node' : 'Actively Register Protector'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
