import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { explainOptimization, OptimizationContext } from '../services/gemini';

const router = Router();

interface ExplainBody {
  optimizationResult: {
    original: {
      order: string[];
      totalDistance: number;
      totalDuration: number;
      fuelUsed: number;
      fuelCost: number;
    };
    optimized: {
      order: string[];
      totalDistance: number;
      totalDuration: number;
      fuelUsed: number;
      fuelCost: number;
    };
    distanceSaved: number;
    durationSaved: number;
    fuelSaved: number;
    costSaved: number;
  };
  vehicleInfo?: {
    fuelEfficiency?: number;
    fuelPrice?: number;
    vehicleType?: string;
  };
}

/**
 * POST /api/explain
 * Use Gemini to produce a plain-English explanation of the optimization result.
 */
router.post('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const body = req.body;

  // Accept both 'optimizationResult' or 'result' from frontend
  const optimizationResult = body.optimizationResult || body.result;

  if (!optimizationResult || typeof optimizationResult !== 'object') {
    res.status(400).json({ error: '"optimizationResult" is required' });
    return;
  }

  if (
    !optimizationResult.original ||
    !optimizationResult.optimized ||
    typeof optimizationResult.distanceSaved !== 'number'
  ) {
    res.status(400).json({ error: 'Invalid optimizationResult structure' });
    return;
  }

  try {
    const toOrderNames = (order: any[]): string[] => {
      if (!Array.isArray(order)) return [];
      return order.map((item) => (typeof item === 'string' ? item : item?.name || 'Stop'));
    };

    const origOrder = toOrderNames(optimizationResult.original.order);
    const optOrder = toOrderNames(optimizationResult.optimized.order);

    const ctx: OptimizationContext = {
      originalDistance: optimizationResult.original.totalDistance,
      optimizedDistance: optimizationResult.optimized.totalDistance,
      originalDuration: optimizationResult.original.totalDuration,
      optimizedDuration: optimizationResult.optimized.totalDuration,
      distanceSaved: optimizationResult.distanceSaved,
      durationSaved: optimizationResult.durationSaved,
      fuelSaved: optimizationResult.fuelSaved,
      costSaved: optimizationResult.costSaved,
      stopCount: optOrder.length > 0 ? optOrder.length - 1 : 0,
      originalOrder: origOrder,
      optimizedOrder: optOrder,
      trafficInfo: body.trafficInfo,
    };

    const explanation = await explainOptimization(ctx);
    res.json({ explanation });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Explain error:', message);

    // Graceful degradation: return a helpful calculated explanation even if Gemini key is missing or API errors
    const distSavedKm = (optimizationResult.distanceSaved / 1000).toFixed(1);
    const timeSavedMin = Math.round(optimizationResult.durationSaved / 60);
    const fuelSavedL = optimizationResult.fuelSaved.toFixed(1);
    const costSavedVal = optimizationResult.costSaved.toFixed(2);

    res.json({
      explanation:
        `Your delivery route has been optimized! By rearranging the stops using 2-opt road sequencing, you save approximately ${distSavedKm} km and ${timeSavedMin} minutes of driving time. This cuts estimated fuel consumption by ${fuelSavedL} L, saving you ₹${costSavedVal} on this trip.`
    });
  }
});

export default router;
