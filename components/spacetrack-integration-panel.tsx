"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Satellite, Activity, RefreshCw } from "lucide-react"
import { fetchSatellitePositions, type SatelliteData } from "@/lib/spacetrack-api"

export function SpaceTrackIntegrationPanel() {
  const [satellites, setSatellites] = useState<SatelliteData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchSpaceTrackData = async () => {
    setIsLoading(true)
    try {
      const satelliteData = await fetchSatellitePositions()
      setSatellites(satelliteData)
    } catch (error) {
      console.error("Failed to fetch Space-Track data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSpaceTrackData()

    const interval = setInterval(fetchSpaceTrackData, 30000)
    return () => clearInterval(interval)
  }, [])

  const operationalCount = satellites.filter((s) => s.status === "operational").length
  const anomalousCount = satellites.filter((s) => s.status === "anomalous").length

  return (
    <Card className="bg-slate-900/50 border-slate-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Satellite className="h-5 w-5 text-cyan-400" />
          <h3 className="text-lg font-semibold text-white">Space-Track API Integration</h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
            <Activity className="h-3 w-3 mr-1" />
            Live
          </Badge>
          <Button
            onClick={fetchSpaceTrackData}
            disabled={isLoading}
            size="sm"
            variant="outline"
            className="bg-transparent"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      <p className="text-sm text-slate-400 mb-4">Real-time data from Space-Track.org satellite tracking system</p>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="text-2xl font-bold text-white">{satellites.length}</div>
          <div className="text-xs text-slate-400">Total Satellites</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="text-2xl font-bold text-green-400">{operationalCount}</div>
          <div className="text-xs text-slate-400">Operational</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="text-2xl font-bold text-red-400">{anomalousCount}</div>
          <div className="text-xs text-slate-400">Anomalous</div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-slate-400">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
          Loading satellite data from Space-Track...
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {satellites.slice(0, 5).map((satellite) => (
            <div key={satellite.id} className="bg-slate-800/30 rounded p-3 flex items-center justify-between">
              <div>
                <div className="font-medium text-white text-sm">{satellite.name}</div>
                <div className="text-xs text-slate-400">
                  Alt: {satellite.altitude.toFixed(0)}km | Vel: {satellite.velocity.toFixed(1)}km/s
                </div>
              </div>
              <Badge
                variant="outline"
                className={
                  satellite.status === "operational"
                    ? "bg-green-500/10 text-green-400 border-green-500/20"
                    : "bg-red-500/10 text-red-400 border-red-500/20"
                }
              >
                {satellite.status}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
