'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import { User } from '@supabase/supabase-js'
import { Globe, MapPin, Users, ArrowRight } from 'lucide-react'
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
        <main className="min-h-screen bg-white dark:bg-slate-950">
          {/* Hero Section */}
          <section className="px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
            <div className="max-w-4xl mx-auto text-center">
              <div className="flex justify-center mb-8">
                <div className="w-16 h-16 bg-slate-900 dark:bg-slate-100 rounded-2xl flex items-center justify-center">
                  <Globe className="w-8 h-8 text-white dark:text-slate-900" />
                </div>
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white mb-6">
                Document Your
                <br />
                Travel Journey
              </h1>
              
              <p className="text-xl text-slate-600 dark:text-slate-400 mb-12 max-w-2xl mx-auto">
                Keep track of places you've lived and visited. 
                Share your travel story with the world.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/signup" className="btn-primary px-8 py-3 text-lg">
                  Get Started
                  <ArrowRight className="ml-2 w-5 h-5 inline" />
                </Link>
                <Link href="/auth/signin" className="btn-secondary px-8 py-3 text-lg">
                  Sign In
                </Link>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="px-4 sm:px-6 lg:px-8 py-20 bg-slate-50 dark:bg-slate-900">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-16 text-slate-900 dark:text-white">
                Simple. Clean. Organized.
              </h2>
              
              <div className="grid md:grid-cols-3 gap-12">
                <div className="text-center">
                  <div className="w-12 h-12 bg-slate-900 dark:bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                    <MapPin className="w-6 h-6 text-white dark:text-slate-900" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-slate-900 dark:text-white">
                    Track Locations
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Add countries and cities you've lived in or visited with a simple interface.
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-slate-900 dark:bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                    <Users className="w-6 h-6 text-white dark:text-slate-900" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-slate-900 dark:text-white">
                    Share Profiles
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Create public profiles that anyone can view and get inspired by your travels.
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-slate-900 dark:bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                    <Globe className="w-6 h-6 text-white dark:text-slate-900" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-slate-900 dark:text-white">
                    Discover Places
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Explore where others have been and discover your next destination.
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
      <main className="min-h-screen bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-fade-in">
            {/* Welcome */}
            <div className="mb-12">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                Welcome back
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                {user.email?.split('@')[0]}
              </p>
            </div>
            
            {/* Quick Actions */}
            <div className="grid md:grid-cols-2 gap-8">
              <Link href="/profile" className="card hover-lift group">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                      Manage Profile
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400">
                      Update your travel locations and profile information
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                </div>
              </Link>
              
              <Link href="/discover" className="card hover-lift group">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                      Discover Travelers
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400">
                      Explore profiles and travel stories from around the world
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                </div>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}