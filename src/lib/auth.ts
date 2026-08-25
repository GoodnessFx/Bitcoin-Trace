import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { addLoginLog } from './storage'

export interface AuthUser {
  id: string
  name: string
  email: string
  provider: 'google'
  initials: string
  joined: string
  picture?: string
}

function initialsOf(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]!.toUpperCase()).join('')
}

function mapUser(u: User): AuthUser {
  const meta = u.user_metadata as Record<string, unknown> | undefined
  const identity = u.identities?.[0]?.identity_data as Record<string, unknown> | undefined
  console.log('[auth] user_metadata', meta)
  console.log('[auth] identity_data', identity)
  const pick = (keys: string[]): string => {
    for (const k of keys) {
      const v = meta?.[k] ?? identity?.[k]
      if (typeof v === 'string' && v.trim()) return v
    }
    return ''
  }
  const name = pick(['full_name', 'name', 'display_name']) || u.email?.split('@')[0] || 'Google User'
  return {
    id: u.id,
    name,
    email: u.email || '',
    provider: 'google',
    initials: initialsOf(name),
    joined: u.created_at
      ? new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : '',
    picture: pick(['avatar_url', 'picture', 'avatar']) || undefined,
  }
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return
      setUser(data.user ? mapUser(data.user) : null)
      setLoading(false)
    }).catch(() => {
      if (!active) return
      setUser(null)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!active) return
      setUser(session ? mapUser(session.user) : null)
      
      if (event === 'SIGNED_IN' && session) {
        try {
          const userObj = mapUser(session.user)
          // Fetch IP address from a free public API
          const ipRes = await fetch('https://api.ipify.org?format=json').catch(() => null)
          const ipData = ipRes ? await ipRes.json() : { ip: 'Unknown' }
          
          addLoginLog({
            name: userObj.name,
            email: userObj.email,
            ip_address: ipData.ip,
            device_info: navigator.userAgent,
            login_time: new Date().toISOString()
          })
        } catch (err) {
          console.error('Failed to log login event:', err)
        }
      }

      setLoading(false)
    })
    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  return { user, loading }
}

export async function signOut() {
  await supabase.auth.signOut()
}
