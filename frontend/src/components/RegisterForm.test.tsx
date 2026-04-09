import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, test, vi } from 'vitest'
import RegisterForm from './RegisterForm'

describe('RegisterForm', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  test('renders register form fields and button', () => {
    render(<RegisterForm onRegisterSuccess={vi.fn()} />)

    expect(screen.getByRole('heading', { name: /register/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument()
  })

  test('allows the user to type into username, email, and password fields', async () => {
    const user = userEvent.setup()
    render(<RegisterForm onRegisterSuccess={vi.fn()} />)

    const usernameInput = screen.getByLabelText(/username/i)
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)

    await user.type(usernameInput, 'harrison')
    await user.type(emailInput, 'harrison@example.com')
    await user.type(passwordInput, 'password123')

    expect(usernameInput).toHaveValue('harrison')
    expect(emailInput).toHaveValue('harrison@example.com')
    expect(passwordInput).toHaveValue('password123')
  })

  test('registers successfully, stores token, and calls onRegisterSuccess', async () => {
    const user = userEvent.setup()
    const onRegisterSuccess = vi.fn()

    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'fake-register-token',
      }),
    } as Response)

    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')

    render(<RegisterForm onRegisterSuccess={onRegisterSuccess} />)

    await user.type(screen.getByLabelText(/username/i), 'harrison')
    await user.type(screen.getByLabelText(/email/i), 'harrison@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /register/i }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:8000/auth/register',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })
    )

    await waitFor(() => {
      expect(setItemSpy).toHaveBeenCalledWith('accessToken', 'fake-register-token')
      expect(onRegisterSuccess).toHaveBeenCalledWith('fake-register-token')
    })

    expect(screen.getByText(/registered successfully/i)).toBeInTheDocument()
  })

  test('shows an error message when registration fails', async () => {
    const user = userEvent.setup()
    const onRegisterSuccess = vi.fn()

    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      json: async () => ({
        message: 'Username already exists',
      }),
    } as Response)

    render(<RegisterForm onRegisterSuccess={onRegisterSuccess} />)

    await user.type(screen.getByLabelText(/username/i), 'harrison')
    await user.type(screen.getByLabelText(/email/i), 'harrison@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /register/i }))

    expect(
      await screen.findByText(/username already exists/i)
    ).toBeInTheDocument()

    expect(onRegisterSuccess).not.toHaveBeenCalled()
  })

  test('shows a network error message if fetch throws', async () => {
    const user = userEvent.setup()
    const onRegisterSuccess = vi.fn()

    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network failure'))

    render(<RegisterForm onRegisterSuccess={onRegisterSuccess} />)

    await user.type(screen.getByLabelText(/username/i), 'harrison')
    await user.type(screen.getByLabelText(/email/i), 'harrison@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /register/i }))

    expect(
      await screen.findByText(/network error while registering/i)
    ).toBeInTheDocument()

    expect(onRegisterSuccess).not.toHaveBeenCalled()
  })
})