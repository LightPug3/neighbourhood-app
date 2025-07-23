from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

Base = declarative_base()

class ATM(Base):
    __tablename__ = 'atms'
    
    id = Column(Integer, primary_key=True)
    atm_id = Column(String(50), unique=True, nullable=False)
    location = Column(String(255), nullable=False)
    parish = Column(String(100), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    deposit_available = Column(Boolean, default=False)
    status = Column(String(50), nullable=False)
    last_used = Column(String(50))
    timestamp = Column(DateTime, default=datetime.utcnow)
    geocoding_failed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class GeocodingCache(Base):
    __tablename__ = 'geocoding_cache'
    
    id = Column(Integer, primary_key=True)
    location = Column(String(255), nullable=False)
    parish = Column(String(100), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Create unique constraint on location + parish
    __table_args__ = (
        {'mysql_engine': 'InnoDB'},
    )

class GeocodingFailure(Base):
    __tablename__ = 'geocoding_failures'
    
    id = Column(Integer, primary_key=True)
    atm_id = Column(String(50), nullable=False)
    location = Column(String(255), nullable=False)
    parish = Column(String(100), nullable=False)
    error_message = Column(Text)
    retry_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_retry = Column(DateTime, default=datetime.utcnow)

# Database setup
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_USER = os.getenv('DB_USER', 'neighbourhood_user')
DB_PASSWORD = os.getenv('DB_PASSWORD', '')
DB_NAME = os.getenv('DB_NAME', 'neighbourhood_app')

DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}"

engine = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def create_tables():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
