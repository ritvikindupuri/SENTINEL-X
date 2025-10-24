// app/components/Subframes.tsx
"use client";

import { useState } from "react";
import { ChevronDown, Search } from "lucide-react";

interface Subframe {
  id: string;
  name: string;
  timestamp: string;
  description: string;
}

interface SubframesProps {
  subframes: Subframe[];
}

const Subframes = ({ subframes }: SubframesProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");

  const filteredSubframes = subframes
    .filter((sf) =>
      sf.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((sf) => filter === "all" || sf.name.toLowerCase().includes(filter)); // Simple filter by name for now

  return (
    <div className="bg-[#252836] rounded-lg p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Subframes</h2>
        <div className="relative">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-[#1a1d2e] text-white border border-gray-600 rounded-md pl-3 pr-8 py-1 appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All</option>
            <option value="type1">Type 1</option>
            <option value="type2">Type 2</option>
          </select>
          <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>
      <div className="relative mb-4">
        <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search subframes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-[#1a1d2e] text-white w-full pl-10 pr-4 py-2 rounded-md border border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        {filteredSubframes.map((sf) => (
          <div key={sf.id} className="bg-[#1a1d2e] p-3 rounded-md mb-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-white">{sf.name}</span>
              <span className="text-xs text-gray-400">{sf.timestamp}</span>
            </div>
            <p className="text-sm text-gray-300 mt-1">{sf.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Subframes;
