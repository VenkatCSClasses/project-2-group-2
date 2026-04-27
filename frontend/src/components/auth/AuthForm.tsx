type AuthFormProps = {
  mode: 'login' | 'register'
  username: string
  password: string
  email: string
  onModeChange: (mode: 'login' | 'register') => void
  onUsernameChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onEmailChange: (value: string) => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  message: string
  messageType: 'error' | 'success' | null
}

function AuthForm({
  mode,
  username,
  password,
  email,
  onModeChange,
  onUsernameChange,
  onPasswordChange,
  onEmailChange,
  onSubmit,
  message,
  messageType,
}: AuthFormProps) {
  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-selector">
          <button
            type="button"
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => onModeChange('login')}
          >
            Login
          </button>
          <button
            type="button"
            className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => onModeChange('register')}
          >
            Register
          </button>
        </div>

        <form onSubmit={onSubmit} className="auth-form">
          <input
            placeholder="Username"
            value={username}
            onChange={(event) => onUsernameChange(event.target.value)}
          />

          {mode === 'register' && (
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(event) => onEmailChange(event.target.value)}
            />
          )}

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
          />

          <button type="submit" className="auth-submit">
            {mode === 'login' ? 'Login' : 'Register'}
          </button>
        </form>

        {message && <p className={`auth-message ${messageType === 'error' ? 'error' : 'success'}`}>{message}</p>}
      </div>
    </main>
  )
}

export default AuthForm
