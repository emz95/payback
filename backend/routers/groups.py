from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

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


@router.get("/balance/total")
def get_total_balance(user_id: UUID = Depends(get_user_id)):
    """Current user's balance across all groups in cents. Positive = you are owed, negative = you owe."""
    member_rows = (
        supabase.table("group_members")
        .select("group_id")
        .eq("user_id", str(user_id))
        .execute()
    )
    group_ids = list({r["group_id"] for r in (member_rows.data or [])})
    total_cents = 0
    me = str(user_id)
    for group_id in group_ids:
        expenses = (
            supabase.table("expenses")
            .select("id, amount_cents, paid_by")
            .eq("group_id", group_id)
            .execute()
        ).data or []
        for exp in expenses:
            amount_cents = exp["amount_cents"]
            paid_by = exp["paid_by"]
            shares = (
                supabase.table("expense_shares")
                .select("user_id, share_cents")
                .eq("expense_id", exp["id"])
                .execute()
            ).data or []
            my_share = next((s["share_cents"] for s in shares if s["user_id"] == me), 0)
            if paid_by == me:
                total_cents += amount_cents - my_share
            else:
                total_cents -= my_share
    return {"balance_cents": total_cents}


@router.get("/balance/by-following")
def get_balances_by_following(user_id: UUID = Depends(get_user_id)):
    """For each user the current user follows, return pairwise balance in cents. Positive = they owe you, negative = you owe them."""
    me = str(user_id)
    follows = (
        supabase.table("follows")
        .select("following_id")
        .eq("follower_id", me)
        .execute()
    )
    following_ids = list({r["following_id"] for r in (follows.data or [])})
    if not following_ids:
        return []

    profiles = (
        supabase.table("profiles")
        .select("id, username")
        .in_("id", following_ids)
        .execute()
    )
    by_id = {p["id"]: p.get("username") or "?" for p in (profiles.data or [])}

    # My groups: group_id -> set of member user_ids
    my_memberships = (
        supabase.table("group_members")
        .select("group_id")
        .eq("user_id", me)
        .execute()
    )
    my_group_ids = list({r["group_id"] for r in (my_memberships.data or [])})
    if not my_group_ids:
        return [{"user_id": uid, "username": by_id.get(uid, "?"), "balance_cents": 0} for uid in following_ids]

    # For each following, find shared groups (groups where they are also a member)
    result = []
    for other_id in following_ids:
        balance_cents = 0
        other_memberships = (
            supabase.table("group_members")
            .select("group_id")
            .eq("user_id", other_id)
            .in_("group_id", my_group_ids)
            .execute()
        )
        shared_group_ids = [r["group_id"] for r in (other_memberships.data or [])]
        for group_id in shared_group_ids:
            expenses = (
                supabase.table("expenses")
                .select("id, amount_cents, paid_by")
                .eq("group_id", group_id)
                .execute()
            ).data or []
            for exp in expenses:
                shares = (
                    supabase.table("expense_shares")
                    .select("user_id, share_cents")
                    .eq("expense_id", exp["id"])
                    .execute()
                ).data or []
                my_share = next((s["share_cents"] for s in shares if s["user_id"] == me), 0)
                other_share = next((s["share_cents"] for s in shares if s["user_id"] == other_id), 0)
                if exp["paid_by"] == me:
                    balance_cents += other_share
                elif exp["paid_by"] == other_id:
                    balance_cents -= my_share
        result.append({
            "user_id": other_id,
            "username": by_id.get(other_id, "?"),
            "balance_cents": balance_cents,
        })
    return result


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


@router.get("/{group_id}/balance")
def get_group_balance(
    group_id: UUID,
    user_id: UUID = Depends(get_user_id),
):
    """Current user's balance for this group in cents. Positive = you are owed, negative = you owe."""
    member_rows = (
        supabase.table("group_members")
        .select("user_id")
        .eq("group_id", str(group_id))
        .execute()
    )
    member_ids = [r["user_id"] for r in (member_rows.data or [])]
    if str(user_id) not in member_ids:
        raise HTTPException(status_code=404, detail="Group not found")

    expenses = (
        supabase.table("expenses")
        .select("id, amount_cents, paid_by")
        .eq("group_id", str(group_id))
        .execute()
    ).data or []

    balance_cents = 0
    me = str(user_id)
    for exp in expenses:
        amount_cents = exp["amount_cents"]
        paid_by = exp["paid_by"]
        shares = (
            supabase.table("expense_shares")
            .select("user_id, share_cents")
            .eq("expense_id", exp["id"])
            .execute()
        ).data or []
        my_share = next((s["share_cents"] for s in shares if s["user_id"] == me), 0)
        if paid_by == me:
            balance_cents += amount_cents - my_share
        else:
            balance_cents -= my_share

    return {"balance_cents": balance_cents}


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


