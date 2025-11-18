"""
Financing API router.

Handles financing-related endpoints.
"""

from fastapi import APIRouter, HTTPException
from app.api.v1.schemas.financing import FinancingSelectionRequest, FinancingSelectionResponse
from app.services.financing_service import financing_service
from app.core.exceptions import ExternalServiceError

router = APIRouter(prefix="/financing", tags=["financing"])


@router.post("/select-plan", response_model=FinancingSelectionResponse)
async def select_financing_plan(request: FinancingSelectionRequest):
    """
    Save financing plan selection for an application.

    This endpoint allows users to select a financing plan for their application.
    The selection is stored in the financing_selections table.
    """
    try:
        financing_id = financing_service.save_financing_selection(
            application_id=request.application_id,
            plan_type=request.plan_type.value,  # Convert enum to string
            discount_rate=request.discount_rate,
            cost_of_credit=request.cost_of_credit,
            repayment_term=request.repayment_term
        )

        # Get the saved selection to return complete data
        selection = financing_service.get_financing_selection(request.application_id)
        if not selection:
            raise HTTPException(status_code=500, detail="Failed to retrieve saved financing selection")

        return FinancingSelectionResponse(**selection)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except ExternalServiceError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/selection/{application_id}", response_model=FinancingSelectionResponse)
async def get_financing_selection(application_id: str):
    """
    Get financing selection for an application.

    Returns the financing plan selected for the given application.
    """
    try:
        selection = financing_service.get_financing_selection(application_id)
        if not selection:
            raise HTTPException(status_code=404, detail="Financing selection not found")

        return FinancingSelectionResponse(**selection)
    except ExternalServiceError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")
