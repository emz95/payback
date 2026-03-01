from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class GroupMemberBase(BaseModel):
    group_id: UUID
    user_id: UUID


class GroupMemberCreate(GroupMemberBase):
    pass


class GroupMember(GroupMemberBase):
    joined_at: datetime | None = None

    class Config:
        from_attributes = True
