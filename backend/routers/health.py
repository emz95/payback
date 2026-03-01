from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/")
def root():
    return {"message": "API is running"}


@router.get("/hello")
def hello(name: str = "friend"):
    return {"message": f"Hello {name} from FastAPI!"}
