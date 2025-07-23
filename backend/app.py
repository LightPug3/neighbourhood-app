from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import logging
from models import ATM, SessionLocal, create_tables
from scheduler import start_scheduler
import atexit

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Initialize database
create_tables()

# Start scheduler
scheduler = start_scheduler()

# Shut down scheduler when app exits
atexit.register(lambda: scheduler.shutdown())

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'message': 'API is running'})

@app.route('/api/atms', methods=['GET'])
def get_atms():
    """Get all ATM data"""
    try:
        db = SessionLocal()
        atms = db.query(ATM).all()

        atm_list = []
        for atm in atms:
            # Map database fields to frontend expected format
            atm_data = {
                'id': atm.id,
                'bank': map_location_to_bank(atm.location),  # We'll need to infer bank from location
                'bankName': get_bank_full_name(map_location_to_bank(atm.location)),
                'type': 'ATM' if not atm.deposit_available else 'ABM',
                'lat': atm.latitude,
                'lng': atm.longitude,
                'withdrawalFee': get_withdrawal_fee(map_location_to_bank(atm.location)),
                'depositFee': get_deposit_fee(map_location_to_bank(atm.location)),
                'lowOnCash': is_low_on_cash(atm.last_used),
                'functional': atm.status.upper() == 'WORKING',
                'supportsCurrency': 'JMD',  # Default to JMD for Jamaica
                'address': f"{atm.location}, {atm.parish}",
                'location': atm.location,
                'parish': atm.parish,
                'geocodingFailed': atm.geocoding_failed,
                'lastUpdated': atm.updated_at.isoformat() if atm.updated_at else None
            }
            atm_list.append(atm_data)

        db.close()
        return jsonify(atm_list)

    except Exception as e:
        logger.error(f"Error fetching ATMs: {e}")
        return jsonify({'error': 'Failed to fetch ATM data'}), 500

@app.route('/api/atms/stats', methods=['GET'])
def get_atm_stats():
    """Get ATM statistics"""
    try:
        db = SessionLocal()

        total_atms = db.query(ATM).count()
        working_atms = db.query(ATM).filter(ATM.status == 'WORKING').count()
        geocoding_failed = db.query(ATM).filter(ATM.geocoding_failed == True).count()

        stats = {
            'total': total_atms,
            'working': working_atms,
            'not_working': total_atms - working_atms,
            'geocoding_failed': geocoding_failed,
            'last_updated': get_last_update_time()
        }

        db.close()
        return jsonify(stats)

    except Exception as e:
        logger.error(f"Error fetching ATM stats: {e}")
        return jsonify({'error': 'Failed to fetch ATM statistics'}), 500

def map_location_to_bank(location):
    """Map location to bank based on common patterns"""
    location_lower = location.lower()

    if 'scotia' in location_lower or 'bns' in location_lower:
        return 'BNS'
    elif 'ncb' in location_lower or 'national commercial' in location_lower:
        return 'NCB'
    elif 'jmmb' in location_lower:
        return 'JMMB'
    elif 'cibc' in location_lower or 'firstcaribbean' in location_lower:
        return 'CIBC'
    elif 'jamaica national' in location_lower or ' jn ' in location_lower:
        return 'JN'
    elif 'sbj' in location_lower:
        return 'Sagicor'
    else:
        # Default to NCB for unknown locations
        return 'NCB'

def get_bank_full_name(bank_code):
    """Get full bank name from code"""
    bank_names = {
        'BNS': 'Bank of Nova Scotia',
        'NCB': 'National Commercial Bank',
        'JMMB': 'Jamaica Money Market Brokers',
        'CIBC': 'CIBC FirstCaribbean',
        'JN': 'Jamaica National',
        'FCIB': 'First Caribbean International Bank',
        'Sagicor': 'Sagicor Bank'
    }
    return bank_names.get(bank_code, 'Unknown Bank')

def get_withdrawal_fee(bank_code):
    """Get typical withdrawal fees by bank (in JMD)"""
    fees = {
        'BNS': 150,
        'NCB': 100,
        'JMMB': 200,
        'CIBC': 175,
        'JN': 125,
        'FCIB': 175,
        'Sagicor': 150
    }
    return fees.get(bank_code, 150)

def get_deposit_fee(bank_code):
    """Get typical deposit fees by bank (in JMD)"""
    fees = {
        'BNS': 75,
        'NCB': 50,
        'JMMB': 100,
        'CIBC': 85,
        'JN': 60,
        'FCIB': 85,
        'Sagicor': 75
    }
    return fees.get(bank_code, 75)

def is_low_on_cash(last_used_str):
    """Determine if ATM is low on cash based on last used time"""
    if not last_used_str:
        return False

    try:
        # Parse HH:MM:SS format and convert to minutes
        time_parts = last_used_str.split(':')
        hours = int(time_parts[0])
        minutes = int(time_parts[1])
        total_minutes = hours * 60 + minutes

        # Consider low on cash if last used more than 2 hours ago
        return total_minutes > 120
    except:
        return False

def get_last_update_time():
    """Get the timestamp of the most recent update"""
    try:
        db = SessionLocal()
        latest_atm = db.query(ATM).order_by(ATM.updated_at.desc()).first()
        db.close()

        if latest_atm and latest_atm.updated_at:
            return latest_atm.updated_at.isoformat()
        return None
    except:
        return None

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=False)
