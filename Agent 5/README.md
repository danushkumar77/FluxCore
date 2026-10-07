# Fluxcore Predictive Maintenance

Fluxcore Predictive Maintenance is an AI-assisted asset health and maintenance intelligence platform for industrial infrastructure. It combines a FastAPI backend, a React/Vite frontend, and a digital-twin-style monitoring experience to analyze assets, forecast failure risk, and recommend maintenance actions.

## Project Overview

This project includes:

- A backend service for asset analysis, anomaly detection, predictive maintenance planning, and reliability reasoning.
- A frontend dashboard for visualizing digital twin data and operational insights.
- Knowledge-driven logic for transformers, breakers, batteries, and other critical assets.

## Repository Structure

- backend/ - FastAPI application, domain models, services, repositories, and simulation logic
- frontend/ - React/Vite user interface
- models/ - trained or packaged model artifacts
- knowledge/ - rules and maintenance knowledge base

## Prerequisites

- Python 3.10+
- Node.js 18+
- npm or pnpm

## Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

The API will be available at http://localhost:8000.

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at http://localhost:5173.

## Notes

This repository is intended for demonstration, experimentation, and further extension of predictive maintenance workflows.
