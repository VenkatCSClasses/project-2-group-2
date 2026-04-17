import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react'
import './RatingUploadPage.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

type RatingUploadPageProps = {
  token: string
  onBack: () => void
  initialDiningHall?: string
  initialItemId?: string
  initialItemName?: string
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
      !Number.isFinite(numericRating) ||
      numericRating < 0.5 ||
      numericRating > 5
    ) {
      errors.rating = 'Rating must be between 0.5 and 5 stars'
    }
  }

  return errors
}

function RatingUploadPage({
  token,
  onBack,
  initialDiningHall = '',
  initialItemId = '',
  initialItemName = '',
}: RatingUploadPageProps) {
  const [formData, setFormData] = useState<FormDataState>({
    ...initialFormState,
    diningHall: initialDiningHall,
    itemId: initialItemId,
    itemName: initialItemName,
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitMessage, setSubmitMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [placeResults, setPlaceResults] = useState<PlaceResult[]>([])
  const [menuItems, setMenuItems] = useState<ItemResult[]>([])
  const [selectedPlaceId, setSelectedPlaceId] = useState('')
  const [selectedPlaceName, setSelectedPlaceName] = useState('')

  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false)
  const [isLoadingMenu, setIsLoadingMenu] = useState(false)
  const [showItemPicker, setShowItemPicker] = useState(false)
  const [hoverRating, setHoverRating] = useState<number | null>(null)

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      diningHall: initialDiningHall,
      itemId: initialItemId,
      itemName: initialItemName,
    }))
  }, [initialDiningHall, initialItemId, initialItemName])

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
      setShowItemPicker(false)

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

  function handleStarClick(value: number) {
    setFormData((prev) => ({
      ...prev,
      rating: value.toString(),
    }))

    setErrors((prev) => ({
      ...prev,
      rating: undefined,
    }))
  }

  function getStarFill(starNumber: number) {
    const activeValue = hoverRating ?? (Number(formData.rating) || 0)

    if (activeValue >= starNumber) {
      return 'full'
    }

    if (activeValue === starNumber - 0.5) {
      return 'half'
    }

    return 'empty'
  }

  async function handleSelectPlace(place: PlaceResult) {
    setSubmitMessage('')
    setIsLoadingMenu(true)
    setSelectedPlaceId(place.id)
    setSelectedPlaceName(place.name)
    setPlaceResults([])
    setShowItemPicker(true)

    setFormData((prev) => ({
      ...prev,
      diningHall: place.name,
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
      } catch {
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
      const items = placeInfoData?.place_info?.food_items ?? []
      setMenuItems(items)

      if (initialItemId || initialItemName) {
        const matchedItem =
          items.find((item) => item.id === initialItemId) ||
          items.find(
            (item) =>
              item.name.trim().toLowerCase() ===
              initialItemName.trim().toLowerCase()
          )

        if (matchedItem) {
          setFormData((prev) => ({
            ...prev,
            itemId: matchedItem.id,
            itemName: matchedItem.name,
          }))
          setShowItemPicker(false)
        } else {
          setFormData((prev) => ({
            ...prev,
            itemId: '',
            itemName: initialItemName,
          }))
          setShowItemPicker(true)
        }
      }
    } catch (error) {
      console.error('place details fetch error:', error)
      setSubmitMessage('Network error while loading dining hall menu')
      setMenuItems([])
    } finally {
      setIsLoadingMenu(false)
    }
  }

  useEffect(() => {
    async function preloadDiningHall() {
      if (!initialDiningHall.trim()) return

      try {
        const response = await fetch(
          `${API_BASE_URL}/places/search?query=${encodeURIComponent(initialDiningHall)}`
        )

        const rawText = await response.text()
        const data: unknown = rawText ? JSON.parse(rawText) : null

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

        const exactMatch =
          results.find(
            (place) =>
              place.name.toLowerCase() === initialDiningHall.toLowerCase()
          ) ?? results[0]

        if (exactMatch) {
          await handleSelectPlace(exactMatch)
        }
      } catch (error) {
        console.error('preload dining hall error:', error)
      }
    }

    void preloadDiningHall()
  }, [initialDiningHall, initialItemId, initialItemName])

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

    setShowItemPicker(false)
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
      } catch {
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
      setFormData({
        ...initialFormState,
        diningHall: initialDiningHall,
        itemId: '',
        itemName: '',
      })
      setErrors({})
      setPlaceResults([])
      setMenuItems([])
      setSelectedPlaceId('')
      setSelectedPlaceName('')
      setShowItemPicker(false)
      setHoverRating(null)
    } catch (error) {
      console.error('review submit fetch error:', error)
      setSubmitMessage('Network error while submitting review')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="rating-page">
      <div className="rating-card">
        <div className="rating-header">
          <button className="inline-back-button" type="button" onClick={onBack}>
            ←
          </button>
          <h2 className="rating-title">Upload Rating</h2>
        </div>

        <form className="rating-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="diningHall">Dining Hall</label>

            <div className="search-row">
              <input
                id="diningHall"
                name="diningHall"
                type="text"
                value={formData.diningHall}
                onChange={handleChange}
                placeholder="Search for a dining hall"
              />
            </div>

            {errors.diningHall && <p className="field-error">{errors.diningHall}</p>}
          </div>

          {selectedPlaceName && (
            <p className="selected-text">
              Selected dining hall: <strong>{selectedPlaceName}</strong>
            </p>
          )}

          <div className="form-group">
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
            {errors.itemId && <p className="field-error">{errors.itemId}</p>}
          </div>

          {selectedPlaceId && formData.itemId && !showItemPicker && (
            <div className="selected-item-row">
              <p className="selected-text">
                Selected food item: <strong>{formData.itemName}</strong>
              </p>
              <button
                type="button"
                className="change-item-button"
                onClick={() => setShowItemPicker(true)}
              >
                Change food item
              </button>
            </div>
          )}

          {isLoadingMenu && <p className="helper-text">Loading menu...</p>}

          {selectedPlaceId &&
            !isLoadingMenu &&
            showItemPicker &&
            filteredMenuItems.length > 0 && (
              <div className="result-box">
                <p className="result-label">
                  {formData.itemId ? 'Change food item' : 'Select a food item'}
                </p>
                <ul className="result-list">
                  {filteredMenuItems.map((item) => (
                    <li key={item.id} className="result-item">
                      <button
                        type="button"
                        className="result-button"
                        onClick={() => handleSelectItem(item)}
                      >
                        {item.name}
                      </button>
                      {item.description ? (
                        <span className="result-description">
                          {item.description}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            )}

          {selectedPlaceId && !isLoadingMenu && menuItems.length === 0 && (
            <p className="helper-text">No menu items found for this dining hall.</p>
          )}

          <div className="form-group rating-group">
            <label className="center-label">Rating</label>

            <div
              className="star-rating"
              onMouseLeave={() => setHoverRating(null)}
            >
              {[1, 2, 3, 4, 5].map((starNumber) => {
                const fillType = getStarFill(starNumber)

                return (
                  <div key={starNumber} className="star-wrapper">
                    <button
                      type="button"
                      className="star-half left-half"
                      onMouseEnter={() => setHoverRating(starNumber - 0.5)}
                      onClick={() => handleStarClick(starNumber - 0.5)}
                      aria-label={`Rate ${starNumber - 0.5} stars`}
                    />
                    <button
                      type="button"
                      className="star-half right-half"
                      onMouseEnter={() => setHoverRating(starNumber)}
                      onClick={() => handleStarClick(starNumber)}
                      aria-label={`Rate ${starNumber} stars`}
                    />
                    <span className={`star-display ${fillType}`}>★</span>
                  </div>
                )
              })}
            </div>

            <p className="rating-value">
              {formData.rating ? `${formData.rating} / 5` : 'Select a rating'}
            </p>

            {errors.rating && <p className="field-error">{errors.rating}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Write a short review"
              rows={5}
            />
          </div>

          <div className="form-group file-group">
            <label htmlFor="image" className="center-label">
              Image
            </label>
            <input
              className="file-input"
              id="image"
              name="image"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>

          <button
            className="submit-button"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Rating'}
          </button>
        </form>

        {submitMessage && <p className="submit-message">{submitMessage}</p>}
      </div>
    </section>
  )
}

export default RatingUploadPage