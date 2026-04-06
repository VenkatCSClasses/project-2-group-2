function RatingUploadPage() {
  return (
    <main>
      <h1>Upload Rating</h1>

      <form>
        <div>
          <label htmlFor="itemId">Item ID</label>
          <input id="itemId" name="itemId" type="text" />
        </div>

        <div>
          <label htmlFor="itemName">Item Name</label>
          <input id="itemName" name="itemName" type="text" />
        </div>

        <div>
          <label htmlFor="diningHall">Dining Hall</label>
          <input id="diningHall" name="diningHall" type="text" />
        </div>

        <div>
          <label htmlFor="rating">Rating</label>
          <input id="rating" name="rating" type="number" min="1" max="5" />
        </div>

        <div>
          <label htmlFor="description">Description</label>
          <textarea id="description" name="description" />
        </div>

        <div>
          <label htmlFor="image">Image</label>
          <input id="image" name="image" type="file" accept="image/*" />
        </div>

        <button type="submit">Submit</button>
      </form>
    </main>
  )
}

export default RatingUploadPage