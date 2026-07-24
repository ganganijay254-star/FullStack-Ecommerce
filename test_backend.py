"""Test script to debug backend 500 errors."""
import requests
import json

BASE = "http://localhost:5000"

def test():
    # Step 1: Login
    print("=== Step 1: Login ===")
    r = requests.post(f"{BASE}/api/auth/login", json={
        "email": "testuser@example.com",
        "password": "test123"
    })
    print(f"Login Status: {r.status_code}")
    data = r.json()
    token = data.get("token")
    print(f"Token: {token[:50]}...")
    print(f"Full login response: {json.dumps(data, indent=2)}")
    
    # Step 2: Test with explicit header
    headers = {"Authorization": f"Bearer {token}"}
    print(f"\n=== Step 2: GET /api/products ===")
    r = requests.get(f"{BASE}/api/products", headers=headers)
    print(f"Status: {r.status_code}")
    print(f"Response: {r.text[:2000]}")
    
    # Step 3: Test categories
    print(f"\n=== Step 3: GET /api/products/categories ===")
    r = requests.get(f"{BASE}/api/products/categories", headers=headers)
    print(f"Status: {r.status_code}")
    print(f"Response: {r.text[:2000]}")

if __name__ == "__main__":
    test()
