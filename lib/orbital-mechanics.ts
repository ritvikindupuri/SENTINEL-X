// SGP4 Orbital Mechanics for Satellite Position Calculation
import * as satellite from "satellite.js"

export interface OrbitalElements {
  noradId: number
  epoch: Date
  meanMotion: number
  eccentricity: number
  inclination: number
  rightAscension: number
  argOfPerigee: number
  meanAnomaly: number
}

export interface SatellitePosition {
  latitude: number
  longitude: number
  altitude: number
  velocity: number
  timestamp: Date
}

export interface OrbitalPrediction {
  currentPosition: SatellitePosition
  predictedPositions: SatellitePosition[]
  orbitalDecayRisk: number
  collisionRisk: number
  anomalyIndicators: {
    unexpectedOrbitChange: boolean
    altitudeDrift: boolean
    velocityAnomaly: boolean
  }
}

/**
 * Parse TLE (Two-Line Element) data and calculate satellite position
 */
export function calculatePositionFromTLE(
  tleLine1: string,
  tleLine2: string,
  timestamp: Date = new Date(),
): SatellitePosition | null {
  try {
    const satrec = satellite.twoline2satrec(tleLine1, tleLine2)

    const positionAndVelocity = satellite.propagate(satrec, timestamp)

    if (satellite.error(satrec)) {
      console.error("[v0] SGP4 propagation error:", satellite.error(satrec))
      return null
    }

    if (!positionAndVelocity.position || typeof positionAndVelocity.position === "boolean") {
      return null
    }

    const gmst = satellite.gstime(timestamp)
    const geodeticCoords = satellite.eciToGeodetic(positionAndVelocity.position, gmst)

    const latitude = satellite.degreesLat(geodeticCoords.latitude)
    const longitude = satellite.degreesLong(geodeticCoords.longitude)
    const altitude = geodeticCoords.height

    let velocity = 0
    if (positionAndVelocity.velocity && typeof positionAndVelocity.velocity !== "boolean") {
      velocity = Math.sqrt(
        Math.pow(positionAndVelocity.velocity.x, 2) +
          Math.pow(positionAndVelocity.velocity.y, 2) +
          Math.pow(positionAndVelocity.velocity.z, 2),
      )
    }

    return {
      latitude,
      longitude,
      altitude,
      velocity,
      timestamp,
    }
  } catch (error) {
    console.error("[v0] Error calculating satellite position:", error)
    return null
  }
}

/**
 * Predict future satellite positions using SGP4
 */
export function predictOrbit(
  tleLine1: string,
  tleLine2: string,
  hoursAhead = 24,
  intervalMinutes = 60,
): OrbitalPrediction | null {
  try {
    const satrec = satellite.twoline2satrec(tleLine1, tleLine2)
    const now = new Date()

    const currentPos = calculatePositionFromTLE(tleLine1, tleLine2, now)
    if (!currentPos) return null

    const predictedPositions: SatellitePosition[] = []
    const intervals = (hoursAhead * 60) / intervalMinutes

    for (let i = 1; i <= intervals; i++) {
      const futureTime = new Date(now.getTime() + i * intervalMinutes * 60 * 1000)
      const position = calculatePositionFromTLE(tleLine1, tleLine2, futureTime)
      if (position) {
        predictedPositions.push(position)
      }
    }

    // Calculate anomaly indicators
    const altitudeDrift = detectAltitudeDrift(currentPos, predictedPositions)
    const velocityAnomaly = detectVelocityAnomaly(currentPos, predictedPositions)
    const unexpectedOrbitChange = altitudeDrift || velocityAnomaly

    // Calculate orbital decay risk (based on altitude)
    const orbitalDecayRisk = calculateOrbitalDecayRisk(currentPos.altitude)

    // Calculate collision risk (simplified)
    const collisionRisk = calculateCollisionRisk(currentPos.altitude)

    return {
      currentPosition: currentPos,
      predictedPositions,
      orbitalDecayRisk,
      collisionRisk,
      anomalyIndicators: {
        unexpectedOrbitChange,
        altitudeDrift,
        velocityAnomaly,
      },
    }
  } catch (error) {
    console.error("[v0] Error predicting orbit:", error)
    return null
  }
}

function detectAltitudeDrift(current: SatellitePosition, predicted: SatellitePosition[]): boolean {
  if (predicted.length === 0) return false

  const altitudeChange = predicted[predicted.length - 1].altitude - current.altitude
  const driftRate = Math.abs(altitudeChange) / predicted.length

  // Anomaly if drifting more than 5km per prediction interval
  return driftRate > 5
}

function detectVelocityAnomaly(current: SatellitePosition, predicted: SatellitePosition[]): boolean {
  if (predicted.length === 0) return false

  const avgPredictedVelocity = predicted.reduce((sum, p) => sum + p.velocity, 0) / predicted.length
  const velocityDiff = Math.abs(current.velocity - avgPredictedVelocity)

  // Anomaly if velocity differs by more than 10% from predicted average
  return velocityDiff / current.velocity > 0.1
}

function calculateOrbitalDecayRisk(altitude: number): number {
  // Risk increases as altitude decreases below 400km
  if (altitude > 800) return 0
  if (altitude > 400) return ((800 - altitude) / 400) * 30
  if (altitude > 200) return 30 + ((400 - altitude) / 200) * 40
  return 70 + ((200 - altitude) / 200) * 30
}

function calculateCollisionRisk(altitude: number): number {
  // Higher risk in crowded orbital bands (LEO: 400-1000km)
  if (altitude < 200 || altitude > 2000) return 10
  if (altitude >= 400 && altitude <= 1000) return 60 + Math.random() * 20
  return 20 + Math.random() * 20
}

// Legacy class export for backward compatibility
export const SGP4Calculator = {
  calculatePositionFromTLE,
  predictOrbit,
}
