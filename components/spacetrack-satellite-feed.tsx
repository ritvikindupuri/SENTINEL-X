"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Satellite } from "lucide-react"
import { fetchSatellitePositions, type SatelliteData } from "@/lib/spacetrack-api"

export function SpaceTrackSatelliteFeed() {
  const [satellites, setSatellites] = useState<SatelliteData[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchSatellitePositions()
        setSatellites(data)
      } catch (error) {
        console.error("Failed to fetch Space-Track satellite data:", error)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 15000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Card className="bg-slate-900/50 border-slate-800 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Satellite className="h-4 w-4 text-cyan-400" />
        <h3 className="text-sm font-semibold text-white">Space-Track Live Satellite Feed</h3>
        <Badge variant="outline" className="ml-auto bg-green-500/10 text-green-400 border-green-500/20 text-xs">
          Live
        </Badge>
      </div>
      <p className="text-xs text-slate-400 mb-3">Real-time satellite positions from Space-Track.org tracking systems</p>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {satellites.map((sat) => (
          <div key={sat.id} className="bg-slate-800/30 rounded p-2 text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-white">{sat.name}</span>
              <Badge
                variant="outline"
                className={
                  sat.status === "operational"
                    ? "bg-green-500/10 text-green-400 border-green-500/20"
                    : "bg-red-500/10 text-red-400 border-red-500/20"
                }
              >
                {sat.status}
              </Badge>
            </div>
            <div className="text-slate-400">
              Lat: {sat.latitude.toFixed(2)}° | Lng: {sat.longitude.toFixed(2)}° | Alt: {sat.altitude.toFixed(0)}km
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
