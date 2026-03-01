from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class ProfileBase(BaseModel):
    username: str = Field(..., min_length=1, max_length=100)
    venmo: str | None = None
    zelle: str | None = None


class ProfileCreate(ProfileBase):
    id: UUID  


class ProfileUpdate(BaseModel):
    username: str | None = Field(None, min_length=1, max_length=100)
    venmo: str | None = None
    zelle: str | None = None


class Profile(ProfileBase):
    id: UUID
    created_at: datetime | None = None

    class Config:
        from_attributes = True
