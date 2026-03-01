from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, model_validator


class SettlementBase(BaseModel):
    group_id: UUID
    from_user: UUID
    to_user: UUID
    amount_cents: int = Field(..., gt=0)

    @model_validator(mode="after")
    def no_self_settlement(self) -> "SettlementBase":
        if self.from_user == self.to_user:
            raise ValueError("from_user and to_user must be different")
        return self


class SettlementCreate(SettlementBase):
    pass


class Settlement(SettlementBase):
    id: UUID
    created_at: datetime | None = None

    class Config:
        from_attributes = True
