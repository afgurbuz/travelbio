'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import { User } from '@supabase/supabase-js'
import { Shuffle, MapPin, Globe, Users } from 'lucide-react'
import Link from 'next/link'

interface Profile {
  id: string
  username: string
  full_name?: string
  bio?: string
  avatar_url?: string
  location_count?: number
  countries_count?: number
}

export default function DiscoverPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [shuffling, setShuffling] = useState(false)

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

  useEffect(() => {
    if (!loading) {
      loadRandomProfiles()
    }
  }, [loading])

  const loadRandomProfiles = async () => {
    setShuffling(true)
    try {
      // Get random profiles with their location counts
      const { data: profilesData, error } = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          full_name,
          bio,
          avatar_url
        `)
        .not('username', 'is', null)
        .limit(50) // Get more than needed for randomization

      if (error) throw error

      if (profilesData && profilesData.length > 0) {
        // Get location counts for each profile
        const profilesWithCounts = await Promise.all(
          profilesData.map(async (profile) => {
            const { data: locationsData } = await supabase
              .from('user_locations')
              .select('country_id')
              .eq('user_id', profile.id)

            const locationCount = locationsData?.length || 0
            const countriesCount = locationsData 
              ? new Set(locationsData.map(l => l.country_id)).size 
              : 0

            return {
              ...profile,
              location_count: locationCount,
              countries_count: countriesCount
            }
          })
        )

        // Filter out profiles with no locations and shuffle
        const profilesWithLocations = profilesWithCounts.filter(p => p.location_count > 0)
        const shuffled = profilesWithLocations.sort(() => 0.5 - Math.random())
        setProfiles(shuffled.slice(0, 10))
      }
    } catch (error) {
      console.error('Error loading profiles:', error)
    } finally {
      setShuffling(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const handleShuffle = () => {
    loadRandomProfiles()
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <>
      <Navigation user={user} onSignOut={handleSignOut} />
      <main className="min-h-screen bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
          <div className="animate-fade-in">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="w-16 h-16 bg-slate-900 dark:bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Globe className="w-8 h-8 text-white dark:text-slate-900" />
              </div>
              <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
                Discover Travelers
              </h1>
              <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-8">
                Explore travel stories from around the world and get inspired for your next adventure.
              </p>
              
              <button
                onClick={handleShuffle}
                disabled={shuffling}
                className="btn-primary px-6 py-3"
              >
                <Shuffle className="w-5 h-5 mr-2" />
                {shuffling ? 'Shuffling...' : 'Shuffle Profiles'}
              </button>
            </div>

            {/* Profiles Grid */}
            {profiles.length === 0 ? (
              <div className="text-center py-16">
                <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                  No travelers found
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-8">
                  Be the first to add your travel experiences!
                </p>
                {user && (
                  <Link href="/profile" className="btn-primary">
                    Add Your Travels
                  </Link>
                )}
                {!user && (
                  <Link href="/auth/signup" className="btn-primary">
                    Join TravelBio
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {profiles.map((profile) => (
                  <Link 
                    key={profile.id} 
                    href={`/${profile.username}`}
                    className="card hover-lift group"
                  >
                    <div className="text-center">
                      {/* Avatar */}
                      <div className="relative inline-block mb-4">
                        {profile.avatar_url ? (
                          <img 
                            src={profile.avatar_url} 
                            alt={profile.username}
                            className="w-20 h-20 rounded-2xl object-cover border border-slate-200 dark:border-slate-800"
                          />
                        ) : (
                          <div className="w-20 h-20 bg-slate-900 dark:bg-slate-100 rounded-2xl flex items-center justify-center text-white dark:text-slate-900 text-2xl font-bold">
                            {profile.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      
                      {/* Name */}
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                        {profile.full_name || profile.username}
                      </h3>
                      
                      <p className="text-slate-600 dark:text-slate-400 text-sm mb-3">
                        @{profile.username}
                      </p>
                      
                      {/* Bio */}
                      {profile.bio && (
                        <p className="text-slate-700 dark:text-slate-300 text-sm mb-4 line-clamp-2">
                          {profile.bio}
                        </p>
                      )}
                      
                      {/* Stats */}
                      <div className="flex justify-center space-x-4 text-sm">
                        <div className="flex items-center text-slate-600 dark:text-slate-400">
                          <Globe className="w-4 h-4 mr-1" />
                          <span>{profile.countries_count} countries</span>
                        </div>
                        <div className="flex items-center text-slate-600 dark:text-slate-400">
                          <MapPin className="w-4 h-4 mr-1" />
                          <span>{profile.location_count} places</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Bottom CTA */}
            {!user && profiles.length > 0 && (
              <div className="text-center mt-16 pt-8 border-t border-slate-200 dark:border-slate-700">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                  Ready to share your story?
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  Join TravelBio and create your own travel profile.
                </p>
                <Link href="/auth/signup" className="btn-primary px-8 py-3 text-lg">
                  <Globe className="w-5 h-5 mr-2" />
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  )
}