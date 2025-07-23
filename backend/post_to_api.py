# post_to_api.py
import requests
import mysql.connector
from datetime import datetime, timedelta
import time
import json

DB_CONFIG = {
    'host': 'localhost',
    'user': 'dummy_user',
    'password': 'Dummy_pass12#',
    'database': 'dummy_data'
}

API_URL = 'http://3.15.215.61:7000/test-api/status'  # Change to your IP

def fetch_latest_data():
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT * FROM atm_status
        WHERE TimeStamp = (SELECT MAX(TimeStamp) FROM atm_status)
    """)
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return rows

def post_to_api(data):
    try:
        response = requests.post(API_URL, json=data)
        print(f"POST Status: {response.status_code}")
    except Exception as e:
        print(f"Failed to post data: {e}")

if __name__ == '__main__':
    while True:
        data = fetch_latest_data()
        post_to_api(data)
        time.sleep(600)  # sleep 10 mins
