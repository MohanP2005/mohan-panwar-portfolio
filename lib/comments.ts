// lib/comments.ts

/** Base fields required for comment objects */
type BaseComment = {
  id: string
  parent_id: string | null
  created_at: string
}

/** Comment with arbitrary extra fields – callers should extend BaseComment */
export type Comment = BaseComment & { [key: string]: unknown }

/** Threaded comment adds a replies array */
export type Threaded<T extends BaseComment> = T & { replies: T[] }

/**
 * Build a tree of comments where each reply is attached to its top‑level ancestor.
 * - Top‑level comments (parent_id === null) are sorted newest‑first.
 * - Replies are sorted oldest‑first.
 * - Orphaned or cyclic comments are omitted.
 */
export function buildCommentTree<T extends BaseComment>(flat: T[]): Threaded<T>[] {
  const map = new Map<string, Threaded<T>>()
  // clone each comment and give it an empty replies array
  for (const c of flat) {
    map.set(c.id, { ...c, replies: [] })
  }

  const topLevelIds = new Set<string>()
  const attached = new Set<string>()

  // helper to find the top‑level ancestor of a comment id
  const findTopAncestor = (startId: string): Threaded<T> | null => {
    const visited = new Set<string>()
    let curId: string | null = startId

    while (curId !== null) {
      if (visited.has(curId)) return null // cycle
      visited.add(curId)

      const node = map.get(curId)
      if (!node) return null // missing parent

      if (node.parent_id === null) return node // top‑level found
      curId = node.parent_id
    }
    return null
  }

  // attach non‑top‑level comments to their top‑level ancestor
  for (const c of flat) {
    if (c.parent_id === null) {
      topLevelIds.add(c.id)
      continue
    }
    const top = findTopAncestor(c.id)
    if (!top) continue // orphan or cycle
    const child = map.get(c.id)
    if (child) {
      top.replies.push(child)
      attached.add(c.id)
    }
  }

  // collect top‑level nodes (must be present in the map)
  const result: Threaded<T>[] = []
  for (const id of topLevelIds) {
    const node = map.get(id)
    if (node) {
      // sort this node's replies oldest‑first
      node.replies.sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at))
      result.push(node)
    }
  }

  // sort top‑level nodes newest‑first
  result.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
  return result
}

/**
 * Human‑readable relative time string.
 * Future dates are treated as “just now”.
 */
export function relativeTime(iso: string, now: number = Date.now()): string {
  const diffSec = (now - Date.parse(iso)) / 1000
  if (diffSec < 60) return 'just now'
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`
  if (diffSec < 7 * 86400) return `${Math.floor(diffSec / 86400)}d ago`
  if (diffSec < 30 * 86400) return `${Math.floor(diffSec / (7 * 86400))}w ago`
  return new Date(iso).toISOString().slice(0, 10)
}

/**
 * Count comments that are not deleted.
 * A comment is considered deleted when `deleted_at` is a non‑null string.
 */
export function countComments(flat: { deleted_at?: string | null }[]): number {
  let cnt = 0
  for (const c of flat) {
    if (c.deleted_at == null) cnt++
  }
  return cnt
}
