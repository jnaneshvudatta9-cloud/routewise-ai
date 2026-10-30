import React from 'react';
import { Trash2, GripVertical } from 'lucide-react';
import { AddressSearch } from './AddressSearch';
import { useRouteStore } from '../../store/routeStore';
import type { Stop, Location } from '../../types';

interface StopItemProps {
  stop: Stop;
  index: number;
  isDragging?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

const priorityOptions: { value: Stop['priority']; label: string; color: string }[] = [
  { value: 'high', label: 'High', color: 'text-red-600 bg-red-50 border-red-200' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
  { value: 'low', label: 'Low', color: 'text-green-600 bg-green-50 border-green-200' },
];

export function StopItem({ stop, index, dragHandleProps }: StopItemProps) {
  const { updateStop, removeStop } = useRouteStore();

  const handleLocationSelect = (location: Location) => {
    updateStop(stop.id, location);
  };

  const handlePriorityChange = (priority: Stop['priority']) => {
    updateStop(stop.id, { priority });
  };

  const priorityConfig = priorityOptions.find((p) => p.value === stop.priority)!;

  return (
    <div className="flex items-start gap-2 p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Drag handle */}
      <div
        {...dragHandleProps}
        className="mt-2 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
        title="Drag to reorder"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Stop number badge */}
      <div className="flex-shrink-0 w-7 h-7 mt-1.5 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
        {index + 1}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-2">
        <AddressSearch
          value={stop.name}
          placeholder="Search delivery address..."
          onSelect={handleLocationSelect}
        />

        {/* Priority selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500 mr-1">Priority:</span>
          {priorityOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handlePriorityChange(opt.value)}
              className={`px-2 py-0.5 text-xs font-medium rounded-full border transition-all ${
                stop.priority === opt.value
                  ? opt.color + ' ring-2 ring-offset-1 ring-current'
                  : 'text-gray-500 bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Remove button */}
      <button
        type="button"
        onClick={() => removeStop(stop.id)}
        className="mt-1.5 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        title="Remove stop"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
