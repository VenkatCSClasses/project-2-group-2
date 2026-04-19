import { useState } from 'react'
import './AuthPage.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

type AuthPageProps = {
  onAuthSuccess: (token: string) => void
  onRegisterSuccess: (token: string) => void
}

function AuthPage({ onAuthSuccess, onRegisterSuccess }: AuthPageProps) {
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

      localStorage.setItem('accessToken', data.access_token)
      if (mode === 'register') {
        onRegisterSuccess(data.access_token)
      } else {
        onAuthSuccess(data.access_token)
      }
      setMessage('Success!')
    } catch (err) {
      console.error(err)
      setMessage('Network error')
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-selector">
          <button
            type="button"
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => setMode('login')}
          >
            Login
          </button>
          <button
            type="button"
            className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => setMode('register')}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleAuth} className="auth-form">
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
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          )}

          <button type="submit" className="auth-submit">
            {mode === 'login' ? 'Login' : 'Register'}
          </button>
        </form>

        {mode === 'login' && (
          <button type="button" className="forgot-button">
            Forgot password/username?
          </button>
        )}

        {message && <p className="auth-message">{message}</p>}
      </div>
    </main>
  )
}

export default AuthPage