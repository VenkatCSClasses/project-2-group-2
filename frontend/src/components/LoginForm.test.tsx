import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, test, vi } from 'vitest'
import LoginForm from './LoginForm'

describe('LoginForm', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  test('renders login form fields and button', () => {
    render(<LoginForm onLoginSuccess={vi.fn()} />)

    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
  })

  test('allows the user to type into username and password fields', async () => {
    const user = userEvent.setup()
    render(<LoginForm onLoginSuccess={vi.fn()} />)

    const usernameInput = screen.getByLabelText(/username/i)
    const passwordInput = screen.getByLabelText(/password/i)

    await user.type(usernameInput, 'harrison')
    await user.type(passwordInput, 'password123')

    expect(usernameInput).toHaveValue('harrison')
    expect(passwordInput).toHaveValue('password123')
  })

  test('logs in successfully, stores token, and calls onLoginSuccess', async () => {
    const user = userEvent.setup()
    const onLoginSuccess = vi.fn()

    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'fake-token-123',
      }),
    } as Response)

    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')

    render(<LoginForm onLoginSuccess={onLoginSuccess} />)

    await user.type(screen.getByLabelText(/username/i), 'harrison')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /login/i }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:8000/auth/login',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })
    )

    await waitFor(() => {
      expect(setItemSpy).toHaveBeenCalledWith('accessToken', 'fake-token-123')
      expect(onLoginSuccess).toHaveBeenCalledWith('fake-token-123')
    })

    expect(screen.getByText(/logged in successfully/i)).toBeInTheDocument()
  })

  test('shows an error message when login fails', async () => {
    const user = userEvent.setup()
    const onLoginSuccess = vi.fn()

    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      json: async () => ({
        message: 'Invalid username or password',
      }),
    } as Response)

    render(<LoginForm onLoginSuccess={onLoginSuccess} />)

    await user.type(screen.getByLabelText(/username/i), 'wronguser')
    await user.type(screen.getByLabelText(/password/i), 'wrongpass')
    await user.click(screen.getByRole('button', { name: /login/i }))

    expect(
      await screen.findByText(/invalid username or password/i)
    ).toBeInTheDocument()

    expect(onLoginSuccess).not.toHaveBeenCalled()
  })

  test('shows a network error message if fetch throws', async () => {
    const user = userEvent.setup()
    const onLoginSuccess = vi.fn()

    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network failure'))

    render(<LoginForm onLoginSuccess={onLoginSuccess} />)

    await user.type(screen.getByLabelText(/username/i), 'harrison')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /login/i }))

    expect(
      await screen.findByText(/network error while logging in/i)
    ).toBeInTheDocument()

    expect(onLoginSuccess).not.toHaveBeenCalled()
  })
})