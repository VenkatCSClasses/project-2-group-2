import { useEffect, useMemo, useState } from 'react'
import FeedPostCard from './feed/FeedPostCard'
import {
  createInitialThreadState,
} from './feed/utils'
import type {
  FeedPageProps,
  FoodItem,
  PlaceKey,
  PlaceResponse,
  Post,
  PostDetailsResponse,
  PostsResponse,
  ThreadState,
  VoteSelection,
  ViewerRole,
} from './feed/types'
import './FeedPage.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const PLACE_NAMES: Record<PlaceKey, string> = {
  campus: 'Campus Center Dining Hall',
  terrace: 'Terrace Dining Hall',
}

function FeedPage({ token, onOpenUpload }: FeedPageProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({})
  const [threadStates, setThreadStates] = useState<Record<string, ThreadState>>(
    {}
  )
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [filterMode, setFilterMode] = useState<'latest' | 'top'>('latest')

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [selectedPlace, setSelectedPlace] = useState<PlaceKey>('campus')
  const [menuItems, setMenuItems] = useState<FoodItem[]>([])
  const [menuLoading, setMenuLoading] = useState(false)
  const [menuError, setMenuError] = useState('')
  const [isUploadPopupOpen, setIsUploadPopupOpen] = useState(false)
  const [currentUserPfp, setCurrentUserPfp] = useState<string | null>(null)
  const [currentUserRole, setCurrentUserRole] = useState<ViewerRole>('')

  function updateThreadState(
    postId: string,
    updater: (current: ThreadState) => ThreadState
  ) {
    setThreadStates((current) => {
      const next = current[postId] ?? createInitialThreadState()
      return {
        ...current,
        [postId]: updater(next),
      }
    })
  }

  function getThread(postId: string): ThreadState {
    return threadStates[postId] ?? createInitialThreadState()
  }

  function getCommentCount(postId: string): number {
    return commentCounts[postId] ?? getThread(postId).comments.length ?? 0
  }

  async function loadPostDetails(postId: string) {
    updateThreadState(postId, (current) => ({
      ...current,
      loading: true,
      error: '',
    }))

    try {
      const response = await fetch(`${API_BASE_URL}/posts/${postId}`)
      const data: PostDetailsResponse = await response.json()

      if (!response.ok) {
        updateThreadState(postId, (current) => ({
          ...current,
          loading: false,
          error: 'Could not load comments',
        }))
        return
      }

      const comments = data.comments ?? []

      updateThreadState(postId, (current) => ({
        ...current,
        loading: false,
        loaded: true,
        comments,
        error: '',
      }))
      setCommentCounts((current) => ({
        ...current,
        [postId]: data.count ?? comments.length,
      }))
    } catch (error) {
      console.error(error)
      updateThreadState(postId, (current) => ({
        ...current,
        loading: false,
        error: 'Network error while loading comments',
      }))
    }
  }

  async function loadPosts() {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch(`${API_BASE_URL}/posts/`)
      const data: PostsResponse = await response.json()

      if (!response.ok) {
        setMessage('Failed to load feed')
        setPosts([])
        return
      }

      const nextPosts = data.posts ?? []
      setPosts(nextPosts)

      const countsEntries = await Promise.all(
        nextPosts.map(async (post) => {
          try {
            const detailResponse = await fetch(`${API_BASE_URL}/posts/${post.id}`)
            const detailData: PostDetailsResponse = await detailResponse.json()
            return [post.id, detailData.count ?? 0] as const
          } catch {
            return [post.id, 0] as const
          }
        })
      )

      setCommentCounts(Object.fromEntries(countsEntries))
    } catch (error) {
      console.error(error)
      setMessage('Network error while loading feed')
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  async function loadMenu(placeKey: PlaceKey) {
    setMenuLoading(true)
    setMenuError('')

    try {
      const placeName = PLACE_NAMES[placeKey]
      const response = await fetch(
        `${API_BASE_URL}/places/${encodeURIComponent(placeName)}`
      )
      const data: PlaceResponse = await response.json()

      if (!response.ok) {
        setMenuItems([])
        setMenuError('Could not load today’s menu')
        return
      }

      setMenuItems(data.place_info.food_items ?? [])
    } catch (error) {
      console.error(error)
      setMenuItems([])
      setMenuError('Network error while loading menu')
    } finally {
      setMenuLoading(false)
    }
  }

  useEffect(() => {
    void loadPosts()

    async function loadUser() {
      try {
        const response = await fetch(`${API_BASE_URL}/accounts/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        const data = await response.json()
        if (response.ok && data?.account_info?.profile_picture) {
          setCurrentUserPfp(data.account_info.profile_picture)
        }
        if (response.ok && data?.account_info?.role) {
          setCurrentUserRole(data.account_info.role as ViewerRole)
        }
      } catch (error) {
        console.error('Failed to load user info', error)
      }
    }

    void loadUser()
  }, [token])

  useEffect(() => {
    if (isMenuOpen) {
      void loadMenu(selectedPlace)
    }
  }, [isMenuOpen, selectedPlace])

  async function handleVote(postId: string, upvote: boolean) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/posts/${postId}/vote?upvote=${upvote}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        setMessage('Could not save vote')
        return
      }

      const data = await response.json()

      setPosts((current) =>
        current.map((post) =>
          post.id === postId
            ? {
                ...post,
                upvotes: data.upvotes ?? post.upvotes,
                downvotes: data.downvotes ?? post.downvotes,
                viewer_vote:
                  data.viewer_vote ??
                  ((upvote ? 'up' : 'down') as VoteSelection),
              }
            : post
        )
      )
    } catch (error) {
      console.error(error)
      setMessage('Network error while voting')
    }
  }

  async function handleCommentVote(
    postId: string,
    commentId: string,
    upvote: boolean
  ) {
    updateThreadState(postId, (current) => ({ ...current, error: '' }))

    try {
      const response = await fetch(
        `${API_BASE_URL}/posts/comments/${commentId}/vote?upvote=${upvote}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        updateThreadState(postId, (current) => ({
          ...current,
          error: 'Could not save comment vote',
        }))
        return
      }

      const data = await response.json()

      updateThreadState(postId, (current) => ({
        ...current,
        comments: current.comments.map((comment) =>
          comment.id === commentId
            ? {
                ...comment,
                upvotes: data.upvotes ?? comment.upvotes,
                downvotes: data.downvotes ?? comment.downvotes,
                viewer_vote:
                  data.viewer_vote ??
                  ((upvote ? 'up' : 'down') as VoteSelection),
              }
            : comment
        ),
      }))
    } catch (error) {
      console.error(error)
      updateThreadState(postId, (current) => ({
        ...current,
        error: 'Network error while voting on comment',
      }))
    }
  }

  async function handleDeletePost(postId: string) {
    setMessage('')

    try {
      const response = await fetch(`${API_BASE_URL}/posts/${postId}/delete`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        setMessage('Could not remove post')
        return
      }

      setPosts((current) => current.filter((post) => post.id !== postId))
      setCommentCounts((current) => {
        const next = { ...current }
        delete next[postId]
        return next
      })
      setThreadStates((current) => {
        const next = { ...current }
        delete next[postId]
        return next
      })
    } catch (error) {
      console.error(error)
      setMessage('Network error while removing post')
    }
  }

  async function handleReportPost(postId: string) {
    setMessage('')

    try {
      const response = await fetch(`${API_BASE_URL}/posts/${postId}/report`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        setMessage('Could not report post')
        return
      }

      setMessage('Post reported')
    } catch (error) {
      console.error(error)
      setMessage('Network error while reporting post')
    }
  }

  async function handleDeleteComment(postId: string, commentId: string) {
    updateThreadState(postId, (current) => ({ ...current, error: '' }))

    try {
      const response = await fetch(
        `${API_BASE_URL}/posts/comments/${commentId}/delete`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        updateThreadState(postId, (current) => ({
          ...current,
          error: 'Could not remove comment',
        }))
        return
      }

      let removedCount = 0

      updateThreadState(postId, (current) => {
        const idsToRemove = new Set<string>([commentId])
        let changed = true

        while (changed) {
          changed = false
          for (const comment of current.comments) {
            if (comment.parent_id && idsToRemove.has(comment.parent_id) && !idsToRemove.has(comment.id)) {
              idsToRemove.add(comment.id)
              changed = true
            }
          }
        }

        const nextComments = current.comments.filter(
          (comment) => !idsToRemove.has(comment.id)
        )
        removedCount = idsToRemove.size
        const nextReplyDrafts = { ...current.replyDrafts }
        for (const id of idsToRemove) {
          delete nextReplyDrafts[id]
        }

        return {
          ...current,
          comments: nextComments,
          replyDrafts: nextReplyDrafts,
          replyTargetId:
            current.replyTargetId && idsToRemove.has(current.replyTargetId)
              ? null
              : current.replyTargetId,
        }
      })

      setCommentCounts((current) => ({
        ...current,
        [postId]: Math.max(0, (current[postId] ?? 0) - removedCount),
      }))
    } catch (error) {
      console.error(error)
      updateThreadState(postId, (current) => ({
        ...current,
        error: 'Network error while removing comment',
      }))
    }
  }

  async function handleReportComment(postId: string, commentId: string) {
    updateThreadState(postId, (current) => ({ ...current, error: '' }))

    try {
      const response = await fetch(
        `${API_BASE_URL}/posts/comments/${commentId}/report`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        updateThreadState(postId, (current) => ({
          ...current,
          error: 'Could not report comment',
        }))
        return
      }

      updateThreadState(postId, (current) => ({
        ...current,
        error: 'Comment reported',
      }))
    } catch (error) {
      console.error(error)
      updateThreadState(postId, (current) => ({
        ...current,
        error: 'Network error while reporting comment',
      }))
    }
  }

  async function submitComment(postId: string, parentId?: string) {
    const thread = getThread(postId)
    const draft = parentId
      ? thread.replyDrafts[parentId]?.trim() ?? ''
      : thread.draft.trim()

    if (!draft) {
      updateThreadState(postId, (current) => ({
        ...current,
        error: 'Comment cannot be empty',
      }))
      return
    }

    updateThreadState(postId, (current) => ({
      ...current,
      error: '',
      submitting: parentId ? current.submitting : true,
      submittingReplyId: parentId ?? current.submittingReplyId,
    }))

    const params = new URLSearchParams({ comment: draft })
    if (parentId) {
      params.set('parent_id', parentId)
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/posts/${postId}/comment?${params.toString()}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      const data = await response.json()

      if (!response.ok) {
        updateThreadState(postId, (current) => ({
          ...current,
          submitting: false,
          submittingReplyId: null,
          error: 'Could not post comment',
        }))
        return
      }

      updateThreadState(postId, (current) => {
        const nextReplyDrafts = { ...current.replyDrafts }
        if (parentId) {
          delete nextReplyDrafts[parentId]
        }

        return {
          ...current,
          loaded: true,
          submitting: false,
          submittingReplyId: null,
          comments: [...current.comments, data.comment],
          draft: parentId ? current.draft : '',
          replyDrafts: nextReplyDrafts,
          replyTargetId: parentId ? null : current.replyTargetId,
          error: '',
        }
      })

      setCommentCounts((current) => ({
        ...current,
        [postId]: (current[postId] ?? 0) + 1,
      }))
    } catch (error) {
      console.error(error)
      updateThreadState(postId, (current) => ({
        ...current,
        submitting: false,
        submittingReplyId: null,
        error: 'Network error while posting comment',
      }))
    }
  }

  async function toggleComments(postId: string) {
    const thread = getThread(postId)
    const shouldOpen = !thread.isOpen

    updateThreadState(postId, (current) => ({
      ...current,
      isOpen: shouldOpen,
      error: shouldOpen ? current.error : '',
      replyTargetId: shouldOpen ? current.replyTargetId : null,
    }))

    if (shouldOpen && !thread.loaded && !thread.loading) {
      await loadPostDetails(postId)
    }
  }

  function handleUploadChoice(placeKey: PlaceKey) {
    setIsUploadPopupOpen(false)
    onOpenUpload({
      diningHall: PLACE_NAMES[placeKey],
    })
  }

  function handleMenuItemClick(item: FoodItem) {
    setIsMenuOpen(false)
    onOpenUpload({
      diningHall: PLACE_NAMES[selectedPlace],
      itemId: item.id,
      itemName: item.name,
    })
  }

  const visiblePosts = useMemo(() => {
    const next = [...posts]

    if (filterMode === 'top') {
      next.sort((a, b) => {
        const scoreA = a.upvotes - a.downvotes
        const scoreB = b.upvotes - b.downvotes
        return scoreB - scoreA
      })
      return next
    }

    next.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    return next
  }, [posts, filterMode])

  return (
    <>
      <div className="feed-page">
        <header className="feed-topbar">
          <button
            className="icon-button"
            type="button"
            aria-label="Open menu"
            onClick={() => setIsMenuOpen(true)}
          >
            <span className="hamburger-icon">
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>

          <button
            className="filter-button"
            type="button"
            onClick={() =>
              setFilterMode((current) =>
                current === 'latest' ? 'top' : 'latest'
              )
            }
          >
            {filterMode === 'latest' ? 'Latest' : 'Top'}
          </button>

          <button className="profile-button" type="button" aria-label="Profile">
            {currentUserPfp ? (
              <img
                src={
                  currentUserPfp.startsWith('http')
                    ? currentUserPfp
                    : `${API_BASE_URL}${currentUserPfp}`
                }
                alt="Profile"
                className="profile-circle-img"
              />
            ) : (
              <span className="profile-circle">👤</span>
            )}
          </button>
        </header>

        <main className="feed-list">
          {loading && <p className="feed-message">Loading feed...</p>}
          {message && <p className="feed-message">{message}</p>}
          {!loading && visiblePosts.length === 0 && (
            <p className="feed-message">No posts yet.</p>
          )}

          {visiblePosts.map((post) => {
            const thread = getThread(post.id)

            return (
              <FeedPostCard
                key={post.id}
                post={post}
                apiBaseUrl={API_BASE_URL}
                thread={thread}
                commentCount={getCommentCount(post.id)}
                viewerRole={currentUserRole}
                onToggleComments={() => void toggleComments(post.id)}
                onVote={(upvote) => void handleVote(post.id, upvote)}
                onDeletePost={() => void handleDeletePost(post.id)}
                onReportPost={() => void handleReportPost(post.id)}
                onDraftChange={(value) =>
                  updateThreadState(post.id, (current) => ({
                    ...current,
                    draft: value,
                  }))
                }
                onReplyDraftChange={(commentId, value) =>
                  updateThreadState(post.id, (current) => ({
                    ...current,
                    replyDrafts: {
                      ...current.replyDrafts,
                      [commentId]: value,
                    },
                  }))
                }
                onReplyToggle={(commentId) =>
                  updateThreadState(post.id, (current) => ({
                    ...current,
                    replyTargetId:
                      current.replyTargetId === commentId ? null : commentId,
                    error: '',
                  }))
                }
                onCloseReply={() =>
                  updateThreadState(post.id, (current) => ({
                    ...current,
                    replyTargetId: null,
                  }))
                }
                onSubmitComment={(parentId) =>
                  void submitComment(post.id, parentId)
                }
                onCommentVote={(commentId, upvote) =>
                  void handleCommentVote(post.id, commentId, upvote)
                }
                onDeleteComment={(commentId) =>
                  void handleDeleteComment(post.id, commentId)
                }
                onReportComment={(commentId) =>
                  void handleReportComment(post.id, commentId)
                }
              />
            )
          })}
        </main>

        <div className="floating-add-wrapper">
          {isUploadPopupOpen && (
            <div className="upload-choice-popup">
              <button
                type="button"
                className="upload-choice-button"
                onClick={() => handleUploadChoice('campus')}
              >
                Campus Center
              </button>
              <button
                type="button"
                className="upload-choice-button"
                onClick={() => handleUploadChoice('terrace')}
              >
                Terraces
              </button>
            </div>
          )}

          <button
            className="floating-add-button"
            type="button"
            onClick={() => setIsUploadPopupOpen((current) => !current)}
            aria-label="Create review"
          >
            +
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div
          className="menu-overlay"
          onClick={() => setIsMenuOpen(false)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
              setIsMenuOpen(false)
            }
          }}
        >
          <aside className="menu-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="menu-drawer-header">
              <h2>Today’s Menu</h2>
            </div>

            <div className="menu-place-selector">
              <button
                type="button"
                className={`menu-place-button ${
                  selectedPlace === 'terrace' ? 'active' : ''
                }`}
                onClick={() => setSelectedPlace('terrace')}
              >
                Terrace
              </button>

              <button
                type="button"
                className={`menu-place-button ${
                  selectedPlace === 'campus' ? 'active' : ''
                }`}
                onClick={() => setSelectedPlace('campus')}
              >
                Campus Center
              </button>
            </div>

            <div className="menu-items-list">
              {menuLoading && <p className="menu-status">Loading menu...</p>}
              {menuError && <p className="menu-status">{menuError}</p>}
              {!menuLoading && !menuError && menuItems.length === 0 && (
                <p className="menu-status">No menu items found.</p>
              )}

              {menuItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="menu-item-card menu-item-button"
                  onClick={() => handleMenuItemClick(item)}
                >
                  <div className="menu-item-top">
                    <h3>{item.name}</h3>
                    {typeof item.average_rating === 'number' && (
                      <span className="menu-item-rating">
                        {(item.average_rating / 2).toFixed(1)}★
                      </span>
                    )}
                  </div>

                  {item.description && (
                    <p className="menu-item-description">{item.description}</p>
                  )}
                </button>
              ))}
            </div>
          </aside>
        </div>
      )}
    </>
  )
}

export default FeedPage
