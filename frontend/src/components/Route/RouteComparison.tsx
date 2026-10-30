import React from 'react';
import {
  TrendingDown,
  Clock,
  Fuel,
  IndianRupee,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';
import { formatDistance, formatDuration, formatFuel, formatCost } from '../../lib/utils';
import type { OptimizationResult } from '../../types';

interface RouteComparisonProps {
  result: OptimizationResult;
}

interface StatRowProps {
  label: string;
  original: string;
  optimized: string;
  saved: string;
  improved: boolean;
  icon: React.ReactNode;
}

function StatRow({ label, original, optimized, saved, improved, icon }: StatRowProps) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-gray-500 mb-0.5">{label}</div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-400 line-through">{original}</span>
          <ArrowRight className="w-3 h-3 text-gray-400 shrink-0" />
          <span className="font-semibold text-gray-900">{optimized}</span>
        </div>
      </div>
      {improved && (
        <div className="shrink-0 text-right">
          <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
            <TrendingDown className="w-3 h-3" />
            {saved}
          </span>
        </div>
      )}
    </div>
  );
}

export function RouteComparison({ result }: RouteComparisonProps) {
  const { original, optimized, distanceSaved, durationSaved, fuelSaved, costSaved } = result;

  const stats = [
    {
      label: 'Total Distance',
      original: formatDistance(original.totalDistance),
      optimized: formatDistance(optimized.totalDistance),
      saved: formatDistance(distanceSaved),
      improved: distanceSaved > 0,
      icon: <TrendingDown className="w-4 h-4" />,
    },
    {
      label: 'Estimated Time',
      original: formatDuration(original.totalDuration),
      optimized: formatDuration(optimized.totalDuration),
      saved: formatDuration(durationSaved),
      improved: durationSaved > 0,
      icon: <Clock className="w-4 h-4" />,
    },
    {
      label: 'Fuel Used',
      original: formatFuel(original.fuelUsed),
      optimized: formatFuel(optimized.fuelUsed),
      saved: formatFuel(fuelSaved),
      improved: fuelSaved > 0,
      icon: <Fuel className="w-4 h-4" />,
    },
    {
      label: 'Fuel Cost',
      original: formatCost(original.fuelCost),
      optimized: formatCost(optimized.fuelCost),
      saved: formatCost(costSaved),
      improved: costSaved > 0,
      icon: <IndianRupee className="w-4 h-4" />,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Savings banner */}
      {costSaved > 0 && (
        <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <div className="font-semibold text-green-800 text-sm">Route Optimized!</div>
            <div className="text-green-700 text-xs mt-0.5">
              Save {formatDistance(distanceSaved)} · {formatDuration(durationSaved)} · {formatCost(costSaved)} per trip
            </div>
          </div>
        </div>
      )}

      {/* Stats comparison */}
      <div className="card p-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Original vs Optimized</h4>
        <div>
          {stats.map((stat) => (
            <StatRow key={stat.label} {...stat} />
          ))}
        </div>
      </div>

      {/* Optimized stop order */}
      <div className="card p-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Optimized Stop Order</h4>
        <ol className="space-y-2">
          {optimized.order.map((stop, index) => (
            <li key={stop.id} className="flex items-center gap-2 text-sm">
              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0">
                {index + 1}
              </span>
              <span className="text-gray-700 truncate">{stop.name}</span>
              <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${
                stop.priority === 'high'
                  ? 'bg-red-100 text-red-700'
                  : stop.priority === 'medium'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-green-100 text-green-700'
              }`}>
                {stop.priority}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
