import { ChangeEvent, FormEvent, useState } from 'react'

const API_BASE_URL = 'http://127.0.0.1:8000'

type RegisterFormProps = {
  onRegisterSuccess: (token: string) => void
}

type RegisterState = {
  username: string
  email: string
  password: string
}

const initialRegisterState: RegisterState = {
  username: '',
  email: '',
  password: '',
}

function RegisterForm({ onRegisterSuccess }: RegisterFormProps) {
  const [registerData, setRegisterData] = useState<RegisterState>(initialRegisterState)
  const [message, setMessage] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target
    setRegisterData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    setIsRegistering(true)

    try {
      const body = new URLSearchParams()
      body.append('username', registerData.username)
      body.append('email', registerData.email)
      body.append('password', registerData.password)

      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      })

      const data = await response.json()

      if (!response.ok || !data.access_token) {
        setMessage(data?.message || 'Registration failed')
        return
      }

      localStorage.setItem('accessToken', data.access_token)
      onRegisterSuccess(data.access_token)
      setMessage('Registered successfully')
      setRegisterData(initialRegisterState)
    } catch (error) {
      console.error(error)
      setMessage('Network error while registering')
    } finally {
      setIsRegistering(false)
    }
  }

  return (
    <section>
      <h2>Register</h2>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="register-username">Username</label>
          <input
            id="register-username"
            name="username"
            type="text"
            value={registerData.username}
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor="register-email">Email</label>
          <input
            id="register-email"
            name="email"
            type="email"
            value={registerData.email}
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor="register-password">Password</label>
          <input
            id="register-password"
            name="password"
            type="password"
            value={registerData.password}
            onChange={handleChange}
          />
        </div>

        <button type="submit" disabled={isRegistering}>
          {isRegistering ? 'Registering...' : 'Register'}
        </button>
      </form>

      {message && <p>{message}</p>}
    </section>
  )
}

export default RegisterForm