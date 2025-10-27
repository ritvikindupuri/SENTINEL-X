# Orbitwatch Architecture Presentation

---

## Slide 1: Title Slide

**Text:**

> **Orbitwatch: Real-Time Satellite Anomaly Detection**
> *Architectural Overview*

**Speaker Notes:**

"Welcome, everyone. Today, I'll be walking you through the architecture of Orbitwatch, our real-time satellite anomaly detection platform. The goal of Orbitwatch is to provide a comprehensive and intuitive dashboard for monitoring satellite health, visualizing orbital data, and detecting potential anomalies as they happen, using a powerful machine learning backend."

---

## Slide 2: High-Level Architecture

**Text:**

> **System Architecture Overview**
>
> ```mermaid
> graph TD
>     A[Space-Track.org API] -->|1. Fetches TLE Data| B(Python ML Backend);
>     B -->|3. Streams Processed Data via WebSocket| C{Next.js Frontend};
>     C -->|2. Renders Real-Time Dashboard| D(User);
>     C -->|4. Sends User Actions| B;
> ```
> *A decoupled, three-tier architecture for real-time data processing and visualization.*

**Speaker Notes:**

"At a high level, Orbitwatch uses a modern, three-tier architecture designed for real-time data flow.

First, we have our data source, the official **Space-Track.org API**, which provides live satellite telemetry data.

The core of our application is the **Python ML Backend**. This service is the brain; it’s responsible for fetching the data from Space-Track, processing it, training our machine learning models, and running real-time anomaly detection.

Finally, we have the **Next.js Frontend**, which is the user-facing application. It establishes a persistent WebSocket connection with the backend to receive a continuous stream of data, which it then uses to render the interactive dashboard and orbital map. This architecture ensures a clean separation of concerns, making the system scalable and maintainable."

---

## Slide 3: The Python ML Backend

**Text:**

> **The Brain of the Operation: Python ML Backend**
>
> - **Core Technologies:** Python, Flask-SocketIO, TensorFlow/Keras, Scikit-learn
> - **Key Responsibilities:**
>     - **Data Ingestion:** Periodically fetches and parses live TLE data from Space-Track.
>     - **ML Pipeline:** Manages the training and real-time inference of a hybrid set of ML models.
>     - **Real-Time Analysis:** Detects anomalies and generates rich data payloads, including logs and SPARTA/MITRE TTP alignments.
>     - **Data Streaming:** Broadcasts the complete, processed dashboard data to all connected clients via WebSockets.

**Speaker Notes:**

"Let's dive a bit deeper into the backend. It’s a standalone Python service built on Flask and Flask-SocketIO for robust WebSocket communication.

Its primary job is to act as a centralized data processor. A background thread continuously fetches the latest data from Space-Track, ensuring our system is always working with fresh information. This data is then fed into our machine learning pipeline for analysis.

Beyond just anomaly detection, the backend also aggregates all the data needed for the dashboard—from logs to RSO characterizations and even threat intelligence mapping via the SPARTA/MITRE framework. It then packages this into a single, comprehensive data object and streams it to the frontend, ensuring the UI is always perfectly in sync with the backend state."

---

## Slide 4: The Machine Learning Pipeline

**Text:**

> **Hybrid Anomaly Detection**
>
> - **Data Source:** Live Two-Line Element (TLE) data from Space-Track, parsed into telemetry features like power, temperature, and altitude.
> - **Our Models:** We use a combination of models for robust detection:
>     - **TensorFlow Autoencoder:** Detects subtle deviations from normal operational patterns.
>     - **Scikit-learn Isolation Forest:** An ensemble model that excels at identifying outliers.
>     - **Scikit-learn One-Class SVM:** A classic algorithm for novelty and outlier detection.
> - **Training:** The models are trained exclusively on live data. An initial batch is fetched on startup for baseline training, and the system is designed for periodic retraining to adapt over time.

**Speaker Notes:**

"The heart of our backend is the machine learning pipeline. We made a key architectural decision to train our models exclusively on *real* satellite data from Space-Track. This ensures our models learn from actual operational patterns, not synthetic data.

We use a hybrid approach for anomaly detection, combining three different models. A TensorFlow-based Autoencoder is great at learning a baseline of normal behavior and flagging deviations based on reconstruction error. We supplement this with two models from Scikit-learn—Isolation Forest and a One-Class SVM—which are excellent at identifying statistical outliers that the autoencoder might miss.

By combining the results from these three models, we get a highly reliable and sensitive anomaly detection system that can flag a wide range of potential issues."

---

## Slide 5: The Next.js Frontend

**Text:**

> **The User Experience: A Dynamic Frontend**
>
> - **Core Technologies:** Next.js, React, Leaflet.js, Socket.IO Client, Recharts
> - **Key Features:**
>     - **Real-Time Dashboard:** All components, from charts to KPI scores, update instantly as new data arrives.
>     - **Interactive Orbital Map:** Built with Leaflet.js, it visualizes satellite positions and highlights anomalies in real-time.
>     - **Rich Data Visualization:** Includes panels for logging, RSO characterization, and SPARTA/MITRE TTPs.
>     - **Interactive by Design:** Users can manually flag anomalies and create alerts, sending information back to the backend.

**Speaker Notes:**

"Moving to the frontend, our goal was to create a fluid and highly responsive user experience. We chose Next.js and React for building a modern, component-based UI.

The frontend establishes a WebSocket connection to our Python backend and then simply listens for data. When a new dashboard data payload arrives, the application's state is updated, and React efficiently re-renders only the components that have changed. This results in a seamless, real-time experience with no need for page reloads.

We're using Leaflet.js for a lightweight and performant orbital map, and Recharts for the dynamic charts. The UI is not just for display; it’s interactive, allowing users to flag events and submit manual alerts, which demonstrates the bi-directional communication capabilities of our WebSocket connection."

---

## Slide 6: End-to-End Data Flow

**Text:**

> **Putting It All Together: The Data Lifecycle**
>
> ```mermaid
> sequenceDiagram
>     participant ST as Space-Track API
>     participant BE as Python Backend
>     participant FE as Next.js Frontend
>
>     loop Real-Time Loop (every 60s)
>         BE->>ST: 1. Request TLE Data
>         ST-->>BE: 2. Return TLE Data
>         BE->>BE: 3. Process TLEs & Run ML Inference
>         BE-->>FE: 4. Emit 'dashboard_data' via WebSocket
>         FE->>FE: 5. Update State & Re-render UI
>     end
> ```

**Speaker Notes:**

"So, to summarize, let's look at the end-to-end data flow.

Every 60 seconds, a loop kicks off in our Python backend. It reaches out to the Space-Track API to get the latest satellite data. This data is then processed and run through our ML models to check for anomalies.

The backend then aggregates all this new information into a single dashboard payload and emits it over the WebSocket connection to every connected frontend client. The frontend receives this payload, updates its internal state, and React automatically re-renders the UI to reflect the latest information.

This entire cycle is continuous, efficient, and results in the real-time experience that is the core of the Orbitwatch application. Thank you."

---
