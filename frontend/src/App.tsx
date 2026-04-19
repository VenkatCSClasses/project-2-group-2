import { useState } from 'react'
import './App.css'
import FeedPage from './components/FeedPage'
import ProfilePicturePage from './components/ProfilePicturePage'
import RatingUploadPage from './components/RatingUploadPage'
import AuthPage from './components/AuthPage'

function App() {
  const [token, setToken] = useState<string | null>(null);
  const [page, setPage] = useState<'feed' | 'upload'>('feed');
  const [showPfpSetup, setShowPfpSetup] = useState(false);

  if (showPfpSetup && token) {
    return (
      <ProfilePicturePage 
        token={token} 
        onComplete={() => setShowPfpSetup(false)} 
      />
    )
  }

  if (!token) {
    return <AuthPage 
      onAuthSuccess={setToken} 
      onRegisterSuccess={(newToken) => {
        setToken(newToken)
        setShowPfpSetup(true)
      }} 
    />
  }

  return page === 'feed' ? (
    <FeedPage token={token} onOpenUpload={() => setPage('upload')} />
  ) : (
    <main className="app-shell">
      <RatingUploadPage token={token} onBack={() => setPage('feed')} />
    </main>
  )
}

export default App