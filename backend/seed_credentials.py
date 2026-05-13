"""
Seed sample credentials for test@example.com via the live API.
Run this while the backend is running on port 5001.
"""
import json
import base64
import requests

BASE = "http://localhost:5001/api"
EMAIL = "test@example.com"
PASSWORD = "password123"

SAMPLE_CREDENTIALS = [
    {
        "website": "github.com",
        "username": "testuser",
        "password": "Gh!tH0b_S3cur3#2024",
        "notes": "Personal GitHub account",
    },
    {
        "website": "google.com",
        "username": "testuser@gmail.com",
        "password": "G00gl3_P@ssw0rd!",
        "notes": "Google Workspace account",
    },
    {
        "website": "facebook.com",
        "username": "testuser@gmail.com",
        "password": "facebook123",          # weak — intentional for demo
        "notes": "",
    },
    {
        "website": "twitter.com",
        "username": "testuser_tw",
        "password": "Tw!tt3r$ecure99",
        "notes": "Twitter / X account",
    },
    {
        "website": "netflix.com",
        "username": "testuser@gmail.com",
        "password": "facebook123",          # reused — intentional for demo
        "notes": "Family plan",
    },
    {
        "website": "amazon.com",
        "username": "testuser@gmail.com",
        "password": "Am@z0n_Buy#2024!",
        "notes": "Prime membership",
    },
    {
        "website": "dropbox.com",
        "username": "testuser@gmail.com",
        "password": "drop",                 # very weak — intentional for demo
        "notes": "",
    },
    {
        "website": "linkedin.com",
        "username": "testuser@gmail.com",
        "password": "L!nkd1n$Pr0f3ss10n@l",
        "notes": "Professional profile",
    },
]


def main():
    # 1. Login to get JWT
    print(f"[*] Logging in as {EMAIL} ...")
    r = requests.post(f"{BASE}/login", json={"email": EMAIL, "password": PASSWORD})
    if r.status_code != 200:
        print(f"[!] Login failed: {r.text}")
        print("    Make sure the backend is running and the user exists.")
        print("    Run: python create_sample.py  first.")
        return

    token = r.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("[+] Login successful.\n")

    # 2. Check existing credentials
    r = requests.get(f"{BASE}/credentials", headers=headers)
    existing = r.json() if r.status_code == 200 else []
    existing_sites = {c.get("website") for c in existing}
    print(f"[*] Found {len(existing)} existing credentials: {existing_sites or 'none'}")

    # 3. Add each sample credential (skip if already exists)
    added = 0
    skipped = 0
    for cred in SAMPLE_CREDENTIALS:
        if cred["website"] in existing_sites:
            print(f"    skip  {cred['website']} (already exists)")
            skipped += 1
            continue

        r = requests.post(f"{BASE}/credentials", json=cred, headers=headers)
        if r.status_code == 201:
            print(f"    [+]   {cred['website']}  ({cred['username']})")
            added += 1
        else:
            print(f"    [!]   {cred['website']} FAILED: {r.text}")

    print(f"\n[✓] Done — added {added} credentials, skipped {skipped}.")


if __name__ == "__main__":
    main()
