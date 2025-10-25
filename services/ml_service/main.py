
import os
import logging
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"

logging.basicConfig(level=logging.INFO)

from flask import Flask
from flask_socketio import SocketIO, emit
import tensorflow as tf
from sklearn.svm import OneClassSVM
from sklearn.ensemble import IsolationForest
import numpy as np
import random
from datetime import datetime, timedelta
import threading

app = Flask(__name__)
logging.info("Flask app created.")
socketio = SocketIO(app, cors_allowed_origins="*")
logging.info("SocketIO initialized.")

# Thread lock for safe data access
lock = threading.Lock()
logging.info("Thread lock initialized.")

# In-memory data stores
anomalies_detected = []
monitored_satellites = []
telemetry_data_store = []

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

logging.info("Creating Autoencoder model...")
autoencoder_model = create_autoencoder(8)
logging.info("Autoencoder model created.")
logging.info("Creating Isolation Forest model...")
isolation_forest_model = IsolationForest(n_estimators=100, contamination='auto', random_state=42)
logging.info("Isolation Forest model created.")
logging.info("Creating SVM model...")
svm_model = OneClassSVM(nu=0.1, kernel="rbf", gamma=0.1)
logging.info("SVM model created.")

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
    with lock:
        for anomaly in anomalies_detected:
            logs.append({
                "id": f"log_{anomaly['id']}",
                "timestamp": anomaly['timestamp'],
                "level": "warning" if anomaly.get('severity') in ["medium", "high"] else "error",
                "message": f"Anomaly detected on {anomaly.get('satelliteName', 'Unknown')}: {anomaly.get('anomaly_type', 'Unknown')}",
            })
    return logs

def _generate_rsos(telemetry):
    rsos = []
    with lock:
        for sat in monitored_satellites:
            threat_level = "low"
            if anomalies_detected:
                latest_anomaly = anomalies_detected[-1]
                if latest_anomaly['satelliteName'] == sat['name']:
                    threat_level = latest_anomaly['severity']

            rsos.append({
                "id": f"rso_{sat['noradId']}",
                "name": sat['name'],
                "type": "satellite",
                "threatLevel": threat_level,
                "orbit": telemetry.get('orbit', 'LEO'),
            })
    return rsos

def _generate_sparta_mitre_alignment():
    sparta_ttp_mapping = {
        "Power System Degradation": ["T001", "T005"],
        "Thermal Anomaly": ["T002", "T006"],
        "Sensor Malfunction": ["T003", "T007"],
        "Data Exfiltration": ["T004", "T008"],
    }

    alignment = {
        "T001": {"name": "On-board Power System Disruption", "coverage": 0},
        "T002": {"name": "Thermal System Disruption", "coverage": 0},
        "T003": {"name": "Sensor Data Manipulation", "coverage": 0},
        "T004": {"name": "Data Exfiltration from Satellite", "coverage": 0},
        "T005": {"name": "Power Supply Interference", "coverage": 0},
        "T006": {"name": "Heating/Cooling System Attack", "coverage": 0},
        "T007": {"name": "Sensor Calibration Attack", "coverage": 0},
        "T008": {"name": "Unauthorized Data Transmission", "coverage": 0},
    }

    with lock:
        for anomaly in anomalies_detected:
            anomaly_type = anomaly.get('anomaly_type')
            if anomaly_type in sparta_ttp_mapping:
                for ttp_id in sparta_ttp_mapping[anomaly_type]:
                    if ttp_id in alignment:
                        alignment[ttp_id]["coverage"] = min(100, alignment[ttp_id]["coverage"] + 25) # Increment coverage

    return [{"id": key, **value} for key, value in alignment.items()]

def train_models_on_data(training_data):
    """Trains the ML models on the provided data."""
    print("Training models on provided data...")
    with lock:
        features = np.array([list(d.values()) for d in training_data])

        mean = np.mean(features, axis=0)
        std = np.std(features, axis=0)
        normalized_stats['mean'] = mean
        normalized_stats['std'] = std
        normalized_features = (features - mean) / (std + 1e-8)

        autoencoder_model.fit(normalized_features, normalized_features, epochs=50, batch_size=32, verbose=0)
        isolation_forest_model.fit(normalized_features)
        svm_model.fit(normalized_features)
    print("Models trained successfully on provided data")

def background_training_thread():
    """Periodically retrains the models."""
    while True:
        socketio.sleep(3600)  # 1 hour
        print("Starting periodic model retraining...")
        with lock:
            if len(telemetry_data_store) > 100: # Retrain if we have enough new data
                train_models_on_data(telemetry_data_store)
                telemetry_data_store.clear() # Clear after training

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
        "rsos": _generate_rsos(telemetry),
        "spartaMitreAlignment": _generate_sparta_mitre_alignment(),
    })

@socketio.on('train')
def handle_train_event(json):
    print('Received training data')
    training_data = json.get('data')
    with lock:
        monitored_satellites.extend(json.get('satellites', []))
        if training_data:
            telemetry_data_store.extend(training_data)
            train_models_on_data(training_data)

    # Start the background training thread if it hasn't been started
    if not hasattr(app, 'training_thread_started'):
        threading.Thread(target=background_training_thread).start()
        app.training_thread_started = True

@socketio.on('manual_alert')
def handle_manual_alert(json):
    print('Received manual alert: ', json)
    with lock:
        anomaly_result = json.get('anomalyResult', {})
        anomaly = {
            "id": json.get('id'),
            "satelliteName": json.get('satelliteName'),
            "anomaly_type": anomaly_result.get('anomaly_type'),
            "severity": anomaly_result.get('severity'),
            "timestamp": json.get('timestamp'),
        }
        anomalies_detected.append(anomaly)
    emit('new_anomaly', json, broadcast=True)

@socketio.on('predict')
def handle_predict_event(json):
    telemetry = json.get('telemetry')
    satellite = json.get('satellite')
    if not telemetry:
        return

    with lock:
        features = np.array([list(telemetry.values())])
        normalized_features = (features - normalized_stats['mean']) / (normalized_stats['std'] + 1e-8)

        reconstruction = autoencoder_model.predict(normalized_features)
        reconstruction_error = np.mean(np.square(normalized_features - reconstruction))
        if_score = isolation_forest_model.decision_function(normalized_features)
        svm_score = svm_model.decision_function(normalized_features)

    is_anomaly = reconstruction_error > 0.5 or if_score[0] < 0 or svm_score[0] < 0

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

        anomaly_id = f"anomaly_{len(anomalies_detected)}_{datetime.utcnow().timestamp()}"
        anomaly = {
            "id": anomaly_id,
            "satelliteName": satellite['name'],
            "anomaly_type": anomaly_type,
            "severity": severity,
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }
        anomalies_detected.append(anomaly)

        frontend_anomaly = {
            'id': anomaly_id,
            'satelliteName': satellite.get('name', 'Unknown'),
            'noradId': satellite.get('noradId'),
            'anomalyResult': {
                'anomaly_type': anomaly_type,
                'severity': severity,
                'reconstruction_error': reconstruction_error,
                'if_score': if_score[0],
                'svm_score': svm_score[0],
            },
            'timestamp': anomaly['timestamp'],
            'location': {
                'latitude': satellite.get('latitude', 0),
                'longitude': satellite.get('longitude', 0),
                'altitude': satellite.get('altitude', 0),
            },
            'isFlagged': False,
        }
        emit('new_anomaly', frontend_anomaly, broadcast=True)

if __name__ == '__main__':
    logging.info("Starting server...")
    socketio.run(app, host='0.0.0.0', port=5000)
