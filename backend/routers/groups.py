from uuid import UUID

from fastapi import APIRouter, Depends

from core.deps import get_user_id
from core.supabase import supabase
from models.group import GroupCreate

router = APIRouter(prefix="/groups", tags=["groups"])


@router.get("")
def list_my_groups(user_id: UUID = Depends(get_user_id)):
    memberships = (
        supabase.table("group_members")
        .select("group_id")
        .eq("user_id", str(user_id))
        .execute()
    )
    member_group_ids = [r["group_id"] for r in (memberships.data or [])]

    created = (
        supabase.table("groups")
        .select("*")
        .eq("created_by", str(user_id))
        .execute()
    )
    created_groups = created.data or []
    seen = {g["id"] for g in created_groups}
    all_groups = list(created_groups)

    if member_group_ids:
        member_groups = (
            supabase.table("groups")
            .select("*")
            .in_("id", member_group_ids)
            .execute()
        )
        for g in member_groups.data or []:
            if g["id"] not in seen:
                seen.add(g["id"])
                all_groups.append(g)

    return all_groups


@router.post("", status_code=201)
def create_group(
    group: GroupCreate,
    user_id: UUID = Depends(get_user_id),
):
    from datetime import date as date_type
    start = group.start_date if group.start_date is not None else date_type.today()
    end = group.end_date if group.end_date is not None else date_type.today()
    row = {
        "name": group.name,
        "start_date": start.isoformat(),
        "end_date": end.isoformat(),
        "created_by": str(user_id),
    }
    result = supabase.table("groups").insert(row).execute()
    created = result.data[0]
    return created
