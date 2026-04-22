import { createInitialThreadState } from './utils'
import type { Comment, ThreadState, VoteSelection } from './types'

export function getThreadState(
  threadStates: Record<string, ThreadState>,
  postId: string
): ThreadState {
  return threadStates[postId] ?? createInitialThreadState()
}

export function updateThreadStateMap(
  threadStates: Record<string, ThreadState>,
  postId: string,
  updater: (current: ThreadState) => ThreadState
) {
  const currentThread = getThreadState(threadStates, postId)

  return {
    ...threadStates,
    [postId]: updater(currentThread),
  }
}

export function removeThreadState(
  threadStates: Record<string, ThreadState>,
  postId: string
) {
  if (!(postId in threadStates)) {
    return threadStates
  }

  const next = { ...threadStates }
  delete next[postId]
  return next
}

export function setThreadError(thread: ThreadState, error: string): ThreadState {
  return {
    ...thread,
    error,
  }
}

export function clearThreadError(thread: ThreadState): ThreadState {
  return setThreadError(thread, '')
}

export function startThreadLoading(thread: ThreadState): ThreadState {
  return {
    ...thread,
    loading: true,
    error: '',
  }
}

export function finishThreadLoading(
  thread: ThreadState,
  comments: Comment[]
): ThreadState {
  return {
    ...thread,
    loading: false,
    loaded: true,
    comments,
    error: '',
  }
}

export function failThreadLoading(
  thread: ThreadState,
  error: string
): ThreadState {
  return {
    ...thread,
    loading: false,
    error,
  }
}

export function setThreadDraft(
  thread: ThreadState,
  draft: string
): ThreadState {
  return {
    ...thread,
    draft,
  }
}

export function setThreadReplyDraft(
  thread: ThreadState,
  commentId: string,
  value: string
): ThreadState {
  return {
    ...thread,
    replyDrafts: {
      ...thread.replyDrafts,
      [commentId]: value,
    },
  }
}

export function toggleThreadReplyTarget(
  thread: ThreadState,
  commentId: string
): ThreadState {
  return {
    ...thread,
    replyTargetId: thread.replyTargetId === commentId ? null : commentId,
    error: '',
  }
}

export function closeThreadReply(thread: ThreadState): ThreadState {
  return {
    ...thread,
    replyTargetId: null,
  }
}

export function toggleThreadOpen(
  thread: ThreadState,
  isOpen: boolean
): ThreadState {
  return {
    ...thread,
    isOpen,
    error: isOpen ? thread.error : '',
    replyTargetId: isOpen ? thread.replyTargetId : null,
  }
}

export function applyThreadCommentVote(
  thread: ThreadState,
  commentId: string,
  vote: VoteSelection,
  payload: {
    upvotes?: number
    downvotes?: number
    viewer_vote?: VoteSelection
  }
): ThreadState {
  return {
    ...thread,
    comments: thread.comments.map((comment) =>
      comment.id === commentId
        ? {
            ...comment,
            upvotes: payload.upvotes ?? comment.upvotes,
            downvotes: payload.downvotes ?? comment.downvotes,
            viewer_vote: payload.viewer_vote ?? vote,
          }
        : comment
    ),
  }
}

export function startThreadSubmit(
  thread: ThreadState,
  parentId?: string
): ThreadState {
  return {
    ...thread,
    error: '',
    submitting: parentId ? thread.submitting : true,
    submittingReplyId: parentId ?? thread.submittingReplyId,
  }
}

export function finishThreadSubmit(
  thread: ThreadState,
  comment: Comment,
  parentId?: string
): ThreadState {
  const nextReplyDrafts = { ...thread.replyDrafts }

  if (parentId) {
    delete nextReplyDrafts[parentId]
  }

  return {
    ...thread,
    loaded: true,
    submitting: false,
    submittingReplyId: null,
    comments: [...thread.comments, comment],
    draft: parentId ? thread.draft : '',
    replyDrafts: nextReplyDrafts,
    replyTargetId: parentId ? null : thread.replyTargetId,
    error: '',
  }
}

export function failThreadSubmit(
  thread: ThreadState,
  error: string
): ThreadState {
  return {
    ...thread,
    submitting: false,
    submittingReplyId: null,
    error,
  }
}

export function removeCommentsFromThread(
  thread: ThreadState,
  idsToRemove: Set<string>
): ThreadState {
  const nextReplyDrafts = { ...thread.replyDrafts }

  idsToRemove.forEach((id) => {
    delete nextReplyDrafts[id]
  })

  return {
    ...thread,
    comments: thread.comments.filter((comment) => !idsToRemove.has(comment.id)),
    replyDrafts: nextReplyDrafts,
    replyTargetId:
      thread.replyTargetId && idsToRemove.has(thread.replyTargetId)
        ? null
        : thread.replyTargetId,
  }
}
