import type { TelemetryMeasurement, AgentState, Alert } from "../types";

const API_SERVER = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");
const API_BASE = `${API_SERVER}/api/v1`;
const WS_BASE = `${API_SERVER.replace(/^http/, "ws")}/api/v1/ws`;

export const getSystemHealth = async () => {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
};

export const triggerSimulation = async (scenario: string, assetId: string, severity: string = "medium") => {
  const res = await fetch(`${API_BASE}/simulations/trigger`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-FluxCore-API-Key": "fluxcore-admin-key-2026"
    },
    body: JSON.stringify({
      scenario_type: scenario,
      target_id: assetId,
      duration_minutes: 30,
      severity
    })
  });
  return res.json();
};

export class FluxCoreWebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectInterval = 3000;
  private handlers: {
    telemetry?: (data: TelemetryMeasurement) => void;
    alerts?: (data: Alert) => void;
    agent_states?: (data: any) => void;
  } = {};

  constructor(
    onTelemetry?: (data: TelemetryMeasurement) => void,
    onAlert?: (data: Alert) => void,
    onAgentState?: (data: any) => void
  ) {
    this.handlers.telemetry = onTelemetry;
    this.handlers.alerts = onAlert;
    this.handlers.agent_states = onAgentState;
    this.connect();
  }

  private connect() {
    console.log("Connecting to FluxCore WebSocket Gateway...");
    this.ws = new WebSocket(WS_BASE);

    this.ws.onopen = () => {
      console.log("WebSocket connected. Subscribing to rooms...");
      // Auto-subscribe to all telemetry, alerts, and agent states rooms
      this.subscribe("telemetry");
      this.subscribe("alerts");
      this.subscribe("agent_states");
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        // Custom message distribution based on attributes
        if (message.measurement_id && this.handlers.telemetry) {
          this.handlers.telemetry(message);
        } else if (message.alert_id && this.handlers.alerts) {
          this.handlers.alerts(message);
        } else if (message.type === "state_transition" && this.handlers.agent_states) {
          this.handlers.agent_states(message);
        }
      } catch (err) {
        console.error("Error parsing WebSocket packet:", err);
      }
    };

    this.ws.onclose = () => {
      console.log("WebSocket connection lost. Retrying reconnect...");
      setTimeout(() => this.connect(), this.reconnectInterval);
    };

    this.ws.onerror = (err) => {
      console.error("WebSocket socket error:", err);
    };
  }

  private subscribe(room: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ action: "subscribe", room }));
    }
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}
