-- Neighbourhood App Database Schema
-- Generated from SQLAlchemy models

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS neighbourhood;
USE neighbourhood;

-- Create user if it doesn't exist
CREATE USER IF NOT EXISTS 'neighbourhood_user'@'%' IDENTIFIED BY 'devpassword123';
GRANT ALL PRIVILEGES ON neighbourhood.* TO 'neighbourhood_user'@'%';
FLUSH PRIVILEGES;

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS geocoding_failures;
DROP TABLE IF EXISTS geocoding_cache;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS atms;

-- Create ATMs table
CREATE TABLE atms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    atm_id VARCHAR(50) UNIQUE NOT NULL,
    location VARCHAR(255),
    parish VARCHAR(100),
    deposit_available BOOLEAN DEFAULT FALSE,
    status VARCHAR(50),
    last_used VARCHAR(20) COMMENT 'HH:MM:SS format from API',
    latitude FLOAT NULL,
    longitude FLOAT NULL,
    geocoding_failed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_atm_id (atm_id),
    INDEX idx_id (id)
);

-- Create Users table
CREATE TABLE users (
    UserId INT AUTO_INCREMENT PRIMARY KEY,
    FirstName VARCHAR(100),
    LastName VARCHAR(100),
    Email VARCHAR(255) UNIQUE NOT NULL,
    Password_Hash VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    otp_code VARCHAR(6) NULL,
    otp_expiration DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (UserId),
    INDEX idx_email (Email)
);

-- Create Geocoding Cache table
CREATE TABLE geocoding_cache (
    id INT AUTO_INCREMENT PRIMARY KEY,
    location VARCHAR(255) UNIQUE NOT NULL,
    parish VARCHAR(100),
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_cache_id (id),
    INDEX idx_location (location)
);

-- Create Geocoding Failures table
CREATE TABLE geocoding_failures (
    id INT AUTO_INCREMENT PRIMARY KEY,
    location VARCHAR(255),
    parish VARCHAR(100),
    error_message TEXT,
    retry_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_failure_id (id)
);

-- Tables created successfully - all empty and ready for use