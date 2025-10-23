// app/components/Log.tsx
"use client";

interface LogEntry {
  id: string;
  timestamp: string;
  level: "info" | "warning" | "error";
  message: string;
}

interface LogProps {
  logs: LogEntry[];
}

const Log = ({ logs }: LogProps) => {
  const getLevelColor = (level: "info" | "warning" | "error") => {
    return {
      info: "text-blue-400",
      warning: "text-yellow-400",
      error: "text-red-400",
    }[level];
  };

  return (
    <div className="bg-[#252836] rounded-lg p-4 h-full flex flex-col">
      <h2 className="text-lg font-semibold text-white mb-4">Event Log</h2>
      <div className="flex-1 overflow-y-auto font-mono text-sm">
        {logs.map((log) => (
          <div key={log.id} className="flex items-start mb-2">
            <span className="text-gray-500 mr-4">
              {new Date(log.timestamp).toLocaleTimeString()}
            </span>
            <span className={`font-bold mr-2 ${getLevelColor(log.level)}`}>
              [{log.level.toUpperCase()}]
            </span>
            <span className="text-gray-300 flex-1">{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Log;
