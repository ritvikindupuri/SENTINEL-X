from flask import Flask, jsonify, request
from flask_socketio import SocketIO, emit
import tensorflow as tf
from sklearn.ensemble import IsolationForest
import numpy as np

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

# In-memory data stores
time_series_buffer = []
TIME_SERIES_LENGTH = 10

# Load or define ML models
# Note: In a real application, models should be loaded from files.
# For simplicity, we define them here.
def create_autoencoder(input_dim):
    # Define the input layer
    input_layer = tf.keras.layers.Input(shape=(input_dim,))

    # Encoder
    encoded = tf.keras.layers.Dense(16, activation="relu")(input_layer)
    encoded = tf.keras.layers.Dense(8, activation="relu")(encoded)
    encoded = tf.keras.layers.Dense(4, activation="relu")(encoded)

    # Decoder
    decoded = tf.keras.layers.Dense(8, activation="relu")(encoded)
    decoded = tf.keras.layers.Dense(16, activation="relu")(decoded)
    decoded = tf.keras.layers.Dense(input_dim, activation="linear")(decoded)

    # Autoencoder model
    autoencoder = tf.keras.Model(inputs=input_layer, outputs=decoded)
    autoencoder.compile(optimizer="adam", loss="mean_squared_error")
    return autoencoder

autoencoder_model = create_autoencoder(8)
isolation_forest_model = IsolationForest(n_estimators=100, contamination='auto', random_state=42)

# Normalization stats (should be calculated from training data)
# Using placeholder values for demonstration
normalized_stats = {
    'mean': np.zeros(8),
    'std': np.ones(8),
}

def train_models():
    """Trains the ML models on synthetic data."""
    print("Training models...")
    # Generate synthetic data
    num_samples = 1000
    features = np.random.rand(num_samples, 8) * 100

    # Normalize data
    mean = np.mean(features, axis=0)
    std = np.std(features, axis=0)
    normalized_stats['mean'] = mean
    normalized_stats['std'] = std
    normalized_features = (features - mean) / (std + 1e-8)

    # Train Autoencoder
    autoencoder_model.fit(normalized_features, normalized_features, epochs=50, batch_size=32, verbose=0)

    # Train Isolation Forest
    isolation_forest_model.fit(normalized_features)
    print("Models trained successfully")

@app.route('/predict', methods=['POST'])
def predict_anomaly():
    telemetry = request.get_json().get('telemetry')
    if not telemetry:
        return jsonify({"error": "No telemetry data provided"}), 400

    features = np.array([list(telemetry.values())])

    # Normalize features
    normalized_features = (features - normalized_stats['mean']) / (normalized_stats['std'] + 1e-8)

    # Autoencoder prediction
    reconstruction = autoencoder_model.predict(normalized_features)
    reconstruction_error = np.mean(np.square(normalized_features - reconstruction))

    # Isolation Forest prediction
    if_score = isolation_forest_model.decision_function(normalized_features)

    # Combine scores for anomaly detection
    # This is a simple example; a more sophisticated method could be used.
    is_anomaly = reconstruction_error > 0.5 or if_score[0] < 0

    return jsonify({
        "is_anomaly": bool(is_anomaly),
        "reconstruction_error": float(reconstruction_error),
        "isolation_forest_score": float(if_score[0]),
    })

@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

def start_real_time_stream():
    """Function to simulate real-time data streaming."""
    while True:
        # In a real app, this would get data from a source like a message queue
        # or a direct feed from the satellites.
        # Here, we simulate new data every few seconds.
        socketio.sleep(5)

        # Simulate new telemetry data
        new_telemetry = {
            'temperature': 25 + np.random.randn(),
            'power': 85 + np.random.randn(),
            'communication': 95 + np.random.randn(),
            'orbit': 98 + np.random.randn() * 0.1,
            'voltage': 12 + np.random.randn() * 0.1,
            'solarPanelEfficiency': 90 + np.random.randn(),
            'attitudeControl': 95 + np.random.randn(),
            'fuelLevel': 80 + np.random.randn(),
        }

        # Predict anomaly
        features = np.array([list(new_telemetry.values())])
        normalized_features = (features - normalized_stats['mean']) / (normalized_stats['std'] + 1e-8)
        reconstruction = autoencoder_model.predict(normalized_features)
        reconstruction_error = np.mean(np.square(normalized_features - reconstruction))
        if_score = isolation_forest_model.decision_function(normalized_features)
        is_anomaly = reconstruction_error > 0.5 or if_score[0] < 0

        # Determine anomaly type and severity for UI
        anomaly_type = "Unknown"
        severity = "low"
        if is_anomaly:
            if new_telemetry['power'] < 70:
                anomaly_type = "Power System Degradation"
                severity = "high" if new_telemetry['power'] < 50 else "medium"
            elif new_telemetry['temperature'] > 60 or new_telemetry['temperature'] < -10:
                anomaly_type = "Thermal Anomaly"
                severity = "critical" if new_telemetry['temperature'] > 80 or new_telemetry['temperature'] < -20 else "medium"
            else:
                anomaly_type = "Sensor Malfunction"
                severity = "high"

        # Emit the data to all connected clients
        socketio.emit('new_telemetry', {
            'telemetry': new_telemetry,
            'is_anomaly': bool(is_anomaly),
            'anomaly_type': anomaly_type,
            'severity': severity,
        })

if __name__ == '__main__':
    train_models()
    socketio.start_background_task(target=start_real_time_stream)
    socketio.run(app, debug=True)
