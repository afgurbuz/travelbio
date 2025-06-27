'use client'

import { useEffect, useState } from 'react'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { MapPin, Globe, Share2, Calendar, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

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
}

interface PageProps {
  params: { username: string }
}

export default function PublicProfilePage({ params }: PageProps) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [userLocations, setUserLocations] = useState<UserLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [notFoundProfile, setNotFoundProfile] = useState(false)

  useEffect(() => {
    const loadProfile = async () => {
      try {
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

        // Load user locations
        const { data: locationsData } = await supabase
          .from('user_locations')
          .select(`
            *,
            country:countries(*),
            city:cities(*)
          `)
          .eq('user_id', profileData.id)
        
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
      alert('Profile link copied to clipboard!')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950">
        <div className="flex justify-center items-center min-h-screen">
          <div className="spinner"></div>
        </div>
      </div>
    )
  }

  if (notFoundProfile || !profile) {
    notFound()
  }

  const livedLocations = userLocations.filter(loc => loc.type === 'lived')
  const visitedLocations = userLocations.filter(loc => loc.type === 'visited')

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/discover" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                <Globe className="w-6 h-6 text-white dark:text-slate-900" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                TravelBio
              </span>
            </Link>
            <Button
              onClick={handleShare}
              className="flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-fade-in">
          {/* Profile Header */}
          <Card className="mb-8">
            <CardContent className="pt-8">
              <div className="text-center">
                <div className="relative inline-block mb-6">
                  <Avatar className="w-32 h-32 border-4 border-white shadow-xl">
                    <AvatarImage 
                      src={profile.avatar_url || undefined} 
                      alt={profile.username}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-gradient-to-br from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 text-white dark:text-slate-900 text-4xl font-bold">
                      {profile.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-3">
                  {profile.full_name || profile.username}
                </h1>
                
                <p className="text-xl text-slate-600 dark:text-slate-400 mb-4">
                  @{profile.username}
                </p>
                
                {profile.bio && (
                  <>
                    <p className="text-lg text-slate-700 dark:text-slate-300 max-w-2xl mx-auto mb-6 leading-relaxed">
                      {profile.bio}
                    </p>
                    <Separator className="my-6" />
                  </>
                )}
                
                <div className="flex items-center justify-center space-x-2 text-slate-500 dark:text-slate-400">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</span>
                </div>
              </div>
            </CardContent>
          </Card>


          {userLocations.length === 0 ? (
            <Card className="text-center py-16">
              <CardContent>
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                  No travel history yet
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  {profile.username} hasn't added any travel experiences yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {/* Lived Locations */}
              {livedLocations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <span className="text-2xl">🏠</span>
                      Places I've Lived
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {livedLocations.map(location => (
                        <Card key={location.id} className="p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-center space-x-4">
                            <span className="text-3xl">{location.country.flag}</span>
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-white">
                                {location.city ? (
                                  <>
                                    {location.city.name}, <Link 
                                      href={`/country/${location.country.code.toLowerCase()}`}
                                      className="hover:underline hover:text-slate-600 dark:hover:text-slate-300"
                                    >
                                      {location.country.name}
                                    </Link>
                                  </>
                                ) : (
                                  <Link 
                                    href={`/country/${location.country.code.toLowerCase()}`}
                                    className="hover:underline hover:text-slate-600 dark:hover:text-slate-300"
                                  >
                                    {location.country.name}
                                  </Link>
                                )}
                              </div>
                              <Badge variant="secondary" className="text-xs mt-1">
                                Lived
                              </Badge>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Visited Locations */}
              {visitedLocations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <span className="text-2xl">✈️</span>
                      Places I've Visited
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {visitedLocations.map(location => (
                        <Card key={location.id} className="p-3 hover:shadow-md transition-shadow">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{location.country.flag}</span>
                            <div>
                              <div className="font-medium text-slate-900 dark:text-white">
                                {location.city ? (
                                  <>
                                    {location.city.name}, <Link 
                                      href={`/country/${location.country.code.toLowerCase()}`}
                                      className="hover:underline hover:text-slate-600 dark:hover:text-slate-300"
                                    >
                                      {location.country.name}
                                    </Link>
                                  </>
                                ) : (
                                  <Link 
                                    href={`/country/${location.country.code.toLowerCase()}`}
                                    className="hover:underline hover:text-slate-600 dark:hover:text-slate-300"
                                  >
                                    {location.country.name}
                                  </Link>
                                )}
                              </div>
                              <Badge variant="secondary" className="text-xs mt-1">
                                Visited
                              </Badge>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* CTA */}
          <div className="text-center mt-16 pt-8 border-t border-slate-200 dark:border-slate-700">
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Want to create your own travel profile?
            </p>
            <Link href="/auth/signup" className="btn-primary px-8 py-3 text-lg">
              <Globe className="w-5 h-5 mr-2" />
              Join TravelBio
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}