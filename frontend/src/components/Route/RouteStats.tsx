import React from 'react';
import { MapPin, Clock, Fuel, DollarSign } from 'lucide-react';
import { formatDistance, formatDuration, formatFuel, formatCost } from '../../lib/utils';
import type { RouteResult } from '../../types';

interface RouteStatsProps {
  result: RouteResult;
  label?: string;
}

export function RouteStats({ result, label = 'Route Stats' }: RouteStatsProps) {
  const stats = [
    {
      icon: <MapPin className="w-4 h-4 text-indigo-500" />,
      label: 'Distance',
      value: formatDistance(result.totalDistance),
    },
    {
      icon: <Clock className="w-4 h-4 text-blue-500" />,
      label: 'Duration',
      value: formatDuration(result.totalDuration),
    },
    {
      icon: <Fuel className="w-4 h-4 text-amber-500" />,
      label: 'Fuel',
      value: formatFuel(result.fuelUsed),
    },
    {
      icon: <DollarSign className="w-4 h-4 text-green-500" />,
      label: 'Cost',
      value: formatCost(result.fuelCost),
    },
  ];

  return (
    <div>
      {label && <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{label}</h4>}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-lg border border-gray-100"
          >
            {stat.icon}
            <span className="text-sm font-semibold text-gray-900 mt-1">{stat.value}</span>
            <span className="text-xs text-gray-500">{stat.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
