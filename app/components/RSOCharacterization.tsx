// app/components/RSOCharacterization.tsx
"use client";

interface RSO {
  id: string;
  name: string;
  type: string;
  threatLevel: "low" | "medium" | "high";
  orbit: string;
}

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

  return (
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
          </div>
        ))}
      </div>
    </div>
  );
};

export default RSOCharacterization;
