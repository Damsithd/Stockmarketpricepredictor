import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta

ticker = 'AAPL'
end_date = datetime.now()
start_date = end_date - timedelta(days=30)
stock_data = yf.download(ticker, start=start_date.strftime('%Y-%m-%d'), end=end_date.strftime('%Y-%m-%d'))

print("Original columns:", stock_data.columns)
df = stock_data.reset_index()
print("After reset_index:", df.columns)

if isinstance(df.columns, pd.MultiIndex):
    df.columns = df.columns.get_level_values(0)
print("After flatten:", df.columns)
