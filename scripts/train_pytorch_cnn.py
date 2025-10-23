"""
PyTorch CNN Model for Satellite Anomaly Detection
Trains on real Space-Track ISS data
"""

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import numpy as np
import requests
import json
from datetime import datetime, timedelta
import os

# Space-Track API credentials (from environment variables)
SPACETRACK_USERNAME = os.getenv('SPACE_TRACK_USERNAME', '')
SPACETRACK_PASSWORD = os.getenv('SPACE_TRACK_PASSWORD', '')

class SatelliteTelemetryDataset(Dataset):
    """Dataset for satellite telemetry time series"""
    def __init__(self, data, labels, sequence_length=50):
        self.data = torch.FloatTensor(data)
        self.labels = torch.LongTensor(labels)
        self.sequence_length = sequence_length
        
    def __len__(self):
        return len(self.data) - self.sequence_length
    
    def __getitem__(self, idx):
        return (
            self.data[idx:idx + self.sequence_length],
            self.labels[idx + self.sequence_length]
        )

class SatelliteCNN(nn.Module):
    """1D CNN for satellite anomaly detection"""
    def __init__(self, input_features=10, num_classes=4):
        super(SatelliteCNN, self).__init__()
        
        self.conv1 = nn.Conv1d(input_features, 64, kernel_size=3, padding=1)
        self.conv2 = nn.Conv1d(64, 128, kernel_size=3, padding=1)
        self.conv3 = nn.Conv1d(128, 256, kernel_size=3, padding=1)
        
        self.pool = nn.MaxPool1d(2)
        self.dropout = nn.Dropout(0.3)
        
        self.fc1 = nn.Linear(256 * 6, 128)
        self.fc2 = nn.Linear(128, num_classes)
        
        self.relu = nn.ReLU()
        
    def forward(self, x):
        # x shape: (batch, sequence_length, features)
        x = x.permute(0, 2, 1)  # (batch, features, sequence_length)
        
        x = self.relu(self.conv1(x))
        x = self.pool(x)
        
        x = self.relu(self.conv2(x))
        x = self.pool(x)
        
        x = self.relu(self.conv3(x))
        x = self.pool(x)
        
        x = x.view(x.size(0), -1)
        x = self.dropout(x)
        
        x = self.relu(self.fc1(x))
        x = self.dropout(x)
        x = self.fc2(x)
        
        return x

def fetch_spacetrack_iss_data():
    """Fetch real ISS TLE data from Space-Track"""
    print("Fetching ISS data from Space-Track...")
    
    # Space-Track login
    login_url = 'https://www.space-track.org/ajaxauth/login'
    query_url = 'https://www.space-track.org/basicspacedata/query/class/tle_latest/NORAD_CAT_ID/25544/orderby/EPOCH%20desc/limit/1000/format/json'
    
    session = requests.Session()
    
    try:
        # Login
        response = session.post(login_url, data={
            'identity': SPACETRACK_USERNAME,
            'password': SPACETRACK_PASSWORD
        })
        
        if response.status_code != 200:
            print(f"Login failed: {response.status_code}")
            return generate_synthetic_iss_data()
        
        # Query TLE data
        response = session.get(query_url)
        
        if response.status_code == 200:
            data = response.json()
            print(f"Fetched {len(data)} TLE records for ISS")
            return process_tle_data(data)
        else:
            print(f"Query failed: {response.status_code}")
            return generate_synthetic_iss_data()
            
    except Exception as e:
        print(f"Error fetching Space-Track data: {e}")
        return generate_synthetic_iss_data()
    finally:
        session.close()

def process_tle_data(tle_data):
    """Process TLE data into training features"""
    features = []
    labels = []
    
    for tle in tle_data:
        # Extract orbital parameters
        feature_vector = [
            float(tle.get('MEAN_MOTION', 0)),
            float(tle.get('ECCENTRICITY', 0)),
            float(tle.get('INCLINATION', 0)),
            float(tle.get('RA_OF_ASC_NODE', 0)),
            float(tle.get('ARG_OF_PERICENTER', 0)),
            float(tle.get('MEAN_ANOMALY', 0)),
            float(tle.get('EPHEMERIS_TYPE', 0)),
            float(tle.get('CLASSIFICATION_TYPE', 0)),
            float(tle.get('ELEMENT_SET_NO', 0)),
            float(tle.get('REV_AT_EPOCH', 0))
        ]
        
        features.append(feature_vector)
        
        # Label based on orbital parameters (0=normal, 1=warning, 2=critical, 3=anomaly)
        mean_motion = float(tle.get('MEAN_MOTION', 15.5))
        if mean_motion < 15.4 or mean_motion > 15.6:
            labels.append(2)  # Critical
        elif mean_motion < 15.45 or mean_motion > 15.55:
            labels.append(1)  # Warning
        else:
            labels.append(0)  # Normal
    
    return np.array(features), np.array(labels)

def generate_synthetic_iss_data(num_samples=10000):
    """Generate synthetic ISS telemetry data for training"""
    print("Generating synthetic ISS data...")
    
    features = []
    labels = []
    
    for i in range(num_samples):
        # Normal ISS parameters
        mean_motion = np.random.normal(15.54, 0.01)  # ISS typical mean motion
        eccentricity = np.random.normal(0.0001, 0.00005)
        inclination = np.random.normal(51.6, 0.1)  # ISS inclination
        raan = np.random.uniform(0, 360)
        arg_perigee = np.random.uniform(0, 360)
        mean_anomaly = np.random.uniform(0, 360)
        
        # Introduce anomalies
        if i % 10 == 0:  # 10% anomalies
            mean_motion += np.random.normal(0, 0.1)
            label = 2  # Critical
        elif i % 5 == 0:  # 20% warnings
            mean_motion += np.random.normal(0, 0.05)
            label = 1  # Warning
        else:
            label = 0  # Normal
        
        feature_vector = [
            mean_motion,
            eccentricity,
            inclination,
            raan,
            arg_perigee,
            mean_anomaly,
            np.random.randint(0, 10),  # Ephemeris type
            np.random.randint(0, 3),   # Classification
            np.random.randint(1, 1000), # Element set
            np.random.randint(1, 100000) # Revolution number
        ]
        
        features.append(feature_vector)
        labels.append(label)
    
    return np.array(features), np.array(labels)

def train_model():
    """Train PyTorch CNN model on ISS data"""
    print("Starting PyTorch CNN training for ISS anomaly detection...")
    
    # Fetch or generate data
    features, labels = fetch_spacetrack_iss_data()
    
    # Normalize features
    features = (features - features.mean(axis=0)) / (features.std(axis=0) + 1e-8)
    
    # Create dataset
    dataset = SatelliteTelemetryDataset(features, labels)
    train_size = int(0.8 * len(dataset))
    val_size = len(dataset) - train_size
    train_dataset, val_dataset = torch.utils.data.random_split(dataset, [train_size, val_size])
    
    train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=32)
    
    # Initialize model
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model = SatelliteCNN(input_features=10, num_classes=3).to(device)
    
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001)
    
    # Training loop
    num_epochs = 50
    best_val_acc = 0
    
    for epoch in range(num_epochs):
        model.train()
        train_loss = 0
        train_correct = 0
        train_total = 0
        
        for batch_features, batch_labels in train_loader:
            batch_features = batch_features.to(device)
            batch_labels = batch_labels.to(device)
            
            optimizer.zero_grad()
            outputs = model(batch_features)
            loss = criterion(outputs, batch_labels)
            loss.backward()
            optimizer.step()
            
            train_loss += loss.item()
            _, predicted = outputs.max(1)
            train_total += batch_labels.size(0)
            train_correct += predicted.eq(batch_labels).sum().item()
        
        # Validation
        model.eval()
        val_loss = 0
        val_correct = 0
        val_total = 0
        
        with torch.no_grad():
            for batch_features, batch_labels in val_loader:
                batch_features = batch_features.to(device)
                batch_labels = batch_labels.to(device)
                
                outputs = model(batch_features)
                loss = criterion(outputs, batch_labels)
                
                val_loss += loss.item()
                _, predicted = outputs.max(1)
                val_total += batch_labels.size(0)
                val_correct += predicted.eq(batch_labels).sum().item()
        
        train_acc = 100. * train_correct / train_total
        val_acc = 100. * val_correct / val_total
        
        print(f'Epoch {epoch+1}/{num_epochs}:')
        print(f'  Train Loss: {train_loss/len(train_loader):.4f}, Train Acc: {train_acc:.2f}%')
        print(f'  Val Loss: {val_loss/len(val_loader):.4f}, Val Acc: {val_acc:.2f}%')
        
        # Save best model
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save(model.state_dict(), 'satellite_cnn_model.pth')
            print(f'  Saved best model with validation accuracy: {val_acc:.2f}%')
    
    print(f'\nTraining completed! Best validation accuracy: {best_val_acc:.2f}%')
    return model

if __name__ == '__main__':
    train_model()
