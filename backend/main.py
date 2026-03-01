from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Allow Expo app to talk to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # dev only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "API is running 🚀"}

@app.get("/hello")
def hello(name: str = "friend"):
    return {"message": f"Hello {name} from FastAPI!"}
