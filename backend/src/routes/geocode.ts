import { Router, Request, Response } from 'express';
import { geocodeAddress } from '../services/nominatim';

const router = Router();

/**
 * GET /api/geocode?q=<address>
 * Proxy to Nominatim with in-memory caching.
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  const query = req.query['q'];

  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    res.status(400).json({ error: 'Query parameter "q" is required and must be a non-empty string' });
    return;
  }

  if (query.trim().length > 500) {
    res.status(400).json({ error: 'Query parameter "q" must not exceed 500 characters' });
    return;
  }

  try {
    const results = await geocodeAddress(query.trim());
    res.json(results);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Geocode error:', message);

    if (message.includes('aborted') || message.includes('timed out')) {
      res.status(504).json({ error: 'Geocoding service timed out. Please try again.' });
    } else {
      res.status(502).json({ error: 'Geocoding service unavailable. Please try again later.' });
    }
  }
});

export default router;
