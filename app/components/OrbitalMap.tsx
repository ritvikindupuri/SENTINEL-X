
"use client"

import { useEffect } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import { RealTimeAnomaly, RSO } from "@/lib/real-time-inference"
import { AlertTriangle, Flag, CheckCircle } from "lucide-react"

// -- Leaflet Icon Configuration --
const satelliteIcon = new L.Icon({
  iconUrl: "/satellite-icon.svg",
  iconSize: [25, 25],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
})

const anomalyIcon = new L.Icon({
  iconUrl: "/anomaly-icon.svg",
  iconSize: [35, 35],
  iconAnchor: [17, 17],
  popupAnchor: [0, -17],
})


interface OrbitalMapProps {
  anomalies: RealTimeAnomaly[]
  onFlagAnomaly: (anomalyId: string) => void
  onSelectRso: (rso: RSO) => void
  rsos: RSO[]
}

const MapController = ({ anomalies, rsos }: { anomalies: RealTimeAnomaly[], rsos: RSO[] }) => {
  const map = useMap()

  // Pan to the first RSO or anomaly when data loads
  useEffect(() => {
    const target = rsos.find(r => r.latitude && r.longitude) || anomalies.find(a => a.location)
    if (target) {
      const lat = 'latitude' in target ? target.latitude : target.location.latitude;
      const lng = 'longitude' in target ? target.longitude : target.location.longitude;
      map.flyTo([lat, lng], map.getZoom(), {
        animate: true,
        duration: 1.5
      })
    }
  }, [anomalies, rsos, map])

  return null
}


export default function OrbitalMap({ anomalies, onFlagAnomaly, onSelectRso, rsos }: OrbitalMapProps) {

  const mapCenter: [number, number] = [20, 0]

  return (
    <MapContainer
      center={mapCenter}
      zoom={2}
      className="h-full w-full bg-gray-800 rounded-lg"
      zoomControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      <MapController anomalies={anomalies} rsos={rsos} />

      {/* Render non-anomalous RSOs */}
      {rsos.filter(rso => !anomalies.some(a => a.noradId === parseInt(rso.id))).map(rso => (
        rso.latitude && rso.longitude && (
          <Marker
            key={rso.id}
            position={[rso.latitude, rso.longitude]}
            icon={satelliteIcon}
            eventHandlers={{ click: () => onSelectRso(rso) }}
          >
            <Popup>
              <div className="text-black">
                <h3 className="font-bold">{rso.name}</h3>
                <p>Status: {rso.status}</p>
                <p>Threat: {rso.threatLevel}</p>
              </div>
            </Popup>
          </Marker>
        )
      ))}

      {/* Render anomalies */}
      {anomalies.map(anomaly => (
        <Marker
          key={anomaly.id}
          position={[anomaly.location.latitude, anomaly.location.longitude]}
          icon={anomalyIcon}
          eventHandlers={{ click: () => {
            const associatedRso = rsos.find(r => r.id === anomaly.noradId?.toString());
            if (associatedRso) onSelectRso(associatedRso);
          }}}
        >
          <Popup>
            <div className="text-black">
              <div className="flex items-center font-bold mb-2">
                <AlertTriangle className="text-red-500 mr-2" />
                {anomaly.satelliteName}
              </div>
              <p><strong>Anomaly:</strong> {anomaly.anomalyResult.anomaly_type}</p>
              <p><strong>Severity:</strong> {anomaly.anomalyResult.severity}</p>
              <p><strong>Timestamp:</strong> {new Date(anomaly.timestamp).toLocaleString()}</p>
              <button
                onClick={() => onFlagAnomaly(anomaly.id)}
                className={`w-full mt-2 p-2 rounded text-white flex items-center justify-center ${
                  anomaly.isFlagged ? "bg-green-500" : "bg-blue-500"
                }`}
              >
                {anomaly.isFlagged ? <CheckCircle className="mr-2" /> : <Flag className="mr-2" />}
                {anomaly.isFlagged ? "Flagged" : "Flag Anomaly"}
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
