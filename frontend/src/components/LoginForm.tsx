import { ChangeEvent, FormEvent, useState } from 'react'

const API_BASE_URL = 'http://127.0.0.1:8000'

type LoginFormProps = {
  onLoginSuccess: (token: string) => void
}

type LoginState = {
  username: string
  password: string
}

const initialLoginState: LoginState = {
  username: '',
  password: '',
}

function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [loginData, setLoginData] = useState<LoginState>(initialLoginState)
  const [message, setMessage] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target
    setLoginData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    setIsLoggingIn(true)

    try {
      const body = new URLSearchParams()
      body.append('username', loginData.username)
      body.append('password', loginData.password)

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      })

      const data = await response.json()

      if (!response.ok || !data.access_token) {
        setMessage(data?.message || 'Login failed')
        return
      }

      localStorage.setItem('accessToken', data.access_token)
      onLoginSuccess(data.access_token)
      setMessage('Logged in successfully')
      setLoginData(initialLoginState)
    } catch (error) {
      console.error(error)
      setMessage('Network error while logging in')
    } finally {
      setIsLoggingIn(false)
    }
  }

  return (
    <section>
      <h2>Login</h2>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username">Username</label>
          <input
            id="username"
            name="username"
            type="text"
            value={loginData.username}
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            value={loginData.password}
            onChange={handleChange}
          />
        </div>

        <button type="submit" disabled={isLoggingIn}>
          {isLoggingIn ? 'Logging in...' : 'Login'}
        </button>
      </form>

      {message && <p>{message}</p>}
    </section>
  )
}

export default LoginForm