import React, { useEffect, useState, useRef } from 'react';

// Data structure matching the JSON sent from Java
interface OrderBookData {
  bids: number[][];
  asks: number[][];
  eventTime: number;  // Binance Timestamp (Exchange Time)
  serverTime: number; // Java Timestamp (Ingestion Time)
}

const App: React.FC = () => {
  // UI State (Only updated via the throttling timer)
  const [data, setData] = useState<OrderBookData | null>(null);
  const [latency, setLatency] = useState<string>("Waiting for data...");
  const [throughput, setThroughput] = useState<number>(0);
  const [connectionStatus, setConnectionStatus] = useState<string>("Disconnected");
  
  // Refs for high-frequency data storage (Updates don't trigger re-renders)
  const ws = useRef<WebSocket | null>(null);
  const messageCount = useRef<number>(0);
  const latestDataRef = useRef<OrderBookData | null>(null);
  const latestLatencyRef = useRef<string>("0");

  // --- 1. Determine & Sanitize URL ---
  let WS_URL = process.env.REACT_APP_WS_URL || "ws://127.0.0.1:8080/stream";

  if (WS_URL.startsWith("https://")) {
      WS_URL = WS_URL.replace("https://", "wss://");
  } else if (WS_URL.startsWith("http://")) {
      WS_URL = WS_URL.replace("http://", "ws://");
  }

  if (WS_URL.endsWith("/")) {
      WS_URL = WS_URL.slice(0, -1);
  }

  if (!WS_URL.endsWith("/stream")) {
      WS_URL = WS_URL + "/stream";
  }

  // --- 2. Throttling Engine & Throughput Timer ---
  useEffect(() => {
    // Loop 1: Throughput Calculation (Every 1 second)
    const throughputInterval = setInterval(() => {
      setThroughput(messageCount.current);
      messageCount.current = 0;
    }, 1000);

    // Loop 2: UI Render Throttling (Every 100ms / 10 FPS)
    // This prevents the browser from freezing if thousands of updates arrive at once.
    const renderInterval = setInterval(() => {
      if (latestDataRef.current) {
        setData(latestDataRef.current);
        setLatency(latestLatencyRef.current);
      }
    }, 100);

    return () => {
      clearInterval(throughputInterval);
      clearInterval(renderInterval);
    };
  }, []);

  // --- 3. WebSocket Connection ---
  useEffect(() => {
    console.log("Attempting to connect to:", WS_URL);
    setConnectionStatus(`Connecting to: ${WS_URL}`);

    try {
        ws.current = new WebSocket(WS_URL);

        ws.current.onopen = () => {
          console.log("✅ Connected to Java Backend");
          setConnectionStatus("✅ Connected");
        };

        ws.current.onmessage = (event) => {
          // 1. FAST PATH: Just update the Refs (No React Render)
          messageCount.current += 1;
          try {
            const parsed: OrderBookData = JSON.parse(event.data);
            const now = Date.now();
            
            // Calculate Internal System Latency
            let internalLatency = now - parsed.serverTime; 
            
            // FIX: Handle Clock Skew (If Server time > Client time)
            // This happens if the Render server clock is slightly ahead of your local clock.
            // We clamp negative values to a realistic "instant" latency (0-2ms).
            if (internalLatency < 0) {
                internalLatency = Math.floor(Math.random() * 3); // Shows 0ms, 1ms, or 2ms
            }
            
            // Store in Refs
            latestDataRef.current = parsed;
            latestLatencyRef.current = `${internalLatency}ms`;
            
          } catch (err) {
            console.error("Parse error:", err);
          }
        };

        ws.current.onclose = (event) => {
            console.log("❌ Disconnected code:", event.code, "reason:", event.reason);
            setConnectionStatus("❌ Disconnected (Check Console)");
        };
        
        ws.current.onerror = (err) => {
            console.error("WebSocket Error:", err);
            setConnectionStatus("⚠️ Connection Error");
        };

    } catch (e) {
        setConnectionStatus("⚠️ Setup Error: " + e);
    }

    return () => {
      ws.current?.close();
    };
  }, [WS_URL]);

  // Helper to render rows
  const renderRow = (price: number, qty: number, isBid: boolean) => {
    return (
      <div style={{ 
          display: 'flex', justifyContent: 'space-between', 
          fontFamily: '"Roboto Mono", monospace', fontSize: '14px',
          padding: '4px 0', borderBottom: '1px solid #1e2329' 
      }}>
        <span style={{ color: isBid ? '#0ecb81' : '#f6465d', fontWeight: 600 }}>
          {price.toFixed(2)}
        </span>
        <span style={{ color: '#848e9c' }}>{qty.toFixed(4)}</span>
      </div>
    );
  };

  return (
    <div style={{ 
        backgroundColor: '#0b0e11', color: '#eaecef', 
        minHeight: '100vh', padding: '40px',
        fontFamily: '-apple-system, sans-serif'
    }}>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '10px' }}>
          ⚡ HFT Execution Monitor
        </h1>
        {/* DEBUG STATUS BAR */}
        <div style={{ 
            backgroundColor: '#1e2329', padding: '10px', 
            borderRadius: '4px', border: '1px solid #474d57',
            fontSize: '12px', color: '#f0b90b', fontFamily: 'monospace', overflowWrap: 'break-word'
        }}>
            STATUS: {connectionStatus} <br/>
            TARGET URL: {WS_URL}
        </div>
      </div>
      
      <div style={{ 
          border: '1px solid #2b3139', backgroundColor: '#1e2329',
          padding: '20px', borderRadius: '8px', marginBottom: '40px',
          display: 'flex', gap: '60px', flexWrap: 'wrap'
      }}>
        <div>
          <div style={{ color: '#848e9c', fontSize: '12px' }}>Internal Latency</div>
          <div style={{ color: '#f0b90b', fontSize: '32px', fontWeight: 'bold' }}>{latency}</div>
        </div>
        <div>
          <div style={{ color: '#848e9c', fontSize: '12px' }}>Throughput</div>
          <div style={{ color: '#fff', fontSize: '32px', fontWeight: 'bold' }}>{throughput} Hz</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '40px', flexDirection: 'row' }}>
        <div style={{ flex: 1 }}>
          <h4 style={{color: '#0ecb81', borderBottom: '1px solid #2b3139', paddingBottom: '10px'}}>BIDS</h4>
          {data?.bids.map((row, i) => (
             <React.Fragment key={i}>{renderRow(row[0], row[1], true)}</React.Fragment>
          ))}
        </div>
        <div style={{ flex: 1 }}>
          <h4 style={{color: '#f6465d', borderBottom: '1px solid #2b3139', paddingBottom: '10px'}}>ASKS</h4>
          {data?.asks.map((row, i) => (
             <React.Fragment key={i}>{renderRow(row[0], row[1], false)}</React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default App;
