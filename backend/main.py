from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional
import datetime
import os

# Internal modules
from models.lstm_predictor import predict_stock
from agents.trading_agent_integration import generate_analyst_report

app = FastAPI(title="Stock Price Indicator and Prediction API")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For development, allow all
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PredictionRequest(BaseModel):
    ticker: str
    horizon: int = 7

class DataPoint(BaseModel):
    date: str
    price: float

class PredictionResponse(BaseModel):
    ticker: str
    historical: List[DataPoint]
    forecast: List[DataPoint]
    analysis_report: str

@app.get("/")
def read_root():
    return {"status": "Backend API is running"}

@app.post("/api/predict", response_model=PredictionResponse)
def get_prediction(request: PredictionRequest):
    try:
        # Get numerical forecast using LSTM logic
        historical_data, forecast_data = predict_stock(request.ticker, request.horizon)
        
        # Get qualitative analysis report using Agent Logic
        analysis_report = generate_analyst_report(request.ticker, historical_data, forecast_data)
        
        return PredictionResponse(
            ticker=request.ticker,
            historical=[DataPoint(date=d['date'], price=d['price']) for d in historical_data],
            forecast=[DataPoint(date=d['date'], price=d['price']) for d in forecast_data],
            analysis_report=analysis_report
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class BriefingRequest(BaseModel):
    tickers: List[str]

@app.post("/api/briefing")
def get_briefing(request: BriefingRequest):
    try:
        # Generate a mock briefing for now based on the tickers
        if not request.tickers:
            return {"briefing": "No favorite indices to analyze. Add some to get a daily briefing!"}
        
        tickers_str = ", ".join(request.tickers)
        briefing = f"Your watchlist ({tickers_str}) is showing mixed signals today. The AI models suggest holding current positions while maintaining a close watch on support levels over the next 48 hours."
        return {"briefing": briefing}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Serve static files from the frontend directory
frontend_path = os.path.join(os.path.dirname(__file__), '..', 'frontend')
app.mount("/static", StaticFiles(directory=frontend_path), name="static")

@app.get("/{full_path:path}")
def serve_frontend(full_path: str):
    # If the path is empty, serve index.html
    if not full_path or full_path == "":
        return FileResponse(os.path.join(frontend_path, "index.html"))
    
    # Try to serve the requested file
    file_path = os.path.join(frontend_path, full_path)
    if os.path.exists(file_path):
        return FileResponse(file_path)
    
    # Fallback to index.html for SPA routing
    return FileResponse(os.path.join(frontend_path, "index.html"))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
