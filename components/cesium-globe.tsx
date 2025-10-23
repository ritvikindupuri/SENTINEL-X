"use client"

import { useEffect, useRef, useState } from "react"

interface Anomaly {
  satelliteId: string
  coordinates: { lat: number; lng: number; alt: number }
  severity: string
  anomalyType: string
}

interface CesiumGlobeProps {
  anomalies: Anomaly[]
}

export function CesiumGlobe({ anomalies }: CesiumGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return

    const loadCesiumFromCDN = () => {
      return new Promise((resolve, reject) => {
        // Check if Cesium is already loaded
        if ((window as any).Cesium) {
          resolve((window as any).Cesium)
          return
        }

        // Load Cesium CSS
        const link = document.createElement("link")
        link.rel = "stylesheet"
        link.href = "https://cesium.com/downloads/cesiumjs/releases/1.109/Build/Cesium/Widgets/widgets.css"
        document.head.appendChild(link)

        // Load Cesium JS
        const script = document.createElement("script")
        script.src = "https://cesium.com/downloads/cesiumjs/releases/1.109/Build/Cesium/Cesium.js"
        script.async = true
        script.onload = () => {
          if ((window as any).Cesium) {
            resolve((window as any).Cesium)
          } else {
            reject(new Error("Cesium failed to load"))
          }
        }
        script.onerror = () => reject(new Error("Failed to load Cesium script"))
        document.head.appendChild(script)
      })
    }

    const initializeCesium = async () => {
      try {
        const Cesium = await loadCesiumFromCDN()

        // Check if token is set
        const token = process.env.NEXT_PUBLIC_CESIUM_TOKEN
        if (!token || token === "your-cesium-token-here") {
          setError("Cesium token not configured. Please add NEXT_PUBLIC_CESIUM_TOKEN to environment variables.")
          setIsLoading(false)
          return
        }
        // Set Cesium ion access token
        ;(Cesium as any).Ion.defaultAccessToken = token

        if (!viewerRef.current && containerRef.current) {
          viewerRef.current = new (Cesium as any).Viewer(containerRef.current, {
            baseLayerPicker: false,
            geocoder: false,
            homeButton: false,
            sceneModePicker: false,
            navigationHelpButton: false,
            animation: false,
            timeline: false,
            fullscreenButton: false,
            vrButton: false,
            imageryProvider: new (Cesium as any).IonImageryProvider({ assetId: 3845 }),
          })

          // Set initial camera position
          viewerRef.current.camera.setView({
            destination: (Cesium as any).Cartesian3.fromDegrees(0, 0, 20000000),
          })

          // Enable camera rotation
          viewerRef.current.scene.globe.enableLighting = true

          // Add anomalies as entities
          anomalies.forEach((anomaly) => {
            const color =
              anomaly.severity === "critical"
                ? (Cesium as any).Color.RED
                : anomaly.severity === "high"
                  ? (Cesium as any).Color.ORANGE
                  : anomaly.severity === "medium"
                    ? (Cesium as any).Color.YELLOW
                    : (Cesium as any).Color.GREEN

            viewerRef.current.entities.add({
              position: (Cesium as any).Cartesian3.fromDegrees(
                anomaly.coordinates.lng,
                anomaly.coordinates.lat,
                anomaly.coordinates.alt * 1000,
              ),
              point: {
                pixelSize: 10,
                color: color,
                outlineColor: (Cesium as any).Color.WHITE,
                outlineWidth: 2,
              },
              label: {
                text: anomaly.satelliteId,
                font: "12px sans-serif",
                fillColor: (Cesium as any).Color.WHITE,
                outlineColor: (Cesium as any).Color.BLACK,
                outlineWidth: 2,
                style: (Cesium as any).LabelStyle.FILL_AND_OUTLINE,
                verticalOrigin: (Cesium as any).VerticalOrigin.BOTTOM,
                pixelOffset: new (Cesium as any).Cartesian2(0, -15),
              },
              description: `
                <div style="padding: 10px;">
                  <h3 style="margin: 0 0 10px 0;">${anomaly.satelliteId}</h3>
                  <p><strong>Type:</strong> ${anomaly.anomalyType}</p>
                  <p><strong>Severity:</strong> ${anomaly.severity}</p>
                  <p><strong>Location:</strong> ${anomaly.coordinates.lat.toFixed(2)}°, ${anomaly.coordinates.lng.toFixed(2)}°</p>
                  <p><strong>Altitude:</strong> ${anomaly.coordinates.alt.toFixed(0)} km</p>
                </div>
              `,
            })
          })

          setIsLoading(false)
        }
      } catch (err) {
        console.error("[v0] Cesium initialization error:", err)
        setError(err instanceof Error ? err.message : "Failed to initialize Cesium")
        setIsLoading(false)
      }
    }

    initializeCesium()

    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy()
        viewerRef.current = null
      }
    }
  }, [anomalies])

  if (error) {
    return (
      <div className="relative w-full h-full bg-[#1a1d2e] rounded-lg flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-red-400 text-lg mb-4">⚠️ Cesium Globe Unavailable</div>
          <div className="text-gray-400 text-sm mb-4">{error}</div>
          <div className="text-xs text-gray-500">
            To enable the 3D globe:
            <br />
            1. Get a free token from{" "}
            <a
              href="https://cesium.com/ion"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 underline"
            >
              cesium.com/ion
            </a>
            <br />
            2. Add it to the <strong>Vars</strong> section in the sidebar
            <br />
            3. Variable name: <code className="bg-gray-800 px-2 py-1 rounded">NEXT_PUBLIC_CESIUM_TOKEN</code>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="relative w-full h-full bg-[#1a1d2e] rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <div className="text-gray-300">Loading Cesium Globe...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full rounded-lg overflow-hidden" />
      <div className="absolute top-4 left-4 bg-black/70 text-white px-4 py-2 rounded text-sm">
        <div className="font-bold text-cyan-400 text-2xl mb-1">{anomalies.length}</div>
        <div className="text-xs text-gray-300">Active Anomalies</div>
      </div>
    </div>
  )
}
