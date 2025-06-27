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
  const [loading, setLoading] = useState(true)
  const [notFoundCountry, setNotFoundCountry] = useState(false)

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

        // Load user reviews with profiles
        const { data: reviewsData } = await supabase
          .from('user_locations')
          .select(`
            id,
            user_id,
            type,
            transportation_rating,
            accommodation_rating,
            food_rating,
            safety_rating,
            activities_rating,
            value_rating,
            overall_rating,
            comment,
            profile:profiles(username, full_name, avatar_url),
            city:cities(name)
          `)
          .eq('country_id', countryData.id)
          .not('overall_rating', 'is', null)
          .order('overall_rating', { ascending: false })
          .limit(20)

        if (reviewsData) {
          setReviews(reviewsData as UserReview[])
        }

      } catch (error) {
        console.error('Error loading country data:', error)
        setNotFoundCountry(true)
      } finally {
        setLoading(false)
      }
    }

    loadCountryData()
  }, [params.code])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="spinner"></div>
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
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Traveler Reviews ({reviews.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {reviews.map((review) => (
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