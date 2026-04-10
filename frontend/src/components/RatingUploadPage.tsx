import { ChangeEvent, FormEvent, useMemo, useState } from 'react'

const API_BASE_URL = 'http://localhost:8000'

type RatingUploadPageProps = {
  token: string
}

type FormDataState = {
  itemId: string
  itemName: string
  diningHall: string
  rating: string
  description: string
  image: File | null
}

type FormErrors = {
  diningHall?: string
  itemId?: string
  rating?: string
}

type ItemResult = {
  id: string
  name: string
  description?: string | null
  image_url?: string | null
  food_place_id?: string | null
}

type PlaceResult = {
  id: string
  name: string
  description?: string | null
  image_url?: string | null
}

type PlaceInfoResponse = {
  place_id?: string
  place_info?: {
    id?: string
    name?: string
    description?: string | null
    image_url?: string | null
    food_items?: ItemResult[]
  }
}

const initialFormState: FormDataState = {
  itemId: '',
  itemName: '',
  diningHall: '',
  rating: '',
  description: '',
  image: null,
}

function validateForm(
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
      !Number.isInteger(numericRating) ||
      numericRating < 1 ||
      numericRating > 10
    ) {
      errors.rating = 'Rating must be an integer between 1 and 10'
    }
  }

  return errors
}

function RatingUploadPage({ token }: RatingUploadPageProps) {
  const [formData, setFormData] = useState<FormDataState>(initialFormState)
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitMessage, setSubmitMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [placeResults, setPlaceResults] = useState<PlaceResult[]>([])
  const [menuItems, setMenuItems] = useState<ItemResult[]>([])
  const [selectedPlaceId, setSelectedPlaceId] = useState('')
  const [selectedPlaceName, setSelectedPlaceName] = useState('')

  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false)
  const [isLoadingMenu, setIsLoadingMenu] = useState(false)

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = event.target

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    if (name === 'diningHall') {
      setPlaceResults([])
      setSelectedPlaceId('')
      setSelectedPlaceName('')
      setMenuItems([])

      setFormData((prev) => ({
        ...prev,
        diningHall: value,
        itemId: '',
        itemName: '',
      }))
    }

    if (name === 'itemName') {
      setFormData((prev) => ({
        ...prev,
        itemName: value,
        itemId: '',
      }))
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    setFormData((prev) => ({
      ...prev,
      image: file,
    }))
  }

  async function handleSearchPlaces() {
    setSubmitMessage('')
    setPlaceResults([])

    if (!formData.diningHall.trim()) {
      setSubmitMessage('Enter a dining hall name to search')
      return
    }

    setIsSearchingPlaces(true)

    try {
      const response = await fetch(
        `${API_BASE_URL}/places/search?query=${encodeURIComponent(formData.diningHall)}`
      )

      const rawText = await response.text()
      let data: unknown = null

      try {
        data = rawText ? JSON.parse(rawText) : null
      } catch (parseError) {
        console.error('places/search parse error:', parseError, rawText)
        setSubmitMessage('Search returned an invalid response from the server')
        return
      }

      if (!response.ok) {
        const errorData = data as { detail?: string; message?: string } | null
        setSubmitMessage(
          errorData?.detail ||
            errorData?.message ||
            'Failed to search places'
        )
        return
      }

      let results: PlaceResult[] = []

      if (Array.isArray(data)) {
        results = data as PlaceResult[]
      } else if (
        data &&
        typeof data === 'object' &&
        Array.isArray((data as { results?: unknown[] }).results)
      ) {
        results = (data as { results: PlaceResult[] }).results
      }

      setPlaceResults(results)

      if (results.length === 0) {
        setSubmitMessage('No dining halls found')
      }
    } catch (error) {
      console.error('places/search fetch error:', error)
      setSubmitMessage('Network error while searching places')
    } finally {
      setIsSearchingPlaces(false)
    }
  }

  async function handleSelectPlace(place: PlaceResult) {
    setSubmitMessage('')
    setIsLoadingMenu(true)
    setSelectedPlaceId(place.id)
    setSelectedPlaceName(place.name)
    setPlaceResults([])

    setFormData((prev) => ({
      ...prev,
      diningHall: place.name,
      itemId: '',
      itemName: '',
    }))

    setErrors((prev) => ({
      ...prev,
      diningHall: undefined,
      itemId: undefined,
    }))

    try {
      const response = await fetch(
        `${API_BASE_URL}/places/${encodeURIComponent(place.name)}`
      )

      const rawText = await response.text()
      let data: unknown = null

      try {
        data = rawText ? JSON.parse(rawText) : null
      } catch (parseError) {
        console.error('place details parse error:', parseError, rawText)
        setSubmitMessage('Dining hall menu returned an invalid response')
        setMenuItems([])
        return
      }

      if (!response.ok) {
        const errorData = data as { detail?: string; message?: string } | null
        setSubmitMessage(
          errorData?.detail ||
            errorData?.message ||
            'Failed to load dining hall menu'
        )
        setMenuItems([])
        return
      }

      const placeInfoData = data as PlaceInfoResponse | null
      setMenuItems(placeInfoData?.place_info?.food_items ?? [])
      setSubmitMessage(`Selected place: ${place.name}`)
    } catch (error) {
      console.error('place details fetch error:', error)
      setSubmitMessage('Network error while loading dining hall menu')
      setMenuItems([])
    } finally {
      setIsLoadingMenu(false)
    }
  }

  const filteredMenuItems = useMemo(() => {
    const query = formData.itemName.trim().toLowerCase()

    if (!query) {
      return menuItems
    }

    return menuItems.filter((item) => {
      const name = item.name?.toLowerCase() ?? ''
      const description = item.description?.toLowerCase() ?? ''
      return name.includes(query) || description.includes(query)
    })
  }, [menuItems, formData.itemName])

  function handleSelectItem(item: ItemResult) {
    setFormData((prev) => ({
      ...prev,
      itemId: item.id,
      itemName: item.name,
    }))

    setErrors((prev) => ({
      ...prev,
      itemId: undefined,
    }))

    setSubmitMessage(`Selected item: ${item.name}`)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitMessage('')

    if (!token) {
      setSubmitMessage('You must be logged in')
      return
    }

    const validationErrors = validateForm(formData, selectedPlaceId)
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      return
    }

    setIsSubmitting(true)

    try {
      const requestBody = new FormData()
      requestBody.append('rating', formData.rating)
      requestBody.append('description', formData.description)

      if (formData.image) {
        requestBody.append('image', formData.image)
      }

      const response = await fetch(
        `${API_BASE_URL}/items/${formData.itemId}/review`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: requestBody,
        }
      )

      const rawText = await response.text()
      let data: unknown = null

      try {
        data = rawText ? JSON.parse(rawText) : null
      } catch (parseError) {
        console.error('review submit parse error:', parseError, rawText)
        setSubmitMessage('Submit returned an invalid response from the server')
        return
      }

      if (!response.ok) {
        const errorData = data as { detail?: string; message?: string } | null
        setSubmitMessage(
          errorData?.detail ||
            errorData?.message ||
            'Failed to submit review'
        )
        return
      }

      setSubmitMessage('Review submitted successfully')
      setFormData(initialFormState)
      setErrors({})
      setPlaceResults([])
      setMenuItems([])
      setSelectedPlaceId('')
      setSelectedPlaceName('')
    } catch (error) {
      console.error('review submit fetch error:', error)
      setSubmitMessage('Network error while submitting review')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section>
      <h2>Upload Rating</h2>

      <form onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor="diningHall">Dining Hall</label>
          <input
            id="diningHall"
            name="diningHall"
            type="text"
            value={formData.diningHall}
            onChange={handleChange}
            placeholder="Search for a dining hall"
          />
          <button
            type="button"
            onClick={handleSearchPlaces}
            disabled={isSearchingPlaces}
            style={{ marginLeft: '0.5rem' }}
          >
            {isSearchingPlaces ? 'Searching...' : 'Search Places'}
          </button>
          {errors.diningHall && <p>{errors.diningHall}</p>}
        </div>

        {placeResults.length > 0 && (
          <div style={{ marginTop: '0.75rem', marginBottom: '1rem' }}>
            <p>Select a dining hall:</p>
            <ul>
              {placeResults.map((place) => (
                <li key={place.id} style={{ marginBottom: '0.5rem' }}>
                  <button type="button" onClick={() => handleSelectPlace(place)}>
                    {place.name}
                  </button>
                  {place.description ? <span> — {place.description}</span> : null}
                </li>
              ))}
            </ul>
          </div>
        )}

        {selectedPlaceName && (
          <p>
            Selected dining hall: <strong>{selectedPlaceName}</strong>
          </p>
        )}

        <div>
          <label htmlFor="itemName">Food Item</label>
          <input
            id="itemName"
            name="itemName"
            type="text"
            value={formData.itemName}
            onChange={handleChange}
            placeholder={
              selectedPlaceId
                ? 'Filter items from the selected dining hall'
                : 'Select a dining hall first'
            }
            disabled={!selectedPlaceId}
          />
        </div>

        {isLoadingMenu && <p>Loading menu...</p>}

        {selectedPlaceId && !isLoadingMenu && filteredMenuItems.length > 0 && (
          <div style={{ marginTop: '0.75rem', marginBottom: '1rem' }}>
            <p>Select a food item:</p>
            <ul>
              {filteredMenuItems.map((item) => (
                <li key={item.id} style={{ marginBottom: '0.5rem' }}>
                  <button type="button" onClick={() => handleSelectItem(item)}>
                    {item.name}
                  </button>
                  {item.description ? <span> — {item.description}</span> : null}
                </li>
              ))}
            </ul>
          </div>
        )}

        {selectedPlaceId && !isLoadingMenu && menuItems.length === 0 && (
          <p>No menu items found for this dining hall.</p>
        )}

        <div>
          <label htmlFor="rating">Rating</label>
          <input
            id="rating"
            name="rating"
            type="number"
            min="1"
            max="10"
            step="1"
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

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </button>
      </form>

      {submitMessage && <p>{submitMessage}</p>}
    </section>
  )
}

export default RatingUploadPage