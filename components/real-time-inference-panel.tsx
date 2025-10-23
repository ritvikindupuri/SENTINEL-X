"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { realTimeInference, type RealTimeAnomaly, type InferenceMetrics } from "@/lib/real-time-inference"

export function RealTimeInferencePanel() {
  const [anomalies, setAnomalies] = useState<RealTimeAnomaly[]>([])
  const [metrics, setMetrics] = useState<InferenceMetrics | null>(null)
  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => {
    // Start real-time inference
    const startInference = async () => {
      await realTimeInference.startRealTimeInference()
      setIsRunning(true)
    }

    startInference()

    // Update data every 10 seconds
    const interval = setInterval(() => {
      const recentAnomalies = realTimeInference.getRecentAnomalies(10)
      const currentMetrics = realTimeInference.getInferenceMetrics()
      const running = realTimeInference.isInferenceRunning()

      setAnomalies(recentAnomalies)
      setMetrics(currentMetrics)
      setIsRunning(running)
    }, 10000)

    // Initial load
    setAnomalies(realTimeInference.getRecentAnomalies(10))
    setMetrics(realTimeInference.getInferenceMetrics())
    setIsRunning(realTimeInference.isInferenceRunning())

    return () => {
      clearInterval(interval)
      realTimeInference.stopRealTimeInference()
    }
  }, [])

  const handleToggleInference = async () => {
    if (isRunning) {
      realTimeInference.stopRealTimeInference()
      setIsRunning(false)
    } else {
      await realTimeInference.startRealTimeInference()
      setIsRunning(true)
    }
  }

  const handleForceUpdate = async () => {
    await realTimeInference.forceInferenceCycle()
    setAnomalies(realTimeInference.getRecentAnomalies(10))
    setMetrics(realTimeInference.getInferenceMetrics())
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-red-400"
      case "high":
        return "text-orange-400"
      case "medium":
        return "text-yellow-400"
      case "low":
        return "text-green-400"
      default:
        return "text-slate-400"
    }
  }

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case "critical":
        return "destructive"
      case "high":
        return "destructive"
      case "medium":
        return "default"
      case "low":
        return "secondary"
      default:
        return "outline"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready":
      case "connected":
      case "running":
        return "text-green-400"
      case "training":
        return "text-yellow-400"
      case "error":
      case "rate_limited":
        return "text-red-400"
      default:
        return "text-slate-400"
    }
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-cyan-400 flex items-center justify-between">
          Real-time ML Inference Engine
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isRunning ? "bg-green-400 animate-pulse" : "bg-red-400"}`}></div>
            <span className="text-xs text-slate-400">{isRunning ? "Active" : "Stopped"}</span>
          </div>
        </CardTitle>
        <CardDescription className="text-slate-400">
          Live satellite monitoring with Space-Track data integration and ML anomaly detection
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="anomalies" className="w-full">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="anomalies" className="data-[state=active]:bg-slate-700">
              Live Anomalies ({anomalies.length})
            </TabsTrigger>
            <TabsTrigger value="metrics" className="data-[state=active]:bg-slate-700">
              System Metrics
            </TabsTrigger>
            <TabsTrigger value="controls" className="data-[state=active]:bg-slate-700">
              Controls
            </TabsTrigger>
          </TabsList>

          <TabsContent value="anomalies" className="mt-6">
            <div className="space-y-4">
              {anomalies.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <div className="text-green-400 mb-2">✓</div>
                  <h3 className="text-slate-200 font-medium mb-2">No Anomalies Detected</h3>
                  <p className="text-sm text-slate-400">
                    {isRunning ? "Real-time monitoring active..." : "Inference engine stopped"}
                  </p>
                </div>
              ) : (
                anomalies.map((anomaly) => (
                  <div
                    key={anomaly.id}
                    className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-slate-200 font-medium">{anomaly.satelliteName}</h4>
                        <p className="text-sm text-slate-400">{anomaly.anomalyResult.anomalyType}</p>
                        {anomaly.noradId && <p className="text-xs text-slate-500">NORAD ID: {anomaly.noradId}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getSeverityBadgeVariant(anomaly.anomalyResult.severity)}>
                          {anomaly.anomalyResult.severity.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-slate-400">{anomaly.anomalyResult.confidence}%</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                      <div>
                        <span className="text-xs text-slate-400">Location</span>
                        <div className="text-sm font-medium text-slate-200">
                          {anomaly.location.latitude.toFixed(2)}, {anomaly.location.longitude.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400">Altitude</span>
                        <div className="text-sm font-medium text-slate-200">
                          {anomaly.location.altitude.toFixed(0)} km
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400">ML Score</span>
                        <div className="text-sm font-medium text-cyan-400">
                          {anomaly.anomalyResult.anomalyScore.toFixed(3)}
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400">Detected</span>
                        <div className="text-sm font-medium text-slate-200">
                          {new Date(anomaly.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>

                    {anomaly.spaceWeatherContext && (
                      <div className="bg-slate-700 rounded p-2 mb-3">
                        <span className="text-xs text-slate-400">Space Weather Context:</span>
                        <div className="text-xs text-slate-300 mt-1">
                          Solar Flares: {anomaly.spaceWeatherContext.solarFlareActivity} | Geomagnetic:{" "}
                          {anomaly.spaceWeatherContext.geomagneticStorm} | Radiation:{" "}
                          {anomaly.spaceWeatherContext.radiationLevel}%
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <Progress value={anomaly.anomalyResult.confidence} className="h-2" />
                      </div>
                      <span className="text-xs text-slate-400">Confidence</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="metrics" className="mt-6">
            {metrics && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                    <h4 className="text-slate-200 font-medium mb-4">Inference Metrics</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-400">Satellites Monitored</span>
                        <span className="text-sm font-medium text-cyan-400">{metrics.totalSatellitesMonitored}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-400">Anomalies Detected</span>
                        <span className="text-sm font-medium text-red-400">{metrics.anomaliesDetected}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-400">Inference Rate</span>
                        <span className="text-sm font-medium text-green-400">
                          {metrics.inferenceRate.toFixed(1)}/min
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-400">Last Update</span>
                        <span className="text-sm font-medium text-slate-200">
                          {new Date(metrics.lastUpdate).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                    <h4 className="text-slate-200 font-medium mb-4">System Status</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-400">ML Model</span>
                        <span className={`text-sm font-medium capitalize ${getStatusColor(metrics.modelStatus)}`}>
                          {metrics.modelStatus}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-400">Space-Track API</span>
                        <span
                          className={`text-sm font-medium capitalize ${getStatusColor(metrics.dataSourceStatus.spaceTrack)}`}
                        >
                          {metrics.dataSourceStatus.spaceTrack.replace("_", " ")}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-400">TLE Data</span>
                        <span
                          className={`text-sm font-medium capitalize ${getStatusColor(metrics.dataSourceStatus.tle)}`}
                        >
                          {metrics.dataSourceStatus.tle}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-400">Inference Engine</span>
                        <span
                          className={`text-sm font-medium capitalize ${getStatusColor(isRunning ? "running" : "stopped")}`}
                        >
                          {isRunning ? "Running" : "Stopped"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="controls" className="mt-6">
            <div className="space-y-4">
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                <h4 className="text-slate-200 font-medium mb-4">Inference Controls</h4>
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={handleToggleInference}
                    className={`${isRunning ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}`}
                  >
                    {isRunning ? "Stop Inference" : "Start Inference"}
                  </Button>
                  <Button
                    onClick={handleForceUpdate}
                    disabled={!isRunning}
                    variant="outline"
                    className="bg-transparent"
                  >
                    Force Update
                  </Button>
                  <Button
                    onClick={() => {
                      realTimeInference.clearAnomalies()
                      setAnomalies([])
                    }}
                    variant="outline"
                    className="bg-transparent"
                  >
                    Clear Anomalies
                  </Button>
                </div>
              </div>

              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                <h4 className="text-slate-200 font-medium mb-4">System Information</h4>
                <div className="text-sm text-slate-400 space-y-2">
                  <p>• Real-time inference runs every 30 seconds</p>
                  <p>• Integrates live Space-Track satellite TLE data</p>
                  <p>• Uses Python ML models (PyTorch CNN, scikit-learn, XGBoost)</p>
                  <p>• Ensemble anomaly detection with voting mechanism</p>
                  <p>• Maintains history of last 50 detected anomalies</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
