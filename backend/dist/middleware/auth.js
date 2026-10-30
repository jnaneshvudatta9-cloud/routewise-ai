"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = void 0;
exports.requireAuth = requireAuth;
const supabase_js_1 = require("@supabase/supabase-js");
let rawUrl = (process.env.SUPABASE_URL || '').trim();
if (rawUrl && !rawUrl.match(/^https?:\/\//i)) {
    rawUrl = `https://${rawUrl}`;
}
const supabaseUrl = rawUrl || 'https://placeholder.supabase.co';
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key').trim();
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('Warning: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured. Auth verification will fail until valid Supabase credentials are provided.');
}
const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});
exports.supabase = supabase;
async function requireAuth(req, res, next) {
    const isConfigured = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
    const authHeader = req.headers.authorization;
    // If user is operating under local guest/demo mode, or no token is attached yet
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        req.user = {
            id: 'demo-user-id',
            email: 'demo@routewise.local',
        };
        return next();
    }
    const token = authHeader.slice(7); // Remove "Bearer "
    // If Supabase keys aren't configured yet, allow the guest session
    if (!isConfigured) {
        req.user = {
            id: 'demo-user-id',
            email: 'demo@routewise.local',
        };
        return next();
    }
    try {
        const { data, error } = await supabase.auth.getUser(token);
        if (error || !data.user) {
            // In dev/demo session, fallback gracefully to guest demo user
            req.user = {
                id: 'demo-user-id',
                email: 'demo@routewise.local',
            };
            return next();
        }
        req.user = {
            id: data.user.id,
            email: data.user.email,
        };
        next();
    }
    catch (err) {
        // If token verification fails unexpectedly, fallback to demo user in dev
        req.user = {
            id: 'demo-user-id',
            email: 'demo@routewise.local',
        };
        next();
    }
}
