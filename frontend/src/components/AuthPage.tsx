import { useState } from 'react'
import AuthForm from './auth/AuthForm'
import './AuthPage.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

type AuthPageProps = {
  onAuthSuccess: (token: string) => void
  onRegisterSuccess: (token: string) => void
}

type AuthResponseData = {
  access_token?: string
  message?: unknown
  detail?: unknown
}

function formatValidationErrors(value: unknown): string {
  if (!Array.isArray(value)) {
    return ''
  }

  const requiredFields: string[] = []
  const otherMessages: string[] = []

  for (const item of value) {
    if (!item || typeof item !== 'object') {
      continue
    }

    const record = item as { loc?: unknown; msg?: unknown }
    const message = typeof record.msg === 'string' ? record.msg : ''
    const location = Array.isArray(record.loc) ? record.loc : []
    const field = location[location.length - 1]

    if (message === 'Field required' && typeof field === 'string') {
      requiredFields.push(field)
      continue
    }

    if (message) {
      otherMessages.push(message)
    }
  }

  if (requiredFields.length > 0) {
    const labels = [...new Set(requiredFields)].map((field) => field.charAt(0).toUpperCase() + field.slice(1))

    if (labels.length === 1) {
      return `${labels[0]} is required`
    }

    if (labels.length === 2) {
      return `${labels[0]} and ${labels[1]} are required`
    }

    return `${labels.slice(0, -1).join(', ')}, and ${labels[labels.length - 1]} are required`
  }

  return otherMessages.join(', ')
}

function getAuthErrorMessage(data: unknown): string {
  if (typeof data === 'string') {
    return data
  }

  const payload = Array.isArray(data) && data.length > 0 ? data[0] : data

  if (!payload || typeof payload !== 'object') {
    return 'Auth failed'
  }

  const record = payload as AuthResponseData
  const detailMessage = formatValidationErrors(record.detail)

  if (detailMessage) {
    return detailMessage
  }

  if (typeof record.detail === 'string') {
    return record.detail
  }

  if (typeof record.message === 'string') {
    return record.message
  }

  return 'Auth failed'
}

function AuthPage({ onAuthSuccess, onRegisterSuccess }: AuthPageProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'error' | 'success' | null>(null)

  async function handleAuth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    setMessageType(null)

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

      const rawText = await response.text()
      let data: unknown = null

      if (rawText) {
        try {
          data = JSON.parse(rawText)
        } catch {
          data = rawText
        }
      }

      const tupleStatus = Array.isArray(data) && typeof data[1] === 'number' ? data[1] : null
      const hasErrorStatus = !response.ok || (tupleStatus !== null && tupleStatus >= 400)

      if (hasErrorStatus) {
        setMessage(getAuthErrorMessage(data))
        setMessageType('error')
        return
      }

      const payload = data && typeof data === 'object' && !Array.isArray(data) ? (data as AuthResponseData) : null
      const token = typeof payload?.access_token === 'string' ? payload.access_token : ''

      if (!token) {
        setMessage(getAuthErrorMessage(data))
        setMessageType('error')
        return
      }

      document.cookie = `accessToken=${token}; path=/; SameSite=Strict`


      if (mode === 'register') {
        onRegisterSuccess(token)
      } else {
        onAuthSuccess(token)
      }

      setMessage('Success!')
      setMessageType('success')
    } catch (error) {
      console.error(error)
      setMessage('Network error')
      setMessageType('error')
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
      messageType={messageType}
    />
  )
}

export default AuthPage
