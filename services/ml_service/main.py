
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
import requests
import time
from math import sin, cos, pi, pow, atan2, sqrt
from sgp4.api import Satrec, jday

app = Flask(__name__)
logging.info("Flask app created.")
socketio = SocketIO(app, cors_allowed_origins="*")
logging.info("SocketIO initialized.")

# Thread lock for safe data access
lock = threading.Lock()
logging.info("Thread lock initialized.")

# In-memory storage for credentials
space_track_credentials = {}

def parse_space_track_tle(tle):
    line1 = tle['TLE_LINE1']
    line2 = tle['TLE_LINE2']
    norad_id = int(tle['NORAD_CAT_ID'])
    name = tle['OBJECT_NAME']

    satellite = Satrec.twoline2rv(line1, line2)
    now = datetime.utcnow()
    jd, fr = jday(now.year, now.month, now.day, now.hour, now.minute, now.second)

    e, r, v = satellite.sgp4(jd, fr)

    if e != 0:
        logging.error(f"SGP4 propagation error {e} for NORAD ID {norad_id}")
        return None

    # Earth-centered inertial (ECI) coordinates to latitude, longitude, altitude
    x, y, z = r
    vx, vy, vz = v

    # Constants for conversion
    a = 6378.137  # Earth's equatorial radius in km
    f = 1 / 298.257223563 # WGS84 flattening
    e2 = 2*f - f*f

    # Convert ECI to ECEF (this is a simplified conversion)
    # A proper conversion accounts for Earth's rotation, but this is a common approximation.
    lon = atan2(y, x)

    # Iteratively calculate latitude
    lat = atan2(z, sqrt(x*x + y*y))
    lat_prev = lat + 1
    while abs(lat - lat_prev) > 1e-9:
        lat_prev = lat
        C = 1 / sqrt(1 - e2 * sin(lat)**2)
        lat = atan2(z + a * C * e2 * sin(lat), sqrt(x*x + y*y))

    # Calculate altitude
    N = a / sqrt(1 - e2 * sin(lat)**2)
    alt = sqrt(x*x + y*y) / cos(lat) - N

    # Convert radians to degrees
    lat = lat * 180 / pi
    lng = (lon * 180 / pi - (now - datetime(1970,1,1,0,0,0)).total_seconds() * 7.2921159e-5 * 180 / pi) % 360 - 180

    velocity = sqrt(vx**2 + vy**2 + vz**2)

    print(f"SGP4 CALCULATION FOR {name}: Lat: {lat}, Lng: {lng}")

    sun_angle = cos(((now.hour * 15 + lng) * pi) / 180)
    power = 80 + sun_angle * 20 + random.random() * 5
    temperature = 20 + sun_angle * 30 - alt / 100 + (random.random() - 0.5) * 10
    communication = 90 + random.random() * 10

    # Extract orientation data from TLE
    inclination = float(line2[8:16])
    raan = float(line2[17:25])
    arg_perigee = float(line2[34:42])
    mean_anomaly = float(line2[43:51])

    return {
        'id': f"sat_{norad_id}",
        'name': name,
        'latitude': lat,
        'longitude': lng,
        'altitude': alt,
        'velocity': velocity,
        'timestamp': now.isoformat() + "Z",
        'status': "operational",
        'telemetry': {
            'temperature': temperature,
            'power': power,
            'communication': communication,
            'orientation': {
                'roll': (arg_perigee + mean_anomaly) % 360,
                'pitch': inclination,
                'yaw': raan % 360,
            },
        },
        'noradId': norad_id,
        'tle': {
            'line1': line1,
            'line2': line2,
        },
    }

def fetch_satellite_positions():
    try:
        with lock:
            space_track_username = space_track_credentials.get("username") or os.getenv("SPACE_TRACK_USERNAME")
            space_track_password = space_track_credentials.get("password") or os.getenv("SPACE_TRACK_PASSWORD")

        if not space_track_username or not space_track_password:
            logging.error("Space-Track credentials not configured.")
            return []

        logging.info("Fetching satellite TLE data from Space-Track.org...")

        session = requests.Session()

        auth_payload = {'identity': space_track_username, 'password': space_track_password}
        auth_url = "https://www.space-track.org/ajaxauth/login"

        auth_response = session.post(auth_url, data=auth_payload)
        auth_response.raise_for_status()

        satellite_ids = [25544, 28654, 39084, 25994, 27424, 39634, 41866, 20580, 40697, 40115]
        tle_url = f"https://www.space-track.org/basicspacedata/query/class/tle_latest/NORAD_CAT_ID/{','.join(map(str, satellite_ids))}/orderby/NORAD_CAT_ID/format/json"

        tle_response = session.get(tle_url)
        tle_response.raise_for_status()

        tle_data = tle_response.json()
        satellites = [parse_space_track_tle(tle) for tle in tle_data if parse_space_track_tle(tle) is not None]

        logging.info(f"Successfully fetched {len(satellites)} satellite positions from Space-Track")
        return satellites
    except requests.exceptions.RequestException as e:
        logging.error(f"Error fetching satellite data: {e}")
        return []
    except Exception as e:
        logging.error(f"An unexpected error occurred: {e}")
        return []

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
        if not monitored_satellites:
            return []

        for sat in monitored_satellites:
            tle = sat.get('tle', {})
            line2 = tle.get('line2', '')

            perigee = sat.get('altitude', 210)
            apogee = perigee + random.uniform(50, 200)
            inclination = float(line2[8:16]) if len(line2) > 16 else 53

            launch_year = int(tle.get('LAUNCH_YEAR', '2022'))
            launch_date = datetime(launch_year, random.randint(1,12), random.randint(1,28)).isoformat()

            # Find the latest anomaly for this satellite to get the scores
            latest_anomaly = next((a for a in reversed(anomalies_detected) if a.get('satelliteName') == sat['name']), None)

            threat_scores = {
                "autoencoder": latest_anomaly.get('autoencoder_score', 0) if latest_anomaly else 0,
                "isolationForest": latest_anomaly.get('if_score', 0) if latest_anomaly else 0,
                "svm": latest_anomaly.get('svm_score', 0) if latest_anomaly else 0,
            }

            overall_threat_score = int(np.mean(list(threat_scores.values())))

            detailed_rso = {
                "id": f"rso_{sat['noradId']}",
                "name": sat['name'],
                "type": "payload",
                "threatScore": overall_threat_score,
                "threatScores": threat_scores,
                "country": tle.get('COUNTRY_CODE', 'USA'),
                "launchDate": launch_date,
                "orbitalPeriod": round(1440 / float(line2[52:63]), 2) if len(line2) > 63 else 96.5,
                "inclination": inclination,
                "apogee": apogee,
                "perigee": perigee,
                "telemetry": {
                    "status": "nominal" if sat.get('status') == 'operational' else 'degraded',
                    "power": sat.get('telemetry', {}).get('power', 0),
                    "temperature": sat.get('telemetry', {}).get('temperature', 0),
                    "lastContact": sat.get('timestamp'),
                },
                "mitigations": {
                    "maneuverability": random.choice([True, False]),
                    "commsJamming": random.choice([True, False]),
                    "sensorBlinding": random.choice([True, False]),
                },
            }
            rsos.append(detailed_rso)
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

def background_inference_thread():
    """Periodically fetches data, trains models, runs inference, and emits updates."""
    initial_training_done = False
    while True:
        satellites = fetch_satellite_positions()
        if satellites:
            with lock:
                global monitored_satellites
                monitored_satellites = satellites
                telemetry_data = [convert_satellite_to_telemetry(s) for s in satellites]
                telemetry_data_store.extend(telemetry_data)

            if not initial_training_done and len(telemetry_data_store) > 0:
                train_models_on_data(telemetry_data_store)
                initial_training_done = True

            for satellite in satellites:
                telemetry = convert_satellite_to_telemetry(satellite)
                handle_predict_event({'telemetry': telemetry, 'satellite': satellite})

            # Emit dashboard data after processing all satellites
            if telemetry_data:
                handle_get_dashboard_data({'telemetry': telemetry_data[0]})

        socketio.sleep(60)  # Fetch new data every 60 seconds

def convert_satellite_to_telemetry(satellite):
    telemetry = satellite['telemetry']
    return {
        'temperature': telemetry['temperature'],
        'power': telemetry['power'],
        'communication': telemetry['communication'],
        'orbit': satellite['altitude'],
        'voltage': telemetry['power'] > 80 and 12 + (random.random() - 0.5) * 1 or 10 + random.random() * 2,
        'solarPanelEfficiency': max(0, min(100, telemetry['power'] - 5 + random.random() * 10)),
        'attitudeControl': max(0, min(100, 95 + (random.random() - 0.5) * 10)),
        'fuelLevel': max(0, min(100, 80 + (random.random() - 0.5) * 30)),
        'timestamp': datetime.utcnow().timestamp(),
    }

@socketio.on('connect')
def handle_connect():
    print('Client connected')
    if not hasattr(app, 'inference_thread_started'):
        threading.Thread(target=background_inference_thread).start()
        app.inference_thread_started = True

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

@socketio.on('get_dashboard_data')
def handle_get_dashboard_data(json):
    telemetry = json.get('telemetry', {})
    socketio.emit('dashboard_data', {
        "subframes": _generate_subframes(telemetry),
        "logs": _generate_logs(),
        "rsos": _generate_rsos(telemetry),
        "spartaMitreAlignment": _generate_sparta_mitre_alignment(),
    })

@socketio.on('save_credentials')
def handle_save_credentials(json):
    print('Received credentials: ', json)
    with lock:
        space_track_credentials["username"] = json.get("username")
        space_track_credentials["password"] = json.get("password")

    def fetch_data_in_background():
        """Fetches data and emits updates."""
        satellites = fetch_satellite_positions()
        if satellites:
            with lock:
                global monitored_satellites
                monitored_satellites = satellites
                telemetry_data = [convert_satellite_to_telemetry(s) for s in satellites]
                telemetry_data_store.extend(telemetry_data)

            # Assuming models are already trained, just run inference and emit updates
            for satellite in satellites:
                telemetry = convert_satellite_to_telemetry(satellite)
                handle_predict_event({'telemetry': telemetry, 'satellite': satellite})

            if telemetry_data:
                handle_get_dashboard_data({'telemetry': telemetry_data[0]})

    threading.Thread(target=fetch_data_in_background).start()

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

def _normalize_score(score, score_type):
    if score_type == 'autoencoder':
        return min(100, int(score * 200)) # Scale error to 0-100
    elif score_type in ['if', 'svm']:
        return max(0, min(100, int(50 - score * 50))) # Map -1 to 100, 1 to 0
    return 0

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
        if_score = isolation_forest_model.decision_function(normalized_features)[0]
        svm_score = svm_model.decision_function(normalized_features)[0]

    autoencoder_threat_score = _normalize_score(reconstruction_error, 'autoencoder')
    if_threat_score = _normalize_score(if_score, 'if')
    svm_threat_score = _normalize_score(svm_score, 'svm')

    is_anomaly = autoencoder_threat_score > 75 or if_threat_score > 75 or svm_threat_score > 75

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
            "autoencoder_score": autoencoder_threat_score,
            "if_score": if_threat_score,
            "svm_score": svm_threat_score,
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
                'if_score': if_score,
                'svm_score': svm_score,
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
