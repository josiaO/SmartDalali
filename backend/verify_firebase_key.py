import os
from dotenv import load_dotenv

load_dotenv()

key = os.getenv("FIREBASE_PRIVATE_KEY", "")
if not key:
    print("FIREBASE_PRIVATE_KEY is not set or empty.")
else:
    processed_key = key.replace("\\n", "\n")
    print(f"Key length: {len(processed_key)}")
    print(f"Starts with header: {processed_key.strip().startswith('-----BEGIN PRIVATE KEY-----')}")
    print(f"Ends with footer: {processed_key.strip().endswith('-----END PRIVATE KEY-----')}")
    print(f"Contains newlines: {'\\n' in processed_key}")
    print(f"First 30 chars: {processed_key[:30]}")
    print(f"Last 30 chars: {processed_key[-30:]}")
