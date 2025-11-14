
import io from "socket.io-client";

const ML_SERVICE_URL = "http://localhost:5000";

// --- Data Interfaces ---

export interface RealTimeAnomaly {
  id: string;
  norad_id: number;
  timestamp: string;
  location: {
    lat: number;
    lon: number;
  };
  anomaly_type: string;
  severity: "low" | "medium" | "high";
  isFlagged?: boolean;
}

export interface Subframe {
  id: string;
  name: string;
  timestamp: string;
  description: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: "info" | "warning" | "error";
  message: string;
}

export interface RSO {
  id: string;
  name: string;
  threatLevel: "low" | "medium" | "high";
  status: string;
  autoencoder: number;
  isolationForest: number;
  svm: number;
  threatScore: number;
  latitude?: number;
  longitude?: number;
}

export interface DashboardData {
  header: {
    alerts: number;
    rsos: number;
    ttps: number;
    score: number;
  };
  alertsOverTime: Array<{ name: string; alerts: number }>;
  telemetryTimeline: Array<{ name: string; power: number; temp: number; comms: number }>;
  rsoClassification: Array<{ name: string; status: string; score: number }>;
  spartaMitreAlignment: Array<{ id: string; name: string; coverage: number }>;
  score: number;
  recentEvents: RealTimeAnomaly[];
  subframes: Subframe[];
  logs: LogEntry[];
  rsos: RSO[];
  anomalies: RealTimeAnomaly[];
  anomaly_count: number;
  anomaly_breakdown: Array<{ key: string; doc_count: number }>;
}

// --- Real-Time Service ---

export class RealTimeInferenceService {
  private anomalies: RealTimeAnomaly[] = [];
  private rsos: RSO[] = [];
  private logs: LogEntry[] = [];
  private subframes: Subframe[] = [];
  private anomaly_count: number = 0;
  private anomaly_breakdown: Array<{ key: string; doc_count: number }> = [];

  private onNewDataCallback: (data: DashboardData) => void = () => {};
  public socket: any = null;

  constructor() {}

  public connect() {
    if (this.socket) return;

    this.socket = io(ML_SERVICE_URL, {
      transports: ["websocket"],
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
    });

    this.socket.on("connect", () => console.log("Connected to Python ML service"));
    this.socket.on("disconnect", () => console.log("Disconnected from Python ML service"));
    this.socket.on("auth_error", (error: {message: string}) => console.error("Authentication Error:", error.message));

    this.socket.on("dashboard_data", (data: DashboardData) => {
      this.rsos = data.rsos || [];
      this.logs = data.logs || [];
      this.subframes = data.subframes || [];
      this.anomalies = data.anomalies || [];
      this.anomaly_count = data.anomaly_count || 0;
      this.anomaly_breakdown = data.anomaly_breakdown || [];
      this.emitFullDashboardData();
    });
  }

  public saveCredentials(username: string, password: string) {
    if (!this.socket) {
      console.error("Socket not connected. Call connect() first.");
      return;
    }
    this.socket.emit("save_credentials", { username, password });
  }

  public stopService() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  public onNewData(callback: (data: DashboardData) => void) {
    this.onNewDataCallback = callback;
  }

  private emitFullDashboardData() {
    const dashboardData = this.buildDashboardData();
    this.onNewDataCallback(dashboardData);
  }

  private buildDashboardData(): DashboardData {
    const score = this.calculateOverallScore();
    return {
      header: {
        alerts: this.anomaly_count,
        rsos: this.rsos.length,
        ttps: 4, // static placeholder
        score: score,
      },
      alertsOverTime: this.anomalies.slice(0, 10).map(a => ({
        name: new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        alerts: 1,
      })),
      telemetryTimeline: [], // This data isn't provided by the backend yet
      rsoClassification: this.rsos.map(rso => ({
        name: rso.name,
        status: rso.threatLevel,
        score: rso.threatScore,
      })),
      spartaMitreAlignment: [ // static placeholder
        { id: "T001", name: "Signal Jamming", coverage: 75 },
        { id: "T002", name: "GPS Spoofing", coverage: 50 },
        { id: "T003", name: "Data Exfiltration", coverage: 85 },
      ],
      score: score,
      recentEvents: this.anomalies,
      subframes: this.subframes,
      logs: this.logs,
      rsos: this.rsos,
      anomalies: this.anomalies,
      anomaly_count: this.anomaly_count,
      anomaly_breakdown: this.anomaly_breakdown,
    };
  }

  private calculateOverallScore(): number {
    if (this.anomaly_count === 0) return 0;
    const severityScores = { "low": 10, "medium": 40, "high": 80 };
    const totalScore = this.anomalies.reduce((acc, a) => {
      const severity = a.severity as keyof typeof severityScores;
      return acc + (severityScores[severity] || 0);
    }, 0);
    return Math.min(100, Math.floor(totalScore / this.anomaly_count));
  }

  public flagAnomaly(anomalyId: string) {
    const anomaly = this.anomalies.find(a => a.id === anomalyId);
    if (anomaly) {
      anomaly.isFlagged = !anomaly.isFlagged;
      this.emitFullDashboardData();
    }
  }
}
