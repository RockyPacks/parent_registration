#!/usr/bin/env python3
"""
Live testing script for Netcash integration endpoints.
This script tests the payment and risk assessment endpoints with real Netcash APIs.
"""

import asyncio
import httpx
import json
from typing import Dict, Any

# Configuration
BASE_URL = "http://localhost:8000"
API_PREFIX = "/api/v1"

async def test_payment_creation():
    """Test payment creation endpoint with live Netcash API"""
    print("Testing Payment Creation Endpoint...")

    payload = {
        "application_id": "test-app-123",
        "amount": 100.00,
        "plan_type": "annual",
        "return_url": "http://localhost:3000/payment/return",
        "notify_url": f"{BASE_URL}{API_PREFIX}/payment/webhook"
    }

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{BASE_URL}{API_PREFIX}/payment/create-payment",
                json=payload,
                headers={"Content-Type": "application/json"}
            )

            print(f"Status Code: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print("Payment Creation Success:")
                print(json.dumps(data, indent=2))
                return data.get("reference")
            else:
                print(f"Error: {response.text}")
                return None

    except Exception as e:
        print(f"Exception during payment creation: {str(e)}")
        return None

async def test_risk_assessment():
    """Test risk assessment endpoint with live Netcash API"""
    print("\nTesting Risk Assessment Endpoint...")

    payload = {
        "reference": "TEST-LIVE-RISK-001",
        "guardian": {
            "branch_code": "250655",  # Valid South African bank branch code
            "account_number": "1234567890",
            "name": "John Doe",
            "email": "john.doe@example.com",
            "id_number": "8001015009087"
        }
    }

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{BASE_URL}{API_PREFIX}/risk/risk-check",
                json=payload,
                headers={"Content-Type": "application/json"}
            )

            print(f"Status Code: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print("Risk Assessment Success:")
                print(json.dumps(data, indent=2))
                return True
            else:
                print(f"Error: {response.text}")
                return False

    except Exception as e:
        print(f"Exception during risk assessment: {str(e)}")
        return False

async def test_payment_status(reference: str):
    """Test payment status retrieval"""
    if not reference:
        print("Skipping payment status test - no reference available")
        return

    print(f"\nTesting Payment Status for reference: {reference}")

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(f"{BASE_URL}{API_PREFIX}/payment/payment-status/{reference}")

            print(f"Status Code: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print("Payment Status:")
                print(json.dumps(data, indent=2))
            else:
                print(f"Error: {response.text}")

    except Exception as e:
        print(f"Exception during payment status check: {str(e)}")

async def main():
    """Run all live endpoint tests"""
    print("Starting Netcash Live Endpoint Tests")
    print("=" * 50)

    # Test payment creation
    payment_ref = await test_payment_creation()

    # Test risk assessment
    risk_success = await test_risk_assessment()

    # Test payment status if we have a reference
    await test_payment_status(payment_ref)

    print("\n" + "=" * 50)
    print("Live testing completed!")

    if payment_ref and risk_success:
        print("✅ Both payment and risk endpoints are working with live Netcash APIs")
    else:
        print("⚠️  Some endpoints may not be fully integrated. Check logs for details.")

if __name__ == "__main__":
    asyncio.run(main())
