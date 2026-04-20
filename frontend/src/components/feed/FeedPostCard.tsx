import { useEffect, useRef, useState } from 'react'
import FeedCommentThread from './FeedCommentThread'
import type { Post, ThreadState, ViewerRole } from './types'
import { formatTimeAgo, getAvatarLetter, renderStars } from './utils'

type FeedPostCardProps = {
  post: Post
  apiBaseUrl: string
  thread: ThreadState
  commentCount: number
  viewerRole: ViewerRole
  onToggleComments: () => void
  onVote: (upvote: boolean) => void
  onDeletePost: () => void
  onReportPost: () => void
  onDraftChange: (value: string) => void
  onReplyDraftChange: (commentId: string, value: string) => void
  onReplyToggle: (commentId: string) => void
  onCloseReply: () => void
  onSubmitComment: (parentId?: string) => void
  onCommentVote: (commentId: string, upvote: boolean) => void
  onDeleteComment: (commentId: string) => void
  onReportComment: (commentId: string) => void
}

function FeedPostCard({
  post,
  apiBaseUrl,
  thread,
  commentCount,
  viewerRole,
  onToggleComments,
  onVote,
  onDeletePost,
  onReportPost,
  onDraftChange,
  onReplyDraftChange,
  onReplyToggle,
  onCloseReply,
  onSubmitComment,
  onCommentVote,
  onDeleteComment,
  onReportComment,
}: FeedPostCardProps) {
  const username = post.author_username || 'user'
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const isModerator = viewerRole === 'moderator' || viewerRole === 'admin'
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isMenuOpen) {
      return
    }

    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMenuOpen])

  return (
    <article className="feed-card">
      <div className="feed-card-header">
        <div className="feed-avatar">{getAvatarLetter(username)}</div>

        <div className="feed-user-meta">
          <div className="feed-user-row">
            <span className="feed-username">{username}</span>
            <span className="feed-time">{formatTimeAgo(post.created_at)}</span>
          </div>

          <div className="feed-rating-row">
            <span className="feed-stars">{renderStars(post.star_rating)}</span>
            <span className="feed-rating-value">
              {(post.star_rating / 2).toFixed(1)}
            </span>
            {post.food_item_name && (
              <span className="feed-item-name">· {post.food_item_name}</span>
            )}
          </div>
        </div>

        <div className="feed-overflow-menu" ref={menuRef}>
          <button
            className="overflow-trigger"
            type="button"
            aria-label="Post actions"
            onClick={() => setIsMenuOpen((current) => !current)}
          >
            ⋯
          </button>

          {isMenuOpen && (
            <div className="overflow-menu-panel">
              <button
                className={`overflow-menu-item ${
                  isModerator ? 'overflow-menu-item-danger' : ''
                }`}
                type="button"
                onClick={() => {
                  setIsMenuOpen(false)
                  if (isModerator) {
                    onDeletePost()
                    return
                  }
                  onReportPost()
                }}
              >
                {isModerator ? 'Remove post' : 'Report post'}
              </button>
            </div>
          )}
        </div>
      </div>

      {post.content && <p className="feed-review-text">{post.content}</p>}

      {post.image_url && (
        <img
          className="feed-image"
          src={
            post.image_url.startsWith('http')
              ? post.image_url
              : `${apiBaseUrl}${post.image_url}`
          }
          alt={post.food_item_name || 'Review image'}
        />
      )}

      <div className="feed-card-footer">
        <button
          className={`comment-button ${
            thread.isOpen ? 'comment-button-active' : ''
          }`}
          type="button"
          onClick={onToggleComments}
        >
          💬 {commentCount}
        </button>

        <div className="vote-group">
          <button className="vote-button" type="button" onClick={() => onVote(true)}>
            ⬆ {post.upvotes}
          </button>

          <button className="vote-button" type="button" onClick={() => onVote(false)}>
            ⬇ {post.downvotes}
          </button>
        </div>
      </div>

      {thread.isOpen && (
        <FeedCommentThread
          thread={thread}
          commentCount={commentCount}
          viewerRole={viewerRole}
          onDraftChange={onDraftChange}
          onReplyDraftChange={onReplyDraftChange}
          onReplyToggle={onReplyToggle}
          onCloseReply={onCloseReply}
          onSubmitComment={onSubmitComment}
          onCommentVote={onCommentVote}
          onDeleteComment={onDeleteComment}
          onReportComment={onReportComment}
        />
      )}
    </article>
  )
}

export default FeedPostCard
