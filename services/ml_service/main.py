from flask import Flask
from flask_socketio import SocketIO, emit
import tensorflow as tf
from sklearn.ensemble import IsolationForest
import numpy as np
import random
from datetime import datetime, timedelta

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

# In-memory data stores
time_series_buffer = []
TIME_SERIES_LENGTH = 10
anomalies_detected = []
monitored_satellites = []

# Load or define ML models
def create_autoencoder(input_dim):
    input_layer = tf.keras.layers.Input(shape=(input_dim,))
    encoded = tf.keras.layers.Dense(16, activation="relu")(input_layer)
    encoded = tf.keras.layers.Dense(8, activation="relu")(encoded)
    encoded = tf.keras.layers.Dense(4, activation="relu")(encoded)
    decoded = tf.keras.layers.Dense(8, activation="relu")(encoded)
    decoded = tf.keras.layers.Dense(16, activation="relu")(decoded)
    decoded = tf.keras.layers.Dense(input_dim, activation="linear")(decoded)
    autoencoder = tf.keras.Model(inputs=input_layer, outputs=decoded)
    autoencoder.compile(optimizer="adam", loss="mean_squared_error")
    return autoencoder

autoencoder_model = create_autoencoder(8)
isolation_forest_model = IsolationForest(n_estimators=100, contamination='auto', random_state=42)

normalized_stats = {
    'mean': np.zeros(8),
    'std': np.ones(8),
}

def _generate_subframes(telemetry):
    subframes = []
    for i, (key, value) in enumerate(telemetry.items()):
        subframes.append({
            "id": f"sf_{i}",
            "name": key.replace("_", " ").title(),
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "description": f"{key.replace('_', ' ').title()}: {value:.2f}",
        })
    return subframes

def _generate_logs():
    logs = []
    for anomaly in anomalies_detected:
        logs.append({
            "id": f"log_{anomaly['id']}",
            "timestamp": anomaly['timestamp'],
            "level": "warning" if anomaly['severity'] in ["medium", "high"] else "error",
            "message": f"Anomaly detected on {anomaly['satelliteName']}: {anomaly['anomaly_type']}",
        })
    return logs

def _generate_rsos():
    rsos = []
    for sat in monitored_satellites:
        rsos.append({
            "id": f"rso_{sat['noradId']}",
            "name": sat['name'],
            "type": "satellite",
            "threatLevel": "low", # Placeholder
            "orbit": "LEO", # Placeholder
        })
    return rsos

def train_models_on_data(training_data):
    """Trains the ML models on the provided data."""
    print("Training models on provided data...")
    features = np.array([list(d.values()) for d in training_data])

    mean = np.mean(features, axis=0)
    std = np.std(features, axis=0)
    normalized_stats['mean'] = mean
    normalized_stats['std'] = std
    normalized_features = (features - mean) / (std + 1e-8)

    autoencoder_model.fit(normalized_features, normalized_features, epochs=50, batch_size=32, verbose=0)
    isolation_forest_model.fit(normalized_features)
    print("Models trained successfully on provided data")

@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

@socketio.on('get_dashboard_data')
def handle_get_dashboard_data(json):
    telemetry = json.get('telemetry', {})
    emit('dashboard_data', {
        "subframes": _generate_subframes(telemetry),
        "logs": _generate_logs(),
        "rsos": _generate_rsos(),
    })

@socketio.on('train')
def handle_train_event(json):
    print('Received training data')
    training_data = json.get('data')
    monitored_satellites.extend(json.get('satellites', []))
    if training_data:
        train_models_on_data(training_data)

@socketio.on('predict')
def handle_predict_event(json):
    telemetry = json.get('telemetry')
    satellite = json.get('satellite')
    if not telemetry:
        return

    features = np.array([list(telemetry.values())])
    normalized_features = (features - normalized_stats['mean']) / (normalized_stats['std'] + 1e-8)

    reconstruction = autoencoder_model.predict(normalized_features)
    reconstruction_error = np.mean(np.square(normalized_features - reconstruction))
    if_score = isolation_forest_model.decision_function(normalized_features)

    is_anomaly = reconstruction_error > 0.5 or if_score[0] < 0

    anomaly_type = "Unknown"
    severity = "low"
    if is_anomaly:
        power = telemetry.get('power', 100)
        temp = telemetry.get('temperature', 25)
        if power < 70:
            anomaly_type = "Power System Degradation"
            severity = "high" if power < 50 else "medium"
        elif temp > 60 or temp < -10:
            anomaly_type = "Thermal Anomaly"
            severity = "critical" if temp > 80 or temp < -20 else "medium"
        else:
            anomaly_type = "Sensor Malfunction"
            severity = "high"

        anomaly = {
            "id": f"anomaly_{len(anomalies_detected)}",
            "satelliteName": satellite['name'],
            "anomaly_type": anomaly_type,
            "severity": severity,
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }
        anomalies_detected.append(anomaly)

    emit('prediction_result', {
        'is_anomaly': bool(is_anomaly),
        'anomaly_type': anomaly_type,
        'severity': severity,
    })

if __name__ == '__main__':
    socketio.run(app, debug=True)
