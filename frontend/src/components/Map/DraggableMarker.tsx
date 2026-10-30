import React, { useState } from 'react';
import { Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import type { Location } from '../../types';

interface DraggableMarkerProps {
  position: [number, number];
  onPositionChange: (location: Partial<Location>) => void;
}

const draggableIcon = L.divIcon({
  html: `
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
      <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 26 14 26S28 24.5 28 14C28 6.27 21.73 0 14 0z" fill="#4f46e5" stroke="white" stroke-width="2"/>
      <circle cx="14" cy="14" r="5" fill="white"/>
    </svg>
  `,
  iconSize: [28, 40],
  iconAnchor: [14, 40],
  popupAnchor: [0, -40],
  className: '',
});

export function DraggableMarker({ position, onPositionChange }: DraggableMarkerProps) {
  const [pos, setPos] = useState<[number, number]>(position);

  const markerRef = React.useRef<L.Marker>(null);

  const eventHandlers = {
    dragend() {
      const marker = markerRef.current;
      if (marker) {
        const latLng = marker.getLatLng();
        const newPos: [number, number] = [latLng.lat, latLng.lng];
        setPos(newPos);
        onPositionChange({ lat: latLng.lat, lon: latLng.lng });
      }
    },
  };

  return (
    <Marker
      draggable
      eventHandlers={eventHandlers}
      position={pos}
      icon={draggableIcon}
      ref={markerRef}
    />
  );
}
