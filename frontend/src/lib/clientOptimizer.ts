import type { OptimizationResult, Location, Stop, VehicleConfig } from '../types';

interface Coord {
  lat: number;
  lon: number;
}

// Haversine formula to compute distance in meters between two lat/lon points
function haversineDistance(c1: Coord, c2: Coord): number {
  const R = 6371e3; // Earth radius in meters
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(c2.lat - c1.lat);
  const dLon = toRad(c2.lon - c1.lon);
  const lat1 = toRad(c1.lat);
  const lat2 = toRad(c2.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Generate intermediate points along lines for smooth polyline display
function interpolatePoints(coords: Coord[], numSteps = 6): number[][] {
  const line: number[][] = [];
  for (let i = 0; i < coords.length - 1; i++) {
    const c1 = coords[i];
    const c2 = coords[i + 1];
    for (let s = 0; s < numSteps; s++) {
      const frac = s / numSteps;
      const lon = c1.lon + (c2.lon - c1.lon) * frac;
      const lat = c1.lat + (c2.lat - c1.lat) * frac;
      line.push([lon, lat]);
    }
  }
  const last = coords[coords.length - 1];
  line.push([last.lon, last.lat]);
  return line;
}

export async function clientSideOptimize(
  start: Location,
  stops: Stop[],
  vehicleConfig: VehicleConfig
): Promise<OptimizationResult> {
  const startStop: Stop = {
    id: 'start-point',
    lat: start.lat,
    lon: start.lon,
    name: start.name,
    priority: 'high',
  };

  const allStops: Stop[] = [startStop, ...stops];
  const allPoints: Coord[] = allStops.map((s) => ({ lat: s.lat, lon: s.lon }));
  const n = allPoints.length;

  const matrix: { distances: number[][]; durations: number[][] } = {
    distances: Array.from({ length: n }, () => Array(n).fill(0)),
    durations: Array.from({ length: n }, () => Array(n).fill(0)),
  };

  let usedOsrm = false;
  try {
    const coordsStr = allPoints.map((c) => `${c.lon},${c.lat}`).join(';');
    const res = await fetch(
      `https://router.project-osrm.org/table/v1/driving/${coordsStr}?annotations=duration,distance`
    );
    if (res.ok) {
      const data = await res.json();
      if (data.code === 'Ok') {
        matrix.distances = data.distances;
        matrix.durations = data.durations;
        usedOsrm = true;
      }
    }
  } catch {
    // Continue with haversine calculation
  }

  if (!usedOsrm) {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i !== j) {
          const distM = haversineDistance(allPoints[i], allPoints[j]);
          // Realistic driving road factor: ~1.28x Euclidean
          matrix.distances[i][j] = distM * 1.28;
          matrix.durations[i][j] = (distM * 1.28) / (35 / 3.6); // avg city speed 35 km/h
        }
      }
    }
  }

  // Nearest Neighbor TSP heuristic
  const visited = new Set<number>([0]);
  const nnOrder: number[] = [];
  let current = 0;

  while (nnOrder.length < n - 1) {
    let bestNext = -1;
    let bestCost = Infinity;
    for (let i = 0; i < n; i++) {
      if (!visited.has(i)) {
        const cost = matrix.durations[current][i];
        if (cost < bestCost) {
          bestCost = cost;
          bestNext = i;
        }
      }
    }
    if (bestNext === -1) break;
    visited.add(bestNext);
    nnOrder.push(bestNext);
    current = bestNext;
  }

  // 2-Opt local search improvement
  let bestTour = [...nnOrder];
  const tourCost = (tour: number[]) => {
    let c = matrix.durations[0][tour[0]];
    for (let i = 0; i < tour.length - 1; i++) {
      c += matrix.durations[tour[i]][tour[i + 1]];
    }
    return c;
  };

  let improved = true;
  while (improved) {
    improved = false;
    for (let i = 0; i < bestTour.length - 1; i++) {
      for (let k = i + 1; k < bestTour.length; k++) {
        const candidate = [
          ...bestTour.slice(0, i),
          ...bestTour.slice(i, k + 1).reverse(),
          ...bestTour.slice(k + 1),
        ];
        if (tourCost(candidate) < tourCost(bestTour)) {
          bestTour = candidate;
          improved = true;
        }
      }
    }
  }

  const origOrderIndices = Array.from({ length: n - 1 }, (_, i) => i + 1);

  const calcRouteStats = (orderIndices: number[]) => {
    let distM = matrix.distances[0][orderIndices[0]];
    let durS = matrix.durations[0][orderIndices[0]];
    for (let i = 0; i < orderIndices.length - 1; i++) {
      distM += matrix.distances[orderIndices[i]][orderIndices[i + 1]];
      durS += matrix.durations[orderIndices[i]][orderIndices[i + 1]];
    }
    const distKm = distM / 1000;
    const eff = vehicleConfig.fuelEfficiency || 14;
    const price = vehicleConfig.fuelPrice || 105;
    const fuelUsed = distKm / eff;
    const fuelCost = fuelUsed * price;
    const orderedStops: Stop[] = [allStops[0], ...orderIndices.map((i) => allStops[i])];
    const orderedPoints = orderedStops.map((s) => ({ lat: s.lat, lon: s.lon }));

    return {
      order: orderedStops,
      totalDistance: Math.round(distM),
      totalDuration: Math.round(durS),
      fuelUsed: parseFloat(fuelUsed.toFixed(3)),
      fuelCost: parseFloat(fuelCost.toFixed(2)),
      geometry: {
        type: 'LineString',
        coordinates: interpolatePoints(orderedPoints),
      },
    };
  };

  const origStats = calcRouteStats(origOrderIndices);
  const optStats = calcRouteStats(bestTour);

  return {
    original: origStats,
    optimized: optStats,
    distanceSaved: Math.max(0, origStats.totalDistance - optStats.totalDistance),
    durationSaved: Math.max(0, origStats.totalDuration - optStats.totalDuration),
    fuelSaved: parseFloat(Math.max(0, origStats.fuelUsed - optStats.fuelUsed).toFixed(3)),
    costSaved: parseFloat(Math.max(0, origStats.fuelCost - optStats.fuelCost).toFixed(2)),
  };
}
