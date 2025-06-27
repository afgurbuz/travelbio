'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import { User } from '@supabase/supabase-js'
import { Globe, Search, MapPin, Star, Users } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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

interface CountryWithStats extends Country {
  visitor_count: number
  avg_overall: number
  trip_count: number
}

export default function CountriesPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [countries, setCountries] = useState<CountryWithStats[]>([])
  const [filteredCountries, setFilteredCountries] = useState<CountryWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

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
    const loadCountries = async () => {
      try {
        // Load all countries
        const { data: countriesData, error: countriesError } = await supabase
          .from('countries')
          .select('*')
          .order('name')

        if (countriesError) throw countriesError

        if (countriesData) {
          // Get stats for each country
          const countriesWithStats = await Promise.all(
            countriesData.map(async (country: Country) => {
              // Get visitor count and trip count
              const { data: locationsData } = await supabase
                .from('user_locations')
                .select('user_id, overall_rating')
                .eq('country_id', country.id)

              const visitorCount = locationsData 
                ? new Set(locationsData.map(l => l.user_id)).size 
                : 0

              const tripCount = locationsData?.length || 0

              // Calculate average rating
              const ratingsData = locationsData?.filter(l => l.overall_rating) || []
              const avgRating = ratingsData.length > 0
                ? ratingsData.reduce((sum, l) => sum + (l.overall_rating || 0), 0) / ratingsData.length
                : 0

              return {
                ...country,
                visitor_count: visitorCount,
                avg_overall: avgRating,
                trip_count: tripCount
              }
            })
          )

          setCountries(countriesWithStats)
          setFilteredCountries(countriesWithStats)
        }
      } catch (error) {
        console.error('Error loading countries:', error)
      } finally {
        setLoading(false)
      }
    }

    loadCountries()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      const filtered = countries.filter(country =>
        country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        country.code.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredCountries(filtered)
    } else {
      setFilteredCountries(countries)
    }
  }, [searchTerm, countries])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
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
                <div className="w-20 h-20 bg-gradient-to-br from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 rounded-3xl flex items-center justify-center mx-auto shadow-lg">
                  <Globe className="w-10 h-10 text-white dark:text-slate-900" />
                </div>
              </div>
              
              <h1 className="text-5xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent mb-6">
                Explore Countries
              </h1>
              
              <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed">
                Discover destinations around the world with traveler ratings and experiences. 
                Find your next adventure destination.
              </p>
              
              {/* Search */}
              <div className="max-w-md mx-auto relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search countries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 py-3 text-lg"
                />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                    {countries.length}
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">Total Countries</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                    {countries.filter(c => c.visitor_count > 0).length}
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">Countries Visited</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                    {countries.reduce((sum, c) => sum + c.trip_count, 0)}
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">Total Trips</p>
                </CardContent>
              </Card>
            </div>

            {/* Countries Grid */}
            {filteredCountries.length === 0 ? (
              <Card className="max-w-md mx-auto p-8 text-center">
                <CardContent className="pt-6">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                    No countries found
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Try adjusting your search terms.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredCountries.map((country) => (
                  <Card 
                    key={country.id}
                    className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                  >
                    <Link href={`/country/${country.code.toLowerCase()}`}>
                      <CardContent className="p-6">
                        <div className="text-center space-y-4">
                          {/* Flag */}
                          <div className="text-6xl mb-4">{country.flag}</div>
                          
                          {/* Country Name */}
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                            {country.name}
                          </h3>
                          
                          {/* Stats */}
                          <div className="space-y-3">
                            {country.avg_overall > 0 && (
                              <div className="flex items-center justify-center gap-2">
                                <StarRating value={country.avg_overall} readonly size="sm" />
                                <span className="text-sm text-slate-600 dark:text-slate-400">
                                  {country.avg_overall.toFixed(1)}
                                </span>
                              </div>
                            )}
                            
                            <div className="flex justify-center gap-3">
                              {country.visitor_count > 0 && (
                                <Badge variant="secondary" className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {country.visitor_count}
                                </Badge>
                              )}
                              {country.trip_count > 0 && (
                                <Badge variant="secondary" className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {country.trip_count}
                                </Badge>
                              )}
                            </div>
                            
                            {country.visitor_count === 0 && (
                              <div className="text-sm text-slate-500 dark:text-slate-400">
                                No reviews yet
                              </div>
                            )}
                          </div>
                          
                          {/* Additional Info */}
                          {(country.currency || country.language) && (
                            <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                              {country.currency && (
                                <div>Currency: {country.currency}</div>
                              )}
                              {country.language && (
                                <div>Language: {country.language}</div>
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Link>
                  </Card>
                ))}
              </div>
            )}

            {/* CTA */}
            {!user && (
              <Card className="mt-16 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-0">
                <CardContent className="text-center py-12">
                  <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                    Share your travel experiences
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-8 text-lg max-w-md mx-auto">
                    Join TravelBio to rate countries and help other travelers discover amazing destinations.
                  </p>
                  <Link 
                    href="/auth/signup"
                    className="inline-flex items-center px-8 py-3 text-lg font-medium text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
                  >
                    <Globe className="w-5 h-5 mr-2" />
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