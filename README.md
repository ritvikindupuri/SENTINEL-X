# Orbitwatch - Satellite Anomaly Detection Dashboard

Orbitwatch is a real-time dashboard for monitoring satellite telemetry and detecting anomalies using a combination of machine learning models. It provides a comprehensive view of satellite operations, enabling operators to identify and respond to potential threats with high-fidelity, physics-backed data.

## Table of Contents
1.  [System Architecture](#system-architecture)
2.  [End-to-End Data Pipeline](#end-to-end-data-pipeline)
    - [Data Source & Accuracy](#data-source--accuracy)
3.  [Machine Learning Models](#machine-learning-models)
    - [TensorFlow Autoencoder](#1-tensorflow-autoencoder)
    - [Scikit-learn Isolation Forest](#2-scikit-learn-isolation-forest)
    - [Scikit-learn One-Class SVM](#3-scikit-learn-one-class-svm)
    - [Composite Threat Score](#composite-threat-score)
4.  [Backend (Python / Flask)](#backend-python--flask)
5.  [Frontend (Next.js)](#frontend-nextjs)
6.  [Setup and Installation](#setup-and-installation)
    - [Prerequisites](#prerequisites)
    - [Backend Setup](#backend-setup)
    - [Frontend Setup](#frontend-setup)
7.  [Known Issues](#known-issues)

---

## System Architecture

The Orbitwatch application consists of two main components:

1.  **Python Backend:** A Flask application using Socket.IO for real-time communication. It is the authoritative source of all data, responsible for fetching, processing, and analyzing satellite data.
2.  **Next.js Frontend:** A modern, reactive web interface for visualizing the data provided by the backend. It includes a real-time world map, a detailed RSO (Resident Space Object) characterization panel, and logging components.

The two components communicate via a WebSocket connection, allowing the backend to push live data to the frontend as it is generated.

## End-to-End Data Pipeline

The entire system is driven by a real-time, in-memory data pipeline that originates in the Python backend.

1.  **Authentication:** The process begins when the user provides Space-Track.org credentials through the frontend UI.
2.  **TLE Data Fetching:** The backend uses these credentials to authenticate with the Space-Track API and fetches the latest Two-Line Element (TLE) data for a predefined list of satellites (e.g., ISS, Hubble).
3.  **Orbital Propagation:** The raw TLE data for each satellite is fed into the **SGP4 physics model**. This model accurately calculates the satellite's precise position (latitude, longitude, altitude) and velocity at the current time.
4.  **Telemetry Derivation:** Using the high-fidelity positional data from SGP4, the backend derives a realistic telemetry vector for each satellite. This includes parameters like power, temperature, and fuel level, which are estimated based on the satellite's orbital state (e.g., in sunlight vs. eclipse).
5.  **ML Anomaly Detection:** This derived telemetry vector is then passed to a suite of three machine learning models for anomaly detection.
6.  **Data Streaming:** The results, including the satellite's position, derived telemetry, and anomaly scores, are packaged into a `dashboard_data` object and streamed to the frontend via a WebSocket. This process repeats in a continuous loop.

### Data Source & Accuracy

It is critical to understand the nature of the data within Orbitwatch:

-   **The orbital data is real.** It is based on official TLE sets from Space-Track and processed with the industry-standard SGP4 physics model. The satellite positions and velocities displayed are high-fidelity calculations of their real-world state.
-   **The telemetry data is derived.** Since we do not have a direct hardware link to the satellites, we cannot get their actual internal telemetry. Instead, we generate a high-fidelity, physics-informed estimate of these values. This is a necessary step to create the patterns that the ML models are trained on. This approach ensures that the anomalies detected are based on deviations from physically realistic behavior.

## Machine Learning Models

Orbitwatch uses a multi-model approach to provide robust anomaly detection. The derived telemetry for each satellite is analyzed by three distinct unsupervised learning models.

### 1. TensorFlow Autoencoder
-   **Purpose:** Detects subtle deviations in the overall telemetry pattern.
-   **How it Works:** The autoencoder is trained to compress and then reconstruct the normal telemetry data. If the model is unable to accurately reconstruct the incoming data (i.e., there is a high "reconstruction error"), it means the current telemetry does not match the learned normal patterns and is flagged as a potential anomaly.

### 2. Scikit-learn Isolation Forest
-   **Purpose:** Identifies anomalies by how easily they can be isolated from the rest of the data.
-   **How it Works:** This model builds a forest of random trees. The core idea is that anomalous points are "few and different" and should therefore be easier to separate from the normal data points. The score reflects how quickly a data point is isolated.

### 3. Scikit-learn One-Class SVM
-   **Purpose:** Creates a boundary around the "normal" data points.
-   **How it Works:** The One-Class Support Vector Machine (SVM) is trained on the normal telemetry data to learn a hypersphere that encloses the majority of the data. Any new data point that falls outside this learned boundary is considered an anomaly.

### Composite Threat Score

The individual scores from the three models are normalized and then averaged to produce a single, holistic **Threat Score**. This composite score provides a more reliable and less noise-prone indicator of a potential anomaly than any single model could alone. A lower score indicates a higher probability of an anomaly.

## Backend (Python / Flask)

-   **Framework:** Flask with the Flask-SocketIO extension.
-   **Core Logic:** Located in `services/ml_service/main.py`.
-   **Responsibilities:**
    - Manages the Space-Track API session.
    - Runs the main data generation loop (`data_generation_loop`).
    - Performs SGP4 calculations.
    - Executes the ML models for anomaly detection.
    - Emits `dashboard_data` and `new_anomaly` events to the frontend via WebSocket.
-   **Dependencies:** Managed in `requirements.txt`.

## Frontend (Next.js)

-   **Framework:** Next.js with React (`"use client"`).
-   **UI Components:** Built using ShadCN/UI and styled with Tailwind CSS.
-   **Core Logic:**
    - The main `Dashboard` component is in `app/page.tsx`.
    - The `RealTimeInferenceService` in `lib/real-time-inference.ts` manages the WebSocket connection and local state.
    - **Map Visualization:** The `OrbitalMap` component (`app/components/OrbitalMap.tsx`) uses Leaflet.js to render satellite and anomaly positions.
    - **Data Display:** The `RSOCharacterization` component (`app/components/RSOCharacterization.tsx`) displays the detailed telemetry and anomaly scores for a selected satellite, including the explanatory tooltips for the ML models.

## Setup and Installation

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- A valid Space-Track.org account

### Backend Setup
1.  Navigate to the root directory.
2.  Install Python dependencies:
    ```bash
    pip install -r requirements.txt
    ```
3.  Start the backend server:
    ```bash
    python3 services/ml_service/main.py
    ```
    The server will run on `http://localhost:5000`.

### Frontend Setup
1.  In a separate terminal, navigate to the root directory.
2.  Install Node.js dependencies:
    ```bash
    npm install
    ```
3.  Start the frontend development server:
    ```bash
    npm run dev
    ```
    The frontend will be available at `http://localhost:3000` (or the next available port).

4.  Open the application in your browser. You will be prompted to enter your Space-Track credentials to begin the data flow. You can also use the "Use Dummy Data" option to proceed without real credentials.

## Known Issues

-   **Frontend Rendering Crash:** The application is currently affected by a persistent Next.js server-side rendering (SSR) issue that causes the page to load blank with a `500 Internal Server Error`. This is due to the client-side `socket.io-client` library being improperly loaded during the server-side build. This is a framework-level issue that requires further, specialized debugging. As a result, the UI is not currently functional, although the backend data pipeline and all UI component code are complete.
