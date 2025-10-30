
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Image from "next/image";

const RsoDetailView = ({ satellite, open, onOpenChange }) => {
  if (!satellite) return null;

  const getCountryFlag = (countryCode) => {
    // Simple mapping for demonstration
    const flags = {
      USA: "https://flagcdn.com/us.svg",
      RUS: "https://flagcdn.com/ru.svg",
      CHN: "https://flagcdn.com/cn.svg",
      // Add other country codes as needed
    };
    return flags[countryCode] || "https://flagcdn.com/un.svg"; // Default flag
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1a1d2e] text-white border-cyber-border max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-4">
            <Image
              src={getCountryFlag(satellite.country)}
              alt={`${satellite.country} flag`}
              width={40}
              height={30}
            />
            <span>{satellite.name} Details</span>
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-6 mt-4 text-sm">
          <div className="col-span-1 space-y-4">
            <h3 className="text-lg font-bold text-cyber-blue">
              Identification
            </h3>
            <p>
              <strong>NORAD ID:</strong> {satellite.noradId}
            </p>
            <p>
              <strong>Int'l Designator:</strong> {satellite.intldes}
            </p>
            <p>
              <strong>Operator:</strong> {satellite.operator}
            </p>
            <p>
              <strong>Launch Date:</strong>{" "}
              {new Date(satellite.launchDate).toLocaleDateString()}
            </p>
          </div>
          <div className="col-span-1 space-y-4">
            <h3 className="text-lg font-bold text-cyber-blue">
              Orbital Parameters
            </h3>
            <p>
              <strong>Orbit Type:</strong> {satellite.orbitType}
            </p>
            <p>
              <strong>Apogee:</strong> {satellite.apogee?.toFixed(2)} km
            </p>
            <p>
              <strong>Perigee:</strong> {satellite.perigee?.toFixed(2)} km
            </p>
            <p>
              <strong>Inclination:</strong> {satellite.inclination?.toFixed(2)}°
            </p>
            <p>
              <strong>Eccentricity:</strong> {satellite.eccentricity}
            </p>
            <p>
              <strong>TLE Timestamp:</strong>{" "}
              {new Date(satellite.tleTimestamp).toLocaleString()}
            </p>
          </div>
          <div className="col-span-1 space-y-4">
            <h3 className="text-lg font-bold text-cyber-blue">
              Physical Characteristics
            </h3>
            <p>
              <strong>Mass:</strong> {satellite.mass} kg
            </p>
            <p>
              <strong>Size:</strong> {satellite.size}
            </p>
            <p>
              <strong>Payload:</strong> {satellite.payload}
            </p>
            <p>
              <strong>Operating Band:</strong> {satellite.operatingBand}
            </p>
          </div>
          <div className="col-span-3">
            <h3 className="text-lg font-bold text-cyber-blue mt-4">
              Telemetry Data
            </h3>
            <div className="grid grid-cols-3 gap-4 mt-2">
              <p>
                <strong>Temperature:</strong>{" "}
                {satellite.telemetry.temperature?.toFixed(2)} °C
              </p>
              <p>
                <strong>Power:</strong> {satellite.telemetry.power?.toFixed(2)}{" "}
                W
              </p>
              <p>
                <strong>Communication:</strong>{" "}
                {satellite.telemetry.communication?.toFixed(2)} %
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RsoDetailView;
