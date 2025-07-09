from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from db import create_tables
from api import auth, documents, query

# Create FastAPI app
app = FastAPI(
    title="RAG API",
    description="Retrieval Augmented Generation API voor documenten",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(documents.router, prefix="/api", tags=["Documents"])
app.include_router(query.router, prefix="/api", tags=["Query"])

# Create database tables on startup
@app.on_event("startup")
async def startup_event():
    create_tables()
    # Create necessary directories
    os.makedirs("./data", exist_ok=True)
    os.makedirs("./data/chroma_db", exist_ok=True)
    os.makedirs("./backend/documents", exist_ok=True)

@app.get("/")
async def root():
    return {
        "message": "RAG API is running",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001) 