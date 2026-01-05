from fastapi.testclient import TestClient
from src import app

client = TestClient(app.app)


def test_get_activities_returns_activities():
    res = client.get("/activities")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, dict)
    # Check one known activity exists
    assert "Chess Club" in data


def test_signup_and_unsubscribe_flow():
    activity = "Chess Club"
    email = "testuser@example.com"

    # Ensure not already signed up
    res = client.get("/activities")
    participants_before = res.json()[activity]["participants"].copy()
    assert email not in participants_before

    # Signup
    res = client.post(f"/activities/{activity}/signup?email={email}")
    assert res.status_code == 200
    assert "Signed up" in res.json()["message"]

    # Verify participant present
    res = client.get("/activities")
    participants_after = res.json()[activity]["participants"]
    assert email in participants_after

    # Unregister
    res = client.delete(f"/activities/{activity}/participants?email={email}")
    assert res.status_code == 200
    assert "Removed" in res.json()["message"]

    # Verify participant removed
    res = client.get("/activities")
    participants_end = res.json()[activity]["participants"]
    assert email not in participants_end


def test_signup_duplicate_returns_400():
    activity = "Programming Class"
    email = "duplicate@example.com"

    # Ensure clean state: remove if exists
    try:
        client.delete(f"/activities/{activity}/participants?email={email}")
    except Exception:
        pass

    # First signup
    res = client.post(f"/activities/{activity}/signup?email={email}")
    assert res.status_code == 200

    # Second signup should fail
    res = client.post(f"/activities/{activity}/signup?email={email}")
    assert res.status_code == 400

    # Cleanup
    client.delete(f"/activities/{activity}/participants?email={email}")
