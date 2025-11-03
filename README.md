# Orbitwatch - Satellite Anomaly Detection Dashboard

Orbitwatch is a real-time dashboard for monitoring satellite telemetry and detecting anomalies using a combination of machine learning models. It provides a comprehensive view of satellite operations, enabling operators to identify and respond to potential threats with high-fidelity, physics-backed data.

## Table of Contents
1.  [System Architecture](#system-architecture)
2.  [Dashboard UI Explained](#dashboard-ui-explained)
3.  [End-to-End Data Pipeline](#end-to-end-data-pipeline)
4.  [Space-Track API Integration](#space-track-api-integration)
5.  [Data Storage](#data-storage)
6.  [Machine Learning Models](#machine-learning-models)
7.  [Backend (Python / Flask)](#backend-python--flask)
8.  [Frontend (Next.js)](#frontend-nextjs)
9.  [Setup and Installation](#setup-and-installation)
10. [Known Issues](#known-issues)

---

## System Architecture

The Orbitwatch application consists of two main components:

1.  **Python Backend:** A Flask application using Socket.IO for real-time communication. It is the authoritative source of all data, responsible for fetching, processing, and analyzing satellite data.
2.  **Next.js Frontend:** A modern, reactive web interface for visualizing the data provided by the backend. It includes a real-time world map, a detailed RSO (Resident Space Object) characterization panel, and logging components.

The two components communicate via a WebSocket connection, allowing the backend to push live data to the frontend as it is generated.

## Dashboard UI Explained

The main dashboard provides a high-level overview of the monitored environment. Here is a breakdown of each metric in the header:

-   **Alerts:** This is a live count of the total number of anomalies that have been detected by the ML models during the current session.
-   **RSOs:** This shows the number of Resident Space Objects (satellites) currently being tracked and analyzed by the system.
-   **TTPs:** This metric represents Tactics, Techniques, and Procedures. It is currently a static placeholder value included for future expansion.
-   **Score:** This is an overall situational awareness score, calculated based on the severity of recent anomalies. It provides a quick, color-coded indication of the current threat level (lower is more severe).

## End-to-End Data Pipeline

The entire system is driven by a real-time, in-memory data pipeline that originates in the Python backend.

1.  **Authentication:** The process begins when the user provides Space-Track.org credentials through the frontend UI.
2.  **TLE Data Fetching:** The backend uses these credentials to authenticate with the Space-Track API and fetches the latest Two-Line Element (TLE) data.
3.  **Orbital Propagation:** The raw TLE data for each satellite is fed into the **SGP4 physics model** to accurately calculate its precise position and velocity.
4.  **Telemetry Derivation:** Using the positional data from SGP4, the backend derives a realistic telemetry vector (power, temperature, etc.) for each satellite.
5.  **ML Anomaly Detection:** This derived telemetry vector is passed to the ML models for anomaly detection.
6.  **Data Streaming:** The results are packaged and streamed to the frontend via a WebSocket.

### Data Accuracy Clarification

-   **The orbital data is real.** It is based on official TLE sets from Space-Track and processed with the industry-standard SGP4 physics model.
-   **The telemetry data is derived.** Since we cannot access the satellite's internal hardware, we generate a high-fidelity, physics-informed estimate of these values. This is a necessary step to create the patterns that the ML models are trained on.

## Space-Track API Integration

For a senior developer or employer, understanding the specifics of the external API integration is crucial. This section provides a detailed breakdown.

### Authentication and Security

The application ensures that user credentials are handled securely.

1.  **Credential Input:** Credentials are entered on the client-side but are **never stored on the client**.
2.  **Authentication Request:** They are immediately sent to the backend, which makes a `POST` request to the Space-Track authentication endpoint (`/ajaxauth/login`).
3.  **Session-Based Security:** Upon successful login, the Space-Track API returns a session cookie. The backend `requests.Session()` object automatically stores this cookie and includes it in all subsequent requests. This is a secure, standard method for API authentication, as the credentials themselves are only transmitted once, and all further communication is authenticated via the session. No API keys or tokens are exposed on the client side.

### API Request for TLE Data

The core data for this application is the Two-Line Element (TLE) set for each satellite.

-   **Request Type:** `GET`
-   **Endpoint:** `/basicspacedata/query/class/tle_latest/ORDINAL/1/NORAD_CAT_ID/{NORAD_IDS}/format/tle`
-   **Inputs / Parameters:**
    -   `{NORAD_IDS}`: A comma-separated string of NORAD Catalog IDs for the satellites to be tracked. For example: `"25544,28654,36516"`.
-   **Example API Call:**
    ```
    https://www.space-track.org/basicspacedata/query/class/tle_latest/ORDINAL/1/NORAD_CAT_ID/25544,28654,36516/format/tle
    ```

### Returned Data Structure (Output)

-   **Data Format:** The API returns the TLE data as **plain text**, not JSON or XML.
-   **Structure:** The data is highly structured and follows a rigid, column-based format defined by NORAD. Each satellite is represented by two lines of text, where each character at a specific column index has a precise meaning (e.g., orbital inclination, eccentricity).
-   **Example TLE Data:**
    ```
    1 25544U 98067A   24303.58555627  .00007889  00000+0  14759-3 0  9999
    2 25544  51.6416 251.2995 0006753  62.1192  28.0003 15.49511256423455
    ```
-   **Consumption:** This raw text is the direct input for the `sgp4` library in the backend, which parses it to create a physics-enabled satellite object for orbital propagation.

## Data Storage

Orbitwatch is designed for **real-time, in-memory processing**.

-   **No Database:** There is no persistent database solution. All data is transient and held in memory for the duration of the application's runtime.
-   **Rationale:** This approach prioritizes speed and low latency, which are critical for a real-time monitoring dashboard. Data is fetched and processed on-the-fly, not loaded from a stored collection.

## Machine Learning Models

Orbitwatch uses a multi-model approach for robust anomaly detection.

### 1. TensorFlow Autoencoder
-   **Purpose:** Detects subtle deviations in the overall telemetry pattern.
-   **How it Works:** The model learns to reconstruct normal telemetry data. A high reconstruction error indicates the current telemetry is unusual.

### 2. Scikit-learn Isolation Forest
-   **Purpose:** Identifies anomalies by how easily they can be isolated.
-   **How it Works:** Anomalous points are "few and different" and are therefore easier to separate from normal data.

### 3. Scikit-learn One-Class SVM
-   **Purpose:** Creates a boundary around "normal" data points.
-   **How it Works:** Any new data point that falls outside the learned boundary is considered an anomaly.

### Composite Threat Score
The individual scores are normalized and averaged to produce a single, holistic **Threat Score**.

## Backend (Python / Flask)

-   **Framework:** Flask with Flask-SocketIO.
-   **Core Logic:** `services/ml_service/main.py`.
-   **Responsibilities:** Manages the Space-Track API session, runs the data generation loop, performs SGP4 calculations, executes ML models, and streams data to the frontend.
-   **Dependencies:** `requirements.txt`.

## Frontend (Next.js)

-   **Framework:** Next.js with React.
-   **UI Components:** ShadCN/UI and Tailwind CSS.
-   **Core Logic:**
    - `app/page.tsx`: Main dashboard component.
    - `lib/real-time-inference.ts`: Manages WebSocket connection and state.
    - `app/components/OrbitalMap.tsx`: Renders satellite positions with Leaflet.js.
    - `app/components/RSOCharacterization.tsx`: Displays detailed telemetry and anomaly scores.

## Setup and Installation

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- A valid Space-Track.org account

### Backend Setup
1.  Install Python dependencies: `pip install -r requirements.txt`
2.  Start the server: `python3 services/ml_service/main.py`

### Frontend Setup
1.  Install Node.js dependencies: `npm install`
2.  Start the server: `npm run dev`

Open the application in your browser. You will be prompted for Space-Track credentials or can use the "Use Dummy Data" option.

## Known Issues

-   **Frontend Rendering Crash:** The application is currently affected by a persistent Next.js server-side rendering (SSR) issue that causes the page to load blank with a `500 Internal Server Error`. This is a framework-level issue that requires further, specialized debugging.
