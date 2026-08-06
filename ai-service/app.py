from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from data_cleaning import clean_dataset
from analytics import generate_analytics
from insights import generate_insights
from forecasting import generate_forecast
from anomaly import detect_anomalies
from rag import chat_with_data
from decision import compare_options, simulate_what_if

app = FastAPI(
    title="InsightAI Engine",
    description="Python FastAPI analytics, machine learning, decision intelligence, and RAG service",
    version="1.1.0"
)

# Enable CORS for Node.js backend and React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class DatasetPayload(BaseModel):
    records: List[Dict[str, Any]]

class ComparePayload(BaseModel):
    records: List[Dict[str, Any]]
    option_type: Optional[str] = "Products"

class WhatIfPayload(BaseModel):
    records: List[Dict[str, Any]]
    params: Optional[Dict[str, Any]] = {}

class ChatPayload(BaseModel):
    records: List[Dict[str, Any]]
    question: str

@app.get("/")
def read_root():
    return {"status": "ok", "service": "InsightAI Engine", "version": "1.1.0"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/clean")
def api_clean_dataset(payload: DatasetPayload):
    try:
        res = clean_dataset(payload.records)
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/analytics")
def api_generate_analytics(payload: DatasetPayload):
    try:
        res = generate_analytics(payload.records)
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/insights")
def api_generate_insights(payload: DatasetPayload):
    try:
        analytics_res = generate_analytics(payload.records)
        clean_res = clean_dataset(payload.records)
        res = generate_insights(analytics_res, clean_res.get("issues", []))
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/forecast")
def api_generate_forecast(payload: DatasetPayload, periods: int = 30):
    try:
        res = generate_forecast(payload.records, periods=periods)
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/anomalies")
def api_detect_anomalies(payload: DatasetPayload):
    try:
        res = detect_anomalies(payload.records)
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/decision/compare")
def api_compare_options(payload: ComparePayload):
    try:
        res = compare_options(payload.records, option_type=payload.option_type)
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/decision/what-if")
def api_simulate_what_if(payload: WhatIfPayload):
    try:
        res = simulate_what_if(payload.records, params=payload.params)
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/chat")
def api_chat_with_data(payload: ChatPayload):
    try:
        res = chat_with_data(payload.question, payload.records)
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
