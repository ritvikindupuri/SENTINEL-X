"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface IncidentTicket {
  id: string
  title: string
  severity: "critical" | "high" | "medium" | "low"
  status: "open" | "in_progress" | "resolved" | "closed"
  assignee: string
  created: string
  description: string
  actions: string[]
}

export function IncidentResponsePanel() {
  const [tickets] = useState<IncidentTicket[]>([
    {
      id: "INC-2025-001",
      title: "Critical Power Anomaly - NOAA-18",
      severity: "critical",
      status: "in_progress",
      assignee: "Security Team Alpha",
      created: "2025-01-08T14:30:00Z",
      description: "Detected unusual power consumption patterns indicating potential compromise",
      actions: ["Isolated satellite communications", "Initiated backup protocols", "Contacted ground control"],
    },
    {
      id: "INC-2025-002",
      title: "Unauthorized Access Attempt - Ground Station",
      severity: "high",
      status: "open",
      assignee: "SOC Team",
      created: "2025-01-08T13:15:00Z",
      description: "Multiple failed authentication attempts from unknown IP addresses",
      actions: ["Blocked suspicious IPs", "Enhanced monitoring enabled"],
    },
  ])

  const [newTicket, setNewTicket] = useState({
    title: "",
    severity: "medium" as const,
    description: "",
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "text-red-400"
      case "in_progress":
        return "text-yellow-400"
      case "resolved":
        return "text-green-400"
      case "closed":
        return "text-slate-400"
      default:
        return "text-slate-400"
    }
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-cyan-400">Incident Response Center</CardTitle>
        <CardDescription className="text-slate-400">
          Manage security incidents and coordinate response activities
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Active Incidents */}
          <div>
            <h3 className="text-lg font-semibold text-slate-200 mb-4">Active Incidents</h3>
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-slate-200 font-medium">{ticket.title}</h4>
                      <p className="text-sm text-slate-400 mt-1">
                        {ticket.id} • {ticket.assignee}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={ticket.severity === "critical" ? "destructive" : "default"}>
                        {ticket.severity.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className={getStatusColor(ticket.status)}>
                        {ticket.status.replace("_", " ").toUpperCase()}
                      </Badge>
                    </div>
                  </div>

                  <p className="text-sm text-slate-300 mb-3">{ticket.description}</p>

                  <div className="mb-3">
                    <h5 className="text-xs font-medium text-slate-400 mb-2">RESPONSE ACTIONS:</h5>
                    <ul className="space-y-1">
                      {ticket.actions.map((action, index) => (
                        <li key={index} className="text-xs text-slate-300 flex items-center gap-2">
                          <span className="text-green-400">✓</span>
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Created: {new Date(ticket.created).toLocaleString()}</span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="text-xs bg-transparent">
                        Update
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs bg-transparent">
                        Escalate
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Create New Incident */}
          <div>
            <h3 className="text-lg font-semibold text-slate-200 mb-4">Create New Incident</h3>
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">Incident Title</label>
                <input
                  type="text"
                  placeholder="Brief description of the incident"
                  value={newTicket.title}
                  onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">Severity Level</label>
                <Select
                  value={newTicket.severity}
                  onValueChange={(value: any) => setNewTicket({ ...newTicket, severity: value })}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">Description</label>
                <Textarea
                  placeholder="Detailed description of the incident, impact, and initial observations"
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-slate-200"
                  rows={4}
                />
              </div>

              <Button className="w-full bg-red-600 hover:bg-red-700">Create Incident Ticket</Button>
            </div>
          </div>

          {/* Response Playbooks */}
          <div>
            <h3 className="text-lg font-semibold text-slate-200 mb-4">Response Playbooks</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                <h4 className="text-slate-200 font-medium mb-2">Satellite Compromise</h4>
                <p className="text-sm text-slate-400 mb-3">
                  Standard response for suspected satellite system compromise
                </p>
                <Button size="sm" variant="outline" className="bg-transparent">
                  Execute Playbook
                </Button>
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                <h4 className="text-slate-200 font-medium mb-2">Communication Loss</h4>
                <p className="text-sm text-slate-400 mb-3">Response procedures for satellite communication failures</p>
                <Button size="sm" variant="outline" className="bg-transparent">
                  Execute Playbook
                </Button>
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                <h4 className="text-slate-200 font-medium mb-2">Ground Station Attack</h4>
                <p className="text-sm text-slate-400 mb-3">Incident response for ground infrastructure attacks</p>
                <Button size="sm" variant="outline" className="bg-transparent">
                  Execute Playbook
                </Button>
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                <h4 className="text-slate-200 font-medium mb-2">Data Exfiltration</h4>
                <p className="text-sm text-slate-400 mb-3">Response to suspected data theft or unauthorized access</p>
                <Button size="sm" variant="outline" className="bg-transparent">
                  Execute Playbook
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
