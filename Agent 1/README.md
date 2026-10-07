# FluxCore — Demand Forecast Agent

[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg)](https://reactjs.org)
[![XGBoost](https://img.shields.io/badge/XGBoost-ML-orange.svg)](https://xgboost.readthedocs.io)

An enterprise-grade autonomous AI agent for electricity demand forecasting, designed for integration into the **FluxCore** multi-agent smart grid platform.

## Architecture

```
Grid Data → Validation → Preprocessing → Feature Engineering → ML Prediction
    → Confidence Calculation → Risk Assessment → AI Reasoning → Recommendations
    → Memory Storage → API Response → Dashboard Update
```

## Features

- **ML-Powered Forecasting** — XGBoost model predicting next 1h, 6h, 24h demand + peak load
- **AI Reasoning** — Google Gemini-powered natural language prediction explanations
- **Risk Analysis** — Multi-factor grid stress, reserve margin, and operational risk assessment
- **Smart Recommendations** — Context-aware operational action recommendations
- **Prediction Memory** — SQLite storage with full prediction history
- **Enterprise APIs** — RESTful endpoints with structured JSON responses
- **Premium Dashboard** — Dark-mode glassmorphism UI with real-time charts

## Quick Start

### 1. Backend Setup

```bash
cd backend
pip install -r requirements.txt

# Generate training data
python -m training.generate_data

# Train the ML model
python -m training.train_model

# Start the API server
uvicorn main:app --reload
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### 3. Environment Variables (Optional)

```bash
cp backend/.env.example backend/.env
# Add your GEMINI_API_KEY for AI reasoning (optional — rule-based fallback available)
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/predict` | Single demand prediction |
| POST | `/api/v1/predict-batch` | Batch predictions |
| GET | `/api/v1/history` | Prediction history |
| GET | `/api/v1/metrics` | Model performance metrics |
| GET | `/api/v1/health` | System health check |
| GET | `/api/v1/model-info` | Model metadata |
| GET | `/api/v1/feature-importance` | Feature importance rankings |
| GET | `/api/v1/dashboard-summary` | Dashboard aggregated data |

## Tech Stack

**Backend:** Python, FastAPI, XGBoost, scikit-learn, SQLAlchemy, Google Gemini  
**Frontend:** React, TypeScript, Vite, Tailwind CSS, ShadCN UI, Recharts, Framer Motion  
**ML:** XGBoost regression with GridSearchCV, TimeSeriesSplit cross-validation  
**Database:** SQLite (PostgreSQL-ready via SQLAlchemy)

## Project Structure

```
├── backend/
│   ├── api/          # FastAPI routes and schemas
│   ├── agents/       # Agent orchestrator
│   ├── services/     # Business logic services
│   ├── database/     # ORM models and repository
│   ├── training/     # ML pipeline
│   ├── models/       # Trained model artifacts
│   ├── config/       # Settings and configuration
│   └── utils/        # Logging utilities
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Route pages
│   │   ├── hooks/       # Custom hooks
│   │   ├── services/    # API service layer
│   │   └── types/       # TypeScript interfaces
│   └── ...
└── README.md
```

## License

MIT
