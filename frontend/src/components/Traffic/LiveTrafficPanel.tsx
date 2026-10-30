import React from 'react';
import {
  Radio,
  Clock,
  Navigation,
  RefreshCw,
  GitBranch,
  ShieldAlert,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import type { TrafficAnalysisResult } from '../../types';

interface LiveTrafficPanelProps {
  traffic: TrafficAnalysisResult | null;
  isLoading: boolean;
  routingMode: 'traffic-aware' | 'standard';
  selectedAlternativeId: string | null;
  onRefreshTraffic: () => void;
  onSelectAlternative: (id: string | null) => void;
  onToggleRoutingMode: (mode: 'traffic-aware' | 'standard') => void;
}

export function LiveTrafficPanel({
  traffic,
  isLoading,
  routingMode,
  selectedAlternativeId,
  onRefreshTraffic,
  onSelectAlternative,
  onToggleRoutingMode,
}: LiveTrafficPanelProps) {

  const isTrafficLive = traffic?.trafficAvailable && traffic.routingMode === 'traffic-aware';

  // Congestion visual badge (only when provided)
  const getCongestionBadge = () => {
    if (!isTrafficLive || !traffic?.congestionLevel || traffic.congestionLevel === 'unknown') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
          <Clock className="w-3.5 h-3.5" />
          Standard Freeflow
        </span>
      );
    }

    if (traffic.congestionLevel === 'heavy') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
          <ShieldAlert className="w-3.5 h-3.5" />
          Heavy Congestion
        </span>
      );
    }

    if (traffic.congestionLevel === 'moderate') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
          <Zap className="w-3.5 h-3.5" />
          Moderate Congestion
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
        <ShieldCheck className="w-3.5 h-3.5" />
        Light Traffic
      </span>
    );
  };

  return (
    <div className="card overflow-hidden border border-indigo-100 shadow-sm">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-bold tracking-wide flex items-center gap-1.5">
              LIVE TRAFFIC INTELLIGENCE
            </h4>
            <p className="text-[11px] text-gray-300">
              Provider: {traffic?.provider || 'Mapbox Driving-Traffic'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onRefreshTraffic}
          disabled={isLoading}
          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white disabled:opacity-50 transition-colors"
          title="Refresh live traffic data"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Mode Selector Toggle */}
        <div className="flex bg-gray-100 p-1 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => onToggleRoutingMode('traffic-aware')}
            className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              routingMode === 'traffic-aware'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            Traffic-Aware Routing
          </button>
          <button
            type="button"
            onClick={() => onToggleRoutingMode('standard')}
            className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              routingMode === 'standard'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            Standard Road Routing
          </button>
        </div>

        {/* Notice/Fallback message if applicable */}
        {traffic && !traffic.trafficAvailable && (
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 leading-relaxed">
            <span className="font-semibold">Notice:</span> {traffic.message || 'Live traffic coverage is not currently available for this route. Standard road network calculations are being displayed.'}
          </div>
        )}

        {/* Traffic Metrics Dashboard */}
        {traffic ? (
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
              <div className="text-[11px] text-gray-500 font-medium">Traffic-Aware ETA</div>
              <div className="text-lg font-bold text-gray-900 mt-0.5">
                {traffic.trafficDurationMinutes} min
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5">{traffic.distanceKm} km</div>
            </div>

            <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
              <div className="text-[11px] text-gray-500 font-medium">Typical / Baseline ETA</div>
              <div className="text-lg font-bold text-gray-700 mt-0.5">
                {traffic.typicalDurationMinutes !== undefined
                  ? `${traffic.typicalDurationMinutes} min`
                  : 'N/A'}
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5">Free-flow estimate</div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-gray-50 border border-dashed border-gray-200 rounded-xl text-center">
            <div className="text-xs text-gray-500">
              {isLoading ? 'Fetching live traffic intelligence...' : 'Click refresh above to analyze live traffic conditions.'}
            </div>
          </div>
        )}

        {/* Delay & Congestion status */}
        {traffic && (
          <div className="flex items-center justify-between pt-1 pb-2 border-b border-gray-100">
            <div>
              <div className="text-xs text-gray-500">Estimated Traffic Delay</div>
              <div className="text-sm font-bold text-gray-900 mt-0.5">
                {traffic.estimatedDelayMinutes !== undefined && traffic.estimatedDelayMinutes > 0 ? (
                  <span className="text-red-600 font-semibold">
                    +{traffic.estimatedDelayMinutes} min delay
                  </span>
                ) : (
                  <span className="text-emerald-600 font-medium">0 min (Minimal delay)</span>
                )}
              </div>
            </div>
            <div>{getCongestionBadge()}</div>
          </div>
        )}

        {/* Alternative Routes Selection */}
        {traffic && traffic.alternativeRoutes && traffic.alternativeRoutes.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
              <GitBranch className="w-3.5 h-3.5 text-indigo-600" />
              <span>Alternative Routes ({traffic.alternativeRoutes.length})</span>
            </div>

            <div className="space-y-1.5">
              {/* Primary Recommended Route */}
              <button
                type="button"
                onClick={() => onSelectAlternative(null)}
                className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all flex items-center justify-between ${
                  selectedAlternativeId === null
                    ? 'border-indigo-500 bg-indigo-50/70 font-semibold text-indigo-900'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    <span>Recommended Primary Route</span>
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5 ml-3.5">
                    {traffic.distanceKm} km · {traffic.trafficDurationMinutes} min
                  </div>
                </div>
                {selectedAlternativeId === null && (
                  <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                    Selected
                  </span>
                )}
              </button>

              {/* Alternative Routes list */}
              {traffic.alternativeRoutes.map((alt) => (
                <button
                  key={alt.id}
                  type="button"
                  onClick={() => onSelectAlternative(alt.id)}
                  className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all flex items-center justify-between ${
                    selectedAlternativeId === alt.id
                      ? 'border-indigo-500 bg-indigo-50/70 font-semibold text-indigo-900'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>{alt.summary || alt.id.toUpperCase()}</span>
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5 ml-3.5">
                      {alt.distanceKm} km · {alt.durationMinutes} min
                      {alt.delayMinutes !== undefined && alt.delayMinutes > 0 && (
                        <span className="text-red-500 ml-1.5">+{alt.delayMinutes}m delay</span>
                      )}
                    </div>
                  </div>
                  {selectedAlternativeId === alt.id && (
                    <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                      Selected
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

