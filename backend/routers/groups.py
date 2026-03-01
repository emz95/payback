from uuid import UUID

from fastapi import APIRouter, Depends

from core.deps import get_user_id
from core.supabase import supabase
from models.group import GroupCreate

router = APIRouter(prefix="/groups", tags=["groups"])


@router.post("/", status_code=201)
def create_group(
    group: GroupCreate,
    user_id: UUID = Depends(get_user_id),
):
    row = {
        "name": group.name,
        "start_date": group.start_date.isoformat(),
        "end_date": group.end_date.isoformat(),
        "created_by": str(user_id),
    }
    result = supabase.table("groups").insert(row).execute()
    created = result.data[0]
    return created