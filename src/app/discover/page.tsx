'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import { User } from '@supabase/supabase-js'
import { Shuffle, MapPin, Globe, Users, Sparkles, Star, Search, Filter, TrendingUp, Clock, Heart, MessageCircle, Eye, UserPlus } from 'lucide-react'
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
  recent_activity?: string
  joined_date?: string
}

interface Country {
  id: number
  code: string
  name: string
  flag: string
  visitor_count?: number
  avg_overall?: number
}

interface RecentActivity {
  id: string
  user_id: string
  type: 'new_location' | 'new_review'
  country: {
    id: number
    name: string
    flag: string
    code: string
  }
  city?: {
    name: string
  }
  created_at: string
  comment?: string
  overall_rating?: number
  profile: {
    username: string
    full_name?: string
    avatar_url?: string
  }
}

export default function DiscoverPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [countries, setCountries] = useState<Country[]>([])
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [shuffling, setShuffling] = useState(false)
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCountry, setSelectedCountry] = useState<string>('all')
  const [travelType, setTravelType] = useState<'all' | 'lived' | 'visited'>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([])
  
  // Stats
  const [totalTravelers, setTotalTravelers] = useState(0)
  const [totalCountries, setTotalCountries] = useState(0)
  const [totalReviews, setTotalReviews] = useState(0)

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
      loadRecentActivities()
      loadStats()
    }
  }, [loading])

  // Filter profiles based on search and filters
  useEffect(() => {
    let filtered = [...profiles]
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(profile => 
        profile.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.bio?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    setFilteredProfiles(filtered)
  }, [profiles, searchTerm, selectedCountry, travelType])

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

  const loadRecentActivities = async () => {
    try {
      const { data: activitiesData, error } = await supabase
        .from('user_locations')
        .select(`
          id,
          user_id,
          created_at,
          comment,
          overall_rating,
          country:countries(id, name, flag, code),
          city:cities(name),
          profile:profiles(username, full_name, avatar_url)
        `)
        .not('comment', 'is', null)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error

      if (activitiesData) {
        const activities: RecentActivity[] = activitiesData
          .filter((a: any) => a.country && a.profile)
          .map((a: any) => ({
            id: a.id,
            user_id: a.user_id,
            type: a.overall_rating ? 'new_review' : 'new_location',
            country: a.country,
            city: a.city,
            created_at: a.created_at,
            comment: a.comment,
            overall_rating: a.overall_rating,
            profile: a.profile
          }))

        setRecentActivities(activities)
      }
    } catch (error) {
      console.error('Error loading recent activities:', error)
    }
  }

  const loadStats = async () => {
    try {
      // Get total travelers count
      const { count: travelersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .not('username', 'is', null)

      // Get total countries count
      const { count: countriesCount } = await supabase
        .from('countries')
        .select('*', { count: 'exact', head: true })

      // Get total reviews count
      const { count: reviewsCount } = await supabase
        .from('user_locations')
        .select('*', { count: 'exact', head: true })
        .not('comment', 'is', null)

      setTotalTravelers(travelersCount || 0)
      setTotalCountries(countriesCount || 0)
      setTotalReviews(reviewsCount || 0)
    } catch (error) {
      console.error('Error loading stats:', error)
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-8">
          <div className="animate-fade-in">
            {/* Enhanced Header with Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                  Discover Fellow Travelers
                </h1>
                
                <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-6">
                  Connect with travelers from around the world and get inspired for your next adventure.
                </p>
              </div>

              {/* Community Stats */}
              <div className="grid grid-cols-3 gap-6 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {totalTravelers.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
                    <Users className="w-4 h-4" />
                    Travelers
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {totalCountries}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
                    <Globe className="w-4 h-4" />
                    Countries
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {totalReviews.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
                    <Star className="w-4 h-4" />
                    Reviews
                  </div>
                </div>
              </div>

              {/* Search and Filter Bar */}
              <div className="max-w-2xl mx-auto">
                <div className="flex gap-3 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search travelers by name or bio..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`px-4 py-3 rounded-md font-medium transition-colors flex items-center gap-2 ${
                      showFilters 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    <Filter className="w-4 h-4" />
                    Filters
                  </button>
                </div>

                {/* Expanded Filters */}
                {showFilters && (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Country
                        </label>
                        <select
                          value={selectedCountry}
                          onChange={(e) => setSelectedCountry(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="all">All Countries</option>
                          {countries.map(country => (
                            <option key={country.id} value={country.id}>
                              {country.flag} {country.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Travel Type
                        </label>
                        <select
                          value={travelType}
                          onChange={(e) => setTravelType(e.target.value as 'all' | 'lived' | 'visited')}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="all">All Types</option>
                          <option value="lived">🏠 Lived</option>
                          <option value="visited">✈️ Visited</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-center gap-3 mt-6">
                  <button
                    onClick={handleShuffle}
                    disabled={shuffling}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md font-semibold transition-colors"
                  >
                    <Shuffle className="w-5 h-5" />
                    {shuffling ? 'Finding new travelers...' : 'Discover New Travelers'}
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Travelers */}
              <div className="lg:col-span-2">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {searchTerm ? `Search Results (${filteredProfiles.length})` : 'Fellow Travelers'}
                  </h2>
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      Clear search
                    </button>
                  )}
                </div>

                {(searchTerm ? filteredProfiles : profiles).length === 0 ? (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
                    <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {searchTerm ? 'No results found' : 'No travelers found'}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      {searchTerm 
                        ? 'Try adjusting your search terms or filters.' 
                        : 'Be the first to add your travel experiences!'
                      }
                    </p>
                    {!searchTerm && (
                      user ? (
                        <Link href="/profile" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold transition-colors">
                          <UserPlus className="w-5 h-5" />
                          Add Your Travels
                        </Link>
                      ) : (
                        <Link href="/auth/signup" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold transition-colors">
                          <UserPlus className="w-5 h-5" />
                          Join TravelBio
                        </Link>
                      )
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(searchTerm ? filteredProfiles : profiles).map((profile, index) => (
                      <div 
                        key={profile.id}
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 p-6"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <div className="flex items-start space-x-4">
                          {/* Avatar */}
                          <Link href={`/${profile.username}`} className="relative flex-shrink-0">
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
                          </Link>
                          
                          {/* Profile Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <Link href={`/${profile.username}`}>
                                  <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                    {profile.full_name || profile.username}
                                  </h3>
                                </Link>
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
                              
                              {/* Follow button placeholder for future */}
                              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md font-medium transition-colors">
                                View Profile
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column - Recent Activities & Popular Countries */}
              <div className="space-y-6">
                {/* Recent Activities */}
                {recentActivities.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Recent Activity
                      </h3>
                    </div>
                    
                    <div className="space-y-4">
                      {recentActivities.slice(0, 5).map((activity) => (
                        <div key={activity.id} className="flex items-start space-x-3">
                          <Link href={`/${activity.profile.username}`}>
                            <Avatar className="w-10 h-10">
                              <AvatarImage 
                                src={activity.profile.avatar_url || undefined}
                                className="object-cover"
                              />
                              <AvatarFallback className="bg-blue-600 text-white text-sm font-bold">
                                {activity.profile.username.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </Link>
                          
                          <div className="flex-1 min-w-0">
                            <div className="text-sm">
                              <Link 
                                href={`/${activity.profile.username}`}
                                className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                              >
                                {activity.profile.full_name || activity.profile.username}
                              </Link>
                              <span className="text-gray-500 dark:text-gray-400">
                                {activity.type === 'new_review' ? ' reviewed ' : ' visited '}
                              </span>
                              <Link
                                href={`/country/${activity.country.code.toLowerCase()}`}
                                className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                              >
                                {activity.country.flag} {activity.country.name}
                              </Link>
                            </div>
                            
                            {activity.overall_rating && (
                              <div className="flex items-center gap-1 mt-1">
                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {activity.overall_rating}/5
                                </span>
                              </div>
                            )}
                            
                            {activity.comment && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                "{activity.comment}"
                              </p>
                            )}
                            
                            <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                              <Clock className="w-3 h-3" />
                              {new Date(activity.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <Link 
                      href="/search" 
                      className="block text-center text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mt-4 font-medium"
                    >
                      View all activity
                    </Link>
                  </div>
                )}

                {/* Popular Countries - Compact Version */}
                {countries.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Popular Destinations
                    </h3>
                    
                    <div className="space-y-3">
                      {countries.slice(0, 5).map((country, index) => (
                        <Link 
                          key={country.id}
                          href={`/country/${country.code.toLowerCase()}`}
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{country.flag}</span>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white text-sm">
                                {country.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {country.visitor_count} travelers
                              </p>
                            </div>
                          </div>
                          
                          {country.avg_overall && country.avg_overall > 0 && (
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                {country.avg_overall.toFixed(1)}
                              </span>
                            </div>
                          )}
                        </Link>
                      ))}
                    </div>
                    
                    <Link 
                      href="/countries" 
                      className="block text-center text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mt-4 font-medium"
                    >
                      View all countries
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom CTA - Facebook Style */}
            {!user && profiles.length > 0 && (
              <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  Ready to share your story?
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  Join TravelBio and create your own travel profile to connect with fellow explorers.
                </p>
                <Link href="/auth/signup" className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold text-lg transition-colors">
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