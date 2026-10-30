import React from 'react';
import { Fuel, IndianRupee } from 'lucide-react';
import { useRouteStore } from '../../store/routeStore';

export function VehicleConfig() {
  const { vehicleConfig, setVehicleConfig } = useRouteStore();

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
        <Fuel className="w-4 h-4 text-amber-500" />
        Vehicle Settings
      </h3>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="fuel-efficiency"
            className="block text-xs font-medium text-gray-600 mb-1"
          >
            Fuel Efficiency
          </label>
          <div className="relative">
            <input
              id="fuel-efficiency"
              type="number"
              min="1"
              max="100"
              step="0.5"
              value={vehicleConfig.fuelEfficiency}
              onChange={(e) =>
                setVehicleConfig({ fuelEfficiency: parseFloat(e.target.value) || 1 })
              }
              className="input-field pr-12 text-sm"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-xs text-gray-400">km/L</span>
            </div>
          </div>
        </div>

        <div>
          <label
            htmlFor="fuel-price"
            className="block text-xs font-medium text-gray-600 mb-1"
          >
            Fuel Price (INR)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <IndianRupee className="h-3.5 w-3.5 text-gray-400" />
            </div>
            <input
              id="fuel-price"
              type="number"
              min="10"
              max="300"
              step="0.5"
              value={vehicleConfig.fuelPrice}
              onChange={(e) =>
                setVehicleConfig({ fuelPrice: parseFloat(e.target.value) || 1 })
              }
              className="input-field pl-8 pr-12 text-sm"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-xs text-gray-400">/L</span>
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-400">
        Used to calculate fuel costs for your delivery route in ₹ (INR)
      </p>
    </div>
  );
}
