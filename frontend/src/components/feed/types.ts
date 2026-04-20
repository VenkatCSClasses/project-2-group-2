export type UploadSelection = {
  diningHall: string
  itemId?: string
  itemName?: string
}

export type FeedPageProps = {
  token: string
  onOpenUpload: (selection: UploadSelection) => void
}

export type Post = {
  id: string
  author_id: string
  author_username: string | null
  food_item_id: string | null
  food_item_name: string | null
  star_rating: number
  content: string | null
  image_url: string | null
  created_at: string
  upvotes: number
  downvotes: number
}

export type Comment = {
  id: string
  text: string
  author_id: string
  author_username: string | null
  review_id: string
  parent_id: string | null
  created_at: string
  upvotes: number
  downvotes: number
}

export type PostsResponse = {
  start: number
  limit: number
  posts: Post[]
}

export type PostDetailsResponse = {
  count: number
  comments: Comment[]
}

export type FoodItem = {
  id: string
  name: string
  description: string | null
  image_url: string | null
  average_rating: number | null
}

export type PlaceResponse = {
  place_id: string
  place_info: {
    id: string
    name: string
    description: string | null
    food_items: FoodItem[]
  }
}

export type PlaceKey = 'campus' | 'terrace'

export type ThreadState = {
  isOpen: boolean
  loaded: boolean
  loading: boolean
  submitting: boolean
  submittingReplyId: string | null
  comments: Comment[]
  draft: string
  replyTargetId: string | null
  replyDrafts: Record<string, string>
  error: string
}
