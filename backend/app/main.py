import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.deps import SessionLocal
from app.ingestion.scheduler import run_ingestion_cycle

async def wait_for_server(host="127.0.0.1", port=8000, timeout=30):
    loop = asyncio.get_running_loop()
    start_time = loop.time()
    while loop.time() - start_time < timeout:
        try:
            reader, writer = await asyncio.open_connection(host, port)
            writer.close()
            await writer.wait_closed()
            return True
        except Exception:
            await asyncio.sleep(0.5)
    return False

async def repeat_ingestion():
    # Wait until uvicorn port is open and accepting requests
    await wait_for_server()
    # Give a brief pause to allow standard logging setup to finish
    await asyncio.sleep(1)
    while True:
        try:
            print("Starting scheduled background ingestion cycle...")
            db = SessionLocal()
            try:
                run_ingestion_cycle(db)
            finally:
                db.close()
            print("Scheduled background ingestion cycle complete.")
        except Exception as e:
            print(f"Error in background ingestion cycle: {e}")
        await asyncio.sleep(1800) # 1800 seconds = 30 minutes

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start the repeating background task
    task = asyncio.create_task(repeat_ingestion())
    yield
    # Clean up the task on shutdown
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass

app = FastAPI(title="BioShield Flood Dashboard API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api import districts, subscribe, admin, replay, alerts

app.include_router(districts.router)
app.include_router(subscribe.router)
app.include_router(admin.router)
app.include_router(replay.router)
app.include_router(alerts.router)
@app.get("/api/health")
async def health_check():
    return {"status": "ok"}
