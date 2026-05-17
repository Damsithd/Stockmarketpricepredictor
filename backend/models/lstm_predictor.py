import hashlib
import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime, timedelta


def compute_indicators(df):
    # Moving Averages
    df['MA20'] = df['Close'].rolling(window=20).mean()
    df['MA50'] = df['Close'].rolling(window=50).mean()

    # RSI (14)
    delta = df['Close'].diff(1)
    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = gain / loss
    df['RSI'] = 100 - (100 / (1 + rs))

    # MACD (12/26)
    ema12 = df['Close'].ewm(span=12, adjust=False).mean()
    ema26 = df['Close'].ewm(span=26, adjust=False).mean()
    df['MACD'] = ema12 - ema26

    return df


def _compute_drift(df: pd.DataFrame) -> float:
    """
    Derive a deterministic daily drift from four technical signals.

    Each signal votes +1 (bullish) / -1 (bearish) / 0 (neutral):
      1. Price vs MA20       — is price above its short-term average?
      2. MA20 vs MA50        — golden/death cross (trend direction)
      3. MACD sign           — momentum direction
      4. RSI extremes        — oversold/overbought mean-reversion

    Score → drift map:
       +3 / +4  →  strong bull  +0.25 % / day
       +1 / +2  →  mild bull    +0.10 % / day
         0      →  neutral      +0.02 % / day (slight positive bias)
       -1 / -2  →  mild bear   -0.10 % / day
       -3 / -4  →  strong bear -0.25 % / day
    """
    last = df.iloc[-1]
    score = 0

    # ── Signal 1: Price vs MA20 ──────────────────────────────────────────────
    if pd.notna(last['MA20']):
        if last['Close'] > last['MA20']:
            score += 1
        elif last['Close'] < last['MA20']:
            score -= 1

    # ── Signal 2: MA20 vs MA50 (golden/death cross) ──────────────────────────
    if pd.notna(last['MA20']) and pd.notna(last['MA50']):
        if last['MA20'] > last['MA50']:
            score += 1
        elif last['MA20'] < last['MA50']:
            score -= 1

    # ── Signal 3: MACD direction ─────────────────────────────────────────────
    if pd.notna(last['MACD']):
        if last['MACD'] > 0:
            score += 1
        elif last['MACD'] < 0:
            score -= 1

    # ── Signal 4: RSI mean-reversion ────────────────────────────────────────
    if pd.notna(last['RSI']):
        if last['RSI'] < 30:        # oversold → expect bounce up
            score += 1
        elif last['RSI'] > 70:      # overbought → expect pullback
            score -= 1

    # Score → drift conversion
    drift_map = {
        4:  0.0025,
        3:  0.0025,
        2:  0.0010,
        1:  0.0010,
        0:  0.0002,
        -1: -0.0010,
        -2: -0.0010,
        -3: -0.0025,
        -4: -0.0025,
    }
    return drift_map.get(score, 0.0002)


def _make_seed(ticker: str) -> int:
    """
    Deterministic seed from ticker + today's date.
    Same stock → same forecast all day; different tomorrow.
    """
    key = f"{ticker.upper()}:{datetime.now().date().isoformat()}"
    return int(hashlib.md5(key.encode()).hexdigest(), 16) % (2 ** 32)


def predict_stock(ticker: str, horizon: int = 7, historical_days: int = 365):
    """
    Fetches historical data and generates a forecast.
    historical_days : how many calendar days of history to return (default 365).

    Forecast method — deterministic technical drift + seeded noise:
      • Drift is derived from MA crossover, MACD, RSI (Option 2).
      • Random shock uses a date+ticker seed so the forecast is the same
        for every search on the same day (Option 1).
    """
    end_date = datetime.now()
    # Fetch 5 years so we always have enough data for any historical_days window
    start_date = end_date - timedelta(days=365 * 5)

    try:
        stock_data = yf.download(
            ticker,
            start=start_date.strftime('%Y-%m-%d'),
            end=end_date.strftime('%Y-%m-%d'),
            progress=False,
        )
    except Exception:
        stock_data = pd.DataFrame()

    if stock_data.empty:
        # Fallback mock data
        dates = pd.date_range(start=start_date, end=end_date, freq='B')
        mock_prices = [150.0]
        for _ in range(1, len(dates)):
            mock_prices.append(mock_prices[-1] * (1 + np.random.normal(0.0001, 0.015)))
        stock_data = pd.DataFrame({
            'Date':      dates,
            'Close':     mock_prices,
            'Open':      mock_prices,
            'High':      mock_prices,
            'Low':       mock_prices,
            'Adj Close': mock_prices,
            'Volume':    [1_000_000] * len(dates),
        }).set_index('Date')

    df = stock_data.reset_index()
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)

    df = compute_indicators(df)

    # ── Historical slice ─────────────────────────────────────────────────────
    cutoff_date = end_date - timedelta(days=historical_days)
    recent_history = df[df['Date'] >= pd.Timestamp(cutoff_date)].copy()

    historical = []
    for _, row in recent_history.iterrows():
        historical.append({
            "date":   row['Date'].strftime('%Y-%m-%d'),
            "price":  float(row['Close']),
            "open":   float(row['Open']),
            "high":   float(row['High']),
            "low":    float(row['Low']),
            "close":  float(row['Close']),
            "volume": float(row['Volume']),
        })

    # ── Forecast ─────────────────────────────────────────────────────────────
    last_price  = float(df['Close'].iloc[-1])
    last_date   = df['Date'].iloc[-1]

    # Option 2: technical-indicator drift (deterministic direction)
    drift = _compute_drift(df)

    # Option 1: seed RNG with ticker + today's date → stable for the whole day
    rng = np.random.default_rng(_make_seed(ticker))

    # Use 5-year volatility for realistic path shape, but cap it
    returns    = df['Close'].pct_change().dropna()
    volatility = float(returns.std())
    # Dampen noise so it doesn't overwhelm the technical signal
    noise_scale = volatility * 0.5

    forecast      = []
    current_price = last_price

    for i in range(1, horizon + 1):
        # Seeded noise: realistic path shape but reproducible
        shock = rng.normal(0, noise_scale)
        current_price = current_price * (1 + drift + shock)
        next_date = last_date + timedelta(days=i)

        # Skip weekends
        while next_date.weekday() >= 5:
            next_date += timedelta(days=1)

        forecast.append({
            "date":  next_date.strftime('%Y-%m-%d'),
            "price": round(current_price, 2),
        })
        last_date = next_date

    return historical, forecast
