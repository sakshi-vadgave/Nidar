/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

interface LeafletMapProps {
  center: { lat: number; lng: number };
  zoom?: number;
  markers?: Array<{
    lat: number;
    lng: number;
    title: string;
    description: string;
    type: 'user' | 'police' | 'hospital' | 'route-endpoint';
  }>;
  routeCoordinates?: Array<[number, number]>;
}

export default function LeafletMap({ center, zoom = 14, markers = [], routeCoordinates }: LeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);

  // Set up custom marker icons using SVG markup to avoid Vite leaflet asset routing issues
  const createSvgIcon = (color: string, iconHtml: string) => {
    return L.divIcon({
      html: `
        <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 36px; height: 36px; background: ${color}22; border-radius: 50%; animation: pulse 2s infinite;"></div>
          <div style="position: absolute; bottom: 0; width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 10px solid ${color}; transform: translateY(6px);"></div>
          <div style="position: relative; width: 24px; height: 24px; background: ${color}; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 6px rgba(0,0,0,0.2); border: 2.5px solid white;">
            ${iconHtml}
          </div>
        </div>
      `,
      className: 'custom-leaflet-icon',
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      popupAnchor: [0, -32],
    });
  };

  const icons = {
    user: createSvgIcon('#FF5A7A', '<div style="width: 6px; height: 6px; background: white; border-radius: 50%;"></div>'),
    police: createSvgIcon('#6366F1', '<svg viewBox="0 0 24 24" width="12" height="12" stroke="white" stroke-width="3" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>'),
    hospital: createSvgIcon('#EF4444', '<svg viewBox="0 0 24 24" width="12" height="12" stroke="white" stroke-width="3.5" fill="none"><path d="M12 5v14M5 12h14"/></svg>'),
    'route-endpoint': createSvgIcon('#22C55E', '<div style="width: 6px; height: 6px; background: white; border-radius: 50%;"></div>'),
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Create Map instance if not initialized
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [center.lat, center.lng],
        zoom: zoom,
        zoomControl: false,
      });

      // Add zoom controls to bottom-right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Add standard high-quality OpenStreetMap tiles of international safety tracking
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map);

      mapInstanceRef.current = map;
      markersLayerRef.current = L.layerGroup().addTo(map);
    } else {
      // Re-center map if center coords change
      mapInstanceRef.current.setView([center.lat, center.lng], zoom);
    }

    // Unmount cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersLayerRef.current = null;
        routeLineRef.current = null;
      }
    };
  }, []);

  // Update map center and zoom level dynamically
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([center.lat, center.lng], zoom);
    }
  }, [center.lat, center.lng, zoom]);

  // Update Marker Layer whenever markers list changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    markers.forEach((item) => {
      const selectedIcon = icons[item.type] || icons.user;
      const marker = L.marker([item.lat, item.lng], { icon: selectedIcon });
      
      const popupContent = `
        <div style="font-family: sans-serif; padding: 2px;">
          <h3 style="margin: 0 0 4px 0; font-size: 13px; font-weight: 600; color: #0F172A;">${item.title}</h3>
          <p style="margin: 0; font-size: 11px; color: #64748B;">${item.description}</p>
        </div>
      `;
      marker.bindPopup(popupContent);
      layer.addLayer(marker);
    });
  }, [markers]);

  // Update route drawing whenever routeCoordinates parameters update
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (routeLineRef.current) {
      routeLineRef.current.remove();
      routeLineRef.current = null;
    }

    if (routeCoordinates && routeCoordinates.length > 0) {
      const polyline = L.polyline(routeCoordinates, {
        color: '#6366F1',
        weight: 5,
        opacity: 0.85,
        dashArray: '1, 8', // dashed style represents active tracing
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      routeLineRef.current = polyline;

      // Fit map boundary to include the route fully
      const bounds = L.latLngBounds(routeCoordinates);
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [routeCoordinates]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-inner border border-slate-100">
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* Decorative pulse keyframes inside component structure to ensure styling */}
      <style>{`
        @keyframes pulse {
          0% {
            transform: scale(0.6);
            opacity: 1;
          }
          100% {
            transform: scale(1.4);
            opacity: 0;
          }
        }
        .custom-leaflet-icon {
          background: transparent !important;
          border: none !important;
        }
      `}</style>
    </div>
  );
}
