import { useMemo, useState } from 'react'
import FeedCommentComposer from './FeedCommentComposer'
import FeedCommentTree from './FeedCommentTree'
import {
  buildCommentThreadIndex,
  getVisibleCollapsedComments,
  toggleCollapsedComment,
  type CollapsedComments,
} from './commentThread'
import type { ThreadState, ViewerRole, VoteSelection } from './types'

type FeedCommentThreadProps = {
  thread: ThreadState
  viewerRole: ViewerRole
  viewerUsername: string
  onDraftChange: (value: string) => void
  onReplyDraftChange: (commentId: string, value: string) => void
  onReplyToggle: (commentId: string) => void
  onCloseReply: () => void
  onSubmitComment: (parentId?: string) => void
  onCommentVote: (commentId: string, vote: VoteSelection) => void
  onDeleteComment: (commentId: string) => void
  onReportComment: (commentId: string) => void
}

function FeedCommentThread({
  thread,
  viewerRole,
  viewerUsername,
  onDraftChange,
  onReplyDraftChange,
  onReplyToggle,
  onCloseReply,
  onSubmitComment,
  onCommentVote,
  onDeleteComment,
  onReportComment,
}: FeedCommentThreadProps) {
  const threadIndex = useMemo(
    () => buildCommentThreadIndex(thread.comments),
    [thread.comments]
  )
  const [collapsedById, setCollapsedById] = useState<CollapsedComments>({})

  const visibleCollapsedById = useMemo(
    () =>
      getVisibleCollapsedComments(
        collapsedById,
        thread.comments,
        thread.replyTargetId,
        threadIndex
      ),
    [collapsedById, thread.comments, thread.replyTargetId, threadIndex]
  )

  function handleToggleCollapse(commentId: string, currentCollapsed: boolean) {
    setCollapsedById((current) =>
      toggleCollapsedComment(
        getVisibleCollapsedComments(
          current,
          thread.comments,
          thread.replyTargetId,
          threadIndex
        ),
        commentId,
        currentCollapsed
      )
    )
  }

  return (
    <section className="feed-thread">
      <FeedCommentComposer
        value={thread.draft}
        placeholder="Write a comment"
        submitLabel="Post comment"
        submittingLabel="Posting..."
        isSubmitting={thread.submitting}
        onChange={onDraftChange}
        onSubmit={() => onSubmitComment()}
      />

      {thread.loading && (
        <p className="feed-thread-status" aria-live="polite">
          Loading comments...
        </p>
      )}
      {thread.error && (
        <p className="feed-thread-status" aria-live="polite">
          {thread.error}
        </p>
      )}
      {!thread.loading && thread.comments.length === 0 && (
        <p className="feed-thread-status" aria-live="polite">
          No comments yet. Be the first to comment.
        </p>
      )}

      <div className="feed-comments-list">
        <FeedCommentTree
          threadIndex={threadIndex}
          parentId={null}
          depth={0}
          thread={thread}
          viewerRole={viewerRole}
          viewerUsername={viewerUsername}
          collapsedById={visibleCollapsedById}
          onToggleCollapse={handleToggleCollapse}
          onReplyDraftChange={onReplyDraftChange}
          onReplyToggle={onReplyToggle}
          onCloseReply={onCloseReply}
          onSubmitComment={onSubmitComment}
          onCommentVote={onCommentVote}
          onDeleteComment={onDeleteComment}
          onReportComment={onReportComment}
        />
      </div>
    </section>
  )
}

export default FeedCommentThread
