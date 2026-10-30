export interface Location {
  lat: number;
  lon: number;
  name: string;
}

export interface Stop extends Location {
  id: string;
  priority: 'high' | 'medium' | 'low';
}

export interface VehicleConfig {
  fuelEfficiency: number; // km/L
  fuelPrice: number; // per liter
}

export interface GeoJSON {
  type: string;
  coordinates: number[][];
}

export interface RouteResult {
  order: Stop[];
  totalDistance: number; // meters
  totalDuration: number; // seconds
  fuelUsed: number; // liters
  fuelCost: number; // currency
  geometry: GeoJSON;
}

export interface OptimizationResult {
  original: RouteResult;
  optimized: RouteResult;
  distanceSaved: number;
  durationSaved: number;
  fuelSaved: number;
  costSaved: number;
}

export interface GeocodingResult {
  displayName: string;
  lat: number;
  lon: number;
}

export interface AlternativeRouteInfo {
  id: string;
  distanceKm: number;
  durationMinutes: number;
  typicalDurationMinutes?: number;
  delayMinutes?: number;
  summary?: string;
  congestionLevel?: 'light' | 'moderate' | 'heavy' | 'unknown';
  geometry: GeoJSON;
}

export interface TrafficAnalysisResult {
  success: boolean;
  trafficAvailable: boolean;
  routingMode: 'traffic-aware' | 'standard';
  distanceKm: number;
  trafficDurationMinutes: number;
  typicalDurationMinutes?: number;
  estimatedDelayMinutes?: number;
  congestionLevel?: 'light' | 'moderate' | 'heavy' | 'unknown';
  recommendedRouteId?: string;
  alternativeRoutes: AlternativeRouteInfo[];
  geometry: GeoJSON;
  provider: 'Mapbox' | 'OSRM';
  message?: string;
}

export interface SavedRoute {
  id: string;
  name: string;
  created_at: string;
  route_data: {
    start: Location;
    stops: Stop[];
    result: OptimizationResult;
    traffic?: TrafficAnalysisResult | null;
  };
}
