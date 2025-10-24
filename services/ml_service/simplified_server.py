
import os
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"

from flask import Flask
from flask_socketio import SocketIO, emit
import tensorflow as tf
from sklearn.svm import OneClassSVM
from sklearn.ensemble import IsolationForest
import numpy as np
import random
from datetime import datetime, timedelta

app = Flask(__name__)
socketio = SocketIO(app)

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
svm_model = OneClassSVM(nu=0.1, kernel="rbf", gamma=0.1)

normalized_stats = {
    'mean': np.zeros(8),
    'std': np.ones(8),
}

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
    svm_model.fit(normalized_features)
    print("Models trained successfully on provided data")

@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('train')
def handle_train_event(json):
    print('Received training data')
    training_data = json.get('data')
    if training_data:
        train_models_on_data(training_data)

@socketio.on('predict')
def handle_predict_event(json):
    print('Received predict event')
    socketio.emit('prediction_result', {'is_anomaly': False})

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000)
