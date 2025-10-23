// Real-time ML Inference Service for Satellite Anomaly Detection
import { fetchSatellitePositions, type SatelliteData } from "./spacetrack-api"
import { mlService, type SatelliteTelemetry, type AnomalyResult } from "./ml-service"
import { predictOrbit } from "./orbital-mechanics"
import { MITREMapper, type ThreatIntelligence } from "./mitre-mapping"

export interface RealTimeAnomaly {
  id: string
  satelliteName: string
  noradId?: number
  anomalyResult: AnomalyResult
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
    this.initializeInference()
  }

  private async initializeInference() {
    console.log("[v0] Initializing real-time inference system...")

    // Wait for ML model to be ready
    const waitForModel = () => {
      return new Promise<void>((resolve) => {
        const checkModel = () => {
          if (mlService.isModelReady()) {
            this.metrics.modelStatus = "ready"
            console.log("[v0] ML model is ready for inference")
            resolve()
          } else {
            setTimeout(checkModel, 1000)
          }
        }
        checkModel()
      })
    }

    await waitForModel()

    // Train model with synthetic data if not already trained
    try {
      const trainingData = mlService.generateSyntheticTrainingData(1500)
      await mlService.trainModel(trainingData)
      console.log("[v0] ML model trained and ready for real-time inference")
    } catch (error) {
      console.error("[v0] Error training ML model:", error)
      this.metrics.modelStatus = "error"
    }
  }

  async startRealTimeInference() {
    if (this.isRunning) {
      console.log("[v0] Real-time inference already running")
      return
    }

    console.log("[v0] Starting real-time satellite anomaly inference...")
    this.isRunning = true
    this.lastInferenceTime = Date.now()

    // Run inference every 30 seconds
    this.inferenceInterval = setInterval(async () => {
      await this.runInferenceCycle()
    }, 30000)

    // Run initial inference
    await this.runInferenceCycle()
  }

  stopRealTimeInference() {
    if (!this.isRunning) return

    console.log("[v0] Stopping real-time inference...")
    this.isRunning = false

    if (this.inferenceInterval) {
      clearInterval(this.inferenceInterval)
      this.inferenceInterval = null
    }
  }

  private async runInferenceCycle() {
    try {
      console.log("[v0] Running inference cycle...")

      // Fetch current satellite positions from Space-Track
      let satellites: SatelliteData[] = []
      try {
        satellites = await fetchSatellitePositions()
        this.metrics.dataSourceStatus.tle = "connected"
        this.metrics.dataSourceStatus.spaceTrack = "connected"
        this.metrics.totalSatellitesMonitored = satellites.length
      } catch (error) {
        console.error("[v0] Error fetching satellite data:", error)
        this.metrics.dataSourceStatus.tle = "error"
        this.metrics.dataSourceStatus.spaceTrack = "error"
        return
      }

      // Process each satellite through ML model
      for (const satellite of satellites) {
        await this.processSatelliteForAnomalies(satellite)
      }

      // Update metrics
      this.updateInferenceMetrics()
    } catch (error) {
      console.error("[v0] Error in inference cycle:", error)
    }
  }

  private async processSatelliteForAnomalies(satellite: SatelliteData) {
    try {
      const telemetry: SatelliteTelemetry = this.convertSatelliteDataToTelemetry(satellite)

      // Run ML inference
      const anomalyResult = await mlService.detectAnomaly(telemetry)
      this.inferenceCount++

      // If anomaly detected, create anomaly record
      if (anomalyResult.isAnomaly) {
        let orbitalPrediction
        if (satellite.tle) {
          const prediction = predictOrbit(satellite.tle.line1, satellite.tle.line2, 24, 60)
          if (prediction) {
            orbitalPrediction = {
              decayRisk: prediction.orbitalDecayRisk,
              collisionRisk: prediction.collisionRisk,
              anomalyIndicators: prediction.anomalyIndicators,
            }
          }
        }

        const threatIntelligence = MITREMapper.mapAnomalyToMITRE(anomalyResult.anomalyType, anomalyResult.severity)

        const realTimeAnomaly: RealTimeAnomaly = {
          id: `anomaly_${Date.now()}_${satellite.id}`,
          satelliteName: satellite.name,
          noradId: satellite.noradId,
          anomalyResult,
          timestamp: new Date().toISOString(),
          location: {
            latitude: satellite.latitude,
            longitude: satellite.longitude,
            altitude: satellite.altitude,
          },
          orbitalPrediction,
          threatIntelligence: threatIntelligence || undefined,
        }

        // Add to anomalies list (keep last 50)
        this.anomalies = [realTimeAnomaly, ...this.anomalies.slice(0, 49)]
        this.metrics.anomaliesDetected = this.anomalies.length

        console.log(
          `[v0] Anomaly detected: ${satellite.name} - ${anomalyResult.anomalyType} (${anomalyResult.confidence}% confidence) - MITRE: ${threatIntelligence?.mitreId || "N/A"}`,
        )
      }
    } catch (error) {
      console.error(`[v0] Error processing satellite ${satellite.name}:`, error)
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
    }
  }

  private updateInferenceMetrics() {
    const now = Date.now()
    const timeDiff = (now - this.lastInferenceTime) / 1000 / 60 // minutes

    this.metrics.inferenceRate = timeDiff > 0 ? this.inferenceCount / timeDiff : 0
    this.metrics.lastUpdate = new Date().toISOString()
    this.metrics.modelStatus = mlService.isModelReady() ? "ready" : "error"
  }

  // Public API methods
  getRecentAnomalies(limit = 20): RealTimeAnomaly[] {
    return this.anomalies.slice(0, limit)
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
