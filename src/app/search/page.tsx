'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import { User } from '@supabase/supabase-js'
import { Search, MapPin, Users, Star, Loader2 } from 'lucide-react'
import Link from 'next/link'
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// import { Badge } from '@/components/ui/badge'
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
      <main className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
          <div className="animate-fade-in">
            {/* Header - Facebook Style */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Arama Sonuçları
                </h1>
                {query && (
                  <p className="text-gray-600 dark:text-gray-400">
                    "{query}" için sonuçlar
                  </p>
                )}
              </div>
            </div>

            {loading ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-16 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Users Results */}
                <div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Kullanıcılar
                      </h2>
                      <span className="ml-auto bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-sm text-gray-600 dark:text-gray-400">
                        {userResults.length}
                      </span>
                    </div>
                  </div>

                  {userResults.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
                      <p className="text-gray-500 dark:text-gray-400">
                        Kullanıcı bulunamadı
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {userResults.map((userResult) => (
                        <Link
                          key={userResult.id}
                          href={`/${userResult.username}`}
                          className="block"
                        >
                          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 p-4">
                            <div className="flex items-center gap-4">
                              <Avatar className="w-12 h-12">
                                <AvatarImage 
                                  src={userResult.avatar_url || undefined}
                                  alt={userResult.username}
                                />
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                                  {userResult.username.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <h3 className="font-bold text-gray-900 dark:text-white">
                                  {userResult.full_name || userResult.username}
                                </h3>
                                {userResult.full_name && (
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    @{userResult.username}
                                  </p>
                                )}
                                {userResult.bio && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                    {userResult.bio}
                                  </p>
                                )}
                              </div>
                              {userResult.country_count !== undefined && userResult.country_count > 0 && (
                                <div className="bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400">
                                  <MapPin className="w-3 h-3" />
                                  {userResult.country_count}
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
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Ülkeler
                      </h2>
                      <span className="ml-auto bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-sm text-gray-600 dark:text-gray-400">
                        {countryResults.length}
                      </span>
                    </div>
                  </div>

                  {countryResults.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
                      <p className="text-gray-500 dark:text-gray-400">
                        Ülke bulunamadı
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {countryResults.map((country) => (
                        <Link
                          key={country.id}
                          href={`/country/${country.code.toLowerCase()}`}
                          className="block"
                        >
                          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 p-4">
                            <div className="flex items-center gap-4">
                              <span className="text-4xl">{country.flag}</span>
                              <div className="flex-1">
                                <h3 className="font-bold text-gray-900 dark:text-white">
                                  {country.name}
                                </h3>
                                <div className="flex items-center gap-3 mt-1">
                                  {country.visitor_count !== undefined && country.visitor_count > 0 && (
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                      {country.visitor_count} ziyaretçi
                                    </span>
                                  )}
                                  {country.avg_rating !== undefined && country.avg_rating > 0 && (
                                    <div className="flex items-center gap-1">
                                      <StarRating value={country.avg_rating} readonly size="sm" />
                                      <span className="text-sm text-gray-500 dark:text-gray-400">
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
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-16 text-center">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Sonuç bulunamadı
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  "{query}" için sonuç bulunamadı. Farklı kelimelerle aramayı deneyin.
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
      <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}