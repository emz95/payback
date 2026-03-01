from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class FollowBase(BaseModel):
    follower_id: UUID
    following_id: UUID


class FollowCreate(FollowBase):
    pass


class Follow(FollowBase):
    created_at: datetime | None = None

    class Config:
        from_attributes = True
