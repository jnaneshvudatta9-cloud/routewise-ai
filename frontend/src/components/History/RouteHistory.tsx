import React, { useEffect, useState } from 'react';
import { History, Trash2, ChevronDown, ChevronUp, Loader2, Calendar, TrendingDown, IndianRupee, AlertCircle } from 'lucide-react';
import { useRouteStore } from '../../store/routeStore';
import { formatDistance, formatCost, formatDuration } from '../../lib/utils';
import api from '../../lib/api';
import type { SavedRoute } from '../../types';

export function RouteHistory() {
  const { savedRoutes, loadRoutes, isLoadingRoutes, error } = useRouteStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadRoutes();
  }, [loadRoutes]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this saved route?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/api/routes/${id}`);
      loadRoutes();
    } catch {
      // handle silently
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoadingRoutes) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading saved routes...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <span className="text-sm">{error}</span>
      </div>
    );
  }

  if (savedRoutes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <History className="w-8 h-8 text-gray-300" />
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No saved routes yet</h3>
        <p className="text-gray-500 text-sm max-w-sm">
          Go to the planner, optimize a route, and click "Save Route" to store it here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {savedRoutes.map((route: SavedRoute) => {
        const { result } = route.route_data;
        const isExpanded = expandedId === route.id;
        const isDeleting = deletingId === route.id;

        return (
          <div key={route.id} className="card overflow-hidden">
            {/* Card header */}
            <div
              className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => setExpandedId(isExpanded ? null : route.id)}
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{route.name}</h3>
                <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(route.created_at)}</span>
                </div>
              </div>

              {/* Summary chips */}
              <div className="hidden sm:flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1 px-2 py-1 bg-green-50 border border-green-100 rounded-lg text-xs text-green-700 font-medium">
                  <TrendingDown className="w-3 h-3" />
                  {formatDistance(result.distanceSaved)} saved
                </div>
                <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700 font-medium">
                  <IndianRupee className="w-3 h-3" />
                  {formatCost(result.costSaved)} saved
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleDelete(route.id); }}
                  disabled={isDeleting}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  {isDeleting
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Trash2 className="w-4 h-4" />
                  }
                </button>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </div>

            {/* Expanded details */}
            {isExpanded && (
              <div className="border-t border-gray-100 p-4 space-y-3 bg-gray-50">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Original Distance', value: formatDistance(result.original.totalDistance) },
                    { label: 'Optimized Distance', value: formatDistance(result.optimized.totalDistance) },
                    { label: 'Time Saved', value: formatDuration(result.durationSaved) },
                    { label: 'Cost Saved', value: formatCost(result.costSaved) },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-white rounded-lg p-3 border border-gray-100 text-center">
                      <div className="text-sm font-semibold text-gray-900">{stat.value}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
                    </div>
                  ))}
                </div>

                <div>
                  <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Start Location
                  </h5>
                  <p className="text-sm text-gray-700">{route.route_data.start.name}</p>
                </div>

                <div>
                  <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Delivery Stops ({route.route_data.stops.length})
                  </h5>
                  <ul className="space-y-1">
                    {result.optimized.order.map((stop, i) => (
                      <li key={stop.id} className="flex items-center gap-2 text-sm text-gray-700">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0">
                          {i + 1}
                        </span>
                        <span className="truncate">{stop.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
