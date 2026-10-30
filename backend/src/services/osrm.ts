import fetch from 'node-fetch';

const OSRM_BASE_URL = process.env.OSRM_BASE_URL || 'https://router.project-osrm.org';
const TIMEOUT_MS = 15000;

interface Coord {
  lat: number;
  lon: number;
}

interface TableResult {
  durations: number[][];
  distances: number[][];
}

interface RouteResult {
  distance: number;   // metres
  duration: number;   // seconds
  geometry: object;
}

function buildCoordsString(coords: Coord[]): string {
  return coords.map((c) => `${c.lon},${c.lat}`).join(';');
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`OSRM request timed out after ${ms}ms`)), ms)
    ),
  ]);
}

/**
 * Fetch a duration + distance matrix from the OSRM Table API.
 */
export async function getTable(coords: Coord[]): Promise<TableResult> {
  const coordsStr = buildCoordsString(coords);
  const url = `${OSRM_BASE_URL}/table/v1/driving/${coordsStr}?annotations=duration,distance`;

  const response = await withTimeout(
    fetch(url, {
      headers: { 'User-Agent': 'RouteWiseAI/1.0' },
    }),
    TIMEOUT_MS
  );

  if (!response.ok) {
    throw new Error(`OSRM Table API HTTP error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as {
    code: string;
    durations?: number[][];
    distances?: number[][];
    message?: string;
  };

  if (data.code !== 'Ok') {
    throw new Error(`OSRM Table API error: ${data.code} – ${data.message ?? 'unknown'}`);
  }

  if (!data.durations || !data.distances) {
    throw new Error('OSRM Table API returned incomplete data (missing durations or distances)');
  }

  return {
    durations: data.durations,
    distances: data.distances,
  };
}

/**
 * Fetch a route geometry + totals from the OSRM Route API.
 */
export async function getRoute(waypoints: Coord[]): Promise<RouteResult> {
  const coordsStr = buildCoordsString(waypoints);
  const url = `${OSRM_BASE_URL}/route/v1/driving/${coordsStr}?overview=full&geometries=geojson`;

  const response = await withTimeout(
    fetch(url, {
      headers: { 'User-Agent': 'RouteWiseAI/1.0' },
    }),
    TIMEOUT_MS
  );

  if (!response.ok) {
    throw new Error(`OSRM Route API HTTP error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as {
    code: string;
    routes?: Array<{
      distance: number;
      duration: number;
      geometry: object;
    }>;
    message?: string;
  };

  if (data.code !== 'Ok') {
    throw new Error(`OSRM Route API error: ${data.code} – ${data.message ?? 'unknown'}`);
  }

  if (!data.routes || data.routes.length === 0) {
    throw new Error('OSRM Route API returned no routes');
  }

  const route = data.routes[0];
  return {
    distance: route.distance,
    duration: route.duration,
    geometry: route.geometry,
  };
}
