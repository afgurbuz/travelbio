'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import { User } from '@supabase/supabase-js'
import { Shuffle, MapPin, Globe, Users, Sparkles, Star } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

interface Profile {
  id: string
  username: string
  full_name?: string
  bio?: string
  avatar_url?: string
  location_count?: number
  countries_count?: number
}

interface Country {
  id: number
  code: string
  name: string
  flag: string
  visitor_count?: number
  avg_overall?: number
}

export default function DiscoverPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [countries, setCountries] = useState<Country[]>([])
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
      loadPopularCountries()
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
          profilesData.map(async (profile: any) => {
            const { data: locationsData } = await supabase
              .from('user_locations')
              .select('country_id')
              .eq('user_id', profile.id)

            const locationCount = locationsData?.length || 0
            const countriesCount = locationsData 
              ? new Set(locationsData.map((l: any) => l.country_id)).size 
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

  const loadPopularCountries = async () => {
    try {
      // Load countries with ratings data
      const { data: ratingsData, error } = await supabase
        .from('country_ratings')
        .select(`
          *,
          country:countries(*)
        `)
        .gte('visitor_count', 1)
        .order('visitor_count', { ascending: false })
        .limit(10)

      if (error) throw error

      if (ratingsData) {
        const countriesWithStats: Country[] = ratingsData
          .filter((r: any) => r.country)
          .map((r: any) => ({
            id: r.country.id,
            code: r.country.code,
            name: r.country.name,
            flag: r.country.flag,
            visitor_count: r.visitor_count,
            avg_overall: r.avg_overall
          }))

        setCountries(countriesWithStats)
      }
    } catch (error) {
      console.error('Error loading countries:', error)
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
      <main className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-8">
          <div className="animate-fade-in">
            {/* Header - Facebook Style */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                  Discover Fellow Travelers
                </h1>
                
                <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-6">
                  Connect with travelers from around the world and get inspired for your next adventure.
                </p>
                
                <button
                  onClick={handleShuffle}
                  disabled={shuffling}
                  className="btn-facebook"
                >
                  <Shuffle className="w-5 h-5" />
                  {shuffling ? 'Finding new travelers...' : 'Discover New Travelers'}
                </button>
              </div>
            </div>

            {/* Profiles Grid - Facebook Feed Style */}
            {profiles.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No travelers found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Be the first to add your travel experiences!
                </p>
                {user ? (
                  <Link href="/profile" className="btn-facebook">
                    Add Your Travels
                  </Link>
                ) : (
                  <Link href="/auth/signup" className="btn-facebook">
                    Join TravelBio
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {profiles.map((profile, index) => (
                  <div 
                    key={profile.id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <Link href={`/${profile.username}`} className="block p-6">
                      <div className="flex items-start space-x-4">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                          <Avatar className="w-16 h-16">
                            <AvatarImage 
                              src={profile.avatar_url || undefined} 
                              alt={profile.username}
                              className="object-cover"
                            />
                            <AvatarFallback className="bg-blue-600 text-white text-lg font-bold">
                              {profile.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full"></div>
                        </div>
                        
                        {/* Profile Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-1 truncate">
                            {profile.full_name || profile.username}
                          </h3>
                          <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
                            @{profile.username}
                          </p>
                          
                          {/* Bio */}
                          {profile.bio && (
                            <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
                              {profile.bio}
                            </p>
                          )}
                          
                          {/* Stats */}
                          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <Globe className="w-4 h-4" />
                              <span>{profile.countries_count} countries</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              <span>{profile.location_count} places</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            )}

            {/* Popular Countries Section - Facebook Style */}
            {countries.length > 0 && (
              <div className="mt-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      Popular Destinations
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      Discover the most visited countries by our travel community
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {countries.map((country, index) => (
                      <Link 
                        key={country.id}
                        href={`/country/${country.code.toLowerCase()}`}
                        className="block p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <div className="text-center space-y-3">
                          <div className="text-3xl">{country.flag}</div>
                          <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                            {country.name}
                          </h3>
                          
                          <div className="space-y-1">
                            <div className="flex items-center justify-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                              <Users className="w-3 h-3" />
                              <span>{country.visitor_count} travelers</span>
                            </div>
                            
                            {country.avg_overall && country.avg_overall > 0 && (
                              <div className="flex items-center justify-center gap-1 text-xs text-yellow-600">
                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                <span>{country.avg_overall.toFixed(1)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Bottom CTA - Facebook Style */}
            {!user && profiles.length > 0 && (
              <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  Ready to share your story?
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  Join TravelBio and create your own travel profile to connect with fellow explorers.
                </p>
                <Link href="/auth/signup" className="btn-facebook">
                  <Globe className="w-5 h-5" />
                  Start Your Journey
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  )
}