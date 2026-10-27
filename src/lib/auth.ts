import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { addLoginLog, logClientSignIn } from './storage'

export interface AuthUser {
  id: string
  name: string
  email: string
  provider: 'google' | 'email'
  initials: string
  joined: string
  picture?: string
}

export interface StoredUser extends AuthUser {
  passwordHash?: string
  salt?: string
}

const USERS_KEY = 'bt_users'
const SESSION_KEY = 'bt_session'
const AUTH_EVENT = 'bt_auth_change'

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]!.toUpperCase())
    .join('') || 'U'
}

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.error('Failed to save to localStorage:', e)
  }
}

export function loadUsers(): StoredUser[] {
  return load<StoredUser[]>(USERS_KEY, [])
}

export function saveUsers(users: StoredUser[]) {
  save(USERS_KEY, users)
}

export async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export function randomSalt(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  return sha256Hex(`${salt}:${password}`)
}

function notifyAuthChange(user: AuthUser | null) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(AUTH_EVENT, { detail: user }))
  }
}

export function getSession(): AuthUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

export function setSession(user: AuthUser, remember = true) {
  const json = JSON.stringify(user)
  if (remember) {
    localStorage.setItem(SESSION_KEY, json)
  } else {
    sessionStorage.setItem(SESSION_KEY, json)
  }
  notifyAuthChange(user)
}

export async function recordLogin(user: AuthUser): Promise<void> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 2000)
    const ipRes = await fetch('https://api.ipify.org?format=json', { signal: controller.signal }).catch(() => null)
    clearTimeout(timer)
    const ipData = ipRes ? await ipRes.json() : { ip: '127.0.0.1' }
    
    addLoginLog({
      name: user.name,
      email: user.email,
      ip_address: ipData.ip || '127.0.0.1',
      device_info: navigator.userAgent,
      login_time: new Date().toISOString(),
    })
  } catch (err) {
    addLoginLog({
      name: user.name,
      email: user.email,
      ip_address: '127.0.0.1',
      device_info: navigator.userAgent,
      login_time: new Date().toISOString(),
    })
  }
  logClientSignIn(user.email, user.name)
}

function mapUser(u: User): AuthUser {
  const meta = u.user_metadata as Record<string, unknown> | undefined
  const identity = u.identities?.[0]?.identity_data as Record<string, unknown> | undefined
  const pick = (keys: string[]): string => {
    for (const k of keys) {
      const v = meta?.[k] ?? identity?.[k]
      if (typeof v === 'string' && v.trim()) return v
    }
    return ''
  }
  const name = pick(['full_name', 'name', 'display_name']) || u.email?.split('@')[0] || 'User'
  const isGoogle = u.app_metadata?.provider === 'google' || Boolean(identity?.provider === 'google')
  return {
    id: u.id,
    name,
    email: u.email || '',
    provider: isGoogle ? 'google' : 'email',
    initials: initialsOf(name),
    joined: u.created_at
      ? new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    picture: pick(['avatar_url', 'picture', 'avatar']) || undefined,
  }
}

export async function signUp(
  name: string,
  email: string,
  password: string,
  remember = true
): Promise<{ user: AuthUser } | { error: string }> {
  const trimmedName = name.trim()
  const normalizedEmail = email.trim().toLowerCase()

  if (!trimmedName) return { error: 'Please enter your full name.' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return { error: 'Please enter a valid email address.' }
  }
  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters.' }
  }

  const users = loadUsers()
  if (users.some(u => u.email.toLowerCase() === normalizedEmail)) {
    return { error: 'An account with this email already exists. Please sign in.' }
  }

  // Attempt Supabase sign up in background if available
  let supabaseUserId = ''
  try {
    const { data: suData } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: { data: { full_name: trimmedName } },
    })
    if (suData?.user?.id) {
      supabaseUserId = suData.user.id
    }
  } catch {
    // If Supabase is unreachable, proceed with local account
  }

  const salt = randomSalt()
  const passwordHash = await hashPassword(password, salt)
  const id = supabaseUserId || `usr_${Math.random().toString(36).substr(2, 9)}_${Date.now().toString(36)}`

  const newUser: StoredUser = {
    id,
    name: trimmedName,
    email: normalizedEmail,
    provider: 'email',
    initials: initialsOf(trimmedName),
    joined: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    salt,
    passwordHash,
  }

  users.push(newUser)
  saveUsers(users)

  const publicUser: AuthUser = {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    provider: newUser.provider,
    initials: newUser.initials,
    joined: newUser.joined,
  }

  setSession(publicUser, remember)
  void recordLogin(publicUser)
  return { user: publicUser }
}

export async function signIn(
  email: string,
  password: string,
  remember = true
): Promise<{ user: AuthUser } | { error: string }> {
  const normalizedEmail = email.trim().toLowerCase()
  if (!normalizedEmail) return { error: 'Please enter your email address.' }
  if (!password) return { error: 'Please enter your password.' }

  const users = loadUsers()
  const found = users.find(u => u.email.toLowerCase() === normalizedEmail)

  if (found) {
    if (found.passwordHash && found.salt) {
      const match = (await hashPassword(password, found.salt)) === found.passwordHash
      if (!match) {
        return { error: 'Incorrect email or password.' }
      }
    }
    const publicUser: AuthUser = {
      id: found.id,
      name: found.name,
      email: found.email,
      provider: found.provider || 'email',
      initials: found.initials || initialsOf(found.name),
      joined: found.joined || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      picture: found.picture,
    }
    setSession(publicUser, remember)
    void recordLogin(publicUser)
    return { user: publicUser }
  }

  // Fallback: try Supabase
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    })
    if (!error && data?.user) {
      const mapped = mapUser(data.user)
      setSession(mapped, remember)
      void recordLogin(mapped)
      return { user: mapped }
    }
  } catch {
    // Supabase unreachable
  }

  return { error: 'No account found with this email. Please create an account or verify your credentials.' }
}

export function signInWithGoogle(name: string, email: string, picture?: string): { user: AuthUser } {
  const users = loadUsers()
  const normalized = email.trim().toLowerCase()
  let found = users.find(u => u.email.toLowerCase() === normalized)

  if (!found) {
    found = {
      id: `usr_${Math.random().toString(36).substr(2, 9)}_${Date.now().toString(36)}`,
      name: name.trim() || 'Google User',
      email: normalized,
      provider: 'google',
      initials: initialsOf(name.trim() || 'Google User'),
      joined: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      picture,
    }
    users.push(found)
    saveUsers(users)
  } else {
    found.provider = 'google'
    if (picture) found.picture = picture
    saveUsers(users)
  }

  const publicUser: AuthUser = {
    id: found.id,
    name: found.name,
    email: found.email,
    provider: 'google',
    initials: found.initials,
    joined: found.joined,
    picture: found.picture,
  }

  setSession(publicUser, true)
  void recordLogin(publicUser)
  return { user: publicUser }
}

export async function signOut(): Promise<void> {
  localStorage.removeItem(SESSION_KEY)
  sessionStorage.removeItem(SESSION_KEY)
  try {
    await supabase.auth.signOut().catch(() => {})
  } catch {}
  notifyAuthChange(null)
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(() => getSession())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true

    // Check supabase if available
    try {
      supabase.auth.getUser().then(({ data }) => {
        if (!active) return
        if (data?.user) {
          const mapped = mapUser(data.user)
          setUser(mapped)
          setSession(mapped, true)
        }
      }).catch(() => {
        // Keep local session
      })
    } catch {}

    // Subscribe to supabase auth state changes
    let unsubscribe = () => {}
    try {
      const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!active) return
        if (session?.user) {
          const mapped = mapUser(session.user)
          setUser(mapped)
          setSession(mapped, true)
          if (event === 'SIGNED_IN') {
            void recordLogin(mapped)
          }
        }
      })
      unsubscribe = () => sub.subscription.unsubscribe()
    } catch {}

    // Listen to local auth events
    const handleLocalAuth = (e: Event) => {
      if (!active) return
      const custom = e as CustomEvent<AuthUser | null>
      setUser(custom.detail ?? getSession())
    }

    const handleStorage = (e: StorageEvent) => {
      if (!active) return
      if (e.key === SESSION_KEY) {
        setUser(getSession())
      }
    }

    window.addEventListener(AUTH_EVENT, handleLocalAuth)
    window.addEventListener('storage', handleStorage)

    return () => {
      active = false
      unsubscribe()
      window.removeEventListener(AUTH_EVENT, handleLocalAuth)
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  return { user, loading }
}
