from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os

from models.lstm_predictor import predict_stock
from agents.trading_agent_integration import generate_analyst_report

app = FastAPI(title="Stock Price Indicator and Prediction API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PredictionRequest(BaseModel):
    ticker: str
    horizon: int = 7
    historical_days: int = 365


class DataPoint(BaseModel):
    date: str
    price: float
    # OHLCV
    open:   Optional[float] = None
    high:   Optional[float] = None
    low:    Optional[float] = None
    close:  Optional[float] = None
    volume: Optional[float] = None
    # Moving averages
    sma20:  Optional[float] = None
    sma50:  Optional[float] = None
    ema12:  Optional[float] = None
    ema26:  Optional[float] = None
    # MACD suite
    macd:        Optional[float] = None
    macd_signal: Optional[float] = None
    macd_hist:   Optional[float] = None
    # RSI
    rsi: Optional[float] = None
    # Bollinger Bands
    bb_upper:  Optional[float] = None
    bb_lower:  Optional[float] = None
    bb_middle: Optional[float] = None
    # Medium indicators
    atr:       Optional[float] = None
    stoch_k:   Optional[float] = None
    stoch_d:   Optional[float] = None
    obv:       Optional[float] = None
    williams_r:Optional[float] = None
    cci:       Optional[float] = None


class PredictionResponse(BaseModel):
    ticker: str
    historical: List[DataPoint]
    forecast:   List[DataPoint]
    analysis_report: str


@app.get("/")
def read_root():
    return {"status": "Backend API is running"}


@app.post("/api/predict", response_model=PredictionResponse)
def get_prediction(request: PredictionRequest):
    try:
        historical_data, forecast_data = predict_stock(
            request.ticker, request.horizon, request.historical_days
        )
        analysis_report = generate_analyst_report(
            request.ticker, historical_data, forecast_data
        )

        def _build(d: dict) -> DataPoint:
            return DataPoint(
                date=d["date"], price=d["price"],
                open=d.get("open"), high=d.get("high"),
                low=d.get("low"), close=d.get("close"), volume=d.get("volume"),
                sma20=d.get("sma20"), sma50=d.get("sma50"),
                ema12=d.get("ema12"), ema26=d.get("ema26"),
                macd=d.get("macd"), macd_signal=d.get("macd_signal"),
                macd_hist=d.get("macd_hist"),
                rsi=d.get("rsi"),
                bb_upper=d.get("bb_upper"), bb_lower=d.get("bb_lower"),
                bb_middle=d.get("bb_middle"),
                atr=d.get("atr"),
                stoch_k=d.get("stoch_k"), stoch_d=d.get("stoch_d"),
                obv=d.get("obv"),
                williams_r=d.get("williams_r"),
                cci=d.get("cci"),
            )

        return PredictionResponse(
            ticker=request.ticker,
            historical=[_build(d) for d in historical_data],
            forecast=[DataPoint(date=d["date"], price=d["price"]) for d in forecast_data],
            analysis_report=analysis_report,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class BriefingRequest(BaseModel):
    tickers: List[str]


@app.post("/api/briefing")
def get_briefing(request: BriefingRequest):
    try:
        if not request.tickers:
            return {"briefing": "No favorite tickers to analyse. Add some to get a daily briefing!"}
        tickers_str = ", ".join(request.tickers)
        briefing = (
            f"Your watchlist ({tickers_str}) is showing mixed signals today. "
            "The AI models suggest holding current positions while monitoring support levels over the next 48 hours."
        )
        return {"briefing": briefing}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
