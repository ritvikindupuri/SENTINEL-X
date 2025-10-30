
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const InfoField = ({ label, value }) => (
  <div className="flex flex-col">
    <span className="text-xs text-gray-400">{label}</span>
    <span className="text-sm font-semibold">{value}</span>
  </div>
);

const RsoDetailView = ({ satellite, open, onOpenChange }) => {
  if (!satellite) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-gray-800 text-white border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>RSO ID: {satellite.name}</span>
            <img src={`https://flagsapi.com/${satellite.country}/flat/64.png`} alt={`${satellite.country} flag`} className="w-8 h-6" />
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-4 gap-4 p-4">
          <InfoField label="RSO ID" value={satellite.name} />
          <InfoField label="Catalog Number" value={satellite.noradId} />
          <InfoField label="Orbit Type" value={satellite.orbitType} />
          <InfoField label="TLE Timestamp" value={new Date(satellite.tleTimestamp).toLocaleString()} />

          <InfoField label="Country" value={satellite.country} />
          <InfoField label="Operator" value={satellite.operator} />
          <InfoField label="Perigee (km)" value={satellite.perigee.toFixed(2)} />
          <InfoField label="Apogee (km)" value={satellite.apogee.toFixed(2)} />

          <InfoField label="Mission Capability" value={satellite.missionCapability} />
          <InfoField label="Tech Type" value={satellite.techType} />
          <InfoField label="Inclination" value={satellite.inclination.toFixed(2)} />
          <InfoField label="Eccentricity" value={satellite.eccentricity.toFixed(4)} />

          <InfoField label="Angle of Degree" value={satellite.intldes} />
          <InfoField label="Operating Band/Frequency" value={satellite.operatingBand} />
        </div>

        <div className="p-4">
          <h3 className="text-lg font-semibold mb-2">Event Logs</h3>
          <div className="border border-gray-600 rounded-lg h-48 overflow-y-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3">Timestamp</th>
                  <th scope="col" className="px-6 py-3">Event</th>
                  <th scope="col" className="px-6 py-3">Severity</th>
                </tr>
              </thead>
              <tbody>
                {/* Add event log data here when available */}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 p-4">
          <InfoField label="Size" value={satellite.size} />
          <InfoField label="Launch Date" value={new Date(satellite.launchDate).toLocaleDateString()} />
          <InfoField label="INTLDES" value={satellite.intldes} />

          <InfoField label="Mass (kg)" value={satellite.mass} />
          <InfoField label="Operational End Date" value={new Date(satellite.operationalEndDate).toLocaleDateString()} />
          <InfoField label="Manufacture" value={satellite.manufacture} />

          <InfoField label="Payload" value={satellite.payload} />
          <InfoField label="Reentry Date" value={new Date(satellite.reentryDate).toLocaleDateString()} />
          <InfoField label="Type of Data Entry" value={satellite.typeOfDataEntry} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RsoDetailView;
