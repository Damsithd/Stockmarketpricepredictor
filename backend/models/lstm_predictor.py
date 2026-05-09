import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def compute_indicators(df):
    # Moving Average
    df['MA20'] = df['Close'].rolling(window=20).mean()
    df['MA50'] = df['Close'].rolling(window=50).mean()
    
    # RSI
    delta = df['Close'].diff(1)
    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = gain / loss
    df['RSI'] = 100 - (100 / (1 + rs))
    
    # MACD
    ema12 = df['Close'].ewm(span=12, adjust=False).mean()
    ema26 = df['Close'].ewm(span=26, adjust=False).mean()
    df['MACD'] = ema12 - ema26
    
    return df

def predict_stock(ticker: str, horizon: int = 7):
    """
    Fetches historical data and generates a forecast.
    Note: For production, this would load the trained TensorFlow/Keras LSTM model 
    weights and run inference. Here we simulate the LSTM output using recent volatility.
    """
    end_date = datetime.now()
    start_date = end_date - timedelta(days=365)
    
    stock_data = yf.download(ticker, start=start_date.strftime('%Y-%m-%d'), end=end_date.strftime('%Y-%m-%d'))
    if stock_data.empty:
        raise ValueError(f"No data found for ticker {ticker}")
        
    df = stock_data.reset_index()
    # Flatten multi-index columns if present (yfinance sometimes does this)
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)
    
    df = compute_indicators(df)
    
    # Get last 30 days for historical view
    recent_history = df.tail(30).copy()
    
    historical = []
    for _, row in recent_history.iterrows():
        historical.append({
            "date": row['Date'].strftime('%Y-%m-%d'),
            "price": float(row['Close'])
        })
    
    # Simulate LSTM Prediction logic
    last_price = float(df['Close'].iloc[-1])
    # calculate daily volatility
    returns = df['Close'].pct_change().dropna()
    volatility = returns.std()
    
    forecast = []
    current_price = last_price
    last_date = df['Date'].iloc[-1]
    
    for i in range(1, horizon + 1):
        # random walk with drift simulating a slightly positive/neutral trend model output
        drift = 0.0001
        shock = np.random.normal(0, volatility)
        current_price = current_price * (1 + drift + shock)
        next_date = last_date + timedelta(days=i)
        
        # Skip weekends
        while next_date.weekday() >= 5:
            next_date += timedelta(days=1)
            
        forecast.append({
            "date": next_date.strftime('%Y-%m-%d'),
            "price": round(current_price, 2)
        })
        last_date = next_date
        
    return historical, forecast
