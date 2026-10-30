/**
 * Formats a distance in meters to a human-readable string.
 * e.g. 1200 -> "1.2 km", 500 -> "500 m"
 */
export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}

/**
 * Formats a duration in seconds to a human-readable string.
 * e.g. 5000 -> "1h 23m", 300 -> "5m"
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  return `${minutes}m`;
}

/**
 * Formats a fuel amount in liters.
 * e.g. 12.5 -> "12.5 L"
 */
export function formatFuel(liters: number): string {
  return `${liters.toFixed(1)} L`;
}

/**
 * Formats a cost amount in Indian Rupees (INR).
 * e.g. 102.5 -> "₹102.50"
 */
export function formatCost(amount: number): string {
  return `₹${amount.toFixed(2)}`;
}
