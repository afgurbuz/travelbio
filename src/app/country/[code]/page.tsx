'use client'

import { useEffect, useState } from 'react'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { MapPin, Globe, Users, Star, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import StarRating from '@/components/StarRating'

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
    name: string
  }
}

interface PageProps {
  params: { code: string }
}

export default function CountryPage({ params }: PageProps) {
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
  const reviewsPerPage = 10

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
          const uniqueCities = Array.from(
            new Set(reviewsData.filter((r: any) => r.city).map((r: any) => JSON.stringify(r.city)))
          ).map(str => JSON.parse(str))
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="spinner"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            Something went wrong
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (notFoundCountry || !country) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Button asChild variant="ghost">
              <Link href="/discover">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Discover
              </Link>
            </Button>
            <Link href="/discover" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                <Globe className="w-6 h-6 text-white dark:text-slate-900" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                TravelBio
              </span>
            </Link>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-fade-in">
          {/* Country Header */}
          <Card className="mb-8">
            <CardContent className="pt-8">
              <div className="text-center">
                <div className="text-8xl mb-6">{country.flag}</div>
                <h1 className="text-5xl font-bold text-slate-900 dark:text-white mb-4">
                  {country.name}
                </h1>
                
                {country.description && (
                  <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto mb-6 leading-relaxed">
                    {country.description}
                  </p>
                )}

                {/* Country Info */}
                <div className="flex flex-wrap justify-center gap-6 mt-8">
                  {country.currency && (
                    <div className="text-center">
                      <p className="text-sm text-slate-500 dark:text-slate-400">Currency</p>
                      <p className="font-medium text-slate-900 dark:text-white">{country.currency}</p>
                    </div>
                  )}
                  {country.language && (
                    <div className="text-center">
                      <p className="text-sm text-slate-500 dark:text-slate-400">Language</p>
                      <p className="font-medium text-slate-900 dark:text-white">{country.language}</p>
                    </div>
                  )}
                  {country.best_time_to_visit && (
                    <div className="text-center">
                      <p className="text-sm text-slate-500 dark:text-slate-400">Best Time to Visit</p>
                      <p className="font-medium text-slate-900 dark:text-white">{country.best_time_to_visit}</p>
                    </div>
                  )}
                  {ratings && (
                    <div className="text-center">
                      <p className="text-sm text-slate-500 dark:text-slate-400">Travelers</p>
                      <p className="font-medium text-slate-900 dark:text-white">{ratings.visitor_count} people</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ratings Overview */}
          {ratings && ratings.avg_overall > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  Traveler Ratings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                      {ratings.avg_overall}
                    </div>
                    <StarRating value={ratings.avg_overall} readonly size="md" />
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Overall</p>
                  </div>
                  
                  {ratings.avg_transportation > 0 && (
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white mb-2">Transportation</p>
                      <StarRating value={ratings.avg_transportation} readonly showValue />
                    </div>
                  )}
                  
                  {ratings.avg_accommodation > 0 && (
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white mb-2">Accommodation</p>
                      <StarRating value={ratings.avg_accommodation} readonly showValue />
                    </div>
                  )}
                  
                  {ratings.avg_food > 0 && (
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white mb-2">Food & Dining</p>
                      <StarRating value={ratings.avg_food} readonly showValue />
                    </div>
                  )}
                  
                  {ratings.avg_safety > 0 && (
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white mb-2">Safety</p>
                      <StarRating value={ratings.avg_safety} readonly showValue />
                    </div>
                  )}
                  
                  {ratings.avg_activities > 0 && (
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white mb-2">Activities</p>
                      <StarRating value={ratings.avg_activities} readonly showValue />
                    </div>
                  )}
                  
                  {ratings.avg_value > 0 && (
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white mb-2">Value for Money</p>
                      <StarRating value={ratings.avg_value} readonly showValue />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* User Reviews */}
          {reviews.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Traveler Reviews ({filteredReviews.length} / {reviews.length})
                  </CardTitle>
                  
                  {/* Filters */}
                  <div className="flex flex-wrap gap-3">
                    <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Filter type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tüm Tipler</SelectItem>
                        <SelectItem value="lived">🏠 Yaşadım</SelectItem>
                        <SelectItem value="visited">✈️ Ziyaret</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={filterRating} onValueChange={(value: any) => setFilterRating(value)}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Filter rating" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tüm Puanlar</SelectItem>
                        <SelectItem value="5">⭐ 5 Yıldız</SelectItem>
                        <SelectItem value="4">⭐ 4 Yıldız</SelectItem>
                        <SelectItem value="3">⭐ 3 Yıldız</SelectItem>
                        <SelectItem value="2">⭐ 2 Yıldız</SelectItem>
                        <SelectItem value="1">⭐ 1 Yıldız</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {cities.length > 0 && (
                      <Select value={filterCity} onValueChange={setFilterCity}>
                        <SelectTrigger className="w-[160px]">
                          <SelectValue placeholder="Filter city" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tüm Şehirler</SelectItem>
                          {cities.map((city) => (
                            <SelectItem key={city.id} value={city.id.toString()}>
                              {city.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    
                    <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">En Yeni</SelectItem>
                        <SelectItem value="oldest">En Eski</SelectItem>
                        <SelectItem value="highest">En Yüksek Puan</SelectItem>
                        <SelectItem value="lowest">En Düşük Puan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {paginatedReviews.map((review) => (
                    <div key={review.id} className="border-b border-slate-200 dark:border-slate-700 last:border-0 pb-6 last:pb-0">
                      <div className="flex items-start gap-4">
                        <Avatar>
                          <AvatarImage src={review.profile?.avatar_url || undefined} />
                          <AvatarFallback>
                            {review.profile?.username?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-medium text-slate-900 dark:text-white">
                              {review.profile?.full_name || review.profile?.username}
                            </h4>
                            <Badge variant={review.type === 'lived' ? 'default' : 'secondary'}>
                              {review.type === 'lived' ? '🏠 Lived here' : '✈️ Visited'}
                            </Badge>
                            {review.city && (
                              <span className="text-sm text-slate-500 dark:text-slate-400">
                                in {review.city.name}
                              </span>
                            )}
                            {review.visit_date && (
                              <span className="text-xs text-slate-500 dark:text-slate-400">
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
                            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                              {review.comment}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                        if (
                          page === 1 || 
                          page === totalPages || 
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <Button
                              key={page}
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                              className="w-8 h-8 p-0"
                            >
                              {page}
                            </Button>
                          )
                        } else if (
                          page === currentPage - 2 || 
                          page === currentPage + 2
                        ) {
                          return <span key={page} className="px-1">...</span>
                        }
                        return null
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* No Reviews State */}
          {reviews.length === 0 && (
            <Card className="text-center py-16">
              <CardContent>
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                  No reviews yet
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  Be the first to share your experience about {country.name}!
                </p>
                <Button asChild>
                  <Link href="/profile">
                    Add Your Experience
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}