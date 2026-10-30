"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nearestNeighbor = nearestNeighbor;
exports.twoOpt = twoOpt;
exports.totalCost = totalCost;
/**
 * Nearest-Neighbor heuristic for TSP.
 * @param matrix  Square cost matrix (e.g. durations in seconds)
 * @param startIdx  Index of the starting location (always 0 = depot)
 * @returns  Ordered list of stop indices (not including startIdx)
 */
function nearestNeighbor(matrix, startIdx) {
    const n = matrix.length;
    const visited = new Set([startIdx]);
    const order = [];
    let current = startIdx;
    while (order.length < n - 1) {
        let bestNext = -1;
        let bestCost = Infinity;
        for (let i = 0; i < n; i++) {
            if (!visited.has(i)) {
                const cost = matrix[current][i];
                if (cost < bestCost) {
                    bestCost = cost;
                    bestNext = i;
                }
            }
        }
        if (bestNext === -1)
            break;
        visited.add(bestNext);
        order.push(bestNext);
        current = bestNext;
    }
    return order;
}
/**
 * 2-opt local search improvement.
 * Tries all pairs (i, k) and reverses the segment between them if it improves the tour cost.
 * @param order  Current visit order of stop indices (NOT including start)
 * @param matrix  Full square cost matrix
 * @returns  Improved order
 */
function twoOpt(order, matrix) {
    const startIdx = 0; // depot is always index 0
    let improved = true;
    let best = [...order];
    while (improved) {
        improved = false;
        for (let i = 0; i < best.length - 1; i++) {
            for (let k = i + 1; k < best.length; k++) {
                const before = totalCost(best, matrix, startIdx);
                // Reverse the segment [i..k]
                const candidate = [
                    ...best.slice(0, i),
                    ...best.slice(i, k + 1).reverse(),
                    ...best.slice(k + 1),
                ];
                const after = totalCost(candidate, matrix, startIdx);
                if (after < before) {
                    best = candidate;
                    improved = true;
                }
            }
        }
    }
    return best;
}
/**
 * Compute total route cost: start → order[0] → order[1] → … → order[n-1].
 * Does NOT add return-to-start cost because RouteWise is a one-way delivery route.
 */
function totalCost(order, matrix, startIdx) {
    if (order.length === 0)
        return 0;
    let cost = matrix[startIdx][order[0]];
    for (let i = 0; i < order.length - 1; i++) {
        cost += matrix[order[i]][order[i + 1]];
    }
    return cost;
}
