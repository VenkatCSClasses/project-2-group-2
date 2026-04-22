import { useState } from 'react'
import { ChevronDown, ChevronRight, ChevronUp, Ellipsis } from 'lucide-react'
import FeedCommentComposer from './FeedCommentComposer'
import {
  formatReplyLabel,
  getCommentParentKey,
  getReplyRegionId,
  getThreadToggleLabel,
  shouldAutoCollapseThread,
  shouldRenderThreadToggle,
  type CollapsedComments,
  type CommentThreadIndex,
} from './commentThread'
import type { ThreadState, ViewerRole, VoteSelection } from './types'
import { formatTimeAgo, getAvatarLetter, viewerCanModerate } from './utils'
import { useDismissibleLayer } from './useDismissibleLayer'

type FeedCommentTreeProps = {
  threadIndex: CommentThreadIndex
  parentId: string | null
  depth: number
  thread: ThreadState
  viewerRole: ViewerRole
  collapsedById: CollapsedComments
  onToggleCollapse: (commentId: string, currentCollapsed: boolean) => void
  onReplyDraftChange: (commentId: string, value: string) => void
  onReplyToggle: (commentId: string) => void
  onCloseReply: () => void
  onSubmitComment: (parentId?: string) => void
  onCommentVote: (commentId: string, vote: VoteSelection) => void
  onDeleteComment: (commentId: string) => void
  onReportComment: (commentId: string) => void
}

function FeedCommentTree({
  threadIndex,
  parentId,
  depth,
  thread,
  viewerRole,
  collapsedById,
  onToggleCollapse,
  onReplyDraftChange,
  onReplyToggle,
  onCloseReply,
  onSubmitComment,
  onCommentVote,
  onDeleteComment,
  onReportComment,
}: FeedCommentTreeProps) {
  const children =
    threadIndex.childrenByParent[getCommentParentKey(parentId)] ?? []
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const menuRootRef = useDismissibleLayer<HTMLDivElement>(
    openMenuId !== null,
    () => setOpenMenuId(null)
  )
  const isModerator = viewerCanModerate(viewerRole)

  if (children.length === 0) {
    return null
  }

  return (
    <div
      ref={menuRootRef}
      className={`feed-comment-tree ${
        depth === 0 ? 'feed-comment-tree-root' : 'feed-comment-tree-nested'
      }`}
    >
      {children.map((comment) => {
        const username = comment.author_username ?? 'user'
        const isReplying = thread.replyTargetId === comment.id
        const replyDraft = thread.replyDrafts[comment.id] ?? ''
        const commentMeta = threadIndex.metaById[comment.id]
        const replyCount = commentMeta?.replyCount ?? 0
        const descendantCount = commentMeta?.descendantCount ?? 0
        const maxSubtreeDepth = commentMeta?.maxSubtreeDepth ?? 0
        const hasUpvoted = comment.viewer_vote === 'up'
        const hasDownvoted = comment.viewer_vote === 'down'
        const isCollapsed =
          collapsedById[comment.id] ??
          shouldAutoCollapseThread(depth, replyCount, descendantCount)
        const shouldShowThreadToggle = shouldRenderThreadToggle(
          depth,
          replyCount,
          descendantCount,
          maxSubtreeDepth,
          isCollapsed
        )
        const hasReplies = replyCount > 0
        const replyRegionId = getReplyRegionId(comment.id)

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

                <div
                  className="feed-comment-actions"
                  role="group"
                  aria-label="Comment actions"
                >
                  <div
                    className="comment-vote-cluster"
                    role="group"
                    aria-label="Comment votes"
                  >
                    <button
                      className={`comment-vote-button ${
                        hasUpvoted ? 'comment-vote-button-active' : ''
                      }`}
                      type="button"
                      aria-pressed={hasUpvoted}
                      aria-label={
                        hasUpvoted
                          ? 'Remove upvote from comment'
                          : `Upvote comment (${comment.upvotes} upvotes)`
                      }
                      onClick={() =>
                        onCommentVote(comment.id, hasUpvoted ? null : 'up')
                      }
                    >
                      <ChevronUp className="feed-action-icon" aria-hidden="true" />
                      <span className="feed-action-count">{comment.upvotes}</span>
                    </button>

                    <button
                      className={`comment-vote-button ${
                        hasDownvoted ? 'comment-vote-button-active' : ''
                      }`}
                      type="button"
                      aria-pressed={hasDownvoted}
                      aria-label={
                        hasDownvoted
                          ? 'Remove downvote from comment'
                          : `Downvote comment (${comment.downvotes} downvotes)`
                      }
                      onClick={() =>
                        onCommentVote(comment.id, hasDownvoted ? null : 'down')
                      }
                    >
                      <ChevronDown
                        className="feed-action-icon"
                        aria-hidden="true"
                      />
                      <span className="feed-action-count">
                        {comment.downvotes}
                      </span>
                    </button>
                  </div>

                  <button
                    className={`comment-action-button ${
                      isReplying ? 'comment-action-button-active' : ''
                    }`}
                    type="button"
                    onClick={() => onReplyToggle(comment.id)}
                  >
                    Reply
                  </button>

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
                  <FeedCommentComposer
                    className="feed-reply-composer"
                    value={replyDraft}
                    placeholder={`Reply to ${username}`}
                    submitLabel="Post reply"
                    submittingLabel="Posting..."
                    isSubmitting={thread.submittingReplyId === comment.id}
                    onChange={(value) => onReplyDraftChange(comment.id, value)}
                    onSubmit={() => onSubmitComment(comment.id)}
                    onCancel={onCloseReply}
                    rows={2}
                  />
                )}

                {hasReplies && shouldShowThreadToggle && (
                  <div className="feed-comment-thread-toggle-row">
                    <button
                      className={`comment-thread-toggle ${
                        isCollapsed ? 'comment-thread-toggle-collapsed' : ''
                      }`}
                      type="button"
                      aria-label={`${
                        isCollapsed ? 'Show' : 'Hide'
                      } ${formatReplyLabel(descendantCount)}`}
                      aria-expanded={!isCollapsed}
                      aria-controls={replyRegionId}
                      onClick={() => onToggleCollapse(comment.id, isCollapsed)}
                    >
                      {isCollapsed ? (
                        <ChevronRight
                          className="comment-thread-toggle-icon"
                          aria-hidden="true"
                        />
                      ) : (
                        <ChevronDown
                          className="comment-thread-toggle-icon"
                          aria-hidden="true"
                        />
                      )}
                      <span className="comment-thread-toggle-label">
                        {getThreadToggleLabel(isCollapsed)}
                      </span>
                      <span className="comment-thread-toggle-meta">
                        {formatReplyLabel(descendantCount)}
                      </span>
                    </button>
                  </div>
                )}

                {hasReplies && !isCollapsed && (
                  <div className="feed-comment-children" id={replyRegionId}>
                    <FeedCommentTree
                      threadIndex={threadIndex}
                      parentId={comment.id}
                      depth={depth + 1}
                      thread={thread}
                      viewerRole={viewerRole}
                      collapsedById={collapsedById}
                      onToggleCollapse={onToggleCollapse}
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
              </div>
            </article>
          </div>
        )
      })}
    </div>
  )
}

export default FeedCommentTree
