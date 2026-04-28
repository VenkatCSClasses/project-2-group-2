import { useCallback, useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'
import './App.css'
import FeedPage from './components/FeedPage'
import ProfilePicturePage from './components/ProfilePicturePage'
import RatingUploadPage from './components/RatingUploadPage'
import AuthPage from './components/AuthPage'
import ProfilePage from './components/ProfilePage'
import DiningHallReviewsPage from './components/DiningHallReviewsPage'
import ReportedPostsPage from './components/ReportedPostsPage'

type UploadSelection = {
  diningHall: string
  itemId?: string
  itemName?: string
}

type TokenInfo = {
  exp?: number
}

const getCookie = (name: string) => {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? match[2] : null
}

function LogoutRoute({ onLogout }: { onLogout: () => void }) {
  useEffect(() => {
    onLogout()
  }, [onLogout])

  return null
}

function App() {
  const navigate = useNavigate()
  const [token, setToken] = useState<string | null>(getCookie('accessToken'))
  const [showPfpSetup, setShowPfpSetup] = useState(false)
  const [uploadSelection, setUploadSelection] = useState<UploadSelection>({
    diningHall: '',
    itemId: '',
    itemName: '',
  })

  const handleLogout = useCallback(() => {
    document.cookie = 'accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict;'
    setToken(null)
    setShowPfpSetup(false)
    navigate('/login', { replace: true })
  }, [navigate])

  useEffect(() => {
    if (!token) {
      return
    }

    let millisecondsUntilExpiry = 0

    try {
      const { exp } = jwtDecode<TokenInfo>(token)

      if (!exp) {
        throw new Error('Token is missing an expiration')
      }

      millisecondsUntilExpiry = Math.max(0, exp * 1000 - Date.now())
    } catch (error) {
      console.error('Failed to decode auth token', error)
    }

    const timeoutId = window.setTimeout(handleLogout, millisecondsUntilExpiry)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [handleLogout, token])

  if (showPfpSetup && token) {
    return (
      <ProfilePicturePage
        token={token}
        onComplete={() => {
          setShowPfpSetup(false)
          navigate('/feed')
        }}
      />
    )
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to={token ? "/feed" : "/login"} replace />} />
      <Route path="/logout" element={<LogoutRoute onLogout={handleLogout} />} />

      {!token ? (
        <>
          <Route
            path="/login"
            element={
              <AuthPage
                onAuthSuccess={(newToken) => {
                  setToken(newToken)
                  navigate('/feed')
                }}
                onRegisterSuccess={(newToken) => {
                  setToken(newToken)
                  setShowPfpSetup(true)
                }}
              />
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </>
      ) : (
        <>
          <Route path="/login" element={<Navigate to="/feed" replace />} />
          <Route
            path="/feed"
            element={
              <FeedPage
                token={token}
                onAuthExpired={handleLogout}
                onOpenUpload={(selection) => {
                  setUploadSelection(selection)
                  navigate('/upload')
                }}
                onOpenProfile={(username) => navigate(`/profile/${encodeURIComponent(username)}`)}
                onOpenDiningReviews={() => navigate('/dining-reviews')}
                onOpenReportedPosts={() => navigate('/reported-posts')}
              />
            }
          />
          <Route
            path="/profile/:username"
            element={<ProfilePage token={token} onBack={() => navigate('/feed')} />}
          />
          <Route
            path="/reported-posts"
            element={<ReportedPostsPage token={token} onBack={() => navigate('/feed')} />}
          />
          <Route
            path="/dining-reviews"
            element={<DiningHallReviewsPage token={token} onBack={() => navigate('/feed')} />}
          />
          <Route
            path="/upload"
            element={
              <main className="app-shell">
                <RatingUploadPage
                  token={token}
                  onBack={() => navigate('/feed')}
                  initialDiningHall={uploadSelection.diningHall}
                  initialItemId={uploadSelection.itemId}
                  initialItemName={uploadSelection.itemName}
                />
              </main>
            }
          />
          <Route path="*" element={<Navigate to="/feed" replace />} />
        </>
      )}
    </Routes>
  )
}

export default App
