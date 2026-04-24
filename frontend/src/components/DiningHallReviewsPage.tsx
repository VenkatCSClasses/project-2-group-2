import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import FeedPostCard from './feed/FeedPostCard'
import { collectCommentSubtreeIds } from './feed/commentThread'
import type {
  FoodItem,
  PlaceKey,
  Post,
  PostDetailsResponse,
  ThreadState,
  VoteSelection,
  ViewerRole,
} from './feed/types'
import { createInitialThreadState } from './feed/utils'
import './FeedPage.css'
import './DiningHallReviewsPage.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const PLACE_NAMES: Record<PlaceKey, string> = {
  campus: 'Campus Center Dining Hall',
  terrace: 'Terrace Dining Hall',
}

type DiningHallReviewsPageProps = {
  token: string
  onBack: () => void
}

type SortMode = 'highest' | 'lowest' | 'az'

function DiningHallReviewsPage({ token, onBack }: DiningHallReviewsPageProps) {
  const [selectedPlace, setSelectedPlace] = useState<PlaceKey>('campus')
  const [sortMode, setSortMode] = useState<SortMode>('highest')
  const [searchQuery, setSearchQuery] = useState('')

  const [menuItems, setMenuItems] = useState<FoodItem[]>([])
  const [menuLoading, setMenuLoading] = useState(false)
  const [menuError, setMenuError] = useState('')

  const [selectedItem, setSelectedItem] = useState<FoodItem | null>(null)
  const [reviews, setReviews] = useState<Post[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [reviewsError, setReviewsError] = useState('')

  const [threadStates, setThreadStates] = useState<Record<string, ThreadState>>({})
  const [message, setMessage] = useState('')
  const [currentUsername, setCurrentUsername] = useState('')
  const [currentUserRole, setCurrentUserRole] = useState<ViewerRole>('')

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

  function updateReviewCommentCount(postId: string, commentCount: number) {
    setReviews((current) =>
      current.map((post) =>
        post.id === postId ? { ...post, comment_count: commentCount } : post
      )
    )
  }

  function getReviewCommentCount(postId: string): number {
    return reviews.find((post) => post.id === postId)?.comment_count ?? 0
  }

  const loadAllPlaceReviews = useCallback(
    async (placeKey: PlaceKey) => {
      setSelectedItem(null)
      setReviewsLoading(true)
      setReviewsError('')
      setReviews([])
      setThreadStates({})

      try {
        const placeName = PLACE_NAMES[placeKey]
        const response = await fetch(
          `${API_BASE_URL}/posts/?place=${encodeURIComponent(placeName)}&start=0&limit=100`,
          {
            headers: authHeaders,
          }
        )
        const data = await response.json()

        if (!response.ok) {
          setReviewsError('Could not load dining hall reviews')
          return
        }

        setReviews(data.posts ?? [])
      } catch (error) {
        console.error(error)
        setReviewsError('Network error while loading dining hall reviews')
      } finally {
        setReviewsLoading(false)
      }
    },
    [authHeaders]
  )

  const loadMenu = useCallback(
    async (placeKey: PlaceKey) => {
      setMenuLoading(true)
      setMenuError('')
      setSelectedItem(null)
      setReviewsError('')

      try {
        const placeName = PLACE_NAMES[placeKey]
        const response = await fetch(
          `${API_BASE_URL}/items/by-place/${encodeURIComponent(placeName)}`
        )
        const data = await response.json()

        if (!response.ok) {
          setMenuItems([])
          setMenuError('Could not load dining hall items')
          return
        }

        setMenuItems(data.items ?? [])
        void loadAllPlaceReviews(placeKey)
      } catch (error) {
        console.error(error)
        setMenuItems([])
        setMenuError('Network error while loading dining hall items')
      } finally {
        setMenuLoading(false)
      }
    },
    [loadAllPlaceReviews]
  )

  useEffect(() => {
    void loadMenu(selectedPlace)
  }, [loadMenu, selectedPlace])

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch(`${API_BASE_URL}/accounts/me`, {
          headers: authHeaders,
        })
        const data = await response.json()

        if (response.ok && data?.username) {
          setCurrentUsername(data.username)
        }
        if (response.ok && data?.account_info?.role) {
          setCurrentUserRole(data.account_info.role as ViewerRole)
        }
      } catch (error) {
        console.error('Failed to load user info', error)
      }
    }

    void loadUser()
  }, [authHeaders])

  async function loadItemReviews(item: FoodItem) {
    setSelectedItem(item)
    setReviewsLoading(true)
    setReviewsError('')
    setReviews([])
    setThreadStates({})

    try {
      const response = await fetch(
        `${API_BASE_URL}/items/${item.id}/reviews?start=0&limit=100`,
        {
          headers: authHeaders,
        }
      )
      const data = await response.json()

      if (!response.ok) {
        setReviewsError('Could not load reviews for this item')
        return
      }

      setReviews(data.reviews ?? [])
    } catch (error) {
      console.error(error)
      setReviewsError('Network error while loading reviews')
    } finally {
      setReviewsLoading(false)
    }
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
      updateReviewCommentCount(postId, data.count ?? comments.length)
    } catch (error) {
      console.error(error)
      updateThreadState(postId, (current) => ({
        ...current,
        loading: false,
        error: 'Network error while loading comments',
      }))
    }
  }

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

      setReviews((current) =>
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

      setReviews((current) => current.filter((post) => post.id !== postId))
      setThreadStates((current) => {
        if (!(postId in current)) return current
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
        getReviewCommentCount(postId) - removedCount
      )
      updateReviewCommentCount(postId, nextCommentCount)
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

      const nextCommentCount = getReviewCommentCount(postId) + 1
      updateReviewCommentCount(postId, nextCommentCount)
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

  const sortedMenuItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    const filtered = menuItems.filter((item) => {
      const name = item.name?.toLowerCase() ?? ''
      const description = item.description?.toLowerCase() ?? ''
      return name.includes(query) || description.includes(query)
    })

    const next = [...filtered]

    if (sortMode === 'highest') {
      next.sort((a, b) => {
        const aRating = a.average_rating ?? -1
        const bRating = b.average_rating ?? -1
        return bRating - aRating || a.name.localeCompare(b.name)
      })
    } else if (sortMode === 'lowest') {
      next.sort((a, b) => {
        const aRating = a.average_rating ?? Number.MAX_SAFE_INTEGER
        const bRating = b.average_rating ?? Number.MAX_SAFE_INTEGER
        return aRating - bRating || a.name.localeCompare(b.name)
      })
    } else {
      next.sort((a, b) => a.name.localeCompare(b.name))
    }

    return next
  }, [menuItems, sortMode, searchQuery])

  function renderReviewCards(emptyMessage: string) {
    return (
      <div className="dining-review-cards-scroll">
        {reviewsLoading && <p className="panel-status">Loading reviews...</p>}
        {reviewsError && <p className="panel-status error">{reviewsError}</p>}
        {message && <p className="panel-status">{message}</p>}
        {!reviewsLoading && !reviewsError && reviews.length === 0 && (
          <p className="panel-status">{emptyMessage}</p>
        )}

        {reviews.map((post) => {
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
              onSubmitComment={(parentId) => void submitComment(post.id, parentId)}
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
      </div>
    )
  }

  return (
    <main className="dining-reviews-page">
      <div className="dining-reviews-shell">
        <header className="dining-reviews-header">
          <button
            type="button"
            className="dining-reviews-back-button"
            onClick={onBack}
          >
            <ArrowLeft size={24} />
          </button>

          <h1 className="dining-reviews-title">Dining Hall Reviews</h1>
        </header>

        <div className="dining-reviews-controls">
          <div className="hall-selector">
            <button
              type="button"
              className={`hall-selector-button ${
                selectedPlace === 'campus' ? 'active' : ''
              }`}
              onClick={() => setSelectedPlace('campus')}
            >
              Campus Center
            </button>

            <button
              type="button"
              className={`hall-selector-button ${
                selectedPlace === 'terrace' ? 'active' : ''
              }`}
              onClick={() => setSelectedPlace('terrace')}
            >
              Terraces
            </button>
          </div>

          <div className="sort-row">
            <label htmlFor="review-item-sort" className="sort-label">
              Sort by
            </label>
            <select
              id="review-item-sort"
              className="sort-select"
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
            >
              <option value="highest">Highest stars</option>
              <option value="lowest">Lowest stars</option>
              <option value="az">A–Z</option>
            </select>
          </div>
        </div>

        <div className="dining-search-row">
          <input
            className="dining-search-input"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search food items..."
          />
        </div>

        <div className="dining-reviews-layout">
          <section className="dining-items-panel">
            <div className="panel-heading-row">
              <h2 className="panel-title">
                {selectedPlace === 'campus'
                  ? 'Campus Center Items'
                  : 'Terraces Items'}
              </h2>
              <span className="panel-subtitle">{sortedMenuItems.length} items</span>
            </div>

            <div className="dining-items-scroll">
              {menuLoading && <p className="panel-status">Loading items...</p>}
              {menuError && <p className="panel-status error">{menuError}</p>}
              {!menuLoading && !menuError && sortedMenuItems.length === 0 && (
                <p className="panel-status">No items found.</p>
              )}

              {sortedMenuItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`review-menu-item-card ${
                    selectedItem?.id === item.id ? 'selected' : ''
                  }`}
                  onClick={() => {
                    if (selectedItem?.id === item.id) {
                      void loadAllPlaceReviews(selectedPlace)
                      return
                    }
                  
                    void loadItemReviews(item)
                  }}
                >
                  <div className="review-menu-item-top">
                    <h3>{item.name}</h3>
                    <span className="review-menu-item-rating">
                      {typeof item.average_rating === 'number'
                        ? `${(item.average_rating / 2).toFixed(1)}★`
                        : 'No ratings'}
                    </span>
                  </div>

                  {item.description && (
                    <p className="review-menu-item-description">
                      {item.description}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </section>

          <section className="dining-review-cards-panel">
            {!selectedItem ? (
              <>
                <div className="selected-item-header">
                  <div>
                    <h2 className="selected-item-title">
                      {selectedPlace === 'campus'
                        ? 'All Campus Center Reviews'
                        : 'All Terraces Reviews'}
                    </h2>
                  </div>
                </div>

                {renderReviewCards('No reviews found for this dining hall.')}
              </>
            ) : (
              <>
                <div className="selected-item-header">
                  <div>
                    <h2 className="selected-item-title">{selectedItem.name}</h2>
                    <p className="selected-item-rating">
                      {typeof selectedItem.average_rating === 'number'
                        ? `${(selectedItem.average_rating / 2).toFixed(1)}★ average`
                        : 'No ratings yet'}
                    </p>
                  </div>

                  <button
                    type="button"
                    className="clear-selected-item-button"
                    onClick={() => void loadAllPlaceReviews(selectedPlace)}
                  >
                    Show all reviews
                  </button>
                </div>

                {renderReviewCards('No reviews for this item yet.')}
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}

export default DiningHallReviewsPage