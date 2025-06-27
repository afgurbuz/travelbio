'use client'

import { useEffect, useState } from 'react'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import { User } from '@supabase/supabase-js'
import { MapPin, Globe, Share2, Calendar, ArrowLeft, Clock, Globe2, ExternalLink, X } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import StarRating from '@/components/StarRating'

interface Profile {
  id: string
  username: string
  email: string
  full_name?: string
  bio?: string
  avatar_url?: string
  created_at: string
}

interface Country {
  id: number
  code: string
  name: string
  flag: string
}

interface City {
  id: number
  name: string
  country_id: number
}

interface UserLocation {
  id: string
  country_id: number
  city_id?: number
  type: 'lived' | 'visited'
  country: Country
  city?: City
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
}

interface PageProps {
  params: { username: string }
}

export default function PublicProfilePage({ params }: PageProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [userLocations, setUserLocations] = useState<UserLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [notFoundProfile, setNotFoundProfile] = useState(false)
  const [activeTab, setActiveTab] = useState<'countries' | 'timeline'>('countries')
  const [showCountryModal, setShowCountryModal] = useState(false)
  const [selectedCountryData, setSelectedCountryData] = useState<{country: Country; locations: UserLocation[]} | null>(null)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        setCurrentUser(user)

        // Load profile by username
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', params.username)
          .single()
        
        if (profileError || !profileData) {
          setNotFoundProfile(true)
          setLoading(false)
          return
        }
        
        setProfile(profileData)

        // Load user locations with ratings
        const { data: locationsData } = await supabase
          .from('user_locations')
          .select(`
            *,
            country:countries(*),
            city:cities(*)
          `)
          .eq('user_id', profileData.id)
          .order('created_at', { ascending: false })
        
        if (locationsData) {
          setUserLocations(locationsData as UserLocation[])
        }
        
        setLoading(false)
      } catch (error) {
        console.error('Error loading profile:', error)
        setNotFoundProfile(true)
        setLoading(false)
      }
    }

    loadProfile()
  }, [params.username])

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile?.username}'s Travel Profile`,
          text: `Check out ${profile?.username}'s travel experiences on TravelBio`,
          url: window.location.href,
        })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      // TODO: Replace with proper toast notification  
      alert('Profile link copied to clipboard!')
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="spinner"></div>
      </div>
    )
  }

  if (notFoundProfile || !profile) {
    notFound()
  }

  const livedLocations = userLocations.filter(loc => loc.type === 'lived')
  const visitedLocations = userLocations.filter(loc => loc.type === 'visited')

  return (
    <>
      <Navigation user={currentUser} onSignOut={handleSignOut} />
      <main className="min-h-screen bg-white dark:bg-slate-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
        <div className="animate-fade-in">
          {/* Profile Header */}
          <Card className="mb-8">
            <CardContent className="pt-8">
              <div className="text-center">
                <div className="relative inline-block mb-6">
                  <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                    <AvatarImage 
                      src={profile.avatar_url || undefined} 
                      alt={profile.username}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-gradient-to-br from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 text-white dark:text-slate-900 text-2xl font-bold">
                      {profile.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                  {profile.full_name || profile.username}
                </h1>
                
                {profile.full_name && (
                  <p className="text-slate-600 dark:text-slate-400 mb-2">
                    @{profile.username}
                  </p>
                )}
                
                {profile.bio && (
                  <p className="text-slate-700 dark:text-slate-300 max-w-md mx-auto mb-6">
                    {profile.bio}
                  </p>
                )}
                
                <div className="flex flex-wrap justify-center gap-3">
                  <Button
                    onClick={handleShare}
                    variant="secondary"
                    className="flex items-center gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </Button>
                  {!currentUser && (
                    <Button
                      asChild
                      className="flex items-center gap-2"
                    >
                      <Link href="/auth/signup">
                        <Globe className="w-4 h-4" />
                        Join TravelBio
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>


          {/* Travel Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  {profile.username}'s Travels
                </CardTitle>
              </div>
              
              {/* Tabs */}
              <div className="flex gap-4 border-b border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setActiveTab('countries')}
                  className={`flex items-center gap-2 pb-3 px-1 border-b-2 transition-colors ${
                    activeTab === 'countries'
                      ? 'border-slate-900 dark:border-slate-100 text-slate-900 dark:text-white'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <Globe2 className="w-4 h-4" />
                  Countries
                </button>
                <button
                  onClick={() => setActiveTab('timeline')}
                  className={`flex items-center gap-2 pb-3 px-1 border-b-2 transition-colors ${
                    activeTab === 'timeline'
                      ? 'border-slate-900 dark:border-slate-100 text-slate-900 dark:text-white'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  Timeline
                </button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Tab Content */}
              {userLocations.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MapPin className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">
                    {profile.username} hasn't added any travel experiences yet.
                  </p>
                </div>
              ) : activeTab === 'countries' ? (
                /* Countries Tab - Click to Expand */
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {/* Group locations by country */}
                  {Object.entries(
                    userLocations.reduce((acc, location) => {
                      const countryKey = `${location.country.id}-${location.country.name}`
                      if (!acc[countryKey]) {
                        acc[countryKey] = {
                          country: location.country,
                          locations: []
                        }
                      }
                      acc[countryKey].locations.push(location)
                      return acc
                    }, {} as Record<string, { country: Country; locations: UserLocation[] }>)
                  ).map(([countryKey, { country, locations }]) => {
                    const avgRating = locations.filter(l => l.overall_rating).length > 0 
                      ? locations.reduce((sum, l) => sum + (l.overall_rating || 0), 0) / locations.filter(l => l.overall_rating).length 
                      : 0
                    
                    return (
                      <Card 
                        key={countryKey}
                        className="cursor-pointer transition-all hover:shadow-md hover:scale-105 group"
                        onClick={() => {
                          setSelectedCountryData({country, locations})
                          setShowCountryModal(true)
                        }}
                      >
                        <CardContent className="p-4 text-center relative">
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                              Detayları gör
                            </div>
                          </div>
                          <div className="text-3xl mb-2">{country.flag}</div>
                          <div className="font-bold text-slate-900 dark:text-white mb-2">
                            {country.name}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                            {locations.length} {locations.length === 1 ? 'trip' : 'trips'}
                          </div>
                          {avgRating > 0 && (
                            <div className="flex items-center justify-center gap-1">
                              <StarRating value={avgRating} readonly size="sm" />
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                {avgRating.toFixed(1)}
                              </span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              ) : (
                /* Timeline Tab */
                <div className="space-y-4">
                  {userLocations.map(location => (
                    <Card key={location.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{location.country.flag}</span>
                            <div>
                              <div className="font-medium text-slate-900 dark:text-white">
                                {location.city ? location.city.name + ', ' : ''}
                                <Link 
                                  href={`/country/${location.country.code.toLowerCase()}`}
                                  className="hover:underline hover:text-slate-600 dark:hover:text-slate-300"
                                >
                                  {location.country.name}
                                </Link>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant={location.type === 'lived' ? 'default' : 'secondary'} className="text-xs">
                                  {location.type === 'lived' ? '🏠 Lived' : '✈️ Visited'}
                                </Badge>
                                {location.visit_date && (
                                  <span className="text-xs text-slate-500 dark:text-slate-400">
                                    {new Date(location.visit_date).toLocaleDateString()}
                                  </span>
                                )}
                                {location.overall_rating && (
                                  <StarRating value={location.overall_rating} readonly size="sm" showValue />
                                )}
                              </div>
                              {location.comment && (
                                <p className="text-sm text-slate-600 dark:text-slate-400 italic mt-2">
                                  "{location.comment}"
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Country Details Modal */}
          {showCountryModal && selectedCountryData && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-slate-900 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{selectedCountryData.country.flag}</span>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                        {selectedCountryData.country.name}
                      </h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {selectedCountryData.locations.length} {selectedCountryData.locations.length === 1 ? 'trip' : 'trips'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link 
                      href={`/country/${selectedCountryData.country.code.toLowerCase()}`}
                      className="btn-secondary text-sm"
                      onClick={() => setShowCountryModal(false)}
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Ülke Sayfası
                    </Link>
                    <Button
                      onClick={() => setShowCountryModal(false)}
                      variant="ghost"
                      size="sm"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  {selectedCountryData.locations.map(location => (
                    <Card key={location.id} className="bg-slate-50 dark:bg-slate-800 border-0">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Badge 
                            variant={location.type === 'lived' ? 'default' : 'secondary'}
                            className="text-xs shrink-0 mt-1"
                          >
                            {location.type === 'lived' ? '🏠 Yaşadım' : '✈️ Ziyaret'}
                          </Badge>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {location.city && (
                                <span className="font-medium text-slate-900 dark:text-white">
                                  {location.city.name}
                                </span>
                              )}
                              {location.visit_date && (
                                <span className="text-sm text-slate-500 dark:text-slate-400">
                                  {new Date(location.visit_date).toLocaleDateString('tr-TR')}
                                </span>
                              )}
                            </div>
                            {location.overall_rating && (
                              <div className="mb-3">
                                <StarRating value={location.overall_rating} readonly showValue />
                              </div>
                            )}
                            {location.comment && (
                              <p className="text-sm text-slate-600 dark:text-slate-400 italic">
                                "{location.comment}"
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* CTA for non-users */}
          {!currentUser && (
            <div className="text-center mt-16 pt-8 border-t border-slate-200 dark:border-slate-700">
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Want to create your own travel profile?
              </p>
              <Button asChild size="lg" className="px-8 py-3 text-lg">
                <Link href="/auth/signup">
                  <Globe className="w-5 h-5 mr-2" />
                  Join TravelBio
                </Link>
              </Button>
            </div>
          )}
        </div>
        </div>
      </main>
    </>
  )
}