import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
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

function App() {
  const navigate = useNavigate()
  const [token, setToken] = useState<string | null>(localStorage.getItem('accessToken'))
  const [showPfpSetup, setShowPfpSetup] = useState(false)
  const [uploadSelection, setUploadSelection] = useState<UploadSelection>({
    diningHall: '',
    itemId: '',
    itemName: '',
  })

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

  const LogoutRoute = () => {
    useEffect(() => {
      localStorage.removeItem('accessToken')
      setToken(null)
      navigate('/login')
    }, [])
    return null
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to={token ? "/feed" : "/login"} replace />} />
      <Route path="/logout" element={<LogoutRoute />} />

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
                onOpenUpload={(selection) => {
                  setUploadSelection(selection)
                  navigate('/upload')
                }}
                onOpenProfile={() => navigate('/profile')}
                onOpenDiningReviews={() => navigate('/dining-reviews')}
                onOpenReportedPosts={() => navigate('/reported-posts')}
              />
            }
          />
          <Route
            path="/profile"
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