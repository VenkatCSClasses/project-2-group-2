import type {
  FormDataState,
  FormErrors,
  PlaceResult,
  PlaceSearchResponse,
} from './types'

export const initialFormState: FormDataState = {
  itemId: '',
  itemName: '',
  diningHall: '',
  rating: '',
  description: '',
  image: null,
}

export function validateForm(
  formData: FormDataState,
  selectedPlaceId: string
): FormErrors {
  const errors: FormErrors = {}

  if (!selectedPlaceId) {
    errors.diningHall = 'Dining hall selection is required'
  }

  if (!formData.itemId.trim()) {
    errors.itemId = 'Food item selection is required'
  }

  if (!formData.rating.trim()) {
    errors.rating = 'Rating is required'
  } else {
    const numericRating = Number(formData.rating)
    if (
      !Number.isFinite(numericRating) ||
      numericRating < 0.5 ||
      numericRating > 5
    ) {
      errors.rating = 'Rating must be between 0.5 and 5 stars'
    }
  }

  return errors
}

export function getStarFill(activeValue: number, starNumber: number) {
  if (activeValue >= starNumber) {
    return 'full'
  }

  if (activeValue === starNumber - 0.5) {
    return 'half'
  }

  return 'empty'
}

export async function parseJsonResponse<T>(response: Response): Promise<T | null> {
  const rawText = await response.text()

  if (!rawText) {
    return null
  }

  return JSON.parse(rawText) as T
}

export function getPlaceResults(data: PlaceSearchResponse | PlaceResult[] | null) {
  if (Array.isArray(data)) {
    return data
  }

  return data?.results ?? []
}
