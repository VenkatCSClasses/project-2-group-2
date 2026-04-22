import type { FormErrors, PlaceResult } from './types'

type DiningHallPickerProps = {
  value: string
  selectedPlaceName: string
  placeResults: PlaceResult[]
  isSearchingPlaces: boolean
  errors: FormErrors
  onChange: (value: string) => void
  onSelectPlace: (place: PlaceResult) => void
}

function DiningHallPicker({
  value,
  selectedPlaceName,
  placeResults,
  isSearchingPlaces,
  errors,
  onChange,
  onSelectPlace,
}: DiningHallPickerProps) {
  const showResults = value.trim().length > 0 && placeResults.length > 0

  return (
    <>
      <div className="form-group">
        <label htmlFor="diningHall">Dining Hall</label>

        <div className="search-row">
          <input
            id="diningHall"
            name="diningHall"
            type="text"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Search for a dining hall"
            autoComplete="off"
          />
        </div>

        {errors.diningHall && <p className="field-error">{errors.diningHall}</p>}
      </div>

      {selectedPlaceName && (
        <p className="selected-text">
          Selected dining hall: <strong>{selectedPlaceName}</strong>
        </p>
      )}

      {isSearchingPlaces && <p className="helper-text">Searching dining halls...</p>}

      {showResults && (
        <div className="result-box">
          <p className="result-label">Select a dining hall</p>
          <ul className="result-list">
            {placeResults.map((place) => (
              <li key={place.id} className="result-item">
                <button
                  type="button"
                  className="result-button"
                  onClick={() => onSelectPlace(place)}
                >
                  {place.name}
                </button>
                {place.description ? (
                  <span className="result-description">{place.description}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  )
}

export default DiningHallPicker
