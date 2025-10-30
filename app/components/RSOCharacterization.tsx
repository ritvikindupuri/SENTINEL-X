// app/components/RSOCharacterization.tsx
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, BarChart2, FileText, Satellite, Settings, Shield, Info } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface RSO {
  id: string;
  name: string;
  type: "debris" | "payload" | "rocket body" | "unknown";
  threatScore: number;
  country: string;
  launchDate: string;
  orbitalPeriod: number;
  inclination: number;
  apogee: number;
  perigee: number;
  telemetry: {
    status: "nominal" | "degraded" | "critical";
    power: number;
    temperature: number;
    lastContact: string;
  };
  mitigations: {
    maneuverability: boolean;
    commsJamming: boolean;
    sensorBlinding: boolean;
  };
}

interface RSOCharacterizationProps {
  rsos: RSO[];
}

const RSOCharacterization = ({ rsos }: RSOCharacterizationProps) => {
  const [selectedRso, setSelectedRso] = useState<RSO | null>(null);

  useEffect(() => {
    if (rsos.length > 0 && !selectedRso) {
      setSelectedRso(rsos[0]);
    }
  }, [rsos, selectedRso]);

  const getThreatColor = (score: number) => {
    if (score > 85) return "text-red-400";
    if (score > 60) return "text-orange-400";
    if (score > 40) return "text-yellow-400";
    return "text-green-400";
  };

  const getTelemetryStatusColor = (status: "nominal" | "degraded" | "critical") => {
    if (status === "critical") return "text-red-400";
    if (status === "degraded") return "text-yellow-400";
    return "text-green-400";
  }

  const handleSelectChange = (rsoId: string) => {
      const rso = rsos.find(r => r.id === rsoId);
      if(rso) {
          setSelectedRso(rso);
      }
  }

  if (!selectedRso) {
    return (
      <Card className="bg-slate-900/50 border-slate-800 text-white w-full h-full flex flex-col items-center justify-center">
        <Satellite className="h-8 w-8 text-cyan-400 mb-2" />
        <p className="text-slate-400">Select an RSO to view details.</p>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/50 border-slate-800 text-white w-full h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
            <Satellite className="h-5 w-5 text-cyan-400" />
            <CardTitle className="text-lg text-white">RSO Characterization</CardTitle>
        </div>
        <Select onValueChange={handleSelectChange} value={selectedRso.id}>
            <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700">
            <SelectValue placeholder="Select RSO" />
            </SelectTrigger>
            <SelectContent>
            {rsos.map(rso => (
                <SelectItem key={rso.id} value={rso.id}>{rso.name}</SelectItem>
            ))}
            </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        <TooltipProvider>
          <div className="flex flex-col h-full">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-slate-800/50 rounded-lg p-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-pointer">
                      <div className={`text-3xl font-bold ${getThreatColor(selectedRso.threatScore)}`}>{selectedRso.threatScore}</div>
                      <div className="text-xs text-slate-400 flex items-center">
                        Threat Score <Info className="h-3 w-3 ml-1" />
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Calculated using a hybrid of:</p>
                    <ul className="list-disc list-inside">
                      <li>TensorFlow Autoencoder</li>
                      <li>Scikit-learn Isolation Forest</li>
                      <li>Scikit-learn One-Class SVM</li>
                    </ul>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3">
                <div className="text-lg font-bold text-white">{selectedRso.country}</div>
                    <div className="text-xs text-slate-400">Country of Origin</div>
                </div>
                 <div className="bg-slate-800/50 rounded-lg p-3 col-span-2">
                    <div className="text-lg font-bold text-white capitalize">{selectedRso.type}</div>
                    <div className="text-xs text-slate-400">Object Type</div>
                </div>
            </div>

            <Tabs defaultValue="overview" className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-4 bg-slate-800 border-slate-700">
                <TabsTrigger value="overview"><BarChart2 className="h-4 w-4 mr-1"/>Overview</TabsTrigger>
                <TabsTrigger value="telemetry"><Settings className="h-4 w-4 mr-1"/>Telemetry</TabsTrigger>
                <TabsTrigger value="mitigation"><Shield className="h-4 w-4 mr-1"/>Mitigation</TabsTrigger>
                <TabsTrigger value="details"><FileText className="h-4 w-4 mr-1"/>Details</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="flex-1 mt-4 space-y-4">
                <div className="bg-slate-800/40 rounded-lg p-3">
                    <h4 className="font-semibold text-slate-300 mb-2">Orbital Parameters</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><span className="text-slate-400">Period:</span> {selectedRso.orbitalPeriod} min</div>
                        <div><span className="text-slate-400">Inclination:</span> {selectedRso.inclination}°</div>
                        <div><span className="text-slate-400">Apogee:</span> {selectedRso.apogee} km</div>
                        <div><span className="text-slate-400">Perigee:</span> {selectedRso.perigee} km</div>
                    </div>
                </div>
                 <div className="bg-slate-800/40 rounded-lg p-3">
                    <h4 className="font-semibold text-slate-300 mb-2">Key Information</h4>
                     <div className="text-sm">
                        <span className="text-slate-400">Launch Date:</span> {new Date(selectedRso.launchDate).toLocaleDateString()}
                    </div>
                </div>
              </TabsContent>

              <TabsContent value="telemetry" className="flex-1 mt-4 space-y-4">
                <div className={`bg-slate-800/40 rounded-lg p-3 border-l-4 ${
                    selectedRso.telemetry.status === 'nominal' ? 'border-green-500' :
                    selectedRso.telemetry.status === 'degraded' ? 'border-yellow-500' :
                    'border-red-500'
                }`}>
                    <h4 className="font-semibold text-slate-300 mb-2">System Status</h4>
                    <div className="flex items-center gap-2">
                        <span className={`text-lg font-bold ${getTelemetryStatusColor(selectedRso.telemetry.status)}`}>
                            {selectedRso.telemetry.status.toUpperCase()}
                        </span>
                        {selectedRso.telemetry.status !== 'nominal' && <AlertTriangle className="h-5 w-5 text-yellow-400"/>}
                    </div>
                </div>
                 <div className="bg-slate-800/40 rounded-lg p-3">
                    <h4 className="font-semibold text-slate-300 mb-2">Power Level</h4>
                    <Progress value={selectedRso.telemetry.power} className="h-2"/>
                    <div className="text-right text-sm mt-1">{selectedRso.telemetry.power.toFixed(2)}%</div>
                </div>
                <div className="bg-slate-800/40 rounded-lg p-3">
                    <h4 className="font-semibold text-slate-300 mb-2">Temperature</h4>
                    <div className="text-lg font-bold">{selectedRso.telemetry.temperature.toFixed(2)}°C</div>
                </div>
                 <div className="bg-slate-800/40 rounded-lg p-3">
                    <h4 className="font-semibold text-slate-300 mb-2">Last Contact</h4>
                    <div className="text-sm">{new Date(selectedRso.telemetry.lastContact).toLocaleString()}</div>
                </div>
              </TabsContent>

              <TabsContent value="mitigation" className="flex-1 mt-4 space-y-3">
                 <h4 className="font-semibold text-slate-300">Defensive Capabilities</h4>
                 <div className="flex items-center justify-between bg-slate-800/40 p-2 rounded-lg">
                    <span className="text-sm">Onboard Maneuverability</span>
                    <Badge variant={selectedRso.mitigations.maneuverability ? "default" : "destructive"}>
                        {selectedRso.mitigations.maneuverability ? "Available" : "Unavailable"}
                    </Badge>
                 </div>
                 <div className="flex items-center justify-between bg-slate-800/40 p-2 rounded-lg">
                    <span className="text-sm">Communications Jamming</span>
                     <Badge variant={selectedRso.mitigations.commsJamming ? "default" : "destructive"}>
                        {selectedRso.mitigations.commsJamming ? "Hardened" : "Vulnerable"}
                    </Badge>
                 </div>
                  <div className="flex items-center justify-between bg-slate-800/40 p-2 rounded-lg">
                    <span className="text-sm">Optical Sensor Blinding</span>
                     <Badge variant={selectedRso.mitigations.sensorBlinding ? "default" : "destructive"}>
                        {selectedRso.mitigations.sensorBlinding ? "Resistant" : "Susceptible"}
                    </Badge>
                 </div>
              </TabsContent>

              <TabsContent value="details" className="flex-1 mt-4">
                 <div className="bg-slate-800/40 rounded-lg p-3 text-sm text-slate-300 h-full">
                    <p>Detailed analysis and historical data for {selectedRso.name}. This section would typically include trajectory predictions, mission objectives, and known operational history.</p>
                 </div>
              </TabsContent>
            </Tabs>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
};

export default RSOCharacterization;
