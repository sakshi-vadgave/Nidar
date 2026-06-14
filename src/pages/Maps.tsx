/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import LeafletMap from '../components/LeafletMap';
import { MapPin, Shield, Activity, Compass, Info, Navigation as NavIcon } from 'lucide-react';

export default function Maps() {
  const { profile } = useApp();
  const location = useLocation();

  const userCoords = profile?.lastLocation || { lat: 19.076, lng: 72.8777 };

  // Determine focus query parameter (e.g. focused on police or hospitals from quick actions)
  const queryParams = new URLSearchParams(location.search);
  const initialFocus = queryParams.get('focus') || 'all';

  const [mapCenter, setMapCenter] = useState(userCoords);
  const [filterType, setFilterType] = useState<string>(initialFocus);
  const [routeActive, setRouteActive] = useState(false);

  // Auto-generate realistic nearby markers relative to center coordinates
  const allMarkers = [
    {
      lat: userCoords.lat,
      lng: userCoords.lng,
      title: profile?.fullName || 'Current Location',
      description: 'Your verified safety telemetry position.',
      type: 'user' as const,
    },
    {
      lat: userCoords.lat + 0.006,
      lng: userCoords.lng + 0.005,
      title: 'City Center Police Depot',
      description: 'Force dispatch station • Patrol cars active 24/7.',
      type: 'police' as const,
    },
    {
      lat: userCoords.lat - 0.007,
      lng: userCoords.lng + 0.008,
      title: 'Subdistrict Security Precinct',
      description: 'Emergency response post • 5 officers on watch now.',
      type: 'police' as const,
    },
    {
      lat: userCoords.lat + 0.004,
      lng: userCoords.lng - 0.006,
      title: 'Metro Emergency General Hospital',
      description: 'Emergency triage • Critical ambulance dispatched unit.',
      type: 'hospital' as const,
    },
    {
      lat: userCoords.lat - 0.005,
      lng: userCoords.lng - 0.004,
      title: 'Red Cross Trauma Clinic',
      description: '24/7 care facility • Safe shelter inside vestibules.',
      type: 'hospital' as const,
    },
  ];

  // Route coords connecting current location to City Center Police Depot
  const safeRouteCoords: Array<[number, number]> = [
    [userCoords.lat, userCoords.lng],
    [userCoords.lat + 0.002, userCoords.lng + 0.001],
    [userCoords.lat + 0.004, userCoords.lng + 0.003],
    [userCoords.lat + 0.006, userCoords.lng + 0.005], // Destination Point
  ];

  // Filter markers list based on selection
  const filteredMarkers = allMarkers.filter((m) => {
    if (filterType === 'all') return true;
    if (filterType === 'police') return m.type === 'user' || m.type === 'police';
    if (filterType === 'hospital') return m.type === 'user' || m.type === 'hospital';
    return true;
  });

  const toggleRoute = () => {
    setRouteActive(!routeActive);
    // If route starts, center to route midpoints
    if (!routeActive) {
      setMapCenter({
        lat: userCoords.lat + 0.003,
        lng: userCoords.lng + 0.0025,
      });
    } else {
      setMapCenter(userCoords);
    }
  };

  return (
    <div id="maps-view-page" className="space-y-4 pb-24 font-sans h-[calc(100vh-140px)] flex flex-col">
      {/* Search Filter Header */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm flex flex-col space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-1.5">
            <Compass className="w-4.5 h-4.5 text-secondary animate-spin-slow" />
            <span>NIDAR Guard Map</span>
          </h3>
          <p className="text-[10px] text-slate-400 font-medium">GPS Signal: High accuracy (5m)</p>
        </div>

        {/* Tab filters */}
        <div className="flex bg-slate-50 border border-slate-100 rounded-xl p-1 text-xs">
          <button
            id="map-filter-all"
            onClick={() => setFilterType('all')}
            className={`flex-1 py-1.5 text-center font-bold rounded-lg transition-all ${
              filterType === 'all'
                ? 'bg-white text-slate-900 border border-slate-100 shadow'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            All Safezones
          </button>
          <button
            id="map-filter-police"
            onClick={() => setFilterType('police')}
            className={`flex-1 py-1.5 text-center font-bold rounded-lg transition-all flex items-center justify-center space-x-1 ${
              filterType === 'police'
                ? 'bg-indigo-500 text-white shadow'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Shield className="w-3 h-3" />
            <span>Police Only</span>
          </button>
          <button
            id="map-filter-hospital"
            onClick={() => setFilterType('hospital')}
            className={`flex-1 py-1.5 text-center font-bold rounded-lg transition-all flex items-center justify-center space-x-1 ${
              filterType === 'hospital'
                ? 'bg-red-500 text-white shadow'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Activity className="w-3 h-3" />
            <span>Hospitals</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Map View */}
      <div className="flex-1 min-h-[280px] relative">
        <LeafletMap
          center={mapCenter}
          markers={filteredMarkers}
          routeCoordinates={routeActive ? safeRouteCoords : undefined}
        />

        {/* Floating Route trigger controller inside Map canvas frame */}
        <div className="absolute top-4 left-4 z-20">
          <button
            id="map-toggle-route-btn"
            onClick={toggleRoute}
            className={`py-2 px-4 shadow-md text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-all outline-none border ${
              routeActive
                ? 'bg-indigo-600 text-white border-indigo-500 hover:bg-indigo-700'
                : 'bg-white text-slate-800 border-slate-200 hover:border-indigo-100'
            }`}
          >
            <NavIcon className={`w-3.5 h-3.5 ${routeActive ? 'animate-bounce text-white' : 'text-indigo-500'}`} />
            <span>{routeActive ? 'Plotting Safe Route' : 'Suggest Safe Route'}</span>
          </button>
        </div>

        {/* Legend Panel overlay */}
        <div className="absolute bottom-4 left-4 z-20 glass-panel p-2.5 rounded-xl text-[10px] space-y-1 my-2 border shadow-lg border-slate-100">
          <div className="flex items-center space-x-1.5 text-slate-600 font-semibold uppercase">
            <Info className="w-3 h-3 text-secondary" />
            <span>MAP MAP LEGEND</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" />
            <span>Verified position</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
            <span>Active Police precinct</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
            <span>Trauma/Emergency care</span>
          </div>
        </div>
      </div>
    </div>
  );
}
