'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { Country } from '@/types'
import { getCountryByCode } from '@/lib/countries'
import CountrySelector from '@/components/CountrySelector'

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [livedCountries, setLivedCountries] = useState<Country[]>([])
  const [visitedCountries, setVisitedCountries] = useState<Country[]>([])

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
        return
      }
      setUser(user)
      await loadUserCountries(user.id)
      setLoading(false)
    }

    getUser()
  }, [router])

  const loadUserCountries = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_countries')
      .select('country_code, type')
      .eq('user_id', userId)

    if (error) {
      console.error('Error loading countries:', error)
      return
    }

    const lived: Country[] = []
    const visited: Country[] = []

    data.forEach((item: any) => {
      const country = getCountryByCode(item.country_code)
      if (country) {
        if (item.type === 'lived') {
          lived.push(country)
        } else {
          visited.push(country)
        }
      }
    })

    setLivedCountries(lived)
    setVisitedCountries(visited)
  }

  const saveProfile = async () => {
    if (!user) return
    
    setSaving(true)
    
    try {
      // Delete existing entries
      await supabase
        .from('user_countries')
        .delete()
        .eq('user_id', user.id)

      // Insert new entries
      const entries = [
        ...livedCountries.map(country => ({
          user_id: user.id,
          country_code: country.code,
          type: 'lived' as const
        })),
        ...visitedCountries.map(country => ({
          user_id: user.id,
          country_code: country.code,
          type: 'visited' as const
        }))
      ]

      if (entries.length > 0) {
        const { error } = await supabase
          .from('user_countries')
          .insert(entries)

        if (error) throw error
      }

      alert('Profile saved successfully!')
    } catch (error: any) {
      alert('Error saving profile: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Edit Your Profile</h2>
          <div className="space-x-4">
            <button
              onClick={() => router.push('/')}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              Back
            </button>
            <button
              onClick={saveProfile}
              disabled={saving}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <CountrySelector
            title="Countries I've Lived In"
            selectedCountries={livedCountries}
            onCountriesChange={setLivedCountries}
            maxSelection={5}
          />
          
          <CountrySelector
            title="Countries I've Visited"
            selectedCountries={visitedCountries}
            onCountriesChange={setVisitedCountries}
          />
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-md">
          <h4 className="font-semibold text-gray-800 mb-2">Profile Preview</h4>
          <div className="space-y-2">
            {livedCountries.length > 0 && (
              <div>
                <span className="text-sm text-gray-600">Lived in: </span>
                <span className="text-sm">
                  {livedCountries.map(country => `${country.flag} ${country.name}`).join(', ')}
                </span>
              </div>
            )}
            {visitedCountries.length > 0 && (
              <div>
                <span className="text-sm text-gray-600">Visited: </span>
                <span className="text-sm">
                  {visitedCountries.map(country => `${country.flag} ${country.name}`).join(', ')}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}