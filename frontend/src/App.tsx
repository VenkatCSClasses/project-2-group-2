import { useState } from 'react'
import './App.css'
import FeedPage from './components/FeedPage'
import ProfilePicturePage from './components/ProfilePicturePage'
import RatingUploadPage from './components/RatingUploadPage'
import AuthPage from './components/AuthPage'
import ProfilePage from './components/ProfilePage'
import DiningHallReviewsPage from './components/DiningHallReviewsPage'

type UploadSelection = {
  diningHall: string
  itemId?: string
  itemName?: string
}

function App() {
  const [token, setToken] = useState<string | null>(null)
  const [page, setPage] = useState<'feed' | 'upload' | 'profile' | 'diningReviews'>('feed')
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
        onComplete={() => setShowPfpSetup(false)}
      />
    )
  }

  if (!token) {
    return (
      <AuthPage
        onAuthSuccess={setToken}
        onRegisterSuccess={(newToken) => {
          setToken(newToken)
          setShowPfpSetup(true)
        }}
      />
    )
  }

  return page === 'feed' ? (
    <FeedPage
      token={token}
      onOpenUpload={(selection) => {
        setUploadSelection(selection)
        setPage('upload')
      }}
      onOpenProfile={() => setPage('profile')}
      onOpenDiningReviews={() => setPage('diningReviews')}
    />
  ) : page === 'profile' ? (
    <ProfilePage token={token} onBack={() => setPage('feed')} />
  ) : page === 'diningReviews' ? (
    <DiningHallReviewsPage
      token={token}
      onBack={() => setPage('feed')}
    />
  ) : (
    <main className="app-shell">
      <RatingUploadPage
        token={token}
        onBack={() => setPage('feed')}
        initialDiningHall={uploadSelection.diningHall}
        initialItemId={uploadSelection.itemId}
        initialItemName={uploadSelection.itemName}
      />
    </main>
  )
}

export default App