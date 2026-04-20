import { getStarFill } from './utils'

type StarRatingInputProps = {
  rating: string
  hoverRating: number | null
  error?: string
  onHoverChange: (value: number | null) => void
  onSelect: (value: number) => void
}

function StarRatingInput({
  rating,
  hoverRating,
  error,
  onHoverChange,
  onSelect,
}: StarRatingInputProps) {
  const activeValue = hoverRating ?? (Number(rating) || 0)

  return (
    <div className="form-group rating-group">
      <label className="center-label">Rating</label>

      <div className="star-rating" onMouseLeave={() => onHoverChange(null)}>
        {[1, 2, 3, 4, 5].map((starNumber) => {
          const fillType = getStarFill(activeValue, starNumber)

          return (
            <div key={starNumber} className="star-wrapper">
              <button
                type="button"
                className="star-half left-half"
                onMouseEnter={() => onHoverChange(starNumber - 0.5)}
                onClick={() => onSelect(starNumber - 0.5)}
                aria-label={`Rate ${starNumber - 0.5} stars`}
              />
              <button
                type="button"
                className="star-half right-half"
                onMouseEnter={() => onHoverChange(starNumber)}
                onClick={() => onSelect(starNumber)}
                aria-label={`Rate ${starNumber} stars`}
              />
              <span className={`star-display ${fillType}`}>★</span>
            </div>
          )
        })}
      </div>

      <p className="rating-value">
        {rating ? `${rating} / 5` : 'Select a rating'}
      </p>

      {error && <p className="field-error">{error}</p>}
    </div>
  )
}

export default StarRatingInput
