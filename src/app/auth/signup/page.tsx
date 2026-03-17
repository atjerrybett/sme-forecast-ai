'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function SignUp() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (signUpData.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: signUpData.user.id,
            full_name: fullName,
          },
        ]);

      if (profileError) {
        console.error('Profile creation error:', profileError);
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
      } else {
        router.push('/dashboard');
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 p-6 sm:p-8 bg-white rounded-2xl shadow-2xl">
        
        {/* Modern Logo & ForecastFlow Header */}
        <div className="flex flex-col items-center space-y-6">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl blur-xl opacity-50"></div>
            <div className="relative flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 rounded-2xl shadow-2xl">
              <span className="text-3xl font-black">📊</span>
            </div>
          </div>

          <div className="text-center space-y-2">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                ForecastFlow
              </span>
            </h1>
            <p className="text-sm font-semibold text-gray-600 tracking-wide uppercase">
              AI-Powered Business Intelligence
            </p>
          </div>
        </div>

        <div className="text-center space-y-3 pt-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Create your account</h2>
          <p className="text-sm text-gray-600">
            Join thousands of businesses forecasting smarter
          </p>
        </div>

        <form onSubmit={handleSignUp} className="mt-8 space-y-5">
          <div className="space-y-4">
            <div>
              <label htmlFor="full-name" className="block text-sm font-semibold text-gray-800 mb-2">
                Full Name
              </label>
              <input
                id="full-name"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-base text-gray-900 placeholder-gray-400 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none hover:border-gray-300"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-800 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-base text-gray-900 placeholder-gray-400 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none hover:border-gray-300"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-800 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-base text-gray-900 placeholder-gray-400 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none hover:border-gray-300"
                placeholder="••••••••"
              />
              <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border-2 border-red-200 p-4">
              <p className="text-red-700 text-sm font-medium text-center">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center py-3 px-4 text-base font-bold rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:from-blue-800 active:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {loading ? 'Creating account...' : 'Sign up'}
          </button>
        </form>

        <div className="text-center pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <a 
              href="/auth/signin" 
              className="font-bold text-blue-600 hover:text-blue-700 active:text-blue-800 transition-colors duration-200 underline decoration-2 underline-offset-2"
            >
              Sign in here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}