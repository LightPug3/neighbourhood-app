import requests
import os
from dotenv import load_dotenv
from requests.auth import HTTPBasicAuth

# Load environment variables
load_dotenv()

API_URL = "https://sbj-atmp-dev.pre-prod.ch.sagicor.com/api/v1/status"
API_USERNAME = os.getenv('API_USERNAME')
API_PASSWORD = os.getenv('API_PASSWORD')
# JWT config
SECRET_KEY = os.getenv("SECRET_KEY")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

# Email config
EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")

print(f"API URL: {API_URL}")
print(f"Username: {API_USERNAME}")
print(f"Password: {'*' * len(API_PASSWORD) if API_PASSWORD else 'None'}")
print(f"Username is None: {API_USERNAME is None}")
print(f"Password is None: {API_PASSWORD is None}")

print(f"Email address is: {EMAIL_ADDRESS}")
print(f"Email password is: {EMAIL_PASSWORD}")
print(f"Secret Key is: {SECRET_KEY}")
print(f"JWT algorithm: {JWT_ALGORITHM}")


if not API_USERNAME or not API_PASSWORD:
    print("ERROR: Missing credentials in .env file!")
    exit(1)

try:
    print("\nMaking API request...")
    response = requests.get(
        API_URL,
        auth=HTTPBasicAuth(API_USERNAME, API_PASSWORD),
        timeout=30
    )
    
    print(f"Status Code: {response.status_code}")
    print(f"Headers: {dict(response.headers)}")
    
    if response.status_code == 200:
        print("SUCCESS!")
        data = response.json()
        print(f"Number of records: {len(data)}")
        if len(data) > 0:
            print("First record:", data[0])
    else:
        print(f"ERROR: {response.status_code}")
        print(f"Response text: {response.text}")
        
except Exception as e:
    print(f"Exception occurred: {e}")
