import os
import requests
from dotenv import load_dotenv

load_dotenv()

supabase_url = os.environ.get("VITE_SUPABASE_URL")
anon_key = os.environ.get("VITE_SUPABASE_ANON_KEY")

if not supabase_url or not anon_key:
    print("[ERROR] Missing SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env")
    exit(1)

headers = {
    "apikey": anon_key,
    "Content-Type": "application/json"
}

url = f"{supabase_url}/auth/v1/token?grant_type=password"

def try_signin(phone_val):
    payload = {
        "phone": phone_val,
        "password": "Password123"
    }
    try:
        res = requests.post(url, headers=headers, json=payload)
        print(f"Trying signin with: {phone_val}")
        print(f"Status Code: {res.status_code}")
        print(f"Response: {res.text}\n")
    except Exception as e:
        print(f"Exception: {e}\n")

try_signin("+919840857339")
try_signin("919840857339")
try_signin("9840857339")
