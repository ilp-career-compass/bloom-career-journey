import requests
import json

url = "https://vvnogvhdkkevfwcdlwsr.supabase.co/rest/v1/users"
headers = {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2bm9ndmhka2tldmZ3Y2Rsd3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NDI1MDIsImV4cCI6MjA5NDQxODUwMn0.SczxSeHMyVK3Srobb7PsLZOK2vRzvmLZhn_ScW09DP0",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2bm9ndmhka2tldmZ3Y2Rsd3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NDI1MDIsImV4cCI6MjA5NDQxODUwMn0.SczxSeHMyVK3Srobb7PsLZOK2vRzvmLZhn_ScW09DP0",
}

try:
    res = requests.get(url, headers=headers)
    print("Status:", res.status_code)
    if res.status_code == 200:
        data = res.json()
        print(f"Total rows: {len(data)}")
        for row in data[:10]:
            print(row)
    else:
        print("Error:", res.text)
except Exception as e:
    print("Error:", e)
