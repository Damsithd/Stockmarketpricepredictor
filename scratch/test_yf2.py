import yfinance as yf

ticker = 'AAPL'
stock_data = yf.download(ticker, period="1y")
print("Data size:", len(stock_data))
if not stock_data.empty:
    print("Latest date:", stock_data.index[-1])
