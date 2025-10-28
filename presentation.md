# Orbitwatch Architecture Presentation

---

## Slide 1: Title Slide

**Text:**

> **Orbitwatch: Real-Time Satellite Anomaly Detection**
> *Architectural Overview*

**Speaker Notes:**

"Welcome, everyone. Today, I'll be walking you through the architecture of Orbitwatch.

Before we dive in, let's talk about the problem we're solving. Monitoring a single satellite is complex; monitoring a whole constellation is a monumental task. The volume of data is immense, and the window to detect and react to a problem is incredibly small. A power fluctuation or a sensor malfunction could be a minor glitch, or it could be the first sign of a critical failure. How do you spot the needle in the haystack, in real-time?

That's the core mission of Orbitwatch. It’s designed to be a highly intelligent and intuitive platform that acts as a mission control center for satellite health. It doesn't just show you raw data; it uses a powerful machine learning backend to analyze that data, spot anomalies as they happen, and present that information on a clear, real-time dashboard. Let's look at how we built it."

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

"Our architecture is built on a simple but powerful principle: separation of concerns. Think of it like a restaurant. You have the kitchen, the waiter, and the diner. Each has a distinct role.

First, we have our data source, the official **Space-Track.org API**. This is our 'supplier'—it provides the raw, fresh ingredients, which in our case is live satellite data.

Next, we have the **Python ML Backend**. This is the 'kitchen'. It's the brain of the operation. It takes the raw ingredients from the supplier, and then it does all the heavy lifting: it cleans the data, runs it through a series of complex checks using our machine learning models, and prepares a complete, fully analyzed 'plate' of information.

Finally, we have the **Next.js Frontend**. This is our 'waiter'. Its job is to present that fully prepared plate of information to the diner—our user. The key here is the connection between the kitchen and the waiter. We use something called a WebSocket, which is like a dedicated, direct phone line. As soon as a new piece of information is ready, the backend instantly pushes it to the frontend, so the user sees it immediately. This is what makes our dashboard truly 'real-time'.

This separation is critical. By keeping the kitchen (our backend) separate from the dining room (our frontend), we can scale and improve each part independently without disrupting the others."

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

"Let's spend a moment on the heart of Orbitwatch—the Python backend. You can think of this service as our virtual mission control center.

It's built with Python, using a framework called Flask, which is robust and reliable. For that 'direct phone line' communication we just talked about, we use a library called Flask-SocketIO.

The backend has a tireless, automated operator—a background thread—that is always on duty. Every sixty seconds, it automatically calls the Space-Track API to get the latest satellite data. This ensures we are never working with stale information.

Once the data is in, it's sent to our team of 'expert analysts'—the machine learning models—to be checked for anomalies. But it doesn't stop there. The backend also enriches this data. It generates logs, characterizes potential space objects, and even maps anomalies to known threat patterns using the SPARTA/MITRE framework.

Finally, it packages all of this—the raw data, the ML analysis, the logs, everything—into a single, neat bundle and sends it down that direct line to the frontend. This ensures our user interface is always perfectly in sync with the latest intelligence."

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

"Now, for the really exciting part: how we actually find the anomalies. We made a critical decision early on: our models are trained *exclusively* on real satellite data. This is crucial. It means our system learns what 'normal' looks like from actual, operational satellites, not from clean, simulated data.

To do this, we employ a team of three different 'expert analysts', each with a unique skill:

First is our **TensorFlow Autoencoder**. Think of this model as a master forger who has been trained to perfectly replicate a genuine masterpiece. It learns the signature of 'normal' satellite data so well that when it's given something slightly off—an anomaly—it struggles to replicate it. The difference between the original and its flawed copy is what we call 'reconstruction error', and it’s a giant red flag that something is wrong.

Second, we have the **Isolation Forest**. This analyst is a specialist in playing 'spot the difference'. It's incredibly efficient at isolating data points that just don't fit in with the rest of the crowd. It’s our first line of defense for catching obvious outliers.

Finally, we have the **One-Class SVM**. You can think of this model as a highly-trained security guard. It builds a very tight, well-defined bubble around what it considers 'normal' behavior. Any data point that falls even slightly outside of this bubble is immediately flagged as a potential threat.

By combining the perspectives of these three different experts, our system can detect a much wider range of anomalies—from subtle, slow-developing issues to sudden, glaring errors—making our detection capabilities incredibly sensitive and reliable."

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

"Let's move to the part of the application our users see and interact with: the frontend. Our main goal here was to create a seamless and highly responsive experience.

The entire interface is built using Next.js and React, and you can think of it as a 'smart whiteboard'. When the backend sends a new update, we don't have to erase and redraw the entire board. Instead, React intelligently identifies exactly which numbers or icons need to change and updates only them. This is what makes the application feel so fast and fluid, with no annoying page reloads.

To build the interface, we use a 'component-based' approach. Think of it like using pre-built, intelligent LEGO blocks. Each piece of the UI—a chart, a map, a log panel—is a self-contained component. This makes our UI consistent, reliable, and easy to manage.

The orbital map is built with a library called Leaflet, which is very lightweight and performant. And it’s not just for looking at data; the user can interact with it. They can flag anomalies or even create manual alerts. When they do this, the information is sent *back* to the backend along that same 'direct phone line', demonstrating that communication flows both ways."

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

"So, to bring it all together, let's follow the life of a single piece of data. This entire cycle is the 'heartbeat' of the Orbitwatch application, and it runs continuously.

Every sixty seconds, our 'mission control center'—the Python backend—reaches out to our official 'supplier'—the Space-Track API—for the latest satellite data.

That data is then handed off to our 'team of expert analysts'—the ML models—who scrutinize it for any signs of trouble. The results are then packaged into a complete intelligence briefing.

Next, that briefing is sent instantly over the 'direct phone line'—our WebSocket—to the 'waiter'—our Next.js frontend.

Finally, the frontend's 'smart whiteboard' updates to show the user the latest information.

This entire process is automated, continuous, and highly efficient. The result is a system that provides true, real-time situational awareness, giving our users the critical information they need, exactly when they need it.

Thank you."

---
