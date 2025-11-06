# Orbitwatch: Satellite Anomaly Detection Dashboard

Orbitwatch is a real-time satellite anomaly detection dashboard designed for a military space program organization. It provides a comprehensive, at-a-glance view of a satellite constellation, using machine learning to identify and flag anomalous behavior. The application is built with a Next.js frontend and a Python (Flask) backend, communicating via WebSockets for real-time data streaming.

## Core Features

*   **Real-Time Orbital Map:** A Leaflet.js-based map that displays the current position of all satellites in the constellation.
*   **ML-Powered Anomaly Detection:** Utilizes a suite of machine learning models (TensorFlow Autoencoder, Scikit-learn Isolation Forest, and One-Class SVM) to analyze satellite telemetry and detect anomalies.
*   **Detailed RSO Characterization:** An interactive panel that provides detailed information about a selected satellite, including its threat score and the output of individual ML models.
*   **Live Event Log:** A real-time log that streams important events and messages from the backend service.

## Getting Started

### Prerequisites

*   Node.js (v18 or later)
*   npm
*   Python (v3.9 or later)
*   pip

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Install frontend dependencies:**
    ```bash
    npm install
    ```

3.  **Install backend dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

## Running the Application

To run Orbitwatch, you must have both the backend and frontend servers running concurrently.

1.  **Start the Backend Service:**
    Open a terminal and run the following command:
    ```bash
    python3 services/ml_service/main.py
    ```
    The backend Flask server will start on `http://localhost:5000`.

2.  **Start the Frontend Development Server:**
    In a separate terminal, run the following command:
    ```bash
    npm run dev
    ```
    The frontend Next.js application will start on `http://localhost:3000`.

3.  **Access the Application:**
    Open your web browser and navigate to `http://localhost:3000`. You will be prompted to enter your Space-Track credentials or use dummy data to begin.

## Features in Detail

### Anomaly Visualization on the Orbital Map

The Orbitwatch dashboard provides a real-time visualization of satellite anomalies on its orbital map. This feature is designed to provide immediate situational awareness by clearly distinguishing anomalous satellites from the rest of the constellation. The process from detection to visualization is as follows:

1.  **Backend Detection and Event Emission:**
    *   The Python backend continuously processes satellite telemetry data through its machine learning models.
    *   When a model detects an anomaly, the backend service emits a `new_anomaly` event via WebSocket to all connected frontend clients. This event contains a `RealTimeAnomaly` object with details such as the satellite's name, NORAD ID, location, and the specifics of the anomaly.

2.  **Frontend Service-Layer Processing:**
    *   The `RealTimeInferenceService` on the frontend listens for the `new_anomaly` event.
    *   Upon receiving an anomaly, the service adds the new `RealTimeAnomaly` object to the beginning of its internal `anomalies` array.
    *   The service then waits for the next main `dashboard_data` event from the backend. When this event is received, the service constructs a comprehensive `DashboardData` object, which includes the updated `anomalies` list in the `recentEvents` property. This object is then sent to the main UI component.

3.  **UI State Management:**
    *   The main `Dashboard` component in `app/page.tsx` receives the new `DashboardData` object.
    *   It updates its state, which triggers a re-render of its child components.
    *   The `recentEvents` array (containing the anomalies) is passed as a prop to the `OrbitalMap` component.

4.  **Map Rendering Logic:**
    *   The `OrbitalMap` component is designed to render anomalies and normal satellites (RSOs) differently for clear visual distinction.
    *   It uses a larger, distinct icon (`/anomaly-icon.svg`) for anomalies and a standard icon (`/satellite-icon.svg`) for normal RSOs.
    *   The component first renders all RSOs, but it filters out any RSO that has a corresponding entry in the `anomalies` prop. This ensures that a satellite identified as an anomaly does not also appear as a normal RSO.
    *   It then iterates through the `anomalies` array and renders a special, larger `Marker` for each anomaly at its specified latitude and longitude.
    *   The popup for an anomaly marker is also uniquely styled with a red alert triangle and provides detailed information about the anomaly's type, severity, and timestamp.
