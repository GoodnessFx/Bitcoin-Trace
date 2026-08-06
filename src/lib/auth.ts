export interface AuthUser {
  name: string
  email: string
  provider: 'email' | 'google'
  initials: string
  joined: string
  picture?: string
}

interface StoredUser extends AuthUser {
  password?: string
}

const USERS_KEY = 'bt_users'
const SESSION_KEY = 'bt_session'

function loadUsers(): StoredUser[] {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]')
  } catch {
    return []
  }
}

function saveUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]!.toUpperCase())
    .join('')
}

export function getSession(): AuthUser | null {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null')
  } catch {
    return null
  }
}

export function signUp(name: string, email: string, password: string): { user: AuthUser } | { error: string } {
  const users = loadUsers()
  const normalized = email.trim().toLowerCase()
  if (!name.trim()) return { error: 'Please enter your full name.' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) return { error: 'Please enter a valid email address.' }
  if (password.length < 6) return { error: 'Password must be at least 6 characters.' }
  if (users.some(u => u.email === normalized)) return { error: 'An account with this email already exists. Sign in instead.' }
  const user: StoredUser = {
    name: name.trim(),
    email: normalized,
    provider: 'email',
    initials: initialsOf(name),
    joined: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    password,
  }
  users.push(user)
  saveUsers(users)
  localStorage.setItem(SESSION_KEY, JSON.stringify(toPublic(user)))
  return { user: toPublic(user) }
}

export function signIn(email: string, password: string): { user: AuthUser } | { error: string } {
  const users = loadUsers()
  const normalized = email.trim().toLowerCase()
  const found = users.find(u => u.email === normalized && u.password === password)
  if (!found) return { error: 'Invalid email or password.' }
  localStorage.setItem(SESSION_KEY, JSON.stringify(toPublic(found)))
  return { user: toPublic(found) }
}

export function signInWithGoogle(name: string, email: string, picture?: string): { user: AuthUser } {
  const users = loadUsers()
  const normalized = email.trim().toLowerCase()
  let found = users.find(u => u.email === normalized)
  if (!found) {
    found = {
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
  localStorage.setItem(SESSION_KEY, JSON.stringify(toPublic(found)))
  return { user: toPublic(found) }
}

export function signOut() {
  localStorage.removeItem(SESSION_KEY)
}

function toPublic(u: StoredUser): AuthUser {
  const { password: _pw, ...pub } = u
  return pub
}
