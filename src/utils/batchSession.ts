/** A main-window batch that can be opened again after a quit or a crash. */
export type BatchSessionItem = {
  path: string
  relativeDir: string
  presetId: string | null
  status: 'pending' | 'done' | 'failed'
}

export type BatchSession = {
  version: 1
  items: BatchSessionItem[]
}

const SESSION_VERSION = 1

/** Absolute paths only. A stored list must not be able to name a relative path. */
export function isSafeMediaPath(path: string) {
  if (!path || path.includes('\0') || path.includes('\n')) return false
  return (
    path.startsWith('/') ||
    /^[A-Za-z]:[\\/]/.test(path) ||
    path.startsWith('\\\\')
  )
}

export function normalizeBatchSession(value: unknown): BatchSession | null {
  if (!value || typeof value !== 'object') return null
  const record = value as { version?: unknown; items?: unknown }
  if (record.version !== SESSION_VERSION || !Array.isArray(record.items)) {
    return null
  }
  const items: BatchSessionItem[] = []
  for (const item of record.items) {
    if (!item || typeof item !== 'object') continue
    const entry = item as Partial<BatchSessionItem>
    if (typeof entry.path !== 'string' || !isSafeMediaPath(entry.path)) continue
    if (
      entry.status !== 'pending' &&
      entry.status !== 'done' &&
      entry.status !== 'failed'
    ) {
      continue
    }
    items.push({
      path: entry.path,
      relativeDir:
        typeof entry.relativeDir === 'string' ? entry.relativeDir : '',
      presetId: typeof entry.presetId === 'string' ? entry.presetId : null,
      status: entry.status,
    })
  }
  if (items.length === 0) return null
  return { version: SESSION_VERSION, items }
}

/** Files that still need to be compressed. */
export function unfinishedBatchItems(session: BatchSession | null) {
  return (session?.items ?? []).filter((item) => item.status !== 'done')
}

const STORAGE_KEY = 'batchSession'

export function readStoredBatchSession(): BatchSession | null {
  try {
    return normalizeBatchSession(
      JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null'),
    )
  } catch {
    return null
  }
}

export function writeStoredBatchSession(session: BatchSession | null) {
  if (!session || unfinishedBatchItems(session).length === 0) {
    localStorage.removeItem(STORAGE_KEY)
    return
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export function beginStoredBatchSession(items: BatchSessionItem[]) {
  writeStoredBatchSession(
    normalizeBatchSession({
      version: 1,
      items: items.filter((item) => isSafeMediaPath(item.path)),
    }),
  )
}

export function markStoredBatchItem(
  path: string | null | undefined,
  status: BatchSessionItem['status'],
) {
  if (!path) return
  const session = readStoredBatchSession()
  if (!session) return
  writeStoredBatchSession(markBatchItem(session, path, status))
}

export function clearStoredBatchSession() {
  localStorage.removeItem(STORAGE_KEY)
}

export function markBatchItem(
  session: BatchSession,
  path: string,
  status: BatchSessionItem['status'],
): BatchSession {
  return {
    ...session,
    items: session.items.map((item) =>
      item.path === path ? { ...item, status } : item,
    ),
  }
}

/**
 * Drop-queue jobs that were compressing when the app stopped go back to
 * waiting. Their partial output is forgotten, not deleted (a stored path is
 * not trusted enough to remove a file).
 */
export type PersistedQueueStatus =
  | 'waiting'
  | 'compressing'
  | 'done'
  | 'failed'
  | 'cancelled'

export type PersistedQueueItem = {
  path: string
  status: PersistedQueueStatus
  progress: number
  outputPath: string | null
}

export function resumeQueueItems<T extends PersistedQueueItem>(
  items: T[],
): T[] {
  return items
    .filter((item) => isSafeMediaPath(item.path))
    .map((item) =>
      item.status === 'compressing'
        ? { ...item, status: 'waiting' as const, progress: 0, outputPath: null }
        : item,
    )
}
