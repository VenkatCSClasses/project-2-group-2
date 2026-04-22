import { useState } from 'react'
import AuthForm from './auth/AuthForm'
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

  async function handleAuth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
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
    } catch (error) {
      console.error(error)
      setMessage('Network error')
    }
  }

  return (
    <AuthForm
      mode={mode}
      username={username}
      password={password}
      email={email}
      onModeChange={setMode}
      onUsernameChange={setUsername}
      onPasswordChange={setPassword}
      onEmailChange={setEmail}
      onSubmit={handleAuth}
      message={message}
    />
  )
}

export default AuthPage
