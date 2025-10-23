"use client"

import { useEffect, useState } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"

const COLORS = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#f59e0b",
  low: "#10b981",
}

export function SeverityDistributionChart() {
  const [data, setData] = useState([
    { name: "Critical", value: 3, color: COLORS.critical },
    { name: "High", value: 7, color: COLORS.high },
    { name: "Medium", value: 12, color: COLORS.medium },
    { name: "Low", value: 8, color: COLORS.low },
  ])

  useEffect(() => {
    const interval = setInterval(() => {
      setData((prevData) =>
        prevData.map((item) => ({
          ...item,
          value: Math.max(1, item.value + Math.floor(Math.random() * 3) - 1),
        })),
      )
    }, 8000)

    return () => clearInterval(interval)
  }, [])

  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-cyan-400 flex items-center justify-between">
          Severity Distribution
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-slate-400">Live</span>
          </div>
        </CardTitle>
        <CardDescription className="text-slate-400">Current anomaly distribution by severity level</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            critical: { label: "Critical", color: COLORS.critical },
            high: { label: "High", color: COLORS.high },
            medium: { label: "Medium", color: COLORS.medium },
            low: { label: "Low", color: COLORS.low },
          }}
          className="h-[300px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value">
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <ChartTooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    const percentage = ((data.value / total) * 100).toFixed(1)
                    return (
                      <div className="bg-slate-800 border border-slate-600 rounded-lg p-3">
                        <p className="text-slate-200 font-medium">{data.name}</p>
                        <p className="text-slate-400 text-sm">
                          {data.value} anomalies ({percentage}%)
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value, entry) => (
                  <span style={{ color: entry.color }} className="text-sm">
                    {value}: {data.find((d) => d.name === value)?.value}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>

        <div className="mt-4 grid grid-cols-2 gap-4">
          {data.map((item) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-sm text-slate-300">{item.name}</span>
              </div>
              <span className="text-sm font-medium text-slate-200">{item.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
