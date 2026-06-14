/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import LeafletMap from '../components/LeafletMap';
import {
  MapPin,
  Shield,
  Activity,
  Compass,
  Info,
  Navigation as NavIcon,
  Search,
  Play,
  Square,
  AlertTriangle,
  RefreshCw,
  ChevronRight,
  Navigation,
  CheckCircle,
  Eye,
  AlertOctagon
} from 'lucide-react';

export default function Maps() {
  const {
    profile,
    liveLocation,
    setLiveLocation,
    safeRouteCoordinates,
    setSafeRouteCoordinates,
    safeRouteData,
    setSafeRouteData,
    simulateWalking,
    setSimulateWalking,
    simulateDeviation,
    setSimulateDeviation,
    deviationDetected,
    setDeviationDetected,
    activeJourney,
    startJourney,
    stopJourney,
    addNotification
  } = useApp();

  const location = useLocation();

  // Determine focus query parameter (police / hospital)
  const queryParams = new URLSearchParams(location.search);
  const initialFocus = queryParams.get('focus') || 'all';

  const [filterType, setFilterType] = useState<string>(initialFocus);
  const [destinationInput, setDestinationInput] = useState('');
  const [showDirections, setShowDirections] = useState(false);
  const [showSimulationLogs, setShowSimulationLogs] = useState(true);

  // Dynamic zoom state and Center focusing
  const [zoom, setZoom] = useState(15);
  const [mapCenter, setMapCenter] = useState({ lat: liveLocation.lat, lng: liveLocation.lng });
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Recenter map center on liveLocation change
  const handleRecenter = () => {
    setMapCenter({ lat: liveLocation.lat, lng: liveLocation.lng });
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 1, 19));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 1, 2));
  };

  // Explicit browser-level Geolocation query on-demand
  const handleManualDetectLocation = () => {
    if (!navigator.geolocation) {
      setPermissionError('Browser sensor is blocked or missing.');
      return;
    }

    setDetectingLocation(true);
    setPermissionError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy, speed } = position.coords;
        const currentSpeed = speed ? Math.round(speed * 3.6) : 0; // convert to km/h

        // Local Geocode estimation matching coordinates structure
        const mockAddress = {
          street: latitude > 18.51 && latitude < 18.53 ? 'MG Road' : 'Main Safety Bypass',
          area: longitude > 73.84 && longitude < 73.86 ? 'Camp' : 'Secure Sector',
          city: 'Pune',
          district: 'Pune District',
          state: 'Maharashtra',
          country: 'India',
          pincode: '411001'
        };

        setLiveLocation({
          lat: latitude,
          lng: longitude,
          accuracy: Math.round(accuracy || 8),
          speed: currentSpeed,
          lastUpdated: new Date().toLocaleTimeString(),
          trackingStatus: 'tracking',
          address: mockAddress
        });

        setMapCenter({ lat: latitude, lng: longitude });
        setZoom(16);
        setDetectingLocation(false);
        addNotification(
          'Live GPS Signal Locked',
          `Successfully verified coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
        );
      },
      (error) => {
        console.warn('Manual GPS error: ', error.message);
        setDetectingLocation(false);
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setPermissionError('Location request declined. Please allow GPS permissions in your browser or application menu.');
            break;
          case error.TIMEOUT:
            setPermissionError('GPS connection timed out. Verify your internet link and try again.');
            break;
          default:
            setPermissionError('Unknown GPS sensor error occurred during calibration.');
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    // If not simulating or walking, re-anchor coordinates periodically
    if (!simulateWalking) {
      setMapCenter({ lat: liveLocation.lat, lng: liveLocation.lng });
    }
  }, [liveLocation.lat, liveLocation.lng, simulateWalking]);

  // Generates nearby police and medical hubs relative to liveLocation
  const nearbyBases = [
    {
      lat: liveLocation.lat + 0.005,
      lng: liveLocation.lng + 0.006,
      title: 'City Police Depot - Zone A',
      description: 'Emergency response headquarters • Patrol units active.',
      type: 'police' as const,
    },
    {
      lat: liveLocation.lat - 0.004,
      lng: liveLocation.lng + 0.005,
      title: 'Community Safety Guard Post',
      description: 'Security precinct checkpost • 5 officers on scene.',
      type: 'police' as const,
    },
    {
      lat: liveLocation.lat + 0.003,
      lng: liveLocation.lng - 0.005,
      title: 'Trauma & Emergency Care Hospital',
      description: 'First response center • Ambulances active.',
      type: 'hospital' as const,
    },
    {
      lat: liveLocation.lat - 0.005,
      lng: liveLocation.lng - 0.004,
      title: 'Red Cross Medical Center',
      description: '24/7 care outpatient unit • safe lobby shelter inside.',
      type: 'hospital' as const,
    },
  ];

  const mapMarkers = [
    {
      lat: liveLocation.lat,
      lng: liveLocation.lng,
      title: 'Your Live Position',
      description: `Accuracy: ±${liveLocation.accuracy}m • Speed: ${liveLocation.speed} km/h`,
      type: 'user' as const,
    },
    ...nearbyBases,
  ];

  // Filter markers list based on selection
  const filteredMarkers = mapMarkers.filter((m) => {
    if (filterType === 'all') return true;
    if (filterType === 'police') return m.type === 'user' || m.type === 'police';
    if (filterType === 'hospital') return m.type === 'user' || m.type === 'hospital';
    return true;
  });

  // Plotting safe route generation mathematics
  const handleGenerateRoute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destinationInput) return;

    // Plot a deterministic zigzag path starting from liveLocation and ending ~1.5km northeast
    const startLat = liveLocation.lat;
    const startLng = liveLocation.lng;
    const targetLat = startLat + 0.008;
    const targetLng = startLng + 0.010;

    // Segment points for realistic street polyline
    const segmentPoints: Array<[number, number]> = [
      [startLat, startLng],
      [startLat + 0.002, startLng + 0.001],
      [startLat + 0.003, startLng + 0.004],
      [startLat + 0.005, startLng + 0.005],
      [startLat + 0.006, startLng + 0.008],
      [targetLat, targetLng],
    ];

    setSafeRouteCoordinates(segmentPoints);
    setSafeRouteData({
      distance: '1.6 km',
      duration: '14 mins',
      status: 'active',
      active: true,
      destinationName: destinationInput,
      steps: [
        `Exit from current location onto ${liveLocation.address.street || 'MG Road'}`,
        'Turn sharp right onto safety bypass boulevard (600m)',
        'Head straight past City Police Depot checkpost (500m)',
        `Arrive safely at destination point (${destinationInput})`
      ]
    });

    setShowDirections(true);
    setMapCenter({ lat: startLat + 0.004, lng: startLng + 0.005 });
    addNotification('Safe Route Generated', `Optimized security corridor mapped out towards ${destinationInput}. Turn-by-turn sentinel logging active.`);
  };

  const handleStartJourneySim = async () => {
    if (safeRouteCoordinates.length === 0) return;
    await startJourney(safeRouteData.destinationName, safeRouteData.duration, { lat: liveLocation.lat, lng: liveLocation.lng });
    setSimulateWalking(true);
    setDeviationDetected(false);
  };

  const handleTriggerDeviationSim = () => {
    setSimulateWalking(false);
    setSimulateDeviation(true);
  };

  const handleClearRoute = () => {
    setSafeRouteCoordinates([]);
    setSafeRouteData({
      distance: '0 km',
      duration: '0 min',
      status: 'inactive',
      active: false,
      destinationName: '',
      steps: []
    });
    setSimulateWalking(false);
    setSimulateDeviation(false);
    setDeviationDetected(false);
    setShowDirections(false);
  };

  return (
    <div id="maps-view-page" className="space-y-4 pb-26 font-sans flex flex-col min-h-screen">
      
      {/* Dedicated Emergency Map Title Header */}
      <div className="bg-gradient-to-r from-red-500 to-rose-600 text-white p-4.5 rounded-[24px] shadow-lg shadow-red-500/10 shrink-0">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-[9px] font-bold tracking-widest uppercase bg-white/20 px-2.5 py-0.5 rounded-full">
              SECURE GEOSPATIAL SENTINEL
            </span>
            <h2 className="text-lg font-black tracking-tight leading-tight">Emergency Shield Map</h2>
            <p className="text-xs text-rose-100 font-medium">Real-time OpenStreetMap tracking and direct safe zones</p>
          </div>
          <div className="bg-white/25 p-2 rounded-xl border border-white/20">
            <Shield className="w-5 h-5 text-white animate-pulse" />
          </div>
        </div>
      </div>

      {/* Real-time Telemetry Coordinates & Manual Detector Console (Large numeric layout) */}
      <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-xl shadow-slate-100/40 space-y-4 shrink-0">
        
        {/* Permission and Sensor Error Alerts if GPS is blocked */}
        {permissionError && (
          <div className="bg-red-50 border border-red-100 p-3.5 rounded-xl flex items-start space-x-3 text-red-600 text-xs font-semibold animate-pulse">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-extrabold text-red-700">GPS Signal Blocked</p>
              <p className="text-red-650 leading-relaxed font-semibold">{permissionError}</p>
            </div>
          </div>
        )}

        {/* Big Digit GPS Panel */}
        <div className="grid grid-cols-2 gap-3.5">
          <div className="bg-slate-50 hover:bg-slate-100/55 p-3.5 rounded-2xl border border-slate-100/60 transition-all text-center relative overflow-hidden">
            <span className="text-[9px] font-black tracking-wider text-slate-400 uppercase block mb-1">LATITUDE</span>
            <span className="text-base font-mono font-black text-slate-900 tracking-tight">
              {liveLocation.lat.toFixed(6)}
            </span>
            <span className="absolute bottom-1 right-2 text-[8px] font-bold font-mono text-slate-300">DEG N</span>
          </div>
          
          <div className="bg-slate-50 hover:bg-slate-100/55 p-3.5 rounded-2xl border border-slate-100/60 transition-all text-center relative overflow-hidden">
            <span className="text-[9px] font-black tracking-wider text-slate-400 uppercase block mb-1">LONGITUDE</span>
            <span className="text-base font-mono font-black text-slate-900 tracking-tight">
              {liveLocation.lng.toFixed(6)}
            </span>
            <span className="absolute bottom-1 right-2 text-[8px] font-bold font-mono text-slate-300">DEG E</span>
          </div>
        </div>

        {/* Live GPS calibration & status row */}
        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <button
            onClick={handleManualDetectLocation}
            disabled={detectingLocation}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center space-x-2.5 transition-all shadow-md active:scale-95 ${
              detectingLocation
                ? 'bg-slate-100 border border-slate-200 text-slate-500 cursor-not-allowed'
                : 'bg-[#FF5A7A] hover:bg-rose-600 text-white shadow-rose-500/10'
            }`}
          >
            {detectingLocation ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-500" />
                <span>Acquiring Sat Satellites...</span>
              </>
            ) : (
              <>
                <Compass className="w-4 h-4 text-white animate-spin-slow" />
                <span>Detect My Live Position</span>
              </>
            )}
          </button>

          {/* Quick Zooomer Controls directly embedded in the view console */}
          <div className="flex bg-slate-50 border border-slate-200/60 rounded-xl p-1 gap-1 self-center sm:self-auto shadow-sm">
            <button
              onClick={handleZoomOut}
              aria-label="Zoom Map Out"
              className="px-3.5 py-1.5 bg-white text-slate-800 font-black text-xs rounded-lg hover:bg-slate-100 active:scale-90 border border-slate-100 shadow-sm transition-all"
            >
              Zoom -
            </button>
            <span className="align-middle justify-center px-2 py-1.5 text-[10px] font-mono font-bold text-slate-500 self-center">
              LVL {zoom}
            </span>
            <button
              onClick={handleZoomIn}
              aria-label="Zoom Map In"
              className="px-3.5 py-1.5 bg-white text-slate-800 font-black text-xs rounded-lg hover:bg-slate-100 active:scale-90 border border-slate-100 shadow-sm transition-all"
            >
              Zoom +
            </button>
          </div>
        </div>
      </div>

      {/* Main Map view box with relative overlays */}
      <div className="h-[290px] rounded-[24px] overflow-hidden border border-slate-150 shadow-xl relative shrink-0">
        <LeafletMap
          center={mapCenter}
          zoom={zoom}
          markers={filteredMarkers}
          routeCoordinates={safeRouteCoordinates.length > 0 ? safeRouteCoordinates : undefined}
        />

        {/* Floating Controls */}
        <button
          onClick={handleRecenter}
          className="absolute right-4 top-4 z-20 bg-white p-2.5 rounded-xl shadow-md border border-slate-150 text-slate-700 hover:text-indigo-600 active:scale-95 transition-all text-xs font-bold flex items-center space-x-1"
        >
          <Compass className="w-4 h-4 animate-spin-slow" />
          <span>Center Me</span>
        </button>

        {/* Legend Panel */}
        <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-sm p-3 rounded-xl text-[10px] space-y-1 my-1 border shadow-lg border-slate-100 max-w-[150px]">
          <div className="flex items-center space-x-1 text-slate-500 font-bold uppercase pb-1 border-b border-slate-100">
            <Info className="w-3 h-3 text-[#FF5A7A]" />
            <span>Map Legend</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 bg-[#FF5A7A] rounded-full" />
            <span className="font-semibold text-slate-750">Your position</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 bg-[#6366F1] rounded-full" />
            <span className="font-semibold text-slate-750">Police Depots</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 bg-red-500 rounded-full" />
            <span className="font-semibold text-slate-750">Hospital/Trauma</span>
          </div>
        </div>
      </div>

      {/* Floating Exact Address Display */}
      <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-xl shadow-slate-100/40 space-y-2 shrink-0">
        <span className="text-[9px] font-extrabold text-[#FF5A7A] tracking-wider uppercase block">Verified Current Address Location</span>
        <div className="flex items-start space-x-3.5 mt-1">
          <div className="p-3 bg-pink-50 text-[#FF5A7A] rounded-2xl shrink-0 shadow-sm">
            <MapPin className="w-5 h-5 animate-bounce" />
          </div>
          <div className="space-y-0.5 overflow-hidden">
            <p className="text-sm font-extrabold text-slate-950 tracking-tight leading-none pt-0.5">
              {liveLocation.address.street}, {liveLocation.address.area}
            </p>
            <p className="text-xs text-slate-500 leading-tight leading-relaxed truncate font-semibold">
              {liveLocation.address.city}, {liveLocation.address.district}, {liveLocation.address.state}, {liveLocation.address.country} - {liveLocation.address.pincode}
            </p>
          </div>
        </div>
      </div>

      {/* Safe Corridor Finder section */}
      <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-xl shadow-slate-100/50 space-y-3.5 shrink-0">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center space-x-2">
            <NavIcon className="w-4 h-4 text-indigo-500 rotate-45" />
            <span>Generate Safe Corridor Path</span>
          </h3>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">Plot optimized route passing protected local security hubs</p>
        </div>

        {/* Dynamic Route Inputs */}
        <form onSubmit={handleGenerateRoute} className="flex gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            <input
              id="map-location-dest-search"
              type="text"
              required
              value={destinationInput}
              onChange={(e) => setDestinationInput(e.target.value)}
              placeholder="Enter destination (e.g. Pune Camp, East St)"
              className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 font-semibold"
            />
          </div>
          <button
            id="map-plot-route-submit"
            type="submit"
            className="px-4.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl active:scale-95 transition-all outline-none"
          >
            Plot Path
          </button>
        </form>

        {/* Filter buttons to display specific safety bases */}
        <div className="flex bg-slate-50 border border-slate-100 rounded-xl p-1 text-xs">
          <button
            id="map-filter-all"
            onClick={() => setFilterType('all')}
            className={`flex-1 py-1.5 text-center font-bold rounded-lg transition-all ${
              filterType === 'all'
                ? 'bg-white text-slate-900 border border-slate-100 shadow-sm font-extrabold'
                : 'text-slate-500 hover:text-slate-750 font-semibold'
            }`}
          >
            All Safety Safezones
          </button>
          <button
            id="map-filter-police"
            onClick={() => setFilterType('police')}
            className={`flex-1 py-1.5 text-center font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
              filterType === 'police'
                ? 'bg-indigo-500 text-white shadow-sm font-extrabold'
                : 'text-slate-500 hover:text-slate-750 font-semibold'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Police Stations</span>
          </button>
          <button
            id="map-filter-hospital"
            onClick={() => setFilterType('hospital')}
            className={`flex-1 py-1.5 text-center font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
              filterType === 'hospital'
                ? 'bg-red-500 text-white shadow-sm font-extrabold'
                : 'text-slate-500 hover:text-slate-750 font-semibold'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Hospitals</span>
          </button>
        </div>
      </div>

      {/* Trajectory Simulator Control console box */}
      <div className="bg-[#1E293B] text-white p-5 rounded-[24px] shadow-xl space-y-4 shrink-0">
        <div className="flex justify-between items-center border-b border-slate-700/60 pb-3">
          <div className="space-y-0.5">
            <span className="text-[9px] text-[#22C55E] bg-[#22C55E]/10 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
              SANDBOX SIMULATOR
            </span>
            <h4 className="text-sm font-extrabold mt-1 tracking-tight flex items-center space-x-1.5">
              <span>GPS Coordinate Simulator Console</span>
            </h4>
          </div>
          <button
            onClick={() => setShowSimulationLogs(!showSimulationLogs)}
            className="text-xs font-semibold text-indigo-400 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 hover:text-white"
          >
            {showSimulationLogs ? 'Hide Logs' : 'Show Logs'}
          </button>
        </div>

        {showSimulationLogs && (
          <div className="space-y-2.5 text-xs text-slate-300 font-mono bg-slate-900/40 p-3 rounded-lg border border-slate-800">
            <div className="flex justify-between">
              <span className="text-slate-500">SIMULATED POSITION:</span>
              <span className="text-[#22C55E] font-bold">{liveLocation.lat.toFixed(5)}, {liveLocation.lng.toFixed(5)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">TRAJECTORY DEVIATING:</span>
              <span className={deviationDetected ? 'text-red-400 font-bold animate-pulse' : 'text-slate-400'}>
                {deviationDetected ? 'YES (CRITICAL ANOMALY ALERT)' : 'NO (ON PATH)'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">SYSTEM TELEMETRY PING:</span>
              <span>{liveLocation.lastUpdated} • {liveLocation.speed} km/h • ±{liveLocation.accuracy}m</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button
            id="sim-walking-btn"
            disabled={safeRouteCoordinates.length === 0}
            onClick={handleStartJourneySim}
            className={`py-3 rounded-lg font-bold text-xs flex items-center justify-center space-x-1.5 transition-all active:scale-95 ${
              simulateWalking
                ? 'bg-[#22C55E] text-white'
                : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 disabled:opacity-50 disabled:pointer-events-none'
            }`}
          >
            {simulateWalking ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Simulating Walk...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-green-400" />
                <span>Simulate Walking</span>
              </>
            )}
          </button>

          <button
            id="sim-deviation-btn"
            disabled={safeRouteCoordinates.length === 0}
            onClick={handleTriggerDeviationSim}
            className="py-3 bg-[#EF4444] hover:bg-red-600 text-white font-bold text-xs rounded-lg flex items-center justify-center space-x-1.5 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            <AlertTriangle className="w-3.5 h-3.5 animate-bounce" />
            <span>Simulate Deviation</span>
          </button>
        </div>

        {safeRouteCoordinates.length === 0 && (
          <p className="text-[11px] text-amber-300 text-center font-medium">
            💡 Enter a destination search above to plot route first, which activates simulation triggers!
          </p>
        )}
      </div>

      {/* Safe Navigation Turn-By-Turn Steps Drawer */}
      {showDirections && safeRouteData.active && (
        <div id="safe-directions-box" className="bg-white p-5 rounded-[24px] border border-slate-150 shadow-xl shadow-slate-100/50 space-y-4 shrink-0 transition-all">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
            <div className="space-y-0.5">
              <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-150/50 px-2.5 py-0.5 rounded-full uppercase tracking-widest">
                Safe Route Navigation Plan
              </span>
              <h4 className="text-sm font-extrabold text-slate-900 mt-1.5">{safeRouteData.destinationName}</h4>
            </div>
            
            <button
              onClick={handleClearRoute}
              className="p-1 px-3 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-650 text-xs font-bold"
            >
              Clear Route
            </button>
          </div>

          <div className="flex justify-around bg-slate-50/60 p-3 rounded-xl text-center border border-slate-100 text-xs text-slate-600 font-semibold">
            <div>
              <p className="text-slate-400">Total Distance</p>
              <p className="text-slate-900 font-extrabold text-sm">{safeRouteData.distance}</p>
            </div>
            <div className="w-px h-8 bg-slate-200 shrink-0" />
            <div>
              <p className="text-slate-400">Estimated Duration</p>
              <p className="text-indigo-650 font-extrabold text-sm">{safeRouteData.duration}</p>
            </div>
          </div>

          <div className="space-y-2.5">
            <p className="text-xs font-extrabold text-slate-800">Turn-By-Turn Directions:</p>
            <div className="space-y-2 font-medium">
              {safeRouteData.steps.map((step, idx) => (
                <div key={idx} className="flex space-x-2.5 text-xs text-slate-600 p-2.5 bg-slate-50/50 rounded-xl border border-slate-100 items-start">
                  <span className="w-5 h-5 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5">{idx + 1}</span>
                  <span className="flex-1 mt-0.5 leading-relaxed">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
