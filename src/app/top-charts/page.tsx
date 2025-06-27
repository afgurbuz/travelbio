'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import { User } from '@supabase/supabase-js'
import { Trophy, Star, Users, MapPin, TrendingUp, Medal, Award } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
        // Load countries with ratings data
        const { data: ratingsData, error } = await supabase
          .from('country_ratings')
          .select(`
            *,
            country:countries(*)
          `)
          .gte('visitor_count', 1) // At least 1 visitor for meaningful ratings
          .order('avg_overall', { ascending: false })

        if (error) throw error

        if (ratingsData) {
          const rankings: CountryRanking[] = ratingsData
            .filter((r: any) => r.country && r.avg_overall > 0)
            .map((r: any) => ({
              id: r.country.id,
              code: r.country.code,
              name: r.country.name,
              flag: r.country.flag,
              visitor_count: r.visitor_count,
              avg_overall: r.avg_overall,
              avg_transportation: r.avg_transportation || 0,
              avg_accommodation: r.avg_accommodation || 0,
              avg_food: r.avg_food || 0,
              avg_safety: r.avg_safety || 0,
              avg_activities: r.avg_activities || 0,
              avg_value: r.avg_value || 0,
              trip_count: r.visitor_count // Using visitor_count as trip_count for now
            }))

          // Top 10 overall
          setTopCountries(rankings.slice(0, 10))

          // Most visited (by trip count/visitor count)
          const visitedSorted = [...rankings].sort((a, b) => b.visitor_count - a.visitor_count)
          setMostVisited(visitedSorted.slice(0, 10))

          // Category rankings
          const categories: CategoryRanking[] = [
            {
              category: 'transportation',
              icon: <MapPin className="w-5 h-5" />,
              title: 'Best Transportation',
              countries: [...rankings]
                .filter(c => c.avg_transportation > 0)
                .sort((a, b) => b.avg_transportation - a.avg_transportation)
                .slice(0, 5)
            },
            {
              category: 'accommodation',
              icon: <Award className="w-5 h-5" />,
              title: 'Best Accommodation',
              countries: [...rankings]
                .filter(c => c.avg_accommodation > 0)
                .sort((a, b) => b.avg_accommodation - a.avg_accommodation)
                .slice(0, 5)
            },
            {
              category: 'food',
              icon: <Trophy className="w-5 h-5" />,
              title: 'Best Food & Dining',
              countries: [...rankings]
                .filter(c => c.avg_food > 0)
                .sort((a, b) => b.avg_food - a.avg_food)
                .slice(0, 5)
            },
            {
              category: 'safety',
              icon: <Medal className="w-5 h-5" />,
              title: 'Safest Countries',
              countries: [...rankings]
                .filter(c => c.avg_safety > 0)
                .sort((a, b) => b.avg_safety - a.avg_safety)
                .slice(0, 5)
            },
            {
              category: 'activities',
              icon: <Star className="w-5 h-5" />,
              title: 'Best Activities',
              countries: [...rankings]
                .filter(c => c.avg_activities > 0)
                .sort((a, b) => b.avg_activities - a.avg_activities)
                .slice(0, 5)
            },
            {
              category: 'value',
              icon: <TrendingUp className="w-5 h-5" />,
              title: 'Best Value for Money',
              countries: [...rankings]
                .filter(c => c.avg_value > 0)
                .sort((a, b) => b.avg_value - a.avg_value)
                .slice(0, 5)
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
      <main className="min-h-screen bg-white dark:bg-slate-950">
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
                Discover the world's best destinations ranked by real travelers. 
                Find out which countries excel in different categories.
              </p>
            </div>

            {/* Top 10 Overall */}
            <Card className="mb-12">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <Trophy className="w-6 h-6 text-yellow-500" />
                  Top 10 Overall Destinations
                </CardTitle>
                <p className="text-slate-600 dark:text-slate-400">
                  Highest rated countries based on overall traveler experiences
                </p>
              </CardHeader>
              <CardContent>
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
                  <div className="grid gap-4">
                    {topCountries.map((country, index) => (
                      <Card key={country.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <Link 
                            href={`/country/${country.code.toLowerCase()}`}
                            className="flex items-center gap-4 group"
                          >
                            <div className="flex items-center gap-3">
                              {getRankMedal(index + 1)}
                              <span className="text-3xl">{country.flag}</span>
                            </div>
                            
                            <div className="flex-1">
                              <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                                {country.name}
                              </h3>
                              <div className="flex items-center gap-3 mt-1">
                                <StarRating value={country.avg_overall} readonly showValue />
                                <Badge variant="secondary" className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {country.visitor_count} travelers
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                                {country.avg_overall.toFixed(1)}
                              </div>
                              <div className="text-sm text-slate-500 dark:text-slate-400">
                                overall
                              </div>
                            </div>
                          </Link>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Most Visited */}
            <Card className="mb-12">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <Users className="w-6 h-6 text-blue-500" />
                  Most Visited Countries
                </CardTitle>
                <p className="text-slate-600 dark:text-slate-400">
                  Popular destinations with the most traveler reviews
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {mostVisited.slice(0, 5).map((country, index) => (
                    <Card key={country.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4 text-center">
                        <Link 
                          href={`/country/${country.code.toLowerCase()}`}
                          className="block group"
                        >
                          <div className="mb-3">{getRankMedal(index + 1)}</div>
                          <div className="text-4xl mb-3">{country.flag}</div>
                          <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors mb-2">
                            {country.name}
                          </h3>
                          <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                            {country.visitor_count}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            travelers
                          </div>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Category Rankings */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {categoryRankings.map((category) => (
                <Card key={category.category}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      {category.icon}
                      {category.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {category.countries.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-slate-500 dark:text-slate-400">No ratings yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {category.countries.map((country, index) => (
                          <Link 
                            key={country.id}
                            href={`/country/${country.code.toLowerCase()}`}
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors group"
                          >
                            <div className="flex items-center gap-2">
                              {getRankMedal(index + 1)}
                              <span className="text-2xl">{country.flag}</span>
                            </div>
                            
                            <div className="flex-1">
                              <h4 className="font-medium text-slate-900 dark:text-white group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                                {country.name}
                              </h4>
                              <StarRating 
                                value={category.category === 'transportation' ? country.avg_transportation :
                                       category.category === 'accommodation' ? country.avg_accommodation :
                                       category.category === 'food' ? country.avg_food :
                                       category.category === 'safety' ? country.avg_safety :
                                       category.category === 'activities' ? country.avg_activities :
                                       country.avg_value} 
                                readonly 
                                size="sm" 
                                showValue
                              />
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* CTA */}
            {!user && (
              <Card className="mt-16 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-0">
                <CardContent className="text-center py-12">
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
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </>
  )
}