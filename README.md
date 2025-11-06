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

## Machine Learning Models

Orbitwatch employs a sophisticated, multi-model approach to anomaly detection, ensuring a robust and nuanced analysis of satellite behavior. The system uses a combination of an Autoencoder, an Isolation Forest, and a One-Class SVM, all of which are trained and retrained dynamically within the user's session.

### Dynamic, In-Session Training

A critical feature of the Orbitwatch ML pipeline is its dynamic training process, which directly addresses the challenge of data distribution drift.

*   **Training on Live Data:** When a user provides their Space-Track credentials, the backend fetches the latest TLE data for the specified satellites. This data is immediately used to generate a fresh, high-fidelity telemetry dataset.
*   **In-Session Model Retraining:** All three machine learning models are trained on this newly generated dataset at the beginning of the user's session. This ensures that the models' understanding of "normal" is based on the immediate, real-world operational state of the exact satellites being monitored, rather than on outdated or generic mock data.
*   **Eliminating Data Drift:** This in-session retraining is the primary mechanism for preventing data distribution drift, a common problem where a model's performance degrades because the live data it's analyzing is statistically different from the data it was trained on.

### Model-Specific Details

#### 1. TensorFlow Autoencoder

*   **Purpose:** The autoencoder is a neural network designed to learn a compressed representation of normal satellite telemetry. It is highly effective at detecting subtle deviations from a learned baseline.
*   **Overfitting Prevention:** To prevent overfitting—where the model simply memorizes the training data instead of learning its underlying patterns—it is implemented as a **denoising autoencoder**. During training, random noise is added to the input telemetry data, and the model is tasked with reconstructing the original, clean data. This forces the model to learn more robust and generalized features.
*   **Scoring:**
    *   The model's `reconstruction error` (the difference between the input data and the model's reconstructed output) is calculated.
    *   A high reconstruction error implies that the model struggled to reconstruct the input, indicating an anomaly.
    *   The final score is calculated as: `100 * (1 - min(reconstruction_error / 0.01, 1))`. This formula inverts the error, so a lower error results in a higher score (closer to 100). The scaling factor of `0.01` makes the score highly sensitive to even small errors.

#### 2. Scikit-learn Isolation Forest

*   **Purpose:** The Isolation Forest is a tree-based model that is particularly efficient at detecting outliers in a dataset. It works by "isolating" observations, with anomalies being easier to isolate than normal points.
*   **Scoring:**
    *   The model's raw output is its `decision_function`, which provides a score indicating how anomalous a data point is. Scores are typically negative for anomalies and positive for normal data.
    *   This raw score is converted to a 0-100 scale using the formula: `100 * (1 - min(max(-raw_score, 0), 1))`. This provides a continuous, nuanced score where values closer to 100 indicate normal behavior.

#### 3. Scikit-learn One-Class SVM

*   **Purpose:** A One-Class Support Vector Machine (SVM) is trained to learn a boundary that encompasses the normal data points. Any data that falls outside this learned boundary is considered an anomaly.
*   **Scoring:**
    *   Like the Isolation Forest, the SVM's raw output is a `decision_function` score.
    *   This score is scaled to the 0-100 range using the same formula: `100 * (1 - min(max(-raw_score, 0), 1))`, providing a granular measure of anomaly.

### Overall Threat Score Calculation

The final `threatScore` for a satellite is the average of the individual scores from the three models. An anomaly is officially flagged if this average score falls below a threshold of 75, leveraging the consensus of the models to reduce the likelihood of false positives.
