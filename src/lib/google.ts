import { GOOGLE_CLIENT_ID } from '../config'

export interface GoogleProfile {
  sub: string
  name: string
  email: string
  picture?: string
}

type GoogleCallback = (profile: GoogleProfile) => void

let loaded: Promise<boolean> | null = null

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (resp: { credential?: string }) => void }) => void
          renderButton: (el: HTMLElement, opts: Record<string, unknown>) => void
          prompt: (opts?: { oneTapEnabled?: boolean }) => void
          cancel: () => void
          disableAutoSelect: () => void
        }
      }
    }
  }
}

function loadGoogleScript(): Promise<boolean> {
  if (typeof window !== 'undefined' && window.google?.accounts?.id) return Promise.resolve(true)
  if (loaded) return loaded
  loaded = new Promise(resolve => {
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://accounts.google.com/gsi/client"]')
    if (existing) {
      existing.addEventListener('load', () => resolve(true))
      existing.addEventListener('error', () => resolve(false))
      return
    }
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.async = true
    s.defer = true
    s.onload = () => resolve(true)
    s.onerror = () => resolve(false)
    document.head.appendChild(s)
  })
  return loaded
}

export function hasGoogleClientId(): boolean {
  return Boolean(GOOGLE_CLIENT_ID.trim())
}

function decodeJwt(token: string): GoogleProfile | null {
  try {
    const payload = token.split('.')[1]
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
    const json = decodeURIComponent(
      atob(padded)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    const data = JSON.parse(json)
    return { sub: data.sub, name: data.name || '', email: data.email || '', picture: data.picture }
  } catch {
    return null
  }
}

export async function initGoogleAuth(callback: GoogleCallback): Promise<boolean> {
  if (!hasGoogleClientId()) return false
  const ok = await loadGoogleScript()
  if (!ok || !window.google?.accounts?.id) return false
  window.google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: resp => {
      if (!resp.credential) return
      const profile = decodeJwt(resp.credential)
      if (profile && profile.email) callback(profile)
    },
  })
  return true
}

export function renderGoogleButton(el: HTMLElement, callback: GoogleCallback): boolean {
  if (!window.google?.accounts?.id) return false
  window.google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: resp => {
      if (!resp.credential) return
      const profile = decodeJwt(resp.credential)
      if (profile && profile.email) callback(profile)
    },
  })
  window.google.accounts.id.renderButton(el, {
    theme: 'outline',
    size: 'large',
    shape: 'rectangular',
    type: 'standard',
    text: 'continue_with',
  })
  return true
}

export function promptGoogleOneTap(): boolean {
  if (!window.google?.accounts?.id) return false
  window.google.accounts.id.prompt({ oneTapEnabled: true })
  return true
}
