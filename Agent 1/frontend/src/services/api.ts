import axios from 'axios';
import { 
  PredictionRequest, PredictionResponse, DashboardSummary, 
  HealthStatus, ModelMetrics, FeatureImportance, AgentStateSummary
} from '../types';
import { 
  mockDashboardSummary, mockPredictionResponse, mockHealth, 
  mockMetrics, mockFeatureImportanceList, mockAgentStateSummary
} from './mockData';

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 5000
});

export const predict = async (request: PredictionRequest): Promise<PredictionResponse> => {
  try {
    const response = await api.post('/predict', request);
    return response.data;
  } catch (error) {
    console.warn('Backend unavailable, using mock data for predict');
    return new Promise(resolve => setTimeout(() => resolve({
      ...mockPredictionResponse,
      timestamp: new Date().toISOString()
    }), 1000));
  }
};

export const predictBatch = async (requests: PredictionRequest[]): Promise<PredictionResponse[]> => {
  try {
    const response = await api.post('/predict-batch', { predictions: requests });
    return response.data.results;
  } catch (error) {
    console.warn('Backend unavailable, using mock data for predictBatch');
    return new Promise(resolve => setTimeout(() => resolve(
      requests.map(() => mockPredictionResponse)
    ), 1500));
  }
};

export const getHistory = async (limit = 10, offset = 0): Promise<PredictionResponse[]> => {
  try {
    const response = await api.get('/history', { params: { limit, offset } });
    return response.data;
  } catch (error) {
    console.warn('Backend unavailable, using mock data for history');
    return new Promise(resolve => setTimeout(() => resolve(mockDashboardSummary.recent_predictions), 500));
  }
};

export const getHealth = async (): Promise<HealthStatus> => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    return new Promise(resolve => setTimeout(() => resolve(mockHealth), 200));
  }
};

export const getMetrics = async (): Promise<ModelMetrics> => {
  try {
    const response = await api.get('/metrics');
    return response.data;
  } catch (error) {
    return new Promise(resolve => setTimeout(() => resolve(mockMetrics), 300));
  }
};

export const getModelInfo = async (): Promise<any> => {
  try {
    const response = await api.get('/model-info');
    return response.data;
  } catch (error) {
    return new Promise(resolve => setTimeout(() => resolve({ name: 'DemandForecast-v1', type: 'RandomForest+Gemini' }), 200));
  }
};

export const getFeatureImportance = async (): Promise<FeatureImportance[]> => {
  try {
    const response = await api.get('/feature-importance');
    return response.data;
  } catch (error) {
    return new Promise(resolve => setTimeout(() => resolve(mockFeatureImportanceList), 400));
  }
};

export const getDashboardSummary = async (): Promise<DashboardSummary> => {
  try {
    const response = await api.get('/dashboard-summary');
    return response.data;
  } catch (error) {
    console.warn('Backend unavailable, using mock data for dashboard summary');
    return new Promise(resolve => setTimeout(() => resolve(mockDashboardSummary), 800));
  }
};

export const getAgentState = async (): Promise<AgentStateSummary> => {
  try {
    const response = await api.get('/agent/state');
    return response.data;
  } catch (error) {
    return new Promise(resolve => setTimeout(() => resolve(mockAgentStateSummary), 400));
  }
};
