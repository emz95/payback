import base64
import json
import re
from io import BytesIO
from uuid import UUID

import google.generativeai as genai
from fastapi import APIRouter, Depends, HTTPException
from PIL import Image
from pydantic import BaseModel, Field

from core.config import GEMINI_API_KEY
from core.deps import get_user_id

router = APIRouter(prefix="/receipts", tags=["receipts"])

RECEIPT_PROMPT = """This is a receipt. Return a JSON object with two fields: "items" (array of line items) and "total_cents" (integer, the receipt total in cents). Each item has: description (string), amount_cents (integer). Only include line items in items; put the receipt total in total_cents. Do not include tip/tax/subtotal if it is separate. Return valid JSON only, no markdown."""


class ParseReceiptRequest(BaseModel):
    image_base64: str = Field(..., description="Base64-encoded receipt image")
    group_id: UUID | None = Field(None, description="Optional group id for validation")


class LineItem(BaseModel):
    description: str
    amount_cents: int


class ParseReceiptResponse(BaseModel):
    items: list[LineItem]
    total_cents: int
    total: float = Field(..., description="Total in dollars (total_cents / 100)")


def _parse_json_from_text(text: str):
    text = text.strip()
    if "```" in text:
        match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
        if match:
            text = match.group(1).strip()
    return json.loads(text)


@router.post("/parse", response_model=ParseReceiptResponse)
def parse_receipt(
    body: ParseReceiptRequest,
    _user_id: UUID = Depends(get_user_id),
):
    """Parse a receipt image and return line items plus total_cents."""
    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="Receipt parsing is not configured (missing GEMINI_API_KEY)",
        )
    try:
        image_bytes = base64.b64decode(body.image_base64, validate=True)
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid base64 image") from e

    try:
        image = Image.open(BytesIO(image_bytes)).convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid image data") from e

    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-1.5-flash")

    try:
        response = model.generate_content([image, RECEIPT_PROMPT])
        response_text = (response.text or "").strip()
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Gemini API error: {str(e)}",
        ) from e

    if not response_text:
        raise HTTPException(
            status_code=502,
            detail="Empty response from receipt parser",
        )

    try:
        raw = _parse_json_from_text(response_text)
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=502,
            detail=f"Parser returned invalid JSON: {str(e)}",
        ) from e

    if not isinstance(raw, dict):
        raise HTTPException(
            status_code=502,
            detail="Parser did not return a JSON object",
        )

    raw_list = raw.get("items")
    if not isinstance(raw_list, list):
        raise HTTPException(
            status_code=502,
            detail="Parser response missing or invalid 'items' array",
        )

    items: list[LineItem] = []
    for i, raw_item in enumerate(raw_list):
        if not isinstance(raw_item, dict):
            raise HTTPException(
                status_code=502,
                detail=f"Item at index {i} is not an object",
            )
        desc = raw_item.get("description")
        amount = raw_item.get("amount_cents")
        if desc is None or amount is None:
            raise HTTPException(
                status_code=502,
                detail=f"Item at index {i} missing description or amount_cents",
            )
        try:
            items.append(
                LineItem(
                    description=str(desc),
                    amount_cents=int(amount),
                )
            )
        except (TypeError, ValueError) as e:
            raise HTTPException(
                status_code=502,
                detail=f"Item at index {i} invalid: {str(e)}",
            ) from e

    total_cents = raw.get("total_cents")
    if total_cents is not None:
        try:
            total_cents = int(total_cents)
        except (TypeError, ValueError):
            total_cents = sum(it.amount_cents for it in items)
    else:
        total_cents = sum(it.amount_cents for it in items)

    return ParseReceiptResponse(
        items=items,
        total_cents=total_cents,
        total=round(total_cents / 100.0, 2),
    )
