# recommendation.py - ATM Recommendation System for Neighbourhood App

import json
import math
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy import and_, or_
from models import ATM, UserPreferences, SessionLocal
import logging

logger = logging.getLogger(__name__)

class ATMRecommendationEngine:
    """
    ATM Recommendation Engine that provides intelligent ATM suggestions
    based on user preferences, location, and ATM characteristics
    """
    
    # Scoring weights for different factors
    WEIGHTS = {
        'distance': 0.30,      # 30% - Distance from user
        'bank_preference': 0.25,  # 25% - Preferred bank match
        'functionality': 0.20,   # 20% - ATM working status
        'deposit_availability': 0.15,  # 15% - Deposit feature if needed
        'wait_time': 0.10      # 10% - Estimated wait time
    }
    
    # Bank fee mapping (you can make this dynamic from database later)
    BANK_FEES = {
        'NCB': 50,
        'BNS': 75,
        'JMMB': 100,
        'CIBC': 150,
        'JN': 75,
        'FCIB': 125,
        'Sagicor': 100,
        'Scotia': 150,
        'Unknown': 200
    }
    
    def __init__(self):
        self.earth_radius_km = 6371  # Earth's radius in kilometers
    
    def haversine_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculate the great circle distance between two points on Earth
        using the haversine formula
        """
        # Convert latitude and longitude from degrees to radians
        lat1_rad = math.radians(lat1)
        lon1_rad = math.radians(lon1)
        lat2_rad = math.radians(lat2)
        lon2_rad = math.radians(lon2)
        
        # Calculate differences
        dlat = lat2_rad - lat1_rad
        dlon = lon2_rad - lon1_rad
        
        # Haversine formula
        a = (math.sin(dlat/2)**2 + 
             math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon/2)**2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        
        return self.earth_radius_km * c
    
    def get_bank_from_location(self, location: str) -> str:
        """Extract bank name from ATM location string"""
        if not location:
            return 'Unknown'
        
        location_upper = location.upper()
        
        # Check for bank patterns in the location string
        bank_patterns = {
            'NCB': ['NCB', 'NATIONAL COMMERCIAL BANK'],
            'BNS': ['BNS', 'BANK OF NOVA SCOTIA', 'SCOTIABANK'],
            'JMMB': ['JMMB', 'JAMAICA MONEY MARKET'],
            'CIBC': ['CIBC', 'FIRSTCARIBBEAN'],
            'JN': ['JN BANK', 'JAMAICA NATIONAL'],
            'FCIB': ['FCIB', 'FIRSTCARIBBEAN'],
            'Sagicor': ['SAGICOR'],
            'Scotia': ['SCOTIA', 'SCOTIABANK']
        }
        
        for bank, patterns in bank_patterns.items():
            if any(pattern in location_upper for pattern in patterns):
                return bank
        
        return 'Unknown'
    
    def estimate_wait_time(self, last_used_str: Optional[str]) -> int:
        """
        Estimate wait time based on when ATM was last used
        Returns estimated number of people in queue
        """
        if not last_used_str:
            return 0  # No data, assume no wait
        
        try:
            # Parse the last_used time (assuming format HH:MM:SS)
            time_parts = last_used_str.split(':')
            if len(time_parts) != 3:
                return 0
            
            last_used_time = datetime.now().replace(
                hour=int(time_parts[0]),
                minute=int(time_parts[1]),
                second=int(time_parts[2]),
                microsecond=0
            )
            
            current_time = datetime.now()
            time_diff = current_time - last_used_time
            
            # Convert to minutes for easier calculation
            minutes_since_last_use = time_diff.total_seconds() / 60
            
            # Estimate wait based on time since last use
            if minutes_since_last_use <= 10:
                return 5  # High traffic, ~5 people
            elif minutes_since_last_use <= 30:
                return 3  # Medium traffic, ~3 people
            elif minutes_since_last_use <= 60:
                return 1  # Low traffic, ~1 person
            else:
                return 0  # No wait expected
                
        except (ValueError, AttributeError):
            return 0  # If parsing fails, assume no wait
    
    def calculate_atm_score(self, atm: ATM, user_lat: float, user_lng: float, 
                           preferences: UserPreferences) -> Dict[str, Any]:
        """
        Calculate a comprehensive score for an ATM based on multiple factors
        """
        try:
            # Parse user preferences
            preferred_banks = json.loads(preferences.preferred_banks) if isinstance(preferences.preferred_banks, str) else preferences.preferred_banks
            transaction_types = json.loads(preferences.transaction_types) if isinstance(preferences.transaction_types, str) else preferences.transaction_types
        except (json.JSONDecodeError, AttributeError):
            preferred_banks = ['Any']
            transaction_types = ['both']
        
        # Initialize score components
        scores = {
            'distance_score': 0,
            'bank_preference_score': 0,
            'functionality_score': 0,
            'deposit_availability_score': 0,
            'wait_time_score': 0,
            'total_score': 0,
            'distance_km': 0,
            'estimated_wait_people': 0,
            'bank': 'Unknown',
            'reasons': []
        }
        
        # Calculate distance
        if atm.latitude and atm.longitude:
            distance_km = self.haversine_distance(user_lat, user_lng, float(atm.latitude), float(atm.longitude))
            scores['distance_km'] = distance_km
            
            # Distance score: closer is better (max 15km for full score)
            max_reasonable_distance = 15.0
            if distance_km <= max_reasonable_distance:
                scores['distance_score'] = 1.0 - (distance_km / max_reasonable_distance)
            else:
                scores['distance_score'] = 0.0
        
        # Bank preference score
        bank = self.get_bank_from_location(atm.location)
        scores['bank'] = bank
        
        if 'Any' in preferred_banks or bank in preferred_banks:
            scores['bank_preference_score'] = 1.0
            scores['reasons'].append(f"Matches preferred bank ({bank})")
        else:
            scores['bank_preference_score'] = 0.3  # Partial score for non-preferred banks
        
        # Functionality score
        if atm.status and atm.status.upper() == 'WORKING':
            scores['functionality_score'] = 1.0
            scores['reasons'].append("ATM is functional")
        else:
            scores['functionality_score'] = 0.0
            scores['reasons'].append("ATM may not be working")
        
        # Deposit availability score
        if 'deposit' in transaction_types or 'both' in transaction_types:
            if atm.deposit_available:
                scores['deposit_availability_score'] = 1.0
                scores['reasons'].append("Supports deposits")
            else:
                scores['deposit_availability_score'] = 0.0
                scores['reasons'].append("Does not support deposits")
        else:
            scores['deposit_availability_score'] = 1.0  # Not needed, so full score
        
        # Wait time score
        estimated_wait = self.estimate_wait_time(atm.last_used)
        scores['estimated_wait_people'] = estimated_wait
        
        # Lower wait time = higher score
        max_wait = 5
        scores['wait_time_score'] = 1.0 - (estimated_wait / max_wait) if estimated_wait <= max_wait else 0.0
        
        if estimated_wait == 0:
            scores['reasons'].append("No expected wait time")
        elif estimated_wait <= 2:
            scores['reasons'].append(f"Short wait (~{estimated_wait} people)")
        else:
            scores['reasons'].append(f"Longer wait (~{estimated_wait} people)")
        
        # Calculate weighted total score
        total_score = (
            scores['distance_score'] * self.WEIGHTS['distance'] +
            scores['bank_preference_score'] * self.WEIGHTS['bank_preference'] +
            scores['functionality_score'] * self.WEIGHTS['functionality'] +
            scores['deposit_availability_score'] * self.WEIGHTS['deposit_availability'] +
            scores['wait_time_score'] * self.WEIGHTS['wait_time']
        )
        
        scores['total_score'] = round(total_score, 3)
        
        return scores
    
    def get_recommendations(self, user_id: int, user_lat: float, user_lng: float, 
                          limit: int = 3) -> List[Dict[str, Any]]:
        """
        Get top ATM recommendations for a user
        """
        db = SessionLocal()
        
        try:
            # Get user preferences
            preferences = db.query(UserPreferences).filter(
                UserPreferences.user_id == user_id
            ).first()
            
            if not preferences:
                logger.warning(f"No preferences found for user {user_id}")
                # Create default preferences
                preferences = UserPreferences(
                    user_id=user_id,
                    preferred_banks='["Any"]',
                    transaction_types='["both"]',
                    max_radius_km=10,
                    preferred_currency='JMD'
                )
            
            # Get all working ATMs within a reasonable radius
            max_radius = min(preferences.max_radius_km, 20)  # Cap at 20km for performance
            
            # Get ATMs with valid coordinates and working status
            atms = db.query(ATM).filter(
                and_(
                    ATM.latitude.isnot(None),
                    ATM.longitude.isnot(None),
                    ATM.geocoding_failed == False,
                    or_(ATM.status == 'WORKING', ATM.status.is_(None))  # Include if status is null (assume working)
                )
            ).all()
            
            if not atms:
                logger.warning("No ATMs found in database")
                return []
            
            # Score each ATM
            scored_atms = []
            for atm in atms:
                try:
                    # Calculate distance first to apply radius filter
                    distance_km = self.haversine_distance(
                        user_lat, user_lng, 
                        float(atm.latitude), float(atm.longitude)
                    )
                    
                    # Skip ATMs outside the user's preferred radius
                    if distance_km > max_radius:
                        continue
                    
                    # Calculate comprehensive score
                    scores = self.calculate_atm_score(atm, user_lat, user_lng, preferences)
                    
                    # Create recommendation object
                    recommendation = {
                        'atm_id': atm.id,
                        'atm_data': {
                            'id': atm.id,
                            'location': atm.location,
                            'parish': atm.parish,
                            'lat': float(atm.latitude),
                            'lng': float(atm.longitude),
                            'bank': scores['bank'],
                            'bankName': f"{scores['bank']} Bank" if scores['bank'] != "Unknown" else "Unknown Bank",
                            'functional': atm.status == 'WORKING' if atm.status else True,
                            'deposit_available': bool(atm.deposit_available),
                            'withdrawalFee': self.BANK_FEES.get(scores['bank'], 200),
                            'depositFee': 75,  # Standard deposit fee
                            'lastUpdated': atm.updated_at.isoformat() if atm.updated_at else None
                        },
                        'recommendation_score': scores['total_score'],
                        'distance_km': round(scores['distance_km'], 2),
                        'estimated_wait_people': scores['estimated_wait_people'],
                        'reasons': scores['reasons'],
                        'score_breakdown': {
                            'distance': round(scores['distance_score'], 2),
                            'bank_preference': round(scores['bank_preference_score'], 2),
                            'functionality': round(scores['functionality_score'], 2),
                            'deposit_availability': round(scores['deposit_availability_score'], 2),
                            'wait_time': round(scores['wait_time_score'], 2)
                        }
                    }
                    
                    scored_atms.append(recommendation)
                    
                except (ValueError, TypeError) as e:
                    logger.warning(f"Error scoring ATM {atm.id}: {e}")
                    continue
            
            # Sort by recommendation score (highest first) then by distance (closest first)
            scored_atms.sort(key=lambda x: (-x['recommendation_score'], x['distance_km']))
            
            # Return top recommendations
            recommendations = scored_atms[:limit]
            
            logger.info(f"Generated {len(recommendations)} recommendations for user {user_id}")
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error generating recommendations: {e}")
            return []
        
        finally:
            db.close()


# Flask route integration function
def get_atm_recommendations_for_user(user_id: int, user_lat: float, user_lng: float) -> List[Dict[str, Any]]:
    """
    Convenience function to get ATM recommendations for Flask routes
    """
    engine = ATMRecommendationEngine()
    return engine.get_recommendations(user_id, user_lat, user_lng, limit=3)