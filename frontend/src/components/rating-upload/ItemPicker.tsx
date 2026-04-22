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

      {selectedPlaceId && !isLoadingMenu && showItemPicker && filteredMenuItems.length > 0 && (
        <div className="result-box">
          <p className="result-label">
            {selectedItemId ? 'Change food item' : 'Select a food item'}
          </p>
          <ul className="result-list">
            {filteredMenuItems.map((item) => (
              <li key={item.id} className="result-item">
                <button
                  type="button"
                  className="result-button"
                  onClick={() => onSelectItem(item)}
                >
                  {item.name}
                </button>
                {item.description ? (
                  <span className="result-description">{item.description}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      )}

      {selectedPlaceId && !isLoadingMenu && menuItems.length === 0 && (
        <p className="helper-text">No menu items found for this dining hall.</p>
      )}
    </>
  )
}

export default ItemPicker
