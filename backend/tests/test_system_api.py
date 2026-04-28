def test_global_root(client):
    response = client.get("/")
    assert response.status_code == 200

def test_review_flow(client):
    """
    This test registers a user, logs in, retrieves items, submits a review for an item (while testing authentication), and checks that the review was saved correctly.
    """
    resp = client.post("/auth/register", data={"username": "testuser", "password": "testpassword123", "email": "test@example.com"})
    assert resp.status_code == 200
    resp = client.post("/auth/login", data={"username": "testuser", "password": "testpassword123"})
    assert resp.status_code == 200
    json_resp = resp.json()
    assert "access_token" in json_resp

    resp = client.get("/items/")
    assert resp.status_code == 200
    items_resp = resp.json()
    assert "items" in items_resp
    for item in items_resp["items"]:
        assert "id" in item
        assert "name" in item
        assert "description" in item

    item_id = items_resp["items"][0]["id"]
    resp = client.get(f"/items/{item_id}")
    assert resp.status_code == 200
    item_resp = resp.json()
    assert "item_info" in item_resp
    assert "id" in item_resp["item_info"]
    assert "name" in item_resp["item_info"]
    assert "description" in item_resp["item_info"]


    resp = client.post(f"/items/{item_id}/review", data={"rating": 5, "description": "it aight"}) 
    assert resp.status_code == 401 # Unauthorized since we didn't include the token

    resp = client.post(f"/items/{item_id}/review", data={"rating": 5, "description": "it aight"}, headers={"Authorization": f"Bearer {json_resp['access_token']}"})
    assert resp.status_code == 200

    resp = client.get(f"/items/{item_id}/reviews")
    assert resp.status_code == 200
    reviews_resp = resp.json()
    assert "reviews" in reviews_resp
    for review in reviews_resp["reviews"]:
        assert "id" in review
        assert "star_rating" in review
        assert "content" in review

    assert reviews_resp["reviews"][0]["content"] == "it aight"
    

