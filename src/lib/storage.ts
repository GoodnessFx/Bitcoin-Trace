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
  online?: boolean
}

const SIGNINS_KEY = `${PREFIX}_client_signins`

const EXCLUDED_SIGNIN_EMAILS = ['goodnessiyamah1@gmail.com']

export function isHiddenClientEmail(email: string): boolean {
  return EXCLUDED_SIGNIN_EMAILS.includes(email.toLowerCase())
}

export function getClientSignIns(): ClientSignIn[] {
  try {
    const raw = localStorage.getItem(SIGNINS_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return (Array.isArray(parsed) ? (parsed as ClientSignIn[]) : []).filter(s => !isHiddenClientEmail(s.email))
  } catch {
    return []
  }
}

export function logClientSignIn(email: string, name: string): void {
  if (!email || isHiddenClientEmail(email)) return
  const entry: ClientSignIn = { email, name: name || email, lastSignIn: new Date().toLocaleString() }
  localStorage.setItem(SIGNINS_KEY, JSON.stringify([entry, ...getClientSignIns().filter(s => s.email.toLowerCase() !== email.toLowerCase())]))
}

export interface LoginLogEntry {
  id: string
  name: string
  email: string
  ip_address: string
  device_info: string
  login_time: string
}

const LOGIN_LOGS_KEY = `${PREFIX}_login_logs`

export function getLoginLogs(): LoginLogEntry[] {
  try {
    const raw = localStorage.getItem(LOGIN_LOGS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function addLoginLog(log: Omit<LoginLogEntry, 'id'>): void {
  const logs = getLoginLogs()
  const newLog: LoginLogEntry = { ...log, id: Math.random().toString(36).substr(2, 9) }
  localStorage.setItem(LOGIN_LOGS_KEY, JSON.stringify([newLog, ...logs].slice(0, 500))) // Keep last 500
}
