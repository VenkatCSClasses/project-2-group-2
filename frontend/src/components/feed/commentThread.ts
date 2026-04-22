import type { Comment } from './types'

export type CommentThreadIndex = {
  childrenByParent: Record<string, Comment[]>
  commentsById: Record<string, Comment>
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

  return { childrenByParent, commentsById }
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
