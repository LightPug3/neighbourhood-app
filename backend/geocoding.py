import googlemaps
import os
import logging
from typing import Optional, Tuple
from datetime import datetime
from models import GeocodingCache, GeocodingFailure, SessionLocal

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Google Maps client
gmaps = googlemaps.Client(key=os.getenv('GOOGLE_MAPS_API_KEY'))

# Default coordinates for parishes in Jamaica (center points)
PARISH_DEFAULTS = {
    'Kingston': (17.9970, -76.7936),
    'St Andrew': (18.0391, -76.7567),
    'St Catherine': (17.9919, -77.0011),
    'Clarendon': (17.9611, -77.2500),
    'Manchester': (18.0500, -77.5000),
    'St Elizabeth': (18.0667, -77.7500),
    'Westmoreland': (18.3167, -78.1333),
    'Hanover': (18.4167, -78.1333),
    'St James': (18.4833, -77.9167),
    'Trelawny': (18.3667, -77.6500),
    'St Ann': (18.4333, -77.2000),
    'St Mary': (18.3500, -76.9000),
    'Portland': (18.2000, -76.4500),
    'St Thomas': (17.9000, -76.3500)
}

def get_cached_coordinates(location: str, parish: str) -> Optional[Tuple[float, float]]:
    """Get coordinates from cache if available"""
    db = SessionLocal()
    try:
        cache_entry = db.query(GeocodingCache).filter(
            GeocodingCache.location == location,
            GeocodingCache.parish == parish
        ).first()
        
        if cache_entry:
            return (cache_entry.latitude, cache_entry.longitude)
        return None
    finally:
        db.close()

def cache_coordinates(location: str, parish: str, lat: float, lng: float):
    """Cache coordinates for future use"""
    db = SessionLocal()
    try:
        # Check if already exists
        existing = db.query(GeocodingCache).filter(
            GeocodingCache.location == location,
            GeocodingCache.parish == parish
        ).first()
        
        if not existing:
            cache_entry = GeocodingCache(
                location=location,
                parish=parish,
                latitude=lat,
                longitude=lng
            )
            db.add(cache_entry)
            db.commit()
            logger.info(f"Cached coordinates for {location}, {parish}")
    except Exception as e:
        logger.error(f"Failed to cache coordinates: {e}")
        db.rollback()
    finally:
        db.close()

def log_geocoding_failure(atm_id: str, location: str, parish: str, error: str):
    """Log geocoding failure for retry later"""
    db = SessionLocal()
    try:
        # Check if failure already exists
        existing = db.query(GeocodingFailure).filter(
            GeocodingFailure.atm_id == atm_id
        ).first()
        
        if existing:
            existing.retry_count += 1
            existing.error_message = error
            existing.last_retry = datetime.utcnow()
        else:
            failure = GeocodingFailure(
                atm_id=atm_id,
                location=location,
                parish=parish,
                error_message=error,
                retry_count=1
            )
            db.add(failure)
        
        db.commit()
        logger.warning(f"Logged geocoding failure for ATM {atm_id}: {error}")
    except Exception as e:
        logger.error(f"Failed to log geocoding failure: {e}")
        db.rollback()
    finally:
        db.close()

def get_parish_default_coordinates(parish: str) -> Tuple[float, float]:
    """Get default coordinates for a parish"""
    # Clean parish name and try to match
    parish_clean = parish.strip().title()
    
    # Try exact match first
    if parish_clean in PARISH_DEFAULTS:
        return PARISH_DEFAULTS[parish_clean]
    
    # Try partial matches
    for parish_key in PARISH_DEFAULTS:
        if parish_clean in parish_key or parish_key in parish_clean:
            return PARISH_DEFAULTS[parish_key]
    
    # Default to St Andrew if no match found
    logger.warning(f"No default coordinates found for parish: {parish}. Using St Andrew default.")
    return PARISH_DEFAULTS['St Andrew']

def geocode_location(location: str, parish: str, atm_id: str) -> Tuple[float, float, bool]:
    """
    Geocode a location using Google Maps API with caching
    Returns (latitude, longitude, geocoding_failed)
    """
    # First check cache
    cached_coords = get_cached_coordinates(location, parish)
    if cached_coords:
        logger.info(f"Using cached coordinates for {location}, {parish}")
        return cached_coords[0], cached_coords[1], False
    
    try:
        # Construct search query
        search_query = f"{location}, {parish}, Jamaica"
        logger.info(f"Geocoding: {search_query}")
        
        # Geocode with Google Maps
        geocode_result = gmaps.geocode(search_query)
        
        if geocode_result and len(geocode_result) > 0:
            result = geocode_result[0]
            lat = result['geometry']['location']['lat']
            lng = result['geometry']['location']['lng']
            
            # Cache the successful result
            cache_coordinates(location, parish, lat, lng)
            
            logger.info(f"Successfully geocoded {location}, {parish}: ({lat}, {lng})")
            return lat, lng, False
        else:
            # No results found
            error_msg = f"No geocoding results found for {search_query}"
            logger.warning(error_msg)
            log_geocoding_failure(atm_id, location, parish, error_msg)
            
            # Use parish default
            default_coords = get_parish_default_coordinates(parish)
            return default_coords[0], default_coords[1], True
            
    except Exception as e:
        error_msg = f"Geocoding API error for {location}, {parish}: {str(e)}"
        logger.error(error_msg)
        log_geocoding_failure(atm_id, location, parish, error_msg)
        
        # Use parish default
        default_coords = get_parish_default_coordinates(parish)
        return default_coords[0], default_coords[1], True

def retry_failed_geocoding():
    """Retry geocoding for previously failed locations"""
    db = SessionLocal()
    try:
        # Get failures that haven't been retried too many times (max 3 retries)
        failures = db.query(GeocodingFailure).filter(
            GeocodingFailure.retry_count < 3
        ).all()
        
        for failure in failures:
            logger.info(f"Retrying geocoding for ATM {failure.atm_id}")
            lat, lng, failed = geocode_location(failure.location, failure.parish, failure.atm_id)
            
            if not failed:
                # Success! Remove from failures table
                db.delete(failure)
                logger.info(f"Successfully geocoded ATM {failure.atm_id} on retry")
            # If still failed, the log_geocoding_failure function will increment retry count
        
        db.commit()
    except Exception as e:
        logger.error(f"Error during retry geocoding: {e}")
        db.rollback()
    finally:
        db.close()
