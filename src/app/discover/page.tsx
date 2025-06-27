'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import { User } from '@supabase/supabase-js'
import { Shuffle, MapPin, Globe, Users, Sparkles, Star, Plane, Camera, Heart, TrendingUp } from 'lucide-react'
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
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
          {/* Gradient Background */}
          <div className="absolute inset-0 gradient-travel opacity-90"></div>
          
          {/* Animated Background Elements */}
          <div className="absolute inset-0">
            <div className="absolute top-20 left-10 animate-float opacity-20">
              <Plane className="w-12 h-12 text-white" style={{animationDelay: '0s'}} />
            </div>
            <div className="absolute top-40 right-20 animate-float opacity-20">
              <Camera className="w-10 h-10 text-white" style={{animationDelay: '1s'}} />
            </div>
            <div className="absolute bottom-32 left-1/4 animate-float opacity-20">
              <Heart className="w-8 h-8 text-white" style={{animationDelay: '2s'}} />
            </div>
            <div className="absolute top-1/3 right-1/3 animate-float opacity-20">
              <Globe className="w-16 h-16 text-white" style={{animationDelay: '0.5s'}} />
            </div>
          </div>
          
          {/* Hero Content */}
          <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
            <div className="animate-scale-in">
              <div className="relative mx-auto mb-8 w-24 h-24">
                <div className="w-24 h-24 gradient-sunset rounded-3xl flex items-center justify-center mx-auto shadow-2xl animate-float">
                  <Sparkles className="w-12 h-12 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-xl">✨</span>
                </div>
              </div>
              
              <h1 className="heading-xl mb-6 text-white animate-slide-up">
                Discover Amazing
                <br className="hidden sm:block" />
                <span className="text-yellow-300">Travel Stories</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-12 leading-relaxed animate-fade-in" style={{animationDelay: '0.3s'}}>
                Explore incredible journeys from travelers around the world. 
                <br className="hidden md:block" />
                Get inspired and plan your next adventure! 🌎
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in" style={{animationDelay: '0.6s'}}>
                <button
                  onClick={handleShuffle}
                  disabled={shuffling}
                  className="btn-travel mobile-touch group"
                >
                  <Shuffle className="w-6 h-6 mr-3 group-hover:rotate-180 transition-transform duration-500" />
                  {shuffling ? 'Discovering...' : 'Discover Travelers'}
                </button>
                
                {!user && (
                  <Link href="/auth/signup" className="btn-travel bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 mobile-touch">
                    <Camera className="w-6 h-6 mr-3" />
                    Share Your Story
                  </Link>
                )}
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 animate-fade-in" style={{animationDelay: '0.9s'}}>
                <div className="glass rounded-2xl p-4 text-center">
                  <div className="text-2xl md:text-3xl font-bold text-white mb-1">{profiles.length}+</div>
                  <div className="text-white/80 text-sm">Active Travelers</div>
                </div>
                <div className="glass rounded-2xl p-4 text-center">
                  <div className="text-2xl md:text-3xl font-bold text-white mb-1">{countries.length}+</div>
                  <div className="text-white/80 text-sm">Countries</div>
                </div>
                <div className="glass rounded-2xl p-4 text-center">
                  <div className="text-2xl md:text-3xl font-bold text-white mb-1">1000+</div>
                  <div className="text-white/80 text-sm">Stories</div>
                </div>
                <div className="glass rounded-2xl p-4 text-center">
                  <div className="text-2xl md:text-3xl font-bold text-white mb-1">50+</div>
                  <div className="text-white/80 text-sm">Cities</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
              <div className="w-1 h-3 bg-white/50 rounded-full mt-2 animate-pulse"></div>
            </div>
          </div>
        </section>
        
        {/* Main Content */}
        <div className="bg-gray-50 dark:bg-slate-900 min-h-screen">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 pb-20 md:pb-8">
            <div className="animate-fade-in">
              {/* Profiles Grid */}
              {profiles.length === 0 ? (
                <div className="card-modern max-w-md mx-auto p-8 text-center">
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
                    <Button asChild className="btn-travel">
                      <Link href="/profile">Add Your Travels</Link>
                    </Button>
                  ) : (
                    <Button asChild className="btn-travel">
                      <Link href="/auth/signup">Join TravelBio</Link>
                    </Button>
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
                    {profiles.map((profile, index) => (
                      <div
                        key={profile.id}
                        className="animate-scale-in card-travel group"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <Link href={`/${profile.username}`} className="block p-6 h-full">
                          <div className="text-center space-y-4 h-full flex flex-col">
                            {/* Avatar with enhanced mobile design */}
                            <div className="relative mx-auto">
                              <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl overflow-hidden shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                                {profile.avatar_url ? (
                                  <img 
                                    src={profile.avatar_url} 
                                    alt={profile.username}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full gradient-ocean flex items-center justify-center text-white text-2xl font-bold">
                                    {profile.username.charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-500 border-3 border-white rounded-full shadow-lg">
                                <div className="w-full h-full bg-green-500 rounded-full animate-pulse"></div>
                              </div>
                            </div>
                            
                            {/* Name & Username */}
                            <div className="flex-1">
                              <h3 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors duration-300">
                                {profile.full_name || profile.username}
                              </h3>
                              {profile.full_name && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                  @{profile.username}
                                </p>
                              )}
                              
                              {/* Bio */}
                              {profile.bio && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-3 px-2">
                                  {profile.bio}
                                </p>
                              )}
                            </div>

                            {/* Stats with better mobile design */}
                            <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                              <div className="text-center">
                                <div className="text-xl font-bold text-gradient">
                                  {profile.countries_count || 0}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Countries</div>
                              </div>
                              <div className="text-center">
                                <div className="text-xl font-bold text-gradient">
                                  {profile.location_count || 0}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Places</div>
                              </div>
                            </div>
                            
                            {/* View Profile Button */}
                            <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                View Profile →
                              </div>
                            </div>
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                  
                  {/* Load More Button */}
                  <div className="text-center mt-12">
                    <button
                      onClick={handleShuffle}
                      disabled={shuffling}
                      className="btn-travel bg-white text-gray-900 hover:bg-gray-50 border border-gray-200 shadow-lg"
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
                      🌟 Popular Destinations
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                      Discover the most visited countries by our travel community
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {countries.map((country, index) => (
                      <Link
                        key={country.id}
                        href={`/country/${country.code.toLowerCase()}`}
                        className="card-travel group p-6 text-center animate-scale-in"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <div className="flag-emoji mb-3">{country.flag}</div>
                        <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors duration-300 mb-2">
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
                  <div className="card-modern p-12 max-w-2xl mx-auto">
                    <div className="gradient-travel w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6">
                      <Globe className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="heading-md text-gray-900 dark:text-white mb-4">
                      Ready to Share Your Journey?
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                      Join thousands of travelers sharing their experiences and discovering new destinations together.
                    </p>
                    <Link href="/auth/signup" className="btn-travel">
                      <Sparkles className="w-5 h-5 mr-2" />
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