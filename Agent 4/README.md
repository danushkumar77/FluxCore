# FluxCore Grid Reliability Fault Intelligence Agent

FluxCore is a full-stack grid reliability platform that combines a FastAPI backend, a React/Vite frontend, and a collection of domain services for fault detection, risk assessment, restoration planning, and operator support.

## Overview

This project is designed to simulate and assist with electrical grid operations by providing:

- real-time grid telemetry and incident handling
- fault detection and classification workflows
- relay intelligence and restoration planning support
- a dashboard-style frontend for operators and engineers

## Project Structure

- backend/ - FastAPI application and domain services
  - app/main.py - API entry point
  - app/application/ - business logic services
  - app/infrastructure/ - repositories, SCADA integration, and ML assets
  - app/knowledge/ - rules and standards used by the system
- frontend/ - React + Vite UI for monitoring and operator interaction

## Backend Setup

1. Navigate to the backend folder.
2. Create and activate a virtual environment if needed.
3. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

4. Run the API server:

   ```bash
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```

## Frontend Setup

1. Navigate to the frontend folder.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

## Technologies

- Python / FastAPI
- React / Vite
- WebSockets for live updates
- scikit-learn, XGBoost, and joblib for ML components

## Notes

The project is intended as an intelligent reliability and incident-support tool for power grid operations and can be extended with additional monitoring data, model training pipelines, and operational integrations.
