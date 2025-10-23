"use client"

import { useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"

const regions = ["North America", "Europe", "Asia Pacific", "South America", "Africa", "Middle East", "Oceania"]

export function GeographicHeatmap() {
  const [data, setData] = useState(
    regions.map((region) => ({
      region,
      anomalies: Math.floor(Math.random() * 25) + 5,
      satellites: Math.floor(Math.random() * 500) + 200,
      coverage: Math.floor(Math.random() * 30) + 70,
    })),
  )

  useEffect(() => {
    const interval = setInterval(() => {
      setData((prevData) =>
        prevData.map((item) => ({
          ...item,
          anomalies: Math.max(0, item.anomalies + Math.floor(Math.random() * 5) - 2),
          satellites: Math.max(100, item.satellites + Math.floor(Math.random() * 10) - 5),
          coverage: Math.max(60, Math.min(100, item.coverage + Math.floor(Math.random() * 6) - 3)),
        })),
      )
    }, 6000)

    return () => clearInterval(interval)
  }, [])

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-cyan-400 flex items-center justify-between">
          Geographic Distribution
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-slate-400">Live</span>
          </div>
        </CardTitle>
        <CardDescription className="text-slate-400">
          Anomaly distribution and satellite coverage by geographic region
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            anomalies: {
              label: "Anomalies",
              color: "#ef4444",
            },
            coverage: {
              label: "Coverage %",
              color: "#06b6d4",
            },
          }}
          className="h-[300px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="region" stroke="#64748b" fontSize={12} angle={-45} textAnchor="end" height={80} />
              <YAxis stroke="#64748b" fontSize={12} />
              <ChartTooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="bg-slate-800 border border-slate-600 rounded-lg p-3">
                        <p className="text-slate-200 font-medium mb-2">{label}</p>
                        <p className="text-red-400 text-sm">Anomalies: {data.anomalies}</p>
                        <p className="text-cyan-400 text-sm">Coverage: {data.coverage}%</p>
                        <p className="text-slate-400 text-sm">Satellites: {data.satellites}</p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar dataKey="anomalies" fill="var(--color-anomalies)" name="Anomalies" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <div className="mt-4 grid grid-cols-1 gap-2">
          {data.slice(0, 4).map((item) => (
            <div key={item.region} className="flex items-center justify-between text-sm">
              <span className="text-slate-300">{item.region}</span>
              <div className="flex items-center gap-4">
                <span className="text-red-400">{item.anomalies} anomalies</span>
                <span className="text-cyan-400">{item.coverage}% coverage</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
