import axios from 'axios';
import { supabase } from './supabase';

// On Vercel (or any cloud static host), requests to /api are proxied by vercel.json directly to Render,
// which eliminates CORS, cross-origin security blocks, and origin mismatch completely!
const defaultApiUrl =
  typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? ''
    : 'http://localhost:3001';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || defaultApiUrl,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  try {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) {
      config.headers.Authorization = `Bearer ${data.session.access_token}`;
    }
  } catch (err) {
    // If Supabase session lookup fails or times out, proceed to allow guest demo fallback
    console.warn('Session check skipped, proceeding with guest request');
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    let message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An unexpected error occurred';

    if (error.code === 'ERR_NETWORK' || message.includes('Network Error')) {
      message =
        'Backend server is waking up or unreachable. If on Render, please allow ~30 seconds for the free service to spin up and try again.';
    }

    return Promise.reject(new Error(message));
  }
);

export default api;
