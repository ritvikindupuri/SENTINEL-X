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
  anomaly_type: string;
  severity: string;
}

export interface DashboardData {
    subframes: any[];
    logs: any[];
    rsos: any[];
}

class MLAnomalyService {
  private socket: Socket;
  private predictionCallback: ((result: AnomalyResult) => void) | null = null;

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

    this.socket.on("prediction_result", (data: AnomalyResult) => {
      if (this.predictionCallback) {
        this.predictionCallback(data);
      }
    });
  }

  getDashboardData(telemetry: SatelliteTelemetry) {
    this.socket.emit("get_dashboard_data", { telemetry });
  }

  onDashboardData(callback: (data: DashboardData) => void) {
    this.socket.on("dashboard_data", callback);
  }

  trainModel(trainingData: SatelliteTelemetry[], satellites: any[]) {
    this.socket.emit("train", { data: trainingData, satellites });
  }

  detectAnomaly(telemetry: SatelliteTelemetry, satellite: any): Promise<AnomalyResult> {
    return new Promise((resolve) => {
      this.predictionCallback = resolve;
      this.socket.emit("predict", { telemetry, satellite });
    });
  }

  onNewTelemetry(callback: (data: any) => void) {
    this.socket.on("new_telemetry", callback);
  }

  disconnect() {
    this.socket.disconnect();
  }
}

export const mlService = new MLAnomalyService();
