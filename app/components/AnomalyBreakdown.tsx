
"use client"

import { useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ShieldAlert } from "lucide-react";

interface AnomalyBucket {
  key: string;
  doc_count: number;
}

interface AnomalyBreakdownProps {
  aggregations: {
    anomaly_by_satellite?: {
      buckets: AnomalyBucket[];
    }
  }
}

export default function AnomalyBreakdown({ aggregations }: AnomalyBreakdownProps) {
  const [breakdownData, setBreakdownData] = useState([]);

  useEffect(() => {
    const buckets = aggregations?.anomaly_by_satellite?.buckets || [];
    const formattedData = buckets.map((bucket: AnomalyBucket) => ({
      name: `NORAD ${bucket.key}`,
      count: bucket.doc_count,
    }));
    setBreakdownData(formattedData);
  }, [aggregations]);

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h2 className="text-lg font-semibold mb-2 flex items-center">
        <ShieldAlert className="mr-2" />
        Top 5 Anomalous Satellites
      </h2>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={breakdownData}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="#ef4444" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
