// app/components/SpartaMitreAlignment.tsx
"use client";

interface SpartaMitreAlignmentProps {
  data: Array<{ id: string; name: string; coverage: number }>;
}

const SpartaMitreAlignment = ({ data }: SpartaMitreAlignmentProps) => {
  return (
    <div className="bg-[#252836] rounded-lg p-4 h-full flex flex-col">
      <h2 className="text-lg font-semibold text-white mb-4">SPARTA/MITRE Alignment</h2>
      <div className="overflow-y-auto">
        {data.map((item) => (
          <div key={item.id} className="mb-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-300">{item.name}</span>
              <span className="text-sm text-white">{item.coverage}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2.5">
              <div
                className="bg-blue-500 h-2.5 rounded-full"
                style={{ width: `${item.coverage}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SpartaMitreAlignment;
