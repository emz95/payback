from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from core.deps import get_user_id
from core.supabase import supabase
from models.group import GroupCreate

router = APIRouter(prefix="/groups", tags=["groups"])


@router.get("/")
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


@router.get("/{group_id}")
def get_group(
    group_id: UUID,
    user_id: UUID = Depends(get_user_id),
):
    """Get one group by id. User must be creator or in group_members."""
    result = (
        supabase.table("groups")
        .select("*")
        .eq("id", str(group_id))
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Group not found")
    group = result.data[0]

    # Check access: creator or member
    if group["created_by"] == str(user_id):
        return group
    member = (
        supabase.table("group_members")
        .select("user_id")
        .eq("group_id", str(group_id))
        .eq("user_id", str(user_id))
        .execute()
    )
    if not member.data:
        raise HTTPException(status_code=404, detail="Group not found")
    return group


@router.get("/{group_id}/members")
def get_group_members(
    group_id: UUID,
    user_id: UUID = Depends(get_user_id),
):
    """List group members with user_id and username. User must be in the group."""
    member_rows = (
        supabase.table("group_members")
        .select("user_id")
        .eq("group_id", str(group_id))
        .execute()
    )
    if not member_rows.data:
        return []
    member_ids = [r["user_id"] for r in member_rows.data]
    # Verify current user is in the group
    if str(user_id) not in member_ids:
        raise HTTPException(status_code=404, detail="Group not found")
    profiles = (
        supabase.table("profiles")
        .select("id, username")
        .in_("id", member_ids)
        .execute()
    )
    by_id = {p["id"]: p["username"] for p in (profiles.data or [])}
    return [{"user_id": uid, "username": by_id.get(uid) or "?"} for uid in member_ids]


@router.post("", status_code=201)
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
    group_id = created["id"]

    # Add creator and invited members to group_members so they see the group
    member_ids = set(group.member_ids or [])
    member_ids.discard(user_id)
    all_member_ids = [str(user_id)] + [str(mid) for mid in member_ids]
    for uid in all_member_ids:
        supabase.table("group_members").insert({
            "group_id": group_id,
            "user_id": uid,
        }).execute()

    return created


