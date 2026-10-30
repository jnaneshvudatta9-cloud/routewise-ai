"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTrafficRoute = getTrafficRoute;
function isValidCoordinate(lat, lon) {
    return (typeof lat === 'number' &&
        typeof lon === 'number' &&
        !isNaN(lat) &&
        !isNaN(lon) &&
        lat >= -90 &&
        lat <= 90 &&
        lon >= -180 &&
        lon <= 180);
}
/**
 * Fetch traffic-aware route from Mapbox Directions API using driving-traffic profile
 */
async function getTrafficRoute(origin, destination) {
    const token = process.env.MAPBOX_ACCESS_TOKEN?.trim();
    // Validate coordinates
    if (!isValidCoordinate(origin?.latitude, origin?.longitude) ||
        !isValidCoordinate(destination?.latitude, destination?.longitude)) {
        throw new Error('Invalid origin or destination coordinates. Latitudes must be between -90 and 90, longitudes between -180 and 180.');
    }
    // Fallback to standard OSRM routing if Mapbox token is not configured
    if (!token || token === 'your_mapbox_access_token') {
        return fetchOsrmFallback(origin, destination, 'Mapbox token is not configured. Standard road routing used.');
    }
    // Mapbox expects coordinates in "longitude,latitude" order
    const coordsStr = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;
    const mapboxUrl = new URL(`https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${coordsStr}`);
    mapboxUrl.searchParams.set('alternatives', 'true');
    mapboxUrl.searchParams.set('geometries', 'geojson');
    mapboxUrl.searchParams.set('overview', 'full');
    mapboxUrl.searchParams.set('annotations', 'duration,distance,congestion');
    mapboxUrl.searchParams.set('access_token', token);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);
    try {
        const res = await fetch(mapboxUrl.toString(), {
            signal: controller.signal,
            headers: {
                'Accept': 'application/json',
            },
        });
        clearTimeout(timeoutId);
        if (res.status === 401 || res.status === 403) {
            console.warn('Mapbox access token invalid or unauthorized. Falling back to OSRM.');
            return fetchOsrmFallback(origin, destination, 'Mapbox authentication failed. Used standard OSRM road routing.');
        }
        if (res.status === 429) {
            console.warn('Mapbox rate limit reached. Falling back to OSRM.');
            return fetchOsrmFallback(origin, destination, 'Mapbox rate limit reached. Standard road routing used.');
        }
        if (!res.ok) {
            const errText = await res.text();
            console.warn(`Mapbox error (${res.status}): ${errText}`);
            return fetchOsrmFallback(origin, destination, `Mapbox error (${res.status}). Standard routing used.`);
        }
        const data = await res.json();
        if (!data.routes || data.routes.length === 0) {
            return fetchOsrmFallback(origin, destination, 'No road route found by Mapbox. Attempted standard routing.');
        }
        // Process primary route and alternatives
        const routes = data.routes;
        const primary = routes[0];
        const distanceKm = parseFloat((primary.distance / 1000).toFixed(2));
        const trafficDurationMin = Math.round(primary.duration / 60);
        // If Mapbox provides typical / duration_typical or annotations
        let typicalDurationMin;
        if (typeof primary.duration_typical === 'number' && primary.duration_typical > 0) {
            typicalDurationMin = Math.round(primary.duration_typical / 60);
        }
        // Calculate delay only when valid baseline exists
        let estimatedDelayMin;
        if (typicalDurationMin !== undefined) {
            estimatedDelayMin = Math.max(0, trafficDurationMin - typicalDurationMin);
        }
        // Check congestion from Mapbox annotations (do not invent)
        let congestionLevel = 'unknown';
        if (primary.legs && primary.legs[0]?.annotation?.congestion) {
            const congArray = primary.legs[0].annotation.congestion;
            const counts = {};
            for (const c of congArray) {
                counts[c] = (counts[c] || 0) + 1;
            }
            const severe = (counts['severe'] || 0) + (counts['heavy'] || 0);
            const moderate = counts['moderate'] || 0;
            const low = counts['low'] || 0;
            if (severe > moderate && severe > low) {
                congestionLevel = 'heavy';
            }
            else if (moderate > low) {
                congestionLevel = 'moderate';
            }
            else if (low > 0) {
                congestionLevel = 'light';
            }
        }
        else if (estimatedDelayMin !== undefined) {
            if (estimatedDelayMin >= 15)
                congestionLevel = 'heavy';
            else if (estimatedDelayMin >= 5)
                congestionLevel = 'moderate';
            else
                congestionLevel = 'light';
        }
        // Process alternative routes
        const alternativeRoutes = [];
        for (let i = 1; i < routes.length; i++) {
            const alt = routes[i];
            const altDistKm = parseFloat((alt.distance / 1000).toFixed(2));
            const altDurMin = Math.round(alt.duration / 60);
            let altTypMin;
            if (typeof alt.duration_typical === 'number' && alt.duration_typical > 0) {
                altTypMin = Math.round(alt.duration_typical / 60);
            }
            const altDelayMin = altTypMin !== undefined ? Math.max(0, altDurMin - altTypMin) : undefined;
            alternativeRoutes.push({
                id: `alt-${i}`,
                distanceKm: altDistKm,
                durationMinutes: altDurMin,
                typicalDurationMinutes: altTypMin,
                delayMinutes: altDelayMin,
                summary: alt.legs?.[0]?.summary || `Alternative Route ${i}`,
                geometry: alt.geometry,
            });
        }
        return {
            success: true,
            trafficAvailable: true,
            routingMode: 'traffic-aware',
            distanceKm,
            trafficDurationMinutes: trafficDurationMin,
            typicalDurationMinutes: typicalDurationMin,
            estimatedDelayMinutes: estimatedDelayMin,
            congestionLevel,
            recommendedRouteId: 'primary',
            alternativeRoutes,
            geometry: primary.geometry,
            provider: 'Mapbox',
            message: 'Live traffic-informed road route obtained from Mapbox.',
        };
    }
    catch (err) {
        clearTimeout(timeoutId);
        console.warn('Mapbox traffic request failed or timed out:', err.message);
        return fetchOsrmFallback(origin, destination, 'Traffic routing timed out or unreachable. Fallen back to standard routing.');
    }
}
/**
 * Fallback to local / public OSRM when Mapbox is unavailable or unconfigured
 */
async function fetchOsrmFallback(origin, destination, reason) {
    const osrmBase = process.env.OSRM_BASE_URL || 'https://router.project-osrm.org';
    const coordsStr = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;
    const url = `${osrmBase}/route/v1/driving/${coordsStr}?overview=full&geometries=geojson&alternatives=true`;
    try {
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`OSRM HTTP ${res.status}`);
        }
        const data = await res.json();
        if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
            throw new Error(data.message || 'No route found by OSRM');
        }
        const primary = data.routes[0];
        const distKm = parseFloat((primary.distance / 1000).toFixed(2));
        const durMin = Math.round(primary.duration / 60);
        const alternativeRoutes = [];
        for (let i = 1; i < data.routes.length; i++) {
            const alt = data.routes[i];
            alternativeRoutes.push({
                id: `alt-${i}`,
                distanceKm: parseFloat((alt.distance / 1000).toFixed(2)),
                durationMinutes: Math.round(alt.duration / 60),
                summary: `Alternative ${i}`,
                geometry: alt.geometry,
            });
        }
        return {
            success: true,
            trafficAvailable: false,
            routingMode: 'standard',
            distanceKm: distKm,
            trafficDurationMinutes: durMin,
            typicalDurationMinutes: durMin,
            estimatedDelayMinutes: 0,
            congestionLevel: 'unknown',
            recommendedRouteId: 'primary',
            alternativeRoutes,
            geometry: primary.geometry,
            provider: 'OSRM',
            message: reason,
        };
    }
    catch (osrmErr) {
        throw new Error(`Routing services failed: ${reason} (OSRM error: ${osrmErr.message})`);
    }
}
