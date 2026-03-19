'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/Logo';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      {/* Navigation */}
      <header className="flex items-center justify-between px-6 sm:px-8 lg:px-12 py-6 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <Logo className="text-white" />
          <p className="text-sm text-gray-300">AI Forecasting for SMEs</p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/auth/signin"
            className="px-6 py-2 text-sm font-semibold text-gray-300 hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <button
            onClick={() => router.push('/auth/signup')}
            className="px-6 py-2 text-sm font-bold rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background gradients */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"></div>

        <div className="relative max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-20 sm:py-32">
          <div className="text-center space-y-8">
            {/* Main Heading */}
            <div className="space-y-4">
              <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-tight">
                <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  AI-Powered Business
                </span>
                <br />
                <span className="text-white">Forecasting Made Simple</span>
              </h2>
              <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                Unlock data-driven insights and predict market trends with precision. Empower your business decisions with intelligent forecasting.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button
                onClick={() => router.push('/auth/signup')}
                className="w-full sm:w-auto px-8 py-4 text-lg font-bold rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-2xl hover:shadow-blue-500/50"
              >
                Start Free Trial
              </button>
              <button
                onClick={() => {}}
                className="w-full sm:w-auto px-8 py-4 text-lg font-bold rounded-lg border-2 border-gray-600 text-white hover:border-blue-400 hover:bg-blue-400/10 transition-all duration-200"
              >
                Watch Demo
              </button>
            </div>

            {/* Trust Section */}
            <div className="pt-12 border-t border-slate-700/50">
              <p className="text-sm text-gray-500 mb-6">Trusted by leading businesses worldwide</p>
              <div className="flex items-center justify-center gap-8 flex-wrap">
                <div className="text-center">
                  <p className="text-3xl font-black text-blue-400">10K+</p>
                  <p className="text-sm text-gray-400">Active Users</p>
                </div>
                <div className="w-px h-12 bg-slate-700"></div>
                <div className="text-center">
                  <p className="text-3xl font-black text-indigo-400">98%</p>
                  <p className="text-sm text-gray-400">Accuracy Rate</p>
                </div>
                <div className="w-px h-12 bg-slate-700"></div>
                <div className="text-center">
                  <p className="text-3xl font-black text-purple-400">50+</p>
                  <p className="text-sm text-gray-400">Countries</p>
                </div>
              </div>
            </div>
          </div>

          {/* Hero Image/Graphic */}
          <div className="mt-20 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-2xl blur-xl"></div>
            <div className="relative bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl p-8 border border-slate-600/50">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-black text-blue-400">📈</p>
                  <p className="text-sm font-semibold mt-2">Growth Analytics</p>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-black text-indigo-400">🤖</p>
                  <p className="text-sm font-semibold mt-2">AI Predictions</p>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-black text-purple-400">⚡</p>
                  <p className="text-sm font-semibold mt-2">Real-Time Insights</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="bg-slate-800/50 border-t border-slate-700/50 py-20 sm:py-32">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
          <h3 className="text-4xl font-black text-center mb-16">
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Why Choose ForecastFlow?
            </span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: 'Advanced AI', desc: 'Machine learning models trained on millions of data points' },
              { title: 'Real-Time Data', desc: 'Live market updates and instant predictions' },
              { title: 'Easy Integration', desc: 'Connect your data sources in minutes' },
              { title: 'Secure & Private', desc: 'Enterprise-grade security for your data' },
              { title: '24/7 Support', desc: 'Expert support team always ready to help' },
              { title: 'Affordable Pricing', desc: 'Flexible plans for businesses of all sizes' },
            ].map((feature, idx) => (
              <div key={idx} className="bg-slate-700/50 border border-slate-600/50 rounded-xl p-6 hover:border-blue-500/50 transition-colors">
                <h4 className="text-xl font-bold mb-2 text-blue-400">{feature.title}</h4>
                <p className="text-gray-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="bg-slate-900 border-t border-slate-700/50 py-20 sm:py-32">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
          <h3 className="text-4xl font-black text-center mb-16">
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Simple Pricing in KES
            </span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'Starter', price: 'KSh 2,500', period: '/month', features: ['Basic forecasting', '5 data sources', 'Email support'] },
              { name: 'Professional', price: 'KSh 7,500', period: '/month', features: ['Advanced AI models', 'Unlimited data sources', 'Priority support'], popular: true },
              { name: 'Enterprise', price: 'KSh 15,000', period: '/month', features: ['Custom AI training', 'API access', 'Dedicated account manager'] },
            ].map((plan, idx) => (
              <div key={idx} className={`bg-slate-800 border rounded-xl p-8 ${plan.popular ? 'border-blue-500 ring-2 ring-blue-500/50' : 'border-slate-600/50'} relative`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                    Most Popular
                  </div>
                )}
                <h4 className="text-2xl font-bold mb-4">{plan.name}</h4>
                <div className="mb-6">
                  <span className="text-4xl font-black">{plan.price}</span>
                  <span className="text-gray-400">{plan.period}</span>
                </div>
                <ul className="space-y-2 mb-8">
                  {plan.features.map((feature, fidx) => (
                    <li key={fidx} className="flex items-center text-gray-300">
                      <span className="text-green-400 mr-2">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => router.push('/auth/signup')}
                  className={`w-full py-3 px-4 rounded-lg font-bold transition-all duration-200 ${
                    plan.popular
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-slate-700 hover:bg-slate-600 text-white'
                  }`}
                >
                  Get Started
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-20 sm:py-32 text-center">
        <h3 className="text-4xl sm:text-5xl font-black mb-6">Ready to transform your business?</h3>
        <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
          Join thousands of businesses already using ForecastFlow to make smarter decisions.
        </p>
        <button
          onClick={() => router.push('/auth/signup')}
          className="px-8 py-4 text-lg font-bold rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-2xl hover:shadow-blue-500/50"
        >
          Get Started Free
        </button>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 bg-slate-900 py-8">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 text-center text-gray-500 text-sm">
          <p>&copy; 2026 ForecastFlow. All rights reserved. | Privacy Policy | Terms of Service</p>
        </div>
      </footer>
    </div>
  );
}