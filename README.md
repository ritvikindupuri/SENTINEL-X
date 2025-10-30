# Orbitwatch - Advanced Satellite Anomaly Detection Dashboard

Orbitwatch is a real-time, full-stack satellite tracking and anomaly detection dashboard. It provides a comprehensive visualization of satellite orbits and leverages a sophisticated machine learning pipeline to identify and flag potential threats or malfunctions in real-time.

## Key Features

-   **Real-Time Satellite Tracking:** Visualizes the precise orbits of multiple Resident Space Objects (RSOs) on a dynamic 2D map.
-   **In-App Credential Management:** Securely enter SpaceTrack credentials directly within the application to initiate live data fetching without needing to manage `.env` files.
-   **Advanced Anomaly Detection:** Utilizes a hybrid machine learning pipeline with three distinct models to analyze satellite telemetry data and detect deviations from normal operational parameters.
-   **Dynamic UI:** The entire dashboard is event-driven, with all components updating in real-time as new data is streamed from the backend.
-   **Detailed RSO Characterization:** Offers an in-depth look at each satellite, including its threat score, telemetry data, and key orbital parameters.
-   **Threat Score Breakdown:** Provides a transparent view into the anomaly detection process by showing the individual scores from each machine learning model.

## Dashboard Header Metrics Explained

The main header provides a quick, at-a-glance summary of the current operational status. Here is how each metric is calculated:

-   **Alerts:** This is a real-time count of the total number of unique anomalies that have been detected in the current session.
-   **RSOs (Resident Space Objects):** This represents the total number of unique satellites currently being monitored by the system.
-   **TTPs (Tactics, Techniques, and Procedures):** This metric shows the number of unique MITRE ATT&CK TTPs that have been associated with the detected anomalies. The system maps each anomaly type (e.g., "Power System Degradation") to specific TTPs, and this number reflects the breadth of tactical behaviors observed.
-   **Score:** This is an overall threat score for the system, calculated by averaging the severity of all active alerts. Each anomaly's severity ("low", "medium", "high", "critical") is assigned a numerical value, and the average of these values determines the final score.

### A Note on "Payload" Data

In the detailed satellite view, the **Payload** field (e.g., "Imaging Sensor, 8Ghz Transponder") is currently **simulated data**. It is a placeholder intended to represent the type of equipment a satellite is carrying and to add realism to the data model. It does not reflect live data from the SpaceTrack API.

## End-to-End Data Flow

The Orbitwatch application operates as a real-time data processing pipeline. Here is a step-by-step breakdown of the entire workflow, from data acquisition to visualization.

### 1. **Data Extraction: API Call Mechanics**

-   **Authentication:** The process begins when the user submits their credentials via the UI. The Python backend receives these and initiates a session with the SpaceTrack API. This is done by sending a `POST` request to `https://www.space-track.org/ajaxauth/login` with the `identity` (username) and `password`. The session cookies returned are automatically managed by the `requests` library for subsequent calls.
-   **TLE Data Request:** Once authenticated, the backend service constructs a `GET` request to the SpaceTrack API's `basicspacedata` endpoint to fetch the latest **Two-Line Element (TLE)** data. The request specifies the exact satellites to query by their NORAD CAT ID, orders the results, and requests the data in JSON format for easy parsing.

### 2. **Data Structure (Structured, Not Unstructured)**

-   **JSON API Response:** The data from SpaceTrack is received in a **JSON format**, which is semi-structured. It contains a predictable set of key-value pairs for each satellite.
-   **Rigid TLE Format:** The core of this data, the TLE strings, are highly **structured**. Every character in the two lines of a TLE has a precise, column-dependent meaning (e.g., inclination, eccentricity, mean motion). The application relies on this rigid format for accurate parsing.

### 3. **Data Transformation (The "T" in ETL)**

-   **In-Memory Processing:** As soon as the raw TLE data is received, it is immediately processed in memory by the Python service. It is **not** loaded into a database first.
-   **SGP4 Orbit Propagation:** Each satellite's TLE is fed into the **SGP4 (Simplified General Perturbations 4)** library. This is a high-precision orbital mechanics model that calculates the satellite's exact real-time position (latitude, longitude, altitude) and velocity. This step transforms the raw orbital elements into actionable location data.
-   **Simulated Telemetry Generation:** Based on the calculated position (e.g., relation to the sun), the service generates additional simulated telemetry data, such as power levels and temperature, to create a realistic data stream for analysis.

### 4. **Machine Learning Analysis & Anomaly Detection**

This is the core of the application's intelligence. The process is broken down into feature engineering, model training, inference, and scoring.

#### **Stage 1: Feature Engineering**

The raw TLE data is not suitable for detecting *operational* anomalies. Therefore, we engineer a specific feature set that represents the satellite's health. This is handled in the `convert_satellite_to_telemetry` function.

-   **Transformation:** The function takes the processed satellite data (including its SGP4-calculated position) and generates a simulated telemetry stream.
-   **Feature Selection:** It then constructs a dictionary containing the precise features the models will be trained on:
    -   `temperature`
    -   `power`
    -   `communication`
    -   `orbit` (altitude)
    -   `voltage`
    -   `solarPanelEfficiency`
    -   `attitudeControl`
    -   `fuelLevel`

#### **Stage 2: Model Training**

-   **Normalization:** Before training, the feature vectors are normalized using the mean and standard deviation of the initial dataset. This ensures that all features are on a similar scale, which is crucial for the performance of the ML models.
-   **Initial Training:** The `train_models_on_data` function is called once the first batch of live data is fetched. It fits all three models (Autoencoder, Isolation Forest, and One-Class SVM) on this initial "normal" dataset. This establishes a baseline for what constitutes normal satellite operation.

#### **Stage 3: Hybrid Model Inference**

For each new piece of telemetry data, the application runs inference on three different models. This hybrid approach ensures a more robust and reliable anomaly detection capability.

**1. TensorFlow Autoencoder**
-   **Purpose:** To detect subtle or complex deviations from the learned "normal" operational patterns.
-   **Input:** A single, normalized feature vector (e.g., `[temp, power, comms, ...]`).
-   **Process:** The autoencoder attempts to reconstruct the input vector after compressing it through a smaller bottleneck layer. If the input is "normal," the reconstruction will be very close to the original. If it's anomalous, the model will struggle, resulting in a higher error.
-   **Raw Output:** A `reconstruction_error` (a float), which is the mean squared error between the input and the reconstructed output.

**2. Scikit-learn Isolation Forest**
-   **Purpose:** To detect statistical outliers that are numerically distinct from the majority of the data points.
-   **Input:** The same normalized feature vector.
-   **Process:** This model is an ensemble of trees that "isolate" data points by randomly partitioning the feature space. Anomalies are typically easier to isolate and thus have a shorter path from the root of the tree.
-   **Raw Output:** A `decision_function` score (a float). Scores are typically negative for anomalies and positive for inliers.

**3. Scikit-learn One-Class SVM**
-   **Purpose:** To identify novel data points that do not conform to the distribution of the normal training data.
-   **Input:** The same normalized feature vector.
-   **Process:** The SVM learns a boundary (a hyperplane) that encompasses the "normal" data. Any new data point that falls outside this boundary is considered an anomaly.
-   **Raw Output:** A `decision_function` score (a float). Like the Isolation Forest, scores are typically negative for anomalies and positive for inliers.

#### **Stage 4: Threat Score Calculation**

The raw outputs from the models are not easily interpretable. The `_normalize_score` function converts them into a standardized 0-100 threat score.

-   **Autoencoder Score:** The `reconstruction_error` is scaled. A higher error results in a higher score (e.g., `error * 200`).
-   **Isolation Forest & SVM Scores:** The `decision_function` scores are inverted and scaled. Since negative scores indicate anomalies, the formula (`50 - score * 50`) maps a score of -1 to a threat score of 100, and a score of 1 to a threat score of 0.

-   **Sub-Scores:** These three normalized scores are sent to the frontend as the `threatScores` breakdown.
-   **Overall Threat Score:** The final `threatScore` is calculated by taking the **mean average** of the three individual sub-scores. This provides a single, high-level indicator of the anomaly's severity.

### 5. **Data Streaming Architecture: Real-Time Visualization**

-   **WebSocket Connection:** The frontend and backend maintain a persistent, bidirectional communication channel using **Socket.IO**.
-   **Event-Based Broadcasting:** When the ML pipeline flags an anomaly, the backend **broadcasts** a `new_anomaly` event to all connected clients.
-   **Frontend Event Listeners:** The Next.js frontend listens for the `new_anomaly` event and updates the application's state, causing all relevant UI components to re-render instantly.

## Technologies Used

-   **Frontend:** Next.js, React, TypeScript, Tailwind CSS, ShadCN/UI
-   **Real-Time Communication:** Socket.IO
-   **Mapping:** Leaflet.js, React-Leaflet
-   **Data Visualization:** Recharts
-   **Backend:** Python, Flask
-   **Machine Learning:** TensorFlow, Scikit-learn
-   **Orbital Mechanics:** SGP4

## Getting Started

### Prerequisites

-   Node.js and npm
-   Python 3.10+ and pip

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/orbitwatch.git
    cd orbitwatch
    ```

2.  **Install frontend dependencies:**
    ```bash
    npm install
    ```

3.  **Install backend dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

### Running the Application

1.  **Start the Python ML Service:**
    ```bash
    python3 services/ml_service/main.py
    ```
    The backend server will start on port 5000.

2.  **Start the Next.js Frontend:**
    ```bash
    npm run dev
    ```
    The frontend development server will start on port 3000.

3.  **Access the Dashboard:**
    Open your browser and navigate to `http://localhost:3000`.

4.  **Provide Credentials:**
    Click the settings icon in the top-right corner and enter your SpaceTrack.org username and password to begin streaming live data.
