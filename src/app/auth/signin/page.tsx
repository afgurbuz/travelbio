'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Globe, Mail, Lock, ArrowLeft } from 'lucide-react'

export default function SignInPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) throw error
      
      router.push('/')
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950 px-4">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 mb-8 font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to home
        </Link>

        <div className="card">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-slate-900 dark:bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Globe className="w-6 h-6 text-white dark:text-slate-900" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Welcome back
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Sign in to your account
            </p>
          </div>

          <form onSubmit={handleSignIn} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-lg text-sm border border-red-200 dark:border-red-800">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-10"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-10"
                  placeholder="Enter password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <div className="spinner mr-2"></div>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-600 dark:text-slate-400">
              Don't have an account?{' '}
              <Link href="/auth/signup" className="text-slate-900 dark:text-slate-100 font-medium hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}