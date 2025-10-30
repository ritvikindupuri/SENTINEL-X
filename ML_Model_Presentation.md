# Orbitwatch ML Model Presentation (Revised)

This document provides a comprehensive, model-by-model breakdown of the machine learning system at the core of the Orbitwatch anomaly detection application.

## 1. Brief Overview Section

The application employs a hybrid approach to anomaly detection, utilizing a combination of three distinct unsupervised machine learning models. This multi-model system ensures robust and comprehensive threat detection by leveraging the unique strengths of each algorithm. The models are:

1.  **TensorFlow Autoencoder:** A neural network that learns a compressed representation of normal satellite telemetry data to identify subtle, complex deviations.
2.  **Scikit-learn Isolation Forest:** An ensemble-based model that efficiently detects outliers by "isolating" them from the normal data points.
3.  **Scikit-learn One-Class SVM:** A support vector machine algorithm that learns a boundary around normal data to identify any novel or unexpected observations.

## 2. Shared Preprocessing and Feature Engineering

Before diving into each model, it's important to understand the common data pipeline that feeds them. All three models are trained and run on the same input feature vector, which is generated from raw satellite data.

*   **Function:** `convert_satellite_to_telemetry`
*   **Inputs:** A `satellite` object containing detailed positional and simulated telemetry data.
*   **Processing:** This function selects key telemetry values and simulates others to create a consistent 8-dimensional feature vector (excluding the timestamp).
*   **Outputs:** A dictionary of telemetry features that serves as the input for the ML models.

```python
# services/ml_service/main.py - Feature Engineering

def convert_satellite_to_telemetry(satellite):
    telemetry = satellite['telemetry']
    return {
        'temperature': telemetry['temperature'],
        'power': telemetry['power'],
        'communication': telemetry['communication'],
        'orbit': satellite['altitude'],
        'voltage': telemetry['power'] > 80 and 12 + (random.random() - 0.5) * 1 or 10 + random.random() * 2,
        'solarPanelEfficiency': max(0, min(100, telemetry['power'] - 5 + random.random() * 10)),
        'attitudeControl': max(0, min(100, 95 + (random.random() - 0.5) * 10)),
        'fuelLevel': max(0, min(100, 80 + (random.random() - 0.5) * 30)),
        'timestamp': datetime.utcnow().timestamp(),
    }
```

## 3. Individual Model Breakdown and Code Analysis

---

### **Model 1: TensorFlow Autoencoder**

#### **What it is and why it's used:**

An Autoencoder neural network learns to identify normal behavior by compressing and then reconstructing its input. It is trained only on normal data. When it encounters an anomaly, the reconstruction will be poor, resulting in a high "reconstruction error." This makes it excellent for detecting subtle, complex deviations from normal satellite operations.

#### **Code Snippet Analysis:**

**1. Model Definition:**
The model is a sequential neural network defined in the `create_autoencoder` function. It has an input layer, three encoding layers that compress the data down to a 4-dimensional representation, and three decoding layers that attempt to reconstruct the original 8-dimensional input.

```python
# services/ml_service/main.py - Autoencoder Definition

def create_autoencoder(input_dim):
    input_layer = tf.keras.layers.Input(shape=(input_dim,))
    encoded = tf.keras.layers.Dense(16, activation="relu")(input_layer)
    encoded = tf.keras.layers.Dense(8, activation="relu")(encoded)
    encoded = tf.keras.layers.Dense(4, activation="relu")(encoded)
    decoded = tf.keras.layers.Dense(8, activation="relu")(encoded)
    decoded = tf.keras.layers.Dense(16, activation="relu")(decoded)
    decoded = tf.keras.layers.Dense(input_dim, activation="linear")(decoded)
    autoencoder = tf.keras.Model(inputs=input_layer, outputs=decoded)
    autoencoder.compile(optimizer="adam", loss="mean_squared_error")
    return autoencoder

autoencoder_model = create_autoencoder(8) # The input dimension is 8
```

**2. Model Training:**
During training, the model is given the `normalized_features` as both the input and the target output. Its goal is to learn how to reconstruct these features with the minimum possible error.

```python
# services/ml_service/main.py - Autoencoder Training

# This line is inside the train_models_on_data function
autoencoder_model.fit(normalized_features, normalized_features, epochs=50, batch_size=32, verbose=0)
```

**3. Inputs and Outputs (Inference):**
During inference, a single, normalized feature vector is passed to the model. The raw output is the `reconstruction_error`, calculated as the mean squared error between the input and the model's reconstruction. A higher error indicates a higher likelihood of an anomaly.

```python
# services/ml_service/main.py - Autoencoder Inference

# Input: normalized_features (a single data point)
reconstruction = autoencoder_model.predict(normalized_features)

# Output: reconstruction_error (a positive float)
reconstruction_error = np.mean(np.square(normalized_features - reconstruction))
```

**4. Threat Score Calculation:**
The raw `reconstruction_error` is converted to a 0-100 threat score. The formula scales the error, ensuring that a higher error corresponds to a higher threat score.

```python
# services/ml_service/main.py - Autoencoder Threat Score

# This is the relevant branch of the _normalize_score function
if score_type == 'autoencoder':
    return min(100, int(score * 200)) # Scale error to 0-100

# This is how it's called during inference
autoencoder_threat_score = _normalize_score(reconstruction_error, 'autoencoder')
```

---

### **Model 2: Scikit-learn Isolation Forest**

#### **What it is and why it's used:**

The Isolation Forest is a fast and efficient algorithm that works by "isolating" outliers. It builds random trees, and anomalies are expected to have shorter paths from the root of the tree to a leaf. It is excellent for quickly identifying data points that are clearly different from the rest of the data.

#### **Code Snippet Analysis:**

**1. Model Definition:**
The model is instantiated directly from the Scikit-learn library with standard parameters.

```python
# services/ml_service/main.py - Isolation Forest Definition

isolation_forest_model = IsolationForest(n_estimators=100, contamination='auto', random_state=42)
```

**2. Model Training:**
The model is trained on the normalized feature set from normal telemetry data.

```python
# services/ml_service/main.py - Isolation Forest Training

# This line is inside the train_models_on_data function
isolation_forest_model.fit(normalized_features)
```

**3. Inputs and Outputs (Inference):**
The `decision_function` method returns a raw anomaly score for the input data point. Scores are typically around 1 for normal data and -1 for anomalous data.

```python
# services/ml_service/main.py - Isolation Forest Inference

# Input: normalized_features (a single data point)
# Output: if_score (a float, more negative is more anomalous)
if_score = isolation_forest_model.decision_function(normalized_features)[0]
```

**4. Threat Score Calculation:**
The raw `if_score` is mapped to the 0-100 threat scale. The formula is designed to convert a score of -1 (highly anomalous) to a threat score of 100, and a score of 1 (highly normal) to a threat score of 0.

```python
# services/ml_service/main.py - Isolation Forest Threat Score

# This is the relevant branch of the _normalize_score function
elif score_type in ['if', 'svm']:
    return max(0, min(100, int(50 - score * 50))) # Map -1 to 100, 1 to 0

# This is how it's called during inference
if_threat_score = _normalize_score(if_score, 'if')
```

---

### **Model 3: Scikit-learn One-Class SVM**

#### **What it is and why it's used:**

A One-Class SVM is trained only on "normal" data and learns a boundary around it. It is a powerful novelty detector, capable of identifying data points that are different from the training data, even if they aren't statistically extreme outliers.

#### **Code Snippet Analysis:**

**1. Model Definition:**
The model is instantiated from Scikit-learn. The `rbf` kernel is used to capture complex, non-linear relationships in the data.

```python
# services/ml_service/main.py - One-Class SVM Definition

svm_model = OneClassSVM(nu=0.1, kernel="rbf", gamma=0.1)
```

**2. Model Training:**
The model is trained on the same normalized feature set as the other models.

```python
# services/ml_service/main.py - One-Class SVM Training

# This line is inside the train_models_on_data function
svm_model.fit(normalized_features)
```

**3. Inputs and Outputs (Inference):**
Similar to the Isolation Forest, the `decision_function` method returns a raw score indicating how far the data point is from the learned decision boundary. A negative score indicates an anomaly.

```python
# services/ml_service/main.py - One-Class SVM Inference

# Input: normalized_features (a single data point)
# Output: svm_score (a float, more negative is more anomalous)
svm_score = svm_model.decision_function(normalized_features)[0]
```

**4. Threat Score Calculation:**
The threat score calculation uses the exact same logic as the Isolation Forest to map the SVM's raw output score to the 0-100 threat scale.

```python
# services/ml_service/main.py - One-Class SVM Threat Score

# This is the relevant branch of the _normalize_score function
elif score_type in ['if', 'svm']:
    return max(0, min(100, int(50 - score * 50))) # Map -1 to 100, 1 to 0

# This is how it's called during inference
svm_threat_score = _normalize_score(svm_score, 'svm')
```
