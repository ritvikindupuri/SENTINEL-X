// app/components/OrbitalMap.tsx
"use client";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import type { RealTimeAnomaly } from "@/lib/real-time-inference";
import { Icon } from "leaflet";

interface OrbitalMapProps {
  anomalies: RealTimeAnomaly[];
  onFlagAnomaly: (anomalyId: string) => void;
}

const OrbitalMap = ({ anomalies, onFlagAnomaly }: OrbitalMapProps) => {
  const getIcon = (severity: "low" | "medium" | "high", isFlagged?: boolean) => {
    const color = {
      low: "#28a745", // Green
      medium: "#ffc107", // Yellow
      high: "#dc3545", // Red
    }[severity];

    const strokeColor = isFlagged ? "#00f6ff" : "white"; // Cyan for flagged, white otherwise
    const strokeWidth = isFlagged ? "4" : "2";

    return new Icon({
      iconUrl: `data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24'%3e%3ccircle cx='12' cy='12' r='10' fill='${color}' stroke='${strokeColor}' stroke-width='${strokeWidth}'/%3e%3c/svg%3e`,
      iconSize: [24, 24],
      iconAnchor: [12, 24],
      popupAnchor: [0, -24],
    });
  };

  return (
    <div className="bg-[#252836] rounded-lg h-full">
      <MapContainer
        center={[0, 0]}
        zoom={2}
        style={{ height: "100%", width: "100%", zIndex: 0, borderRadius: "0.5rem" }}
        worldCopyJump={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        {anomalies.map((a) => (
          <Marker
            key={a.id}
            position={[a.location.latitude, a.location.longitude]}
            icon={getIcon(a.anomalyResult.severity, a.isFlagged)}
          >
            <Popup>
              <div className="text-black">
                <b>{a.satelliteName}</b>
                <br />
                Anomaly: {a.anomalyResult.anomaly_type}
                <br />
                Severity: {a.anomalyResult.severity}
                <br />
                {!a.isFlagged && (
                  <button
                    onClick={() => onFlagAnomaly(a.id)}
                    className="mt-2 px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Flag
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default OrbitalMap;
