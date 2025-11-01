// app/components/RSOCharacterization.tsx
"use client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import type { RSO, SatelliteDetails, TrajectoryPoint } from "@/lib/real-time-inference";
import { useEffect, useState } from "react";
import { RealTimeInferenceService } from "@/lib/real-time-inference";

interface RSOCharacterizationProps {
  rsos: RSO[];
  realTimeInference: RealTimeInferenceService;
}

const RSOCharacterization = ({ rsos, realTimeInference }: RSOCharacterizationProps) => {
  const [selectedRso, setSelectedRso] = useState<RSO | null>(null);
  const [details, setDetails] = useState<SatelliteDetails | null>(null);
  const [trajectory, setTrajectory] = useState<TrajectoryPoint[] | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (rsos.length > 0 && !selectedRso) {
      setSelectedRso(rsos[0]);
    }
  }, [rsos, selectedRso]);

  useEffect(() => {
    if (selectedRso) {
      realTimeInference.getSatelliteDetails(selectedRso.name, (data) => {
        setDetails(data.details);
        setTrajectory(data.trajectory);
      });
    }
  }, [selectedRso, realTimeInference]);

  const getThreatLevelColor = (level: "low" | "medium" | "high") => {
    return {
      low: "text-green-400",
      medium: "text-yellow-400",
      high: "text-red-400",
    }[level];
  };

  const mlModelExplanations: Record<string, string> = {
    autoencoder: "The Autoencoder model detects anomalies by learning a compressed representation of normal satellite telemetry data. Deviations from this learned representation are flagged as potential anomalies. A higher score indicates a larger deviation from the norm.",
    isolationForest: "The Isolation Forest model isolates anomalies by randomly selecting a feature and then randomly selecting a split value between the maximum and minimum values of the selected feature. A higher score indicates that the data point is more easily isolated and thus more likely to be an anomaly.",
    svm: "The One-Class SVM model learns a decision boundary around the normal data points. Data points that fall outside of this boundary are considered anomalies. A higher score indicates a greater distance from the decision boundary, suggesting a higher likelihood of being an anomaly.",
  };

  return (
    <TooltipProvider>
      <div className="bg-[#252836] rounded-lg p-4 h-full flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-white">RSO Characterization</h2>
          <select
            className="bg-[#1a1d2e] text-white p-2 rounded-md"
            value={selectedRso?.id || ""}
            onChange={(e) => {
              const rso = rsos.find((r) => r.id === e.target.value);
              setSelectedRso(rso || null);
            }}
          >
            {rsos.map((rso) => (
              <option key={rso.id} value={rso.id}>
                {rso.name}
              </option>
            ))}
          </select>
        </div>
        {selectedRso && (
          <div className="flex-1 overflow-y-auto">
            <div className="bg-[#1a1d2e] p-3 rounded-md mb-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-white">{selectedRso.name}</span>
                <span className={`font-bold ${getThreatLevelColor(selectedRso.threatLevel)}`}>
                  {selectedRso.threatLevel.toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-gray-300 mt-1">Type: {selectedRso.type}</p>
              <p className="text-sm text-gray-300">Orbit: {selectedRso.orbit}</p>
              <div className="mt-2 text-sm text-gray-300">
                <div className="flex items-center justify-between">
                  <span>Autoencoder Score: {selectedRso.autoencoderScore}</span>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{mlModelExplanations.autoencoder}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex items-center justify-between">
                  <span>Isolation Forest Score: {selectedRso.isolationForestScore}</span>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{mlModelExplanations.isolationForest}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex items-center justify-between">
                  <span>One-Class SVM Score: {selectedRso.svmScore}</span>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{mlModelExplanations.svm}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>
            <div className="bg-[#1a1d2e] p-3 rounded-md mt-4">
              <div className="flex border-b border-gray-700">
                <button
                  className={`px-4 py-2 text-sm font-medium ${activeTab === 'overview' ? 'text-white border-b-2 border-blue-500' : 'text-gray-400'}`}
                  onClick={() => setActiveTab('overview')}
                >
                  Overview
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium ${activeTab === 'details' ? 'text-white border-b-2 border-blue-500' : 'text-gray-400'}`}
                  onClick={() => setActiveTab('details')}
                >
                  Details
                </button>
              </div>
              <div className="p-4">
                {activeTab === 'overview' && (
                  <div>
                    <p className="text-sm text-gray-300">This is the overview tab.</p>
                  </div>
                )}
                {activeTab === 'details' && (
                  <div>
                    {details && (
                      <>
                        <h3 className="font-semibold text-white">Mission Objectives</h3>
                        <p className="text-sm text-gray-300 mt-1">{details.mission_objectives}</p>
                        <h3 className="font-semibold text-white mt-4">Operational History</h3>
                        <p className="text-sm text-gray-300 mt-1">{details.operational_history}</p>
                      </>
                    )}
                    {trajectory && (
                      <>
                        <h3 className="font-semibold text-white mt-4">Trajectory Prediction</h3>
                        <div className="overflow-y-auto h-40 mt-2 text-xs text-gray-400">
                          {trajectory.map((p, i) => (
                            <div key={i}>
                              {p.timestamp}: ({p.position.x.toFixed(2)}, {p.position.y.toFixed(2)}, {p.position.z.toFixed(2)})
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default RSOCharacterization;
