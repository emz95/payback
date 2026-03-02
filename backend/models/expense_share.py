from uuid import UUID

from pydantic import BaseModel, Field


class ExpenseShareBase(BaseModel):
    expense_id: UUID
    user_id: UUID
    share_cents: int = Field(..., ge=0)


class ExpenseShareCreate(ExpenseShareBase):
    pass


class ExpenseShare(ExpenseShareBase):
    class Config:
        from_attributes = True
