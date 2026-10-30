import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout/Layout';
import { RouteHistory } from '../components/History/RouteHistory';
import { useRouteStore } from '../store/routeStore';
import { History } from 'lucide-react';

export function HistoryPage() {
  const { loadRoutes, savedRoutes, isLoadingRoutes } = useRouteStore();

  useEffect(() => {
    loadRoutes();
  }, [loadRoutes]);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
            <History className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Route History</h1>
            <p className="text-sm text-gray-500">Your saved delivery routes</p>
          </div>
        </div>

        <RouteHistory />
      </div>
    </Layout>
  );
}

