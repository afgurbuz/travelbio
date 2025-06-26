'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import { User } from '@supabase/supabase-js'
import { MapPin, Users, Globe, ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: any, session: any) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="spinner"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <>
        <Navigation user={null} />
        <main className="min-h-screen">
          {/* Hero Section */}
          <section className="relative overflow-hidden bg-gradient-to-br from-sky-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-950 dark:to-sky-950">
            <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
              <div className="text-center animate-fade-in">
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <Globe className="w-20 h-20 text-sky-500 animate-pulse" />
                    <Sparkles className="w-8 h-8 text-yellow-400 absolute -top-2 -right-2" />
                  </div>
                </div>
                <h1 className="text-5xl lg:text-7xl font-bold mb-6">
                  <span className="bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent">
                    Share Your
                  </span>
                  <br />
                  <span className="text-gray-900 dark:text-white">Travel Journey</span>
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
                  Connect with fellow travelers, showcase the places you've lived and visited, 
                  and discover amazing destinations around the world.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/auth/signup"
                    className="inline-flex items-center px-8 py-4 text-lg font-semibold text-white bg-sky-500 hover:bg-sky-600 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                  >
                    Get Started
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                  <Link
                    href="/auth/signin"
                    className="inline-flex items-center px-8 py-4 text-lg font-semibold text-gray-700 bg-white hover:bg-gray-50 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    Sign In
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="py-20 bg-white dark:bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
                Why TravelBio?
              </h2>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center animate-slide-up">
                  <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-sky-100 dark:bg-sky-900/20 rounded-2xl">
                    <MapPin className="w-8 h-8 text-sky-500" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                    Track Your Journey
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Keep a beautiful record of all the countries and cities you've lived in or visited.
                  </p>
                </div>
                <div className="text-center animate-slide-up" style={{ animationDelay: '0.1s' }}>
                  <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-sky-100 dark:bg-sky-900/20 rounded-2xl">
                    <Users className="w-8 h-8 text-sky-500" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                    Connect with Travelers
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Find and connect with people who share your passion for travel and exploration.
                  </p>
                </div>
                <div className="text-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
                  <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-sky-100 dark:bg-sky-900/20 rounded-2xl">
                    <Globe className="w-8 h-8 text-sky-500" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                    Discover New Places
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Get inspired by other travelers' journeys and discover your next destination.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </main>
      </>
    )
  }

  return (
    <>
      <Navigation user={user} onSignOut={handleSignOut} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
            Welcome back, {user.email?.split('@')[0]}! 👋
          </h1>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 hover-scale">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Quick Actions
              </h2>
              <div className="space-y-3">
                <Link
                  href="/profile"
                  className="flex items-center justify-between p-3 bg-sky-50 dark:bg-sky-900/20 rounded-lg hover:bg-sky-100 dark:hover:bg-sky-900/30 transition-colors"
                >
                  <span className="text-sky-700 dark:text-sky-400 font-medium">Update Your Profile</span>
                  <ArrowRight className="w-4 h-4 text-sky-700 dark:text-sky-400" />
                </Link>
                <Link
                  href="/discover"
                  className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                >
                  <span className="text-purple-700 dark:text-purple-400 font-medium">Explore Travelers</span>
                  <ArrowRight className="w-4 h-4 text-purple-700 dark:text-purple-400" />
                </Link>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 hover-scale">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Your Stats
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Countries Lived</span>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Countries Visited</span>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Cities Total</span>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">0</span>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 hover-scale">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Recent Activity
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                No recent activity. Start by updating your travel profile!
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}