import MenuItemCard from '../MenuItemCard'
import type { FormErrors, ItemResult } from './types'

type ItemPickerProps = {
  selectedPlaceId: string
  selectedItemId: string
  itemName: string
  filteredMenuItems: ItemResult[]
  menuItems: ItemResult[]
  isLoadingMenu: boolean
  showItemPicker: boolean
  errors: FormErrors
  onItemNameChange: (value: string) => void
  onSelectItem: (item: ItemResult) => void
  onShowPicker: () => void
}

function ItemPicker({
  selectedPlaceId,
  selectedItemId,
  itemName,
  filteredMenuItems,
  menuItems,
  isLoadingMenu,
  showItemPicker,
  errors,
  onItemNameChange,
  onSelectItem,
  onShowPicker,
}: ItemPickerProps) {
  const hasSearchQuery = itemName.trim().length > 0
  const visibleItems = filteredMenuItems.slice(0, 8)
  const hiddenResultCount = filteredMenuItems.length - visibleItems.length

  return (
    <>
      <div className="form-group">
        <label htmlFor="itemName">Food Item</label>
        <input
          id="itemName"
          name="itemName"
          type="text"
          value={itemName}
          onChange={(event) => onItemNameChange(event.target.value)}
          placeholder={
            selectedPlaceId
              ? 'Filter items from the selected dining hall'
              : 'Select a dining hall first'
          }
          disabled={!selectedPlaceId}
        />
        {errors.itemId && <p className="field-error">{errors.itemId}</p>}
      </div>

      {selectedPlaceId && selectedItemId && !showItemPicker && (
        <div className="selected-item-row">
          <p className="selected-text">
            Selected food item: <strong>{itemName}</strong>
          </p>
          <button
            type="button"
            className="change-item-button"
            onClick={onShowPicker}
          >
            Change food item
          </button>
        </div>
      )}

      {isLoadingMenu && <p className="helper-text">Loading menu...</p>}

      {selectedPlaceId && !isLoadingMenu && showItemPicker && !hasSearchQuery && (
        <p className="helper-text">Search for a food item from this dining hall.</p>
      )}

      {selectedPlaceId &&
        !isLoadingMenu &&
        showItemPicker &&
        hasSearchQuery &&
        filteredMenuItems.length === 0 && (
          <p className="helper-text">No matching menu items found.</p>
        )}

      {selectedPlaceId && !isLoadingMenu && showItemPicker && hasSearchQuery && visibleItems.length > 0 && (
        <div className="item-search-results">
          <p className="result-label">
            {selectedItemId ? 'Change food item' : 'Select a food item'}
          </p>
          <div className="item-card-results">
            {visibleItems.map((item) => (
              <MenuItemCard
                key={item.id}
                name={item.name}
                description={item.description}
                isSelected={selectedItemId === item.id}
                onClick={() => onSelectItem(item)}
              />
            ))}
          </div>
          {hiddenResultCount > 0 && (
            <p className="helper-text">
              {hiddenResultCount} more results. Keep typing to narrow it down.
            </p>
          )}
        </div>
      )}

      {selectedPlaceId && !isLoadingMenu && menuItems.length === 0 && (
        <p className="helper-text">No menu items found for this dining hall.</p>
      )}
    </>
  )
}

export default ItemPicker
