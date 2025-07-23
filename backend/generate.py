# generate.py
import random
import time
from datetime import datetime, timedelta
import mysql.connector

ATM_LIST = [
    ("151", "Worthy Park", "St Catherine", "N"),
    ("153", "Eight Rivers Town", "St Anns", "Y"),
    ("111", "FESCO Chapelton Road", "Clarendon", "N"),
    ("155", "SBJ Drax Hall", "St Ann", "N"),
    # Add more static entries as needed
]

STATUSES = ["WORKING", "DOWN"]

# DB Credentials
DB_CONFIG = {
    'host': 'localhost',
    'user': 'dummy_user',
    'password': 'Dummy_pass12#',
    'database': 'dummy_data'
}

def generate_data():
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    data = []
    for atm_id, location, parish, deposit in ATM_LIST:
        last_used = str(timedelta(seconds=random.randint(30, 6*3600)))  # random last used time
        status = random.choice(STATUSES)
        data.append((timestamp, atm_id, location, parish, deposit, status, last_used))
    return data

def store_data(data):
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()
    cursor.executemany("""
        INSERT INTO atm_status (TimeStamp, ATM_Id, Location, Parish, Deposit, Status, Last_Used)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """, data)
    conn.commit()
    cursor.close()
    conn.close()

if __name__ == '__main__':
    while True:
        data = generate_data()
        store_data(data)
        time.sleep(300)  # sleep 5 mins
