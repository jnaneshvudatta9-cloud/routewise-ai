import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Location, Stop, GeoJSON, TrafficAnalysisResult } from '../../types';

// Fix default Leaflet icon issue
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom colored icons
function createColoredIcon(color: string, label?: string): L.DivIcon {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
      <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 26 14 26S28 24.5 28 14C28 6.27 21.73 0 14 0z" fill="${color}" stroke="white" stroke-width="2"/>
      ${label ? `<text x="14" y="18" text-anchor="middle" fill="white" font-size="11" font-weight="bold" font-family="Arial">${label}</text>` : ''}
    </svg>
  `;
  return L.divIcon({
    html: svg,
    iconSize: [28, 40],
    iconAnchor: [14, 40],
    popupAnchor: [0, -40],
    className: '',
  });
}

const priorityColors: Record<string, string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#22c55e',
};

const startIcon = createColoredIcon('#4f46e5');

// Component to fit map bounds
function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [map, positions]);
  return null;
}

interface RouteMapProps {
  startLocation: Location | null;
  stops: Stop[];
  originalGeometry?: GeoJSON | null;
  optimizedGeometry?: GeoJSON | null;
  trafficResult?: TrafficAnalysisResult | null;
  selectedAlternativeId?: string | null;
  viewMode: 'both' | 'optimized' | 'original';
  onChangeViewMode: (mode: 'both' | 'optimized' | 'original') => void;
}

export function RouteMap({
  startLocation,
  stops,
  originalGeometry,
  optimizedGeometry,
  trafficResult,
  selectedAlternativeId,
  viewMode,
  onChangeViewMode,
}: RouteMapProps) {
  const defaultCenter: [number, number] = [17.3850, 78.4867]; // Hyderabad center

  const allPositions: [number, number][] = [];
  if (startLocation) {
    allPositions.push([startLocation.lat, startLocation.lon]);
  }
  stops.forEach((s) => {
    if (s.lat && s.lon) allPositions.push([s.lat, s.lon]);
  });

  const geometryToLatLngs = (geo: GeoJSON): [number, number][] =>
    geo.coordinates.map(([lon, lat]) => [lat, lon]);

  const hasRoute = Boolean(originalGeometry || optimizedGeometry);

  const showOriginal = Boolean(originalGeometry && (viewMode === 'both' || viewMode === 'original'));
  const showOptimized = Boolean(optimizedGeometry && (viewMode === 'both' || viewMode === 'optimized'));

  // Selected alternative or primary traffic geometry
  const selectedAlt = trafficResult?.alternativeRoutes?.find((a) => a.id === selectedAlternativeId);
  const activeTrafficGeometry = selectedAlt ? selectedAlt.geometry : trafficResult?.geometry;

  return (
    <div className="relative w-full h-full min-h-[500px]">
      {/* Route Mode Switcher: Separate Original / Optimised / Both */}
      {hasRoute && (
        <div className="absolute top-4 right-4 z-[1000] flex bg-white/95 backdrop-blur-sm p-1 rounded-xl shadow-lg border border-gray-200 text-xs font-semibold">
          <button
            type="button"
            onClick={() => onChangeViewMode('optimized')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'optimized'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            🌿 Optimized Route Only (Green)
          </button>
          <button
            type="button"
            onClick={() => onChangeViewMode('original')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'original'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            🛑 Original Route Only (Red)
          </button>
          <button
            type="button"
            onClick={() => onChangeViewMode('both')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'both'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            ⚖️ Compare Both
          </button>
        </div>
      )}

      {/* Legend */}
      {hasRoute && (
        <div className="absolute bottom-6 left-4 z-[1000] bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-3 text-xs space-y-1.5 min-w-[190px]">
          <div className="font-semibold text-gray-700 pb-1 border-b border-gray-100">
            Active Map Colors
          </div>
          {showOptimized && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-1.5 bg-emerald-600 rounded-full" />
              <span className="font-medium text-emerald-800">Optimized Route (Green)</span>
            </div>
          )}
          {showOriginal && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-1.5 bg-red-600 rounded-full" />
              <span className="font-medium text-red-700">Original Route (Red)</span>
            </div>
          )}
          {trafficResult && trafficResult.trafficAvailable && (
            <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
              <div className={`w-6 h-1.5 rounded-full ${
                trafficResult.congestionLevel === 'heavy' ? 'bg-amber-600' :
                trafficResult.congestionLevel === 'moderate' ? 'bg-amber-500' : 'bg-blue-600'
              }`} />
              <span className="font-medium text-gray-700">
                {trafficResult.congestionLevel === 'heavy' || trafficResult.congestionLevel === 'moderate'
                  ? 'Traffic Congestion (Orange)'
                  : 'Live Freeflow (Blue)'}
              </span>
            </div>
          )}
        </div>
      )}

      <MapContainer
        center={allPositions.length > 0 ? allPositions[0] : defaultCenter}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {allPositions.length > 0 && <FitBounds positions={allPositions} />}

        {/* Start marker */}
        {startLocation && startLocation.lat !== 0 && (
          <Marker position={[startLocation.lat, startLocation.lon]} icon={startIcon}>
            <Popup>
              <div className="font-semibold text-indigo-700">🚀 Starting Warehouse / Hub</div>
              <div className="text-xs text-gray-600 mt-0.5">{startLocation.name}</div>
            </Popup>
          </Marker>
        )}

        {/* Stop markers */}
        {stops.map((stop, index) => {
          if (!stop.lat || !stop.lon) return null;
          return (
            <Marker
              key={stop.id}
              position={[stop.lat, stop.lon]}
              icon={createColoredIcon(priorityColors[stop.priority], String(index + 1))}
            >
              <Popup>
                <div className="font-medium">Stop {index + 1}</div>
                <div className="text-xs text-gray-600">{stop.name}</div>
                <div className={`text-xs mt-1 font-semibold ${
                  stop.priority === 'high' ? 'text-red-600' :
                  stop.priority === 'medium' ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {stop.priority.toUpperCase()} PRIORITY
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Original Route Polyline - In RED */}
        {showOriginal && originalGeometry && (
          <Polyline
            positions={geometryToLatLngs(originalGeometry)}
            color="#ef4444"
            weight={viewMode === 'both' ? 4 : 5.5}
            opacity={viewMode === 'both' ? 0.75 : 0.95}
            dashArray={viewMode === 'both' ? '8, 8' : undefined}
          />
        )}

        {/* Optimized Route Polyline - In GREEN */}
        {showOptimized && optimizedGeometry && (
          <Polyline
            positions={geometryToLatLngs(optimizedGeometry)}
            color="#16a34a"
            weight={viewMode === 'both' ? 5 : 6}
            opacity={0.95}
          />
        )}

        {/* Live Traffic Overlay Polyline (Orange for congestion, Blue for active live flow) */}
        {trafficResult && activeTrafficGeometry && (
          <Polyline
            positions={geometryToLatLngs(activeTrafficGeometry)}
            color={
              trafficResult.trafficAvailable
                ? trafficResult.congestionLevel === 'heavy' || trafficResult.congestionLevel === 'moderate'
                  ? '#ea580c' // Orange for traffic delay/congestion
                  : '#2563eb' // Blue for live flow
                : '#3b82f6'
            }
            weight={6.5}
            opacity={0.88}
          />
        )}

        {/* Unselected Alternatives (subtle dashed emerald) */}
        {trafficResult?.alternativeRoutes?.map((alt) => {
          if (selectedAlternativeId === alt.id || !alt.geometry) return null;
          return (
            <Polyline
              key={alt.id}
              positions={geometryToLatLngs(alt.geometry)}
              color="#10b981"
              weight={3.5}
              opacity={0.5}
              dashArray="4, 6"
            />
          );
        })}
      </MapContainer>
    </div>
  );
}
