// app/components/ManualAlert.tsx
"use client";

import { useState } from "react";

interface ManualAlertProps {
    onManualAlert: (alert: { satelliteName: string; anomalyType: string; severity: "low" | "medium" | "high" }) => void;
}

const ManualAlert = ({ onManualAlert }: ManualAlertProps) => {
  const [satelliteName, setSatelliteName] = useState("");
  const [anomalyType, setAnomalyType] = useState("");
  const [severity, setSeverity] = useState<"low" | "medium" | "high">("low");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!satelliteName || !anomalyType) {
      // Basic validation
      alert("Please fill in all fields.");
      return;
    }
    onManualAlert({ satelliteName, anomalyType, severity });
    setSatelliteName("");
    setAnomalyType("");
    setSeverity("low");
  };

  return (
    <div className="bg-[#252836] rounded-lg p-4 h-full flex flex-col">
      <h2 className="text-lg font-semibold text-white mb-4">Manual Alert</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Satellite Name"
          value={satelliteName}
          onChange={(e) => setSatelliteName(e.target.value)}
          className="bg-[#1a1d2e] text-white w-full px-4 py-2 rounded-md border border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <input
          type="text"
          placeholder="Anomaly Type"
          value={anomalyType}
          onChange={(e) => setAnomalyType(e.target.value)}
          className="bg-[#1a1d2e] text-white w-full px-4 py-2 rounded-md border border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <select
          value={severity}
          onChange={(e) => setSeverity(e.target.value as "low" | "medium" | "high")}
          className="bg-[#1a1d2e] text-white border border-gray-600 rounded-md px-3 py-2 appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <button
          type="submit"
          className="bg-blue-500 text-white font-semibold py-2 rounded-md hover:bg-blue-600 transition-colors"
        >
          Create Alert
        </button>
      </form>
    </div>
  );
};

export default ManualAlert;
