from pydantic import BaseModel
from typing import Optional

class PaymentRequest(BaseModel):
    amount: float
    reference: str
    description: str

class PaymentResponse(BaseModel):
    payment_id: str
    reference: str
    redirect_url: str
    status: str

class NetcashWebhookData(BaseModel):
    reference: str
    transaction_status: str
    transaction_id: Optional[str] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    timestamp: Optional[str] = None
