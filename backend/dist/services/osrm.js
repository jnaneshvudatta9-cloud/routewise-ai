"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTable = getTable;
exports.getRoute = getRoute;
const node_fetch_1 = __importDefault(require("node-fetch"));
const OSRM_BASE_URL = process.env.OSRM_BASE_URL || 'https://router.project-osrm.org';
const TIMEOUT_MS = 15000;
function buildCoordsString(coords) {
    return coords.map((c) => `${c.lon},${c.lat}`).join(';');
}
function withTimeout(promise, ms) {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error(`OSRM request timed out after ${ms}ms`)), ms)),
    ]);
}
/**
 * Fetch a duration + distance matrix from the OSRM Table API.
 */
async function getTable(coords) {
    const coordsStr = buildCoordsString(coords);
    const url = `${OSRM_BASE_URL}/table/v1/driving/${coordsStr}?annotations=duration,distance`;
    const response = await withTimeout((0, node_fetch_1.default)(url, {
        headers: { 'User-Agent': 'RouteWiseAI/1.0' },
    }), TIMEOUT_MS);
    if (!response.ok) {
        throw new Error(`OSRM Table API HTTP error: ${response.status} ${response.statusText}`);
    }
    const data = (await response.json());
    if (data.code !== 'Ok') {
        throw new Error(`OSRM Table API error: ${data.code} – ${data.message ?? 'unknown'}`);
    }
    if (!data.durations || !data.distances) {
        throw new Error('OSRM Table API returned incomplete data (missing durations or distances)');
    }
    return {
        durations: data.durations,
        distances: data.distances,
    };
}
/**
 * Fetch a route geometry + totals from the OSRM Route API.
 */
async function getRoute(waypoints) {
    const coordsStr = buildCoordsString(waypoints);
    const url = `${OSRM_BASE_URL}/route/v1/driving/${coordsStr}?overview=full&geometries=geojson`;
    const response = await withTimeout((0, node_fetch_1.default)(url, {
        headers: { 'User-Agent': 'RouteWiseAI/1.0' },
    }), TIMEOUT_MS);
    if (!response.ok) {
        throw new Error(`OSRM Route API HTTP error: ${response.status} ${response.statusText}`);
    }
    const data = (await response.json());
    if (data.code !== 'Ok') {
        throw new Error(`OSRM Route API error: ${data.code} – ${data.message ?? 'unknown'}`);
    }
    if (!data.routes || data.routes.length === 0) {
        throw new Error('OSRM Route API returned no routes');
    }
    const route = data.routes[0];
    return {
        distance: route.distance,
        duration: route.duration,
        geometry: route.geometry,
    };
}
