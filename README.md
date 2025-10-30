# Orbitwatch - Advanced Satellite Anomaly Detection Dashboard

Orbitwatch is a real-time, full-stack satellite tracking and anomaly detection dashboard. It provides a comprehensive visualization of satellite orbits and leverages a sophisticated machine learning pipeline to identify and flag potential threats or malfunctions in real-time.

## Key Features

-   **Real-Time Satellite Tracking:** Visualizes the precise orbits of multiple Resident Space Objects (RSOs) on a dynamic 2D map.
-   **In-App Credential Management:** Securely enter SpaceTrack credentials directly within the application to initiate live data fetching without needing to manage `.env` files.
-   **Advanced Anomaly Detection:** Utilizes a hybrid machine learning pipeline with three distinct models to analyze satellite telemetry data and detect deviations from normal operational parameters.
-   **Dynamic UI:** The entire dashboard is event-driven, with all components updating in real-time as new data is streamed from the backend.
-   **Detailed RSO Characterization:** Offers an in-depth look at each satellite, including its threat score, telemetry data, and key orbital parameters.
-   **Threat Score Breakdown:** Provides a transparent view into the anomaly detection process by showing the individual scores from each machine learning model.

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

-   **Feature Extraction:** The transformed positional and telemetry data is converted into a numerical feature vector.
-   **Hybrid Model Inference:** This feature vector is fed into a pipeline of three distinct machine learning models:
    1.  **TensorFlow Autoencoder:** Detects subtle deviations from normal patterns learned during training.
    2.  **Scikit-learn Isolation Forest:** Isolates outliers in the data.
    3.  **Scikit-learn One-Class SVM:** Identifies novel, unseen data points that don't conform to the norm.
-   **Threat Scoring:** The raw output from each model is normalized into a 0-100 score. These are averaged to produce an "Overall Threat Score." If the score exceeds a certain threshold, an **anomaly** is flagged.

### 5. **Data Streaming Architecture: Real-Time Visualization**

-   **WebSocket Connection:** The frontend and backend maintain a persistent, bidirectional communication channel using **Socket.IO**. When the frontend application loads, it establishes a WebSocket connection to the Python server.
-   **Event-Based Broadcasting:** When the ML pipeline flags an anomaly, the backend service does not wait for the frontend to request it. Instead, it proactively **broadcasts** a `new_anomaly` event to all connected clients. This event contains a full JSON payload with all the transformed data for the anomalous satellite.
-   **Frontend Event Listeners:** The Next.js frontend has event listeners that are constantly waiting for the `new_anomaly` event. When this event is received, it triggers a state update in the React application.
-   **Dynamic Component Rendering:** The state update causes all relevant UI components—the map, the RSO panel, the charts, and the header stats—to re-render with the new data, ensuring the user sees the latest information instantly.

This entire cycle—from fetching to transformation to analysis to visualization—repeats periodically, creating a seamless, real-time intelligence dashboard.

## Machine Learning Pipeline

The anomaly detection engine is built on a hybrid model approach to maximize detection accuracy.

-   **TensorFlow Autoencoder:**
    -   **Input:** A normalized vector of telemetry data (e.g., temperature, power, altitude, velocity).
    -   **Logic:** The model is trained to reconstruct "normal" telemetry. A high reconstruction error indicates that the input data is unusual and potentially anomalous.
-   **Isolation Forest:**
    -   **Input:** The same normalized telemetry vector.
    -   **Logic:** This model builds a forest of random trees. Anomalies are identified as data points that require fewer splits to be isolated, as they are "further" from the normal data clusters.
-   **One-Class SVM (Support Vector Machine):**
    -   **Input:** The same normalized telemetry vector.
    -   **Logic:** The SVM is trained on normal data to define a boundary around it. Any data point that falls outside this boundary is considered an anomaly.

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
    Open a terminal and run:
    ```bash
    python3 services/ml_service/main.py
    ```
    The backend server will start on port 5000.

2.  **Start the Next.js Frontend:**
    Open a second terminal and run:
    ```bash
    npm run dev
    ```
    The frontend development server will start on port 3000.

3.  **Access the Dashboard:**
    Open your browser and navigate to `http://localhost:3000`.

4.  **Provide Credentials:**
    Click the settings icon in the top-right corner and enter your SpaceTrack.org username and password to begin streaming live data.
