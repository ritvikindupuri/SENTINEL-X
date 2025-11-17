
import io from "socket.io-client";

const ML_SERVICE_URL = "http://localhost:5000";

// --- Data Interfaces ---

export interface RealTimeAnomaly {
  id: string;
  satelliteName: string;
  noradId?: number;
  anomalyResult: {
    is_anomaly: boolean;
    anomaly_type: string;
    severity: "low" | "medium" | "high";
    scores: {
      autoencoder: number;
      isolationForest: number;
      svm: number;
      threatScore: number;
    }
  };
  timestamp: string;
  location: {
    latitude: number;
    longitude: number;
    altitude: number;
  };
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
}

// --- Real-Time Service ---

export class RealTimeInferenceService {
  private anomalies: RealTimeAnomaly[] = [];
  private rsos: RSO[] = [];
  private logs: LogEntry[] = [];
  private subframes: Subframe[] = [];

  private onNewDataCallback: (data: DashboardData) => void = () => {};
  private onStatusChangeCallback: (status: string) => void = () => {};
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

    this.socket.on("dashboard_data", (data: { rsos: RSO[], logs: LogEntry[], subframes: Subframe[] }) => {
      this.rsos = data.rsos || [];
      this.logs = data.logs || [];
      this.subframes = data.subframes || [];
      this.emitFullDashboardData();
    });

    this.socket.on("new_anomaly", (newAnomaly: RealTimeAnomaly) => {
      console.log("Received new anomaly:", newAnomaly);
      if (!this.anomalies.some(a => a.id === newAnomaly.id)) {
        this.anomalies = [newAnomaly, ...this.anomalies.slice(0, 49)];
      }
    });

    this.socket.on("processing_status", (data: { status: string }) => {
        this.onStatusChangeCallback(data.status);
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

  public onStatusChange(callback: (status: string) => void) {
    this.onStatusChangeCallback = callback;
  }

  private emitFullDashboardData() {
    const dashboardData = this.buildDashboardData();
    this.onNewDataCallback(dashboardData);
  }

  private buildDashboardData(): DashboardData {
    const score = this.calculateOverallScore();
    return {
      header: {
        alerts: this.anomalies.length,
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
    };
  }

  private calculateOverallScore(): number {
    if (this.anomalies.length === 0) return 0;
    const severityScores = { "low": 10, "medium": 40, "high": 80 };
    const totalScore = this.anomalies.reduce((acc, a) => {
      const severity = a.anomalyResult?.severity as keyof typeof severityScores;
      return acc + (severityScores[severity] || 0);
    }, 0);
    return Math.min(100, Math.floor(totalScore / this.anomalies.length));
  }

  public flagAnomaly(anomalyId: string) {
    const anomaly = this.anomalies.find(a => a.id === anomalyId);
    if (anomaly) {
      anomaly.isFlagged = !anomaly.isFlagged;
      this.emitFullDashboardData();
    }
  }
}
