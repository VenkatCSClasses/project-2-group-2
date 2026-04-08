import { ChangeEvent, FormEvent, useState } from 'react'

type FormDataState = {
  itemId: string
  itemName: string
  diningHall: string
  rating: string
  description: string
  image: File | null
}

type FormErrors = {
  itemId?: string
  itemName?: string
  diningHall?: string
  rating?: string
}

const initialFormState: FormDataState = {
  itemId: '',
  itemName: '',
  diningHall: '',
  rating: '',
  description: '',
  image: null,
}

function validateForm(formData: FormDataState): FormErrors {
  const errors: FormErrors = {}

  if (!formData.itemId.trim()) {
    errors.itemId = 'Item ID is required'
  }

  if (!formData.itemName.trim()) {
    errors.itemName = 'Item name is required'
  }

  if (!formData.diningHall.trim()) {
    errors.diningHall = 'Dining hall is required'
  }

  if (!formData.rating.trim()) {
    errors.rating = 'Rating is required'
  } else {
    const numericRating = Number(formData.rating)
    if (numericRating < 1 || numericRating > 5) {
      errors.rating = 'Rating must be between 1 and 5'
    }
  }

  return errors
}

function RatingUploadPage() {
  const [formData, setFormData] = useState<FormDataState>(initialFormState)
  const [errors, setErrors] = useState<FormErrors>({})

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = event.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    setFormData((prev) => ({
      ...prev,
      image: file,
    }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const validationErrors = validateForm(formData)
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      return
    }
  }

  return (
    <main>
      <h1>Upload Rating</h1>

      <form onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor="itemId">Item ID</label>
          <input
            id="itemId"
            name="itemId"
            type="text"
            value={formData.itemId}
            onChange={handleChange}
          />
          {errors.itemId && <p>{errors.itemId}</p>}
        </div>

        <div>
          <label htmlFor="itemName">Item Name</label>
          <input
            id="itemName"
            name="itemName"
            type="text"
            value={formData.itemName}
            onChange={handleChange}
          />
          {errors.itemName && <p>{errors.itemName}</p>}
        </div>

        <div>
          <label htmlFor="diningHall">Dining Hall</label>
          <input
            id="diningHall"
            name="diningHall"
            type="text"
            value={formData.diningHall}
            onChange={handleChange}
          />
          {errors.diningHall && <p>{errors.diningHall}</p>}
        </div>

        <div>
          <label htmlFor="rating">Rating</label>
          <input
            id="rating"
            name="rating"
            type="number"
            min="1"
            max="5"
            value={formData.rating}
            onChange={handleChange}
          />
          {errors.rating && <p>{errors.rating}</p>}
        </div>

        <div>
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor="image">Image</label>
          <input
            id="image"
            name="image"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
          />
        </div>

        <button type="submit">Submit</button>
      </form>
    </main>
  )
}

export default RatingUploadPage