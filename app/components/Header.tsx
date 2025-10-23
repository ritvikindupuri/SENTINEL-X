// app/components/Header.tsx
import { Orbit } from "lucide-react";

interface HeaderProps {
  alerts: number;
  rsos: number;
  ttps: number;
  score: number;
}

const Header = ({ alerts, rsos, ttps, score }: HeaderProps) => {
  return (
    <header className="bg-[#252836] p-4 flex justify-between items-center border-b border-gray-700">
      <div className="flex items-center space-x-2">
        <Orbit className="w-8 h-8 text-blue-500" />
        <h1 className="text-2xl font-bold">Orbitwatch</h1>
      </div>
      <div className="flex items-center space-x-8">
        <div className="text-center">
          <p className="text-sm text-gray-400">Alerts</p>
          <p className="text-2xl font-bold">{alerts}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-400">RSOs</p>
          <p className="text-2xl font-bold">{rsos}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-400">TTPs</p>
          <p className="text-2xl font-bold">{ttps}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-400">Score</p>
          <p className="text-2xl font-bold text-red-500">{score}</p>
        </div>
      </div>
    </header>
  );
};

export default Header;
