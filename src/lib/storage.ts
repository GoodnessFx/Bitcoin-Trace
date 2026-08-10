const PREFIX = 'cwt'

function key(kind: string, userId: string): string {
  return `${PREFIX}_${kind}_${userId}`
}

export function loadList<T>(kind: string, userId: string): T[] {
  try {
    const raw = localStorage.getItem(key(kind, userId))
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as T[]) : []
  } catch {
    return []
  }
}

export function saveList<T>(kind: string, userId: string, items: T[]): void {
  localStorage.setItem(key(kind, userId), JSON.stringify(items))
}

export interface ClientSignIn {
  email: string
  name: string
  lastSignIn: string
}

const SIGNINS_KEY = `${PREFIX}_client_signins`

const EXCLUDED_SIGNIN_EMAILS = ['goodnessiyamah1@gmail.com']

export function getClientSignIns(): ClientSignIn[] {
  try {
    const raw = localStorage.getItem(SIGNINS_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return (Array.isArray(parsed) ? (parsed as ClientSignIn[]) : []).filter(s => !EXCLUDED_SIGNIN_EMAILS.includes(s.email.toLowerCase()))
  } catch {
    return []
  }
}

export function logClientSignIn(email: string, name: string): void {
  if (!email) return
  const entry: ClientSignIn = { email, name: name || email, lastSignIn: new Date().toLocaleString() }
  localStorage.setItem(SIGNINS_KEY, JSON.stringify([entry, ...getClientSignIns().filter(s => s.email !== email)]))
}
