import smtplib
from email.message import EmailMessage
import os
from dotenv import load_dotenv

load_dotenv()

EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")

def test_email():
    try:
        msg = EmailMessage()
        msg['Subject'] = "Test Email"
        msg['From'] = EMAIL_ADDRESS
        msg['To'] = EMAIL_ADDRESS  # Send to yourself for testing
        msg.set_content("This is a test email.")

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
            smtp.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
            smtp.send_message(msg)
        
        print("Email sent successfully!")
        return True
    except Exception as e:
        print(f"Email failed: {str(e)}")
        return False

if __name__ == "__main__":
    test_email()