type MenuItemCardProps = {
  name: string
  description?: string | null
  averageRating?: number | null
  isSelected?: boolean
  onClick: () => void
}

function MenuItemCard({
  name,
  description,
  averageRating,
  isSelected = false,
  onClick,
}: MenuItemCardProps) {
  return (
    <button
      type="button"
      className={`review-menu-item-card ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div className="review-menu-item-top">
        <h3>{name}</h3>
        {averageRating !== undefined && (
          <span className="review-menu-item-rating">
            {typeof averageRating === 'number'
              ? `${(averageRating / 2).toFixed(1)}★`
              : 'No ratings'}
          </span>
        )}
      </div>

      {description && (
        <p className="review-menu-item-description">{description}</p>
      )}
    </button>
  )
}

export default MenuItemCard
