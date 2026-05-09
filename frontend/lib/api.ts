export interface DataPoint {
  date: string;
  price: number;
}

export interface PredictionResponse {
  ticker: string;
  historical: DataPoint[];
  forecast: DataPoint[];
  analysis_report: string;
}

/**
 * Calls the backend /api/predict endpoint.
 * In dev, Next.js rewrites this to http://localhost:8000/api/predict.
 * In Docker, it rewrites to http://backend:8000/api/predict.
 */
export async function fetchPrediction(
  ticker: string,
  horizon: number = 7
): Promise<PredictionResponse> {
  const response = await fetch("/api/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticker, horizon }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.detail || `HTTP ${response.status}: Prediction failed`);
  }

  return response.json() as Promise<PredictionResponse>;
}
