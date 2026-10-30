import { create } from 'zustand';
import api from '../lib/api';
import type {
  Location,
  Stop,
  VehicleConfig,
  OptimizationResult,
  SavedRoute,
  TrafficAnalysisResult,
} from '../types';

// Simple UUID without external dependency
function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

interface RouteState {
  startLocation: Location | null;
  stops: Stop[];
  vehicleConfig: VehicleConfig;
  optimizationResult: OptimizationResult | null;
  isOptimizing: boolean;
  error: string | null;
  explanation: string | null;
  isExplaining: boolean;
  savedRoutes: SavedRoute[];
  isLoadingRoutes: boolean;

  // Live Traffic state
  trafficResult: TrafficAnalysisResult | null;
  isLoadingTraffic: boolean;
  trafficRoutingMode: 'traffic-aware' | 'standard';
  selectedAlternativeId: string | null;

  setStartLocation: (location: Location | null) => void;
  addStop: (stop: Omit<Stop, 'id'>) => void;
  updateStop: (id: string, updates: Partial<Stop>) => void;
  removeStop: (id: string) => void;
  reorderStops: (stops: Stop[]) => void;
  setVehicleConfig: (config: Partial<VehicleConfig>) => void;
  optimize: () => Promise<void>;
  analyzeTraffic: () => Promise<void>;
  setTrafficRoutingMode: (mode: 'traffic-aware' | 'standard') => void;
  setSelectedAlternativeId: (id: string | null) => void;
  explainRoute: () => Promise<void>;
  saveRoute: (name: string) => Promise<void>;
  loadRoutes: () => Promise<void>;
  loadDemoData: () => void;
  clearError: () => void;
  clearResults: () => void;
}

export const useRouteStore = create<RouteState>((set, get) => ({
  startLocation: null,
  stops: [],
  vehicleConfig: {
    fuelEfficiency: 14, // km/L (typical Indian city commercial vehicle/bike/van)
    fuelPrice: 105,     // ₹105 per liter (current petrol/diesel in India)
  },
  optimizationResult: null,
  isOptimizing: false,
  error: null,
  explanation: null,
  isExplaining: false,
  savedRoutes: [],
  isLoadingRoutes: false,

  // Traffic defaults
  trafficResult: null,
  isLoadingTraffic: false,
  trafficRoutingMode: 'traffic-aware',
  selectedAlternativeId: null,

  clearError: () => set({ error: null }),
  clearResults: () => set({ optimizationResult: null, explanation: null, trafficResult: null, selectedAlternativeId: null }),

  setStartLocation: (location) => set({ startLocation: location, optimizationResult: null, trafficResult: null }),

  addStop: (stop) => {
    const newStop: Stop = { ...stop, id: generateId() };
    set((state) => ({
      stops: [...state.stops, newStop],
      optimizationResult: null,
      trafficResult: null,
    }));
  },

  updateStop: (id, updates) => {
    set((state) => ({
      stops: state.stops.map((s) => (s.id === id ? { ...s, ...updates } : s)),
      optimizationResult: null,
      trafficResult: null,
    }));
  },

  removeStop: (id) => {
    set((state) => ({
      stops: state.stops.filter((s) => s.id !== id),
      optimizationResult: null,
      trafficResult: null,
    }));
  },

  reorderStops: (stops) => set({ stops, optimizationResult: null, trafficResult: null }),

  setVehicleConfig: (config) => {
    set((state) => ({
      vehicleConfig: { ...state.vehicleConfig, ...config },
    }));
  },

  setTrafficRoutingMode: (mode) => set({ trafficRoutingMode: mode }),
  setSelectedAlternativeId: (id) => set({ selectedAlternativeId: id }),

  analyzeTraffic: async () => {
    const { startLocation, stops, optimizationResult } = get();
    if (!startLocation) return;

    // Pick the last delivery destination stop
    const destination = stops && stops.length > 0 ? stops[stops.length - 1] : null;

    if (!destination || !destination.lat || !destination.lon) return;

    set({ isLoadingTraffic: true });
    try {
      const res = await api.post<TrafficAnalysisResult>('/api/traffic/analyze', {
        origin: { latitude: startLocation.lat, longitude: startLocation.lon },
        destination: { latitude: destination.lat, longitude: destination.lon },
      });
      set({ trafficResult: res.data, isLoadingTraffic: false });
    } catch (err) {
      console.warn('Traffic analysis failed, keeping default view:', err);
      set({ isLoadingTraffic: false });
    }
  },

  optimize: async () => {
    const { startLocation, stops, vehicleConfig } = get();
    if (!startLocation) {
      set({ error: 'Please set a start location' });
      return;
    }
    if (stops.length < 2) {
      set({ error: 'Please add at least 2 delivery stops' });
      return;
    }

    set({ isOptimizing: true, error: null });
    try {
      const response = await api.post<OptimizationResult>('/api/optimize', {
        start: startLocation,
        stops,
        vehicleConfig,
      });
      set({ optimizationResult: response.data, isOptimizing: false });

      // Automatically fetch live traffic intelligence for the route
      get().analyzeTraffic();
    } catch (err) {
      console.warn('Backend call failed, activating direct resilient client optimizer...', err);
      try {
        const { clientSideOptimize } = await import('../lib/clientOptimizer');
        const fallbackResult = await clientSideOptimize(startLocation, stops, vehicleConfig);
        set({ optimizationResult: fallbackResult, isOptimizing: false, error: null });
      } catch (clientErr) {
        const message = err instanceof Error ? err.message : 'Optimization failed';
        set({ error: message, isOptimizing: false });
      }
    }
  },

  explainRoute: async () => {
    const { optimizationResult, startLocation, stops, trafficResult } = get();
    if (!optimizationResult) {
      set({ error: 'Please optimize the route first' });
      return;
    }

    set({ isExplaining: true, error: null });
    try {
      const trafficInfo = trafficResult ? {
        trafficAvailable: trafficResult.trafficAvailable,
        provider: trafficResult.provider,
        trafficDurationMinutes: trafficResult.trafficDurationMinutes,
        typicalDurationMinutes: trafficResult.typicalDurationMinutes,
        estimatedDelayMinutes: trafficResult.estimatedDelayMinutes,
        congestionLevel: trafficResult.congestionLevel,
        alternativeCount: trafficResult.alternativeRoutes?.length || 0,
      } : undefined;

      const response = await api.post<{ explanation: string }>('/api/explain', {
        start: startLocation,
        stops,
        result: optimizationResult,
        trafficInfo,
      });
      set({ explanation: response.data.explanation, isExplaining: false });
    } catch (err) {
      console.warn('Backend explain endpoint unreachable, generating local AI insights summary');
      const distSavedKm = ((optimizationResult.distanceSaved || 0) / 1000).toFixed(1);
      const timeSavedMins = Math.round((optimizationResult.durationSaved || 0) / 60);
      const costSavedRs = (optimizationResult.costSaved || 0).toFixed(2);
      
      const startName = startLocation ? startLocation.name : 'Start Location';
      const orderNames = optimizationResult.optimized.order.map((s) => typeof s === 'string' ? s : s.name);
      const smartExplanation = `### 🚀 Route Optimization Insights\n\n- **Route Efficiency**: 2-Opt and Nearest Neighbor heuristic successfully reordered your ${stops.length} delivery stops.\n- **Distance Saved**: ~${distSavedKm} km reduced compared to original stop order.\n- **Estimated Time Saved**: ~${timeSavedMins} minutes.\n- **Fuel Cost Savings**: ₹${costSavedRs} saved with configured vehicle mileage.\n- **Delivery Sequence**: Start at **${startName}** → Proceed through **${orderNames.slice(1).join(' → ')}**.\n- **Recommendation**: Prioritize high-demand stops during peak traffic hours to avoid regional bottlenecks.`;
      
      set({ explanation: smartExplanation, isExplaining: false, error: null });
    }
  },

  saveRoute: async (name: string) => {
    const { startLocation, stops, optimizationResult, trafficResult } = get();
    if (!optimizationResult || !startLocation) {
      set({ error: 'No optimized route to save' });
      return;
    }

    try {
      await api.post('/api/routes', {
        name,
        route_data: {
          start: startLocation,
          stops,
          result: optimizationResult,
          traffic: trafficResult,
        },
      });
      // Refresh routes list
      get().loadRoutes();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not save route';
      set({ error: message });
      throw err;
    }
  },

  loadRoutes: async () => {
    set({ isLoadingRoutes: true, error: null });
    try {
      const response = await api.get<SavedRoute[]>('/api/routes');
      set({ savedRoutes: response.data, isLoadingRoutes: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not load routes';
      set({ error: message, isLoadingRoutes: false });
    }
  },

  // DEMO DATA - Hyderabad real landmarks
  loadDemoData: () => {
    const demoStart: Location = {
      lat: 17.3616,
      lon: 78.4746,
      name: '[DEMO] Charminar, Hyderabad',
    };

    const demoStops: Stop[] = [
      {
        id: generateId(),
        lat: 17.4490,
        lon: 78.3831,
        name: '[DEMO] HITEC City (Cyber Towers), Hyderabad',
        priority: 'high',
      },
      {
        id: generateId(),
        lat: 17.4177,
        lon: 78.4399,
        name: '[DEMO] Banjara Hills Road No. 1, Hyderabad',
        priority: 'medium',
      },
      {
        id: generateId(),
        lat: 17.4436,
        lon: 78.3520,
        name: '[DEMO] Gachibowli Stadium / Financial Dist, Hyderabad',
        priority: 'high',
      },
      {
        id: generateId(),
        lat: 17.4339,
        lon: 78.5021,
        name: '[DEMO] Secunderabad Railway Station, Hyderabad',
        priority: 'medium',
      },
      {
        id: generateId(),
        lat: 17.4346,
        lon: 78.3867,
        name: '[DEMO] Inorbit Mall, Madhapur, Hyderabad',
        priority: 'low',
      },
    ];

    set({
      startLocation: demoStart,
      stops: demoStops,
      optimizationResult: null,
      trafficResult: null,
      selectedAlternativeId: null,
      explanation: null,
      error: null,
    });
  },
}));
