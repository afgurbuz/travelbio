'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import { User } from '@supabase/supabase-js'
import { TrendingUp, MapPin, Globe, Users, Star, Clock, Award, Trophy, Crown, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

interface FeedItem {
  id: string
  user_id: string
  type: 'new_location' | 'new_review'
  country: {
    id: number
    name: string
    flag: string
    code: string
  }
  created_at: string
  comment?: string
  overall_rating?: number
  transportation_rating?: number
  accommodation_rating?: number
  food_rating?: number
  safety_rating?: number
  activities_rating?: number
  value_rating?: number
  visit_date?: string
  profile: {
    username: string
    full_name?: string
    avatar_url?: string
  }
}

interface LeaderboardUser {
  id: string
  username: string
  full_name?: string
  avatar_url?: string
  countries_count: number
  locations_count: number
  reviews_count: number
}

export default function FeedPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [feedItems, setFeedItems] = useState<FeedItem[]>([])
  const [leaderboardTravelers, setLeaderboardTravelers] = useState<LeaderboardUser[]>([])
  const [leaderboardReviewers, setLeaderboardReviewers] = useState<LeaderboardUser[]>([])
  const [loading, setLoading] = useState(true)
  const [feedLoading, setFeedLoading] = useState(false)
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 10
  
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
      loadFeedItems()
      loadLeaderboards()
      loadStats()
    }
  }, [loading])

  // Load feed items when page changes
  useEffect(() => {
    if (!loading) {
      loadFeedItems()
    }
  }, [currentPage])

  const loadFeedItems = async () => {
    setFeedLoading(true)
    try {
      // Calculate offset for pagination
      const offset = (currentPage - 1) * itemsPerPage

      // First test simple query
      const { data: testData, error: testError } = await supabase
        .from('user_locations')
        .select('id, created_at')
        .limit(5)

      console.log('Test query result:', testData?.length || 0, 'items')
      if (testError) console.error('Test query error:', testError)

      // Get total count for pagination
      const { count } = await supabase
        .from('user_locations')
        .select('*', { count: 'exact', head: true })

      console.log('Total user_locations count:', count)
      
      if (count) {
        setTotalPages(Math.ceil(count / itemsPerPage))
      }

      // Get feed items first
      const { data: locationsData, error: locError } = await supabase
        .from('user_locations')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + itemsPerPage - 1)

      if (locError) {
        console.error('Locations query error:', locError)
        throw locError
      }

      console.log('Locations data received:', locationsData?.length || 0, 'items')

      if (locationsData && locationsData.length > 0) {
        // Get unique user IDs and country IDs
        const userIds = Array.from(new Set(locationsData.map((l: any) => l.user_id)))
        const countryIds = Array.from(new Set(locationsData.map((l: any) => l.country_id)))
        
        console.log('Fetching profiles for users:', userIds.length)
        console.log('Fetching countries for IDs:', countryIds.length)

        // Fetch profiles
        const { data: profilesData, error: profError } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .in('id', userIds)

        if (profError) {
          console.error('Profiles query error:', profError)
        }

        // Fetch countries
        const { data: countriesData, error: countryError } = await supabase
          .from('countries')
          .select('id, name, flag, code')
          .in('id', countryIds)

        if (countryError) {
          console.error('Countries query error:', countryError)
        }

        console.log('Profiles fetched:', profilesData?.length || 0)
        console.log('Countries fetched:', countriesData?.length || 0)

        // Map data
        const items: FeedItem[] = locationsData
          .map((location: any) => {
            const profile = profilesData?.find(p => p.id === location.user_id)
            const country = countriesData?.find(c => c.id === location.country_id)
            
            if (!profile || !country) return null
            
            return {
              id: location.id,
              user_id: location.user_id,
              type: location.overall_rating ? 'new_review' : 'new_location',
              country: country,
              created_at: location.created_at,
              comment: location.comment,
              overall_rating: location.overall_rating,
              transportation_rating: location.transportation_rating,
              accommodation_rating: location.accommodation_rating,
              food_rating: location.food_rating,
              safety_rating: location.safety_rating,
              activities_rating: location.activities_rating,
              value_rating: location.value_rating,
              visit_date: location.visit_date,
              profile: profile
            }
          })
          .filter(item => item !== null) as FeedItem[]

        console.log('Final feed items:', items.length)
        setFeedItems(items)
      } else {
        setFeedItems([])
      }
    } catch (error) {
      console.error('Error loading feed items:', error)
    } finally {
      setFeedLoading(false)
    }
  }

  const loadLeaderboards = async () => {
    try {
      // Get leaderboard for most travelers (by countries visited)
      const { data: travelerStats, error: travelerError } = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          full_name,
          avatar_url
        `)
        .not('username', 'is', null)

      if (travelerError) throw travelerError

      if (travelerStats) {
        const travelersWithStats = await Promise.all(
          travelerStats.map(async (profile: any) => {
            // Get unique countries count
            const { data: locationsData } = await supabase
              .from('user_locations')
              .select('country_id')
              .eq('user_id', profile.id)

            const countries_count = locationsData 
              ? new Set(locationsData.map((l: any) => l.country_id)).size 
              : 0

            const locations_count = locationsData?.length || 0

            // Get reviews count
            const { count: reviews_count } = await supabase
              .from('user_locations')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', profile.id)
              .not('comment', 'is', null)

            return {
              ...profile,
              countries_count,
              locations_count,
              reviews_count: reviews_count || 0
            }
          })
        )

        // Sort by countries visited
        const topTravelers = travelersWithStats
          .filter(p => p.countries_count > 0)
          .sort((a, b) => b.countries_count - a.countries_count)
          .slice(0, 5)

        // Sort by reviews written
        const topReviewers = travelersWithStats
          .filter(p => p.reviews_count > 0)
          .sort((a, b) => b.reviews_count - a.reviews_count)
          .slice(0, 5)

        setLeaderboardTravelers(topTravelers)
        setLeaderboardReviewers(topReviewers)
      }
    } catch (error) {
      console.error('Error loading leaderboards:', error)
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

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
            {/* Feed Header */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                  Travel Feed
                </h1>
                
                <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                  Latest travel experiences from our community. See where everyone's been and get inspired for your next adventure.
                </p>
              </div>

              {/* Community Stats */}
              <div className="grid grid-cols-3 gap-6">
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
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Feed */}
              <div className="lg:col-span-2">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Latest Activity
                  </h2>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Page {currentPage} of {totalPages}
                  </div>
                </div>

                {feedLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 animate-pulse">
                        <div className="flex items-start space-x-4">
                          <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4 mb-2"></div>
                            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-3"></div>
                            <div className="h-16 bg-gray-300 dark:bg-gray-600 rounded"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : feedItems.length === 0 ? (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
                    <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <TrendingUp className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      No activity yet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      Be the first to share your travel experiences!
                    </p>
                    {user ? (
                      <Link href="/profile" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold transition-colors">
                        <MapPin className="w-5 h-5" />
                        Add Your First Travel
                      </Link>
                    ) : (
                      <Link href="/auth/signup" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold transition-colors">
                        <Users className="w-5 h-5" />
                        Join TravelBio
                      </Link>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      {feedItems.map((item, index) => (
                        <div 
                          key={item.id}
                          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 p-6"
                          style={{ animationDelay: `${index * 0.05}s` }}
                        >
                          <div className="flex items-start space-x-4">
                            {/* Avatar */}
                            <Link href={`/${item.profile.username}`} className="flex-shrink-0">
                              <Avatar className="w-12 h-12">
                                <AvatarImage 
                                  src={item.profile.avatar_url || undefined} 
                                  alt={item.profile.username}
                                  className="object-cover"
                                />
                                <AvatarFallback className="bg-blue-600 text-white text-sm font-bold">
                                  {item.profile.username.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            </Link>
                            
                            {/* Feed Content */}
                            <div className="flex-1 min-w-0">
                              {/* Header */}
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <Link 
                                    href={`/${item.profile.username}`}
                                    className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                  >
                                    {item.profile.full_name || item.profile.username}
                                  </Link>
                                  <span className="text-gray-500 dark:text-gray-400 ml-2">
                                    {item.type === 'new_review' ? 'reviewed' : 'visited'}
                                  </span>
                                  <Link
                                    href={`/country/${item.country.code.toLowerCase()}`}
                                    className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors ml-1"
                                  >
                                    {item.country.flag} {item.country.name}
                                  </Link>
                                </div>
                                
                                <div className="flex items-center gap-1 text-xs text-gray-400">
                                  <Clock className="w-3 h-3" />
                                  {new Date(item.created_at).toLocaleDateString()}
                                </div>
                              </div>

                              {/* Rating Display */}
                              {item.overall_rating && (
                                <div className="mb-3">
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="flex items-center gap-1">
                                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                      <span className="font-semibold text-gray-900 dark:text-white">
                                        {item.overall_rating}/5
                                      </span>
                                    </div>
                                    {item.visit_date && (
                                      <span className="text-sm text-gray-500 dark:text-gray-400">
                                        • Visited {new Date(item.visit_date).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                  
                                  {/* Detailed Ratings */}
                                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-gray-600 dark:text-gray-400">
                                    {item.transportation_rating && (
                                      <div>Transportation: {item.transportation_rating}/5</div>
                                    )}
                                    {item.accommodation_rating && (
                                      <div>Stay: {item.accommodation_rating}/5</div>
                                    )}
                                    {item.food_rating && (
                                      <div>Food: {item.food_rating}/5</div>
                                    )}
                                    {item.safety_rating && (
                                      <div>Safety: {item.safety_rating}/5</div>
                                    )}
                                    {item.activities_rating && (
                                      <div>Activities: {item.activities_rating}/5</div>
                                    )}
                                    {item.value_rating && (
                                      <div>Value: {item.value_rating}/5</div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Comment */}
                              {item.comment && (
                                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-3">
                                  <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                                    "{item.comment}"
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 mt-8">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="p-2 rounded-md bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        
                        <div className="flex items-center gap-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                            if (
                              page === 1 || 
                              page === totalPages || 
                              (page >= currentPage - 2 && page <= currentPage + 2)
                            ) {
                              return (
                                <button
                                  key={page}
                                  onClick={() => handlePageChange(page)}
                                  className={`w-10 h-10 rounded-md text-sm font-medium transition-colors ${
                                    currentPage === page
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                  }`}
                                >
                                  {page}
                                </button>
                              )
                            } else if (
                              page === currentPage - 3 || 
                              page === currentPage + 3
                            ) {
                              return <span key={page} className="px-2 text-gray-500">...</span>
                            }
                            return null
                          })}
                        </div>
                        
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="p-2 rounded-md bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Right Column - Leaderboards */}
              <div className="space-y-6">
                {/* Top Travelers Leaderboard */}
                {leaderboardTravelers.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Trophy className="w-5 h-5 text-yellow-500" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Top Travelers
                      </h3>
                    </div>
                    
                    <div className="space-y-3">
                      {leaderboardTravelers.map((traveler, index) => (
                        <Link 
                          key={traveler.id}
                          href={`/${traveler.username}`}
                          className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-white text-sm font-bold">
                            {index === 0 && <Crown className="w-4 h-4" />}
                            {index === 1 && <Award className="w-4 h-4" />}
                            {index === 2 && <Award className="w-4 h-4" />}
                            {index > 2 && (index + 1)}
                          </div>
                          
                          <Avatar className="w-10 h-10">
                            <AvatarImage 
                              src={traveler.avatar_url || undefined}
                              className="object-cover"
                            />
                            <AvatarFallback className="bg-blue-600 text-white text-sm font-bold">
                              {traveler.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                              {traveler.full_name || traveler.username}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                              <div className="flex items-center gap-1">
                                <Globe className="w-3 h-3" />
                                {traveler.countries_count}
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {traveler.locations_count}
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Top Reviewers Leaderboard */}
                {leaderboardReviewers.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Star className="w-5 h-5 text-blue-500" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Top Reviewers
                      </h3>
                    </div>
                    
                    <div className="space-y-3">
                      {leaderboardReviewers.map((reviewer, index) => (
                        <Link 
                          key={reviewer.id}
                          href={`/${reviewer.username}`}
                          className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 text-white text-sm font-bold">
                            {index === 0 && <Crown className="w-4 h-4" />}
                            {index === 1 && <Star className="w-4 h-4" />}
                            {index === 2 && <Star className="w-4 h-4" />}
                            {index > 2 && (index + 1)}
                          </div>
                          
                          <Avatar className="w-10 h-10">
                            <AvatarImage 
                              src={reviewer.avatar_url || undefined}
                              className="object-cover"
                            />
                            <AvatarFallback className="bg-blue-600 text-white text-sm font-bold">
                              {reviewer.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                              {reviewer.full_name || reviewer.username}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3" />
                                {reviewer.reviews_count} reviews
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom CTA - Facebook Style */}
            {!user && feedItems.length > 0 && (
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