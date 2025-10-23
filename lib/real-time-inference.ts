// Real-time ML Inference Service for Satellite Anomaly Detection
import { fetchSatellitePositions, type SatelliteData } from "./spacetrack-api"
import { mlService, type SatelliteTelemetry, type AnomalyResult, type DashboardData as MLDashboardData } from "./ml-service"
import { predictOrbit } from "./orbital-mechanics"
import { MITREMapper, type ThreatIntelligence } from "./mitre-mapping"

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

export interface RSO {
  id: string;
  name: string;
  type: string;
  threatLevel: "low" | "medium" | "high";
  orbit: string;
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
  rsoClassification: Array<{ name: string; status: string; score: number }>;
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
  private dashboardData: MLDashboardData = {
    subframes: [],
    logs: [],
    rsos: [],
  };
  private latestTelemetry: SatelliteTelemetry | null = null;

  constructor() {
    this.trainInitialModel();
  }

  async trainInitialModel() {
    console.log("Fetching initial data for model training...");
    const initialSatellites = await fetchSatellitePositions();
    if (initialSatellites.length > 0) {
      const trainingData = initialSatellites.map(this.convertSatelliteDataToTelemetry);
      mlService.trainModel(trainingData, initialSatellites);
    }
  }

  async startRealTimeInference() {
    if (this.isRunning) return;
    this.isRunning = true;

    mlService.onDashboardData((data) => {
      this.dashboardData = data;
    });

    this.inferenceInterval = setInterval(() => this.runInferenceCycle(), 30000); // 30 seconds
    this.dashboardDataInterval = setInterval(() => this.requestDashboardData(), 5000); // 5 seconds
  }

  stopRealTimeInference() {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.inferenceInterval) clearInterval(this.inferenceInterval);
    if (this.dashboardDataInterval) clearInterval(this.dashboardDataInterval);
  }

  private requestDashboardData() {
    if (this.latestTelemetry) {
      mlService.getDashboardData(this.latestTelemetry);
    }
  }

  private async runInferenceCycle() {
    try {
      const satellites = await fetchSatellitePositions();
      this.metrics.totalSatellitesMonitored = satellites.length;

      for (const satellite of satellites) {
        const telemetry = this.convertSatelliteDataToTelemetry(satellite);
        this.latestTelemetry = telemetry;
        const anomalyResult = await mlService.detectAnomaly(telemetry, satellite);

        if (anomalyResult.is_anomaly) {
          this.processNewAnomaly(satellite, anomalyResult);
        }
      }
      this.emitDashboardData();

    } catch (error) {
      console.error("Error in inference cycle:", error);
    }
  }

  private processNewAnomaly(satellite: SatelliteData, anomalyResult: any) {
    const newAnomaly: RealTimeAnomaly = {
      id: `anomaly_${Date.now()}`,
      satelliteName: satellite.name,
      anomalyResult,
      timestamp: new Date().toISOString(),
      location: {
        latitude: satellite.latitude,
        longitude: satellite.longitude,
        altitude: satellite.altitude,
      },
    };
    this.anomalies = [newAnomaly, ...this.anomalies.slice(0, 49)];
    this.metrics.anomaliesDetected = this.anomalies.length;
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
    this.anomalies = [newAnomaly, ...this.anomalies.slice(0, 49)];
    this.metrics.anomaliesDetected = this.anomalies.length;
    this.emitDashboardData();
  }

  private emitDashboardData() {
    const dashboardData = this.buildDashboardData();
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
      rsoClassification: this.anomalies.map(a => ({
        name: a.satelliteName,
        status: a.anomalyResult.severity,
        score: Math.floor(Math.random() * 60) + 40,
      })),
      spartaMitreAlignment: [
        { id: "T001", name: "Signal Jamming", coverage: 75 },
        { id: "T002", name: "GPS Spoofing", coverage: 50 },
        { id: "T003", name: "Data Exfiltration", coverage: 85 },
      ],
      score: score,
      recentEvents: this.anomalies,
      subframes: this.dashboardData.subframes,
      logs: this.dashboardData.logs,
      rsos: this.dashboardData.rsos,
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

  private convertSatelliteDataToTelemetry(satellite: SatelliteData): SatelliteTelemetry {
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
