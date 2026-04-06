import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { test, expect } from 'vitest'
import RatingUploadPage from './RatingUploadPage'

test('renders upload rating form', () => {
  render(<RatingUploadPage />)

  expect(screen.getByRole('heading', { name: /upload rating/i })).toBeInTheDocument()
  expect(screen.getByLabelText(/item id/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/item name/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/dining hall/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/rating/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/image/i)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument()
})

test('allows the user to type into form fields', async () => {
  const user = userEvent.setup()
  render(<RatingUploadPage />)

  const itemIdInput = screen.getByLabelText(/item id/i)
  const itemNameInput = screen.getByLabelText(/item name/i)
  const diningHallInput = screen.getByLabelText(/dining hall/i)
  const ratingInput = screen.getByLabelText(/rating/i)
  const descriptionInput = screen.getByLabelText(/description/i)

  await user.type(itemIdInput, '123')
  await user.type(itemNameInput, 'Pizza')
  await user.type(diningHallInput, 'RPCC')
  await user.type(ratingInput, '5')
  await user.type(descriptionInput, 'Pretty good')

  expect(itemIdInput).toHaveValue('123')
  expect(itemNameInput).toHaveValue('Pizza')
  expect(diningHallInput).toHaveValue('RPCC')
  expect(ratingInput).toHaveValue(5)
  expect(descriptionInput).toHaveValue('Pretty good')
})