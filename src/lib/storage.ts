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
