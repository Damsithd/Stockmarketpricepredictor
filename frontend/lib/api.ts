export interface DataPoint {
  date: string;
  price: number;
  // OHLCV
  open?:   number;
  high?:   number;
  low?:    number;
  close?:  number;
  volume?: number;
  // Moving averages
  sma20?:  number;
  sma50?:  number;
  ema12?:  number;
  ema26?:  number;
  // MACD suite
  macd?:        number;
  macd_signal?: number;
  macd_hist?:   number;
  // RSI
  rsi?: number;
  // Bollinger Bands
  bb_upper?:  number;
  bb_lower?:  number;
  bb_middle?: number;
  // Medium indicators
  atr?:       number;
  stoch_k?:   number;
  stoch_d?:   number;
  obv?:       number;
  williams_r?: number;
  cci?:       number;
}

export interface PredictionResponse {
  ticker: string;
  historical: DataPoint[];
  forecast:   DataPoint[];
  analysis_report: string;
}

/**
 * Calls the backend /api/predict endpoint.
 * In dev, Next.js rewrites this to http://localhost:8000/api/predict.
 * In Docker, it rewrites to http://backend:8000/api/predict.
 */
export async function fetchPrediction(
  ticker: string,
  horizon: number = 7,
  historical_days: number = 365
): Promise<PredictionResponse> {
  const response = await fetch("/api/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticker, horizon, historical_days }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.detail || `HTTP ${response.status}: Prediction failed`);
  }

  return response.json() as Promise<PredictionResponse>;
}

export async function fetchBriefing(tickers: string[]): Promise<string> {
  const response = await fetch("/api/briefing", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tickers }),
  });

  if (!response.ok) return "Failed to fetch AI briefing.";
  const data = await response.json();
  return data.briefing;
}
