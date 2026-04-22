import { useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronUp, Ellipsis } from 'lucide-react'
import type { Comment, ThreadState, ViewerRole } from './types'
import { formatTimeAgo, getAvatarLetter } from './utils'

type FeedCommentThreadProps = {
  thread: ThreadState
  viewerRole: ViewerRole
  onDraftChange: (value: string) => void
  onReplyDraftChange: (commentId: string, value: string) => void
  onReplyToggle: (commentId: string) => void
  onCloseReply: () => void
  onSubmitComment: (parentId?: string) => void
  onCommentVote: (commentId: string, upvote: boolean) => void
  onDeleteComment: (commentId: string) => void
  onReportComment: (commentId: string) => void
}

function sortComments(comments: Comment[], parentId: string | null) {
  return comments
    .filter((comment) => comment.parent_id === parentId)
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
}

function FeedCommentTree({
  comments,
  parentId,
  thread,
  viewerRole,
  onReplyDraftChange,
  onReplyToggle,
  onCloseReply,
  onSubmitComment,
  onCommentVote,
  onDeleteComment,
  onReportComment,
}: {
  comments: Comment[]
  parentId: string | null
  thread: ThreadState
  viewerRole: ViewerRole
  onReplyDraftChange: (commentId: string, value: string) => void
  onReplyToggle: (commentId: string) => void
  onCloseReply: () => void
  onSubmitComment: (parentId?: string) => void
  onCommentVote: (commentId: string, upvote: boolean) => void
  onDeleteComment: (commentId: string) => void
  onReportComment: (commentId: string) => void
}) {
  const children = sortComments(comments, parentId)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const isModerator = viewerRole === 'moderator' || viewerRole === 'admin'
  const menuRootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!openMenuId) {
      return
    }

    function handlePointerDown(event: MouseEvent) {
      if (!menuRootRef.current?.contains(event.target as Node)) {
        setOpenMenuId(null)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpenMenuId(null)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [openMenuId])

  if (children.length === 0) {
    return null
  }

  return (
    <div ref={menuRootRef}>
      {children.map((comment) => {
        const username = comment.author_username || 'user'
        const isReplying = thread.replyTargetId === comment.id
        const replyDraft = thread.replyDrafts[comment.id] ?? ''
        const replyCount = comments.filter(
          (candidate) => candidate.parent_id === comment.id
        ).length

        return (
          <div
            key={comment.id}
            className={`feed-comment ${parentId ? 'feed-comment-reply' : ''}`}
          >
            <article className="feed-comment-node">
              <div className="feed-comment-avatar">
                {getAvatarLetter(comment.author_username)}
              </div>

              <div className="feed-comment-main">
                <div className="feed-comment-topline">
                  <div className="feed-comment-author-row">
                    <span className="feed-comment-username">{username}</span>
                    <span className="feed-meta-separator" aria-hidden="true">
                      •
                    </span>
                    <time className="feed-time" dateTime={comment.created_at}>
                      {formatTimeAgo(comment.created_at)}
                    </time>
                  </div>
                </div>

                <p className="feed-comment-text">{comment.text}</p>

                <div className="feed-comment-actions">
                  <button
                    className="comment-action-button"
                    type="button"
                    onClick={() => onCommentVote(comment.id, true)}
                  >
                    <ChevronUp className="feed-action-icon" aria-hidden="true" />
                    <span>{comment.upvotes}</span>
                  </button>

                  <button
                    className="comment-action-button"
                    type="button"
                    onClick={() => onCommentVote(comment.id, false)}
                  >
                    <ChevronDown className="feed-action-icon" aria-hidden="true" />
                    <span>{comment.downvotes}</span>
                  </button>

                  <button
                    className={`comment-action-button ${
                      isReplying ? 'comment-action-button-active' : ''
                    }`}
                    type="button"
                    onClick={() => onReplyToggle(comment.id)}
                  >
                    Reply
                  </button>

                  {replyCount > 0 && (
                    <span className="feed-comment-count">
                      {replyCount} repl{replyCount === 1 ? 'y' : 'ies'}
                    </span>
                  )}

                  <div className="feed-overflow-menu feed-comment-overflow-menu">
                    <button
                      className="overflow-trigger overflow-trigger-comment"
                      type="button"
                      aria-label="Comment actions"
                      aria-expanded={openMenuId === comment.id}
                      aria-haspopup="menu"
                      onClick={() =>
                        setOpenMenuId((current) =>
                          current === comment.id ? null : comment.id
                        )
                      }
                    >
                      <Ellipsis className="overflow-icon" aria-hidden="true" />
                    </button>

                    {openMenuId === comment.id && (
                      <div className="overflow-menu-panel" role="menu">
                        <button
                          className={`overflow-menu-item ${
                            isModerator ? 'overflow-menu-item-danger' : ''
                          }`}
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setOpenMenuId(null)
                            if (isModerator) {
                              onDeleteComment(comment.id)
                              return
                            }
                            onReportComment(comment.id)
                          }}
                        >
                          {isModerator ? 'Remove comment' : 'Report comment'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {isReplying && (
                  <div className="feed-reply-composer">
                    <textarea
                      className="feed-comment-input"
                      placeholder={`Reply to ${username}`}
                      value={replyDraft}
                      onChange={(event) =>
                        onReplyDraftChange(comment.id, event.target.value)
                      }
                      rows={2}
                    />

                    <div className="feed-comment-composer-actions">
                      <button
                        type="button"
                        className="secondary-comment-button"
                        onClick={onCloseReply}
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        className="primary-comment-button"
                        disabled={thread.submittingReplyId === comment.id}
                        onClick={() => onSubmitComment(comment.id)}
                      >
                        {thread.submittingReplyId === comment.id
                          ? 'Posting...'
                          : 'Post reply'}
                      </button>
                    </div>
                  </div>
                )}

                <div className="feed-comment-children">
                  <FeedCommentTree
                    comments={comments}
                    parentId={comment.id}
                    thread={thread}
                    viewerRole={viewerRole}
                    onReplyDraftChange={onReplyDraftChange}
                    onReplyToggle={onReplyToggle}
                    onCloseReply={onCloseReply}
                    onSubmitComment={onSubmitComment}
                    onCommentVote={onCommentVote}
                    onDeleteComment={onDeleteComment}
                    onReportComment={onReportComment}
                  />
                </div>
              </div>
            </article>
          </div>
        )
      })}
    </div>
  )
}

function FeedCommentThread({
  thread,
  viewerRole,
  onDraftChange,
  onReplyDraftChange,
  onReplyToggle,
  onCloseReply,
  onSubmitComment,
  onCommentVote,
  onDeleteComment,
  onReportComment,
}: FeedCommentThreadProps) {
  return (
    <section className="feed-thread">
      <div className="feed-comment-composer">
        <textarea
          className="feed-comment-input"
          placeholder="Write a comment"
          value={thread.draft}
          onChange={(event) => onDraftChange(event.target.value)}
          rows={3}
        />

        <div className="feed-comment-composer-actions">
          <button
            type="button"
            className="primary-comment-button"
            disabled={thread.submitting}
            onClick={() => onSubmitComment()}
          >
            {thread.submitting ? 'Posting...' : 'Post comment'}
          </button>
        </div>
      </div>

      {thread.loading && (
        <p className="feed-thread-status">Loading comments...</p>
      )}
      {thread.error && <p className="feed-thread-status">{thread.error}</p>}
      {!thread.loading && thread.comments.length === 0 && (
        <p className="feed-thread-status">
          No comments yet. Be the first to comment.
        </p>
      )}

      <div className="feed-comments-list">
        <FeedCommentTree
          comments={thread.comments}
          parentId={null}
          thread={thread}
          viewerRole={viewerRole}
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
