import type { Comment } from './types'

export type CommentThreadMeta = {
  ancestorIds: string[]
  descendantCount: number
  maxSubtreeDepth: number
  replyCount: number
}

export type CommentThreadIndex = {
  childrenByParent: Record<string, Comment[]>
  metaById: Record<string, CommentThreadMeta>
}

export type CollapsedComments = Record<string, boolean>

const ROOT_COMMENT_KEY = '__root__'

export function getCommentParentKey(parentId: string | null) {
  return parentId ?? ROOT_COMMENT_KEY
}

export function formatReplyLabel(count: number) {
  return `${count} repl${count === 1 ? 'y' : 'ies'}`
}

export function getThreadToggleLabel(isCollapsed: boolean) {
  return isCollapsed ? 'Continue thread' : 'Hide thread'
}

export function getReplyRegionId(commentId: string) {
  return `feed-comment-replies-${commentId}`
}

export function buildCommentThreadIndex(comments: Comment[]): CommentThreadIndex {
  const childrenByParent: Record<string, Comment[]> = {}

  comments.forEach((comment) => {
    const parentKey = getCommentParentKey(comment.parent_id)
    childrenByParent[parentKey] ??= []
    childrenByParent[parentKey].push(comment)
  })

  Object.values(childrenByParent).forEach((children) => {
    children.sort(
      (left, right) =>
        new Date(left.created_at).getTime() -
        new Date(right.created_at).getTime()
    )
  })

  const metaById: Record<string, CommentThreadMeta> = {}

  function visitComment(comment: Comment, ancestorIds: string[]): CommentThreadMeta {
    const children = childrenByParent[comment.id] ?? []
    let descendantCount = 0
    let maxSubtreeDepth = 0

    children.forEach((child) => {
      const childMeta = visitComment(child, [...ancestorIds, comment.id])
      descendantCount += 1 + childMeta.descendantCount
      maxSubtreeDepth = Math.max(maxSubtreeDepth, childMeta.maxSubtreeDepth + 1)
    })

    const meta = {
      ancestorIds,
      descendantCount,
      maxSubtreeDepth,
      replyCount: children.length,
    }

    metaById[comment.id] = meta
    return meta
  }

  ;(childrenByParent[ROOT_COMMENT_KEY] ?? []).forEach((comment) => {
    visitComment(comment, [])
  })

  comments.forEach((comment) => {
    metaById[comment.id] ??= {
      ancestorIds: [],
      descendantCount: 0,
      maxSubtreeDepth: 0,
      replyCount: 0,
    }
  })

  return { childrenByParent, metaById }
}

export function collectCommentSubtreeIds(
  comments: Comment[],
  commentId: string
): Set<string> {
  const index = buildCommentThreadIndex(comments)
  const ids = new Set<string>()

  function visit(currentCommentId: string) {
    ids.add(currentCommentId)
    ;(index.childrenByParent[currentCommentId] ?? []).forEach((child) => {
      visit(child.id)
    })
  }

  visit(commentId)
  return ids
}

export function shouldAutoCollapseThread(
  depth: number,
  replyCount: number,
  descendantCount: number
) {
  if (replyCount === 0) {
    return false
  }

  if (depth >= 3) {
    return true
  }

  if (depth === 2 && descendantCount >= 4) {
    return true
  }

  if (depth === 1 && descendantCount >= 6) {
    return true
  }

  return depth === 0 && descendantCount >= 10
}

export function shouldRenderThreadToggle(
  depth: number,
  replyCount: number,
  descendantCount: number,
  maxSubtreeDepth: number,
  isCollapsed: boolean
) {
  if (replyCount === 0) {
    return false
  }

  if (isCollapsed) {
    return true
  }

  const hasBranchingReplies = replyCount >= 2
  const hasLayeredThread = maxSubtreeDepth >= 2

  if (depth >= 2) {
    return hasBranchingReplies || descendantCount >= 3 || hasLayeredThread
  }

  if (depth === 1) {
    return (
      replyCount >= 3 ||
      descendantCount >= 4 ||
      (hasBranchingReplies && descendantCount >= 3) ||
      (hasLayeredThread && descendantCount >= 4)
    )
  }

  if (replyCount >= 3 || descendantCount >= 5) {
    return true
  }

  return (
    (hasBranchingReplies && descendantCount >= 4) ||
    (hasLayeredThread && descendantCount >= 5)
  )
}

function pruneCollapsedComments(
  collapsedById: CollapsedComments,
  comments: Comment[]
) {
  const validCommentIds = new Set(comments.map((comment) => comment.id))
  let changed = false
  const next: CollapsedComments = {}

  Object.entries(collapsedById).forEach(([commentId, isCollapsed]) => {
    if (!validCommentIds.has(commentId)) {
      changed = true
      return
    }

    next[commentId] = isCollapsed
  })

  return changed ? next : collapsedById
}

export function getVisibleCollapsedComments(
  collapsedById: CollapsedComments,
  comments: Comment[],
  replyTargetId: string | null,
  threadIndex: CommentThreadIndex
) {
  const next = { ...pruneCollapsedComments(collapsedById, comments) }

  if (!replyTargetId) {
    return next
  }

  const targetMeta = threadIndex.metaById[replyTargetId]
  if (!targetMeta) {
    return next
  }

  let changed = false
  for (const commentId of [...targetMeta.ancestorIds, replyTargetId]) {
    if (next[commentId] === false) {
      continue
    }

    next[commentId] = false
    changed = true
  }

  return changed ? next : next
}

export function toggleCollapsedComment(
  collapsedById: CollapsedComments,
  commentId: string,
  currentCollapsed: boolean
) {
  const nextValue = !currentCollapsed

  if (collapsedById[commentId] === nextValue) {
    return collapsedById
  }

  return {
    ...collapsedById,
    [commentId]: nextValue,
  }
}
