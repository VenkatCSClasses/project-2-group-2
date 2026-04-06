import { render, screen } from '@testing-library/react'
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