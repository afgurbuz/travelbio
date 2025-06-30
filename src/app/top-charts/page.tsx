'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import { User } from '@supabase/supabase-js'
import { Trophy, Star, Users, MapPin, TrendingUp, Medal, Award, Car, Home, Utensils, Shield, Gamepad2, DollarSign } from 'lucide-react'
import Link from 'next/link'
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import StarRating from '@/components/StarRating'

interface CountryRanking {
  id: number
  code: string
  name: string
  flag: string
  visitor_count: number
  avg_overall: number
  avg_transportation: number
  avg_accommodation: number
  avg_food: number
  avg_safety: number
  avg_activities: number
  avg_value: number
  trip_count: number
}

interface CategoryRanking {
  category: string
  icon: React.ReactNode
  title: string
  countries: CountryRanking[]
}

export default function TopChartsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [topCountries, setTopCountries] = useState<CountryRanking[]>([])
  const [categoryRankings, setCategoryRankings] = useState<CategoryRanking[]>([])
  const [mostVisited, setMostVisited] = useState<CountryRanking[]>([])
  const [loading, setLoading] = useState(true)

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
    const loadRankings = async () => {
      try {
        // Load countries with ratings data directly from user_locations
        const { data: countriesData, error: countriesError } = await supabase
          .from('countries')
          .select('*')

        if (countriesError) throw countriesError

        // Calculate ratings for each country
        const ratingsData = await Promise.all(
          (countriesData || []).map(async (country: any) => {
            const { data: locationsData } = await supabase
              .from('user_locations')
              .select('*')
              .eq('country_id', country.id)
              .not('overall_rating', 'is', null)

            if (!locationsData || locationsData.length === 0) {
              return null // Skip countries with no ratings
            }

            const visitor_count = new Set(locationsData.map((l: any) => l.user_id)).size
            const avg_overall = locationsData.reduce((sum: number, l: any) => sum + (l.overall_rating || 0), 0) / locationsData.length
            const avg_transportation = locationsData.filter((l: any) => l.transportation_rating).length > 0 
              ? locationsData.reduce((sum: number, l: any) => sum + (l.transportation_rating || 0), 0) / locationsData.filter((l: any) => l.transportation_rating).length 
              : 0
            const avg_accommodation = locationsData.filter((l: any) => l.accommodation_rating).length > 0 
              ? locationsData.reduce((sum: number, l: any) => sum + (l.accommodation_rating || 0), 0) / locationsData.filter((l: any) => l.accommodation_rating).length 
              : 0
            const avg_food = locationsData.filter((l: any) => l.food_rating).length > 0 
              ? locationsData.reduce((sum: number, l: any) => sum + (l.food_rating || 0), 0) / locationsData.filter((l: any) => l.food_rating).length 
              : 0
            const avg_safety = locationsData.filter((l: any) => l.safety_rating).length > 0 
              ? locationsData.reduce((sum: number, l: any) => sum + (l.safety_rating || 0), 0) / locationsData.filter((l: any) => l.safety_rating).length 
              : 0
            const avg_activities = locationsData.filter((l: any) => l.activities_rating).length > 0 
              ? locationsData.reduce((sum: number, l: any) => sum + (l.activities_rating || 0), 0) / locationsData.filter((l: any) => l.activities_rating).length 
              : 0
            const avg_value = locationsData.filter((l: any) => l.value_rating).length > 0 
              ? locationsData.reduce((sum: number, l: any) => sum + (l.value_rating || 0), 0) / locationsData.filter((l: any) => l.value_rating).length 
              : 0

            return {
              ...country,
              visitor_count,
              avg_overall: Math.round(avg_overall * 10) / 10,
              avg_transportation: Math.round(avg_transportation * 10) / 10,
              avg_accommodation: Math.round(avg_accommodation * 10) / 10,
              avg_food: Math.round(avg_food * 10) / 10,
              avg_safety: Math.round(avg_safety * 10) / 10,
              avg_activities: Math.round(avg_activities * 10) / 10,
              avg_value: Math.round(avg_value * 10) / 10,
            }
          })
        )

        const validRatingsData = ratingsData.filter(r => r !== null && r.avg_overall > 0)

        if (validRatingsData && validRatingsData.length > 0) {
          const rankings: CountryRanking[] = validRatingsData.map((r: any) => ({
            id: r.id,
            code: r.code,
            name: r.name,
            flag: r.flag,
            visitor_count: r.visitor_count,
            avg_overall: r.avg_overall,
            avg_transportation: r.avg_transportation || 0,
            avg_accommodation: r.avg_accommodation || 0,
            avg_food: r.avg_food || 0,
            avg_safety: r.avg_safety || 0,
            avg_activities: r.avg_activities || 0,
            avg_value: r.avg_value || 0,
            trip_count: r.visitor_count
          }))

          // Top 10 overall
          setTopCountries(rankings.slice(0, 10))

          // Most visited (by trip count/visitor count)
          const visitedSorted = [...rankings].sort((a, b) => b.visitor_count - a.visitor_count)
          setMostVisited(visitedSorted.slice(0, 10))

          // Category rankings with more countries and better icons
          const categories: CategoryRanking[] = [
            {
              category: 'transportation',
              icon: <Car className="w-5 h-5" />,
              title: 'Best Transportation',
              countries: [...rankings]
                .filter(c => c.avg_transportation > 0)
                .sort((a, b) => b.avg_transportation - a.avg_transportation)
                .slice(0, 10)
            },
            {
              category: 'accommodation',
              icon: <Home className="w-5 h-5" />,
              title: 'Best Accommodation',
              countries: [...rankings]
                .filter(c => c.avg_accommodation > 0)
                .sort((a, b) => b.avg_accommodation - a.avg_accommodation)
                .slice(0, 10)
            },
            {
              category: 'food',
              icon: <Utensils className="w-5 h-5" />,
              title: 'Best Food & Dining',
              countries: [...rankings]
                .filter(c => c.avg_food > 0)
                .sort((a, b) => b.avg_food - a.avg_food)
                .slice(0, 10)
            },
            {
              category: 'safety',
              icon: <Shield className="w-5 h-5" />,
              title: 'Safest Countries',
              countries: [...rankings]
                .filter(c => c.avg_safety > 0)
                .sort((a, b) => b.avg_safety - a.avg_safety)
                .slice(0, 10)
            },
            {
              category: 'activities',
              icon: <Gamepad2 className="w-5 h-5" />,
              title: 'Best Activities & Attractions',
              countries: [...rankings]
                .filter(c => c.avg_activities > 0)
                .sort((a, b) => b.avg_activities - a.avg_activities)
                .slice(0, 10)
            },
            {
              category: 'value',
              icon: <DollarSign className="w-5 h-5" />,
              title: 'Best Value for Money',
              countries: [...rankings]
                .filter(c => c.avg_value > 0)
                .sort((a, b) => b.avg_value - a.avg_value)
                .slice(0, 10)
            }
          ]

          setCategoryRankings(categories)
        }
      } catch (error) {
        console.error('Error loading rankings:', error)
      } finally {
        setLoading(false)
      }
    }

    loadRankings()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const getRankMedal = (rank: number) => {
    switch (rank) {
      case 1:
        return <span className="text-2xl">🥇</span>
      case 2:
        return <span className="text-2xl">🥈</span>
      case 3:
        return <span className="text-2xl">🥉</span>
      default:
        return <span className="text-lg font-bold text-slate-600 dark:text-slate-400">#{rank}</span>
    }
  }

  if (loading) {
    return (
      <>
        <Navigation user={user} onSignOut={handleSignOut} />
        <div className="flex justify-center items-center min-h-screen">
          <div className="spinner"></div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navigation user={user} onSignOut={handleSignOut} />
      <main className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
          <div className="animate-fade-in">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="relative mx-auto mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-3xl flex items-center justify-center mx-auto shadow-lg">
                  <Trophy className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full animate-pulse"></div>
              </div>
              
              <h1 className="text-5xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 dark:from-yellow-400 dark:to-orange-400 bg-clip-text text-transparent mb-6">
                Top Travel Destinations
              </h1>
              
              <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed">
                Discover the world's best destinations ranked by real travelers across 6 key categories. 
                From transportation and accommodation to food, safety, activities, and value for money.
              </p>
            </div>

            {/* Top 10 Overall - Facebook Style */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-6">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  Top 10 Overall Destinations
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Highest rated countries based on overall traveler experiences
                </p>
              </div>
              <div className="p-6">
                {topCountries.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Trophy className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-600 dark:text-slate-400">
                      No rankings available yet. Be the first to rate countries!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {topCountries.map((country, index) => (
                      <Link 
                        key={country.id}
                        href={`/country/${country.code.toLowerCase()}`}
                        className="block p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-3">
                            {getRankMedal(index + 1)}
                            <span className="text-3xl">{country.flag}</span>
                          </div>
                          
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {country.name}
                            </h3>
                            <div className="flex items-center gap-3 mt-1">
                              <StarRating value={country.avg_overall} readonly showValue />
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {country.visitor_count} travelers
                              </span>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                              {country.avg_overall.toFixed(1)}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              overall
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Most Visited - Facebook Style */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-6">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-blue-500" />
                  Most Visited Countries
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Popular destinations with the most traveler reviews
                </p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {mostVisited.slice(0, 5).map((country, index) => (
                    <Link 
                      key={country.id}
                      href={`/country/${country.code.toLowerCase()}`}
                      className="block p-4 text-center rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="mb-3">{getRankMedal(index + 1)}</div>
                      <div className="text-4xl mb-3">{country.flag}</div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                        {country.name}
                      </h3>
                      <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                        {country.visitor_count}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        travelers
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Category Rankings - Each category gets its own section */}
            <div className="space-y-12">
              {categoryRankings.map((category) => (
                <div key={category.category} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                      {category.icon}
                      {category.title}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      Top {category.countries.length} destinations ranked by traveler ratings
                    </p>
                  </div>
                  <div className="p-6">
                    {category.countries.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                          {category.icon}
                        </div>
                        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                          No ratings yet
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400">
                          Be the first to rate countries in this category!
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {category.countries.map((country, index) => {
                          const categoryValue = category.category === 'transportation' ? country.avg_transportation :
                                               category.category === 'accommodation' ? country.avg_accommodation :
                                               category.category === 'food' ? country.avg_food :
                                               category.category === 'safety' ? country.avg_safety :
                                               category.category === 'activities' ? country.avg_activities :
                                               country.avg_value;
                          
                          return (
                            <Link 
                              key={country.id}
                              href={`/country/${country.code.toLowerCase()}`}
                              className="group"
                            >
                              <div className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-md bg-white dark:bg-gray-800 rounded-lg">
                                <div className="p-4">
                                  <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-3">
                                      {getRankMedal(index + 1)}
                                      <span className="text-3xl">{country.flag}</span>
                                    </div>
                                    
                                    <div className="flex-1">
                                      <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors mb-2">
                                        {country.name}
                                      </h4>
                                      
                                      <div className="flex items-center gap-3 mb-2">
                                        <StarRating 
                                          value={categoryValue} 
                                          readonly 
                                          size="sm" 
                                          showValue
                                        />
                                        <Badge variant="secondary" className="flex items-center gap-1">
                                          <Users className="w-3 h-3" />
                                          {country.visitor_count}
                                        </Badge>
                                      </div>
                                      
                                      {/* Progress bar for visual rating */}
                                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                        <div 
                                          className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-2 rounded-full transition-all duration-500"
                                          style={{ width: `${(categoryValue / 5) * 100}%` }}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            {!user && (
              <div className="mt-16 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-0 rounded-lg shadow-sm">
                <div className="text-center py-12 p-6">
                  <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                    Help shape these rankings
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-8 text-lg max-w-md mx-auto">
                    Your travel experiences matter. Join TravelBio and contribute to these rankings.
                  </p>
                  <Link 
                    href="/auth/signup"
                    className="inline-flex items-center px-8 py-3 text-lg font-medium text-white bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg hover:from-yellow-700 hover:to-orange-700 transition-colors shadow-lg"
                  >
                    <Trophy className="w-5 h-5 mr-2" />
                    Join TravelBio
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  )
}