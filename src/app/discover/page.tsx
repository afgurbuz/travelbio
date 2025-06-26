'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Profile, Country } from '@/types'
import { getCountryByCode } from '@/lib/countries'
import ProfileCard from '@/components/ProfileCard'

export default function DiscoverPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProfiles()
  }, [])

  const loadProfiles = async () => {
    try {
      // Get profiles with their countries
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .limit(20)

      if (profilesError) throw profilesError

      // Get user countries for all profiles
      const { data: userCountriesData, error: countriesError } = await supabase
        .from('user_countries')
        .select('*')

      if (countriesError) throw countriesError

      // Combine data
      const combinedProfiles: Profile[] = profilesData.map((profile: any) => {
        const userCountries = userCountriesData.filter((uc: any) => uc.user_id === profile.id)
        
        const lived_countries = userCountries
          .filter((uc: any) => uc.type === 'lived')
          .map((uc: any) => getCountryByCode(uc.country_code))
          .filter(Boolean) as Country[]

        const visited_countries = userCountries
          .filter((uc: any) => uc.type === 'visited')
          .map((uc: any) => getCountryByCode(uc.country_code))
          .filter(Boolean) as Country[]

        return {
          user: {
            id: profile.id,
            email: profile.username + '@example.com', // We don't have email in profiles
            username: profile.username,
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
            bio: profile.bio,
            created_at: profile.created_at
          },
          lived_countries,
          visited_countries
        }
      })

      // Filter out profiles with no travel data
      const profilesWithData = combinedProfiles.filter(
        profile => profile.lived_countries.length > 0 || profile.visited_countries.length > 0
      )

      setProfiles(profilesWithData)
    } catch (error) {
      console.error('Error loading profiles:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-xl text-gray-600">Loading profiles...</div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Discover Travelers</h2>
        <p className="text-gray-600">
          Explore profiles from fellow travelers around the world
        </p>
      </div>

      {profiles.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg mb-4">No profiles found yet</p>
          <p className="text-gray-500">Be the first to set up your travel profile!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map(profile => (
            <ProfileCard key={profile.user.id} profile={profile} />
          ))}
        </div>
      )}
    </div>
  )
}