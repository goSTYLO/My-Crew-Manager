#!/usr/bin/env python3
"""
Debug Login Script

This script tests the login endpoint to see what the actual response structure is.

Usage:
    python tests/debug_login.py
"""

import requests
import json
import sys

# Configuration
DJANGO_BASE_URL = "http://localhost:8000"

def test_login(email, password):
    """Test login and show detailed response"""
    print(f"Testing login for: {email}")
    print("="*50)
    
    try:
        login_data = {
            "email": email,
            "password": password
        }
        
        print(f"Request URL: {DJANGO_BASE_URL}/api/user/login/")
        print(f"Request data: {json.dumps(login_data, indent=2)}")
        print()
        
        response = requests.post(f"{DJANGO_BASE_URL}/api/user/login/", json=login_data)
        
        print(f"Response Status: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        print()
        
        if response.status_code == 200:
            try:
                data = response.json()
                print("Response Data:")
                print(json.dumps(data, indent=2))
                print()
                
                # Check for different token field names
                token_fields = ['access', 'access_token', 'token', 'jwt', 'auth_token']
                found_tokens = {}
                
                for field in token_fields:
                    if field in data:
                        found_tokens[field] = data[field]
                
                if found_tokens:
                    print("Found token fields:")
                    for field, value in found_tokens.items():
                        print(f"  {field}: {value[:50]}..." if len(str(value)) > 50 else f"  {field}: {value}")
                else:
                    print("No token fields found in response")
                    print("Available fields:", list(data.keys()))
                
            except json.JSONDecodeError:
                print("Response is not valid JSON")
                print("Response text:", response.text)
        else:
            print(f"Login failed with status {response.status_code}")
            try:
                error_data = response.json()
                print("Error response:")
                print(json.dumps(error_data, indent=2))
            except:
                print("Error response text:", response.text)
                
    except Exception as e:
        print(f"Error: {str(e)}")

def main():
    print("Debug Login Script")
    print("="*50)
    print("This script tests the login endpoint to see the actual response structure.")
    print("="*50)
    print()
    
    # Test with known credentials
    test_cases = [
        ("adminaaron@gmail.com", "admin123"),
        ("adminaaron@gmail.com", "password123"),
        ("wow@gmail.com", "Pass_123"),
    ]
    
    for email, password in test_cases:
        test_login(email, password)
        print("\n" + "="*80 + "\n")

if __name__ == "__main__":
    main()
