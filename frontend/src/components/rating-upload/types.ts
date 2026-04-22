export type RatingUploadPageProps = {
  token: string
  onBack: () => void
  initialDiningHall?: string
  initialItemId?: string
  initialItemName?: string
}

export type FormDataState = {
  itemId: string
  itemName: string
  diningHall: string
  rating: string
  description: string
  image: File | null
}

export type FormErrors = {
  diningHall?: string
  itemId?: string
  rating?: string
}

export type ItemResult = {
  id: string
  name: string
  description?: string | null
  image_url?: string | null
  food_place_id?: string | null
}

export type PlaceResult = {
  id: string
  name: string
  description?: string | null
  image_url?: string | null
}

export type PlaceSearchResponse = {
  query?: string
  category?: string | null
  results?: PlaceResult[]
  count?: number
}

export type PlaceInfoResponse = {
  place_id?: string
  place_info?: {
    id?: string
    name?: string
    description?: string | null
    image_url?: string | null
    food_items?: ItemResult[]
  }
}
