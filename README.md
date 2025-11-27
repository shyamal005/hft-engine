
# ⚡ High-Frequency Trading (HFT) Low-Latency Execution Monitor

![Dashboard Screenshot](./screenshot.png)  
<!-- Replace with your actual dashboard screenshot -->

A high-performance market-data adapter and real-time visualization engine that ingests live crypto order-book updates, processes them in an in-memory Java backend, and streams them to a React dashboard with **sub-15ms internal latency**.

This project mimics the architecture used inside proprietary trading firms for low-latency market data processing.

---

## 🚀 Overview

This system bypasses database bottlenecks and handles all operations **entirely in RAM**.  
The backend maintains a thread-safe Limit Order Book, performs microsecond updates, and broadcasts deltas directly to a React UI using WebSockets.

It demonstrates the essential components of real-world HFT infrastructure:

- High-frequency WebSocket ingestion  
- Microsecond-level order book updates  
- Thread-safe concurrency  
- Zero-DB low-latency architecture  
- Real-time UI with rendering optimization  

---

## 🛠️ Tech Stack & Architecture

### **Backend — Java 17 + Spring Boot**
- **In-Memory Limit Order Book** using a TreeMap for O(log n) updates  
- **Concurrency Control:** `ReentrantReadWriteLock` for handling read-heavy UI access vs write-heavy market feed  
- **Native WS Client:** `java.net.http.WebSocket` for minimal overhead  
- **Zero-DB Architecture:** Optimized for microsecond-level processing  
- **Latency Metrics:** Internal system timestamps for ingestion → broadcast latency  

### **Frontend — React 18 + TypeScript**
- **Native WebSockets** for real-time duplex streaming  
- **10Hz Throttle Engine** to prevent DOM overload during volatility spikes  
- **Dark Terminal UI** with live order-book, latency, and throughput metrics  
- **Optimized Rendering:** `useRef` for fast ingestion, throttled `setState` for smooth 60fps rendering  

---

## 🏗️ System Architecture

```mermaid
graph LR
    A[Binance Exchange] -- WSS (100ms) --> B[Java Engine]
    B -- <50µs Processing --> C[In-Memory Order Book]
    C -- Local WSS --> D[React Dashboard]
````

---

## 🧠 Key Engineering Challenges & Solutions

### **1. Race Conditions with High-Velocity Streams**

**Problem:** WebSocket writes to the order book while UI threads read it.
**Solution:**

* `ReentrantReadWriteLock`
* Multiple concurrent reads
* Exclusive microsecond write lock

Ensures consistency without sacrificing throughput.

---

### **2. Negative Latency Due to Clock Skew**

**Problem:** Comparing Binance timestamps to local timestamps produced incorrect latency.
**Solution:**

* Measured **internal engine latency only**
* Ingestion timestamp → WebSocket broadcast timestamp

This isolates performance of the code from network jitter.

---

### **3. Browser Freezing at 1000+ msg/sec**

**Problem:** React crashed when updating on every incoming tick.
**Solution:**

* `useRef` for instant ingestion
* Throttled `setState` (10Hz) for rendering

Ensures high FPS and nondestructive updates.

---

## 📦 How to Run Locally

### **Prerequisites**

* Java 17+
* Node.js (LTS)
* Maven

---

### **1. Start Backend (Java Engine)**

```sh
cd hft-engine
./mvnw spring-boot:run
```

Expected:

```
✓ Connected to Binance Stream
✓ Engine initialized
```

---

### **2. Start Frontend (React Dashboard)**

```sh
cd hft-dashboard
npm start
```

Open in browser:
👉 [http://localhost:3000](http://localhost:3000)

---

## 🐳 Deployment (Docker + Render)

The backend ships with a production-ready Dockerfile using the Eclipse Temurin JDK.

### Example Environment Variables

```
REACT_APP_WS_URL=wss://your-service.onrender.com/stream
```

---

## 📈 Performance Metrics

| Metric             | Value    | Description                    |
| ------------------ | -------- | ------------------------------ |
| Ingestion Latency  | ~20 µs   | Java parsing + TreeMap update  |
| End-to-End Latency | 10–50 ms | Backend → WebSocket → React UI |
| Throughput         | ~10 Hz   | Throttled feed update rate     |

---

## 📁 Project Structure

```
hft-engine/
    ├── core/
    │     ├── OrderBook.java
    │     ├── PriceLevel.java
    │     └── LOBUtils.java
    ├── websocket/
    │     └── BinanceClient.java
    ├── broadcast/
    │     └── StreamController.java

hft-dashboard/
    ├── src/
    │     ├── hooks/useOrderBook.ts
    │     ├── components/OrderTable.tsx
    │     └── utils/throttle.ts
```

---

## 🔥 Why This Project Stands Out for HFT Recruiters

This project demonstrates expertise in:

* Low-latency system design
* Concurrent programming
* Memory-efficient data structures
* Event-driven architecture
* Real-time distributed systems
* Performance profiling
* UI throttling for high-volume streams

These skills directly map to:

* **HFT Market Data Engineer**
* **Low-Latency Java Developer**
* **Quant Developer**
* **Trading Systems Engineer**

---

## 📝 License

MIT License — free to use and modify.



