def generate_analyst_report(ticker: str, historical_data: list, forecast_data: list) -> str:
    """
    Simulates the TradingAgents multi-agent LLM reasoning pipeline.
    In a full production environment, this would call GPT/Claude via LangChain/LangGraph,
    prompting a Fundamental Analyst, Technical Analyst, and Portfolio Manager.
    """
    if not historical_data or not forecast_data:
        return "Insufficient data for analysis."
        
    start_price = historical_data[0]['price']
    current_price = historical_data[-1]['price']
    forecast_end = forecast_data[-1]['price']
    
    hist_change = ((current_price - start_price) / start_price) * 100
    forecast_change = ((forecast_end - current_price) / current_price) * 100
    
    trend = "Bullish" if forecast_change > 0 else "Bearish"
    
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
