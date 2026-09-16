from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import init_db
from .routers import auth, bookings, museums


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="Museo API", version="1.0.0", lifespan=lifespan)

# Wide open so the Capacitor webview reaches the API over localhost or the LAN IP.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(museums.router)
app.include_router(bookings.router)


@app.get("/health", tags=["misc"])
def health():
    return {"ok": True}
