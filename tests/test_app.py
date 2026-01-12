from fastapi.testclient import TestClient
import copy
import pytest
from urllib.parse import quote

from src.app import app, activities

client = TestClient(app)

@pytest.fixture(autouse=True)
def reset_activities():
    """Restore the in-memory activities after each test to avoid cross-test pollution."""
    original = copy.deepcopy(activities)
    yield
    activities.clear()
    activities.update(original)


def test_get_activities_returns_dict():
    res = client.get("/activities")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, dict)
    assert "Basketball Team" in data


def test_signup_and_unregister_flow():
    activity = "Basketball Team"
    email = "test_student@example.com"

    # Ensure participant not present initially
    res = client.get("/activities")
    assert email not in res.json()[activity]["participants"]

    # Sign up
    res = client.post(f"/activities/{quote(activity)}/signup?email={quote(email)}")
    assert res.status_code == 200
    assert f"Signed up {email}" in res.json()["message"]

    # Verify participant added
    res = client.get("/activities")
    assert email in res.json()[activity]["participants"]

    # Duplicate signup should fail
    res = client.post(f"/activities/{quote(activity)}/signup?email={quote(email)}")
    assert res.status_code == 400

    # Unregister
    res = client.delete(f"/activities/{quote(activity)}/unregister?email={quote(email)}")
    assert res.status_code == 200
    assert f"Unregistered {email}" in res.json()["message"]

    # Verify participant removed
    res = client.get("/activities")
    assert email not in res.json()[activity]["participants"]

    # Unregistering again should return 404
    res = client.delete(f"/activities/{quote(activity)}/unregister?email={quote(email)}")
    assert res.status_code == 404
