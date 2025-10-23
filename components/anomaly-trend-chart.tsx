"use client"

import { useEffect, useState } from "react"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface TrendData {
  time: string
  hour: number
  anomalies: number
  critical: number
  warnings: number
  resolved: number
}

export function AnomalyTrendChart() {
  const [data, setData] = useState<TrendData[]>([])
  const [isLive, setIsLive] = useState(false)

  useEffect(() => {
    // Real-time data fetching will be implemented here
    // For now, show empty state
  }, [isLive])

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-cyan-400 flex items-center justify-between">
          Anomaly Trends (24h)
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isLive ? "bg-green-400 animate-pulse" : "bg-slate-600"}`}></div>
            <span className="text-xs text-slate-400">{isLive ? "Live" : "Offline"}</span>
          </div>
        </CardTitle>
        <CardDescription className="text-slate-400">
          Real-time anomaly detection trends over the last 24 hours
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-center">
              <div className="text-slate-400 mb-2">📊</div>
              <h3 className="text-slate-200 font-medium mb-2">No Trend Data Available</h3>
              <p className="text-sm text-slate-400">Waiting for anomaly detection data...</p>
            </div>
          </div>
        ) : (
          <ChartContainer
            config={{
              anomalies: {
                label: "Total Anomalies",
                color: "#06b6d4",
              },
              critical: {
                label: "Critical",
                color: "#ef4444",
              },
              warnings: {
                label: "Warnings",
                color: "#f59e0b",
              },
              resolved: {
                label: "Resolved",
                color: "#10b981",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="hour" stroke="#64748b" fontSize={12} tickFormatter={(value) => `${value}:00`} />
                <YAxis stroke="#64748b" fontSize={12} />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #475569",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="anomalies"
                  stroke="var(--color-anomalies)"
                  strokeWidth={2}
                  dot={{ fill: "var(--color-anomalies)", strokeWidth: 2, r: 4 }}
                  name="Total Anomalies"
                />
                <Line
                  type="monotone"
                  dataKey="critical"
                  stroke="var(--color-critical)"
                  strokeWidth={2}
                  dot={{ fill: "var(--color-critical)", strokeWidth: 2, r: 4 }}
                  name="Critical"
                />
                <Line
                  type="monotone"
                  dataKey="warnings"
                  stroke="var(--color-warnings)"
                  strokeWidth={2}
                  dot={{ fill: "var(--color-warnings)", strokeWidth: 2, r: 4 }}
                  name="Warnings"
                />
                <Line
                  type="monotone"
                  dataKey="resolved"
                  stroke="var(--color-resolved)"
                  strokeWidth={2}
                  dot={{ fill: "var(--color-resolved)", strokeWidth: 2, r: 4 }}
                  name="Resolved"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
