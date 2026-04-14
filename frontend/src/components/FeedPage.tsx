import { useEffect, useMemo, useState } from 'react'
import './FeedPage.css'

const API_BASE_URL = 'http://localhost:8000'

type FeedPageProps = {
  token: string
  onOpenUpload: () => void
}

type Post = {
  id: string
  author_id: string
  author_username: string | null
  food_item_id: string | null
  food_item_name: string | null
  star_rating: number
  content: string | null
  image_url: string | null
  created_at: string
  upvotes: number
  downvotes: number
}

type PostsResponse = {
  start: number
  limit: number
  posts: Post[]
}

type PostDetailsResponse = {
  count: number
}

type FoodItem = {
  id: string
  name: string
  description: string | null
  image_url: string | null
  average_rating: number | null
}

type PlaceResponse = {
  place_id: string
  place_info: {
    id: string
    name: string
    description: string | null
    food_items: FoodItem[]
  }
}

type PlaceKey = 'campus' | 'terrace'

const PLACE_NAMES: Record<PlaceKey, string> = {
  campus: 'Campus Center Dining Hall',
  terrace: 'Terrace Dining Hall',
}

function formatTimeAgo(dateString: string): string {
  const created = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - created.getTime()

  const minutes = Math.floor(diffMs / 60000)
  const hours = Math.floor(diffMs / 3600000)
  const days = Math.floor(diffMs / 86400000)

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m`
  if (hours < 24) return `${hours}h`
  if (days < 7) return `${days}d`

  return created.toLocaleDateString()
}

function renderStars(starRating: number): string {
  const fiveStarValue = starRating / 2
  const fullStars = Math.round(fiveStarValue)
  return '★'.repeat(fullStars) + '☆'.repeat(5 - fullStars)
}

function FeedPage({ token, onOpenUpload }: FeedPageProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [filterMode, setFilterMode] = useState<'latest' | 'top'>('latest')

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [selectedPlace, setSelectedPlace] = useState<PlaceKey>('campus')
  const [menuItems, setMenuItems] = useState<FoodItem[]>([])
  const [menuLoading, setMenuLoading] = useState(false)
  const [menuError, setMenuError] = useState('')

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

      setPosts(data.posts ?? [])

      const countsEntries = await Promise.all(
        (data.posts ?? []).map(async (post) => {
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
  }, [])

  useEffect(() => {
    if (isMenuOpen) {
      void loadMenu(selectedPlace)
    }
  }, [isMenuOpen, selectedPlace])

  async function handleVote(postId: string, upvote: boolean) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/votes/${postId}/vote?upvote=${upvote}`,
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
              }
            : post
        )
      )
    } catch (error) {
      console.error(error)
      setMessage('Network error while voting')
    }
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
            <span className="profile-circle">👤</span>
          </button>
        </header>

        <main className="feed-list">
          {loading && <p className="feed-message">Loading feed...</p>}
          {message && <p className="feed-message">{message}</p>}
          {!loading && visiblePosts.length === 0 && (
            <p className="feed-message">No posts yet.</p>
          )}

          {visiblePosts.map((post) => {
            const username = post.author_username || 'user'
            const avatarLetter = username.charAt(0).toUpperCase()

            return (
              <article key={post.id} className="feed-card">
                <div className="feed-card-header">
                  <div className="feed-avatar">{avatarLetter}</div>

                  <div className="feed-user-meta">
                    <div className="feed-user-row">
                      <span className="feed-username">{username}</span>
                      <span className="feed-time">
                        {formatTimeAgo(post.created_at)}
                      </span>
                    </div>

                    <div className="feed-rating-row">
                      <span className="feed-stars">
                        {renderStars(post.star_rating)}
                      </span>
                      <span className="feed-rating-value">
                        {(post.star_rating / 2).toFixed(1)}
                      </span>
                      {post.food_item_name && (
                        <span className="feed-item-name">
                          · {post.food_item_name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {post.content && (
                  <p className="feed-review-text">{post.content}</p>
                )}

                {post.image_url && (
                  <img
                    className="feed-image"
                    src={
                      post.image_url.startsWith('http')
                        ? post.image_url
                        : `${API_BASE_URL}${post.image_url}`
                    }
                    alt={post.food_item_name || 'Review image'}
                  />
                )}

                <div className="feed-card-footer">
                  <button className="comment-button" type="button">
                    💬 {commentCounts[post.id] ?? 0}
                  </button>

                  <div className="vote-group">
                    <button
                      className="vote-button"
                      type="button"
                      onClick={() => void handleVote(post.id, true)}
                    >
                      ⬆ {post.upvotes}
                    </button>

                    <button
                      className="vote-button"
                      type="button"
                      onClick={() => void handleVote(post.id, false)}
                    >
                      ⬇ {post.downvotes}
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </main>

        <button
          className="floating-add-button"
          type="button"
          onClick={onOpenUpload}
          aria-label="Create review"
        >
          +
        </button>
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
          <aside
            className="menu-drawer"
            onClick={(e) => e.stopPropagation()}
          >
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
                <div key={item.id} className="menu-item-card">
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
                </div>
              ))}
            </div>
          </aside>
        </div>
      )}
    </>
  )
}

export default FeedPage