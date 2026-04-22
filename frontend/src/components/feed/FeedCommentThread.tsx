import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronRight, ChevronUp, Ellipsis } from "lucide-react";
import type { Comment, ThreadState, ViewerRole } from "./types";
import { formatTimeAgo, getAvatarLetter } from "./utils";

type FeedCommentThreadProps = {
  thread: ThreadState;
  viewerRole: ViewerRole;
  onDraftChange: (value: string) => void;
  onReplyDraftChange: (commentId: string, value: string) => void;
  onReplyToggle: (commentId: string) => void;
  onCloseReply: () => void;
  onSubmitComment: (parentId?: string) => void;
  onCommentVote: (commentId: string, upvote: boolean) => void;
  onDeleteComment: (commentId: string) => void;
  onReportComment: (commentId: string) => void;
};

type CommentThreadIndex = {
  childrenByParent: Record<string, Comment[]>;
  descendantCountById: Record<string, number>;
  descendantIdsById: Record<string, string[]>;
  maxSubtreeDepthById: Record<string, number>;
  replyCountById: Record<string, number>;
};

const ROOT_COMMENT_KEY = "__root__";

function getCommentParentKey(parentId: string | null) {
  return parentId ?? ROOT_COMMENT_KEY;
}

function formatReplyLabel(count: number) {
  return `${count} repl${count === 1 ? "y" : "ies"}`;
}

function getThreadToggleLabel(isCollapsed: boolean) {
  return isCollapsed ? "Continue thread" : "Hide thread";
}

function getReplyRegionId(commentId: string) {
  return `feed-comment-replies-${commentId}`;
}

function buildCommentThreadIndex(comments: Comment[]): CommentThreadIndex {
  const childrenByParent: Record<string, Comment[]> = {};

  comments.forEach((comment) => {
    const parentKey = getCommentParentKey(comment.parent_id);
    childrenByParent[parentKey] ??= [];
    childrenByParent[parentKey].push(comment);
  });

  Object.values(childrenByParent).forEach((children) => {
    children.sort(
      (left, right) =>
        new Date(left.created_at).getTime() -
        new Date(right.created_at).getTime()
    );
  });

  const replyCountById: Record<string, number> = {};
  comments.forEach((comment) => {
    replyCountById[comment.id] = childrenByParent[comment.id]?.length ?? 0;
  });

  const descendantCountById: Record<string, number> = {};
  const descendantIdsById: Record<string, string[]> = {};
  const maxSubtreeDepthById: Record<string, number> = {};

  function collectDescendants(commentId: string): {
    descendants: string[];
    maxDepth: number;
  } {
    const children = childrenByParent[commentId] ?? [];
    let maxDepth = 0;
    const descendants = children.flatMap((child) => {
      const childBranch = collectDescendants(child.id);
      maxDepth = Math.max(maxDepth, childBranch.maxDepth + 1);
      return [child.id, ...childBranch.descendants];
    });

    descendantIdsById[commentId] = descendants;
    descendantCountById[commentId] = descendants.length;
    maxSubtreeDepthById[commentId] = maxDepth;

    return { descendants, maxDepth };
  }

  comments.forEach((comment) => {
    if (descendantCountById[comment.id] === undefined) {
      collectDescendants(comment.id);
    }
  });

  return {
    childrenByParent,
    descendantCountById,
    descendantIdsById,
    maxSubtreeDepthById,
    replyCountById,
  };
}

function shouldAutoCollapseThread(
  depth: number,
  replyCount: number,
  descendantCount: number
) {
  if (replyCount === 0) {
    return false;
  }

  if (depth >= 3) {
    return true;
  }

  if (depth === 2 && descendantCount >= 4) {
    return true;
  }

  if (depth === 1 && descendantCount >= 6) {
    return true;
  }

  return depth === 0 && descendantCount >= 10;
}

function shouldRenderThreadToggle(
  depth: number,
  replyCount: number,
  descendantCount: number,
  maxSubtreeDepth: number,
  isCollapsed: boolean
) {
  if (replyCount === 0) {
    return false;
  }

  if (isCollapsed) {
    return true;
  }

  const hasBranchingReplies = replyCount >= 2;
  const hasLayeredThread = maxSubtreeDepth >= 2;

  if (depth >= 2) {
    return hasBranchingReplies || descendantCount >= 3 || hasLayeredThread;
  }

  if (depth === 1) {
    return (
      replyCount >= 3 ||
      descendantCount >= 4 ||
      (hasBranchingReplies && descendantCount >= 3) ||
      (hasLayeredThread && descendantCount >= 4)
    );
  }

  if (replyCount >= 3 || descendantCount >= 5) {
    return true;
  }

  return (
    (hasBranchingReplies && descendantCount >= 4) ||
    (hasLayeredThread && descendantCount >= 5)
  );
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
}: {
  threadIndex: CommentThreadIndex;
  parentId: string | null;
  depth: number;
  thread: ThreadState;
  viewerRole: ViewerRole;
  collapsedById: Record<string, boolean>;
  onToggleCollapse: (commentId: string, currentCollapsed: boolean) => void;
  onReplyDraftChange: (commentId: string, value: string) => void;
  onReplyToggle: (commentId: string) => void;
  onCloseReply: () => void;
  onSubmitComment: (parentId?: string) => void;
  onCommentVote: (commentId: string, upvote: boolean) => void;
  onDeleteComment: (commentId: string) => void;
  onReportComment: (commentId: string) => void;
}) {
  const children =
    threadIndex.childrenByParent[getCommentParentKey(parentId)] ?? [];
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const isModerator = viewerRole === "moderator" || viewerRole === "admin";
  const menuRootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openMenuId) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!menuRootRef.current?.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenMenuId(null);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openMenuId]);

  if (children.length === 0) {
    return null;
  }

  return (
    <div
      ref={menuRootRef}
      className={`feed-comment-tree ${
        depth === 0 ? "feed-comment-tree-root" : "feed-comment-tree-nested"
      }`}
    >
      {children.map((comment) => {
        const username = comment.author_username || "user";
        const isReplying = thread.replyTargetId === comment.id;
        const replyDraft = thread.replyDrafts[comment.id] ?? "";
        const replyCount = threadIndex.replyCountById[comment.id] ?? 0;
        const descendantCount =
          threadIndex.descendantCountById[comment.id] ?? 0;
        const maxSubtreeDepth =
          threadIndex.maxSubtreeDepthById[comment.id] ?? 0;
        const replyRegionId = getReplyRegionId(comment.id);
        const voteScore = comment.upvotes - comment.downvotes;
        const hasUpvoted = comment.viewer_vote === "up";
        const hasDownvoted = comment.viewer_vote === "down";
        const autoCollapsed = shouldAutoCollapseThread(
          depth,
          replyCount,
          descendantCount
        );
        const isCollapsed = collapsedById[comment.id] ?? autoCollapsed;
        const toggleLabel = getThreadToggleLabel(isCollapsed);
        const hasReplies = replyCount > 0;
        const shouldShowThreadToggle = shouldRenderThreadToggle(
          depth,
          replyCount,
          descendantCount,
          maxSubtreeDepth,
          isCollapsed
        );

        return (
          <div
            key={comment.id}
            className={`feed-comment ${parentId ? "feed-comment-reply" : ""}`}
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
                        hasUpvoted ? "comment-vote-button-active" : ""
                      }`}
                      type="button"
                      aria-pressed={hasUpvoted}
                      aria-label={`Upvote comment (${comment.upvotes} upvotes)`}
                      onClick={() => onCommentVote(comment.id, true)}
                    >
                      <ChevronUp
                        className="feed-action-icon"
                        aria-hidden="true"
                      />
                    </button>

                    <span className="comment-vote-score">
                      {voteScore > 0 ? `${voteScore}` : voteScore}
                    </span>

                    <button
                      className={`comment-vote-button ${
                        hasDownvoted ? "comment-vote-button-active" : ""
                      }`}
                      type="button"
                      aria-pressed={hasDownvoted}
                      aria-label={`Downvote comment (${comment.downvotes} downvotes)`}
                      onClick={() => onCommentVote(comment.id, false)}
                    >
                      <ChevronDown
                        className="feed-action-icon"
                        aria-hidden="true"
                      />
                    </button>
                  </div>

                  <button
                    className={`comment-action-button ${
                      isReplying ? "comment-action-button-active" : ""
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
                            isModerator ? "overflow-menu-item-danger" : ""
                          }`}
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setOpenMenuId(null);
                            if (isModerator) {
                              onDeleteComment(comment.id);
                              return;
                            }
                            onReportComment(comment.id);
                          }}
                        >
                          {isModerator ? "Remove comment" : "Report comment"}
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
                          ? "Posting..."
                          : "Post reply"}
                      </button>
                    </div>
                  </div>
                )}

                {hasReplies && shouldShowThreadToggle && (
                  <div className="feed-comment-thread-toggle-row">
                    <button
                      className={`comment-thread-toggle ${
                        isCollapsed ? "comment-thread-toggle-collapsed" : ""
                      }`}
                      type="button"
                      aria-label={`${
                        isCollapsed ? "Show" : "Hide"
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
                        {toggleLabel}
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
        );
      })}
    </div>
  );
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
  const threadIndex = useMemo(
    () => buildCommentThreadIndex(thread.comments),
    [thread.comments]
  );
  const [collapsedById, setCollapsedById] = useState<Record<string, boolean>>(
    {}
  );

  useEffect(() => {
    const validCommentIds = new Set(
      thread.comments.map((comment) => comment.id)
    );
    setCollapsedById((current) =>
      Object.fromEntries(
        Object.entries(current).filter(([commentId]) =>
          validCommentIds.has(commentId)
        )
      )
    );
  }, [thread.comments]);

  useEffect(() => {
    if (!thread.replyTargetId) {
      return;
    }

    const targetId = thread.replyTargetId;

    setCollapsedById((current) => {
      let changed = false;
      const next = { ...current };

      Object.entries(threadIndex.descendantIdsById).forEach(
        ([commentId, descendantIds]) => {
          if (commentId === targetId || descendantIds.includes(targetId)) {
            if (next[commentId] !== false) {
              next[commentId] = false;
              changed = true;
            }
          }
        }
      );

      return changed ? next : current;
    });
  }, [thread.replyTargetId, threadIndex.descendantIdsById]);

  function handleToggleCollapse(commentId: string, currentCollapsed: boolean) {
    if (!currentCollapsed) {
      setCollapsedById((current) => ({
        ...current,
        [commentId]: true,
      }));
      return;
    }

    const descendantIds = threadIndex.descendantIdsById[commentId] ?? [];
    setCollapsedById((current) => {
      const next = {
        ...current,
        [commentId]: false,
      };

      descendantIds.forEach((descendantId) => {
        next[descendantId] = false;
      });

      return next;
    });
  }

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
            {thread.submitting ? "Posting..." : "Post comment"}
          </button>
        </div>
      </div>

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
          collapsedById={collapsedById}
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
  );
}

export default FeedCommentThread;
