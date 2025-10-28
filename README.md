# Orbitwatch: Real-Time Satellite Anomaly Detection

**Orbitwatch** is a comprehensive, real-time satellite anomaly detection platform. It provides a high-fidelity dashboard for monitoring satellite health, visualizing orbital data, and detecting potential anomalies using a powerful Python-based machine learning backend.

![Orbitwatch Screenshot](https://i.imgur.com/8i2E26E.png)

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [The Machine Learning Pipeline](#the-machine-learning-pipeline)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
  - [Running the Application](#running-the-application)
- [Technology Stack](#technology-stack)

---

## Features

Orbitwatch is designed to provide a complete, end-to-end solution for satellite monitoring and anomaly detection.

-   **Real-Time Dashboard:** A dynamic and intuitive user interface that updates in real-time without the need for page reloads. All components, from key performance indicators to charts, are streamed live from the backend.
-   **Interactive Orbital Map:** A lightweight and performant orbital map, built with Leaflet.js, that visualizes satellite positions and highlights anomalies as they are detected.
-   **Hybrid Anomaly Detection:** A sophisticated backend powered by a combination of TensorFlow and Scikit-learn models to provide robust and sensitive anomaly detection.
-   **Rich Data Visualization:** The dashboard includes a variety of components to provide a deep understanding of the satellite network's health, including:
    -   **RSO Characterization:** Panels that provide detailed information on Resident Space Objects.
    -   **Logging:** A real-time log of all detected anomalies and system events.
    -   **Manual Alerts:** The ability for users to manually flag anomalies and create their own alerts.
-   **SPARTA/MITRE TTP Alignment:** A unique feature that maps detected anomalies to the [SPARTA](https://sirt.arizona.edu/projects/sparta) framework, providing valuable context for threat intelligence.

---

## Architecture

Orbitwatch is built on a modern, three-tier architecture that is designed for real-time data flow and scalability.

```mermaid
graph TD
    A[Space-Track.org API] -->|1. Fetches TLE Data| B(Python ML Backend);
    B -->|3. Streams Processed Data via WebSocket| C{Next.js Frontend};
    C -->|2. Renders Real-Time Dashboard| D(User);
    C -->|4. Sends User Actions| B;
```

1.  **Data Source (Space-Track.org API):** The application uses the official Space-Track.org API as its source of live satellite Two-Line Element (TLE) data.
2.  **Python ML Backend (The Brain):** The core of the application is a Python service built with Flask-SocketIO. It is responsible for:
    -   **Data Ingestion:** Periodically fetching and parsing live TLE data from Space-Track.
    -   **ML Pipeline:** Managing the training and real-time inference of a hybrid set of machine learning models.
    -   **Real-Time Analysis:** Detecting anomalies and generating rich data payloads, including logs and SPARTA/MITRE TTP alignments.
    -   **Data Streaming:** Broadcasting the complete, processed dashboard data to all connected clients via WebSockets.
3.  **Next.js Frontend (The User Experience):** The user-facing application is a modern web application built with Next.js and React. It establishes a persistent WebSocket connection with the backend to receive a continuous stream of data, which it then uses to render the interactive dashboard and orbital map.

This decoupled architecture ensures a clean separation of concerns, making the system scalable and maintainable.

---

## The Machine Learning Pipeline

The heart of the Orbitwatch backend is its sophisticated machine learning pipeline, which is designed for robust and sensitive anomaly detection.

-   **Data Source:** The models are trained exclusively on **real, live TLE data** from Space-Track. This data is parsed into a variety of telemetry features, including power, temperature, and altitude, to provide a comprehensive view of a satellite's operational health.
-   **Hybrid Model Approach:** Orbitwatch uses a combination of models to ensure the highest level of accuracy:
    -   **TensorFlow Autoencoder:** This neural network learns a baseline of normal operational patterns and is excellent at detecting subtle deviations from that baseline.
    -   **Scikit-learn Isolation Forest:** An ensemble model that excels at identifying statistical outliers in the data.
    -   **Scikit-learn One-Class SVM:** A classic and powerful algorithm for novelty and outlier detection.
-   **Training:** The models are trained on an initial batch of live data that is fetched when the backend server starts. The system is designed for periodic retraining, allowing it to adapt to new patterns over time.

By combining the results from these three models, Orbitwatch is able to detect a wide range of potential anomalies with a high degree of confidence.

---

## Getting Started

Follow these instructions to set up and run the Orbitwatch application on your local machine.

### Prerequisites

-   [Node.js](https://nodejs.org/) (v18 or later)
-   [Python](https://www.python.org/) (v3.9 or later)
-   A [Space-Track.org](https://www.space-track.org/) account with a verified username and password.

### Installation

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/your-username/orbitwatch.git
    cd orbitwatch
    ```

2.  **Install Frontend Dependencies:**
    ```bash
    npm install
    ```

3.  **Install Backend Dependencies:**
    ```bash
    pip install -r services/ml_service/requirements.txt
    ```

### Configuration

You will need to provide your Space-Track.org credentials to the application. To do this, create a `.env.local` file in the root of the project and add the following lines:

```
SPACE_TRACK_USERNAME="your-space-track-username"
SPACE_TRACK_PASSWORD="your-space-track-password"
```

**Note:** This file is included in the `.gitignore` to ensure that your credentials are not accidentally committed to the repository.

### Running the Application

You will need to run the backend and frontend servers in separate terminals.

1.  **Start the Python ML Backend:**
    ```bash
    python3 services/ml_service/main.py
    ```
    The backend server will start on `http://localhost:5000`.

2.  **Start the Next.js Frontend:**
    ```bash
    npm run dev
    ```
    The frontend development server will start on `http://localhost:3000`.

You can now open your browser and navigate to `http://localhost:3000` to see the Orbitwatch application in action.

---

## Technology Stack

### Backend

-   **Python**
-   **Flask-SocketIO:** For real-time, bi-directional communication with the frontend.
-   **TensorFlow/Keras:** For the autoencoder model.
-   **Scikit-learn:** For the Isolation Forest and One-Class SVM models.
-   **Requests:** For fetching data from the Space-Track.org API.

### Frontend

-   **Next.js:** A React framework for building modern web applications.
-   **React:** A JavaScript library for building user interfaces.
-   **Leaflet.js:** An open-source JavaScript library for mobile-friendly interactive maps.
-   **Socket.IO Client:** For connecting to the backend WebSocket server.
-   **Recharts:** A composable charting library built on React components.
-   **Tailwind CSS:** A utility-first CSS framework for rapid UI development.
