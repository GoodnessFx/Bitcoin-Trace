import type { AuthUser } from './auth'
import { isHiddenClientEmail, logClientSignIn, type ClientSignIn } from './storage'
import { supabase } from './supabase'

const CHANNEL = 'cwt-live-clients'
const ONLINE_MS = 25_000

export interface LiveClient extends ClientSignIn {
  online: boolean
}

type Heartbeat = {
  id: string
  email: string
  name: string
  signedInAt: string
  lastSeen: string
}

function flattenPresence(state: Record<string, unknown[]>): Heartbeat[] {
  const out: Heartbeat[] = []
  for (const metas of Object.values(state)) {
    for (const raw of metas) {
      const m = raw as Partial<Heartbeat>
      if (m.email) {
        out.push({
          id: String(m.id || m.email),
          email: String(m.email),
          name: String(m.name || m.email),
          signedInAt: String(m.signedInAt || m.lastSeen || new Date().toISOString()),
          lastSeen: String(m.lastSeen || new Date().toISOString()),
        })
      }
    }
  }
  return out
}

export function startClientPresence(user: AuthUser): () => void {
  if (!user.email || isHiddenClientEmail(user.email)) return () => {}

  logClientSignIn(user.email, user.name)

  const payload = (): Heartbeat => ({
    id: user.id,
    email: user.email,
    name: user.name,
    signedInAt: new Date().toISOString(),
    lastSeen: new Date().toISOString(),
  })

  const channel = supabase.channel(CHANNEL, {
    config: { presence: { key: user.id }, broadcast: { self: false } },
  })

  const send = (event: 'signin' | 'heartbeat') => {
    void channel.send({ type: 'broadcast', event, payload: payload() })
  }

  channel.subscribe((status) => {
    if (status !== 'SUBSCRIBED') return
    void channel.track(payload())
    send('signin')
    send('heartbeat')
  })

  const beat = window.setInterval(() => {
    void channel.track(payload())
    send('heartbeat')
  }, 10_000)

  return () => {
    window.clearInterval(beat)
    void channel.untrack()
    void supabase.removeChannel(channel)
  }
}

export function subscribeLiveClients(onChange: (clients: LiveClient[]) => void): () => void {
  const seen = new Map<string, { client: LiveClient; lastSeenMs: number }>()

  const emit = () => {
    const now = Date.now()
    const list: LiveClient[] = []
    for (const row of seen.values()) {
      list.push({ ...row.client, online: now - row.lastSeenMs < ONLINE_MS })
    }
    list.sort((a, b) => Number(b.online) - Number(a.online))
    onChange(list)
  }

  const upsert = (hb: Heartbeat) => {
    if (!hb.email || isHiddenClientEmail(hb.email)) return
    logClientSignIn(hb.email, hb.name)
    seen.set(hb.email.toLowerCase(), {
      lastSeenMs: Date.now(),
      client: {
        email: hb.email,
        name: hb.name || hb.email,
        lastSignIn: new Date(hb.signedInAt || hb.lastSeen).toLocaleString(),
        online: true,
      },
    })
  }

  const channel = supabase.channel(CHANNEL, {
    config: { broadcast: { self: false } },
  })

  channel.on('presence', { event: 'sync' }, () => {
    for (const hb of flattenPresence(channel.presenceState() as Record<string, unknown[]>)) {
      upsert(hb)
    }
    emit()
  })

  channel.on('broadcast', { event: 'signin' }, ({ payload }) => {
    upsert(payload as Heartbeat)
    emit()
  })

  channel.on('broadcast', { event: 'heartbeat' }, ({ payload }) => {
    upsert(payload as Heartbeat)
    emit()
  })

  channel.subscribe()

  const prune = window.setInterval(emit, 5_000)

  return () => {
    window.clearInterval(prune)
    void supabase.removeChannel(channel)
  }
}
