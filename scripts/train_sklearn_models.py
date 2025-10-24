"""
Scikit-learn Models for Satellite Anomaly Detection
Includes Isolation Forest and XGBoost
Trains on real Space-Track ISS data
"""

import numpy as np
import requests
import os
from sklearn.svm import OneClassSVM
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.preprocessing import StandardScaler
import xgboost as xgb
import joblib

# Space-Track API credentials
SPACETRACK_USERNAME = os.getenv('SPACE_TRACK_USERNAME', '')
SPACETRACK_PASSWORD = os.getenv('SPACE_TRACK_PASSWORD', '')

def fetch_spacetrack_iss_data():
    """Fetch real ISS TLE data from Space-Track"""
    print("Fetching ISS data from Space-Track...")
    
    login_url = 'https://www.space-track.org/ajaxauth/login'
    query_url = 'https://www.space-track.org/basicspacedata/query/class/tle_latest/NORAD_CAT_ID/25544/orderby/EPOCH%20desc/limit/5000/format/json'
    
    session = requests.Session()
    
    try:
        response = session.post(login_url, data={
            'identity': SPACETRACK_USERNAME,
            'password': SPACETRACK_PASSWORD
        })
        
        if response.status_code != 200:
            print(f"Login failed: {response.status_code}")
            return generate_synthetic_data()
        
        response = session.get(query_url)
        
        if response.status_code == 200:
            data = response.json()
            print(f"Fetched {len(data)} TLE records for ISS")
            return process_tle_data(data)
        else:
            print(f"Query failed: {response.status_code}")
            return generate_synthetic_data()
            
    except Exception as e:
        print(f"Error: {e}")
        return generate_synthetic_data()
    finally:
        session.close()

def process_tle_data(tle_data):
    """Process TLE data into features"""
    features = []
    labels = []
    
    for tle in tle_data:
        feature_vector = [
            float(tle.get('MEAN_MOTION', 0)),
            float(tle.get('ECCENTRICITY', 0)),
            float(tle.get('INCLINATION', 0)),
            float(tle.get('RA_OF_ASC_NODE', 0)),
            float(tle.get('ARG_OF_PERICENTER', 0)),
            float(tle.get('MEAN_ANOMALY', 0)),
            float(tle.get('BSTAR', 0)),
            float(tle.get('MEAN_MOTION_DOT', 0)),
            float(tle.get('MEAN_MOTION_DDOT', 0)),
        ]
        
        features.append(feature_vector)
        
        # Label based on orbital parameters
        mean_motion = float(tle.get('MEAN_MOTION', 15.5))
        if mean_motion < 15.4 or mean_motion > 15.6:
            labels.append(1)  # Anomaly
        else:
            labels.append(0)  # Normal
    
    return np.array(features), np.array(labels)

def generate_synthetic_data(num_samples=5000):
    """Generate synthetic ISS data"""
    print("Generating synthetic ISS data...")
    
    features = []
    labels = []
    
    for i in range(num_samples):
        mean_motion = np.random.normal(15.54, 0.01)
        eccentricity = np.random.normal(0.0001, 0.00005)
        inclination = np.random.normal(51.6, 0.1)
        
        if i % 10 == 0:
            mean_motion += np.random.normal(0, 0.1)
            label = 1
        else:
            label = 0
        
        feature_vector = [
            mean_motion,
            eccentricity,
            inclination,
            np.random.uniform(0, 360),
            np.random.uniform(0, 360),
            np.random.uniform(0, 360),
            np.random.normal(0, 0.00001),
            np.random.normal(0, 0.00001),
            np.random.normal(0, 0.000001),
        ]
        
        features.append(feature_vector)
        labels.append(label)
    
    return np.array(features), np.array(labels)

def train_isolation_forest():
    """Train Isolation Forest for anomaly detection"""
    print("\n=== Training Isolation Forest ===")
    
    features, labels = fetch_spacetrack_iss_data()
    
    # Normalize
    scaler = StandardScaler()
    features_scaled = scaler.fit_transform(features)
    
    # Train Isolation Forest
    iso_forest = IsolationForest(
        contamination=0.1,
        random_state=42,
        n_estimators=100
    )
    
    iso_forest.fit(features_scaled)
    predictions = iso_forest.predict(features_scaled)
    
    # Convert predictions (-1 for anomaly, 1 for normal) to (1 for anomaly, 0 for normal)
    predictions = np.where(predictions == -1, 1, 0)
    
    print("\nIsolation Forest Results:")
    print(classification_report(labels, predictions, target_names=['Normal', 'Anomaly']))
    
    # Save model
    joblib.dump(iso_forest, 'isolation_forest_model.pkl')
    joblib.dump(scaler, 'scaler.pkl')
    print("Saved Isolation Forest model")
    
    return iso_forest

def train_xgboost():
    """Train XGBoost classifier"""
    print("\n=== Training XGBoost ===")
    
    features, labels = fetch_spacetrack_iss_data()
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        features, labels, test_size=0.2, random_state=42
    )
    
    # Train XGBoost
    xgb_model = xgb.XGBClassifier(
        max_depth=6,
        learning_rate=0.1,
        n_estimators=100,
        objective='binary:logistic',
        random_state=42
    )
    
    xgb_model.fit(X_train, y_train)
    predictions = xgb_model.predict(X_test)
    
    print("\nXGBoost Results:")
    print(classification_report(y_test, predictions, target_names=['Normal', 'Anomaly']))
    print("\nConfusion Matrix:")
    print(confusion_matrix(y_test, predictions))
    
    # Save model
    xgb_model.save_model('xgboost_model.json')
    print("Saved XGBoost model")
    
    return xgb_model

def train_random_forest():
    """Train Random Forest classifier"""
    print("\n=== Training Random Forest ===")
    
    features, labels = fetch_spacetrack_iss_data()
    
    X_train, X_test, y_train, y_test = train_test_split(
        features, labels, test_size=0.2, random_state=42
    )
    
    rf_model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        random_state=42
    )
    
    rf_model.fit(X_train, y_train)
    predictions = rf_model.predict(X_test)
    
    print("\nRandom Forest Results:")
    print(classification_report(y_test, predictions, target_names=['Normal', 'Anomaly']))
    
    # Save model
    joblib.dump(rf_model, 'random_forest_model.pkl')
    print("Saved Random Forest model")
    
    return rf_model

if __name__ == '__main__':
    print("Training ML models on Space-Track ISS data...\n")
    
    # Train all models
    iso_forest = train_isolation_forest()
    xgb_model = train_xgboost()
    rf_model = train_random_forest()
    svm_model = train_one_class_svm()
    
    print("\n=== Training Complete ===")
    print("All models saved successfully!")

def train_one_class_svm():
    """Train One-Class SVM for anomaly detection"""
    print("\n=== Training One-Class SVM ===")

    features, labels = fetch_spacetrack_iss_data()

    # Normalize
    scaler = StandardScaler()
    features_scaled = scaler.fit_transform(features)

    # Train One-Class SVM
    svm_model = OneClassSVM(
        nu=0.1,
        kernel="rbf",
        gamma=0.1
    )

    svm_model.fit(features_scaled)
    predictions = svm_model.predict(features_scaled)

    # Convert predictions (-1 for anomaly, 1 for normal) to (1 for anomaly, 0 for normal)
    predictions = np.where(predictions == -1, 1, 0)

    print("\nOne-Class SVM Results:")
    print(classification_report(labels, predictions, target_names=['Normal', 'Anomaly']))

    # Save model
    joblib.dump(svm_model, 'one_class_svm_model.pkl')
    print("Saved One-Class SVM model")

    return svm_model
