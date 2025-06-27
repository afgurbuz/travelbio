'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import { User } from '@supabase/supabase-js'
import { Search, MapPin, Users, Star, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import StarRating from '@/components/StarRating'

interface UserResult {
  id: string
  username: string
  full_name?: string
  bio?: string
  avatar_url?: string
  country_count?: number
}

interface CountryResult {
  id: number
  code: string
  name: string
  flag: string
  visitor_count?: number
  avg_rating?: number
}

function SearchContent() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''
  const [user, setUser] = useState<User | null>(null)
  const [userResults, setUserResults] = useState<UserResult[]>([])
  const [countryResults, setCountryResults] = useState<CountryResult[]>([])
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
    const performSearch = async () => {
      if (!query.trim()) {
        setUserResults([])
        setCountryResults([])
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        // Search users with country count
        const { data: usersData } = await supabase
          .from('profiles')
          .select(`
            id,
            username,
            full_name,
            bio,
            avatar_url
          `)
          .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
          .limit(20)

        if (usersData) {
          // Get country counts for each user
          const usersWithCounts = await Promise.all(
            usersData.map(async (user: any) => {
              const { count } = await supabase
                .from('user_locations')
                .select('country_id', { count: 'exact', head: true })
                .eq('user_id', user.id)
              
              return {
                ...user,
                country_count: count || 0
              }
            })
          )
          setUserResults(usersWithCounts)
        }

        // Search countries with visitor count and ratings
        const { data: countriesData } = await supabase
          .from('countries')
          .select('*')
          .ilike('name', `%${query}%`)
          .limit(20)

        if (countriesData) {
          // Get visitor counts and average ratings
          const countriesWithStats = await Promise.all(
            countriesData.map(async (country: any) => {
              const { data: ratingsData } = await supabase
                .from('user_locations')
                .select('user_id, overall_rating')
                .eq('country_id', country.id)
                .not('overall_rating', 'is', null)

              const visitorSet = new Set(ratingsData?.map((r: any) => r.user_id) || [])
              const avgRating = ratingsData && ratingsData.length > 0
                ? ratingsData.reduce((sum: number, r: any) => sum + (r.overall_rating || 0), 0) / ratingsData.length
                : 0

              return {
                ...country,
                visitor_count: visitorSet.size,
                avg_rating: Math.round(avgRating * 10) / 10
              }
            })
          )
          setCountryResults(countriesWithStats)
        }
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setLoading(false)
      }
    }

    performSearch()
  }, [query])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <>
      <Navigation user={user} onSignOut={handleSignOut} />
      <main className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
          <div className="animate-fade-in">
            {/* Header */}
            <div className="mb-12 text-center">
              <div className="w-16 h-16 gradient-travel rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Search className="w-8 h-8 text-white" />
              </div>
              <h1 className="heading-lg text-gray-900 dark:text-white mb-4">
                Search Results
              </h1>
              {query && (
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  Results for <span className="font-semibold text-gradient">"{query}"</span>
                </p>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="card-modern p-8 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">Searching...</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Users Results */}
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 gradient-ocean rounded-xl flex items-center justify-center">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    <h2 className="heading-md text-gray-900 dark:text-white">
                      Travelers
                    </h2>
                    <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 shadow-lg">
                      {userResults.length}
                    </Badge>
                  </div>

                  {userResults.length === 0 ? (
                    <div className="card-modern p-8 text-center">
                      <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-gray-500 dark:text-gray-400">
                        No travelers found
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {userResults.map((userResult, index) => (
                        <Link
                          key={userResult.id}
                          href={`/${userResult.username}`}
                          className="block animate-scale-in"
                          style={{ animationDelay: `${index * 0.1}s` }}
                        >
                          <div className="card-travel p-6 group">
                            <div className="flex items-center gap-4">
                              <div className="relative">
                                <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg">
                                  {userResult.avatar_url ? (
                                    <img 
                                      src={userResult.avatar_url}
                                      alt={userResult.username}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full gradient-ocean flex items-center justify-center text-white text-xl font-bold">
                                      {userResult.username.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full shadow-sm">
                                  <div className="w-full h-full bg-green-500 rounded-full animate-pulse"></div>
                                </div>
                              </div>
                              <div className="flex-1">
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors duration-300">
                                  {userResult.full_name || userResult.username}
                                </h3>
                                {userResult.full_name && (
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    @{userResult.username}
                                  </p>
                                )}
                                {userResult.bio && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                                    {userResult.bio}
                                  </p>
                                )}
                              </div>
                              {userResult.country_count !== undefined && userResult.country_count > 0 && (
                                <div className="text-center">
                                  <div className="text-lg font-bold text-gradient">
                                    {userResult.country_count}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Countries</div>
                                </div>
                              )}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Countries Results */}
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 gradient-sunset rounded-xl flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-white" />
                    </div>
                    <h2 className="heading-md text-gray-900 dark:text-white">
                      Countries
                    </h2>
                    <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 shadow-lg">
                      {countryResults.length}
                    </Badge>
                  </div>

                  {countryResults.length === 0 ? (
                    <div className="card-modern p-8 text-center">
                      <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MapPin className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-gray-500 dark:text-gray-400">
                        No countries found
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {countryResults.map((country, index) => (
                        <Link
                          key={country.id}
                          href={`/country/${country.code.toLowerCase()}`}
                          className="block animate-scale-in"
                          style={{ animationDelay: `${index * 0.1}s` }}
                        >
                          <div className="card-travel p-6 group">
                            <div className="flex items-center gap-4">
                              <div className="text-5xl flag-emoji group-hover:scale-110 transition-transform duration-300">
                                {country.flag}
                              </div>
                              <div className="flex-1">
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors duration-300 mb-2">
                                  {country.name}
                                </h3>
                                <div className="flex items-center gap-4">
                                  {country.visitor_count !== undefined && country.visitor_count > 0 && (
                                    <div className="flex items-center gap-2">
                                      <Users className="w-4 h-4 text-gray-500" />
                                      <span className="text-sm text-gray-600 dark:text-gray-400">
                                        {country.visitor_count} travelers
                                      </span>
                                    </div>
                                  )}
                                  {country.avg_rating !== undefined && country.avg_rating > 0 && (
                                    <div className="flex items-center gap-2">
                                      <StarRating value={country.avg_rating} readonly size="sm" />
                                      <span className="text-sm font-medium text-yellow-600">
                                        {country.avg_rating}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* No results for either */}
            {!loading && query && userResults.length === 0 && countryResults.length === 0 && (
              <div className="card-modern p-16 text-center max-w-lg mx-auto">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="heading-md text-gray-900 dark:text-white mb-4">
                  No Results Found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  No results found for <span className="font-semibold text-gradient">"{query}"</span>
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Try different keywords or check your spelling
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-slate-900">
        <div className="card-modern p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading search...</p>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}