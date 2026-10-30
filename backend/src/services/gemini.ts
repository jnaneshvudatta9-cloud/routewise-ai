import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

export interface OptimizationContext {
  originalDistance: number;  // metres
  optimizedDistance: number; // metres
  originalDuration: number;  // seconds
  optimizedDuration: number; // seconds
  distanceSaved: number;     // metres
  durationSaved: number;     // seconds
  fuelSaved: number;         // litres
  costSaved: number;         // currency units
  stopCount: number;
  originalOrder: string[];
  optimizedOrder: string[];
  trafficInfo?: {
    trafficAvailable: boolean;
    provider: string;
    trafficDurationMinutes?: number;
    typicalDurationMinutes?: number;
    estimatedDelayMinutes?: number;
    congestionLevel?: string;
    alternativeCount?: number;
  };
}

function formatDistance(metres: number): string {
  return metres >= 1000
    ? `${(metres / 1000).toFixed(1)} km`
    : `${Math.round(metres)} m`;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}min`;
  return `${m} min`;
}

export async function explainOptimization(ctx: OptimizationContext): Promise<string> {
  const client = getClient();
  const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });

  let trafficSection = '';
  if (ctx.trafficInfo && ctx.trafficInfo.trafficAvailable) {
    trafficSection = `
- Live Traffic Status: Active (Provider: ${ctx.trafficInfo.provider})
- Traffic-aware Duration: ${ctx.trafficInfo.trafficDurationMinutes ?? 'N/A'} min
- Typical Duration: ${ctx.trafficInfo.typicalDurationMinutes ?? 'N/A'} min
- Estimated Traffic Delay: ${ctx.trafficInfo.estimatedDelayMinutes ?? 0} min
- Congestion Level: ${ctx.trafficInfo.congestionLevel ?? 'Normal'}
- Alternative Routes Available: ${ctx.trafficInfo.alternativeCount ?? 0}`;
  } else {
    trafficSection = `
- Live Traffic Status: Standard road routing (Live traffic data not active or unavailable).`;
  }

  const prompt = `You are a helpful route optimization and live traffic assistant for RouteWise AI. 
Explain the following route optimization results in clear, friendly, plain English for a driver or delivery person.
Keep it concise (3-5 sentences). Include the actual numbers. Be positive and encouraging.
Important: Never invent traffic conditions. If live traffic is not active, clearly explain that calculations use standard road network times.

Optimization details:
- Number of stops: ${ctx.stopCount}
- Original route distance: ${formatDistance(ctx.originalDistance)} (${ctx.originalOrder.join(' → ')})
- Optimized route distance: ${formatDistance(ctx.optimizedDistance)} (${ctx.optimizedOrder.join(' → ')})
- Original route time: ${formatDuration(ctx.originalDuration)}
- Optimized route time: ${formatDuration(ctx.optimizedDuration)}
- Distance saved: ${formatDistance(ctx.distanceSaved)} (${ctx.distanceSaved > 0 ? ((ctx.distanceSaved / ctx.originalDistance) * 100).toFixed(1) : 0}% reduction)
- Time saved: ${formatDuration(ctx.durationSaved)}
- Fuel saved: ${ctx.fuelSaved.toFixed(2)} litres
- Cost saved: ${ctx.costSaved.toFixed(2)} currency units
${trafficSection}

Provide a clear, motivating explanation of what changed, traffic conditions (if active), and why this route is better.`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  return response.text();
}
