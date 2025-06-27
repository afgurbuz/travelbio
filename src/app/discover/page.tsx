'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import { User } from '@supabase/supabase-js'
import { Shuffle, MapPin, Globe, Users, Star } from 'lucide-react'
import Link from 'next/link'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

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
    if (profiles.length === 0) setShuffling(true)
    
    try {
      // Load profiles with location counts
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, username, full_name, bio, avatar_url')
        .limit(50)

      if (profilesData && profilesData.length > 0) {
        // Calculate location and country counts for each profile
        const profilesWithCounts = await Promise.all(
          profilesData.map(async (profile: any) => {
            const { count: locationCount } = await supabase
              .from('user_locations')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', profile.id)

            const { data: countriesData } = await supabase
              .from('user_locations')
              .select('country_id')
              .eq('user_id', profile.id)

            const uniqueCountries = new Set(countriesData?.map((l: any) => l.country_id) || [])
            const countriesCount = uniqueCountries.size

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
        setProfiles(shuffled.slice(0, 12))
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
      <main className="min-h-screen bg-white dark:bg-black">
        {/* Simple Header */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="heading-lg mb-4">
              Discover Travel Stories
            </h1>
            
            <p className="text-gray-600 dark:text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
              Explore incredible journeys from travelers around the world
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <button
                onClick={handleShuffle}
                disabled={shuffling}
                className="btn-primary mobile-touch"
              >
                <Shuffle className="w-5 h-5 mr-2" />
                {shuffling ? 'Loading...' : 'Discover Travelers'}
              </button>
              
              {!user && (
                <Link href="/auth/signup" className="btn-secondary mobile-touch">
                  Share Your Story
                </Link>
              )}
            </div>
          </div>
        </section>
        
        {/* Main Content */}
        <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 pb-20 md:pb-8">
            <div className="animate-fade-in">
              {/* Profiles Grid */}
              {profiles.length === 0 ? (
                <div className="card-clean max-w-md mx-auto p-8 text-center">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    No travelers found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Be the first to add your travel experiences!
                  </p>
                  {user ? (
                    <Link href="/profile" className="btn-primary">
                      Add Your Travels
                    </Link>
                  ) : (
                    <Link href="/auth/signup" className="btn-primary">
                      Join TravelBio
                    </Link>
                  )}
                </div>
              ) : (
                <>
                  {/* Section Header */}
                  <div className="text-center mb-12">
                    <h2 className="heading-lg text-gray-900 dark:text-white mb-4">
                      Meet Fellow Travelers
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                      Discover inspiring travel stories and connect with adventurers from around the globe
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {profiles.map((profile) => (
                      <Link
                        key={profile.id}
                        href={`/${profile.username}`}
                        className="card-clean card-hover p-6 block"
                      >
                        <div className="text-center space-y-4">
                          {/* Avatar */}
                          <div className="relative mx-auto w-20 h-20">
                            <Avatar className="w-20 h-20">
                              <AvatarImage 
                                src={profile.avatar_url || undefined} 
                                alt={profile.username}
                              />
                              <AvatarFallback className="bg-black dark:bg-white text-white dark:text-black text-xl font-bold">
                                {profile.username.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          
                          {/* Name & Username */}
                          <div>
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                              {profile.full_name || profile.username}
                            </h3>
                            {profile.full_name && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                @{profile.username}
                              </p>
                            )}
                            
                            {/* Bio */}
                            {profile.bio && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-3">
                                {profile.bio}
                              </p>
                            )}
                          </div>

                          {/* Stats */}
                          <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                            <div className="text-center">
                              <div className="text-lg font-bold text-gray-900 dark:text-white">
                                {profile.countries_count || 0}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">Countries</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-gray-900 dark:text-white">
                                {profile.location_count || 0}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">Places</div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                  
                  {/* Load More Button */}
                  <div className="text-center mt-12">
                    <button
                      onClick={handleShuffle}
                      disabled={shuffling}
                      className="btn-secondary"
                    >
                      <Shuffle className="w-5 h-5 mr-2" />
                      {shuffling ? 'Loading...' : 'Discover More Travelers'}
                    </button>
                  </div>
                </>
              )}

              {/* Popular Countries Section */}
              {countries.length > 0 && (
                <div className="mt-24">
                  <div className="text-center mb-12">
                    <h2 className="heading-lg text-gray-900 dark:text-white mb-4">
                      Popular Destinations
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                      Discover the most visited countries by our travel community
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {countries.map((country) => (
                      <Link
                        key={country.id}
                        href={`/country/${country.code.toLowerCase()}`}
                        className="card-clean card-hover p-6 text-center"
                      >
                        <div className="text-4xl mb-3">{country.flag}</div>
                        <h3 className="font-bold text-gray-900 dark:text-white mb-2">
                          {country.name}
                        </h3>
                        <div className="space-y-2">
                          <div className="flex items-center justify-center gap-2">
                            <Users className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {country.visitor_count} travelers
                            </span>
                          </div>
                          {country.avg_overall && (
                            <div className="flex items-center justify-center gap-2">
                              <Star className="w-4 h-4 text-yellow-500" />
                              <span className="text-sm font-medium text-yellow-600">
                                {country.avg_overall.toFixed(1)}
                              </span>
                            </div>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA Section */}
              {!user && (
                <div className="mt-24 text-center">
                  <div className="card-clean p-12 max-w-2xl mx-auto">
                    <div className="w-16 h-16 bg-black dark:bg-white rounded-full flex items-center justify-center mx-auto mb-6">
                      <Globe className="w-8 h-8 text-white dark:text-black" />
                    </div>
                    <h3 className="heading-md text-gray-900 dark:text-white mb-4">
                      Ready to Share Your Journey?
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                      Join thousands of travelers sharing their experiences and discovering new destinations together.
                    </p>
                    <Link href="/auth/signup" className="btn-primary">
                      Start Your Travel Story
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  )
}