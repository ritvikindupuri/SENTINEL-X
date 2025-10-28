
// Real-time ML Inference Service for Satellite Anomaly Detection
import { fetchSatellitePositions, type SatelliteData } from "./spacetrack-api"
import io from "socket.io-client";

const ML_SERVICE_URL = "http://localhost:5000";

// (Keep existing interfaces)
export interface RealTimeAnomaly {
  id: string;
  satelliteName: string;
  noradId?: number;
  anomalyResult: any;
  timestamp: string;
  location: {
    latitude: number;
    longitude: number;
    altitude: number;
  };
  orbitalPrediction?: any;
  threatIntelligence?: any;
  isFlagged?: boolean;
}

export interface Subframe {
  id: string;
  name: string;
  timestamp: string;
  description: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: "info" | "warning" | "error";
  message: string;
}

export interface RSOEventLog {
  timestamp: string;
  event: string;
  category: string;
}

export interface RSO {
  id: string;
  name: string;
  rsoId: string;
  catalogNumber: number;
  country: string;
  operator: string;
  missionCapability: string;
  techType: string;
  orbitType: string;
  perigeeKm: number;
  inclination: number;
  angleofDegree: string;
  apogeeKm: number;
  eccentricity: number;
  operatingBandFrequency: string;
  tleTimestamp: string;
  size: string;
  massKg: number;
  payload: string;
  launchDate: string;
  operationalEndDate: string;
  reentryDate: string;
  intldes: string;
  manufacture: string;
  typeOfDataEntry: string;
  eventLogs: RSOEventLog[];
}

export interface DashboardData {
  header: {
    alerts: number;
    rsos: number;
    ttps: number;
    score: number;
  };
  alertsOverTime: Array<{ name: string; alerts: number }>;
  telemetryTimeline: Array<{ name: string; power: number; temp: number; comms: number }>;
  spartaMitreAlignment: Array<{ id: string; name: string; coverage: number }>;
  score: number;
  recentEvents: RealTimeAnomaly[];
  subframes: Subframe[];
  logs: LogEntry[];
  rsos: RSO[];
}


class RealTimeInferenceService {
  private anomalies: RealTimeAnomaly[] = []
  private isRunning = false
  private inferenceInterval: NodeJS.Timeout | null = null
  private dashboardDataInterval: NodeJS.Timeout | null = null;
  private onNewDataCallback: (data: DashboardData) => void = () => {};
  private metrics: any = {
    totalSatellitesMonitored: 0,
    anomaliesDetected: 0,
  }
  private socket: any;

  constructor() {
    this.socket = io(ML_SERVICE_URL, {
      transports: ["websocket"],
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
    });

    this.socket.on("connect", () => {
      console.log("Connected to Python ML service");
      this.socket.emit("get_dashboard_data", {});
    });

    this.socket.on("disconnect", () => {
      console.log("Disconnected from Python ML service");
    });

    this.socket.on("dashboard_data", (data) => {
      this.emitDashboardData(data);
    });

    this.socket.on("new_anomaly", (newAnomaly: RealTimeAnomaly) => {
      console.log("Received new anomaly:", newAnomaly);
      if (!this.anomalies.some(a => a.id === newAnomaly.id)) {
        this.anomalies = [newAnomaly, ...this.anomalies.slice(0, 49)];
        this.metrics.anomaliesDetected = this.anomalies.length;
      }
    });
  }
  async startRealTimeInference() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.socket.connect();
  }

  stopRealTimeInference() {
    if (!this.isRunning) return;
    this.isRunning = false;
    this.socket.disconnect();
  }

  flagAnomaly(anomalyId: string) {
    const anomaly = this.anomalies.find(a => a.id === anomalyId);
    if (anomaly) {
      anomaly.isFlagged = true;
      this.emitDashboardData();
    }
  }

  createManualAlert(alert: { satelliteName: string; anomalyType: string; severity: "low" | "medium" | "high" }) {
    const newAnomaly: RealTimeAnomaly = {
      id: `manual_anomaly_${Date.now()}`,
      satelliteName: alert.satelliteName,
      anomalyResult: {
        anomaly_type: alert.anomalyType,
        severity: alert.severity,
      },
      timestamp: new Date().toISOString(),
      location: { // Placeholder location for manual alerts
        latitude: Math.random() * 180 - 90,
        longitude: Math.random() * 360 - 180,
        altitude: 400,
      },
      isFlagged: true, // Manual alerts are always flagged
    };
    this.socket.emit("manual_alert", newAnomaly);
  }

  private emitDashboardData(data: any = {}) {
    const dashboardData = {
      ...this.buildDashboardData(),
      ...data,
    };
    this.onNewDataCallback(dashboardData);
  }

  private buildDashboardData(): DashboardData {
    const score = this.calculateOverallScore();
    const now = new Date();

    return {
      header: {
        alerts: this.anomalies.length,
        rsos: this.metrics.totalSatellitesMonitored,
        ttps: 4, // static for now
        score: score,
      },
      alertsOverTime: this.anomalies.slice(0, 10).map((a, i) => ({
        name: this.formatTime(new Date(a.timestamp), 0),
        alerts: 1,
      })),
      telemetryTimeline: this.anomalies.slice(0, 10).map((a, i) => ({
        name: this.formatTime(new Date(a.timestamp), 0),
        power: Math.random() * 20 + 80, // placeholder
        temp: Math.random() * 20 + 15, // placeholder
        comms: Math.random() * 10 + 90, // placeholder
      })),
      spartaMitreAlignment: [
        { id: "T001", name: "Signal Jamming", coverage: 75 },
        { id: "T002", name: "GPS Spoofing", coverage: 50 },
        { id: "T003", name: "Data Exfiltration", coverage: 85 },
      ],
      score: score,
      recentEvents: this.anomalies,
      subframes: [],
      logs: [],
      rsos: [],
    };
  }

  private calculateOverallScore(): number {
    if (this.anomalies.length === 0) return 0;
    const severityScores = { "low": 10, "medium": 40, "high": 80, "critical": 100 };
    const totalScore = this.anomalies.reduce((acc, a) => {
      return acc + (severityScores[a.anomalyResult.severity] || 0);
    }, 0);
    return Math.min(100, Math.floor(totalScore / this.anomalies.length));
  }

  private formatTime(date: Date, minuteOffset: number): string {
    const newDate = new Date(date.getTime() + minuteOffset * 60000);
    return newDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  private convertSatelliteDataToTelemetry(satellite: SatelliteData): any {
    return {
      temperature: satellite.telemetry.temperature,
      power: satellite.telemetry.power,
      communication: satellite.telemetry.communication,
      orbit: satellite.altitude,
      voltage: satellite.telemetry.power > 80 ? 12 + (Math.random() - 0.5) * 1 : 10 + Math.random() * 2,
      solarPanelEfficiency: Math.max(0, Math.min(100, satellite.telemetry.power - 5 + Math.random() * 10)),
      attitudeControl: Math.max(0, Math.min(100, 95 + (Math.random() - 0.5) * 10)),
      fuelLevel: Math.max(0, Math.min(100, 80 + (Math.random() - 0.5) * 30)),
      timestamp: Date.now(),
    };
  }

  onNewData(callback: (data: DashboardData) => void) {
    this.onNewDataCallback = callback;
  }
}

export const realTimeInference = new RealTimeInferenceService()
