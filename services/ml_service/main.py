
import os
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"

import requests
import time
from datetime import datetime, timedelta, timezone
from sgp4.api import Satrec, jday
import numpy as np
import random
import tensorflow as tf
from sklearn.svm import OneClassSVM
from sklearn.ensemble import IsolationForest
from flask import Flask
from flask_socketio import SocketIO, emit
import threading

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# --- Global State & Configuration ---
SPACETRACK_URL = "https://www.space-track.org"
session = requests.Session()
data_thread = None
stop_thread = threading.Event()
thread_lock = threading.Lock()

# In-memory data stores
anomalies_detected = []
monitored_satellites = []
telemetry_data_store = {}
norad_ids = ["25544", "28654", "36516", "33591", "43135"] # ISS, Hubble, etc.
satellite_models = {}

# --- ML Model Initialization ---
def create_autoencoder(input_dim):
    input_layer = tf.keras.layers.Input(shape=(input_dim,))
    encoded = tf.keras.layers.Dense(16, activation="relu")(input_layer)
    encoded = tf.keras.layers.Dense(8, activation="relu")(encoded)
    decoded = tf.keras.layers.Dense(8, activation="relu")(encoded)
    decoded = tf.keras.layers.Dense(16, activation="relu")(decoded)
    decoded = tf.keras.layers.Dense(input_dim, activation="linear")(decoded)
    autoencoder = tf.keras.Model(inputs=input_layer, outputs=decoded)
    autoencoder.compile(optimizer="adam", loss="mean_squared_error")
    return autoencoder

# --- Data Fetching & Processing ---
def login_spacetrack(username, password):
    login_url = f"{SPACETRACK_URL}/ajaxauth/login"
    payload = {'identity': username, 'password': password}
    try:
        resp = session.post(login_url, data=payload)
        resp.raise_for_status()
        if resp.text == '"logged in"':
            print("Successfully logged into Space-Track.")
            return True
        else:
            print(f"Space-Track login failed: {resp.text}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"Error connecting to Space-Track: {e}")
        return False

def get_tle_data(norad_ids):
    tle_url = f"{SPACETRACK_URL}/basicspacedata/query/class/tle_latest/ORDINAL/1/NORAD_CAT_ID/{','.join(norad_ids)}/format/tle"
    try:
        resp = session.get(tle_url)
        resp.raise_for_status()
        return resp.text.strip().split('\n')
    except requests.exceptions.RequestException as e:
        print(f"Failed to fetch TLE data: {e}")
        return []

def parse_tle_and_create_sats(tle_lines):
    sats = {}
    for i in range(0, len(tle_lines), 2):
        line1 = tle_lines[i]
        line2 = tle_lines[i+1]
        norad_id = line2[2:7].strip()
        try:
            satellite = Satrec.twoline2rv(line1, line2)
            sats[norad_id] = {
                "satrec": satellite,
                "name": f"SAT-{norad_id}",
                "line1": line1,
                "line2": line2
            }
        except Exception as e:
            print(f"Error parsing TLE for NORAD ID {norad_id}: {e}")
    return sats

def get_satellite_position(satrec):
    now = datetime.now(timezone.utc)
    jd, fr = jday(now.year, now.month, now.day, now.hour, now.minute, now.second)
    error, position, velocity = satrec.sgp4(jd, fr)
    if error == 0:
        return position, velocity
    return None, None

def convert_satellite_to_telemetry(satellite, position, velocity):
    # Simulate realistic telemetry based on orbital data
    altitude = np.linalg.norm(position) - 6371
    speed = np.linalg.norm(velocity)

    # Simulate power based on orbit (e.g., lower power in eclipse)
    power = 100 - (altitude / 1000) * 5 + random.uniform(-2, 2)
    # Simulate temperature based on sun exposure (crude approximation)
    temperature = 25 + (position[0] / 7000) * 20 + random.uniform(-5, 5)

    return {
        "altitude": altitude,
        "velocity": speed,
        "power": power,
        "temperature": temperature,
        "fuel_level": random.uniform(80, 100),
        "payload_status": 1, # 1 for nominal, 0 for off
        "cpu_usage": random.uniform(20, 50),
        "memory_usage": random.uniform(40, 60),
    }

# --- ML Model Functions ---
def train_models(sats):
    global satellite_models
    print("Starting model training for all satellites...")

    for norad_id, sat_info in sats.items():
        print(f"Generating training data for satellite {norad_id}...")
        training_data = []
        for _ in range(2000):  # Generate a rich dataset for each satellite
            pos, vel = get_satellite_position(sat_info["satrec"])
            if pos and vel:
                telemetry = convert_satellite_to_telemetry(sat_info, pos, vel)
                training_data.append(list(telemetry.values()))

        if not training_data:
            print(f"Failed to generate training data for {norad_id}. Skipping.")
            continue

        print(f"Training models for satellite {norad_id}...")
        features = np.array(training_data)
        mean = np.mean(features, axis=0)
        std = np.std(features, axis=0)
        normalized_features = (features - mean) / (std + 1e-8)

        # Create a new set of models for this specific satellite
        autoencoder = create_autoencoder(features.shape[1])
        iso_forest = IsolationForest(n_estimators=100, contamination=0.05, random_state=42)
        svm = OneClassSVM(nu=0.05, kernel="rbf", gamma="scale")

        # Add noise to prevent overfitting
        noise_factor = 0.05
        noisy_features = normalized_features + noise_factor * np.random.normal(loc=0.0, scale=1.0, size=normalized_features.shape)

        # Train the models
        autoencoder.fit(noisy_features, normalized_features, epochs=50, batch_size=32, verbose=0)
        iso_forest.fit(normalized_features)
        svm.fit(normalized_features)

        # Store the trained models and normalization stats
        satellite_models[norad_id] = {
            "autoencoder": autoencoder,
            "isolation_forest": iso_forest,
            "svm": svm,
            "stats": {"mean": mean, "std": std}
        }
        print(f"Models for satellite {norad_id} trained successfully.")

def run_anomaly_detection(telemetry, satellite, norad_id):
    if norad_id not in satellite_models:
        print(f"No models found for satellite {norad_id}. Skipping anomaly detection.")
        return {"is_anomaly": False, "scores": {
            "autoencoder": 100, "isolationForest": 100, "svm": 100, "threatScore": 100
        }}

    models = satellite_models[norad_id]
    stats = models["stats"]
    features = np.array([list(telemetry.values())])
    normalized_features = (features - stats['mean']) / (stats['std'] + 1e-8)

    # Autoencoder
    reconstruction = models["autoencoder"].predict(normalized_features, verbose=0)
    reconstruction_error = np.mean(np.square(normalized_features - reconstruction))
    ae_score = 100 * (1 - min(reconstruction_error / 0.01, 1))

    # Isolation Forest
    if_score_raw = models["isolation_forest"].decision_function(normalized_features)[0]
    if_score = 100 * (1 - min(max(-if_score_raw, 0), 1))

    # One-Class SVM
    svm_score_raw = models["svm"].decision_function(normalized_features)[0]
    svm_score = 100 * (1 - min(max(-svm_score_raw, 0), 1))

    avg_score = (ae_score + if_score + svm_score) / 3

    is_anomaly = avg_score < 75 # Anomaly if avg score is below 75

    if is_anomaly:
        return {
            "is_anomaly": True,
            "anomaly_type": "Multi-Factor Anomaly",
            "severity": "high" if avg_score < 50 else "medium",
            "scores": {
                "autoencoder": ae_score,
                "isolationForest": if_score,
                "svm": svm_score,
                "threatScore": avg_score
            }
        }
    return {"is_anomaly": False, "scores": {
         "autoencoder": ae_score,
         "isolationForest": if_score,
         "svm": svm_score,
         "threatScore": avg_score
    }}

# --- Data Generation Loop ---
def data_generation_loop():
    while not stop_thread.is_set():
        with thread_lock:
            if not monitored_satellites:
                print("No satellites to monitor. Stopping data generation.")
                break

            current_dashboard_data = { "rsos": [], "logs": [], "subframes": [] }

            for sat_info in monitored_satellites:
                norad_id = sat_info['noradId']
                satrec = sat_info['satrec']

                position, velocity = get_satellite_position(satrec)
                if position is None:
                    continue

                lat, lon, alt = get_lat_lon_alt(position, satrec.epoch)
                sat_info['latitude'] = lat
                sat_info['longitude'] = lon
                sat_info['altitude'] = alt

                telemetry = convert_satellite_to_telemetry(sat_info, position, velocity)
                telemetry_data_store[norad_id] = telemetry

                anomaly_result = run_anomaly_detection(telemetry, sat_info, norad_id)

                rso_data = {
                    "id": norad_id,
                    "name": sat_info['name'],
                    "threatLevel": "low",
                    "status": "Nominal",
                    **anomaly_result['scores']
                }

                if anomaly_result["is_anomaly"]:
                    anomaly_id = f"anomaly_{norad_id}_{int(time.time())}"
                    new_anomaly = {
                        "id": anomaly_id,
                        "satelliteName": sat_info['name'],
                        "noradId": norad_id,
                        "anomalyResult": anomaly_result,
                        "timestamp": datetime.utcnow().isoformat() + "Z",
                        "location": {"latitude": lat, "longitude": lon, "altitude": alt},
                        "isFlagged": False
                    }
                    anomalies_detected.append(new_anomaly)
                    socketio.emit('new_anomaly', new_anomaly)
                    rso_data["threatLevel"] = anomaly_result.get("severity", "medium")
                    rso_data["status"] = anomaly_result.get("anomaly_type", "Anomaly")

                current_dashboard_data["rsos"].append(rso_data)

            socketio.emit('dashboard_data', current_dashboard_data)
        socketio.sleep(5) # Emit data every 5 seconds
    print("Data generation loop has stopped.")


# --- WebSocket Handlers ---
@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

@socketio.on('save_credentials')
def handle_save_credentials(data):
    global data_thread
    username = data.get('username')
    password = data.get('password')

    print("Received credentials, stopping existing data thread if running.")
    stop_thread.set()
    if data_thread is not None:
        data_thread.join()

    # Use mock data if dummy user is provided
    if username == 'dummy_user':
        print("Using mock TLE data for dummy user.")
        tle_lines = get_mock_tle_data()
    else:
        if not login_spacetrack(username, password):
            emit('auth_error', {'message': 'Invalid Space-Track credentials.'})
            return
        tle_lines = get_tle_data(norad_ids)

    if not tle_lines:
        print("No TLE data found.")
        return

    sats = parse_tle_and_create_sats(tle_lines)
    train_models(sats)
    with thread_lock:
        monitored_satellites.clear()
        for norad_id, sat_data in sats.items():
             monitored_satellites.append({
                "noradId": norad_id,
                "name": sat_data['name'],
                "satrec": sat_data['satrec']
            })

    print(f"Starting data generation for {len(monitored_satellites)} satellites.")
    stop_thread.clear()
    data_thread = threading.Thread(target=data_generation_loop)
    data_thread.start()


# --- Utility Functions ---
def get_lat_lon_alt(position_km, time_jd):
    """Converts ECI coordinates to latitude, longitude, and altitude."""
    # This is a simplified conversion and has limitations
    GMST = 18.697374558 + 24.06570982441908 * (time_jd.jd1 - 2451545.0)
    GMST = (GMST % 24) * 15 # degrees

    x, y, z = position_km
    r = np.sqrt(x**2 + y**2 + z**2)

    lon_rad = np.arctan2(y, x) - np.deg2rad(GMST)
    lat_rad = np.arcsin(z / r)

    lon = np.rad2deg(lon_rad)
    lat = np.rad2deg(lat_rad)

    # Altitude above a spherical Earth
    alt = r - 6371 # WGS84 radius

    return lat, lon, alt

def get_mock_tle_data():
    return [
        "1 25544U 98067A   24303.58555627  .00007889  00000+0  14759-3 0  9999",
        "2 25544  51.6416 251.2995 0006753  62.1192  28.0003 15.49511256423455",
        "1 28654U 05016A   24303.44747517  .00001828  00000+0  36328-4 0  9997",
        "2 28654  28.5381  90.4932 0001453 239.3335 120.7302 15.06421921 21321"
    ]


if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, allow_unsafe_werkzeug=True)
