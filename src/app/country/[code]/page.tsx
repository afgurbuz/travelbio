'use client'

import { useEffect, useState } from 'react'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { MapPin, Globe, Users, Star, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import StarRating from '@/components/StarRating'
import Navigation from '@/components/Navigation'
import { User } from '@supabase/supabase-js'

interface Country {
  id: number
  code: string
  name: string
  flag: string
  description?: string
  currency?: string
  language?: string
  best_time_to_visit?: string
}

interface City {
  id: number
  name: string
  country_id: number
}

interface CountryRating {
  visitor_count: number
  avg_transportation: number
  avg_accommodation: number
  avg_food: number
  avg_safety: number
  avg_activities: number
  avg_value: number
  avg_overall: number
}

interface UserReview {
  id: string
  user_id: string
  type: 'lived' | 'visited'
  transportation_rating?: number
  accommodation_rating?: number
  food_rating?: number
  safety_rating?: number
  activities_rating?: number
  value_rating?: number
  overall_rating?: number
  comment?: string
  visit_date?: string
  created_at?: string
  profile: {
    username: string
    full_name?: string
    avatar_url?: string
  }
  city?: {
    id: number
    name: string
  }
}

interface PageProps {
  params: { code: string }
}

export default function CountryPage({ params }: PageProps) {
  const [user, setUser] = useState<User | null>(null)
  const [country, setCountry] = useState<Country | null>(null)
  const [ratings, setRatings] = useState<CountryRating | null>(null)
  const [reviews, setReviews] = useState<UserReview[]>([])
  const [filteredReviews, setFilteredReviews] = useState<UserReview[]>([])
  const [loading, setLoading] = useState(true)
  const [notFoundCountry, setNotFoundCountry] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Filter and pagination states
  const [filterType, setFilterType] = useState<'all' | 'lived' | 'visited'>('all')
  const [filterRating, setFilterRating] = useState<'all' | '5' | '4' | '3' | '2' | '1'>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest')
  const [currentPage, setCurrentPage] = useState(1)
  const [cities, setCities] = useState<City[]>([])
  const [filterCity, setFilterCity] = useState<'all' | string>('all')
  const reviewsPerPage = 8 // Increased for better UX

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
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
    const loadCountryData = async () => {
      try {
        // Load country basic info
        const { data: countryData, error: countryError } = await supabase
          .from('countries')
          .select('*')
          .eq('code', params.code.toUpperCase())
          .single()

        if (countryError || !countryData) {
          setNotFoundCountry(true)
          return
        }

        setCountry(countryData)

        // Load aggregated ratings
        const { data: ratingsData } = await supabase
          .from('country_ratings')
          .select('*')
          .eq('code', params.code.toUpperCase())
          .single()

        if (ratingsData) {
          setRatings(ratingsData)
        }

        // Load user reviews with profiles - first get all locations for this country
        const { data: allLocationsData } = await supabase
          .from('user_locations')
          .select('*')
          .eq('country_id', countryData.id)

        if (allLocationsData && allLocationsData.length > 0) {
          // Then get profiles for these locations
          const userIds = Array.from(new Set(allLocationsData.map((l: any) => l.user_id)))
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url')
            .in('id', userIds)

          // Get cities data
          const cityIds = allLocationsData.filter((l: any) => l.city_id).map((l: any) => l.city_id)
          let citiesData: any[] = []
          if (cityIds.length > 0) {
            const { data: cities } = await supabase
              .from('cities')
              .select('id, name')
              .in('id', Array.from(new Set(cityIds)))
            citiesData = cities || []
          }

          // Combine data
          const reviewsData = allLocationsData
            .filter((location: any) => location.overall_rating || location.comment) // Only show locations with ratings or comments
            .map((location: any) => {
              const profile = profilesData?.find((p: any) => p.id === location.user_id)
              const city = citiesData.find((c: any) => c.id === location.city_id)
              return {
                ...location,
                profile,
                city
              }
            })
            .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

          setReviews(reviewsData as UserReview[])
          setFilteredReviews(reviewsData as UserReview[])
          
          // Get unique cities from reviews
          const cityStrings: string[] = reviewsData
            .filter((r: any) => r.city)
            .map((r: any) => JSON.stringify(r.city))
          const uniqueCityStrings: string[] = Array.from(new Set(cityStrings))
          const uniqueCities: City[] = uniqueCityStrings.map((str: string) => JSON.parse(str))
          setCities(uniqueCities)
        }

      } catch (error) {
        console.error('Error loading country data:', error)
        setError('Failed to load country data. Please try again.')
        setNotFoundCountry(true)
      } finally {
        setLoading(false)
      }
    }

    loadCountryData()
  }, [params.code])

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...reviews]
    
    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(review => review.type === filterType)
    }
    
    // Filter by rating
    if (filterRating !== 'all') {
      const ratingValue = parseInt(filterRating)
      filtered = filtered.filter(review => review.overall_rating === ratingValue)
    }
    
    // Filter by city
    if (filterCity !== 'all') {
      filtered = filtered.filter(review => review.city?.id.toString() === filterCity)
    }
    
    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
        case 'oldest':
          return new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime()
        case 'highest':
          return (b.overall_rating || 0) - (a.overall_rating || 0)
        case 'lowest':
          return (a.overall_rating || 0) - (b.overall_rating || 0)
        default:
          return 0
      }
    })
    
    setFilteredReviews(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }, [reviews, filterType, filterRating, filterCity, sortBy])

  // Calculate pagination
  const totalPages = Math.ceil(filteredReviews.length / reviewsPerPage)
  const startIndex = (currentPage - 1) * reviewsPerPage
  const paginatedReviews = filteredReviews.slice(startIndex, startIndex + reviewsPerPage)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="spinner"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Something went wrong
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (notFoundCountry || !country) {
    return notFound()
  }

  return (
    <>
      <Navigation user={user} onSignOut={handleSignOut} />
      <main className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-8">
          <div className="animate-fade-in">
            {/* Country Header - Facebook Style */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-6">
              <div className="p-8 text-center">
                <div className="text-8xl mb-6">{country.flag}</div>
                <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
                  {country.name}
                </h1>
                
                {country.description && (
                  <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-6 leading-relaxed">
                    {country.description}
                  </p>
                )}

                {/* Country Info Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
                  {country.currency && (
                    <div className="text-center">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Currency</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{country.currency}</p>
                    </div>
                  )}
                  {country.language && (
                    <div className="text-center">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Language</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{country.language}</p>
                    </div>
                  )}
                  {country.best_time_to_visit && (
                    <div className="text-center">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Best Time</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{country.best_time_to_visit}</p>
                    </div>
                  )}
                  {ratings && (
                    <div className="text-center">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Travelers</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{ratings.visitor_count} people</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Ratings Overview - Facebook Style */}
            {ratings && ratings.avg_overall > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-6">
                <div className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
                    <Star className="w-5 h-5 text-yellow-500" />
                    Traveler Ratings
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    <div className="text-center bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                        {ratings.avg_overall.toFixed(1)}
                      </div>
                      <StarRating value={ratings.avg_overall} readonly size="md" />
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 font-medium">Overall Rating</p>
                    </div>
                    
                    {ratings.avg_transportation > 0 && (
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <p className="font-medium text-gray-900 dark:text-white mb-2">Transportation</p>
                        <StarRating value={ratings.avg_transportation} readonly showValue />
                      </div>
                    )}
                    
                    {ratings.avg_accommodation > 0 && (
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <p className="font-medium text-gray-900 dark:text-white mb-2">Accommodation</p>
                        <StarRating value={ratings.avg_accommodation} readonly showValue />
                      </div>
                    )}
                    
                    {ratings.avg_food > 0 && (
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <p className="font-medium text-gray-900 dark:text-white mb-2">Food & Dining</p>
                        <StarRating value={ratings.avg_food} readonly showValue />
                      </div>
                    )}
                    
                    {ratings.avg_safety > 0 && (
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <p className="font-medium text-gray-900 dark:text-white mb-2">Safety</p>
                        <StarRating value={ratings.avg_safety} readonly showValue />
                      </div>
                    )}
                    
                    {ratings.avg_activities > 0 && (
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <p className="font-medium text-gray-900 dark:text-white mb-2">Activities</p>
                        <StarRating value={ratings.avg_activities} readonly showValue />
                      </div>
                    )}
                    
                    {ratings.avg_value > 0 && (
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <p className="font-medium text-gray-900 dark:text-white mb-2">Value for Money</p>
                        <StarRating value={ratings.avg_value} readonly showValue />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* User Reviews - Facebook Style */}
            {reviews.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <div className="p-6">
                  <div className="flex flex-col gap-4 mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Traveler Reviews ({filteredReviews.length} / {reviews.length})
                    </h2>
                    
                    {/* Filters - Facebook Style */}
                    <div className="flex flex-wrap gap-3">
                      <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as any)}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-full text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">All Types</option>
                        <option value="lived">🏠 Lived</option>
                        <option value="visited">✈️ Visited</option>
                      </select>
                      
                      <select
                        value={filterRating}
                        onChange={(e) => setFilterRating(e.target.value as any)}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-full text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">All Ratings</option>
                        <option value="5">⭐ 5 Stars</option>
                        <option value="4">⭐ 4 Stars</option>
                        <option value="3">⭐ 3 Stars</option>
                        <option value="2">⭐ 2 Stars</option>
                        <option value="1">⭐ 1 Star</option>
                      </select>
                      
                      {cities.length > 0 && (
                        <select
                          value={filterCity}
                          onChange={(e) => setFilterCity(e.target.value)}
                          className="px-4 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-full text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="all">All Cities</option>
                          {cities.map((city) => (
                            <option key={city.id} value={city.id.toString()}>
                              {city.name}
                            </option>
                          ))}
                        </select>
                      )}
                      
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-full text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="newest">Newest</option>
                        <option value="oldest">Oldest</option>
                        <option value="highest">Highest Rating</option>
                        <option value="lowest">Lowest Rating</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {paginatedReviews.map((review) => (
                      <div key={review.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <div className="flex items-start gap-4">
                          <Link href={`/${review.profile?.username}`}>
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={review.profile?.avatar_url || undefined} />
                              <AvatarFallback className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                {review.profile?.username?.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </Link>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Link href={`/${review.profile?.username}`}>
                                <h4 className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                  {review.profile?.full_name || review.profile?.username}
                                </h4>
                              </Link>
                              <span className={`text-xs px-3 py-1 rounded-full ${
                                review.type === 'lived' 
                                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                                  : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                              }`}>
                                {review.type === 'lived' ? '🏠 Lived here' : '✈️ Visited'}
                              </span>
                              {review.city && (
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  in {review.city.name}
                                </span>
                              )}
                              {review.visit_date && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  • {new Date(review.visit_date).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            
                            {review.overall_rating && (
                              <div className="mb-3">
                                <StarRating value={review.overall_rating} readonly showValue />
                              </div>
                            )}
                            
                            {review.comment && (
                              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                {review.comment}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Pagination - Facebook Style */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                                onClick={() => setCurrentPage(page)}
                                className={`w-10 h-10 rounded-md text-sm font-medium transition-colors ${
                                  currentPage === page
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
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
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* No Reviews State - Facebook Style */}
            {reviews.length === 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-16 text-center">
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MapPin className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  No reviews yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                  Be the first to share your experience about {country.name}! Help other travelers discover this destination.
                </p>
                <Link
                  href="/profile"
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-md font-semibold transition-colors"
                >
                  <Star className="w-5 h-5" />
                  Add Your Experience
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  )
}