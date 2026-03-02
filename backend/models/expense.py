from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class ExpenseBase(BaseModel):
    group_id: UUID
    title: str = Field(..., min_length=1, max_length=255)
    category: str = Field(..., min_length=1, max_length=255)
    amount_cents: int = Field(..., ge=0)
    paid_by: UUID
    split_mode: str = Field(..., min_length=1, max_length=50)


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=255)
    category: str | None = Field(None, min_length=1, max_length=255)
    amount_cents: int | None = Field(None, ge=0)
    split_mode: str | None = Field(None, min_length=1, max_length=50)


class Expense(ExpenseBase):
    id: UUID
    created_at: datetime | None = None

    class Config:
        from_attributes = True
