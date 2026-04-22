import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import DiningHallPicker from './rating-upload/DiningHallPicker'
import ItemPicker from './rating-upload/ItemPicker'
import StarRatingInput from './rating-upload/StarRatingInput'
import type {
  FormDataState,
  FormErrors,
  ItemResult,
  PlaceInfoResponse,
  PlaceResult,
  PlaceSearchResponse,
  RatingUploadPageProps,
} from './rating-upload/types'
import {
  getPlaceResults,
  initialFormState,
  parseJsonResponse,
  validateForm,
} from './rating-upload/utils'
import './RatingUploadPage.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

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
    setFormData((current) => ({
      ...current,
      diningHall: initialDiningHall,
      itemId: initialItemId,
      itemName: initialItemName,
    }))
  }, [initialDiningHall, initialItemId, initialItemName])

  useEffect(() => {
    const query = formData.diningHall.trim()
    const selectedMatchesQuery =
      query.length > 0 &&
      selectedPlaceName.length > 0 &&
      query.toLowerCase() === selectedPlaceName.toLowerCase()

    if (!query || selectedMatchesQuery) {
      setPlaceResults([])
      setIsSearchingPlaces(false)
      return
    }

    let isCancelled = false

    async function searchPlaces() {
      setIsSearchingPlaces(true)

      try {
        const response = await fetch(
          `${API_BASE_URL}/places/search?query=${encodeURIComponent(query)}`
        )
        const data = await parseJsonResponse<PlaceSearchResponse>(response)

        if (isCancelled) {
          return
        }

        if (!response.ok) {
          setPlaceResults([])
          return
        }

        setPlaceResults(getPlaceResults(data))
      } catch (error) {
        console.error('place search error:', error)
        if (!isCancelled) {
          setPlaceResults([])
        }
      } finally {
        if (!isCancelled) {
          setIsSearchingPlaces(false)
        }
      }
    }

    void searchPlaces()

    return () => {
      isCancelled = true
    }
  }, [formData.diningHall, selectedPlaceName])

  async function handleSelectPlace(place: PlaceResult) {
    setSubmitMessage('')
    setIsLoadingMenu(true)
    setSelectedPlaceId(place.id)
    setSelectedPlaceName(place.name)
    setPlaceResults([])
    setShowItemPicker(true)

    setFormData((current) => ({
      ...current,
      diningHall: place.name,
      itemId: '',
      itemName: '',
    }))

    setErrors((current) => ({
      ...current,
      diningHall: undefined,
      itemId: undefined,
    }))

    try {
      const response = await fetch(
        `${API_BASE_URL}/places/${encodeURIComponent(place.name)}`
      )
      const data = await parseJsonResponse<PlaceInfoResponse>(response)

      if (!response.ok) {
        setSubmitMessage('Failed to load dining hall menu')
        setMenuItems([])
        return
      }

      const items = data?.place_info?.food_items ?? []
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
          setFormData((current) => ({
            ...current,
            itemId: matchedItem.id,
            itemName: matchedItem.name,
          }))
          setShowItemPicker(false)
        } else {
          setFormData((current) => ({
            ...current,
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
      if (!initialDiningHall.trim()) {
        return
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/places/search?query=${encodeURIComponent(initialDiningHall)}`
        )
        const data = await parseJsonResponse<PlaceSearchResponse>(response)
        const results = getPlaceResults(data)

        const exactMatch =
          results.find(
            (place) =>
              place.name.toLowerCase() === initialDiningHall.toLowerCase()
          ) ?? results[0]

        if (exactMatch) {
          setSubmitMessage('')
          setIsLoadingMenu(true)
          setSelectedPlaceId(exactMatch.id)
          setSelectedPlaceName(exactMatch.name)
          setPlaceResults([])
          setShowItemPicker(true)

          setFormData((current) => ({
            ...current,
            diningHall: exactMatch.name,
            itemId: '',
            itemName: '',
          }))

          setErrors((current) => ({
            ...current,
            diningHall: undefined,
            itemId: undefined,
          }))

          try {
            const placeResponse = await fetch(
              `${API_BASE_URL}/places/${encodeURIComponent(exactMatch.name)}`
            )
            const placeData = await parseJsonResponse<PlaceInfoResponse>(
              placeResponse
            )

            if (!placeResponse.ok) {
              setSubmitMessage('Failed to load dining hall menu')
              setMenuItems([])
              return
            }

            const items = placeData?.place_info?.food_items ?? []
            setMenuItems(items)

            const matchedItem =
              items.find((item) => item.id === initialItemId) ||
              items.find(
                (item) =>
                  item.name.trim().toLowerCase() ===
                  initialItemName.trim().toLowerCase()
              )

            if (matchedItem) {
              setFormData((current) => ({
                ...current,
                itemId: matchedItem.id,
                itemName: matchedItem.name,
              }))
              setShowItemPicker(false)
            } else {
              setFormData((current) => ({
                ...current,
                itemId: '',
                itemName: initialItemName,
              }))
            }
          } catch (error) {
            console.error('preload place details error:', error)
            setSubmitMessage('Network error while loading dining hall menu')
            setMenuItems([])
          } finally {
            setIsLoadingMenu(false)
          }
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

  function handleDiningHallChange(value: string) {
    setFormData((current) => ({
      ...current,
      diningHall: value,
      itemId: '',
      itemName: '',
    }))
    setSelectedPlaceId('')
    setSelectedPlaceName('')
    setMenuItems([])
    setShowItemPicker(false)
  }

  function handleItemNameChange(value: string) {
    setFormData((current) => ({
      ...current,
      itemName: value,
      itemId: '',
    }))

    if (selectedPlaceId) {
      setShowItemPicker(true)
    }
  }

  function handleTextChange(
    event: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ) {
    const { name, value } = event.target

    setFormData((current) => ({
      ...current,
      [name]: value,
    }))
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    setFormData((current) => ({
      ...current,
      image: file,
    }))
  }

  function handleSelectItem(item: ItemResult) {
    setFormData((current) => ({
      ...current,
      itemId: item.id,
      itemName: item.name,
    }))

    setErrors((current) => ({
      ...current,
      itemId: undefined,
    }))

    setShowItemPicker(false)
  }

  function handleStarClick(value: number) {
    setFormData((current) => ({
      ...current,
      rating: value.toString(),
    }))

    setErrors((current) => ({
      ...current,
      rating: undefined,
    }))
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
      const backendRating = Math.round(Number(formData.rating) * 2)
  
      requestBody.append('rating', backendRating.toString())
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
  
      const data = await parseJsonResponse<{ detail?: string; message?: string }>(
        response
      )
  
      if (!response.ok) {
        setSubmitMessage(
          data?.detail || data?.message || 'Failed to submit review'
        )
        return
      }
  
      setSubmitMessage('')
      setFormData({
        ...initialFormState,
        diningHall: '',
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
  
      onBack()
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
          <DiningHallPicker
            value={formData.diningHall}
            selectedPlaceName={selectedPlaceName}
            placeResults={placeResults}
            isSearchingPlaces={isSearchingPlaces}
            errors={errors}
            onChange={handleDiningHallChange}
            onSelectPlace={(place) => void handleSelectPlace(place)}
          />

          <ItemPicker
            selectedPlaceId={selectedPlaceId}
            selectedItemId={formData.itemId}
            itemName={formData.itemName}
            filteredMenuItems={filteredMenuItems}
            menuItems={menuItems}
            isLoadingMenu={isLoadingMenu}
            showItemPicker={showItemPicker}
            errors={errors}
            onItemNameChange={handleItemNameChange}
            onSelectItem={handleSelectItem}
            onShowPicker={() => setShowItemPicker(true)}
          />

          <StarRatingInput
            rating={formData.rating}
            hoverRating={hoverRating}
            error={errors.rating}
            onHoverChange={setHoverRating}
            onSelect={handleStarClick}
          />

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleTextChange}
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
