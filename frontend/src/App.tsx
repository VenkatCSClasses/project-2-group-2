import { useState } from 'react'
import './App.css'
import RatingUploadPage from './components/RatingUploadPage'

const API_BASE_URL = 'http://localhost:8000'

function App() {
  const [token, setToken] = useState<string | null>(null)
  const [mode, setMode] = useState<'login' | 'register'>('login')

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault()
    setMessage('')

    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register'

      const body =
        mode === 'login'
          ? new URLSearchParams({ username, password })
          : new URLSearchParams({ username, password, email })

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage(data?.detail || data?.message || 'Auth failed')
        return
      }

      // BOTH login and register return token
      setToken(data.access_token)
      setMessage('Success!')
    } catch (err) {
      console.error(err)
      setMessage('Network error')
    }
  }

  // ✅ If logged in → show upload page
  if (token) {
    return (
      <main>
        <h1>Food Review App</h1>
        <button onClick={() => setToken(null)}>Logout</button>
        <RatingUploadPage token={token} />
      </main>
    )
  }

  // ❌ Not logged in → show auth form
  return (
    <main>
      <h1>Food Review App</h1>

      <h2>{mode === 'login' ? 'Login' : 'Register'}</h2>

      <form onSubmit={handleAuth}>
        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {mode === 'register' && (
          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        )}

        <button type="submit">
          {mode === 'login' ? 'Login' : 'Register'}
        </button>
      </form>

      <button
        onClick={() =>
          setMode(mode === 'login' ? 'register' : 'login')
        }
      >
        Switch to {mode === 'login' ? 'Register' : 'Login'}
      </button>

      {message && <p>{message}</p>}
    </main>
  )
}

export default App