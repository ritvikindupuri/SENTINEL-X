"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { realTimeInference, type DashboardData } from "@/lib/real-time-inference"
import Header from "./components/Header"
import Log from "./components/Log";
import RSOCharacterization from "./components/RSOCharacterization";
import Subframes from "./components/Subframes";
import ManualAlert from "./components/ManualAlert";
import SpartaMitreAlignment from "./components/SpartaMitreAlignment";
import RsoDetailView from "./components/RsoDetailView";
import Settings from "./components/Settings";

const OrbitalMap = dynamic(() => import("./components/OrbitalMap"), {
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
  monitoredSatellites: [],
};

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData>(initialData);
  const [isClient, setIsClient] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedSatellite, setSelectedSatellite] = useState(null);

  useEffect(() => {
    setIsClient(true);
    realTimeInference.startRealTimeInference();

    const handleNewData = (data: DashboardData) => {
      setDashboardData(data);
    };

    realTimeInference.onNewData(handleNewData);

    return () => {
      realTimeInference.stopRealTimeInference();
    };
  }, []);

  if (!isClient) {
    return null; // Render nothing on the server
  }

  const handleSatelliteClick = (satellite) => {
    setSelectedSatellite(satellite);
  };

  const handleCloseDetailView = () => {
    setSelectedSatellite(null);
  };

  const handleFlagAnomaly = (anomalyId: string) => {
    realTimeInference.flagAnomaly(anomalyId);
  };

  const handleManualAlert = (alert: { satelliteName: string; anomalyType: string; severity: "low" | "medium" | "high" }) => {
    realTimeInference.createManualAlert(alert);
  };

  const handleSaveCredentials = (credentials: { username: string; password: string }) => {
    realTimeInference.saveSpacetrackCredentials(credentials);
  };

  return (
    <div className="h-screen bg-[#1a1d2e] text-white flex flex-col overflow-hidden">
      <Header {...dashboardData.header} onSettingsClick={() => setIsSettingsOpen(true)} />
      <Settings isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} onSave={handleSaveCredentials} />
      <RsoDetailView satellite={selectedSatellite} open={!!selectedSatellite} onOpenChange={handleCloseDetailView} />
      <main className="flex-1 p-6 grid grid-cols-12 grid-rows-12 gap-6">
        <div className="col-span-8 row-span-8">
          <OrbitalMap
            satellites={dashboardData.monitoredSatellites}
            anomalies={dashboardData.recentEvents}
            onFlagAnomaly={handleFlagAnomaly}
            onSatelliteClick={handleSatelliteClick}
          />
        </div>
        <div className="col-span-4 row-span-8 flex flex-col gap-6">
          <div className="flex-1">
            <RSOCharacterization rsos={dashboardData.rsos} />
          </div>
          <div className="flex-1">
            <Subframes subframes={dashboardData.subframes} />
          </div>
          <div className="flex-1">
            <ManualAlert onManualAlert={handleManualAlert} />
          </div>
        </div>
        <div className="col-span-8 row-span-4">
          <Log logs={dashboardData.logs} />
        </div>
        <div className="col-span-4 row-span-4">
          <SpartaMitreAlignment data={dashboardData.spartaMitreAlignment} />
        </div>
      </main>
    </div>
  );
}
