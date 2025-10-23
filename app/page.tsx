"use client"

import { useEffect, useState } from "react"
import { realTimeInference, type DashboardData } from "@/lib/real-time-inference"
import Header from "./components/Header"
import OrbitalMap from "./components/OrbitalMap"
import Log from "./components/Log";
import RSOCharacterization from "./components/RSOCharacterization";
import Subframes from "./components/Subframes";
import ManualAlert from "./components/ManualAlert";

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
};

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData>(initialData);

  useEffect(() => {
    realTimeInference.startRealTimeInference();

    const handleNewData = (data: DashboardData) => {
      setDashboardData(data);
    };

    realTimeInference.onNewData(handleNewData);

    return () => {
      realTimeInference.stopRealTimeInference();
    };
  }, []);

  const handleFlagAnomaly = (anomalyId: string) => {
    realTimeInference.flagAnomaly(anomalyId);
  };

  const handleManualAlert = (alert: { satelliteName: string; anomalyType: string; severity: "low" | "medium" | "high" }) => {
    realTimeInference.createManualAlert(alert);
  };

  return (
    <div className="h-screen bg-[#1a1d2e] text-white flex flex-col overflow-hidden">
      <Header {...dashboardData.header} />
      <main className="flex-1 p-6 grid grid-cols-12 grid-rows-12 gap-6">
        <div className="col-span-8 row-span-8">
          <OrbitalMap
            anomalies={dashboardData.recentEvents}
            onFlagAnomaly={handleFlagAnomaly}
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
        <div className="col-span-12 row-span-4">
          <Log logs={dashboardData.logs} />
        </div>
      </main>
    </div>
  );
}
