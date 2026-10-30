import React from 'react';
import { Plus, Package } from 'lucide-react';
import { StopItem } from './StopItem';
import { useRouteStore } from '../../store/routeStore';

export function StopList() {
  const { stops, addStop, reorderStops } = useRouteStore();

  const handleAddStop = () => {
    addStop({
      lat: 0,
      lon: 0,
      name: '',
      priority: 'medium',
    });
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('dragIndex', String(index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = Number(e.dataTransfer.getData('dragIndex'));
    if (dragIndex === dropIndex) return;

    const reordered = [...stops];
    const [removed] = reordered.splice(dragIndex, 1);
    reordered.splice(dropIndex, 0, removed);
    reorderStops(reordered);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-semibold text-gray-900">
            Delivery Stops
            {stops.length > 0 && (
              <span className="ml-2 text-xs font-normal text-gray-500">({stops.length})</span>
            )}
          </h3>
        </div>
        <button
          type="button"
          onClick={handleAddStop}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Stop
        </button>
      </div>

      {stops.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 px-4 border-2 border-dashed border-gray-200 rounded-lg text-center">
          <Package className="w-8 h-8 text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">No delivery stops added yet</p>
          <p className="text-xs text-gray-400 mt-1">Click "Add Stop" or use the "Load Demo" button</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {stops.map((stop, index) => (
            <div
              key={stop.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              className="transition-opacity"
            >
              <StopItem
                stop={stop}
                index={index}
                dragHandleProps={{
                  onMouseDown: (e) => e.currentTarget.parentElement?.setAttribute('draggable', 'true'),
                }}
              />
            </div>
          ))}
        </div>
      )}

      {stops.length >= 2 && (
        <p className="text-xs text-gray-400 text-center">
          Drag stops to manually set order (optimization will override this)
        </p>
      )}
    </div>
  );
}
