/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ExternalLink, Play, Sparkles, Youtube, BookOpen } from 'lucide-react';

interface FearlessVideo {
  id: string;
  title: string;
  category: string;
  description: string;
  url: string;
  createdAt?: string;
  isCustom?: boolean;
}

interface VideoPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  video: FearlessVideo | null;
}

// Function to extract YouTube ID from any format
export function getYouTubeId(url: string): string | null {
  try {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return match[2];
    }
    return null;
  } catch {
    return null;
  }
}

export default function VideoPlayerModal({ isOpen, onClose, video }: VideoPlayerModalProps) {
  if (!isOpen || !video) return null;

  const videoId = getYouTubeId(video.url);
  const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0` : video.url;
  const watchUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : video.url;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10">
        {/* Dark Elegant Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm"
        />

        {/* Modal Player Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', duration: 0.4 }}
          className="relative bg-white w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl z-10 border border-slate-100 flex flex-col max-h-[85vh] md:max-h-[90vh]"
        >
          {/* Top Info Header Bar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex-shrink-0">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] uppercase tracking-widest font-extrabold bg-[#FF5A7A]/10 text-[#FF5A7A] px-2.5 py-1 rounded-full">
                {video.category}
              </span>
              <span className="text-[10px] text-slate-400 font-mono font-bold hidden sm:inline">
                ID: {video.id}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Player Aspect Container */}
          <div className="relative bg-black aspect-video w-full flex-shrink-0 border-b border-slate-150">
            {videoId ? (
              <iframe
                title={video.title}
                src={embedUrl}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-slate-900 border border-slate-100">
                <Youtube className="w-16 h-16 text-slate-500 mb-3" />
                <p className="text-sm font-bold text-white mb-2">No Embedded Player Available</p>
                <p className="text-xs text-slate-400 max-w-xs leading-relaxed mb-4">
                  This custom link could not be parsed as a standard embed. Try launching it directly in standard web browsers.
                </p>
                <a
                  href={watchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2 rounded-xl bg-[#FF5A7A] hover:bg-[#ff446b] text-white text-xs font-black transition-all flex items-center space-x-1.5"
                >
                  <span>Launch Link</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>

          {/* Details segment (Scrollable if description is long) */}
          <div className="p-6 overflow-y-auto space-y-4 flex-1">
            <div className="space-y-1.5">
              <h2 className="text-lg font-black text-slate-900 leading-snug tracking-tight">
                {video.title}
              </h2>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                {video.description}
              </p>
            </div>

            {/* Options bar */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-100 text-left">
              <div className="flex items-center space-x-1 text-slate-400">
                <BookOpen className="w-3.5 h-3.5 text-[#FF5A7A]" />
                <span className="text-[11px] font-bold">
                  Points unlocked on playback completion
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <a
                  href={watchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-black transition-all flex items-center justify-center space-x-1.5"
                >
                  <Youtube className="w-4 h-4 text-red-600 fill-red-600" />
                  <span>Watch on YouTube</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black transition-all text-center"
                >
                   Close Player
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
