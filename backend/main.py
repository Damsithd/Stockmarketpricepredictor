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
    historical_days: int = 365  # how many days of history to return (default: 1 year)

class DataPoint(BaseModel):
    date: str
    price: float
    open: Optional[float] = None
    high: Optional[float] = None
    low: Optional[float] = None
    close: Optional[float] = None
    volume: Optional[float] = None

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
        historical_data, forecast_data = predict_stock(request.ticker, request.horizon, request.historical_days)
        
        # Get qualitative analysis report using Agent Logic
        analysis_report = generate_analyst_report(request.ticker, historical_data, forecast_data)
        
        return PredictionResponse(
            ticker=request.ticker,
            historical=[DataPoint(date=d['date'], price=d['price'], open=d.get('open'), high=d.get('high'), low=d.get('low'), close=d.get('close'), volume=d.get('volume')) for d in historical_data],
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



if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
