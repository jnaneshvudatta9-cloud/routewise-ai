import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { getTrafficRoute, TrafficCoordinate } from '../services/trafficService';

const router = Router();

function isValidCoordinate(lat?: number, lon?: number): boolean {
  return (
    typeof lat === 'number' &&
    typeof lon === 'number' &&
    !isNaN(lat) &&
    !isNaN(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  );
}

/**
 * POST /api/traffic/analyze
 * Traffic-aware route analysis between origin and destination
 */
router.post('/analyze', requireAuth, async (req: Request, res: Response): Promise<void> => {
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

    const origCoord: TrafficCoordinate = { latitude: Number(origLat), longitude: Number(origLon) };
    const destCoord: TrafficCoordinate = { latitude: Number(destLat), longitude: Number(destLon) };

    const result = await getTrafficRoute(origCoord, destCoord);
    res.json(result);
  } catch (err: any) {
    console.error('Traffic analysis error:', err.message);
    res.status(500).json({
      success: false,
      trafficAvailable: false,
      routingMode: 'standard',
      error: err.message || 'Failed to analyze traffic route.',
    });
  }
});

export default router;

