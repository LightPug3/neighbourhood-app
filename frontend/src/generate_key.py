import secrets

def generate_secret_key():
    return secrets.token_urlsafe(32)

key = generate_secret_key()

# Save to a .env file or print it out
print(f"Your secret key: {key}")