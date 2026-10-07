import React, { useState, useEffect } from 'react';
import { BarChart2, ShieldCheck, TrendingUp } from 'lucide-react';

export default function ModelPerformance() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:8000/grid/model-info')
      .then(res => res.json())
      .then(data => {
        setMetrics(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading model metrics:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="control-room-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748B' }}>
        Querying model performance databases...
      </div>
    );
  }

  if (!metrics || metrics.status === "NO_METRICS_FOUND") {
    return (
      <div className="control-room-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#FF9500', textAlign: 'center', fontSize: '12px' }}>
        No metrics retrieved. Machine learning pipeline training is currently boot-strapping. Try again shortly.
      </div>
    );
  }

  return (
    <div className="control-room-panel" style={{ height: '100%', overflowY: 'auto', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <ShieldCheck size={18} color="#0096FF" />
        <div style={{ fontFamily: 'Orbitron', fontWeight: 'bold', fontSize: '12px', color: '#0096FF', textTransform: 'uppercase' }}>
          Grid Intelligence Machine Learning Models Performance
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        
        {/* Model 1: Fault Detection */}
        <div style={{ background: '#16243F', border: '1px solid #1E2E4A', borderRadius: '8px', padding: '15px' }}>
          <div style={{ fontSize: '11px', fontFamily: 'Orbitron', color: '#34C759', fontWeight: 'bold', marginBottom: '8px' }}>
            1. FAULT DETECTION MODEL (RandomForest)
          </div>
          <div style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '10px' }}>
            <div>Accuracy: <strong>{(metrics.fault_detection.accuracy * 100).toFixed(1)}%</strong></div>
            <div>Precision: <strong>{(metrics.fault_detection.precision * 100).toFixed(1)}%</strong></div>
            <div>Recall: <strong>{(metrics.fault_detection.recall * 100).toFixed(1)}%</strong></div>
            <div>F1 Score: <strong>{(metrics.fault_detection.f1_score * 100).toFixed(1)}%</strong></div>
          </div>
          <div style={{ borderTop: '1px solid #1E2E4A', paddingTop: '8px' }}>
            <div style={{ fontSize: '9px', color: '#64748B', marginBottom: '5px' }}>Feature Importance</div>
            {Object.entries(metrics.fault_detection.feature_importances).map(([k, v]) => (
              <div key={k} style={{ fontSize: '9px', display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0' }}>
                <span style={{ width: '80px', color: '#64748B' }}>{k}:</span>
                <div style={{ flexGrow: 1, height: '4px', background: '#0A111C' }}>
                  <div style={{ background: '#34C759', height: '100%', width: `${v * 100}%` }} />
                </div>
                <span style={{ width: '35px', textAlign: 'right' }}>{(v * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Model 2: Fault Classification */}
        <div style={{ background: '#16243F', border: '1px solid #1E2E4A', borderRadius: '8px', padding: '15px' }}>
          <div style={{ fontSize: '11px', fontFamily: 'Orbitron', color: '#7C4DFF', fontWeight: 'bold', marginBottom: '8px' }}>
            2. FAULT CLASSIFICATION MODEL (XGBoost)
          </div>
          <div style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '10px' }}>
            <div>Accuracy: <strong>{(metrics.fault_classification.accuracy * 100).toFixed(1)}%</strong></div>
            <div>F1 Score: <strong>{(metrics.fault_classification.f1_score * 100).toFixed(1)}%</strong></div>
          </div>
          <div style={{ borderTop: '1px solid #1E2E4A', paddingTop: '8px' }}>
            <div style={{ fontSize: '9px', color: '#64748B', marginBottom: '5px' }}>Feature Importance</div>
            {Object.entries(metrics.fault_classification.feature_importances).map(([k, v]) => (
              <div key={k} style={{ fontSize: '9px', display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0' }}>
                <span style={{ width: '80px', color: '#64748B' }}>{k}:</span>
                <div style={{ flexGrow: 1, height: '4px', background: '#0A111C' }}>
                  <div style={{ background: '#7C4DFF', height: '100%', width: `${v * 100}%` }} />
                </div>
                <span style={{ width: '35px', textAlign: 'right' }}>{(v * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Model 3: Fault Localization */}
        <div style={{ background: '#16243F', border: '1px solid #1E2E4A', borderRadius: '8px', padding: '15px' }}>
          <div style={{ fontSize: '11px', fontFamily: 'Orbitron', color: '#0096FF', fontWeight: 'bold', marginBottom: '8px' }}>
            3. FAULT LOCALIZATION MODEL (RandomForest)
          </div>
          <div style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '10px' }}>
            <div>Root Mean Squared Error (RMSE): <strong>{metrics.fault_localization.rmse.toFixed(3)} km</strong></div>
            <div>Mean Absolute Error (MAE): <strong>{metrics.fault_localization.mae.toFixed(3)} km</strong></div>
          </div>
        </div>

        {/* Model 4: Outage Prediction */}
        <div style={{ background: '#16243F', border: '1px solid #1E2E4A', borderRadius: '8px', padding: '15px' }}>
          <div style={{ fontSize: '11px', fontFamily: 'Orbitron', color: '#FF9500', fontWeight: 'bold', marginBottom: '8px' }}>
            4. OUTAGE PREDICTION MODEL (XGBoost)
          </div>
          <div style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '10px' }}>
            <div>Remaining Useful Life RMSE: <strong>{metrics.outage_prediction.rmse.toFixed(1)} hrs</strong></div>
          </div>
        </div>

      </div>
    </div>
  );
}
