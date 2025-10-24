"use server"

// Server Actions for Space-Track API - Keeps credentials secure on the server
export interface SatelliteData {
  id: string
  name: string
  latitude: number
  longitude: number
  altitude: number
  velocity: number
  timestamp: string
  status: "operational" | "maintenance" | "anomalous"
  telemetry: {
    temperature: number
    power: number
    communication: number
    orientation: {
      roll: number
      pitch: number
      yaw: number
    }
  }
  noradId?: number
  tle?: {
    line1: string
    line2: string
  }
}

export interface SpaceWeatherData {
  solarFlareActivity: number
  geomagneticStorm: number
  radiationLevel: number
  timestamp: string
  alerts: string[]
  events: SpaceWeatherEvent[]
}

export interface SpaceWeatherEvent {
  eventType: string
  eventTime: string
  catalog: string
  instruments: string[]
  description: string
}

export async function fetchSatellitePositions(): Promise<SatelliteData[]> {
  try {
    const spaceTrackUsername = process.env.SPACE_TRACK_USERNAME
    const spaceTrackPassword = process.env.SPACE_TRACK_PASSWORD

    if (!spaceTrackUsername || !spaceTrackPassword) {
      console.error("[v0] [Server] Space-Track credentials not configured")
      return []
    }

    console.log("[v0] [Server] Fetching satellite TLE data from Space-Track.org...")

    // Authenticate with Space-Track
    const authResponse = await fetch("https://www.space-track.org/ajaxauth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `identity=${encodeURIComponent(spaceTrackUsername)}&password=${encodeURIComponent(spaceTrackPassword)}`,
    })

    if (!authResponse.ok) {
      console.error("[v0] [Server] Space-Track authentication failed")
      return []
    }

    const cookies = authResponse.headers.get("set-cookie")

    // Fetch TLE data for ISS and other satellites
    const satelliteIds = [25544, 28654, 39084, 25994, 27424, 39634, 41866, 20580, 40697, 40115]

    const tleResponse = await fetch(
      `https://www.space-track.org/basicspacedata/query/class/tle_latest/NORAD_CAT_ID/${satelliteIds.join(",")}/orderby/NORAD_CAT_ID/format/json`,
      {
        headers: {
          Cookie: cookies || "",
        },
      },
    )

    if (!tleResponse.ok) {
      console.error("[v0] [Server] Failed to fetch TLE data from Space-Track")
      return []
    }

    const tleData = await tleResponse.json()
    const satellites: SatelliteData[] = []

    if (Array.isArray(tleData)) {
      tleData.forEach((tle: any) => {
        const satellite = parseSpaceTrackTLE(tle)
        satellites.push(satellite)
      })
    }

    console.log(`[v0] [Server] Successfully fetched ${satellites.length} satellite positions from Space-Track`)
    return satellites
  } catch (error) {
    console.error("[v0] [Server] Error fetching satellite data:", error)
    return []
  }
}

function parseSpaceTrackTLE(tle: any): SatelliteData {
  const line1 = tle.TLE_LINE1
  const line2 = tle.TLE_LINE2
  const noradId = Number.parseInt(tle.NORAD_CAT_ID)
  const name = tle.OBJECT_NAME

  const inclination = Number.parseFloat(line2.substring(8, 16))
  const raan = Number.parseFloat(line2.substring(17, 25))
  const argPerigee = Number.parseFloat(line2.substring(34, 42))
  const meanAnomaly = Number.parseFloat(line2.substring(43, 51))
  const meanMotion = Number.parseFloat(line2.substring(52, 63))

  const lat = Math.sin((inclination * Math.PI) / 180) * Math.sin((meanAnomaly * Math.PI) / 180) * 90
  const lng = ((raan + argPerigee + meanAnomaly) % 360) - 180
  const altitude = Math.pow(398600.4418 / ((meanMotion * 2 * Math.PI) / 86400), 2 / 3) - 6371
  const velocity = (meanMotion * 2 * Math.PI * (6371 + altitude)) / 86400 / 1000

  // Generate more realistic telemetry data
  const sunAngle = Math.cos(((new Date().getUTCHours() * 15 + lng) * Math.PI) / 180);
  const power = 80 + sunAngle * 20 + Math.random() * 5; // Power generation depends on sun angle
  const temperature = 20 + sunAngle * 30 - altitude / 100 + (Math.random() - 0.5) * 10; // Temperature depends on sun angle and altitude
  const communication = 90 + Math.random() * 10; // Assume stable communication for now

  return {
    id: `sat_${noradId}`,
    name: name,
    latitude: Math.max(-90, Math.min(90, lat)),
    longitude: lng,
    altitude: Math.max(200, altitude),
    velocity: Math.max(5, Math.min(10, velocity)),
    timestamp: new Date().toISOString(),
    status: "operational",
    telemetry: {
      temperature: temperature,
      power: power,
      communication: communication,
      orientation: {
        roll: (argPerigee + meanAnomaly) % 360,
        pitch: inclination,
        yaw: raan % 360,
      },
    },
    noradId,
    tle: {
      line1: line1,
      line2: line2,
    },
  }
}
