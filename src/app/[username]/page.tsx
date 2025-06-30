'use client'

import React, { useEffect, useState } from 'react'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import { User } from '@supabase/supabase-js'
import { MapPin, Globe, Share2, Calendar, ArrowLeft, Clock, Globe2, ExternalLink, X } from 'lucide-react'
import Link from 'next/link'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
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
    return notFound()
  }

  const livedLocations = userLocations.filter(loc => loc.type === 'lived')
  const visitedLocations = userLocations.filter(loc => loc.type === 'visited')

  return (
    <>
      <Navigation user={currentUser} onSignOut={handleSignOut} />
      <main className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-8">
          <div className="animate-fade-in">
            {/* Profile Header - Facebook Style */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-6">
              {/* Cover Photo Area */}
              <div className="h-48 bg-gradient-to-r from-blue-500 to-blue-600 rounded-t-lg relative">
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="flex items-end space-x-4">
                    {/* Profile Picture */}
                    <div className="relative">
                      <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
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
                    
                    <div className="text-white">
                      <h1 className="text-3xl font-bold mb-2">
                        {profile.full_name || profile.username}
                      </h1>
                      
                      {profile.full_name && (
                        <p className="text-blue-100 mb-2">
                          @{profile.username}
                        </p>
                      )}
                      
                      {profile.bio && (
                        <p className="text-blue-100 max-w-md mb-6">
                          {profile.bio}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={handleShare}
                          className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
                        >
                          <Share2 className="w-4 h-4" />
                          Share
                        </button>
                        {!currentUser && (
                          <Link
                            href="/auth/signup"
                            className="bg-white text-blue-600 hover:bg-gray-100 px-4 py-2 rounded-md flex items-center gap-2 font-semibold transition-colors"
                          >
                            <Globe className="w-4 h-4" />
                            Join TravelBio
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Travel Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    {profile.username}'s Travels
                  </h2>
                </div>
                
                {/* Tabs */}
                <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setActiveTab('countries')}
                    className={`flex items-center gap-2 pb-3 px-1 border-b-2 transition-colors ${
                      activeTab === 'countries'
                        ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <Globe2 className="w-4 h-4" />
                    Countries
                  </button>
                  <button
                    onClick={() => setActiveTab('timeline')}
                    className={`flex items-center gap-2 pb-3 px-1 border-b-2 transition-colors ${
                      activeTab === 'timeline'
                        ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    Timeline
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                {/* Tab Content */}
                {userLocations.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MapPin className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
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
                        <div 
                          key={countryKey}
                          className="bg-white dark:bg-gray-700 rounded-lg shadow-sm cursor-pointer transition-all hover:shadow-md hover:scale-105 group"
                          onClick={() => {
                            setSelectedCountryData({country, locations})
                            setShowCountryModal(true)
                          }}
                        >
                          <div className="p-4 text-center relative">
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                Detayları gör
                              </div>
                            </div>
                            <div className="text-3xl mb-2">{country.flag}</div>
                            <div className="font-bold text-gray-900 dark:text-white mb-2">
                              {country.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                              {locations.length} {locations.length === 1 ? 'trip' : 'trips'}
                            </div>
                            {avgRating > 0 && (
                              <div className="flex items-center justify-center gap-1">
                                <StarRating value={avgRating} readonly size="sm" />
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {avgRating.toFixed(1)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  /* Timeline Tab */
                  <div className="space-y-4">
                    {userLocations.map(location => (
                      <div key={location.id} className="bg-white dark:bg-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{location.country.flag}</span>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {location.city ? location.city.name + ', ' : ''}
                                <Link 
                                  href={`/country/${location.country.code.toLowerCase()}`}
                                  className="hover:underline hover:text-blue-600 dark:hover:text-blue-400"
                                >
                                  {location.country.name}
                                </Link>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  location.type === 'lived' 
                                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                }`}>
                                  {location.type === 'lived' ? '🏠 Lived' : '✈️ Visited'}
                                </span>
                                {location.visit_date && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {new Date(location.visit_date).toLocaleDateString()}
                                  </span>
                                )}
                                {location.overall_rating && (
                                  <StarRating value={location.overall_rating} readonly size="sm" showValue />
                                )}
                              </div>
                              {location.comment && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 italic mt-2">
                                  "{location.comment}"
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Country Details Modal */}
            {showCountryModal && selectedCountryData && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                  <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{selectedCountryData.country.flag}</span>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                          {selectedCountryData.country.name}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {selectedCountryData.locations.length} {selectedCountryData.locations.length === 1 ? 'trip' : 'trips'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link 
                        href={`/country/${selectedCountryData.country.code.toLowerCase()}`}
                        className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-3 py-2 rounded-md text-sm flex items-center gap-2 transition-colors"
                        onClick={() => setShowCountryModal(false)}
                      >
                        <ExternalLink className="w-4 h-4" />
                        Ülke Sayfası
                      </Link>
                      <button
                        onClick={() => setShowCountryModal(false)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    {selectedCountryData.locations.map(location => (
                      <div key={location.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <span className={`text-xs px-2 py-1 rounded-full shrink-0 mt-1 ${
                            location.type === 'lived' 
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                              : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                          }`}>
                            {location.type === 'lived' ? '🏠 Yaşadım' : '✈️ Ziyaret'}
                          </span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {location.city && (
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {location.city.name}
                                </span>
                              )}
                              {location.visit_date && (
                                <span className="text-sm text-gray-500 dark:text-gray-400">
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
                              <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                                "{location.comment}"
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* CTA for non-users */}
            {!currentUser && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center mt-6">
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Want to create your own travel profile?
                </p>
                <Link 
                  href="/auth/signup"
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-md font-semibold text-lg transition-colors"
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