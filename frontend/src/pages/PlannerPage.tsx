import React, { useState } from 'react';
import { Layout } from '../components/Layout/Layout';
import { RouteMap } from '../components/Map/RouteMap';
import { StopList } from '../components/Stops/StopList';
import { AddressSearch } from '../components/Stops/AddressSearch';
import { VehicleConfig } from '../components/Vehicle/VehicleConfig';
import { RouteComparison } from '../components/Route/RouteComparison';
import { GeminiExplanation } from '../components/Route/GeminiExplanation';
import { LiveTrafficPanel } from '../components/Traffic/LiveTrafficPanel';
import { useRouteStore } from '../store/routeStore';
import {
  Zap,
  Save,
  FlaskConical,
  MapPin,
  AlertCircle,
  CheckCircle,
  X,
} from 'lucide-react';

export function PlannerPage() {
  const {
    startLocation,
    stops,
    optimizationResult,
    isOptimizing,
    error,
    explanation,
    isExplaining,
    explainRoute,
    setStartLocation,
    optimize,
    saveRoute,
    loadDemoData,
    clearError,
    clearResults,
    trafficResult,
    isLoadingTraffic,
    trafficRoutingMode,
    selectedAlternativeId,
    analyzeTraffic,
    setTrafficRoutingMode,
    setSelectedAlternativeId,
  } = useRouteStore();

  const [viewMode, setViewMode] = useState<'both' | 'optimized' | 'original'>('optimized');
  const [routeName, setRouteName] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showSaveInput, setShowSaveInput] = useState(false);

  const handleOptimize = async () => {
    clearResults();
    await optimize();
    if (useRouteStore.getState().optimizationResult) {
      setViewMode('optimized');
    }
  };

  const handleSave = async () => {
    if (!routeName.trim()) return;
    setSaveStatus('saving');
    try {
      await saveRoute(routeName.trim());
      setSaveStatus('saved');
      setShowSaveInput(false);
      setRouteName('');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const canOptimize = startLocation && stops.length >= 2 && stops.every((s) => s.lat !== 0);

  return (
    <Layout>
      <div className="flex h-[calc(100vh-64px)] overflow-hidden">
        {/* Left Panel */}
        <div className="w-full lg:w-96 xl:w-[420px] shrink-0 overflow-y-auto border-r border-gray-200 bg-white">
          <div className="p-4 space-y-5">
            {/* Error banner */}
            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span className="flex-1">{error}</span>
                <button onClick={clearError} className="shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Save success banner */}
            {saveStatus === 'saved' && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
                <CheckCircle className="w-4 h-4 shrink-0" />
                Route saved successfully!
              </div>
            )}

            {/* Start Location */}
            <div className="card p-4 space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-semibold text-gray-900">Starting Location</h3>
              </div>
              <AddressSearch
                placeholder="Enter your warehouse or starting address..."
                value={startLocation?.name ?? ''}
                onSelect={(loc) => setStartLocation(loc)}
              />
              {startLocation && (
                <p className="text-xs text-gray-500">
                  📍 {startLocation.lat.toFixed(5)}, {startLocation.lon.toFixed(5)}
                </p>
              )}
            </div>

            {/* Vehicle Config */}
            <VehicleConfig />

            {/* Stop List */}
            <div className="card p-4">
              <StopList />
            </div>

            {/* Action buttons */}
            <div className="space-y-2">
              {/* Demo button */}
              <button
                type="button"
                onClick={loadDemoData}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border-2 border-dashed border-indigo-300 text-indigo-600 text-sm font-medium hover:bg-indigo-50 transition-colors"
              >
                <FlaskConical className="w-4 h-4" />
                Load Demo Data (Hyderabad)
              </button>

              {/* Optimize button */}
              <button
                type="button"
                onClick={handleOptimize}
                disabled={!canOptimize || isOptimizing}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {isOptimizing ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Optimizing Route...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Optimize Route
                  </>
                )}
              </button>

              {!canOptimize && !isOptimizing && (
                <p className="text-xs text-center text-gray-400">
                  {!startLocation
                    ? 'Set a starting location to continue'
                    : stops.length < 2
                    ? 'Add at least 2 delivery stops'
                    : 'Make sure all stops have valid addresses'}
                </p>
              )}
            </div>

            {/* Route Results */}
            {optimizationResult && (
              <>
                {/* Live Traffic Intelligence Panel */}
                <LiveTrafficPanel
                  traffic={trafficResult}
                  isLoading={isLoadingTraffic}
                  routingMode={trafficRoutingMode}
                  selectedAlternativeId={selectedAlternativeId}
                  onRefreshTraffic={analyzeTraffic}
                  onSelectAlternative={setSelectedAlternativeId}
                  onToggleRoutingMode={setTrafficRoutingMode}
                />

                <div className="border-t border-gray-100 pt-4">
                  <RouteComparison result={optimizationResult} />
                </div>

                {/* Gemini Explanation */}
                <GeminiExplanation
                  explanation={explanation}
                  isExplaining={isExplaining}
                  onExplain={explainRoute}
                  hasResult={!!optimizationResult}
                />

                {/* Save Route */}
                <div className="card p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Save className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-sm font-semibold text-gray-900">Save Route</h3>
                  </div>

                  {!showSaveInput ? (
                    <button
                      type="button"
                      onClick={() => setShowSaveInput(true)}
                      className="w-full py-2 px-3 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors text-left"
                    >
                      Click to name and save this route...
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={routeName}
                        onChange={(e) => setRouteName(e.target.value)}
                        placeholder="Route name..."
                        className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={!routeName.trim() || saveStatus === 'saving'}
                        className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                      >
                        {saveStatus === 'saving' ? '...' : <Save className="w-4 h-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowSaveInput(false); setRouteName(''); }}
                        className="px-3 py-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Panel — Map */}
        <div className="flex-1 overflow-hidden bg-gray-100">
          <RouteMap
            startLocation={startLocation}
            stops={stops}
            originalGeometry={optimizationResult?.original.geometry ?? null}
            optimizedGeometry={optimizationResult?.optimized.geometry ?? null}
            trafficResult={trafficResult}
            selectedAlternativeId={selectedAlternativeId}
            viewMode={viewMode}
            onChangeViewMode={setViewMode}
          />
        </div>
      </div>
    </Layout>
  );
}

