/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Compass, MapPin, Play, Square, History, Clock, Navigation, CheckCircle2, ChevronRight } from 'lucide-react';
import LeafletMap from '../components/LeafletMap';

export default function JourneyMonitoring() {
  const {
    journeys,
    activeJourney,
    startJourney,
    stopJourney,
    profile,
    addNotification,
    liveLocation,
    safeRouteCoordinates,
    setSafeRouteCoordinates,
    simulateWalking,
    setSimulateWalking,
    simulateDeviation,
    setSimulateDeviation,
    deviationDetected,
    setDeviationDetected
  } = useApp();

  const [destination, setDestination] = useState('');
  const [eta, setEta] = useState('20 minutes');

  // Generate safe route coordinates if journey is active, fall back to default vectors relative to live GPS tracking if none set
  const routePoints: Array<[number, number]> = activeJourney
    ? (safeRouteCoordinates.length > 0
        ? safeRouteCoordinates
        : [
            [liveLocation.lat, liveLocation.lng],
            [liveLocation.lat + 0.002, liveLocation.lng + 0.001],
            [liveLocation.lat + 0.003, liveLocation.lng + 0.004],
            [liveLocation.lat + 0.005, liveLocation.lng + 0.006],
          ])
    : [];

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination) return;
    
    // Auto-generate safeRouteCoordinates if empty during quickstart
    const targetLat = liveLocation.lat + 0.005;
    const targetLng = liveLocation.lng + 0.006;
    setSafeRouteCoordinates([
      [liveLocation.lat, liveLocation.lng],
      [liveLocation.lat + 0.002, liveLocation.lng + 0.001],
      [liveLocation.lat + 0.003, liveLocation.lng + 0.004],
      [targetLat, targetLng]
    ]);

    await startJourney(destination, eta, { lat: liveLocation.lat, lng: liveLocation.lng });
    setSimulateWalking(true);
    setDestination('');
  };

  const handleStop = async (success: boolean) => {
    if (!activeJourney) return;
    await stopJourney(activeJourney.id, success);
    setSimulateWalking(false);
    setSimulateDeviation(false);
    setDeviationDetected(false);
    setSafeRouteCoordinates([]);
  };

  return (
    <div id="journey-monitoring-page" className="space-y-6 pb-26 font-sans">
      
      {/* Header Profile card */}
      <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-xl shadow-slate-100/50">
        <h2 className="text-xl font-display font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
          <Navigation className="w-5.5 h-5.5 text-primary rotate-45" />
          <span>Journey Sentinel</span>
        </h2>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed font-medium">
          If your selected route duration passes without a manual check-in signature, NIDAR immediately initiates emergency panic workflows across all connected champions.
        </p>
      </div>

      {activeJourney ? (
        /* Form Active session monitoring details */
        <div className="space-y-5">
          <div className="bg-white rounded-[24px] border border-slate-100 shadow-xl shadow-slate-100/40 p-6 flex flex-col space-y-4">
            <div className="flex justify-between items-start border-b border-slate-50 pb-3">
              <div>
                <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100/60 px-2.5 py-1 rounded-full uppercase tracking-widest">
                  Live Stream Active
                </span>
                <h3 className="font-extrabold text-base text-slate-900 mt-2 tracking-tight">{activeJourney.destinationName}</h3>
              </div>
              <span className="text-xs font-mono font-bold text-slate-600 flex items-center space-x-1.5 bg-slate-50 rounded-xl p-2 border border-slate-200/50 shadow-sm">
                <Clock className="w-3.5 h-3.5 text-[#6366F1]" />
                <span>ETA {activeJourney.eta}</span>
              </span>
            </div>

            <div className="h-60 rounded-2xl overflow-hidden shadow-inner border border-slate-200/60 relative">
              <LeafletMap
                center={{ lat: liveLocation.lat, lng: liveLocation.lng }}
                markers={[
                  {
                    lat: liveLocation.lat,
                    lng: liveLocation.lng,
                    title: 'Current Position',
                    description: `Accuracy: ±${liveLocation.accuracy}m • Speed: ${liveLocation.speed} km/h`,
                    type: 'user',
                  },
                  {
                    lat: routePoints.length > 0 ? routePoints[routePoints.length - 1][0] : liveLocation.lat + 0.005,
                    lng: routePoints.length > 0 ? routePoints[routePoints.length - 1][1] : liveLocation.lng + 0.006,
                    title: activeJourney.destinationName,
                    description: 'Destination endpoint.',
                    type: 'route-endpoint',
                  },
                ]}
                routeCoordinates={routePoints}
              />
            </div>

            {/* Stop Actions controls */}
            <div className="grid grid-cols-2 gap-4">
              <button
                id="journey-stop-warning"
                onClick={() => handleStop(false)}
                className="py-3 bg-red-50 text-red-500 hover:bg-red-100/60 active:scale-95 transition-all text-xs font-extrabold rounded-xl border border-red-100 flex items-center justify-center space-x-1.5"
              >
                <span>Trigger Threat Flag</span>
              </button>
              <button
                id="journey-stop-success"
                onClick={() => handleStop(true)}
                className="py-3 bg-gradient-to-tr from-[#FF5A7A] to-[#FF7A59] hover:opacity-95 text-white active:scale-95 transition-all text-xs font-extrabold rounded-xl flex items-center justify-center space-x-1.5 shadow-md shadow-pink-200"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Secure Check-In</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Configuration Form to boot journey tracking */
        <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-xl shadow-slate-100/45 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-50 pb-3">
            <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-widest">Trajectory Configuration</h3>
            <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50/70 px-2 py-0.5 rounded tracking-wide font-sans">
              Sentinel Active
            </span>
          </div>

          <form onSubmit={handleStart} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Where are you heading?</label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  id="journey-dest-input"
                  type="text"
                  required
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g. Grand Central Terminal or home address"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#FF5A7A] focus:ring-1 focus:ring-[#FF5A7A]/30 transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Estimated Duration (ETA)</label>
              <select
                id="journey-eta-set"
                value={eta}
                onChange={(e) => setEta(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#FF5A7A] focus:ring-1 focus:ring-[#FF5A7A]/30 transition-all font-medium text-slate-800"
              >
                <option value="10 minutes">10 Minutes</option>
                <option value="20 minutes">20 Minutes</option>
                <option value="40 minutes">40 Minutes</option>
                <option value="1 hour">1 Hour</option>
              </select>
            </div>

            <button
              id="journey-start-btn"
              type="submit"
              className="w-full py-4 bg-primary text-white font-extrabold text-sm tracking-widest uppercase rounded-2xl hover:opacity-95 bg-gradient-to-tr from-[#FF5A7A] to-[#FF7A59] flex items-center justify-center space-x-2 shadow-lg shadow-pink-200 transition-all active:scale-98"
            >
              <Play className="w-4 h-4 fill-white text-white" />
              <span>Initiate Sentinel Track</span>
            </button>
          </form>
        </div>
      )}

      {/* Trajectory history collection logs (Pristine startup fidelity) */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase flex items-center space-x-1">
          <History className="w-3.5 h-3.5 text-slate-400" />
          <span>Closed Journey Logs</span>
        </h3>
        {journeys.filter(j => j.status !== 'active').length === 0 ? (
          <div className="bg-white py-6 border rounded-2xl text-center text-xs text-slate-450">
            No closed tracking logs recorded.
          </div>
        ) : (
          <div className="space-y-2.5">
            {journeys
              .filter((j) => j.status !== 'active')
              .slice(0, 3)
              .map((j) => (
                <div key={j.id} className="bg-white p-3.5 rounded-xl border border-slate-100 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-sm text-slate-800 leading-tight">{j.destinationName}</h4>
                    <span className="text-[10px] text-slate-450 font-mono mt-0.5 block">
                      {new Date(j.createdAt).toLocaleDateString()} • ETA {j.eta}
                    </span>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${
                    j.status === 'completed'
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                      : 'bg-red-50 text-red-500 border-red-100'
                  }`}>
                    {j.status}
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
