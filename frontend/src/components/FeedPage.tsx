import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, User, Flame, Clock } from 'lucide-react'
import FeedPostCard from './feed/FeedPostCard'
import { collectCommentSubtreeIds } from './feed/commentThread'
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
import { createInitialThreadState } from './feed/utils'
import './FeedPage.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const PLACE_NAMES: Record<PlaceKey, string> = {
  campus: 'Campus Center Dining Hall',
  terrace: 'Terrace Dining Hall',
}

function FeedPage({
  token,
  onOpenUpload,
  onOpenProfile,
  onOpenDiningReviews,
}: FeedPageProps) {
  const [posts, setPosts] = useState<Post[]>([])
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
  const [currentUsername, setCurrentUsername] = useState('')
  const [currentUserRole, setCurrentUserRole] = useState<ViewerRole>('')
  const [isDesktop, setIsDesktop] = useState(false)
  const authHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : undefined),
    [token]
  )

  const jsonHeaders = useMemo(
    () => ({
      ...(authHeaders ?? {}),
      'Content-Type': 'application/json',
    }),
    [authHeaders]
  )

  function updateThreadState(
    postId: string,
    updater: (current: ThreadState) => ThreadState
  ) {
    setThreadStates((current) => ({
      ...current,
      [postId]: updater(current[postId] ?? createInitialThreadState()),
    }))
  }

  function getThread(
    postId: string,
    source: Record<string, ThreadState> = threadStates
  ): ThreadState {
    return source[postId] ?? createInitialThreadState()
  }

  function updatePostCommentCount(postId: string, commentCount: number) {
    setPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? {
              ...post,
              comment_count: commentCount,
            }
          : post
      )
    )
  }

  function getPostCommentCount(postId: string): number {
    return posts.find((post) => post.id === postId)?.comment_count ?? 0
  }

  async function loadPostDetails(postId: string) {
    updateThreadState(postId, (current) => ({
      ...current,
      loading: true,
      error: '',
    }))

    try {
      const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
        headers: authHeaders,
      })
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
      updatePostCommentCount(postId, data.count ?? comments.length)
    } catch (error) {
      console.error(error)
      updateThreadState(postId, (current) => ({
        ...current,
        loading: false,
        error: 'Network error while loading comments',
      }))
    }
  }

  const loadPosts = useCallback(async () => {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch(`${API_BASE_URL}/posts/`, {
        headers: authHeaders,
      })
      const data: PostsResponse = await response.json()

      if (!response.ok) {
        setMessage('Failed to load feed')
        setPosts([])
        return
      }

      setPosts(data.posts ?? [])
    } catch (error) {
      console.error(error)
      setMessage('Network error while loading feed')
      setPosts([])
    } finally {
      setLoading(false)
    }
  }, [authHeaders])

  const loadMenu = useCallback(async (placeKey: PlaceKey) => {
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
  }, [])

  useEffect(() => {
    void loadPosts()

    async function loadUser() {
      try {
        const response = await fetch(`${API_BASE_URL}/accounts/me`, {
          headers: authHeaders,
        })
        const data = await response.json()

        if (response.ok && data?.username) {
          setCurrentUsername(data.username)
        }
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
  }, [authHeaders, loadPosts])

  const shouldShowMenu = isDesktop || isMenuOpen

  useEffect(() => {
    if (shouldShowMenu) {
      void loadMenu(selectedPlace)
    }
  }, [shouldShowMenu, loadMenu, selectedPlace])

  useEffect(() => {
    function checkScreenSize() {
      setIsDesktop(window.innerWidth >= 900)
    }
  
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
  
    return () => {
      window.removeEventListener('resize', checkScreenSize)
    }
  }, [])

  async function handleVote(postId: string, vote: VoteSelection) {
    try {
      const response = await fetch(`${API_BASE_URL}/posts/${postId}/vote`, {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify({ vote }),
      })

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
                viewer_vote: data.viewer_vote ?? vote,
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
    vote: VoteSelection
  ) {
    updateThreadState(postId, (current) => ({
      ...current,
      error: '',
    }))

    try {
      const response = await fetch(
        `${API_BASE_URL}/posts/comments/${commentId}/vote`,
        {
          method: 'POST',
          headers: jsonHeaders,
          body: JSON.stringify({ vote }),
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
                viewer_vote: data.viewer_vote ?? vote,
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
        headers: authHeaders,
      })

      if (!response.ok) {
        setMessage('Could not remove post')
        return
      }

      setPosts((current) => current.filter((post) => post.id !== postId))
      setThreadStates((current) => {
        if (!(postId in current)) {
          return current
        }

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
        headers: authHeaders,
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
    updateThreadState(postId, (current) => ({
      ...current,
      error: '',
    }))

    try {
      const response = await fetch(
        `${API_BASE_URL}/posts/comments/${commentId}/delete`,
        {
          method: 'POST',
          headers: authHeaders,
        }
      )

      if (!response.ok) {
        updateThreadState(postId, (current) => ({
          ...current,
          error: 'Could not remove comment',
        }))
        return
      }

      const idsToRemove = collectCommentSubtreeIds(
        getThread(postId).comments,
        commentId
      )
      const removedCount = idsToRemove.size

      updateThreadState(postId, (current) => ({
        ...current,
        comments: current.comments.filter(
          (comment) => !idsToRemove.has(comment.id)
        ),
        replyDrafts: Object.fromEntries(
          Object.entries(current.replyDrafts).filter(
            ([id]) => !idsToRemove.has(id)
          )
        ),
        replyTargetId:
          current.replyTargetId && idsToRemove.has(current.replyTargetId)
            ? null
            : current.replyTargetId,
      }))

      const nextCommentCount = Math.max(
        0,
        getPostCommentCount(postId) - removedCount
      )
      updatePostCommentCount(postId, nextCommentCount)
    } catch (error) {
      console.error(error)
      updateThreadState(postId, (current) => ({
        ...current,
        error: 'Network error while removing comment',
      }))
    }
  }

  async function handleReportComment(postId: string, commentId: string) {
    updateThreadState(postId, (current) => ({
      ...current,
      error: '',
    }))

    try {
      const response = await fetch(
        `${API_BASE_URL}/posts/comments/${commentId}/report`,
        {
          method: 'POST',
          headers: authHeaders,
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
          headers: authHeaders,
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

      const nextCommentCount = getPostCommentCount(postId) + 1
      updatePostCommentCount(postId, nextCommentCount)
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

    if (shouldOpen && !thread.loading) {
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
            onClick={() => setIsMenuOpen((current) => !current)}
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
            {filterMode === 'latest' ? (
              <>
                <Clock size={18} />
                <span>Latest</span>
              </>
            ) : (
              <>
                <Flame size={18} />
                <span>Top</span>
              </>
            )}
          </button>

          <button
            className="profile-button"
            type="button"
            aria-label="Profile"
            onClick={onOpenProfile}
          >
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
              <span className="profile-circle"><User size={20} /></span>
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
                commentCount={post.comment_count ?? 0}
                viewerRole={currentUserRole}
                viewerUsername={currentUsername}
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

        {isUploadPopupOpen && (
          <div
            className="upload-popup-overlay"
            onClick={() => setIsUploadPopupOpen(false)}
          >
            <div
              className="floating-add-wrapper"
              onClick={(e) => e.stopPropagation()}
            >
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

              <button
                className="floating-add-button has-circular-bg"
                type="button"
                onClick={() => setIsUploadPopupOpen(false)}
              >
                <Plus size={24} />
              </button>
            </div>
          </div>
        )}

        {!isUploadPopupOpen && (
          <div className="floating-add-wrapper">
            <button
              className="floating-add-button has-circular-bg"
              type="button"
              onClick={() => setIsUploadPopupOpen(true)}
            >
              <Plus size={24} />
            </button>
          </div>
        )}
      </div>

      {shouldShowMenu && (
        <div
          className={`menu-overlay ${isDesktop ? 'menu-overlay-desktop' : ''}`}
          onClick={() => {
            if (!isDesktop) {
              setIsMenuOpen(false)
            }
          }}
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

            <button
              type="button"
              className="menu-review-page-button"
              onClick={() => {
                setIsMenuOpen(false)
                onOpenDiningReviews()
              }}
            >
              Open Dining Hall Review Page
            </button>

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