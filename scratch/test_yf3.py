import yfinance as yf

ticker = 'AAPL'
# Hardcode dates in the past
stock_data = yf.download(ticker, start='2023-05-01', end='2024-05-01')
print("Data size:", len(stock_data))
if not stock_data.empty:
    print("Latest date:", stock_data.index[-1])
