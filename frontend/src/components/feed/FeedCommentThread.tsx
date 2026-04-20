import type { Comment, ThreadState } from './types'
import { formatTimeAgo, getAvatarLetter } from './utils'

type FeedCommentThreadProps = {
  thread: ThreadState
  commentCount: number
  onDraftChange: (value: string) => void
  onReplyDraftChange: (commentId: string, value: string) => void
  onReplyToggle: (commentId: string) => void
  onCloseReply: () => void
  onSubmitComment: (parentId?: string) => void
  onCommentVote: (commentId: string, upvote: boolean) => void
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
  onReplyDraftChange,
  onReplyToggle,
  onCloseReply,
  onSubmitComment,
  onCommentVote,
}: {
  comments: Comment[]
  parentId: string | null
  thread: ThreadState
  onReplyDraftChange: (commentId: string, value: string) => void
  onReplyToggle: (commentId: string) => void
  onCloseReply: () => void
  onSubmitComment: (parentId?: string) => void
  onCommentVote: (commentId: string, upvote: boolean) => void
}) {
  const children = sortComments(comments, parentId)

  if (children.length === 0) {
    return null
  }

  return children.map((comment) => {
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
        <div className="feed-comment-rail" aria-hidden="true" />

        <div className="feed-comment-body">
          <div className="feed-comment-header">
            <div className="feed-comment-avatar">
              {getAvatarLetter(comment.author_username)}
            </div>

            <div className="feed-comment-meta">
              <div className="feed-comment-author-row">
                <span className="feed-comment-username">{username}</span>
                <span className="feed-time">
                  {formatTimeAgo(comment.created_at)}
                </span>
              </div>

              <p className="feed-comment-text">{comment.text}</p>
            </div>
          </div>

          <div className="feed-comment-actions">
            <button
              className="comment-action-button"
              type="button"
              onClick={() => onCommentVote(comment.id, true)}
            >
              ⬆ {comment.upvotes}
            </button>

            <button
              className="comment-action-button"
              type="button"
              onClick={() => onCommentVote(comment.id, false)}
            >
              ⬇ {comment.downvotes}
            </button>

            <button
              className="comment-action-button"
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
              onReplyDraftChange={onReplyDraftChange}
              onReplyToggle={onReplyToggle}
              onCloseReply={onCloseReply}
              onSubmitComment={onSubmitComment}
              onCommentVote={onCommentVote}
            />
          </div>
        </div>
      </div>
    )
  })
}

function FeedCommentThread({
  thread,
  commentCount,
  onDraftChange,
  onReplyDraftChange,
  onReplyToggle,
  onCloseReply,
  onSubmitComment,
  onCommentVote,
}: FeedCommentThreadProps) {
  return (
    <section className="feed-thread">
      <div className="feed-comment-composer">
        <textarea
          className="feed-comment-input"
          placeholder="Add a comment"
          value={thread.draft}
          onChange={(event) => onDraftChange(event.target.value)}
          rows={3}
        />

        <div className="feed-comment-composer-actions">
          <span className="feed-comment-count">
            {commentCount} comment{commentCount === 1 ? '' : 's'}
          </span>

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
        <p className="feed-thread-status">No comments yet. Start the thread.</p>
      )}

      <div className="feed-comments-list">
        <FeedCommentTree
          comments={thread.comments}
          parentId={null}
          thread={thread}
          onReplyDraftChange={onReplyDraftChange}
          onReplyToggle={onReplyToggle}
          onCloseReply={onCloseReply}
          onSubmitComment={onSubmitComment}
          onCommentVote={onCommentVote}
        />
      </div>
    </section>
  )
}

export default FeedCommentThread
