from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import inventory, sales, cashflow, schedule, purchasing, clinical, loyalty

app = FastAPI(title="Pharmacy OS API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(inventory.router, prefix="/api/v1")
app.include_router(sales.router, prefix="/api/v1")
app.include_router(cashflow.router, prefix="/api/v1")
app.include_router(schedule.router, prefix="/api/v1")
app.include_router(purchasing.router, prefix="/api/v1")
app.include_router(clinical.router, prefix="/api/v1")
app.include_router(loyalty.router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"status": "online", "message": "Pharmacy OS API is active"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
