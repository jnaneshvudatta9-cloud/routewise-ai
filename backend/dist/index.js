"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const geocode_1 = __importDefault(require("./routes/geocode"));
const optimize_1 = __importDefault(require("./routes/optimize"));
const explain_1 = __importDefault(require("./routes/explain"));
const routes_1 = __importDefault(require("./routes/routes"));
const traffic_1 = __importDefault(require("./routes/traffic"));
const app = (0, express_1.default)();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
// Security middleware - disable helmet crossOriginResourcePolicy that blocks cloud cross-origin calls
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: false,
}));
// CORS: Permissive origin callback to allow all Vercel domains, localhost, and custom domains
app.use((0, cors_1.default)({
    origin: true, // Echoes the request origin, allowing all browsers to connect
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS', 'PUT', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: true,
}));
// Body parser
app.use(express_1.default.json({ limit: '1mb' }));
// Global rate limiting: 100 requests per 15 minutes
const globalLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
});
app.use(globalLimiter);
// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Routes
app.use('/api/geocode', geocode_1.default);
app.use('/api/optimize', optimize_1.default);
app.use('/api/traffic', traffic_1.default);
app.use('/api/explain', explain_1.default);
app.use('/api/routes', routes_1.default);
// 404 handler
app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found' });
});
// Global error handler
app.use((err, _req, res, _next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});
app.listen(PORT, () => {
    console.log(`RouteWise backend listening on port ${PORT}`);
    console.log(`Allowing CORS for: ${FRONTEND_URL}`);
});
exports.default = app;
