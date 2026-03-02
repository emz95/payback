from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field


class GroupBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    start_date: date
    end_date: date
    created_by: UUID


class GroupCreate(GroupBase):
    pass


class GroupUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    start_date: date | None = None
    end_date: date | None = None


class Group(GroupBase):
    id: UUID
    created_at: datetime | None = None

    class Config:
        from_attributes = True
