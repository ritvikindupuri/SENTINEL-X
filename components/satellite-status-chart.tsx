"use client"

import { useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const satelliteTypes = ["Communication", "Weather", "Navigation", "Earth Observation", "Scientific", "Military"]

export function SatelliteStatusChart() {
  const [data, setData] = useState(
    satelliteTypes.map((type) => ({
      type,
      operational: Math.floor(Math.random() * 200) + 100,
      maintenance: Math.floor(Math.random() * 20) + 5,
      anomalous: Math.floor(Math.random() * 15) + 2,
    })),
  )

  useEffect(() => {
    const interval = setInterval(() => {
      setData((prevData) =>
        prevData.map((item) => ({
          ...item,
          operational: Math.max(50, item.operational + Math.floor(Math.random() * 6) - 3),
          maintenance: Math.max(0, item.maintenance + Math.floor(Math.random() * 4) - 2),
          anomalous: Math.max(0, item.anomalous + Math.floor(Math.random() * 3) - 1),
        })),
      )
    }, 7000)

    return () => clearInterval(interval)
  }, [])

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-cyan-400 flex items-center justify-between">
          Satellite Status by Type
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-slate-400">Live</span>
          </div>
        </CardTitle>
        <CardDescription className="text-slate-400">
          Current operational status across different satellite categories
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            operational: {
              label: "Operational",
              color: "#10b981",
            },
            maintenance: {
              label: "Maintenance",
              color: "#f59e0b",
            },
            anomalous: {
              label: "Anomalous",
              color: "#ef4444",
            },
          }}
          className="h-[300px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="type" stroke="#64748b" fontSize={12} angle={-45} textAnchor="end" height={80} />
              <YAxis stroke="#64748b" fontSize={12} />
              <ChartTooltip
                content={<ChartTooltipContent />}
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #475569",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="operational" stackId="a" fill="var(--color-operational)" name="Operational" />
              <Bar dataKey="maintenance" stackId="a" fill="var(--color-maintenance)" name="Maintenance" />
              <Bar dataKey="anomalous" stackId="a" fill="var(--color-anomalous)" name="Anomalous" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
