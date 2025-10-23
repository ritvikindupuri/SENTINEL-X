"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface MetricData {
  activeSatellites: number
  anomaliesDetected: number
  highPriority: number
  systemStatus: "operational" | "warning" | "critical"
  lastUpdate: string
}

export function RealTimeMetrics() {
  const [metrics, setMetrics] = useState<MetricData>({
    activeSatellites: 0,
    anomaliesDetected: 0,
    highPriority: 0,
    systemStatus: "operational",
    lastUpdate: new Date().toISOString(),
  })

  const [isLive, setIsLive] = useState(false)

  useEffect(() => {
    // Real-time metrics fetching will be implemented here
    // For now, show initial state
  }, [isLive])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational":
        return "text-cyber-green"
      case "warning":
        return "text-cyber-orange"
      case "critical":
        return "text-cyber-red"
      default:
        return "cyber-text-muted"
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
      <Card className="cyber-card relative overflow-hidden">
        <div
          className={`absolute top-0 right-0 w-2 h-2 rounded-full m-3 ${isLive ? "bg-cyber-green cyber-pulse" : "bg-cyber-text-muted"}`}
        ></div>
        <CardHeader className="pb-2">
          <CardTitle className="text-primary text-sm font-medium flex items-center justify-between">
            Active Satellites
            <Badge variant="outline" className="text-xs border-cyber-border cyber-text-secondary">
              {isLive ? "LIVE" : "OFFLINE"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold cyber-text-primary">{metrics.activeSatellites.toLocaleString()}</div>
          <p className="text-xs cyber-text-muted mt-1">Updated {new Date(metrics.lastUpdate).toLocaleTimeString()}</p>
        </CardContent>
      </Card>

      <Card className="cyber-card relative overflow-hidden">
        <div
          className={`absolute top-0 right-0 w-2 h-2 rounded-full m-3 ${metrics.anomaliesDetected > 0 ? "bg-cyber-red cyber-pulse" : "bg-cyber-text-muted"}`}
        ></div>
        <CardHeader className="pb-2">
          <CardTitle className="text-cyber-red text-sm font-medium flex items-center justify-between">
            Anomalies Detected
            <Badge variant="outline" className="text-xs border-cyber-border cyber-text-secondary">
              {isLive ? "LIVE" : "OFFLINE"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold cyber-text-primary">{metrics.anomaliesDetected}</div>
          <p className="text-xs cyber-text-muted mt-1">
            {metrics.anomaliesDetected > 25 ? "Above threshold" : "Within normal range"}
          </p>
        </CardContent>
      </Card>

      <Card className="cyber-card relative overflow-hidden">
        <div
          className={`absolute top-0 right-0 w-2 h-2 rounded-full m-3 ${metrics.highPriority > 0 ? "bg-cyber-orange cyber-pulse" : "bg-cyber-text-muted"}`}
        ></div>
        <CardHeader className="pb-2">
          <CardTitle className="text-cyber-orange text-sm font-medium flex items-center justify-between">
            High Priority
            <Badge variant="outline" className="text-xs border-cyber-border cyber-text-secondary">
              {isLive ? "LIVE" : "OFFLINE"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold cyber-text-primary">{metrics.highPriority}</div>
          <p className="text-xs cyber-text-muted mt-1">
            {metrics.highPriority > 10 ? "Requires immediate attention" : "Manageable levels"}
          </p>
        </CardContent>
      </Card>

      <Card className="cyber-card relative overflow-hidden">
        <div
          className={`absolute top-0 right-0 w-2 h-2 rounded-full m-3 ${
            metrics.systemStatus === "operational"
              ? "bg-cyber-green"
              : metrics.systemStatus === "warning"
                ? "bg-cyber-orange"
                : "bg-cyber-red"
          } ${isLive ? "cyber-pulse" : ""}`}
        ></div>
        <CardHeader className="pb-2">
          <CardTitle className="text-cyber-green text-sm font-medium flex items-center justify-between">
            System Status
            <Badge variant="outline" className="text-xs border-cyber-border cyber-text-secondary">
              {isLive ? "LIVE" : "OFFLINE"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold capitalize ${getStatusColor(metrics.systemStatus)}`}>
            {metrics.systemStatus}
          </div>
          <p className="text-xs cyber-text-muted mt-1">All monitoring systems active</p>
        </CardContent>
      </Card>
    </div>
  )
}
