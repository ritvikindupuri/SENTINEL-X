
"use client"

import { useEffect, useState } from "react"
import { ShieldAlert } from "lucide-react"

export default function AnomalyDashboard() {
  const [anomalyCount, setAnomalyCount] = useState(0);

  useEffect(() => {
    const fetchAnomalies = async () => {
      try {
        const response = await fetch('/api/anomalies');
        const data = await response.json();
        setAnomalyCount(data.length);
      } catch (error) {
        console.error('Failed to fetch anomaly count:', error);
      }
    };

    fetchAnomalies();
    const interval = setInterval(fetchAnomalies, 5000); // Fetch every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h2 className="text-lg font-semibold mb-2 flex items-center">
        <ShieldAlert className="mr-2" />
        Anomaly Count
      </h2>
      <p className="text-4xl font-bold">{anomalyCount}</p>
      <p className="text-sm text-gray-400">Anomalies detected in the last hour</p>
    </div>
  )
}
