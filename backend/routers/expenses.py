from uuid import UUID

from fastapi import APIRouter, Body, Depends, HTTPException
from pydantic import BaseModel, Field

from core.deps import get_user_id
from core.supabase import supabase
from models.expense import ExpenseCreate

router = APIRouter(prefix="/expenses", tags=["expenses"])


@router.get("")
def list_expenses(
    group_id: UUID | None = None,
    user_id: UUID = Depends(get_user_id),
):
    """List expenses. If group_id is set, filter by that group. Includes paid_by_username."""
    q = supabase.table("expenses").select("*")
    if group_id is not None:
        q = q.eq("group_id", str(group_id))
    result = q.execute()
    rows = result.data or []
    if not rows:
        return rows
    payer_ids = list({r["paid_by"] for r in rows})
    profiles = (
        supabase.table("profiles")
        .select("id, username")
        .in_("id", payer_ids)
        .execute()
    )
    by_id = {p["id"]: p.get("username") or "?" for p in (profiles.data or [])}
    for r in rows:
        r["paid_by_username"] = by_id.get(r["paid_by"]) or "?"
    return rows


class ManualSplitItem(BaseModel):
    """One user's base (subtotal) for proportional split."""
    user_id: UUID
    base_cents: int = Field(..., ge=0)


class ManualSplitBody(BaseModel):
    """List of each participant's base amount; share = (base / sum of bases) * expense total."""
    items: list[ManualSplitItem] = Field(..., min_length=1)


class SplitEqualBody(BaseModel):
    """Optional: split only among these user ids (must be group members). If omitted, split among all group members."""
    user_ids: list[UUID] | None = None


@router.post("", status_code=201)
def create_expense(
    expense: ExpenseCreate,
    user_id: UUID = Depends(get_user_id),
):
    row = {
        "group_id": str(expense.group_id),
        "title": expense.title,
        "category": expense.category,
        "amount_cents": expense.amount_cents,
        "paid_by": str(expense.paid_by),
        "split_mode": expense.split_mode,
    }

    result = supabase.table("expenses").insert(row).execute()
    created = result.data[0]
    return created


@router.post("/{expense_id}/split-equal", status_code=201)
def split_equal_expense(
    expense_id: UUID,
    body: SplitEqualBody | None = Body(None),
    user_id: UUID = Depends(get_user_id),
):
    exp_result = (
        supabase.table("expenses")
        .select("id, group_id, amount_cents")
        .eq("id", str(expense_id))
        .execute()
    )
    if not exp_result.data:
        raise HTTPException(status_code=404, detail="Expense not found")
    expense = exp_result.data[0]
    amount_cents = expense["amount_cents"]
    group_id = expense["group_id"]

    members_result = (
        supabase.table("group_members")
        .select("user_id")
        .eq("group_id", group_id)
        .execute()
    )
    all_members = members_result.data or []
    if not all_members:
        raise HTTPException(
            status_code=400,
            detail="Group has no members; cannot split",
        )

    if body and body.user_ids:
        allowed = {m["user_id"] for m in all_members}
        for uid in body.user_ids:
            if str(uid) not in allowed:
                raise HTTPException(
                    status_code=400,
                    detail=f"User {uid} is not a member of this group",
                )
        members = [{"user_id": str(uid)} for uid in body.user_ids]
    else:
        members = all_members

    n = len(members)
    base_cents, remainder = divmod(amount_cents, n)

    shares = []
    for i, m in enumerate(members):
        share_cents = base_cents + (1 if i < remainder else 0)
        shares.append({
            "expense_id": str(expense_id),
            "user_id": m["user_id"],
            "share_cents": share_cents,
        })

    supabase.table("expense_shares").delete().eq(
        "expense_id", str(expense_id)
    ).execute()
    result = supabase.table("expense_shares").insert(shares).execute()

    return result.data


@router.post("/{expense_id}/split-manual", status_code=201)
def split_manual_expense(
    expense_id: UUID,
    body: ManualSplitBody,
    user_id: UUID = Depends(get_user_id),
):
    exp_result = (
        supabase.table("expenses")
        .select("id, group_id, amount_cents")
        .eq("id", str(expense_id))
        .execute()
    )
    if not exp_result.data:
        raise HTTPException(status_code=404, detail="Expense not found")
    expense = exp_result.data[0]
    total_cents = expense["amount_cents"]

    total_base = sum(item.base_cents for item in body.items)
    if total_base <= 0:
        raise HTTPException(
            status_code=400,
            detail="Sum of base_cents must be positive",
        )

    shares_raw = []
    for item in body.items:
        exact = total_cents * item.base_cents / total_base
        shares_raw.append((item.user_id, exact))

    share_cents_list = [int(s[1]) for s in shares_raw]
    remainder = total_cents - sum(share_cents_list)
    with_fraction = [(i, share_cents_list[i], shares_raw[i][1] % 1) for i in range(len(shares_raw))]
    with_fraction.sort(key=lambda x: -x[2])
    for i in range(remainder):
        idx = with_fraction[i][0]
        share_cents_list[idx] += 1

    shares = [
        {
            "expense_id": str(expense_id),
            "user_id": str(item.user_id),
            "share_cents": share_cents_list[i],
        }
        for i, item in enumerate(body.items)
    ]

    supabase.table("expense_shares").delete().eq(
        "expense_id", str(expense_id)
    ).execute()
    result = supabase.table("expense_shares").insert(shares).execute()

    return result.data
