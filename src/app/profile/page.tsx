'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ProfileRedirect() {
  const router = useRouter()

  useEffect(() => {
    const redirectToUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/discover')
        return
      }

      // Get user's profile to find username
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single()

      if (profile?.username) {
        router.push(`/${profile.username}`)
      } else {
        router.push('/discover')
      }
    }

    redirectToUserProfile()
  }, [router])

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="spinner"></div>
    </div>
  )
}