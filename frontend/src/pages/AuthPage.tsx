import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Route } from 'lucide-react';
import { LoginForm } from '../components/Auth/LoginForm';
import { RegisterForm } from '../components/Auth/RegisterForm';
import { useAuth } from '../hooks/useAuth';
import { useAuthStore } from '../store/authStore';
import type { User } from '@supabase/supabase-js';

export function AuthPage() {
  const { isAuthenticated, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-2 text-gray-500">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/plan" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-2xl shadow-lg mb-4">
            <Route className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Route<span className="text-indigo-600">Wise</span> AI
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Smart delivery route optimization powered by AI
          </p>
        </div>

        {/* Auth card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-3.5 text-sm font-medium transition-colors ${
                activeTab === 'login'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`flex-1 py-3.5 text-sm font-medium transition-colors ${
                activeTab === 'register'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Form */}
          <div className="p-6">
            {activeTab === 'login' ? (
              <>
                <p className="text-sm text-gray-600 mb-5">
                  Welcome back! Sign in to access your routes.
                </p>
                <LoginForm />
              </>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-5">
                  Join RouteWise AI and start optimizing your deliveries.
                </p>
                <RegisterForm />
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 pb-5 text-center space-y-3">
            {activeTab === 'login' ? (
              <p className="text-xs text-gray-500">
                Don't have an account?{' '}
                <button
                  onClick={() => setActiveTab('register')}
                  className="text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Sign up for free
                </button>
              </p>
            ) : (
              <p className="text-xs text-gray-500">
                Already have an account?{' '}
                <button
                  onClick={() => setActiveTab('login')}
                  className="text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Sign in
                </button>
              </p>
            )}

            {/* Quick Demo Mode Login for Hackathons & Evaluators */}
            <div className="pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  const demoUser = {
                    id: 'demo-user-id',
                    email: 'demo@routewise.local',
                    app_metadata: {},
                    user_metadata: { name: 'Demo Driver' },
                    aud: 'authenticated',
                    created_at: new Date().toISOString(),
                  } as unknown as User;
                  useAuthStore.setState({ user: demoUser, session: null, loading: false });
                }}
                className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 transition-colors flex items-center justify-center gap-1.5"
              >
                🚀 Continue as Demo / Guest Driver
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          By signing in, you agree to our terms of service and privacy policy.
        </p>
      </div>
    </div>
  );
}
