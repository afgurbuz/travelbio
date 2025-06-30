'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import { User } from '@supabase/supabase-js'
import { User as UserIcon, MapPin, Save, Plus, X, Share2, ExternalLink, Edit3, Camera, Upload, Settings, Clock, Globe2 } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import StarRating from '@/components/StarRating'

interface Profile {
  id: string
  username: string
  email: string
  full_name?: string
  bio?: string
  avatar_url?: string
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

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [countries, setCountries] = useState<Country[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [userLocations, setUserLocations] = useState<UserLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [locationType, setLocationType] = useState<'lived' | 'visited'>('visited')
  const [modalStep, setModalStep] = useState<'location' | 'rating'>('location')
  const [ratings, setRatings] = useState({
    transportation: 0,
    accommodation: 0,
    food: 0,
    safety: 0,
    activities: 0,
    value: 0,
    overall: 0,
    comment: ''
  })
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [editFullName, setEditFullName] = useState('')
  const [editBio, setEditBio] = useState('')
  const [editAvatarUrl, setEditAvatarUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [activeTab, setActiveTab] = useState<'countries' | 'timeline'>('countries')
  const [visitDate, setVisitDate] = useState('')
  const [showCountryModal, setShowCountryModal] = useState(false)
  const [selectedCountryData, setSelectedCountryData] = useState<{country: Country; locations: UserLocation[]} | null>(null)

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/discover')
        return
      }
      setUser(user)

      // Load profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (profileData) {
        setProfile(profileData)
        setEditFullName(profileData.full_name || '')
        setEditBio(profileData.bio || '')
        setEditAvatarUrl(profileData.avatar_url || '')
      }

      // Load countries
      const { data: countriesData } = await supabase
        .from('countries')
        .select('*')
        .order('name')
      
      if (countriesData) setCountries(countriesData)

      // Load user locations
      const { data: locationsData } = await supabase
        .from('user_locations')
        .select(`
          *,
          country:countries(*),
          city:cities(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (locationsData) setUserLocations(locationsData as UserLocation[])
      
      setLoading(false)
    }

    loadData()
  }, [router])

  useEffect(() => {
    if (selectedCountry) {
      const loadCities = async () => {
        const { data: citiesData } = await supabase
          .from('cities')
          .select('*')
          .eq('country_id', selectedCountry)
          .order('name')
        
        if (citiesData) setCities(citiesData)
      }
      loadCities()
    } else {
      setCities([])
    }
  }, [selectedCountry])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const handleShare = async () => {
    if (!profile?.username) return
    
    const profileUrl = `${window.location.origin}/${profile.username}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile.username}'s Travel Profile`,
          text: `Check out my travel experiences on TravelBio`,
          url: profileUrl,
        })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      navigator.clipboard.writeText(profileUrl)
      // TODO: Replace with proper toast notification
      alert('Profile link copied to clipboard!')
    }
  }

  const uploadAvatar = async (file: File): Promise<string | null> => {
    if (!user) return null

    try {
      setUploading(true)
      
      // Create unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      return data.publicUrl
    } catch (error) {
      console.error('Error uploading avatar:', error)
      // TODO: Replace with proper toast notification
      alert('Error uploading image. Please try again.')
      return null
    } finally {
      setUploading(false)
    }
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      // TODO: Replace with proper toast notification
      alert('Please select an image file')
      return
    }

    // Validate file size (max 1MB)
    if (file.size > 1 * 1024 * 1024) {
      // TODO: Replace with proper toast notification
      alert('Image size must be less than 1MB')
      return
    }

    setAvatarFile(file)
    
    // Create preview URL
    const previewUrl = URL.createObjectURL(file)
    setEditAvatarUrl(previewUrl)
  }

  const handleUpdateProfile = async () => {
    if (!user || !profile) return
    
    setSaving(true)
    try {
      let finalAvatarUrl = editAvatarUrl

      // Upload new avatar if file is selected
      if (avatarFile) {
        const uploadedUrl = await uploadAvatar(avatarFile)
        if (uploadedUrl) {
          finalAvatarUrl = uploadedUrl
        } else {
          setSaving(false)
          return
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editFullName.trim() || null,
          bio: editBio.trim() || null,
          avatar_url: finalAvatarUrl.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
      
      if (!error) {
        setProfile(prev => prev ? {
          ...prev,
          full_name: editFullName.trim() || undefined,
          bio: editBio.trim() || undefined,
          avatar_url: finalAvatarUrl.trim() || undefined
        } : null)
        
        setAvatarFile(null)
        if (editAvatarUrl.startsWith('blob:')) {
          URL.revokeObjectURL(editAvatarUrl)
        }
        
        setShowEditProfile(false)
        // TODO: Replace with proper toast notification
        alert('Profile updated successfully!')
      } else {
        // TODO: Replace with proper toast notification
        alert('Error updating profile: ' + error.message)
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      // TODO: Replace with proper toast notification
      alert('Error updating profile')
    } finally {
      setSaving(false)
    }
  }

  const handleProceedToRating = () => {
    if (!selectedCountry) return
    setModalStep('rating')
  }

  const handleAddLocation = async () => {
    if (!selectedCountry || !user) return
    
    setSaving(true)
    try {
      const { error } = await supabase
        .from('user_locations')
        .insert({
          user_id: user.id,
          country_id: parseInt(selectedCountry),
          city_id: selectedCity ? parseInt(selectedCity) : null,
          type: locationType,
          visit_date: visitDate || null,
          transportation_rating: ratings.transportation || null,
          accommodation_rating: ratings.accommodation || null,
          food_rating: ratings.food || null,
          safety_rating: ratings.safety || null,
          activities_rating: ratings.activities || null,
          value_rating: ratings.value || null,
          overall_rating: ratings.overall || null,
          comment: ratings.comment || null
        })
      
      if (!error) {
        const { data: locationsData } = await supabase
          .from('user_locations')
          .select(`
            *,
            country:countries(*),
            city:cities(*)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
        
        if (locationsData) setUserLocations(locationsData as UserLocation[])
        
        // Reset all forms
        setShowAddModal(false)
        setModalStep('location')
        setSelectedCountry('')
        setSelectedCity('')
        setVisitDate('')
        setRatings({
          transportation: 0,
          accommodation: 0,
          food: 0,
          safety: 0,
          activities: 0,
          value: 0,
          overall: 0,
          comment: ''
        })
      }
    } catch (error) {
      console.error('Error adding location:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveLocation = async (locationId: string) => {
    try {
      const { error } = await supabase
        .from('user_locations')
        .delete()
        .eq('id', locationId)
      
      if (!error) {
        setUserLocations(prev => prev.filter(loc => loc.id !== locationId))
      }
    } catch (error) {
      console.error('Error removing location:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <>
      <Navigation user={user} onSignOut={handleSignOut} />
      <main className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-8">
          <div className="animate-fade-in">
            {/* Profile Header - Minimalist Style */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-6">
              <div className="p-8">
                <div className="flex flex-col items-center text-center">
                  {/* Profile Picture */}
                  <div className="relative mb-6">
                    <Avatar className="w-28 h-28 shadow-lg">
                      <AvatarImage 
                        src={profile?.avatar_url || undefined} 
                        alt={profile?.username}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-3xl font-bold">
                        {profile?.username?.charAt(0).toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center shadow-lg cursor-pointer transition-colors">
                      <Camera className="w-4 h-4 text-white" />
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </label>
                  </div>
                  
                  {/* Profile Info */}
                  <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                      {profile?.full_name || profile?.username || 'Your Profile'}
                    </h1>
                
                    {profile?.full_name && (
                      <p className="text-gray-500 dark:text-gray-400 mb-3">
                        @{profile?.username}
                      </p>
                    )}
                    
                    {profile?.bio && (
                      <p className="text-gray-700 dark:text-gray-300 mb-4 max-w-md">
                        {profile.bio}
                      </p>
                    )}
                    
                    {/* Travel Stats */}
                    <div className="flex items-center justify-center space-x-8 text-gray-600 dark:text-gray-400">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {userLocations.filter((l, i, arr) => arr.findIndex(x => x.country_id === l.country_id) === i).length}
                        </div>
                        <div className="text-sm flex items-center gap-1">
                          <Globe2 className="w-4 h-4" />
                          Countries
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {userLocations.length}
                        </div>
                        <div className="text-sm flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          Places
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {userLocations.filter(l => l.overall_rating).length}
                        </div>
                        <div className="text-sm flex items-center gap-1">
                          <Star className="w-4 h-4" />
                          Reviews
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-wrap justify-center gap-3">
                    <button
                      onClick={() => setShowEditProfile(true)}
                      className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit Profile
                    </button>
                    <button
                      onClick={handleShare}
                      className="flex items-center gap-2 px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <Share2 className="w-4 h-4" />
                      Share
                    </button>
                    {profile?.username && (
                      <a
                        href={`/${profile.username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View Public
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Edit Profile Modal - Facebook Style */}
            {showEditProfile && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Profile</h2>
                      <button
                        onClick={() => setShowEditProfile(false)}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-6">
                    {/* Avatar Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Profile Photo
                      </label>
                      
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="relative">
                          {editAvatarUrl ? (
                            <img 
                              src={editAvatarUrl} 
                              alt="Avatar preview"
                              className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                              {editFullName?.charAt(0) || profile?.username?.charAt(0) || '?'}
                            </div>
                          )}
                          {uploading && (
                            <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                              <div className="spinner"></div>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                            id="avatar-upload"
                            disabled={uploading}
                          />
                          <label
                            htmlFor="avatar-upload"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 font-medium transition-colors cursor-pointer"
                          >
                            <Upload className="w-4 h-4" />
                            {uploading ? 'Uploading...' : 'Upload Photo'}
                          </label>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            JPG, PNG or GIF (max 1MB)
                          </p>
                        </div>
                      </div>

                      <div className="relative mb-4">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">or use URL</span>
                        </div>
                      </div>
                      
                      <input
                        type="url"
                        value={avatarFile ? '' : editAvatarUrl}
                        onChange={(e) => {
                          setAvatarFile(null)
                          setEditAvatarUrl(e.target.value)
                        }}
                        disabled={!!avatarFile}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="https://example.com/your-photo.jpg"
                      />
                    </div>

                    {/* Full Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={editFullName}
                        onChange={(e) => setEditFullName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Your full name"
                        maxLength={100}
                      />
                    </div>

                    {/* Bio */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Bio
                      </label>
                      <textarea
                        value={editBio}
                        onChange={(e) => setEditBio(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        placeholder="Tell others about your travel passion..."
                        maxLength={500}
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {editBio.length}/500 characters
                      </p>
                    </div>

                  </div>
                  
                  {/* Footer Buttons */}
                  <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 rounded-b-lg">
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setShowEditProfile(false)}
                        className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 font-medium transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleUpdateProfile}
                        disabled={saving}
                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md font-medium transition-colors flex items-center justify-center"
                      >
                        {saving ? (
                          <span className="flex items-center">
                            <div className="spinner mr-2"></div>
                            Saving...
                          </span>
                        ) : (
                          <span className="flex items-center">
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Travel Section - Facebook Style */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    Travel Experiences
                  </h2>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Experience
                  </button>
                </div>
                
                {/* Facebook-style Tabs */}
                <div className="flex gap-1">
                  <button
                    onClick={() => setActiveTab('countries')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      activeTab === 'countries'
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Globe2 className="w-4 h-4" />
                      Countries
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('timeline')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      activeTab === 'timeline'
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Timeline
                    </div>
                  </button>
                </div>
              </div>
              <div className="p-6">
                {/* Tab Content */}
                {userLocations.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MapPin className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      No travel experiences yet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      Start sharing your travel journey with the world!
                    </p>
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add Your First Experience
                    </button>
                  </div>
                ) : activeTab === 'countries' ? (
                  /* Countries Tab - Facebook Card Style */
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                          className="bg-white dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 cursor-pointer transition-all hover:shadow-md hover:scale-105 group"
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
                      <div key={location.id} className="bg-white dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow">
                        <div className="p-4">
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
                                      : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
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
                            <button
                              onClick={() => handleRemoveLocation(location.id)}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Country Details Modal - Facebook Style */}
            {showCountryModal && selectedCountryData && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                  <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
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
                        className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 font-medium transition-colors text-sm"
                        onClick={() => setShowCountryModal(false)}
                      >
                        <ExternalLink className="w-4 h-4" />
                        Ülke Sayfası
                      </Link>
                      <button
                        onClick={() => setShowCountryModal(false)}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    {selectedCountryData.locations.map(location => (
                      <div key={location.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                        <div className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              <span className={`text-xs px-3 py-1 rounded-full shrink-0 mt-1 ${
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
                            <button
                              onClick={() => {
                                handleRemoveLocation(location.id)
                                // Refresh selected country data
                                const updatedLocations = selectedCountryData.locations.filter(l => l.id !== location.id)
                                if (updatedLocations.length === 0) {
                                  setShowCountryModal(false)
                                } else {
                                  setSelectedCountryData({...selectedCountryData, locations: updatedLocations})
                                }
                              }}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Add Location Modal - Facebook Style */}
            {showAddModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {modalStep === 'location' ? 'Add New Location' : 'Rate Your Experience'}
                      </h2>
                      <button
                        onClick={() => {
                          setShowAddModal(false)
                          setModalStep('location')
                          setSelectedCountry('')
                          setSelectedCity('')
                          setVisitDate('')
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    {modalStep === 'rating' && (
                      <p className="text-gray-600 dark:text-gray-400 mt-2">
                        {countries.find(c => c.id === parseInt(selectedCountry))?.flag} {countries.find(c => c.id === parseInt(selectedCountry))?.name}
                        {selectedCity && (
                          <span> - {cities.find(c => c.id === parseInt(selectedCity))?.name}</span>
                        )}
                      </p>
                    )}
                  </div>
                  
                  <div className="p-6 space-y-6">
                    {modalStep === 'location' ? (
                      // Location Selection Step
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Type</label>
                          <select
                            value={locationType}
                            onChange={(e) => setLocationType(e.target.value as 'lived' | 'visited')}
                            className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="visited">✈️ Visited</option>
                            <option value="lived">🏠 Lived</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Country</label>
                          <select
                            value={selectedCountry}
                            onChange={(e) => setSelectedCountry(e.target.value)}
                            className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Select country</option>
                            {countries.map(country => (
                              <option key={country.id} value={country.id}>
                                {country.flag} {country.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">City (Optional)</label>
                          <select
                            value={selectedCity}
                            onChange={(e) => setSelectedCity(e.target.value)}
                            disabled={!selectedCountry}
                            className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                          >
                            <option value="">Select city</option>
                            {cities.map(city => (
                              <option key={city.id} value={city.id}>
                                {city.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Visit Date (Optional)</label>
                          <input
                            type="date"
                            value={visitDate}
                            onChange={(e) => setVisitDate(e.target.value)}
                            className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        
                      </div>
                    ) : (
                      // Rating Step
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Transportation</label>
                        <StarRating
                          value={ratings.transportation}
                          onChange={(value) => setRatings(prev => ({...prev, transportation: value}))}
                          size="lg"
                        />
                      </div>
                      
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Accommodation</label>
                        <StarRating
                          value={ratings.accommodation}
                          onChange={(value) => setRatings(prev => ({...prev, accommodation: value}))}
                          size="lg"
                        />
                      </div>
                      
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Food & Dining</label>
                        <StarRating
                          value={ratings.food}
                          onChange={(value) => setRatings(prev => ({...prev, food: value}))}
                          size="lg"
                        />
                      </div>
                      
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Safety</label>
                        <StarRating
                          value={ratings.safety}
                          onChange={(value) => setRatings(prev => ({...prev, safety: value}))}
                          size="lg"
                        />
                      </div>
                      
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Activities & Attractions</label>
                        <StarRating
                          value={ratings.activities}
                          onChange={(value) => setRatings(prev => ({...prev, activities: value}))}
                          size="lg"
                        />
                      </div>
                      
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Value for Money</label>
                        <StarRating
                          value={ratings.value}
                          onChange={(value) => setRatings(prev => ({...prev, value: value}))}
                          size="lg"
                        />
                          </div>
                        </div>
                        
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Overall Rating</label>
                      <StarRating
                        value={ratings.overall}
                        onChange={(value) => setRatings(prev => ({...prev, overall: value}))}
                        size="lg"
                      />
                        </div>
                        
                        <div>
                          <label htmlFor="comment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            Your Experience (Optional)
                          </label>
                          <textarea
                            id="comment"
                            value={ratings.comment}
                            onChange={(e) => setRatings(prev => ({...prev, comment: e.target.value}))}
                            placeholder="Share your thoughts about this destination..."
                            rows={4}
                            maxLength={500}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                          />
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {ratings.comment.length}/500 characters
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Footer Buttons */}
                  <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 rounded-b-lg">
                    <div className="flex gap-3">
                      {modalStep === 'location' ? (
                        <>
                          <button
                            onClick={() => {
                              setShowAddModal(false)
                              setModalStep('location')
                              setSelectedCountry('')
                              setSelectedCity('')
                              setVisitDate('')
                            }}
                            className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 font-medium transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleProceedToRating}
                            disabled={!selectedCountry}
                            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md font-medium transition-colors"
                          >
                            Continue to Rating
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setModalStep('location')}
                            className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 font-medium transition-colors"
                          >
                            Back
                          </button>
                          <button
                            onClick={handleAddLocation}
                            disabled={saving}
                            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md font-medium transition-colors flex items-center justify-center"
                          >
                            {saving ? (
                              <span className="flex items-center">
                                <div className="spinner mr-2"></div>
                                Adding...
                              </span>
                            ) : (
                              'Add Location'
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  )
}