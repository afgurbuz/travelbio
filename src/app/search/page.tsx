'use client'

import { useEffect, useState } from 'react'
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

export default function SearchPage() {
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
      <main className="min-h-screen bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
          <div className="animate-fade-in">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                Arama Sonuçları
              </h1>
              {query && (
                <p className="text-slate-600 dark:text-slate-400">
                  "{query}" için sonuçlar
                </p>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Users Results */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      Kullanıcılar
                    </h2>
                    <Badge variant="secondary">{userResults.length}</Badge>
                  </div>

                  {userResults.length === 0 ? (
                    <Card>
                      <CardContent className="py-8 text-center">
                        <p className="text-slate-500 dark:text-slate-400">
                          Kullanıcı bulunamadı
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {userResults.map((userResult) => (
                        <Link
                          key={userResult.id}
                          href={`/${userResult.username}`}
                          className="block"
                        >
                          <Card className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-4">
                                <Avatar className="w-12 h-12">
                                  <AvatarImage 
                                    src={userResult.avatar_url || undefined}
                                    alt={userResult.username}
                                  />
                                  <AvatarFallback className="bg-gradient-to-br from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 text-white dark:text-slate-900">
                                    {userResult.username.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <h3 className="font-bold text-slate-900 dark:text-white">
                                    {userResult.full_name || userResult.username}
                                  </h3>
                                  {userResult.full_name && (
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                      @{userResult.username}
                                    </p>
                                  )}
                                  {userResult.bio && (
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                                      {userResult.bio}
                                    </p>
                                  )}
                                </div>
                                {userResult.country_count !== undefined && userResult.country_count > 0 && (
                                  <Badge variant="secondary" className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {userResult.country_count}
                                  </Badge>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Countries Results */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      Ülkeler
                    </h2>
                    <Badge variant="secondary">{countryResults.length}</Badge>
                  </div>

                  {countryResults.length === 0 ? (
                    <Card>
                      <CardContent className="py-8 text-center">
                        <p className="text-slate-500 dark:text-slate-400">
                          Ülke bulunamadı
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {countryResults.map((country) => (
                        <Link
                          key={country.id}
                          href={`/country/${country.code.toLowerCase()}`}
                          className="block"
                        >
                          <Card className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-4">
                                <span className="text-4xl">{country.flag}</span>
                                <div className="flex-1">
                                  <h3 className="font-bold text-slate-900 dark:text-white">
                                    {country.name}
                                  </h3>
                                  <div className="flex items-center gap-3 mt-1">
                                    {country.visitor_count !== undefined && country.visitor_count > 0 && (
                                      <span className="text-sm text-slate-500 dark:text-slate-400">
                                        {country.visitor_count} ziyaretçi
                                      </span>
                                    )}
                                    {country.avg_rating !== undefined && country.avg_rating > 0 && (
                                      <div className="flex items-center gap-1">
                                        <StarRating value={country.avg_rating} readonly size="sm" />
                                        <span className="text-sm text-slate-500 dark:text-slate-400">
                                          {country.avg_rating}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* No results for either */}
            {!loading && query && userResults.length === 0 && countryResults.length === 0 && (
              <Card>
                <CardContent className="py-16 text-center">
                  <Search className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                    Sonuç bulunamadı
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400">
                    "{query}" için sonuç bulunamadı. Farklı kelimelerle aramayı deneyin.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </>
  )
}