"use client"

import { CesiumGlobe } from "@/components/cesium-globe"
import { Sidebar } from "@/components/sidebar"
import { useEffect, useState } from "react"
import { realTimeInference } from "@/lib/real-time-inference"
import { MITREMapper } from "@/lib/mitre-mapping"

interface SatelliteAnomalyData {
  totalAlerts: number
  fileAlerts: number
  userAlerts: number
  hostAlerts: number
  networkAlerts: number
  recentEvents: Array<{
    satelliteId: string
    anomalyType: string
    severity: string
    location: string
    timestamp: string
    coordinates: { lat: number; lng: number; alt: number }
    country: string
  }>
  mlModelStatus: string
  spaceTrackStatus: string
  lastUpdate: string
}

export default function Dashboard() {
  const [anomalyData, setAnomalyData] = useState<SatelliteAnomalyData>({
    totalAlerts: 0,
    fileAlerts: 0,
    userAlerts: 0,
    hostAlerts: 0,
    networkAlerts: 0,
    recentEvents: [],
    mlModelStatus: "initializing",
    spaceTrackStatus: "connecting",
    lastUpdate: new Date().toISOString(),
  })

  useEffect(() => {
    realTimeInference.startRealTimeInference();

    const handleNewAnomaly = (anomaly: any) => {
      setAnomalyData((prevData) => {
        const newRecentEvents = [
          {
            satelliteId: `SAT-${String(prevData.recentEvents.length + 1).padStart(4, "0")}`,
            anomalyType: anomaly.anomalyResult.anomalyType,
            severity: anomaly.anomalyResult.severity,
            location: `${anomaly.location.latitude.toFixed(2)}°, ${anomaly.location.longitude.toFixed(2)}°`,
            timestamp: new Date(anomaly.timestamp).toISOString().slice(0, 19).replace("T", " "),
            coordinates: {
              lat: anomaly.location.latitude,
              lng: anomaly.location.longitude,
              alt: anomaly.location.altitude,
            },
            country: getCountryFromCoordinates(anomaly.location.latitude, anomaly.location.longitude),
          },
          ...prevData.recentEvents,
        ];

        return {
          ...prevData,
          totalAlerts: prevData.totalAlerts + 1,
          recentEvents: newRecentEvents,
          lastUpdate: new Date().toISOString(),
        };
      });
    };

    realTimeInference.onNewAnomaly(handleNewAnomaly);

    return () => {
      realTimeInference.stopRealTimeInference();
    };
  }, []);

  const getCountryFromCoordinates = (lat: number, lng: number): string => {
    if (lat > 45 && lng > -125 && lng < -60) return "United States"
    if (lat > 49 && lng > -10 && lng < 30) return "United Kingdom"
    if (lat > 41 && lng > -5 && lng < 10) return "France"
    if (lat > 47 && lng > 5 && lng < 15) return "Germany"
    return "International"
  }

  return (
    <div className="h-screen bg-[#1a1d2e] text-white flex overflow-hidden">
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-red-600 text-white text-center py-2 text-sm font-medium">
          SENTINEL-X Active Monitoring • Space-Track Integration Active • Python ML Models Online
        </div>

        {/* Content Grid */}
        <div className="flex-1 overflow-hidden p-6">
          <div className="grid grid-cols-[320px_1fr_320px] gap-6 h-full">
            {/* Left Column - Alerts & MITRE Mapping */}
            <div className="flex flex-col gap-6 overflow-y-auto">
              <div className="bg-[#252836] rounded-lg p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <span className="text-cyan-400">🎯</span>
                  MITRE ATT&CK Mapping
                </h3>
                <div className="space-y-3">
                  {anomalyData.recentEvents.slice(0, 3).map((event, idx) => {
                    const mitre = MITREMapper.mapAnomalyToMITRE(event.anomalyType, event.severity)
                    return (
                      <div key={idx} className="bg-[#1a1d2e] rounded p-3 border border-gray-700">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-mono text-cyan-400">{mitre?.mitreId || "N/A"}</span>
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              event.severity === "critical"
                                ? "bg-red-500/20 text-red-400"
                                : event.severity === "high"
                                  ? "bg-orange-500/20 text-orange-400"
                                  : "bg-yellow-500/20 text-yellow-400"
                            }`}
                          >
                            {event.severity.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-sm text-white font-medium mb-1">{mitre?.technique || "Unknown"}</div>
                        <div className="text-xs text-gray-400">{mitre?.tactic || "N/A"}</div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Alerts Summary */}
              <div className="bg-[#252836] rounded-lg p-6">
                <h3 className="text-white font-semibold mb-4">Satellite Alerts</h3>
                <div className="flex items-center justify-center mb-6">
                  <div className="relative w-32 h-32">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="64" cy="64" r="56" stroke="#374151" strokeWidth="8" fill="none" />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="#ef4444"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${(anomalyData.totalAlerts / 100) * 351.86} 351.86`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="text-xs text-gray-400">Total Alerts</div>
                      <div className="text-3xl font-bold text-white">{anomalyData.totalAlerts}</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-cyan-500/20 rounded-full flex items-center justify-center">
                        <span className="text-xs">📡</span>
                      </div>
                      <span className="text-gray-300">Communication</span>
                    </div>
                    <span className="text-white font-semibold">{anomalyData.fileAlerts}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-orange-500/20 rounded-full flex items-center justify-center">
                        <span className="text-xs">⚡</span>
                      </div>
                      <span className="text-gray-300">Power</span>
                    </div>
                    <span className="text-white font-semibold">{anomalyData.userAlerts}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center">
                        <span className="text-xs">🛰️</span>
                      </div>
                      <span className="text-gray-300">Orbital</span>
                    </div>
                    <span className="text-white font-semibold">{anomalyData.hostAlerts}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
                        <span className="text-xs">📊</span>
                      </div>
                      <span className="text-gray-300">Sensor</span>
                    </div>
                    <span className="text-white font-semibold">{anomalyData.networkAlerts}</span>
                  </div>
                </div>
              </div>

              {/* Alerts Timeline */}
              <div className="bg-[#252836] rounded-lg p-6">
                <h3 className="text-white font-semibold mb-4">Alerts Timeline</h3>
                <div className="h-48 flex items-end justify-between gap-1">
                  {[...Array(20)].map((_, i) => {
                    const height = Math.random() * 80 + 20
                    return (
                      <div key={i} className="flex-1 flex flex-col justify-end">
                        <div className="bg-cyan-500 rounded-t" style={{ height: `${height}%` }}></div>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-4 flex justify-between text-xs text-gray-400">
                  <span>00:00</span>
                  <span>12:00</span>
                  <span>24:00</span>
                </div>
              </div>
            </div>

            {/* Center Column - Cesium Globe */}
            <div className="flex flex-col gap-4">
              <div className="flex-1 flex items-center justify-center">
                <CesiumGlobe anomalies={anomalyData.recentEvents} />
              </div>

              <div className="bg-[#252836] rounded-lg p-4 max-h-64 overflow-y-auto">
                <h3 className="text-white font-semibold mb-3 flex items-center justify-between">
                  <span>Recent Satellite Events</span>
                  <span className="text-xs text-gray-400">Last updated: {new Date().toLocaleTimeString()}</span>
                </h3>
                <div className="space-y-2">
                  {anomalyData.recentEvents.slice(0, 5).map((event, idx) => (
                    <div
                      key={idx}
                      className="bg-[#1a1d2e] rounded p-3 border border-gray-700 hover:border-cyan-500 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-mono text-cyan-400">{event.satelliteId}</span>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            event.severity === "critical"
                              ? "bg-red-500/20 text-red-400"
                              : event.severity === "high"
                                ? "bg-orange-500/20 text-orange-400"
                                : "bg-yellow-500/20 text-yellow-400"
                          }`}
                        >
                          {event.severity}
                        </span>
                      </div>
                      <div className="text-sm text-white mb-1">{event.anomalyType}</div>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>📍 {event.location}</span>
                        <span>{event.timestamp}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - System Status & Metrics */}
            <div className="flex flex-col gap-6 overflow-y-auto">
              {/* System Status */}
              <div className="bg-[#252836] rounded-lg p-6">
                <h3 className="text-white font-semibold mb-4">System Status</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">ML Model</span>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          anomalyData.mlModelStatus === "online"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-yellow-500/20 text-yellow-400"
                        }`}
                      >
                        {anomalyData.mlModelStatus.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">TensorFlow + scikit-learn</div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Space-Track API</span>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          anomalyData.spaceTrackStatus === "active"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-yellow-500/20 text-yellow-400"
                        }`}
                      >
                        {anomalyData.spaceTrackStatus.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">Simulated ISS data</div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">SGP4 Orbital Mechanics</span>
                      <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400">ACTIVE</span>
                    </div>
                    <div className="text-xs text-gray-500">Cesium.js 3D visualization</div>
                  </div>
                </div>
              </div>

              {/* Detection Metrics */}
              <div className="bg-[#252836] rounded-lg p-6">
                <h3 className="text-white font-semibold mb-4">Detection Metrics</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="relative w-20 h-20">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="40" cy="40" r="36" stroke="#374151" strokeWidth="4" fill="none" />
                        <circle
                          cx="40"
                          cy="40"
                          r="36"
                          stroke="#06b6d4"
                          strokeWidth="4"
                          fill="none"
                          strokeDasharray="70 226"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold text-white">{anomalyData.fileAlerts}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-white font-medium">Today</div>
                      <div className="text-xs text-gray-400">Anomalies detected</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="relative w-24 h-24">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="48" cy="48" r="44" stroke="#374151" strokeWidth="4" fill="none" />
                        <circle
                          cx="48"
                          cy="48"
                          r="44"
                          stroke="#06b6d4"
                          strokeWidth="4"
                          fill="none"
                          strokeDasharray="100 276"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-3xl font-bold text-white">
                          {anomalyData.userAlerts + anomalyData.fileAlerts}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-white font-medium">This Week</div>
                      <div className="text-xs text-gray-400">Total detections</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="relative w-28 h-28">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="56" cy="56" r="52" stroke="#374151" strokeWidth="4" fill="none" />
                        <circle
                          cx="56"
                          cy="56"
                          r="52"
                          stroke="#06b6d4"
                          strokeWidth="4"
                          fill="none"
                          strokeDasharray="150 326"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-4xl font-bold text-white">{anomalyData.totalAlerts}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-white font-medium">This Month</div>
                      <div className="text-xs text-gray-400">All anomalies</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* MITRE Tactics Distribution */}
              <div className="bg-[#252836] rounded-lg p-6">
                <h3 className="text-white font-semibold mb-4">MITRE Tactics</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-300">Impact</span>
                      <span className="text-white font-semibold">45%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-red-500 h-2 rounded-full" style={{ width: "45%" }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-300">Defense Evasion</span>
                      <span className="text-white font-semibold">30%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-orange-500 h-2 rounded-full" style={{ width: "30%" }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-300">Initial Access</span>
                      <span className="text-white font-semibold">25%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-cyan-500 h-2 rounded-full" style={{ width: "25%" }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
