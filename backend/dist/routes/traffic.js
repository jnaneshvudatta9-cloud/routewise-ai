"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const trafficService_1 = require("../services/trafficService");
const router = (0, express_1.Router)();
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
 * POST /api/traffic/analyze
 * Traffic-aware route analysis between origin and destination
 */
router.post('/analyze', auth_1.requireAuth, async (req, res) => {
    try {
        const { origin, destination } = req.body;
        if (!origin || !destination) {
            res.status(400).json({
                success: false,
                error: 'Both "origin" and "destination" objects are required with latitude and longitude.',
            });
            return;
        }
        const origLat = origin.latitude ?? origin.lat;
        const origLon = origin.longitude ?? origin.lon;
        const destLat = destination.latitude ?? destination.lat;
        const destLon = destination.longitude ?? destination.lon;
        if (!isValidCoordinate(origLat, origLon)) {
            res.status(400).json({
                success: false,
                error: 'Invalid origin coordinates: latitude must be between -90 and 90, longitude between -180 and 180.',
            });
            return;
        }
        if (!isValidCoordinate(destLat, destLon)) {
            res.status(400).json({
                success: false,
                error: 'Invalid destination coordinates: latitude must be between -90 and 90, longitude between -180 and 180.',
            });
            return;
        }
        const origCoord = { latitude: Number(origLat), longitude: Number(origLon) };
        const destCoord = { latitude: Number(destLat), longitude: Number(destLon) };
        const result = await (0, trafficService_1.getTrafficRoute)(origCoord, destCoord);
        res.json(result);
    }
    catch (err) {
        console.error('Traffic analysis error:', err.message);
        res.status(500).json({
            success: false,
            trafficAvailable: false,
            routingMode: 'standard',
            error: err.message || 'Failed to analyze traffic route.',
        });
    }
});
exports.default = router;
