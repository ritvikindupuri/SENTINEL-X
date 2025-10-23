"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface PredictiveAlert {
  id: string
  satellite: string
  alertType: "maintenance" | "failure" | "degradation"
  probability: number
  timeToEvent: number // hours
  recommendedAction: string
  severity: "low" | "medium" | "high" | "critical"
  mlConfidence: number
}

export function MLPredictionAlerts() {
  const [alerts, setAlerts] = useState<PredictiveAlert[]>([])

  useEffect(() => {
    const generateAlert = (): PredictiveAlert => {
      const satellites = ["NOAA-18", "Landsat-8", "Terra", "Aqua", "MODIS", "Sentinel-1A"]
      const alertTypes: ("maintenance" | "failure" | "degradation")[] = ["maintenance", "failure", "degradation"]
      const actions = [
        "Schedule preventive maintenance",
        "Increase monitoring frequency",
        "Prepare backup systems",
        "Contact ground control",
        "Initiate safe mode protocol",
        "Review telemetry data",
      ]

      const probability = Math.random() * 40 + 60 // 60-100%
      const timeToEvent = Math.random() * 168 + 12 // 12-180 hours

      return {
        id: Math.random().toString(36).substr(2, 9),
        satellite: satellites[Math.floor(Math.random() * satellites.length)],
        alertType: alertTypes[Math.floor(Math.random() * alertTypes.length)],
        probability: Math.round(probability),
        timeToEvent: Math.round(timeToEvent),
        recommendedAction: actions[Math.floor(Math.random() * actions.length)],
        severity: probability > 90 ? "critical" : probability > 80 ? "high" : probability > 70 ? "medium" : "low",
        mlConfidence: Math.round((Math.random() * 20 + 80) * 10) / 10,
      }
    }

    // Initialize with some alerts
    const initialAlerts = Array.from({ length: 3 }, generateAlert)
    setAlerts(initialAlerts)

    const interval = setInterval(() => {
      if (Math.random() > 0.8) {
        // 20% chance of new alert
        setAlerts((prev) => {
          const newAlert = generateAlert()
          return [newAlert, ...prev.slice(0, 4)] // Keep last 5 alerts
        })
      }
    }, 8000)

    return () => clearInterval(interval)
  }, [])

  const getAlertColor = (alertType: string) => {
    switch (alertType) {
      case "failure":
        return "border-red-500 bg-red-500/10"
      case "degradation":
        return "border-yellow-500 bg-yellow-500/10"
      case "maintenance":
        return "border-blue-500 bg-blue-500/10"
      default:
        return "border-slate-500 bg-slate-500/10"
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
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-cyan-400 flex items-center justify-between">
          Predictive Alerts
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-slate-400">ML Powered</span>
          </div>
        </CardTitle>
        <CardDescription className="text-slate-400">
          Machine learning predictions for potential satellite issues
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <div className="text-green-400 mb-2">✓</div>
              No predictive alerts at this time
            </div>
          ) : (
            alerts.map((alert) => (
              <Alert key={alert.id} className={`${getAlertColor(alert.alertType)} border`}>
                <AlertDescription>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-slate-200 font-medium">{alert.satellite}</h4>
                      <p className="text-sm text-slate-400 capitalize">
                        Predicted {alert.alertType} in {alert.timeToEvent}h
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getSeverityBadgeVariant(alert.severity)}>{alert.severity.toUpperCase()}</Badge>
                      <span className="text-xs text-slate-400">{alert.probability}%</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <span className="text-xs text-slate-400">ML Confidence</span>
                      <div className="text-sm font-medium text-cyan-400">{alert.mlConfidence}%</div>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400">Recommended Action</span>
                      <div className="text-sm font-medium text-slate-200">{alert.recommendedAction}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="text-xs bg-transparent">
                      View Details
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs bg-transparent">
                      Create Ticket
                    </Button>
                    <Button size="sm" variant="ghost" className="text-xs text-slate-400">
                      Dismiss
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
