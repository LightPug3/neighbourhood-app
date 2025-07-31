from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.sql import func
import os
from dotenv import load_dotenv

load_dotenv()

# Database configuration
DATABASE_URL = f"mysql+pymysql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}/{os.getenv('DB_NAME')}"

engine = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class ATM(Base):
    __tablename__ = "atms"
    
    id = Column(Integer, primary_key=True, index=True)
    atm_id = Column(String(50), unique=True, index=True)
    location = Column(String(255))
    parish = Column(String(100))
    deposit_available = Column(Boolean, default=False)
    status = Column(String(50))
    last_used = Column(String(20))  # Store as string since API provides HH:MM:SS format
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    geocoding_failed = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class User(Base):
    __tablename__ = "users"
    
    UserId = Column(Integer, primary_key=True, index=True)
    FirstName = Column(String(100))
    LastName = Column(String(100))
    Email = Column(String(255), unique=True, index=True)
    Password_Hash = Column(String(255))
    is_verified = Column(Boolean, default=False)
    otp_code = Column(String(6), nullable=True)
    otp_expiration = Column(DateTime, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class GeocodingCache(Base):
    __tablename__ = "geocoding_cache"
    
    id = Column(Integer, primary_key=True, index=True)
    location = Column(String(255), unique=True, index=True)
    parish = Column(String(100))
    latitude = Column(Float)
    longitude = Column(Float)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class GeocodingFailure(Base):
    __tablename__ = "geocoding_failures"
    
    id = Column(Integer, primary_key=True, index=True)
    location = Column(String(255))
    parish = Column(String(100))
    error_message = Column(Text)
    retry_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class UserPreferences(Base):
    """
    User preferences for ATM filtering
    Stores user's questionnaire responses for personalized ATM recommendations
    """
    __tablename__ = 'user_preferences'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.UserId', ondelete='CASCADE'), nullable=False, unique=True)
    preferred_banks = Column(Text, nullable=False, comment='JSON array of preferred banks')
    transaction_types = Column(Text, nullable=False, comment='JSON array of transaction types')
    max_radius_km = Column(Integer, nullable=False, default=10, comment='Maximum travel radius in kilometers')
    preferred_currency = Column(String(10), nullable=False, default='JMD', comment='Preferred currency')
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<UserPreferences(user_id={self.user_id}, banks={self.preferred_banks})>"
    
    def to_dict(self):
        """Convert to dictionary for JSON serialization"""
        import json
        try:
            return {
                'id': self.id,
                'user_id': self.user_id,
                'preferred_banks': json.loads(self.preferred_banks) if isinstance(self.preferred_banks, str) else self.preferred_banks,
                'transaction_types': json.loads(self.transaction_types) if isinstance(self.transaction_types, str) else self.transaction_types,
                'max_radius_km': self.max_radius_km,
                'preferred_currency': self.preferred_currency,
                'created_at': self.created_at.isoformat() if self.created_at else None,
                'updated_at': self.updated_at.isoformat() if self.updated_at else None
            }
        except json.JSONDecodeError:
            # Fallback if JSON parsing fails
            return {
                'id': self.id,
                'user_id': self.user_id,
                'preferred_banks': [],
                'transaction_types': [],
                'max_radius_km': self.max_radius_km,
                'preferred_currency': self.preferred_currency,
                'created_at': self.created_at.isoformat() if self.created_at else None,
                'updated_at': self.updated_at.isoformat() if self.updated_at else None
            }

def create_tables():
    """Create all tables"""
    Base.metadata.create_all(bind=engine)

def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()