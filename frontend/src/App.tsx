import { useState } from 'react'
import './App.css'
import FeedPage from './components/FeedPage'
import RatingUploadPage from './components/RatingUploadPage'
import AuthPage from './components/AuthPage'

type UploadSelection = {
  diningHall: string
  itemId?: string
  itemName?: string
}

function App() {
  const [token, setToken] = useState<string | null>(null)
  const [page, setPage] = useState<'feed' | 'upload'>('feed')
  const [uploadSelection, setUploadSelection] = useState<UploadSelection>({
    diningHall: '',
    itemId: '',
    itemName: '',
  })

  if (!token) {
    return <AuthPage onAuthSuccess={setToken} />
  }

  return page === 'feed' ? (
    <FeedPage
      token={token}
      onOpenUpload={(selection) => {
        setUploadSelection(selection)
        setPage('upload')
      }}
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