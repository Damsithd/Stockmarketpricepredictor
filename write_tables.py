import csv
import os

data_dir = '/Users/damsithdissanayake/Stockmarketpricepredictor/extracted_tables'
os.makedirs(data_dir, exist_ok=True)

tables = {
    'Project_Objectives.csv': [
        ['Objective', 'Explanation (What/How)'],
        ['O1: Develop a High-Accuracy LSTM Deep Learning Model', 'To design, train, and optimize a multivariate LSTM network using Python (TensorFlow/Keras). The model will incorporate historical price data, trading volume, and calculated technical indicators (e.g., RSI, MACD) to capture non-linear patterns and long-term dependencies in the financial time series data.'],
        ['O2: Implement a Decoupled Microservice Architecture', 'To build a two-tiered system where the Python ML Model is deployed as an independent RESTful microservice (using Flask/FastAPI). This service will be callable by the Next.js application, ensuring that the intensive computational load of the model is decoupled from the web application layer.'],
        ['O3: Design and Develop a Next.js User Interface', 'To utilize the Next.js framework to create a single-page, responsive, and performance-optimized frontend application that provides user authentication, ticker search functionality, and real-time interactive charting of predicted and historical prices.'],
        ['O4: Evaluate Model Performance and Justify Superiority', 'To conduct rigorous model validation, comparing the LSTM model\'s performance against at least one conventional statistical model (e.g., ARIMA) using standardized metrics like Root Mean Square Error (RMSE) and Mean Absolute Error (MAE).']
    ],
    'Functional_Requirements.csv': [
        ['Requirement', 'Description'],
        ['FR1 (Authentication)', 'The system shall allow users to register and securely log in.'],
        ['FR2 (Prediction Request)', 'The system shall allow a user to input a stock ticker and a prediction horizon (e.g., 7 days).'],
        ['FR3 (Visualization)', 'The Next.js frontend shall display the historical stock data and the projected forecast via an interactive chart library.'],
        ['FR4 (Microservice Call)', 'The Next.js backend (API route) shall send input features to the Python ML microservice via a secure HTTP request to obtain the prediction result.']
    ],
    'Non_Functional_Requirements.csv': [
        ['Requirement', 'Description'],
        ['NFR1 (Performance)', 'The complete prediction workflow (request to chart render) shall take less than 8 seconds to execute.'],
        ['NFR2 (Security)', 'All user credentials and API communication must be encrypted (HTTPS and JWTs).'],
        ['NFR3 (Scalability)', 'The application must be deployable as two separate, containerized services (Next.js and Python) to facilitate independent scaling (Microservice Strategy).'],
        ['NFR4 (Usability)', 'The frontend application shall be fully responsive and optimized for both desktop and mobile devices.']
    ],
    'Finance.csv': [
        ['Item', 'Description', 'Estimated Cost (LKR)'],
        ['Cloud Hosting', '1-year subscription for hosting the Next.js app and the Python ML Microservice', '20000'],
        ['Domain Name', '1-year domain registration.', '5000'],
        ['Electricity/Internet', 'Indirect operational costs for the development phase.', '5000'],
        ['Total Estimated Cost', '', '30000 LKR']
    ],
    'External_Organizations.csv': [
        ['External Entity', 'Role/Contribution'],
        ['A Practicing Financial Analyst', 'Provides domain expertise for validating the utility of the technical indicators used and evaluating the real-world implications of the forecasting results.'],
        ['Financial Data API Provider', 'Provides the necessary high-frequency, reliable financial data for real-time model training and inference.'],
        ['Cloud Service Provider (e.g. Vercel AWS)', 'Provides the platform for production deployment, enabling demonstration of MLOps and microservice containerization.']
    ],
    'Time_Frame.csv': [
        ['Phase', 'Duration (Month)', 'Duration (Weeks)', 'Deliverable'],
        ['Requirement & Research', 'October', 'Week 1–2', 'Project Proposal Submission (Current Document)'],
        ['ML Model Design & Training', 'October-November', 'Week 3–6', 'Optimized LSTM Model (Trained, Saved weights) and Python ML Service API (Flask/FastAPI).'],
        ['Next.js & Database Setup', 'December-January', 'Week 7–10', 'Next.js Project Initialization, Authentication Logic, and MongoDB Integration (User/Watchlist Schemas).'],
        ['Microservice Integration', 'January', 'Week 11–13', 'Full API Bridge Integration between Next.js API Routes and Python ML Service. Basic End-to-End Prediction Test.'],
        ['Frontend & Visualization', 'February', 'Week 14–16', 'Complete, Responsive Next.js Frontend with Interactive Charts (Prediction & Metrics Display).'],
        ['Testing & Evaluation', 'February-March', 'Week 17–18', 'Model Comparison and Evaluation Report (RMSE/MAE comparison) and System Load Test Report.'],
        ['Final Documentation', 'March', 'Week 19–20', 'Final Report Submission and Presentation Preparation.']
    ],
    'Risk_Analysis.csv': [
        ['Risk ID', 'Risk Description', 'L', 'I', 'Mitigation Strategy'],
        ['R1', 'Model Overfitting: The LSTM model may "memorize" historical noise instead of general patterns, leading to poor live performance.', '4', '5', 'Implement Early Stopping, Dropout layers, and L2 Regularization during training. Validate using K-fold cross-validation on different time periods.'],
        ['R2', 'API Latency: High response times from the Python ML microservice could delay chart rendering beyond the 8-second NFR.', '3', '4', 'Use FastAPI for its asynchronous capabilities. Implement caching for frequently requested tickers to reduce redundant computation.'],
        ['R3', 'Data Source Volatility: Changes or outages in the Yahoo Finance API (External Data Layer) could break the data pipeline.', '2', '5', 'Implement robust exception handling in the data fetching script. Design a fallback mechanism to use local cached data if the API is unreachable.'],
        ['R4', 'Deployment Incompatibility: Differences between local development and cloud environments (Vercel/AWS) may cause service failures.', '3', '4', 'Use Docker containerization for both the Next.js frontend and Python backend to ensure environment parity across all stages.'],
        ['R5', 'Security Vulnerabilities: Unauthorized access to user accounts or data during transmission between microservices.', '2', '5', 'Enforce HTTPS for all API communication and implement JWT (JSON Web Tokens) for secure authentication between layers.']
    ],
    'Sprint_Table.csv': [
        ['Sprint', 'Focus Area', 'Key Tasks & Deliverables'],
        ['Sprint 1', 'Research & Data', 'Gathering requirements, collecting historical data via Yahoo Finance API, and performing data preprocessing/normalization'],
        ['Sprint 2', 'ML Model Development', 'Designing the LSTM architecture, training with technical indicators (RSI, MACD), and validating against ARIMA'],
        ['Sprint 3', 'Backend & API', 'Developing the FastAPI/Flask microservice, containerizing the model with Docker, and setting up the MongoDB schema'],
        ['Sprint 4', 'Frontend & Integration', 'Building the Next.js interface, implementing user authentication, and establishing the secure API bridge to the ML service'],
        ['Sprint 5', 'Testing & Deployment', 'Performing unit, integration, and performance tests, followed by cloud deployment to Vercel and AWS']
    ]
}

for filename, rows in tables.items():
    with open(os.path.join(data_dir, filename), 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerows(rows)

print("Tables extracted successfully.")
