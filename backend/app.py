from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.security import check_password_hash, generate_password_hash
import os
import logging
from models import ATM, User, SessionLocal, create_tables
from scheduler import start_scheduler
import atexit
import jwt
import datetime
import random
import smtplib
from email.message import EmailMessage
from urllib.parse import unquote
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# JWT config
SECRET_KEY = os.getenv("SECRET_KEY")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

# Email config
EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")

# Configure Flask for production
app.config['ENV'] = os.getenv('FLASK_ENV', 'production')
app.config['DEBUG'] = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'

# Configure CORS for production
if app.config['ENV'] == 'production':
    # Restrict CORS to your domain in production
    CORS(app, origins=['https://neighbourhood-app.duckdns.org'])
else:
    # Allow all origins in development
    CORS(app, origins=["http://localhost:3000", "http://127.0.0.1:3000"], 
         methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
         allow_headers=['Content-Type', 'Authorization'])

# Initialize database
create_tables()

# Start scheduler
scheduler = start_scheduler()

# Shut down scheduler when app exits
atexit.register(lambda: scheduler.shutdown())

# Helper functions for authentication
def generate_otp():
    return f"{random.randint(100000, 999999)}"

# def send_otp_email(receiver_email, otp):
#     try:
#         msg = EmailMessage()
#         msg['Subject'] = "Verify your account - OTP Code"
#         msg['From'] = EMAIL_ADDRESS
#         msg['To'] = receiver_email
#         msg.set_content(f"Welcome to The Neighborhood!\n\nYour 6-digit OTP verification code is: {otp}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this code, please ignore this email.\n\nBest regards,\nThe Neighborhood Team")

#         # with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
#         #     smtp.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
#         #     smtp.send_message(msg)
#         # return True

#         server = smtplib.SMTP("smtp.gmail.com", 587)
#         server.starttls()
#         server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
#         server.send_message(msg)
#         server.quit()
#         return True
#     except Exception as e:
#         logger.error(f"Email sending failed: {str(e)}")
#         return False

def send_otp_email(receiver_email, otp):
    try:
        msg = EmailMessage()
        msg['Subject'] = "Verify your account - OTP Code"
        msg['From'] = EMAIL_ADDRESS
        msg['To'] = receiver_email
        # print(receiver_email)
        # exit()
        logger.debug(f"Receiver email: {receiver_email}")
    
        msg.set_content(f"Welcome to The Neighborhood!\n\nYour 6-digit OTP verification code is: {otp}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this code, please ignore this email.\n\nBest regards,\nThe Neighborhood Team")

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
            smtp.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
            smtp.send_message(msg)
        
        logger.info(f"Email sent successfully to {receiver_email}")
        return True
    except Exception as e:
        logger.error(f"Email sending failed: {str(e)}")
        logger.error(f"Error type: {type(e).__name__}")
        return False

# Authentication endpoints
# @app.route('/test', methods=['GET'])
# def test_connection():
#     return jsonify({'status': 'Server is running', 'message': 'Connection successful'}), 200

@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
            
        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            return jsonify({"error": "Email and Password are required"}), 400

        db = SessionLocal()
        try:
            user = db.query(User).filter(User.Email == email).first()

            if not user:
                return jsonify({"error": "Invalid email or password"}), 401

            if check_password_hash(user.Password_Hash, password):
                token = jwt.encode({
                    "user_id": user.UserId,
                    "email": email,
                    "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1)
                }, SECRET_KEY, algorithm=JWT_ALGORITHM)

                return jsonify({"token": token}), 200
            else:
                return jsonify({"error": "Invalid email or password"}), 401

        finally:
            db.close()

    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return jsonify({"error": "Login failed"}), 500

@app.route('/verify-token', methods=['GET'])
def verify_token():
    token = request.headers.get("Authorization")

    if not token:
        return jsonify({"error": "Token missing"}), 401

    try:
        # Remove 'Bearer ' prefix if present
        if token.startswith('Bearer '):
            token = token[7:]
            
        decoded = jwt.decode(token, SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return jsonify({"valid": True, "user_id": decoded["user_id"]}), 200
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 401

@app.route('/update_password', methods=["POST"])
def update_password():
    try:
        # Check if request contains JSON data
        if not request.is_json:
            return jsonify({"error": "Request must be JSON"}), 400
            
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
            
        new_password = data.get("new_password")
        email = data.get("email")

        # Validate input
        if not new_password or not email:
            return jsonify({"error": "Missing password or email"}), 400

        if len(new_password) < 6:
            return jsonify({"error": "Password must be at least 6 characters long"}), 400

        # Hash the new password
        hashed_password = generate_password_hash(new_password)

        db = SessionLocal()
        try:
            # Check if user exists first
            user = db.query(User).filter(User.Email == email).first()
            
            if not user:
                return jsonify({"error": "No user found with the provided email"}), 404

            # Update password
            user.Password_Hash = hashed_password
            db.commit()

            return jsonify({"success": "Password updated successfully"}), 200

        finally:
            db.close()

    except Exception as e:
        logger.error(f"Error in update_password: {str(e)}")
        return jsonify({"error": "Password update failed"}), 500

@app.route('/signup', methods=['POST'])
def signup():
    try:
        # Check if request contains JSON data
        if not request.is_json:
            return jsonify({'error': 'Request must be JSON'}), 400
            
        data = request.get_json()
        
        # Check if data is None
        if data is None:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        # Extract data from request
        first_name = data.get('FirstName')
        last_name = data.get('LastName')
        email = data.get('Email')
        password = data.get('Password')

        # Validate required fields
        if not all([first_name, last_name, email, password]):
            missing_fields = []
            if not first_name: missing_fields.append('FirstName')
            if not last_name: missing_fields.append('LastName')
            if not email: missing_fields.append('Email')
            if not password: missing_fields.append('Password')
            return jsonify({'error': f'Missing required fields: {", ".join(missing_fields)}'}), 400

        # Validate email format (basic)
        if '@' not in email or '.' not in email:
            return jsonify({'error': 'Invalid email format'}), 400

        # Validate password length
        if len(password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters long'}), 400

        # Hash password
        hashed_pw = generate_password_hash(password)
        
        # Generate OTP and expiration
        otp = generate_otp()
        expiration = datetime.datetime.now() + datetime.timedelta(minutes=10)
        
        db = SessionLocal()
        try:
            # Check if email already exists
            existing_user = db.query(User).filter(User.Email == email).first()
            if existing_user:
                return jsonify({'error': 'Email already exists'}), 409

            # Create new user
            new_user = User(
                FirstName=first_name,
                LastName=last_name,
                Email=email,
                Password_Hash=hashed_pw,
                is_verified=False,
                otp_code=otp,
                otp_expiration=expiration
            )
            
            db.add(new_user)
            db.commit()

            # Send OTP email
            email_sent = send_otp_email(email, otp)
            
            if email_sent:
                return jsonify({
                    'message': 'Signup successful. OTP sent to email.',
                    'email': email,
                    'otp_expires_in': '10 minutes'
                }), 201
            else:
                return jsonify({
                    'message': 'User created but email sending failed. Please try again.',
                    'email': email
                }), 201

        finally:
            db.close()
                
    except Exception as e:
        logger.error(f"Server error: {str(e)}")
        return jsonify({'error': 'Server error occurred'}), 500

@app.route('/resend_otp', methods=['POST'])
def resend_otp():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
            
        email = data.get('email')

        if not email:
            return jsonify({'error': 'Email is required'}), 400

        otp = generate_otp()
        expiration = datetime.datetime.now() + datetime.timedelta(minutes=10)

        db = SessionLocal()
        try:
            user = db.query(User).filter(User.Email == email).first()
            if not user:
                return jsonify({'error': 'User not found'}), 404

            user.otp_code = otp
            user.otp_expiration = expiration
            db.commit()

            success = send_otp_email(email, otp)
            if success:
                return jsonify({'message': 'OTP has been resent to your email'}), 200
            else:
                return jsonify({'error': 'Failed to send email'}), 500
                
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"Resend OTP error: {str(e)}")
        return jsonify({'error': 'Failed to resend OTP'}), 500

@app.route('/confirm_otp_code/<int:otp>/<string:email>', methods=["GET"])
def confirm_otp(otp, email):
    logger.info(f"Received OTP verification request - OTP: {otp}, Email: {email}")
    
    try:
        # Decode the email in case it's URL encoded
        decoded_email = unquote(email)
        logger.info(f"Decoded email: {decoded_email}")
        
        db = SessionLocal()
        try:
            # Check if user exists and get OTP
            user = db.query(User).filter(User.Email == decoded_email).first()
            
            if not user:
                logger.warning(f"No user found with email: {decoded_email}")
                return jsonify({"error": "User not found"}), 404
            
            if user.otp_code is None:
                logger.warning("No OTP found for user - may have been already used or expired")
                return jsonify({"error": "No valid OTP found. Please request a new one."}), 400
            
            # Convert both to strings for comparison
            if str(user.otp_code) == str(otp):
                # Update verified status and clear OTP
                user.otp_code = None
                user.is_verified = True
                db.commit()
                
                return jsonify({"success": "OTP confirmed"}), 200
            else:
                logger.warning(f"OTP mismatch - Expected: {user.otp_code}, Received: {otp}")
                return jsonify({"error": "Invalid OTP"}), 400
                
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"Unexpected error in confirm_otp: {str(e)}")
        return jsonify({"error": "An unexpected error occurred"}), 500

# Original ATM endpoints
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'message': 'API is running'})

@app.route('/api/atms', methods=['GET'])
def get_atms():
    """Get all ATM data"""
    try:
        db = SessionLocal()
        try:
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

            return jsonify(atm_list)
        finally:
            db.close()

    except Exception as e:
        logger.error(f"Error fetching ATMs: {e}")
        return jsonify({'error': 'Failed to fetch ATM data'}), 500

@app.route('/api/atms/stats', methods=['GET'])
def get_atm_stats():
    """Get ATM statistics"""
    try:
        db = SessionLocal()
        try:
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

            return jsonify(stats)
        finally:
            db.close()

    except Exception as e:
        logger.error(f"Error fetching ATM stats: {e}")
        return jsonify({'error': 'Failed to fetch ATM statistics'}), 500

# Helper functions for ATM data
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
        try:
            latest_atm = db.query(ATM).order_by(ATM.updated_at.desc()).first()

            if latest_atm and latest_atm.updated_at:
                return latest_atm.updated_at.isoformat()
            return None
        finally:
            db.close()
    except:
        return None

# Error handlers for better debugging
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(405)
def method_not_allowed(error):
    return jsonify({'error': 'Method not allowed'}), 405

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

# Handle preflight OPTIONS requests
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = jsonify()
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add('Access-Control-Allow-Headers', "*")
        response.headers.add('Access-Control-Allow-Methods', "*")
        return response

if __name__ == '__main__':
    print("Starting Flask server...")
    print("Server will be available at: http://127.0.0.1:5000")
    # print("Test endpoint: http://127.0.0.1:5000/test")
    # print("Health check: http://127.0.0.1:5000/api/health")
    # print("Authentication endpoints:")
    # print("  - Signup: http://127.0.0.1:5000/signup")
    # print("  - Login: http://127.0.0.1:5000/login")
    # print("  - Update password: http://127.0.0.1:5000/update_password")
    # print("  - Verify token: http://127.0.0.1:5000/verify-token")
    # print("  - Resend OTP: http://127.0.0.1:5000/resend_otp")
    # print("  - Confirm OTP: http://127.0.0.1:5000/confirm_otp_code/<otp>/<email>")
    # print("ATM endpoints:")
    # print("  - Get ATMs: http://127.0.0.1:5000/api/atms")
    # print("  - ATM Stats: http://127.0.0.1:5000/api/atms/stats")
    
    if app.config['ENV'] == 'development':
        app.run(host='0.0.0.0', port=5000, debug=True)
    else:
        # In production, this won't be called (Gunicorn handles it)
        print("Production mode: Use Gunicorn to serve this application")
        print("Example: gunicorn --config gunicorn.conf.py app:app")