"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const osrm_1 = require("../services/osrm");
const optimizer_1 = require("../services/optimizer");
const router = (0, express_1.Router)();
function isValidCoord(lat, lon) {
    return (typeof lat === 'number' &&
        typeof lon === 'number' &&
        lat >= -90 && lat <= 90 &&
        lon >= -180 && lon <= 180);
}
function validateBody(body) {
    if (!body.start || typeof body.start !== 'object')
        return 'Missing or invalid "start" location';
    if (!isValidCoord(body.start.lat, body.start.lon))
        return '"start" has invalid coordinates';
    if (!Array.isArray(body.stops))
        return '"stops" must be an array';
    if (body.stops.length < 2)
        return 'At least 2 stops are required';
    if (body.stops.length > 15)
        return 'Maximum 15 stops allowed';
    for (let i = 0; i < body.stops.length; i++) {
        const s = body.stops[i];
        if (!isValidCoord(s.lat, s.lon))
            return `Stop ${i + 1} has invalid coordinates`;
        if (!s.name || typeof s.name !== 'string')
            return `Stop ${i + 1} is missing a name`;
    }
    const eff = body.fuelEfficiency ?? body.vehicleConfig?.fuelEfficiency;
    const price = body.fuelPrice ?? body.vehicleConfig?.fuelPrice;
    if (typeof eff !== 'number' || eff <= 0)
        return '"fuelEfficiency" must be a positive number (km/litre)';
    if (typeof price !== 'number' || price < 0)
        return '"fuelPrice" must be a non-negative number';
    return null;
}
function buildWaypoints(start, order, stops) {
    return [start, ...order.map((i) => stops[i - 1])]; // indices in matrix: 0=start, 1..n=stops
}
/**
 * POST /api/optimize
 */
router.post('/', auth_1.requireAuth, async (req, res) => {
    const body = req.body;
    const validationError = validateBody(body);
    if (validationError) {
        res.status(400).json({ error: validationError });
        return;
    }
    const { start, stops } = body;
    const fuelEfficiency = body.fuelEfficiency ?? body.vehicleConfig.fuelEfficiency;
    const fuelPrice = body.fuelPrice ?? body.vehicleConfig.fuelPrice;
    try {
        // Build coordinate list: index 0 = start, indices 1..n = stops
        const allCoords = [start, ...stops];
        // 1. Get distance/duration matrix from OSRM
        const { durations, distances } = await (0, osrm_1.getTable)(allCoords);
        // 2. Nearest-neighbor from index 0 (start)
        const nnOrder = (0, optimizer_1.nearestNeighbor)(durations, 0); // returns indices in [1..n]
        // 3. 2-opt improvement
        const optimizedOrder = (0, optimizer_1.twoOpt)(nnOrder, durations);
        // 4. Original order: [1, 2, 3, ..., n] (user-supplied order)
        const originalOrder = stops.map((_, i) => i + 1);
        // 5. Fetch route details for original order
        const originalWaypoints = buildWaypoints(start, originalOrder, stops);
        const optimizedWaypoints = buildWaypoints(start, optimizedOrder, stops);
        const [originalRoute, optimizedRoute] = await Promise.all([
            (0, osrm_1.getRoute)(originalWaypoints),
            (0, osrm_1.getRoute)(optimizedWaypoints),
        ]);
        // 6. Calculate fuel & cost
        const toKm = (metres) => metres / 1000;
        const calcFuelUsed = (metres) => toKm(metres) / fuelEfficiency;
        const calcFuelCost = (litres) => litres * fuelPrice;
        const originalFuel = calcFuelUsed(originalRoute.distance);
        const optimizedFuel = calcFuelUsed(optimizedRoute.distance);
        const originalCost = calcFuelCost(originalFuel);
        const optimizedCost = calcFuelCost(optimizedFuel);
        const distanceSaved = originalRoute.distance - optimizedRoute.distance;
        const durationSaved = originalRoute.duration - optimizedRoute.duration;
        const fuelSaved = originalFuel - optimizedFuel;
        const costSaved = originalCost - optimizedCost;
        // Build human-readable order arrays
        const buildNamedOrder = (order) => [
            start.name,
            ...order.map((i) => stops[i - 1].name),
        ];
        res.json({
            original: {
                order: buildNamedOrder(originalOrder),
                totalDistance: Math.round(originalRoute.distance),
                totalDuration: Math.round(originalRoute.duration),
                fuelUsed: parseFloat(originalFuel.toFixed(3)),
                fuelCost: parseFloat(originalCost.toFixed(2)),
                geometry: originalRoute.geometry,
            },
            optimized: {
                order: buildNamedOrder(optimizedOrder),
                totalDistance: Math.round(optimizedRoute.distance),
                totalDuration: Math.round(optimizedRoute.duration),
                fuelUsed: parseFloat(optimizedFuel.toFixed(3)),
                fuelCost: parseFloat(optimizedCost.toFixed(2)),
                geometry: optimizedRoute.geometry,
            },
            distanceSaved: Math.round(distanceSaved),
            durationSaved: Math.round(durationSaved),
            fuelSaved: parseFloat(fuelSaved.toFixed(3)),
            costSaved: parseFloat(costSaved.toFixed(2)),
            matrix: {
                distances,
                durations,
            },
        });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('Optimize error:', message);
        if (message.includes('timed out') || message.includes('aborted')) {
            res.status(504).json({ error: 'Routing service timed out. Please try again.' });
        }
        else if (message.includes('OSRM')) {
            res.status(502).json({ error: 'Routing service error: ' + message });
        }
        else {
            res.status(500).json({ error: 'Failed to optimize route: ' + message });
        }
    }
});
exports.default = router;
