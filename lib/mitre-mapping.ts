// MITRE ATT&CK / SPARTA Mapping for Satellite Threat Intelligence

export interface MITRETechnique {
  id: string
  name: string
  description: string
  tactics: string[]
  severity: "low" | "medium" | "high" | "critical"
}

export interface ThreatIntelligence {
  mitreId: string
  technique: string
  tactic: string
  description: string
  indicators: string[]
  recommendations: string[]
}

// MITRE ATT&CK techniques adapted for satellite systems
const SATELLITE_MITRE_TECHNIQUES: Record<string, MITRETechnique> = {
  T1499: {
    id: "T1499",
    name: "Endpoint Denial of Service",
    description: "Communication jamming or signal interference targeting satellite uplink/downlink",
    tactics: ["Impact"],
    severity: "high",
  },
  T1485: {
    id: "T1485",
    name: "Data Destruction",
    description: "Corruption of satellite telemetry or command data",
    tactics: ["Impact"],
    severity: "critical",
  },
  T1498: {
    id: "T1498",
    name: "Network Denial of Service",
    description: "Ground station network disruption affecting satellite control",
    tactics: ["Impact"],
    severity: "high",
  },
  T1565: {
    id: "T1565",
    name: "Data Manipulation",
    description: "Alteration of satellite sensor data or orbital parameters",
    tactics: ["Impact"],
    severity: "critical",
  },
  T1200: {
    id: "T1200",
    name: "Hardware Additions",
    description: "Unauthorized hardware modifications or payload interference",
    tactics: ["Initial Access"],
    severity: "critical",
  },
  T1495: {
    id: "T1495",
    name: "Firmware Corruption",
    description: "Satellite firmware compromise or unauthorized updates",
    tactics: ["Impact", "Defense Evasion"],
    severity: "critical",
  },
  T1531: {
    id: "T1531",
    name: "Account Access Removal",
    description: "Loss of satellite command and control access",
    tactics: ["Impact"],
    severity: "high",
  },
  T1489: {
    id: "T1489",
    name: "Service Stop",
    description: "Satellite subsystem shutdown or power system failure",
    tactics: ["Impact"],
    severity: "critical",
  },
}

export class MITREMapper {
  /**
   * Map satellite anomaly to MITRE ATT&CK technique
   */
  static mapAnomalyToMITRE(anomalyType: string, severity: string): ThreatIntelligence | null {
    let mitreId: string
    let indicators: string[] = []
    let recommendations: string[] = []

    switch (anomalyType.toLowerCase()) {
      case "communication loss risk":
      case "communication anomaly":
        mitreId = "T1499"
        indicators = [
          "Signal strength degradation",
          "Increased packet loss",
          "Unusual frequency interference",
          "Ground station connectivity issues",
        ]
        recommendations = [
          "Switch to backup communication channels",
          "Increase signal power if possible",
          "Verify ground station equipment",
          "Check for RF interference sources",
        ]
        break

      case "power system degradation":
      case "power anomaly":
        mitreId = "T1489"
        indicators = [
          "Solar panel efficiency drop",
          "Battery voltage anomalies",
          "Power distribution irregularities",
          "Unexpected power consumption",
        ]
        recommendations = [
          "Enter safe mode to conserve power",
          "Reorient solar panels for optimal charging",
          "Disable non-critical systems",
          "Monitor battery health closely",
        ]
        break

      case "thermal anomaly":
        mitreId = "T1495"
        indicators = [
          "Temperature outside operational range",
          "Thermal control system malfunction",
          "Unexpected heat generation",
          "Cooling system failure",
        ]
        recommendations = [
          "Adjust satellite orientation to manage thermal load",
          "Reduce power to heat-generating components",
          "Activate backup thermal control",
          "Monitor component temperatures",
        ]
        break

      case "orbital decay prediction":
      case "orbital anomaly":
        mitreId = "T1565"
        indicators = [
          "Unexpected altitude changes",
          "Orbital parameter drift",
          "Propulsion system anomalies",
          "Atmospheric drag increase",
        ]
        recommendations = [
          "Perform orbital correction maneuver",
          "Calculate fuel requirements for station-keeping",
          "Update ground tracking systems",
          "Plan deorbit if necessary",
        ]
        break

      case "sensor malfunction":
      case "data corruption":
        mitreId = "T1485"
        indicators = [
          "Inconsistent sensor readings",
          "Data validation failures",
          "Telemetry corruption",
          "Unexpected data patterns",
        ]
        recommendations = [
          "Switch to redundant sensors",
          "Perform sensor calibration",
          "Verify data integrity",
          "Reset affected subsystems",
        ]
        break

      default:
        mitreId = "T1565"
        indicators = ["Unclassified anomaly detected"]
        recommendations = ["Perform comprehensive system diagnostics"]
    }

    const technique = SATELLITE_MITRE_TECHNIQUES[mitreId]
    if (!technique) return null

    return {
      mitreId,
      technique: technique.name,
      tactic: technique.tactics[0],
      description: technique.description,
      indicators,
      recommendations,
    }
  }

  /**
   * Get all MITRE techniques relevant to satellite systems
   */
  static getAllTechniques(): MITRETechnique[] {
    return Object.values(SATELLITE_MITRE_TECHNIQUES)
  }

  /**
   * Get techniques by severity
   */
  static getTechniquesBySeverity(severity: "low" | "medium" | "high" | "critical"): MITRETechnique[] {
    return Object.values(SATELLITE_MITRE_TECHNIQUES).filter((t) => t.severity === severity)
  }

  /**
   * Get techniques by tactic
   */
  static getTechniquesByTactic(tactic: string): MITRETechnique[] {
    return Object.values(SATELLITE_MITRE_TECHNIQUES).filter((t) =>
      t.tactics.some((tacticName) => tacticName.toLowerCase() === tactic.toLowerCase()),
    )
  }
}
