"""
Pydantic schemas for financing-related API operations.
"""

from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


class FinancingPlanType(str, Enum):
    """Enumeration of financing plan types."""
    MONTHLY_FLAT = "monthly_flat"
    TERMLY_DISCOUNT = "termly_discount"
    ANNUAL_DISCOUNT = "annual_discount"
    SIBLING_DISCOUNT = "sibling_discount"
    BNPL = "bnpl"
    FORWARD_FUNDING = "forward_funding"
    ARREARS_BNPL = "arrears-bnpl"


class FinancingSelectionRequest(BaseModel):
    """
    Financing selection request schema.

    Used to save a financing plan selection for an application.
    """
    application_id: str = Field(..., min_length=1, description="Application ID")
    plan_type: FinancingPlanType = Field(..., description="Type of financing plan selected")
    discount_rate: Optional[float] = Field(None, ge=0, le=100, description="Discount rate percentage (0-100)")
    cost_of_credit: Optional[float] = Field(None, ge=0, description="Cost of credit")
    repayment_term: Optional[str] = Field(None, max_length=50, description="Repayment term description")


class FinancingSelectionResponse(BaseModel):
    """
    Financing selection response schema.

    Returned after saving a financing selection.
    """
    id: str
    application_id: str
    plan_type: FinancingPlanType
    discount_rate: Optional[float]
    cost_of_credit: Optional[float]
    repayment_term: Optional[str]
    created_at: str
