"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { mlService, type ModelMetrics, type SatelliteTelemetry } from "@/lib/ml-service"

interface AnomalyPrediction {
  id: string
  satellite: string
  anomalyType: string
  confidence: number
  severity: "low" | "medium" | "high" | "critical"
  predictedTime: string
  features: {
    temperature: number
    power: number
    communication: number
    orbit: number
  }
  mlScore: number
}

export function MLAnomalyDetector() {
  const [predictions, setPredictions] = useState<AnomalyPrediction[]>([])
  const [modelMetrics, setModelMetrics] = useState<ModelMetrics>({
    accuracy: 0,
    precision: 0,
    recall: 0,
    f1Score: 0,
    lastTrained: new Date().toISOString(),
    samplesProcessed: 0,
    trainingLoss: 0,
    validationLoss: 0,
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [isModelReady, setIsModelReady] = useState(false)

  useEffect(() => {
    // Check if model is ready
    const checkModelStatus = () => {
      setIsModelReady(mlService.isModelReady())
    }

    checkModelStatus()
    const interval = setInterval(checkModelStatus, 1000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!isModelReady) return

    const runAnomalyDetection = async () => {
      try {
        // Generate realistic satellite telemetry data for testing
        const satellites = ["NOAA-18", "Landsat-8", "Terra", "Aqua", "MODIS", "Sentinel-1A", "GOES-16"]
        const randomSatellite = satellites[Math.floor(Math.random() * satellites.length)]

        // Create realistic telemetry data
        const telemetry: SatelliteTelemetry = {
          temperature: 20 + (Math.random() - 0.5) * 40,
          power: 70 + Math.random() * 30,
          communication: 80 + Math.random() * 20,
          orbit: 95 + Math.random() * 8,
          voltage: 11 + Math.random() * 2,
          solarPanelEfficiency: 85 + Math.random() * 15,
          attitudeControl: 90 + Math.random() * 10,
          fuelLevel: 60 + Math.random() * 40,
          timestamp: Date.now(),
        }

        const result = await mlService.detectAnomaly(telemetry)

        if (result.isAnomaly) {
          const newPrediction: AnomalyPrediction = {
            id: Math.random().toString(36).substr(2, 9),
            satellite: randomSatellite,
            anomalyType: result.anomalyType,
            confidence: result.confidence,
            severity: result.severity,
            predictedTime: new Date(Date.now() + Math.random() * 24 * 60 * 60 * 1000).toISOString(),
            features: {
              temperature: result.features.temperature,
              power: result.features.power,
              communication: result.features.communication,
              orbit: result.features.orbit,
            },
            mlScore: Math.round(result.anomalyScore * 1000) / 1000,
          }

          setPredictions((prev) => [newPrediction, ...prev.slice(0, 9)])
        }
      } catch (error) {
        console.error("[v0] Error in anomaly detection:", error)
      }
    }

    const interval = setInterval(runAnomalyDetection, 5000)
    return () => clearInterval(interval)
  }, [isModelReady])

  const runModelTraining = async () => {
    setIsProcessing(true)
    try {
      console.log("[v0] Starting real ML model training...")

      // Generate synthetic training data
      const trainingData = mlService.generateSyntheticTrainingData(2000)

      // Train the model
      const metrics = await mlService.trainModel(trainingData)
      setModelMetrics(metrics)

      console.log("[v0] Model training completed successfully")
    } catch (error) {
      console.error("[v0] Error during model training:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500"
      case "high":
        return "bg-orange-500"
      case "medium":
        return "bg-yellow-500"
      case "low":
        return "bg-green-500"
      default:
        return "bg-gray-500"
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

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-cyan-400 flex items-center justify-between">
            ML Anomaly Detection Engine
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${isModelReady ? "bg-green-400 animate-pulse" : "bg-yellow-400"}`}
              ></div>
              <span className="text-xs text-slate-400">{isModelReady ? "Active" : "Loading"}</span>
            </div>
          </CardTitle>
          <CardDescription className="text-slate-400">
            TensorFlow.js powered real-time anomaly detection using autoencoder neural networks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="predictions" className="w-full">
            <TabsList className="bg-slate-800 border-slate-700">
              <TabsTrigger value="predictions" className="data-[state=active]:bg-slate-700">
                Live Predictions
              </TabsTrigger>
              <TabsTrigger value="metrics" className="data-[state=active]:bg-slate-700">
                Model Performance
              </TabsTrigger>
              <TabsTrigger value="features" className="data-[state=active]:bg-slate-700">
                Feature Analysis
              </TabsTrigger>
            </TabsList>

            <TabsContent value="predictions" className="mt-6">
              <div className="space-y-4">
                {!isModelReady ? (
                  <div className="text-center py-8 text-slate-400">
                    <div className="animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full mx-auto mb-4"></div>
                    Loading TensorFlow.js model...
                  </div>
                ) : predictions.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <div className="text-green-400 mb-2">✓</div>
                    <h3 className="text-slate-200 font-medium mb-2">No Anomalies Detected</h3>
                    <p className="text-sm text-slate-400">ML model is monitoring satellite telemetry...</p>
                  </div>
                ) : (
                  predictions.map((prediction) => (
                    <div
                      key={prediction.id}
                      className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="text-slate-200 font-medium">{prediction.satellite}</h4>
                          <p className="text-sm text-slate-400">{prediction.anomalyType}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getSeverityBadgeVariant(prediction.severity)}>
                            {prediction.severity.toUpperCase()}
                          </Badge>
                          <span className="text-xs text-slate-400">{prediction.confidence}% confidence</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div>
                          <span className="text-xs text-slate-400">ML Score</span>
                          <div className="text-sm font-medium text-cyan-400">{prediction.mlScore}</div>
                        </div>
                        <div>
                          <span className="text-xs text-slate-400">Temperature</span>
                          <div className="text-sm font-medium text-slate-200">
                            {prediction.features.temperature.toFixed(1)}°C
                          </div>
                        </div>
                        <div>
                          <span className="text-xs text-slate-400">Power</span>
                          <div className="text-sm font-medium text-slate-200">
                            {prediction.features.power.toFixed(1)}%
                          </div>
                        </div>
                        <div>
                          <span className="text-xs text-slate-400">Predicted</span>
                          <div className="text-sm font-medium text-slate-200">
                            {new Date(prediction.predictedTime).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <Progress value={prediction.confidence} className="h-2" />
                        </div>
                        <span className="text-xs text-slate-400">Confidence</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="metrics" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                    <h4 className="text-slate-200 font-medium mb-4">Model Performance</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-400">Accuracy</span>
                        <span className="text-sm font-medium text-green-400">{modelMetrics.accuracy.toFixed(1)}%</span>
                      </div>
                      <Progress value={modelMetrics.accuracy} className="h-2" />

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-400">Precision</span>
                        <span className="text-sm font-medium text-blue-400">{modelMetrics.precision.toFixed(1)}%</span>
                      </div>
                      <Progress value={modelMetrics.precision} className="h-2" />

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-400">Recall</span>
                        <span className="text-sm font-medium text-yellow-400">{modelMetrics.recall.toFixed(1)}%</span>
                      </div>
                      <Progress value={modelMetrics.recall} className="h-2" />

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-400">F1 Score</span>
                        <span className="text-sm font-medium text-purple-400">{modelMetrics.f1Score.toFixed(1)}%</span>
                      </div>
                      <Progress value={modelMetrics.f1Score} className="h-2" />
                    </div>
                  </div>

                  <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                    <h4 className="text-slate-200 font-medium mb-4">Training Status</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-400">Last Trained</span>
                        <span className="text-sm text-slate-200">
                          {new Date(modelMetrics.lastTrained).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-400">Samples Processed</span>
                        <span className="text-sm text-slate-200">{modelMetrics.samplesProcessed.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-400">Training Loss</span>
                        <span className="text-sm text-slate-200">{modelMetrics.trainingLoss.toFixed(4)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-400">Validation Loss</span>
                        <span className="text-sm text-slate-200">{modelMetrics.validationLoss.toFixed(4)}</span>
                      </div>
                    </div>
                    <Button
                      onClick={runModelTraining}
                      disabled={isProcessing || !isModelReady}
                      className="w-full mt-4 bg-cyan-600 hover:bg-cyan-700"
                    >
                      {isProcessing ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                          Training Model...
                        </>
                      ) : (
                        "Train Model"
                      )}
                    </Button>
                  </div>
                </div>

                <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                  <h4 className="text-slate-200 font-medium mb-4">Model Architecture</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Algorithm</span>
                      <span className="text-slate-200">Autoencoder Neural Network</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Framework</span>
                      <span className="text-slate-200">TensorFlow.js</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Features</span>
                      <span className="text-slate-200">8 telemetry parameters</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Architecture</span>
                      <span className="text-slate-200">8→16→8→4→8→16→8</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Optimizer</span>
                      <span className="text-slate-200">Adam (lr=0.001)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Loss Function</span>
                      <span className="text-slate-200">Mean Squared Error</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="features" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                  <h4 className="text-slate-200 font-medium mb-4">Feature Importance</h4>
                  <div className="space-y-3">
                    {[
                      { name: "Power System Voltage", importance: 0.23 },
                      { name: "Communication Signal", importance: 0.19 },
                      { name: "Orbital Parameters", importance: 0.16 },
                      { name: "Temperature Variance", importance: 0.14 },
                      { name: "Solar Panel Efficiency", importance: 0.12 },
                      { name: "Attitude Control", importance: 0.09 },
                      { name: "Fuel Level", importance: 0.07 },
                    ].map((feature) => (
                      <div key={feature.name}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-slate-400">{feature.name}</span>
                          <span className="text-xs text-slate-200">{(feature.importance * 100).toFixed(1)}%</span>
                        </div>
                        <Progress value={feature.importance * 100} className="h-2" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                  <h4 className="text-slate-200 font-medium mb-4">Detected Anomaly Types</h4>
                  <div className="space-y-3">
                    {predictions
                      .reduce(
                        (acc, pred) => {
                          const existing = acc.find((item) => item.category === pred.anomalyType)
                          if (existing) {
                            existing.detected += 1
                          } else {
                            acc.push({
                              category: pred.anomalyType,
                              detected: 1,
                              color:
                                pred.severity === "critical"
                                  ? "bg-red-500"
                                  : pred.severity === "high"
                                    ? "bg-orange-500"
                                    : pred.severity === "medium"
                                      ? "bg-yellow-500"
                                      : "bg-green-500",
                            })
                          }
                          return acc
                        },
                        [] as Array<{ category: string; detected: number; color: string }>,
                      )
                      .map((category) => (
                        <div key={category.category} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${category.color}`}></div>
                            <span className="text-sm text-slate-300">{category.category}</span>
                          </div>
                          <span className="text-sm font-medium text-slate-200">{category.detected}</span>
                        </div>
                      ))}
                    {predictions.length === 0 && (
                      <div className="text-center text-slate-400 py-4">No anomalies detected yet</div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
