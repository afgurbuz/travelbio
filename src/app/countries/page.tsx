'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import { User } from '@supabase/supabase-js'
import { Globe, Search, MapPin, Star, Users } from 'lucide-react'
import Link from 'next/link'
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// import { Input } from '@/components/ui/input'
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
                ? new Set(locationsData.map((l: any) => l.user_id)).size 
                : 0

              const tripCount = locationsData?.length || 0

              // Calculate average rating
              const ratingsData = locationsData?.filter((l: any) => l.overall_rating) || []
              const avgRating = ratingsData.length > 0
                ? ratingsData.reduce((sum: number, l: any) => sum + (l.overall_rating || 0), 0) / ratingsData.length
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
      <main className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-8">
          <div className="animate-fade-in">
            {/* Header - Facebook Style */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Globe className="w-8 h-8 text-white" />
                </div>
                
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                  Explore Countries
                </h1>
                
                <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-6">
                  Discover destinations around the world with traveler ratings and experiences.
                </p>
                
                {/* Search - Facebook Style */}
                <div className="max-w-md mx-auto relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search countries..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-700 border-0 rounded-full text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Stats - Facebook Style */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {countries.length}
                </div>
                <p className="text-gray-600 dark:text-gray-400">Total Countries</p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {countries.filter(c => c.visitor_count > 0).length}
                </div>
                <p className="text-gray-600 dark:text-gray-400">Countries Visited</p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {countries.reduce((sum, c) => sum + c.trip_count, 0)}
                </div>
                <p className="text-gray-600 dark:text-gray-400">Total Trips</p>
              </div>
            </div>

            {/* Countries Grid - Facebook Style */}
            {filteredCountries.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No countries found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Try adjusting your search terms.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredCountries.map((country) => (
                  <Link 
                    key={country.id}
                    href={`/country/${country.code.toLowerCase()}`}
                    className="block bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                  >
                    <div className="p-6">
                      <div className="text-center space-y-4">
                        {/* Flag */}
                        <div className="text-5xl mb-3">{country.flag}</div>
                        
                        {/* Country Name */}
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {country.name}
                        </h3>
                        
                        {/* Stats */}
                        <div className="space-y-2">
                          {country.avg_overall > 0 && (
                            <div className="flex items-center justify-center gap-2">
                              <StarRating value={country.avg_overall} readonly size="sm" />
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {country.avg_overall.toFixed(1)}
                              </span>
                            </div>
                          )}
                          
                          <div className="flex justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            {country.visitor_count > 0 && (
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {country.visitor_count}
                              </span>
                            )}
                            {country.trip_count > 0 && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {country.trip_count}
                              </span>
                            )}
                          </div>
                          
                          {country.visitor_count === 0 && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              No reviews yet
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* CTA - Facebook Style */}
            {!user && (
              <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  Share your travel experiences
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  Join TravelBio to rate countries and help other travelers discover amazing destinations.
                </p>
                <Link 
                  href="/auth/signup"
                  className="btn-facebook"
                >
                  <Globe className="w-5 h-5" />
                  Join TravelBio
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  )
}