from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
import requests
import uuid
from datetime import datetime
import os
from typing import Dict, Any
import logging
import hmac
import hashlib

from app.api.v1.schemas.payment import PaymentRequest, PaymentResponse, NetcashWebhookData
from app.db.session import supabase
from app.core.config import settings

router = APIRouter()

logger = logging.getLogger(__name__)

# Netcash configuration from settings
NETCASH_PAYNOW_SERVICE_KEY = settings.netcash_paynow_service_key
NETCASH_PAYNOW_BASE = settings.netcash_paynow_base
RETURN_URL = settings.return_url or "http://localhost:3000/payment/return"
WEBHOOK_URL = settings.webhook_url or "http://localhost:8000/api/v1/payment/webhook"
NETCASH_WEBHOOK_SECRET = settings.netcash_webhook_secret

@router.post("/create-payment")
def create_payment(data: PaymentRequest):
    """Create a payment request with Netcash PayNow"""
    payload = {
        "service_key": NETCASH_PAYNOW_SERVICE_KEY,
        "reference": data.reference,
        "amount": f"{data.amount:.2f}",
        "currency": "ZAR",
        "return_url": RETURN_URL,
        "notify_url": WEBHOOK_URL,
        "description": data.description
    }

    try:
        response = requests.post(f"{NETCASH_PAYNOW_BASE}/create", json=payload, timeout=10)
        response.raise_for_status()
        json_res = response.json()

        # Expecting Netcash to return redirect_url in JSON
        redirect_url = json_res.get("redirect_url")
        if not redirect_url:
            raise HTTPException(status_code=502, detail="Missing redirect URL from Netcash")
        return {"redirect_url": redirect_url}
    except requests.RequestException as e:
        raise HTTPException(status_code=502, detail=f"Netcash API error: {str(e)}")

def verify_netcash_signature(payload: str, signature: str, secret: str) -> bool:
    """Verify Netcash webhook signature"""
    if not secret:
        return True  # Skip verification if no secret configured (for testing)

    expected_signature = hmac.new(
        secret.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(expected_signature, signature)

@router.post("/webhook")
async def netcash_webhook(request: Request):
    """Handle Netcash webhook notifications"""
    # Verify webhook signature for security
    signature = request.headers.get("X-Netcash-Signature")
    body = await request.body()
    payload_str = body.decode()

    if not verify_netcash_signature(payload_str, signature, NETCASH_WEBHOOK_SECRET):
        raise HTTPException(status_code=403, detail="Invalid signature")

    # Parse JSON after verification
    data = await request.json()
    reference = data.get("reference")
    status = data.get("transaction_status")

    logger.info(f"Webhook received for {reference}: {status}")

    # Update payment status in database
    try:
        if status == "COMPLETE":
            supabase.table("payments").update({
                "status": "completed",
                "completed_at": datetime.now().isoformat()
            }).eq("reference", reference).execute()
            logger.info(f"✅ Payment {reference} completed.")
        elif status == "FAILED":
            supabase.table("payments").update({
                "status": "failed"
            }).eq("reference", reference).execute()
            logger.error(f"❌ Payment {reference} failed.")
    except Exception as e:
        logger.error(f"Failed to update payment status: {str(e)}")

    return "OK"

@router.get("/payment-status/{reference}")
async def get_payment_status(reference: str):
    """Get payment status by reference"""
    try:
        result = supabase.table("payments").select("*").eq("reference", reference).execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Payment not found")

        payment = result.data[0]
        return {
            "reference": payment["reference"],
            "status": payment["status"],
            "amount": payment["amount"],
            "plan_type": payment.get("plan_type", ""),
            "created_at": payment["created_at"],
            "completed_at": payment.get("completed_at")
        }

    except Exception as e:
        logger.error(f"Error fetching payment status: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch payment status")
