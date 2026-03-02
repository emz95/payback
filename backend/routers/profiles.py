from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from core.deps import get_user_id
from core.supabase import supabase
from models.profile import Profile, ProfileUpdate

router = APIRouter(prefix="/profiles", tags=["profiles"])


@router.patch("/me", response_model=Profile)
def update_my_profile(
    body: ProfileUpdate,
    current_user_id: UUID = Depends(get_user_id),
):
    """Update current user's profile (username, venmo, zelle). Only sent fields are updated."""
    updates = body.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = (
        supabase.table("profiles")
        .update(updates)
        .eq("id", str(current_user_id))
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    return result.data[0]


@router.get("/me/following", response_model=List[Profile])
def get_following(current_user_id: UUID = Depends(get_user_id)):
    """List profiles that the current user follows."""
    follows = (
        supabase.table("follows")
        .select("following_id")
        .eq("follower_id", str(current_user_id))
        .execute()
    )
    if not follows.data:
        return []

    following_ids = [r["following_id"] for r in follows.data]
    result = (
        supabase.table("profiles")
        .select("*")
        .in_("id", following_ids)
        .execute()
    )
    return result.data or []


@router.post("/{user_id}/follow", status_code=201)
def follow_user(
    user_id: UUID,
    current_user_id: UUID = Depends(get_user_id),
):
    """Follow another user. Follower = current user, following = user_id in path."""
    if user_id == current_user_id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")
    existing = (
        supabase.table("follows")
        .select("follower_id")
        .eq("follower_id", str(current_user_id))
        .eq("following_id", str(user_id))
        .execute()
    )
    if existing.data:
        raise HTTPException(status_code=409, detail="Already following this user")
    row = {
        "follower_id": str(current_user_id),
        "following_id": str(user_id),
    }
    result = supabase.table("follows").insert(row).execute()
    return result.data[0]


@router.get("/{user_id}", response_model=Profile)
def get_profile(
    user_id: UUID,
    current_user_id: UUID = Depends(get_user_id),
):
    """Get a single profile by id. Requires auth."""
    result = (
        supabase.table("profiles")
        .select("*")
        .eq("id", str(user_id))
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    return result.data[0]


@router.get("", response_model=List[Profile])
def get_profiles(current_user_id: UUID = Depends(get_user_id)):
    """List all profiles. Requires auth."""
    result = supabase.table("profiles").select("*").execute()
    return result.data or []
