import { useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  Ellipsis,
  MessageCircle,
} from 'lucide-react'
import FeedCommentThread from './FeedCommentThread'
import type { Post, ThreadState, ViewerRole, VoteSelection } from './types'
import {
  formatTimeAgo,
  getAvatarLetter,
  renderStars,
  viewerCanModerate,
} from './utils'
import { useDismissibleLayer } from './useDismissibleLayer'

type FeedPostCardProps = {
  post: Post
  apiBaseUrl: string
  thread: ThreadState
  commentCount: number
  viewerRole: ViewerRole
  onToggleComments: () => void
  onVote: (vote: VoteSelection) => void
  onDeletePost: () => void
  onReportPost: () => void
  onDraftChange: (value: string) => void
  onReplyDraftChange: (commentId: string, value: string) => void
  onReplyToggle: (commentId: string) => void
  onCloseReply: () => void
  onSubmitComment: (parentId?: string) => void
  onCommentVote: (commentId: string, vote: VoteSelection) => void
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
  const ratingOutOfFive = (post.star_rating / 2).toFixed(1)
  const hasUpvoted = post.viewer_vote === 'up'
  const hasDownvoted = post.viewer_vote === 'down'
  const imageSrc = post.image_url
    ? post.image_url.startsWith('http')
      ? post.image_url
      : `${apiBaseUrl}${post.image_url}`
    : null
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const isModerator = viewerCanModerate(viewerRole)
  const menuRef = useDismissibleLayer<HTMLDivElement>(isMenuOpen, () =>
    setIsMenuOpen(false)
  )

  return (
    <article className="feed-card">
      <header className="feed-card-header">
        <div className="feed-avatar">{getAvatarLetter(username)}</div>

        <div className="feed-card-heading">
          <div className="feed-user-meta">
            <div className="feed-user-row">
              <span className="feed-username">{username}</span>
              <span className="feed-meta-separator" aria-hidden="true">
                •
              </span>
              <time className="feed-time" dateTime={post.created_at}>
                {formatTimeAgo(post.created_at)}
              </time>
            </div>

            <div className="feed-rating-row">
              <span
                className="feed-stars"
                aria-label={`${ratingOutOfFive} out of 5 stars`}
              >
                {renderStars(post.star_rating)}
              </span>
              <span className="feed-rating-value">{ratingOutOfFive}</span>
              {post.food_item_name && (
                <>
                  <span className="feed-meta-separator" aria-hidden="true">
                    •
                  </span>
                  <span className="feed-item-name">{post.food_item_name}</span>
                </>
              )}
            </div>
          </div>

          <div className="feed-overflow-menu" ref={menuRef}>
            <button
              className="overflow-trigger"
              type="button"
              aria-label="Post actions"
              aria-expanded={isMenuOpen}
              aria-haspopup="menu"
              onClick={() => setIsMenuOpen((current) => !current)}
            >
              <Ellipsis className="overflow-icon" aria-hidden="true" />
            </button>

            {isMenuOpen && (
              <div className="overflow-menu-panel" role="menu">
                <button
                  className={`overflow-menu-item ${
                    isModerator ? 'overflow-menu-item-danger' : ''
                  }`}
                  type="button"
                  role="menuitem"
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
      </header>

      {(post.content || imageSrc) && (
        <div className="feed-card-content">
          {post.content && <p className="feed-review-text">{post.content}</p>}

          {imageSrc && (
            <div className="feed-image-frame">
              <img
                className="feed-image"
                src={imageSrc}
                alt={post.food_item_name || 'Review image'}
                loading="lazy"
              />
            </div>
          )}
        </div>
      )}

      <footer
        className={`feed-card-footer ${
          thread.isOpen ? 'feed-card-footer-open' : ''
        }`}
      >
        <button
          className={`comment-button ${
            thread.isOpen ? 'comment-button-active' : ''
          }`}
          type="button"
          aria-expanded={thread.isOpen}
          aria-controls={`feed-thread-${post.id}`}
          onClick={onToggleComments}
        >
          <MessageCircle className="feed-action-icon" aria-hidden="true" />
          <span className="feed-action-label">Comments</span>
          <span className="feed-action-count">{commentCount}</span>
        </button>

        <div className="vote-group">
          <button
            className={`vote-button ${hasUpvoted ? 'vote-button-active' : ''}`}
            type="button"
            aria-pressed={hasUpvoted}
            aria-label={
              hasUpvoted ? 'Remove upvote from post' : `Upvote post (${post.upvotes} upvotes)`
            }
            onClick={() => onVote(hasUpvoted ? null : 'up')}
          >
            <ChevronUp className="feed-action-icon" aria-hidden="true" />
            <span className="feed-action-count">{post.upvotes}</span>
          </button>

          <button
            className={`vote-button ${hasDownvoted ? 'vote-button-active' : ''}`}
            type="button"
            aria-pressed={hasDownvoted}
            aria-label={
              hasDownvoted
                ? 'Remove downvote from post'
                : `Downvote post (${post.downvotes} downvotes)`
            }
            onClick={() => onVote(hasDownvoted ? null : 'down')}
          >
            <ChevronDown className="feed-action-icon" aria-hidden="true" />
            <span className="feed-action-count">{post.downvotes}</span>
          </button>
        </div>
      </footer>

      {thread.isOpen && (
        <div className="feed-card-thread" id={`feed-thread-${post.id}`}>
          <FeedCommentThread
            thread={thread}
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
        </div>
      )}
    </article>
  )
}

export default FeedPostCard
