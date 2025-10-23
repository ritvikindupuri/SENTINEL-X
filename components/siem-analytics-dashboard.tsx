"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"

interface SecurityEvent {
  id: string
  timestamp: string
  severity: "critical" | "high" | "medium" | "low"
  category: "anomaly" | "intrusion" | "malfunction" | "communication" | "power"
  source: string
  description: string
  riskScore: number
  status: "open" | "investigating" | "resolved" | "false_positive"
  assignee?: string
  correlatedEvents: string[]
  mitreTactics: string[]
}

interface ThreatIntelligence {
  threatLevel: number
  activeCampaigns: number
  knownActors: string[]
  recentIndicators: string[]
  riskFactors: {
    name: string
    score: number
    trend: "up" | "down" | "stable"
  }[]
}

export function SIEMAnalyticsDashboard() {
  const [events, setEvents] = useState<SecurityEvent[]>([])
  const [threatIntel, setThreatIntel] = useState<ThreatIntelligence | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [severityFilter, setSeverityFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [timeRange, setTimeRange] = useState<string>("24h")

  // Generate mock SIEM data
  useEffect(() => {
    const generateSecurityEvent = (): SecurityEvent => {
      const categories = ["anomaly", "intrusion", "malfunction", "communication", "power"] as const
      const severities = ["critical", "high", "medium", "low"] as const
      const sources = [
        "NOAA-18",
        "Landsat-8",
        "Terra",
        "Aqua",
        "MODIS",
        "Sentinel-1A",
        "GOES-16",
        "Ground Station Alpha",
        "Control Center Beta",
      ]
      const descriptions = [
        "Unauthorized access attempt detected",
        "Anomalous power consumption pattern",
        "Communication protocol violation",
        "Suspicious command sequence",
        "Orbital deviation beyond threshold",
        "Temperature sensor malfunction",
        "Signal interference detected",
        "Encryption key mismatch",
        "Telemetry data corruption",
        "Ground station authentication failure",
      ]
      const mitreTactics = [
        "Initial Access",
        "Execution",
        "Persistence",
        "Defense Evasion",
        "Credential Access",
        "Discovery",
        "Collection",
        "Command and Control",
        "Impact",
      ]

      const severity = severities[Math.floor(Math.random() * severities.length)]
      const riskScore =
        severity === "critical"
          ? 90 + Math.random() * 10
          : severity === "high"
            ? 70 + Math.random() * 20
            : severity === "medium"
              ? 40 + Math.random() * 30
              : 10 + Math.random() * 30

      return {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
        severity,
        category: categories[Math.floor(Math.random() * categories.length)],
        source: sources[Math.floor(Math.random() * sources.length)],
        description: descriptions[Math.floor(Math.random() * descriptions.length)],
        riskScore: Math.round(riskScore),
        status: Math.random() > 0.7 ? "open" : Math.random() > 0.5 ? "investigating" : "resolved",
        assignee: Math.random() > 0.6 ? "Security Team" : undefined,
        correlatedEvents: Math.random() > 0.7 ? [Math.random().toString(36).substr(2, 6)] : [],
        mitreTactics: Math.random() > 0.5 ? [mitreTactics[Math.floor(Math.random() * mitreTactics.length)]] : [],
      }
    }

    const generateThreatIntel = (): ThreatIntelligence => ({
      threatLevel: Math.floor(Math.random() * 40) + 60, // 60-100
      activeCampaigns: Math.floor(Math.random() * 5) + 2,
      knownActors: ["APT-SAT-01", "Orbital Phantom", "Space Intruder", "Satellite Hunter"],
      recentIndicators: [
        "Unusual command patterns",
        "Encrypted payload anomalies",
        "Timing correlation attacks",
        "Signal jamming attempts",
      ],
      riskFactors: [
        { name: "Geopolitical Tension", score: 85, trend: "up" },
        { name: "Solar Activity", score: 72, trend: "stable" },
        { name: "Cyber Threat Level", score: 68, trend: "down" },
        { name: "System Vulnerabilities", score: 45, trend: "down" },
      ],
    })

    // Initialize data
    const initialEvents = Array.from({ length: 25 }, generateSecurityEvent)
    setEvents(initialEvents)
    setThreatIntel(generateThreatIntel())

    // Simulate real-time events
    const interval = setInterval(() => {
      if (Math.random() > 0.8) {
        const newEvent = generateSecurityEvent()
        setEvents((prev) => [newEvent, ...prev.slice(0, 49)]) // Keep last 50 events
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      searchQuery === "" ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.source.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesSeverity = severityFilter === "all" || event.severity === severityFilter
    const matchesCategory = categoryFilter === "all" || event.category === categoryFilter

    return matchesSearch && matchesSeverity && matchesCategory
  })

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-red-400"
      case "high":
        return "text-orange-400"
      case "medium":
        return "text-yellow-400"
      case "low":
        return "text-green-400"
      default:
        return "text-slate-400"
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "text-red-400"
      case "investigating":
        return "text-yellow-400"
      case "resolved":
        return "text-green-400"
      case "false_positive":
        return "text-slate-400"
      default:
        return "text-slate-400"
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return "↗️"
      case "down":
        return "↘️"
      case "stable":
        return "→"
      default:
        return "→"
    }
  }

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-cyan-400 flex items-center justify-between">
            SIEM Analytics & Threat Intelligence
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-slate-400">Active Monitoring</span>
            </div>
          </CardTitle>
          <CardDescription className="text-slate-400">
            Advanced security information and event management for satellite infrastructure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="events" className="w-full">
            <TabsList className="bg-slate-800 border-slate-700">
              <TabsTrigger value="events" className="data-[state=active]:bg-slate-700">
                Security Events ({filteredEvents.length})
              </TabsTrigger>
              <TabsTrigger value="threat-intel" className="data-[state=active]:bg-slate-700">
                Threat Intelligence
              </TabsTrigger>
              <TabsTrigger value="correlation" className="data-[state=active]:bg-slate-700">
                Event Correlation
              </TabsTrigger>
              <TabsTrigger value="forensics" className="data-[state=active]:bg-slate-700">
                Forensic Analysis
              </TabsTrigger>
            </TabsList>

            <TabsContent value="events" className="mt-6">
              <div className="space-y-4">
                {/* Search and Filters */}
                <div className="flex flex-wrap gap-4 p-4 bg-slate-800 border border-slate-700 rounded-lg">
                  <div className="flex-1 min-w-[200px]">
                    <Input
                      placeholder="Search events, sources, descriptions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-slate-700 border-slate-600"
                    />
                  </div>
                  <Select value={severityFilter} onValueChange={setSeverityFilter}>
                    <SelectTrigger className="w-[140px] bg-slate-700 border-slate-600">
                      <SelectValue placeholder="Severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Severities</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[140px] bg-slate-700 border-slate-600">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="anomaly">Anomaly</SelectItem>
                      <SelectItem value="intrusion">Intrusion</SelectItem>
                      <SelectItem value="malfunction">Malfunction</SelectItem>
                      <SelectItem value="communication">Communication</SelectItem>
                      <SelectItem value="power">Power</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger className="w-[120px] bg-slate-700 border-slate-600">
                      <SelectValue placeholder="Time Range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1h">Last Hour</SelectItem>
                      <SelectItem value="24h">Last 24h</SelectItem>
                      <SelectItem value="7d">Last 7 Days</SelectItem>
                      <SelectItem value="30d">Last 30 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Events List */}
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {filteredEvents.map((event) => (
                      <div
                        key={event.id}
                        className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant={getSeverityBadgeVariant(event.severity)}>
                                {event.severity.toUpperCase()}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {event.category.toUpperCase()}
                              </Badge>
                              <span className="text-xs text-slate-400">Risk Score: {event.riskScore}</span>
                            </div>
                            <h4 className="text-slate-200 font-medium mb-1">{event.description}</h4>
                            <p className="text-sm text-slate-400">Source: {event.source}</p>
                          </div>
                          <div className="text-right">
                            <div className={`text-sm font-medium ${getStatusColor(event.status)}`}>
                              {event.status.replace("_", " ").toUpperCase()}
                            </div>
                            <div className="text-xs text-slate-400 mt-1">
                              {new Date(event.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-xs text-slate-400">
                            {event.correlatedEvents.length > 0 && (
                              <span>🔗 {event.correlatedEvents.length} correlated</span>
                            )}
                            {event.mitreTactics.length > 0 && <span>🎯 {event.mitreTactics.join(", ")}</span>}
                            {event.assignee && <span>👤 {event.assignee}</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" className="text-xs bg-transparent">
                              Investigate
                            </Button>
                            <Button size="sm" variant="ghost" className="text-xs text-slate-400">
                              Details
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="threat-intel" className="mt-6">
              {threatIntel && (
                <div className="space-y-6">
                  {/* Threat Level Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="bg-slate-800 border-slate-700">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-red-400 text-sm">Threat Level</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-slate-50">{threatIntel.threatLevel}%</div>
                        <Progress value={threatIntel.threatLevel} className="h-2 mt-2" />
                        <p className="text-xs text-slate-400 mt-1">
                          {threatIntel.threatLevel > 80
                            ? "Critical"
                            : threatIntel.threatLevel > 60
                              ? "High"
                              : "Moderate"}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-slate-800 border-slate-700">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-orange-400 text-sm">Active Campaigns</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-slate-50">{threatIntel.activeCampaigns}</div>
                        <p className="text-xs text-slate-400 mt-1">Ongoing threat campaigns</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-slate-800 border-slate-700">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-yellow-400 text-sm">Known Actors</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-slate-50">{threatIntel.knownActors.length}</div>
                        <p className="text-xs text-slate-400 mt-1">Identified threat actors</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-slate-800 border-slate-700">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-cyan-400 text-sm">Indicators</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-slate-50">{threatIntel.recentIndicators.length}</div>
                        <p className="text-xs text-slate-400 mt-1">Recent IoCs detected</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Risk Factors */}
                  <Card className="bg-slate-800 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-cyan-400 text-lg">Risk Factor Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {threatIntel.riskFactors.map((factor, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-slate-200 font-medium">{factor.name}</span>
                                <span className="text-xs">{getTrendIcon(factor.trend)}</span>
                              </div>
                              <Progress value={factor.score} className="h-2" />
                            </div>
                            <div className="text-right ml-4">
                              <div className="text-lg font-bold text-slate-50">{factor.score}%</div>
                              <div className="text-xs text-slate-400 capitalize">{factor.trend}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Threat Actors & Indicators */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="bg-slate-800 border-slate-700">
                      <CardHeader>
                        <CardTitle className="text-red-400 text-lg">Known Threat Actors</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {threatIntel.knownActors.map((actor, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-slate-700 rounded">
                              <span className="text-slate-200 font-medium">{actor}</span>
                              <Badge variant="destructive" className="text-xs">
                                Active
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-slate-800 border-slate-700">
                      <CardHeader>
                        <CardTitle className="text-yellow-400 text-lg">Recent Indicators</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {threatIntel.recentIndicators.map((indicator, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-slate-700 rounded">
                              <span className="text-slate-200">{indicator}</span>
                              <Badge variant="outline" className="text-xs">
                                IoC
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="correlation" className="mt-6">
              <div className="space-y-6">
                <Alert className="border-yellow-500 bg-yellow-500/10">
                  <AlertDescription className="text-yellow-200">
                    🔍 Event correlation engine is analyzing patterns across {events.length} security events
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-slate-800 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-purple-400 text-lg">Correlation Rules</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-2 bg-slate-700 rounded">
                          <span className="text-slate-200">Multiple Failed Auth</span>
                          <Badge variant="default">Active</Badge>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-slate-700 rounded">
                          <span className="text-slate-200">Anomalous Power Pattern</span>
                          <Badge variant="default">Active</Badge>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-slate-700 rounded">
                          <span className="text-slate-200">Command Sequence Analysis</span>
                          <Badge variant="default">Active</Badge>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-slate-700 rounded">
                          <span className="text-slate-200">Geolocation Correlation</span>
                          <Badge variant="secondary">Standby</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-800 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-green-400 text-lg">Attack Chains</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="p-3 bg-slate-700 rounded">
                          <div className="text-slate-200 font-medium mb-2">Potential APT Activity</div>
                          <div className="text-xs text-slate-400">Initial Access → Persistence → Command & Control</div>
                          <Badge variant="destructive" className="text-xs mt-2">
                            High Confidence
                          </Badge>
                        </div>
                        <div className="p-3 bg-slate-700 rounded">
                          <div className="text-slate-200 font-medium mb-2">System Compromise Chain</div>
                          <div className="text-xs text-slate-400">Credential Access → Lateral Movement → Impact</div>
                          <Badge variant="default" className="text-xs mt-2">
                            Medium Confidence
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="forensics" className="mt-6">
              <div className="space-y-6">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-cyan-400 text-lg">Forensic Timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-4">
                        {events.slice(0, 10).map((event, index) => (
                          <div key={event.id} className="flex items-start gap-4">
                            <div className="flex flex-col items-center">
                              <div
                                className={`w-3 h-3 rounded-full ${
                                  event.severity === "critical"
                                    ? "bg-red-500"
                                    : event.severity === "high"
                                      ? "bg-orange-500"
                                      : event.severity === "medium"
                                        ? "bg-yellow-500"
                                        : "bg-green-500"
                                }`}
                              ></div>
                              {index < 9 && <div className="w-px h-8 bg-slate-600 mt-2"></div>}
                            </div>
                            <div className="flex-1 pb-4">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-slate-200 font-medium text-sm">
                                  {new Date(event.timestamp).toLocaleTimeString()}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {event.source}
                                </Badge>
                              </div>
                              <p className="text-slate-400 text-sm">{event.description}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant={getSeverityBadgeVariant(event.severity)} className="text-xs">
                                  {event.severity}
                                </Badge>
                                <span className="text-xs text-slate-500">Risk: {event.riskScore}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
