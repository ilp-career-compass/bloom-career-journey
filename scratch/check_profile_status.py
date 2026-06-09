import os
import requests
from dotenv import load_dotenv

load_dotenv()

supabase_url = os.environ.get("VITE_SUPABASE_URL")
service_role_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not supabase_url or not service_role_key:
    print("❌ Error: Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env")
    exit(1)

headers = {
    "apikey": service_role_key,
    "Authorization": f"Bearer {service_role_key}",
    "Content-Type": "application/json"
}

# 1. Get user ID for alwin@gmail.com
print("1. Fetching user profile for alwin@gmail.com...")
res = requests.get(f"{supabase_url}/rest/v1/users?email=eq.alwin@gmail.com", headers=headers)
if res.status_code != 200 or not res.json():
    print("❌ User not found.")
    exit(1)

user = res.json()[0]
user_id = user["id"]
print(f"User ID: {user_id}")

# 2. Get student ID
res_student = requests.get(f"{supabase_url}/rest/v1/students?user_id=eq.{user_id}", headers=headers)
if res_student.status_code != 200 or not res_student.json():
    print("❌ Student not found.")
    exit(1)

student = res_student.json()[0]
student_id = student["id"]
print(f"Student ID: {student_id}")

# 3. Get profile_card_cache rows
print("\n=== PROFILE CARD CACHE ROWS ===")
res_cache = requests.get(f"{supabase_url}/rest/v1/profile_card_cache?student_id=eq.{user_id}", headers=headers)
if res_cache.status_code == 200:
    for row in res_cache.json():
        print(f"Type: {row['assessment_type']}")
        print(f"  Approval status: {row.get('approval_status')}")
        print(f"  Keywords/Data: {row.get('keywords')}")
        print(f"  Generated at: {row.get('generated_at')}")
else:
    print(f"❌ Error fetching cache: {res_cache.text}")

# 4. Get assessment_responses rows
print("\n=== ASSESSMENT RESPONSES ===")
res_responses = requests.get(f"{supabase_url}/rest/v1/assessment_responses?student_id=eq.{student_id}", headers=headers)
if res_responses.status_code == 200:
    for row in res_responses.json():
        print(f"Type: {row['assessment_type']}")
        print(f"  Review status: {row.get('review_status')}")
        print(f"  Completed at: {row.get('completed_at')}")
        print(f"  Has responses: {bool(row.get('responses'))}")
        if row['assessment_type'] in ('hobbies', 'school_learning', 'dreams', 'role_models'):
            print(f"  Responses: {row.get('responses')}")
else:
    print(f"❌ Error fetching responses: {res_responses.text}")
