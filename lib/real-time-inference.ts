// Real-time ML Inference Service for Satellite Anomaly Detection
import { fetchSatellitePositions, type SatelliteData } from "./spacetrack-api"
import { mlService, type SatelliteTelemetry, type AnomalyResult } from "./ml-service"
import { predictOrbit } from "./orbital-mechanics"
import { MITREMapper, type ThreatIntelligence } from "./mitre-mapping"

export interface RealTimeAnomaly {
  id: string
  satelliteName: string
  noradId?: number
  anomalyResult: any
  timestamp: string
  location: {
    latitude: number
    longitude: number
    altitude: number
  }
  orbitalPrediction?: {
    decayRisk: number
    collisionRisk: number
    anomalyIndicators: {
      unexpectedOrbitChange: boolean
      altitudeDrift: boolean
      velocityAnomaly: boolean
    }
  }
  threatIntelligence?: ThreatIntelligence
}

export interface InferenceMetrics {
  totalSatellitesMonitored: number
  anomaliesDetected: number
  inferenceRate: number // inferences per minute
  lastUpdate: string
  modelStatus: "ready" | "training" | "error"
  dataSourceStatus: {
    spaceTrack: "connected" | "error" | "rate_limited"
    tle: "connected" | "error"
  }
}

class RealTimeInferenceService {
  private anomalies: RealTimeAnomaly[] = []
  private isRunning = false
  private inferenceInterval: NodeJS.Timeout | null = null
  private onNewAnomalyCallback: (anomaly: RealTimeAnomaly) => void = () => {};
  private metrics: InferenceMetrics = {
    totalSatellitesMonitored: 0,
    anomaliesDetected: 0,
    inferenceRate: 0,
    lastUpdate: new Date().toISOString(),
    modelStatus: "ready",
    dataSourceStatus: {
      spaceTrack: "connected",
      tle: "connected",
    },
  }
  private inferenceCount = 0
  private lastInferenceTime = Date.now()
  private spaceWeatherCacheTime = 0

  constructor() {
    // The ML model is now managed by the Python service.
  }

  async startRealTimeInference() {
    if (this.isRunning) {
      console.log("Real-time inference already running");
      return;
    }

    console.log("Starting real-time satellite anomaly inference...");
    this.isRunning = true;
    this.lastInferenceTime = Date.now();

    this.runInferenceCycle();
    this.inferenceInterval = setInterval(() => this.runInferenceCycle(), 30000);
  }

  stopRealTimeInference() {
    if (!this.isRunning) return;

    console.log("Stopping real-time inference...");
    this.isRunning = false;

    if (this.inferenceInterval) {
      clearInterval(this.inferenceInterval);
      this.inferenceInterval = null;
    }

    mlService.disconnect();
  }

  private async runInferenceCycle() {
    try {
      const satellites = await fetchSatellitePositions();
      this.metrics.totalSatellitesMonitored = satellites.length;

      for (const satellite of satellites) {
        const telemetry: SatelliteTelemetry = this.convertSatelliteDataToTelemetry(satellite);
        const anomalyResult = await mlService.detectAnomaly(telemetry);
        if (anomalyResult.is_anomaly) {
          this.processRealTimeData({ ...anomalyResult, satellite });
        }
      }

      this.updateInferenceMetrics();
    } catch (error) {
      console.error("Error in inference cycle:", error);
    }
  }

  private processRealTimeData(data: any) {
    const { satellite, anomaly_type, severity } = data;
    const anomaly: RealTimeAnomaly = {
      id: `anomaly_${Date.now()}`,
      satelliteName: satellite.name,
      anomalyResult: {
        is_anomaly: true,
        anomalyType: anomaly_type,
        severity: severity,
        confidence: 100,
      },
      timestamp: new Date().toISOString(),
      location: {
        latitude: satellite.latitude,
        longitude: satellite.longitude,
        altitude: satellite.altitude,
      },
    };
    this.anomalies = [anomaly, ...this.anomalies.slice(0, 49)];
    this.metrics.anomaliesDetected = this.anomalies.length;
    if (this.onNewAnomalyCallback) {
      this.onNewAnomalyCallback(anomaly);
    }
  }

  private convertSatelliteDataToTelemetry(satellite: SatelliteData): SatelliteTelemetry {
    return {
      temperature: satellite.telemetry.temperature,
      power: satellite.telemetry.power,
      communication: satellite.telemetry.communication,
      orbit: satellite.altitude > 0 ? Math.min(100, (satellite.altitude / 1000) * 10) : 95,
      voltage: satellite.telemetry.power > 80 ? 12 + (Math.random() - 0.5) * 1 : 10 + Math.random() * 2,
      solarPanelEfficiency: Math.max(0, Math.min(100, satellite.telemetry.power - 5 + Math.random() * 10)),
      attitudeControl: Math.max(0, Math.min(100, 95 + (Math.random() - 0.5) * 10)),
      fuelLevel: Math.max(0, Math.min(100, 80 + (Math.random() - 0.5) * 30)),
      timestamp: Date.now(),
    };
  }

  private updateInferenceMetrics() {
    const now = Date.now();
    const timeDiff = (now - this.lastInferenceTime) / 1000 / 60; // minutes
    this.metrics.inferenceRate = timeDiff > 0 ? this.inferenceCount / timeDiff : 0;
    this.metrics.lastUpdate = new Date().toISOString();
  }

  // Public API methods
  getRecentAnomalies(limit = 20): RealTimeAnomaly[] {
    return this.anomalies.slice(0, limit)
  }

  onNewAnomaly(callback: (anomaly: RealTimeAnomaly) => void) {
    this.onNewAnomalyCallback = callback;
  }

  getInferenceMetrics(): InferenceMetrics {
    return { ...this.metrics }
  }

  getAnomaliesBySeverity(severity: "low" | "medium" | "high" | "critical"): RealTimeAnomaly[] {
    return this.anomalies.filter((anomaly) => anomaly.anomalyResult.severity === severity)
  }

  getAnomaliesForMap(): Array<{
    id: string
    lat: number
    lng: number
    severity: string
    type: string
    satellite: string
    timestamp: string
  }> {
    return this.anomalies.map((anomaly) => ({
      id: anomaly.id,
      lat: anomaly.location.latitude,
      lng: anomaly.location.longitude,
      severity: anomaly.anomalyResult.severity,
      type: anomaly.anomalyResult.anomalyType,
      satellite: anomaly.satelliteName,
      timestamp: anomaly.timestamp,
    }))
  }

  isInferenceRunning(): boolean {
    return this.isRunning
  }

  async forceInferenceCycle() {
    if (this.isRunning) {
      await this.runInferenceCycle()
    }
  }

  clearAnomalies() {
    this.anomalies = []
    this.metrics.anomaliesDetected = 0
  }

  getSystemStatus() {
    return {
      inference: this.isRunning ? "running" : "stopped",
      model: this.metrics.modelStatus,
      dataSources: this.metrics.dataSourceStatus,
      lastUpdate: this.metrics.lastUpdate,
      totalAnomalies: this.anomalies.length,
    }
  }
}

export const realTimeInference = new RealTimeInferenceService()
