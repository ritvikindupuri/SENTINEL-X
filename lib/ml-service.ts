// Python ML Service for Satellite Anomaly Detection
import { io, Socket } from "socket.io-client";

const ML_SERVICE_URL = "http://localhost:5000";

export interface SatelliteTelemetry {
  temperature: number;
  power: number;
  communication: number;
  orbit: number;
  voltage: number;
  solarPanelEfficiency: number;
  attitudeControl: number;
  fuelLevel: number;
  timestamp: number;
}

export interface AnomalyResult {
  is_anomaly: boolean;
  reconstruction_error: number;
  isolation_forest_score: number;
}

class MLAnomalyService {
  private socket: Socket;

  constructor() {
    this.socket = io(ML_SERVICE_URL, {
      transports: ["websocket"],
    });

    this.socket.on("connect", () => {
      console.log("Connected to Python ML service");
    });

    this.socket.on("disconnect", () => {
      console.log("Disconnected from Python ML service");
    });
  }

  async trainModel(trainingData: SatelliteTelemetry[]): Promise<any> {
    const response = await fetch(`${ML_SERVICE_URL}/train`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data: trainingData }),
    });
    return response.json();
  }

  async detectAnomaly(telemetry: SatelliteTelemetry): Promise<AnomalyResult> {
    const response = await fetch(`${ML_SERVICE_URL}/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ telemetry }),
    });
    return response.json();
  }

  onNewTelemetry(callback: (data: any) => void) {
    this.socket.on("new_telemetry", callback);
  }

  disconnect() {
    this.socket.disconnect();
  }
}

export const mlService = new MLAnomalyService();
