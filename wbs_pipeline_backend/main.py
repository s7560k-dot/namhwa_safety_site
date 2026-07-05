from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import wbs_parser

app = FastAPI(
    title="Namhwa WBS Auto Generation Pipeline API",
    description="API for parsing Excel BoQ and mapping to standard WBS using AI.",
    version="1.0.0"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(wbs_parser.router, prefix="/api/v1/wbs", tags=["WBS"])

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "WBS Pipeline API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
