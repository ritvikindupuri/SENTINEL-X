// app/components/RSOCharacterization.tsx
"use client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import type { RSO } from "@/lib/real-time-inference";

interface RSOCharacterizationProps {
  rsos: RSO[];
}

const RSOCharacterization = ({ rsos }: RSOCharacterizationProps) => {
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
        <h2 className="text-lg font-semibold text-white mb-4">RSO Characterization</h2>
        <div className="flex-1 overflow-y-auto">
          {rsos.map((rso) => (
            <div key={rso.id} className="bg-[#1a1d2e] p-3 rounded-md mb-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-white">{rso.name}</span>
                <span className={`font-bold ${getThreatLevelColor(rso.threatLevel)}`}>
                  {rso.threatLevel.toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-gray-300 mt-1">Type: {rso.type}</p>
              <p className="text-sm text-gray-300">Orbit: {rso.orbit}</p>
              <div className="mt-2 text-sm text-gray-300">
                <div className="flex items-center justify-between">
                  <span>Autoencoder Score: {rso.autoencoderScore}</span>
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
                  <span>Isolation Forest Score: {rso.isolationForestScore}</span>
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
                  <span>One-Class SVM Score: {rso.svmScore}</span>
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
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default RSOCharacterization;
