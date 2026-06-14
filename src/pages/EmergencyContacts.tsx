/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, User, Phone, PhoneCall, Trash2, Edit2, ShieldAlert, X, Heart, HelpCircle, MailCheck } from 'lucide-react';
import { EmergencyContact } from '../types';

export default function EmergencyContacts() {
  const { contacts, addContact, updateContact, deleteContact } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('high');

  // Preseeded National Help lines
  const preseededGlobalHelpline = [
    { name: 'National Emergency Support', phone: '112', relationship: 'Govt Dispatch', priority: 'high' },
    { name: 'Women Helpline Desk Helpline', phone: '1091', relationship: 'Special Support Desk', priority: 'high' },
    { name: 'Police Control Room PCR', phone: '100', relationship: 'Law Enforcement', priority: 'high' },
    { name: 'Domestic Abuse Assistance Helpline', phone: '181', relationship: 'Crisis Support', priority: 'medium' },
  ];

  const handleOpenEdit = (c: EmergencyContact) => {
    setEditingId(c.id);
    setName(c.name);
    setPhone(c.phone);
    setRelationship(c.relationship);
    setPriority(c.priority);
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingId(null);
    setName('');
    setPhone('');
    setRelationship('');
    setPriority('high');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !relationship) return;

    if (editingId) {
      await updateContact(editingId, { name, phone, relationship, priority });
    } else {
      await addContact({ name, phone, relationship, priority });
    }
    handleClose();
  };

  const handleCall = (phoneNum: string) => {
    window.location.href = `tel:${phoneNum}`;
  };

  const handleMsg = (phoneNum: string) => {
    window.location.href = `sms:${phoneNum}?body=NIDAR%20Safety%20SOS%3A%20Please%20assist.`;
  };

  return (
    <div id="contacts-page" className="space-y-6 pb-24 font-sans">
      {/* Header card with summary */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex justify-between items-center">
        <div>
          <h2 className="text-xl font-display font-bold text-slate-800 flex items-center space-x-2">
            <ShieldAlert className="w-5.5 h-5.5 text-[#6366F1]" />
            <span>Emergency Contacts</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
            Quick-dial shortcuts for helplines and close networks mapped inside your client database.
          </p>
        </div>
        <button
          id="add-contact-btn"
          onClick={() => setShowModal(true)}
          className="p-3 bg-[#6366F1] hover:bg-indigo-600 text-white rounded-full transition-all flex items-center justify-center border border-white"
        >
          <Plus className="w-5.5 h-5.5" />
        </button>
      </div>

      {/* Preseeded Helplines Section (Critical value for hackathon) */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase flex items-center space-x-1">
          <Heart className="w-3.5 h-3.5 text-primary fill-primary/10" />
          <span>Preseeded National Helplines</span>
        </h3>
        <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
          {preseededGlobalHelpline.map((ph, index) => (
            <div
              key={index}
              className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-28 hover:border-indigo-100"
            >
              <div className="space-y-0.5">
                <span className="text-[8px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded uppercase">
                  {ph.relationship}
                </span>
                <h4 className="font-bold text-sm text-slate-800 tracking-tight mt-1 truncate">{ph.name}</h4>
              </div>
              
              <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                <span className="text-xs font-mono font-bold text-indigo-600">{ph.phone}</span>
                <button
                  onClick={() => handleCall(ph.phone)}
                  className="p-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-indigo-600 active:scale-95 transition-transform"
                >
                  <PhoneCall className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Contacts List Section */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase flex items-center space-x-1">
          <User className="w-3.5 h-3.5 text-slate-400" />
          <span>My Custom Contacts ({contacts.length})</span>
        </h3>

        {contacts.length === 0 ? (
          <div className="bg-white py-8 rounded-2xl text-center border border-slate-100 text-xs text-slate-400 font-medium">
            No custom priority contacts registered. Add key allies here!
          </div>
        ) : (
          <div className="space-y-3">
            {contacts.map((c) => (
              <div
                id={`contact-card-${c.id}`}
                key={c.id}
                className="bg-white p-4 rounded-xl border border-slate-100 flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center font-bold text-slate-600 border border-slate-120">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{c.name}</h4>
                    <p className="text-[10px] text-slate-400 font-medium tracking-wide">
                      {c.relationship} • <span className="font-mono">{c.phone}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleOpenEdit(c)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-50"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteContact(c.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 rounded hover:bg-slate-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleMsg(c.phone)}
                    className="p-1.5.5 bg-slate-50 hover:bg-indigo-150 rounded-lg text-indigo-500 border border-slate-100"
                  >
                    <MailCheck className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleCall(c.phone)}
                    className="p-1.5.5 bg-primary/10 hover:bg-primary/20 rounded-lg text-primary border border-primary/10"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Model add overlay */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="absolute inset-0 bg-slate-900"
            />
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="relative w-full max-w-sm bg-white rounded-3xl p-6 border shadow-2xl border-slate-100 z-10 font-sans space-y-4"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h3 className="font-display font-bold text-slate-800 text-lg">
                  {editingId ? 'Edit Emergency Contact' : 'Register Contact Record'}
                </h3>
                <button onClick={handleClose} className="p-1 hover:bg-slate-50 rounded-full text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block">Contact Name</label>
                  <input
                    id="contact-form-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Police Control"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block">Phone Number</label>
                  <input
                    id="contact-form-phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 100 or +1555199"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none text-slate-700 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block">Relationship / Specialty</label>
                  <input
                    id="contact-form-rel"
                    type="text"
                    required
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    placeholder="Partner, Helpline, Station"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                  />
                </div>

                <button
                  id="contact-form-submit"
                  type="submit"
                  className="w-full py-3.5 bg-[#6366F1] text-white rounded-2xl font-bold text-sm tracking-wide bg-gradient-to-tr from-indigo-500 to-indigo-600"
                >
                  {editingId ? 'Modify Contact Node' : 'Record Safety Shortcut'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
