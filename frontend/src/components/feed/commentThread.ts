import type { Comment } from './types'

export type CommentThreadStats = {
  descendantCount: number
  maxSubtreeDepth: number
  replyCount: number
}

export type CommentThreadIndex = {
  childrenByParent: Record<string, Comment[]>
  commentsById: Record<string, Comment>
  statsById: Record<string, CommentThreadStats>
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
  const commentsById: Record<string, Comment> = {}

  comments.forEach((comment) => {
    commentsById[comment.id] = comment
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

  const statsById: Record<string, CommentThreadStats> = {}

  function visitComment(comment: Comment): CommentThreadStats {
    const children = childrenByParent[comment.id] ?? []
    let descendantCount = 0
    let maxSubtreeDepth = 0

    children.forEach((child) => {
      const childStats = visitComment(child)
      descendantCount += 1 + childStats.descendantCount
      maxSubtreeDepth = Math.max(maxSubtreeDepth, childStats.maxSubtreeDepth + 1)
    })

    const stats = {
      descendantCount,
      maxSubtreeDepth,
      replyCount: children.length,
    }

    statsById[comment.id] = stats
    return stats
  }

  ;(childrenByParent[ROOT_COMMENT_KEY] ?? []).forEach((comment) => {
    visitComment(comment)
  })

  comments.forEach((comment) => {
    statsById[comment.id] ??= {
      descendantCount: 0,
      maxSubtreeDepth: 0,
      replyCount: 0,
    }
  })

  return { childrenByParent, commentsById, statsById }
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

function getThreadComplexity(
  replyCount: number,
  descendantCount: number,
  maxSubtreeDepth: number
) {
  const branchingCount = Math.max(0, descendantCount - maxSubtreeDepth)

  return (
    maxSubtreeDepth +
    branchingCount * 3 +
    Math.max(0, replyCount - 1) * 2
  )
}

export function isLinearReplyChain(
  replyCount: number,
  descendantCount: number,
  maxSubtreeDepth: number
) {
  return replyCount === 1 && descendantCount === maxSubtreeDepth && descendantCount > 0
}

export function shouldAutoCollapseThread(
  depth: number,
  replyCount: number,
  descendantCount: number,
  maxSubtreeDepth: number
) {
  if (replyCount === 0) {
    return false
  }

  const collapseScore =
    getThreadComplexity(replyCount, descendantCount, maxSubtreeDepth) +
    depth * 2

  return collapseScore >= 8
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

  const toggleScore = getThreadComplexity(
    replyCount,
    descendantCount,
    maxSubtreeDepth
  )
  const threshold = Math.max(3, 6 - depth)

  return toggleScore >= threshold
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

  let currentComment: Comment | undefined = threadIndex.commentsById[replyTargetId]

  while (currentComment) {
    next[currentComment.id] = false
    currentComment = currentComment.parent_id
      ? threadIndex.commentsById[currentComment.parent_id]
      : undefined
  }

  return next
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
