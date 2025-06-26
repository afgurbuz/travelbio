'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import AuthForm from '@/components/AuthForm'
import { User } from '@supabase/supabase-js'

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: any, session: any) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Welcome to TravelBio
          </h2>
          <p className="text-gray-600 text-lg">
            Share the countries you've lived in and visited with the world
          </p>
        </div>
        <AuthForm />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            Welcome back, {user.email}!
          </h2>
          <button
            onClick={handleSignOut}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
          >
            Sign Out
          </button>
        </div>
        
        <div className="text-center py-12">
          <p className="text-lg mb-6 text-gray-600">
            Ready to share your travel journey?
          </p>
          <button
            onClick={() => window.location.href = '/profile'}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 text-lg"
          >
            Set Up Your Profile
          </button>
        </div>
      </div>
    </div>
  )
}