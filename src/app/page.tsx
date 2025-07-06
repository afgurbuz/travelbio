'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import Link from 'next/link'
import { Globe, MapPin, Users, Star, ArrowRight, Compass, Heart, Camera } from 'lucide-react'

export default function HomePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
      
      // If user is authenticated, redirect to discover
      if (user) {
        router.replace('/discover')
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: any, session: any) => {
        const currentUser = session?.user ?? null
        setUser(currentUser)
        if (currentUser) {
          router.replace('/discover')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [router])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="spinner"></div>
      </div>
    )
  }

  // If user is logged in, they'll be redirected, but show loading until then
  if (user) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-blue-600">TravelBio</span>
            </div>
            
            <div className="flex items-center space-x-3">
              <Link
                href="/auth/signin"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-semibold transition-colors"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-center">
            <div className="lg:col-span-6">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Share your travel experiences with the world
              </h1>
              <p className="mt-6 text-xl text-gray-600 leading-relaxed">
                Connect with fellow travelers, discover new destinations, and create your personal travel story. 
                Rate countries, share experiences, and inspire others to explore.
              </p>
              
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link
                  href="/auth/signup"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors flex items-center justify-center group"
                >
                  Get Started
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/discover"
                  className="bg-white hover:bg-gray-50 text-gray-900 px-8 py-4 rounded-lg font-semibold text-lg border border-gray-300 transition-colors flex items-center justify-center"
                >
                  Explore Travelers
                </Link>
              </div>
            </div>

            <div className="mt-12 lg:mt-0 lg:col-span-6">
              <div className="relative">
                {/* Feature Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl shadow-lg p-6 transform rotate-3 hover:rotate-0 transition-transform">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">Sarah J.</div>
                        <div className="text-sm text-gray-500">25 countries</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    </div>
                    <p className="text-sm text-gray-600 mt-2">"Japan exceeded all expectations!"</p>
                  </div>

                  <div className="bg-white rounded-xl shadow-lg p-6 transform -rotate-2 hover:rotate-0 transition-transform mt-8">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Camera className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">Mike R.</div>
                        <div className="text-sm text-gray-500">18 countries</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <Star className="w-4 h-4 text-gray-300" />
                    </div>
                    <p className="text-sm text-gray-600 mt-2">"Perfect mix of culture and adventure"</p>
                  </div>

                  <div className="bg-white rounded-xl shadow-lg p-6 transform rotate-1 hover:rotate-0 transition-transform">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <Heart className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">Anna K.</div>
                        <div className="text-sm text-gray-500">32 countries</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    </div>
                    <p className="text-sm text-gray-600 mt-2">"Incredible food scene in Thailand!"</p>
                  </div>

                  <div className="bg-white rounded-xl shadow-lg p-6 transform -rotate-1 hover:rotate-0 transition-transform mt-4">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <Compass className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">David L.</div>
                        <div className="text-sm text-gray-500">41 countries</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <Star className="w-4 h-4 text-gray-300" />
                    </div>
                    <p className="text-sm text-gray-600 mt-2">"Morocco's markets are unforgettable"</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Why travelers love TravelBio
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Join thousands of travelers sharing authentic experiences and discovering their next adventure
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Connect with Travelers</h3>
              <p className="text-gray-600">
                Discover fellow travelers, follow their journeys, and get inspired by authentic travel stories from around the world.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Star className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Rate & Review</h3>
              <p className="text-gray-600">
                Share detailed ratings for countries you've visited. Help others discover amazing destinations with your honest reviews.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <MapPin className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Track Your Journey</h3>
              <p className="text-gray-600">
                Build your personal travel timeline, showcase visited countries, and document your adventures for future reference.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600 py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to share your travel story?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join TravelBio today and connect with a community of passionate travelers from around the globe.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="bg-white hover:bg-gray-100 text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg transition-colors flex items-center justify-center"
            >
              Create Your Profile
            </Link>
            <Link
              href="/discover"
              className="bg-blue-700 hover:bg-blue-800 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors flex items-center justify-center border border-blue-500"
            >
              Explore Travelers
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold">TravelBio</span>
            </div>
            
            <div className="flex space-x-6 text-gray-400">
              <Link href="/discover" className="hover:text-white transition-colors">
                Discover
              </Link>
              <Link href="/countries" className="hover:text-white transition-colors">
                Countries
              </Link>
              <Link href="/auth/signin" className="hover:text-white transition-colors">
                Sign In
              </Link>
              <Link href="/auth/signup" className="hover:text-white transition-colors">
                Sign Up
              </Link>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 TravelBio. Share your journey with the world.</p>
          </div>
        </div>
      </footer>
      <script src="https://www.produck.co/api/banner/23fc019f-5555-4d6e-b3e4-0d3e77e13742"></script>
    </div>
  )
}