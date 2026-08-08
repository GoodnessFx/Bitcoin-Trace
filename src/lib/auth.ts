export interface AuthUser {
  name: string
  email: string
  provider: 'email' | 'google'
  initials: string
  joined: string
  picture?: string
}

interface StoredUser extends AuthUser {
  passwordHash?: string
  salt?: string
}

const USERS_KEY = 'bt_users'
const SESSION_KEY = 'bt_session'
const FAILURES_KEY = 'bt_login_failures'

const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 5 * 60 * 1000

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function save(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

function loadUsers(): StoredUser[] {
  return load<StoredUser[]>(USERS_KEY, [])
}

function saveUsers(users: StoredUser[]) {
  save(USERS_KEY, users)
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]!.toUpperCase())
    .join('')
}

function randomSalt(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function hashPassword(password: string, salt: string): Promise<string> {
  return sha256Hex(`${salt}:${password}`)
}

function toPublic(u: StoredUser): AuthUser {
  const { passwordHash: _ph, salt: _salt, ...pub } = u
  return pub
}

export function getSession(): AuthUser | null {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null')
  } catch {
    return null
  }
}

export async function signUp(name: string, email: string, password: string): Promise<{ user: AuthUser } | { error: string }> {
  const users = loadUsers()
  const normalized = email.trim().toLowerCase()
  if (!name.trim()) return { error: 'Please enter your full name.' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) return { error: 'Please enter a valid email address.' }
  if (password.length < 8) return { error: 'Password must be at least 8 characters.' }
  if (users.some(u => u.email === normalized)) return { error: 'An account with this email already exists. Sign in instead.' }
  const salt = randomSalt()
  const user: StoredUser = {
    name: name.trim(),
    email: normalized,
    provider: 'email',
    initials: initialsOf(name),
    joined: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    salt,
    passwordHash: await hashPassword(password, salt),
  }
  users.push(user)
  saveUsers(users)
  localStorage.setItem(SESSION_KEY, JSON.stringify(toPublic(user)))
  return { user: toPublic(user) }
}

export async function signIn(email: string, password: string): Promise<{ user: AuthUser } | { error: string }> {
  const normalized = email.trim().toLowerCase()
  const failures = load<Record<string, { count: number; lockedUntil: number }>>(FAILURES_KEY, {})
  const f = failures[normalized]
  if (f && f.lockedUntil > Date.now()) {
    const mins = Math.ceil((f.lockedUntil - Date.now()) / 60000)
    return { error: `Too many failed attempts. Try again in ${mins} minute${mins === 1 ? '' : 's'}.` }
  }

  const users = loadUsers()
  const found = users.find(u => u.email === normalized)

  let match = false
  if (found) {
    if (found.passwordHash && found.salt) {
      match = (await hashPassword(password, found.salt)) === found.passwordHash
    }
  }

  if (!match) {
    const count = (f?.count ?? 0) + 1
    if (count >= MAX_ATTEMPTS) {
      failures[normalized] = { count: 0, lockedUntil: Date.now() + LOCKOUT_MS }
      save(FAILURES_KEY, failures)
      return { error: `Too many failed attempts. Try again in ${LOCKOUT_MS / 60000} minutes.` }
    }
    failures[normalized] = { count, lockedUntil: 0 }
    save(FAILURES_KEY, failures)
    return { error: 'Incorrect email or password.' }
  }

  if (!found) {
    return { error: 'Incorrect email or password.' }
  }

  delete failures[normalized]
  save(FAILURES_KEY, failures)
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
