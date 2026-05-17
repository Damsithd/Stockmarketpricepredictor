import os

try:
    from google import genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False

def generate_analyst_report(ticker: str, historical_data: list, forecast_data: list) -> str:
    """
    Simulates the TradingAgents multi-agent LLM reasoning pipeline using Gemini (if available).
    Falls back to a mock report if the API key is not set or Gemini is unavailable.
    """
    if not historical_data or not forecast_data:
        return "Insufficient data for analysis."
        
    start_price = historical_data[0]['price']
    current_price = historical_data[-1]['price']
    forecast_end = forecast_data[-1]['price']
    
    hist_change = ((current_price - start_price) / start_price) * 100
    forecast_change = ((forecast_end - current_price) / current_price) * 100
    
    trend = "Bullish" if forecast_change > 0 else "Bearish"
    
    api_key = os.environ.get("GEMINI_API_KEY")
    if api_key and GENAI_AVAILABLE:
        try:
            client = genai.Client(api_key=api_key)
            
            prompt = f"""
            Act as a multi-agent trading system consisting of a Technical Analyst, a Sentiment & News Analyst, and a Portfolio Manager.
            Generate a concise, professional analysis report for {ticker} based on the following data:
            - Historical 30-day start price: ${start_price:.2f}
            - Current price: ${current_price:.2f}
            - Historical change: {hist_change:.2f}%
            - AI LSTM forecast ({len(forecast_data)} days): targeting ${forecast_end:.2f} ({forecast_change:.2f}%)
            - Overall trend: {trend}
            
            Structure the report exactly like this:
            ### Multi-Agent Analysis Report for {ticker}
            
            **1. Technical Analyst Agent**
            [Provide technical analysis based on the price action and forecast]
            
            **2. Sentiment & News Analyst Agent**
            [Provide a hypothetical sentiment analysis for the current market context]
            
            **3. Portfolio Manager Agent (Decision)**
            **Verdict: [HOLD/ACCUMULATE/REDUCE EXPOSURE]**
            [Provide final advice based on the above]
            """
            response = client.models.generate_content(
                model='gemini-1.5-flash',
                contents=prompt
            )
            if response.text:
                return response.text.strip()
        except Exception as e:
            print(f"Error calling Gemini API: {e}")
            # Fall back to mock report
            pass

    # Fallback mock report
    report = f"""
    ### Multi-Agent Analysis Report for {ticker}
    
    **1. Technical Analyst Agent**
    Over the last 30 days, {ticker} moved from ${start_price:.2f} to ${current_price:.2f} ({hist_change:.2f}%). 
    Moving averages and RSI indicate a momentum shift. The LSTM quantitative model predicts a {trend} trend 
    over the next {len(forecast_data)} days, targeting ${forecast_end:.2f} ({forecast_change:.2f}%).
    
    **2. Sentiment & News Analyst Agent**
    Recent market sentiment metrics lean slightly positive, aligning with sector-wide tailwinds. 
    However, macroeconomic volatility remains a factor to watch.
    
    **3. Portfolio Manager Agent (Decision)**
    **Verdict: {"HOLD/ACCUMULATE" if trend == "Bullish" else "REDUCE EXPOSURE"}**
    Based on the LSTM forecast convergence with our technical and sentiment indicators, we advise 
    {"maintaining or slightly increasing" if trend == "Bullish" else "trimming"} positions. Set stop-losses tightly around current support levels.
    """
    return report.strip()
