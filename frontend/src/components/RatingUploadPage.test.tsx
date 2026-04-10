import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, test, vi } from 'vitest'
import RatingUploadPage from './RatingUploadPage'

describe('RatingUploadPage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('renders the rating page fields', () => {
    render(<RatingUploadPage token="fake-token" />)

    expect(
      screen.getByRole('heading', { name: /upload rating/i })
    ).toBeInTheDocument()

    expect(screen.getByLabelText(/dining hall/i)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /search places/i })
    ).toBeInTheDocument()
    expect(screen.getByLabelText(/food item/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/rating/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/image/i)).toBeInTheDocument()

    expect(screen.queryByLabelText(/item id/i)).not.toBeInTheDocument()
  })

  test('disables food item input until a dining hall is selected', () => {
    render(<RatingUploadPage token="fake-token" />)

    expect(screen.getByLabelText(/food item/i)).toBeDisabled()
  })

  test('allows the user to type into available form fields', async () => {
    const user = userEvent.setup()
    render(<RatingUploadPage token="fake-token" />)

    const diningHallInput = screen.getByLabelText(/dining hall/i)
    const ratingInput = screen.getByLabelText(/rating/i)
    const descriptionInput = screen.getByLabelText(/description/i)

    await user.type(diningHallInput, 'RPCC')
    await user.type(ratingInput, '10')
    await user.type(descriptionInput, 'Pretty good')

    expect(diningHallInput).toHaveValue('RPCC')
    expect(ratingInput).toHaveValue(10)
    expect(descriptionInput).toHaveValue('Pretty good')
  })

  test('shows validation errors for empty required fields', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.spyOn(global, 'fetch')

    render(<RatingUploadPage token="fake-token" />)

    await user.click(screen.getByRole('button', { name: /submit/i }))

    expect(
      screen.getByText(/dining hall selection is required/i)
    ).toBeInTheDocument()
    expect(screen.getByText(/rating is required/i)).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  test('shows validation error if rating is outside 1 to 10', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.spyOn(global, 'fetch')

    render(<RatingUploadPage token="fake-token" />)

    await user.type(screen.getByLabelText(/rating/i), '11')
    await user.click(screen.getByRole('button', { name: /submit/i }))

    expect(
      screen.getByText(/rating must be an integer between 1 and 10/i)
    ).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  test('searches places and loads menu items for the selected dining hall', async () => {
    const user = userEvent.setup()

    const fetchMock = vi
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            {
              id: 'rpcc-id',
              name: 'RPCC',
              description: 'North Campus dining hall',
            },
          ],
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          place_id: 'rpcc-id',
          place_info: {
            id: 'rpcc-id',
            name: 'RPCC',
            description: 'North Campus dining hall',
            food_items: [
              {
                id: 'pizza-id',
                name: 'Pizza',
                description: 'Cheese pizza slice',
                food_place_id: 'rpcc-id',
              },
            ],
          },
        }),
      } as Response)

    render(<RatingUploadPage token="fake-token" />)

    await user.type(screen.getByLabelText(/dining hall/i), 'RPCC')
    await user.click(screen.getByRole('button', { name: /search places/i }))

    expect(await screen.findByText(/select a dining hall:/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^rpcc$/i }))

    expect(await screen.findByText(/selected dining hall:/i)).toBeInTheDocument()
    expect(await screen.findByText(/select a food item:/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^pizza$/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/food item/i)).not.toBeDisabled()

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'http://127.0.0.1:8000/places/search?query=RPCC'
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://127.0.0.1:8000/places/rpcc-id'
    )
  })

  test('selects a food item from the loaded menu', async () => {
    const user = userEvent.setup()

    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            {
              id: 'rpcc-id',
              name: 'RPCC',
              description: 'North Campus dining hall',
            },
          ],
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          place_id: 'rpcc-id',
          place_info: {
            id: 'rpcc-id',
            name: 'RPCC',
            food_items: [
              {
                id: 'pizza-id',
                name: 'Pizza',
                description: 'Cheese pizza slice',
                food_place_id: 'rpcc-id',
              },
            ],
          },
        }),
      } as Response)

    render(<RatingUploadPage token="fake-token" />)

    await user.type(screen.getByLabelText(/dining hall/i), 'RPCC')
    await user.click(screen.getByRole('button', { name: /search places/i }))
    await user.click(await screen.findByRole('button', { name: /^rpcc$/i }))
    await user.click(await screen.findByRole('button', { name: /^pizza$/i }))

    expect(screen.getByText(/selected item: pizza/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/food item/i)).toHaveValue('Pizza')
  })

  test('submits successfully when form is valid', async () => {
    const user = userEvent.setup()

    const fetchMock = vi
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            {
              id: 'rpcc-id',
              name: 'RPCC',
              description: 'North Campus dining hall',
            },
          ],
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          place_id: 'rpcc-id',
          place_info: {
            id: 'rpcc-id',
            name: 'RPCC',
            food_items: [
              {
                id: 'pizza-id',
                name: 'Pizza',
                description: 'Cheese pizza slice',
                food_place_id: 'rpcc-id',
              },
            ],
          },
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Review created' }),
      } as Response)

    render(<RatingUploadPage token="fake-token" />)

    await user.type(screen.getByLabelText(/dining hall/i), 'RPCC')
    await user.click(screen.getByRole('button', { name: /search places/i }))
    await user.click(await screen.findByRole('button', { name: /^rpcc$/i }))
    await user.click(await screen.findByRole('button', { name: /^pizza$/i }))

    await user.type(screen.getByLabelText(/rating/i), '8')
    await user.type(screen.getByLabelText(/description/i), 'Good food')
    await user.click(screen.getByRole('button', { name: /submit/i }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(3)
    })

    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      'http://127.0.0.1:8000/items/pizza-id/review',
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: 'Bearer fake-token',
        },
        body: expect.any(FormData),
      })
    )

    expect(
      await screen.findByText(/review submitted successfully/i)
    ).toBeInTheDocument()
  })

  test('shows message if user tries to submit without a token', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.spyOn(global, 'fetch')

    render(<RatingUploadPage token="" />)

    await user.click(screen.getByRole('button', { name: /submit/i }))

    expect(screen.getByText(/you must be logged in/i)).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})