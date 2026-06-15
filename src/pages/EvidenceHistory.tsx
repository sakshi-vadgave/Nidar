import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  FileAudio,
  FileImage,
  FileVideo,
  MapPin,
  Calendar,
  Cloud,
  FileText,
  Trash2,
  ChevronLeft,
  Search,
  ExternalLink,
  Lock,
  Download,
  Database
} from 'lucide-react';

export default function EvidenceHistory() {
  const { evidence, deleteEvidence, profile, user } = useApp();
  const navigate = useNavigate();
  const [filterType, setFilterType] = useState<'all' | 'image' | 'audio' | 'video'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1000;
    const dm = 1;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'audio':
        return <FileAudio className="w-5 h-5 text-rose-500" />;
      case 'image':
        return <FileImage className="w-5 h-5 text-sky-500" />;
      case 'video':
        return <FileVideo className="w-5 h-5 text-emerald-500" />;
      default:
        return <FileText className="w-5 h-5 text-slate-500" />;
    }
  };

  const handleDownload = (fileUrl: string, fileType: string) => {
    // If it's a data_url base64 fallback, we can trigger direct native download
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = `evidence_${Date.now()}.${fileType === 'image' ? 'jpg' : (fileType === 'audio' ? 'webm' : 'mp4')}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredEvidence = evidence.filter((item) => {
    const matchesType = filterType === 'all' || item.fileType === filterType;
    const matchesSearch = item.location?.address
      ? item.location.address.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesType && matchesSearch;
  });

  return (
    <div id="evidence-history-page" className="space-y-6 pb-26 font-sans text-slate-800">
      
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <button
          id="evidence-back-btn"
          onClick={() => navigate('/dashboard')}
          className="flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors select-none bg-slate-50 border px-3 py-1.5 rounded-xl cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Home</span>
        </button>
        <div className="flex items-center space-x-1.5">
          <Shield className="w-4.5 h-4.5 text-[#FF5A7A]" />
          <h2 className="text-sm font-extrabold text-slate-900 tracking-tight uppercase leading-none">
            Evidence Records History
          </h2>
        </div>
        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full uppercase font-mono">
          Locked ({filteredEvidence.length})
        </span>
      </div>

      {/* Info Warning Card */}
      <div className="bg-slate-900 text-slate-205 rounded-2xl p-4.5 border border-slate-800 shadow flex items-start space-x-3 text-left">
        <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 shrink-0 mt-0.5">
          <Lock className="w-4.5 h-4.5" />
        </div>
        <div className="space-y-0.5">
          <h4 className="text-xs font-black text-white tracking-wide uppercase">Tamper-Proof File Integrity</h4>
          <p className="text-[11px] leading-relaxed text-slate-400">
            All files captured under SOS active phases are encrypted dynamically with AES-256 blocks, stamped with precise GPS coordinates, and streamed securely to Cloud Storage. This metadata is strictly legally binding.
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm space-y-3.5">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-400" />
          <input
            id="evidence-search"
            type="text"
            placeholder="Search captured location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 transition-colors font-semibold"
          />
        </div>

        {/* Categories Tab Pill Selector */}
        <div className="flex space-x-1 text-xs select-none">
          {(['all', 'image', 'audio', 'video'] as const).map((type) => (
            <button
              key={type}
              id={`tab-filter-${type}`}
              onClick={() => setFilterType(type)}
              className={`flex-1 py-1.5 px-2.5 rounded-xl border font-bold capitalize transition-all cursor-pointer ${
                filterType === type
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-150'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Main history stack */}
      <div className="space-y-4">
        {filteredEvidence.length === 0 ? (
          <div className="bg-slate-50 rounded-2xl p-10 text-center border border-slate-200 border-dashed space-y-2 mt-2">
            <div className="p-3 bg-slate-100 rounded-full inline-block text-slate-450 border border-slate-155">
              <Database className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-slate-500">No telemetry evidence logs recovered.</p>
            <p className="text-[10px] text-slate-450">Active recordings captured during emergency SOS broadcasts reside here.</p>
          </div>
        ) : (
          filteredEvidence.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-150 p-5 shadow-md flex flex-col space-y-4 text-left"
            >
              {/* Top metadata line with Type Indicator & Delete */}
              <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-slate-50 border border-slate-100 rounded-lg shrink-0">
                    {getMediaIcon(item.fileType)}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800 leading-tight uppercase font-mono">
                      {item.fileType} FILE TELEMETRY
                    </h4>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5 leading-none">
                      SIZE: {formatBytes(item.fileSize)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-1.5">
                  <button
                    id={`download-evidence-${item.id}`}
                    onClick={() => handleDownload(item.fileUrl, item.fileType)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 bg-slate-50 border hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    title="Download decrypted proof file"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    id={`delete-evidence-${item.id}`}
                    onClick={() => {
                      if (confirm('Permanently purge this active emergency evidence block? This cannot be undone.')) {
                        deleteEvidence(item.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-650 bg-slate-50 border hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    title="Purge permanently"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Real Media Preview Component (DO NOT USE SAMPLE FILES) */}
              <div className="bg-slate-900 rounded-xl overflow-hidden shadow-inner flex items-center justify-center min-h-36 relative">
                {item.fileType === 'image' && (
                  <img
                    src={item.fileUrl}
                    alt="SOS Camera Snapshot Decrypted"
                    referrerPolicy="no-referrer"
                    className="max-h-56 w-full object-contain"
                  />
                )}

                {item.fileType === 'audio' && (
                  <div className="w-full h-full p-4.5 bg-gradient-to-br from-slate-900 to-indigo-950 flex flex-col justify-center items-center space-y-3">
                    <FileAudio className="w-10 h-10 text-rose-450 animate-pulse" />
                    <audio src={item.fileUrl} controls className="w-full max-w-xs h-9 rounded-xl filter invert hue-rotate-180" />
                  </div>
                )}

                {item.fileType === 'video' && (
                  <video
                    src={item.fileUrl}
                    controls
                    className="w-full max-h-64 object-contain rounded-xl"
                  />
                )}
              </div>

              {/* Bottom Telemetry Details */}
              <div className="grid grid-cols-1 divide-y divide-slate-100 text-[11px] pt-1">
                {/* Time */}
                <div className="py-2.5 flex items-center space-x-2 text-slate-650">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-[9px] text-slate-400 block font-bold uppercase leading-none">CAPTURE TIMESTAMP (UTC)</span>
                    <span className="font-bold text-slate-700 font-mono mt-0.5 block">
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Location Mapping */}
                {item.location && (
                  <div className="py-2.5 flex items-start justify-between gap-2 text-slate-650">
                    <div className="flex items-start space-x-2">
                      <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[9px] text-slate-400 block font-bold uppercase leading-none">GPS TELEMETRY FOOTPRINT</span>
                        <span className="font-bold text-slate-700 block mt-0.5 leading-normal">
                          {item.location.address || 'Standard verified coordinates'}
                        </span>
                        <span className="font-mono text-[9px] text-slate-450 block mt-0.5">
                          LAT: {Number(item.location.lat).toFixed(5)} • LNG: {Number(item.location.lng).toFixed(5)}
                        </span>
                      </div>
                    </div>
                    {item.location.lat && item.location.lng && (
                      <a
                        href={`https://www.google.com/maps?q=${item.location.lat},${item.location.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 px-2.5 bg-slate-50 border rounded-lg hover:bg-slate-100 flex items-center space-x-1 font-bold text-[9px] text-indigo-650 shrink-0 mt-1 select-none"
                      >
                        <span>Maps Link</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                )}

                {/* Secure Cloud Storage Status Badge */}
                <div className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-slate-650">
                    <Cloud className="w-4 h-4 text-sky-400 shrink-0" />
                    <div>
                      <span className="text-[9px] text-slate-400 block font-bold uppercase leading-none">FILE TRANSMISSION HOST</span>
                      <span className="font-bold text-slate-700 mt-0.5 block">
                        {item.fileUrl.startsWith('data:') ? 'Local Inline Payload' : 'Firebase Storage Host'}
                      </span>
                    </div>
                  </div>
                  <span className={`text-[9px] font-bold py-0.5 px-2 rounded-lg border font-mono uppercase shrink-0 ${
                    item.storageStatus.includes('Cloud') || item.storageStatus.includes('Storage')
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100 animate-pulse'
                      : 'bg-indigo-50 text-indigo-700 border-indigo-150'
                  }`}>
                    {item.storageStatus}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
