import hashlib
import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime, timedelta


def _safe(val):
    """Convert NaN / Inf to None so JSON serialisation never breaks."""
    try:
        return None if (val is None or np.isnan(val) or np.isinf(val)) else float(val)
    except Exception:
        return None


def compute_indicators(df: pd.DataFrame) -> pd.DataFrame:
    close  = df['Close']
    high   = df['High']
    low    = df['Low']
    volume = df['Volume']

    # ── Moving averages ──────────────────────────────────────────────────────
    df['MA20'] = close.rolling(20).mean()
    df['MA50'] = close.rolling(50).mean()
    df['EMA12'] = close.ewm(span=12, adjust=False).mean()
    df['EMA26'] = close.ewm(span=26, adjust=False).mean()

    # ── RSI (14) ─────────────────────────────────────────────────────────────
    delta = close.diff(1)
    gain  = delta.where(delta > 0, 0).rolling(14).mean()
    loss  = (-delta.where(delta < 0, 0)).rolling(14).mean()
    df['RSI'] = 100 - (100 / (1 + gain / loss))

    # ── MACD ─────────────────────────────────────────────────────────────────
    df['MACD']        = df['EMA12'] - df['EMA26']
    df['MACD_Signal'] = df['MACD'].ewm(span=9, adjust=False).mean()
    df['MACD_Hist']   = df['MACD'] - df['MACD_Signal']

    # ── Bollinger Bands (20, ±2σ) ────────────────────────────────────────────
    std20          = close.rolling(20).std()
    df['BB_Upper'] = df['MA20'] + 2 * std20
    df['BB_Lower'] = df['MA20'] - 2 * std20

    # ── ATR (Average True Range, 14) ─────────────────────────────────────────
    prev_close = close.shift(1)
    tr = pd.concat([
        high - low,
        (high - prev_close).abs(),
        (low  - prev_close).abs(),
    ], axis=1).max(axis=1)
    df['ATR'] = tr.rolling(14).mean()

    # ── Stochastic Oscillator %K / %D (14, 3) ────────────────────────────────
    low14  = low.rolling(14).min()
    high14 = high.rolling(14).max()
    df['Stoch_K'] = (close - low14) / (high14 - low14) * 100
    df['Stoch_D'] = df['Stoch_K'].rolling(3).mean()

    # ── OBV (On-Balance Volume) ───────────────────────────────────────────────
    direction = np.sign(close.diff()).fillna(0)
    df['OBV'] = (direction * volume).cumsum()

    # ── Williams %R (14) ─────────────────────────────────────────────────────
    df['Williams_R'] = (high14 - close) / (high14 - low14) * -100

    # ── CCI (Commodity Channel Index, 20) ────────────────────────────────────
    typical_price = (high + low + close) / 3
    sma_tp   = typical_price.rolling(20).mean()
    mean_dev = typical_price.rolling(20).apply(
        lambda x: np.mean(np.abs(x - x.mean())), raw=True
    )
    df['CCI'] = (typical_price - sma_tp) / (0.015 * mean_dev)

    return df


def _compute_drift(df: pd.DataFrame) -> float:
    """
    Deterministic daily drift from four technical signals.
    Each signal votes +1 (bullish) / -1 (bearish) / 0 (neutral).
    """
    last = df.iloc[-1]
    score = 0

    if pd.notna(last.get('MA20')):
        score += 1 if last['Close'] > last['MA20'] else -1

    if pd.notna(last.get('MA20')) and pd.notna(last.get('MA50')):
        score += 1 if last['MA20'] > last['MA50'] else -1

    if pd.notna(last.get('MACD')):
        score += 1 if last['MACD'] > 0 else -1

    if pd.notna(last.get('RSI')):
        if last['RSI'] < 30:
            score += 1
        elif last['RSI'] > 70:
            score -= 1

    drift_map = {4: 0.0025, 3: 0.0025, 2: 0.0010, 1: 0.0010,
                 0: 0.0002, -1: -0.0010, -2: -0.0010, -3: -0.0025, -4: -0.0025}
    return drift_map.get(score, 0.0002)


def _make_seed(ticker: str) -> int:
    """Deterministic seed: same ticker+day → same forecast all day."""
    key = f"{ticker.upper()}:{datetime.now().date().isoformat()}"
    return int(hashlib.md5(key.encode()).hexdigest(), 16) % (2 ** 32)


def predict_stock(ticker: str, horizon: int = 7, historical_days: int = 365):
    """
    Fetches historical data, computes all technical indicators, and generates
    a technically-informed, date-seeded deterministic forecast.

    Returns: (historical_list, forecast_list)
    """
    end_date   = datetime.now()
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
        dates = pd.date_range(start=start_date, end=end_date, freq='B')
        mock_prices = [150.0]
        for _ in range(1, len(dates)):
            mock_prices.append(mock_prices[-1] * (1 + np.random.normal(0.0001, 0.015)))
        stock_data = pd.DataFrame({
            'Date': dates, 'Close': mock_prices, 'Open': mock_prices,
            'High': mock_prices, 'Low': mock_prices,
            'Adj Close': mock_prices, 'Volume': [1_000_000] * len(dates),
        }).set_index('Date')

    df = stock_data.reset_index()
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)

    df = compute_indicators(df)

    # ── Historical slice ─────────────────────────────────────────────────────
    cutoff      = end_date - timedelta(days=historical_days)
    recent      = df[df['Date'] >= pd.Timestamp(cutoff)].copy()

    historical  = []
    for _, row in recent.iterrows():
        historical.append({
            "date":       row['Date'].strftime('%Y-%m-%d'),
            "price":      _safe(row['Close']),
            "open":       _safe(row['Open']),
            "high":       _safe(row['High']),
            "low":        _safe(row['Low']),
            "close":      _safe(row['Close']),
            "volume":     _safe(row['Volume']),
            # Moving averages
            "sma20":      _safe(row.get('MA20')),
            "sma50":      _safe(row.get('MA50')),
            "ema12":      _safe(row.get('EMA12')),
            "ema26":      _safe(row.get('EMA26')),
            # MACD suite
            "macd":       _safe(row.get('MACD')),
            "macd_signal":_safe(row.get('MACD_Signal')),
            "macd_hist":  _safe(row.get('MACD_Hist')),
            # RSI
            "rsi":        _safe(row.get('RSI')),
            # Bollinger Bands
            "bb_upper":   _safe(row.get('BB_Upper')),
            "bb_lower":   _safe(row.get('BB_Lower')),
            "bb_middle":  _safe(row.get('MA20')),
            # Medium indicators
            "atr":        _safe(row.get('ATR')),
            "stoch_k":    _safe(row.get('Stoch_K')),
            "stoch_d":    _safe(row.get('Stoch_D')),
            "obv":        _safe(row.get('OBV')),
            "williams_r": _safe(row.get('Williams_R')),
            "cci":        _safe(row.get('CCI')),
        })

    # ── Forecast ─────────────────────────────────────────────────────────────
    last_price  = float(df['Close'].iloc[-1])
    last_date   = df['Date'].iloc[-1]
    drift       = _compute_drift(df)
    rng         = np.random.default_rng(_make_seed(ticker))
    volatility  = float(df['Close'].pct_change().dropna().std())
    noise_scale = volatility * 0.5

    forecast      = []
    current_price = last_price

    for i in range(1, horizon + 1):
        shock         = rng.normal(0, noise_scale)
        current_price = current_price * (1 + drift + shock)
        next_date     = last_date + timedelta(days=i)
        while next_date.weekday() >= 5:
            next_date += timedelta(days=1)
        forecast.append({
            "date":  next_date.strftime('%Y-%m-%d'),
            "price": round(current_price, 2),
        })
        last_date = next_date

    return historical, forecast
