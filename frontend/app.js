let chartInstance = null;

// Initialize the dashboard on load
document.addEventListener('DOMContentLoaded', () => {
    // Initial load
    const initialTicker = document.getElementById('ticker-input').value;
    fetchPrediction(initialTicker);

    // Search button listener
    document.getElementById('search-btn').addEventListener('click', () => {
        const ticker = document.getElementById('ticker-input').value.trim().toUpperCase();
        if (ticker) {
            fetchPrediction(ticker);
        }
    });

    // Enter key listener
    document.getElementById('ticker-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const ticker = e.target.value.trim().toUpperCase();
            if (ticker) {
                fetchPrediction(ticker);
            }
        }
    });
});

async function fetchPrediction(ticker) {
    const loadingState = document.getElementById('loading-state');
    const dashboardContent = document.getElementById('dashboard-content');
    
    // UI states
    loadingState.classList.remove('hidden');
    loadingState.classList.add('flex');
    dashboardContent.classList.add('hidden');
    dashboardContent.classList.remove('opacity-100');
    
    try {
        const response = await fetch('/api/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ticker: ticker, horizon: 7 })
        });
        
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.detail || 'Prediction failed');
        }
        
        const data = await response.json();
        
        // Update UI
        document.getElementById('chart-title').textContent = `${data.ticker} Forecast`;
        
        // Parse markdown for agent report (very basic implementation)
        let htmlReport = data.analysis_report
            .replace(/### (.*)/g, '<h3>$1</h3>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br/>');
        document.getElementById('analysis-report').innerHTML = `<p>${htmlReport}</p>`;
        
        renderChart(data.historical, data.forecast);
        
        // Reveal dashboard
        loadingState.classList.add('hidden');
        loadingState.classList.remove('flex');
        dashboardContent.classList.remove('hidden');
        
        // slight delay for transition
        setTimeout(() => {
            dashboardContent.classList.add('opacity-100');
        }, 50);

    } catch (error) {
        alert("Error: " + error.message);
        loadingState.classList.add('hidden');
        loadingState.classList.remove('flex');
        dashboardContent.classList.remove('hidden');
        dashboardContent.classList.add('opacity-100');
    }
}

function renderChart(historical, forecast) {
    const ctx = document.getElementById('predictionChart').getContext('2d');
    
    if (chartInstance) {
        chartInstance.destroy();
    }

    // Combine labels and data
    // Historical
    const labels = historical.map(d => d.date);
    const histData = historical.map(d => d.price);
    const nullsForForecast = new Array(historical.length - 1).fill(null);
    
    // Forecast (Start forecast from the last historical point so the line connects)
    const lastHistPoint = historical[historical.length - 1];
    const forecastLabels = forecast.map(d => d.date);
    const foreData = [lastHistPoint.price, ...forecast.map(d => d.price)];
    
    const combinedLabels = [...labels, ...forecastLabels];
    
    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: combinedLabels,
            datasets: [
                {
                    label: 'Historical Price',
                    data: [...histData, ...new Array(forecast.length).fill(null)],
                    borderColor: 'rgb(156, 163, 175)', // gray-400
                    backgroundColor: 'rgba(156, 163, 175, 0.1)',
                    borderWidth: 2,
                    tension: 0.1,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    fill: true
                },
                {
                    label: 'LSTM Forecast',
                    data: [...nullsForForecast, ...foreData],
                    borderColor: 'rgb(59, 130, 246)', // blue-500
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    tension: 0.1,
                    pointRadius: 2,
                    pointHoverRadius: 6,
                    pointBackgroundColor: 'rgb(59, 130, 246)',
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: '#9ca3af',
                        usePointStyle: true,
                        boxWidth: 8
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(17, 24, 39, 0.9)',
                    titleColor: '#f3f4f6',
                    bodyColor: '#d1d5db',
                    borderColor: '#374151',
                    borderWidth: 1,
                    padding: 10,
                    displayColors: true
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(55, 65, 81, 0.3)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#6b7280',
                        maxTicksLimit: 10
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(55, 65, 81, 0.3)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#6b7280',
                        callback: function(value) {
                            return '$' + value;
                        }
                    }
                }
            }
        }
    });
}
