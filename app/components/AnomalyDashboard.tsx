
"use client"

import { ShieldAlert } from "lucide-react"

interface AnomalyDashboardProps {
  anomalyCount: number;
}

export default function AnomalyDashboard({ anomalyCount }: AnomalyDashboardProps) {
  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h2 className="text-lg font-semibold mb-2 flex items-center">
        <ShieldAlert className="mr-2" />
        Anomaly Count
      </h2>
      <p className="text-4xl font-bold">{anomalyCount}</p>
      <p className="text-sm text-gray-400">Anomalies detected in the last hour</p>
    </div>
  )
}
