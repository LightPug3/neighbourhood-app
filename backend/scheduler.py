import requests
import logging
import os
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler
from models import ATM, SessionLocal
from geocoding import geocode_location, retry_failed_geocoding
from requests.auth import HTTPBasicAuth

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# API configuration
API_URL = "https://sbj-atmp-dev.pre-prod.ch.sagicor.com/api/v1/status"
API_USERNAME = os.getenv('API_USERNAME')
API_PASSWORD = os.getenv('API_PASSWORD')

def fetch_atm_data():
    """Fetch ATM data from external API"""
    try:
        logger.info("Fetching ATM data from external API...")
        
        # Add headers to mimic a browser request
        headers = {
            "Accept": "application/json",
            "User-Agent": "Mozilla/5.0"
        }
        
        response = requests.get(
            API_URL,
            auth=HTTPBasicAuth(API_USERNAME, API_PASSWORD),
            headers=headers,
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            logger.info(f"Successfully fetched {len(data)} ATM records")
            return data
        else:
            logger.error(f"API request failed with status code: {response.status_code}")
            logger.error(f"Response content: {response.text[:500]}")
            return None
            
    except Exception as e:
        logger.error(f"Error fetching ATM data: {e}")
        return None

def process_atm_data(api_data):
    """Process API data and update database"""
    if not api_data:
        logger.warning("No API data to process")
        return
    
    db = SessionLocal()
    try:
        processed_count = 0
        geocoded_count = 0
        
        for atm_record in api_data:
            try:
                atm_id = atm_record.get('ATM_Id')
                original_location = atm_record.get('Location')
                parish = atm_record.get('Parish')
                
                # Add "sbj_" prefix to location before storing
                location = f"sbj_{original_location}"
                
                deposit = atm_record.get('Deposit', 'N') == 'Y'
                status = atm_record.get('Status', 'UNKNOWN')
                last_used = atm_record.get('Last_Used')
                timestamp_str = atm_record.get('TimeStamp')
                
                # Parse timestamp
                try:
                    timestamp = datetime.strptime(timestamp_str, '%Y-%m-%d %H:%M:%S')
                except:
                    timestamp = datetime.utcnow()
                
                # Check if ATM already exists
                existing_atm = db.query(ATM).filter(ATM.atm_id == atm_id).first()
                
                if existing_atm:
                    # Update existing ATM
                    existing_atm.location = location  # Now with sbj_ prefix
                    existing_atm.parish = parish
                    existing_atm.deposit_available = deposit
                    existing_atm.status = status
                    existing_atm.last_used = last_used
                    existing_atm.timestamp = timestamp
                    existing_atm.updated_at = datetime.utcnow()
                    
                    # Geocode if coordinates are missing or geocoding previously failed
                    # Use original location (without prefix) for geocoding
                    if (existing_atm.latitude is None or existing_atm.longitude is None or 
                        existing_atm.geocoding_failed):
                        
                        lat, lng, failed = geocode_location(original_location, parish, atm_id)
                        existing_atm.latitude = lat
                        existing_atm.longitude = lng
                        existing_atm.geocoding_failed = failed
                        
                        if not failed:
                            geocoded_count += 1
                    
                    logger.debug(f"Updated ATM {atm_id} with location: {location}")
                    
                else:
                    # Geocode new ATM location using original location (without prefix)
                    lat, lng, geocoding_failed = geocode_location(original_location, parish, atm_id)
                    
                    # Create new ATM record with prefixed location
                    new_atm = ATM(
                        atm_id=atm_id,
                        location=location,  # Stored with sbj_ prefix
                        parish=parish,
                        latitude=lat,
                        longitude=lng,
                        deposit_available=deposit,
                        status=status,
                        last_used=last_used,
                        timestamp=timestamp,
                        geocoding_failed=geocoding_failed
                    )
                    
                    db.add(new_atm)
                    
                    if not geocoding_failed:
                        geocoded_count += 1
                    
                    logger.debug(f"Created new ATM {atm_id} with location: {location}")
                
                processed_count += 1
                
            except Exception as e:
                logger.error(f"Error processing ATM record {atm_record}: {e}")
                continue
        
        db.commit()
        logger.info(f"Successfully processed {processed_count} ATM records. "
                   f"Geocoded {geocoded_count} locations.")
        
    except Exception as e:
        logger.error(f"Error processing ATM data: {e}")
        db.rollback()
    finally:
        db.close()

def scheduled_data_update():
    """Scheduled function to update ATM data"""
    logger.info("Starting scheduled ATM data update...")
    
    # Fetch data from API
    api_data = fetch_atm_data()
    
    # Process and store data
    process_atm_data(api_data)
    
    # Retry failed geocoding
    retry_failed_geocoding()
    
    logger.info("Scheduled ATM data update completed")

def start_scheduler():
    """Start the background scheduler"""
    scheduler = BackgroundScheduler()
    
    # Schedule data update every 10 minutes
    scheduler.add_job(
        func=scheduled_data_update,
        trigger="interval",
        minutes=10,
        id='atm_data_update',
        name='Update ATM data from API',
        replace_existing=True
    )
    
    scheduler.start()
    logger.info("Scheduler started - will update ATM data every 10 minutes")
    
    # Run initial update
    scheduled_data_update()
    
    return scheduler

if __name__ == "__main__":
    start_scheduler()
