
"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { type DashboardData, RSO, RealTimeInferenceService } from "@/lib/real-time-inference"
import Header from "./components/Header"
import { User, LogIn } from 'lucide-react';
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import AnomalyDashboard from "./components/AnomalyDashboard"
import AnomalyBreakdown from "./components/AnomalyBreakdown"

const OrbitalMap = dynamic(() => import("./components/OrbitalMap"), {
  ssr: false,
});

const RSOCharacterization = dynamic(() => import("./components/RSOCharacterization"), {
  ssr: false,
});

const Log = dynamic(() => import("./components/Log"), {
  ssr: false,
});

const Subframes = dynamic(() => import("./components/Subframes"), {
  ssr: false,
});

const DataServiceProvider = dynamic(() => import('./components/DataServiceProvider'), {
  ssr: false,
});


const initialData: DashboardData = {
  header: { alerts: 0, rsos: 0, ttps: 0, score: 0 },
  alertsOverTime: [],
  telemetryTimeline: [],
  rsoClassification: [],
  spartaMitreAlignment: [],
  score: 0,
  recentEvents: [],
  subframes: [],
  logs: [],
  rsos: [],
  anomalies: [],
  anomaly_count: 0,
  anomaly_breakdown: [],
};

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData>(initialData);
  const [selectedRso, setSelectedRso] = useState<RSO | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(true);
  const [realTimeInference, setRealTimeInference] = useState<RealTimeInferenceService | null>(null);

  const handleServiceReady = (service: RealTimeInferenceService) => {
    setRealTimeInference(service);
    service.connect();

    service.onNewData((data) => {
      setDashboardData(data);
      if (data.rsos.length > 0 && !selectedRso) {
        setSelectedRso(data.rsos[0]);
      }
    });
  };

  if (!realTimeInference) {
    return <DataServiceProvider onServiceReady={handleServiceReady} />;
  }

  const handleSaveCredentials = () => {
    realTimeInference.saveCredentials(username, password);
    setIsSettingsOpen(false);
  };

  const handleDummyCredentials = () => {
    realTimeInference.saveCredentials('dummy_user', 'dummy_password');
    setIsSettingsOpen(false);
  }

  const handleFlagAnomaly = (anomalyId: string) => {
    realTimeInference.flagAnomaly(anomalyId);
  };

  return (
    <div className="h-screen bg-[#1a1d2e] text-white flex flex-col overflow-hidden">
      <Header {...dashboardData.header} />

      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-[425px] bg-[#2a2d3e] border-gray-700 text-white z-[1000]">
          <DialogHeader>
            <DialogTitle>Space-Track Credentials</DialogTitle>
            <DialogDescription>
              Enter your credentials to connect to the Space-Track API.
              Or, use dummy data to get started immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username" className="text-right">
                Username
              </Label>
              <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} className="col-span-3 bg-gray-800 border-gray-600" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Password
              </Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="col-span-3 bg-gray-800 border-gray-600" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={handleDummyCredentials} variant="secondary">
              <LogIn className="mr-2 h-4 w-4" /> Use Dummy Data
            </Button>
            <Button type="submit" onClick={handleSaveCredentials}>
              <User className="mr-2 h-4 w-4" /> Save Credentials
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <main className="flex-1 p-6 grid grid-cols-12 grid-rows-12 gap-6">
        <div className="col-span-8 row-span-8">
          <OrbitalMap
            onFlagAnomaly={handleFlagAnomaly}
            onSelectRso={(rso) => setSelectedRso(rso)}
            rsos={dashboardData.rsos}
            anomalies={dashboardData.anomalies}
          />
        </div>
        <div className="col-span-4 row-span-8 flex flex-col gap-6">
          <RSOCharacterization rso={selectedRso} />
          <AnomalyDashboard anomalyCount={dashboardData.anomaly_count} />
          <AnomalyBreakdown aggregations={{ anomaly_by_satellite: { buckets: dashboardData.anomaly_breakdown } }} />
          <Subframes subframes={dashboardData.subframes} />
        </div>
        <div className="col-span-12 row-span-4">
          <Log logs={dashboardData.logs} />
        </div>
      </main>
    </div>
  );
}
