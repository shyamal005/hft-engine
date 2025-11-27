import React, { useEffect, useState, useRef } from 'react';


interface OrderBookData {
  bids: number[][];
  asks: number[][];
  eventTime: number;  
  serverTime: number; 
}

const App: React.FC = () => {
  const [data, setData] = useState<OrderBookData | null>(null);
  const [latency, setLatency] = useState<string>("0");
  const [throughput, setThroughput] = useState<number>(0); 
  
 
  const ws = useRef<WebSocket | null>(null);
  const messageCount = useRef<number>(0); 

  
  useEffect(() => {
    const interval = setInterval(() => {
      setThroughput(messageCount.current); 
      messageCount.current = 0;            
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  
  useEffect(() => {
    const WS_URL = process.env.REACT_APP_WS_URL || "ws://127.0.0.1:8080/stream";
    
    console.log("Connecting to Backend at:", WS_URL);
    
    ws.current = new WebSocket(WS_URL);

    ws.current.onopen = () => {
      console.log("✅ Connected to Java Backend");
    };

    ws.current.onmessage = (event) => {
      
      messageCount.current += 1;

      const parsed: OrderBookData = JSON.parse(event.data);
      const now = Date.now();

      
      const internalLatency = now - parsed.serverTime; 

      setData(parsed);
      setLatency(`${internalLatency}ms`);
    };

    ws.current.onclose = () => console.log("❌ Disconnected");

    return () => {
      ws.current?.close();
    };
  }, []);

 
  const renderRow = (price: number, qty: number, isBid: boolean) => {
    return (
      <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          fontFamily: '"Roboto Mono", "Courier New", monospace', 
          fontSize: '14px',
          padding: '4px 0', 
          borderBottom: '1px solid #1e2329' 
      }}>
        <span style={{ color: isBid ? '#0ecb81' : '#f6465d', fontWeight: 600 }}>
          {price.toFixed(2)}
        </span>
        <span style={{ color: '#848e9c' }}>
          {qty.toFixed(4)}
        </span>
      </div>
    );
  };

  return (
    <div style={{ 
        backgroundColor: '#0b0e11', 
        color: '#eaecef', 
        minHeight: '100vh', 
        padding: '40px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    }}>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '10px' }}>
          ⚡ HFT Execution Monitor
        </h1>
        <p style={{ color: '#848e9c', fontSize: '14px' }}>
          Live Feed: BTC/USDT • Protocol: WebSocket • Backend: Java Spring Boot
        </p>
      </div>
      
      <div style={{ 
          border: '1px solid #2b3139', 
          backgroundColor: '#1e2329',
          padding: '20px', 
          borderRadius: '8px',
          marginBottom: '40px',
          display: 'flex',
          gap: '60px'
      }}>
        {/* Metric 1: Latency */}
        <div>
          <div style={{ color: '#848e9c', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Internal Processing Latency
          </div>
          <div style={{ color: '#f0b90b', fontSize: '32px', fontWeight: 'bold', fontFamily: 'monospace', marginTop: '5px' }}>
            {latency}
          </div>
          <div style={{ color: '#4caf50', fontSize: '11px', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '8px', height: '8px', backgroundColor: '#4caf50', borderRadius: '50%', display: 'inline-block' }}></span>
            Optimal (Java → React)
          </div>
        </div>

        {/* Metric 2: Throughput (Dynamic) */}
        <div>
          <div style={{ color: '#848e9c', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            System Throughput
          </div>
          <div style={{ color: '#fff', fontSize: '32px', fontWeight: 'bold', fontFamily: 'monospace', marginTop: '5px' }}>
            {throughput} Hz
          </div>
          <div style={{ color: '#848e9c', fontSize: '11px', marginTop: '5px' }}>
            Updates per second
          </div>
        </div>
      </div>

      {/* Order Book Grid */}
      <div style={{ display: 'flex', gap: '40px' }}>
        
        {/* BIDS Column */}
        <div style={{ flex: 1 }}>
          <div style={{ 
            display: 'flex', justifyContent: 'space-between', 
            color: '#848e9c', fontSize: '12px', paddingBottom: '10px',
            borderBottom: '1px solid #2b3139', marginBottom: '10px'
          }}>
            <span>BID PRICE (USD)</span>
            <span>QTY (BTC)</span>
          </div>
          <div>
            {data?.bids.map(([price, qty], index) => (
              <React.Fragment key={`bid-${index}`}>
                {renderRow(price, qty, true)}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* ASKS Column */}
        <div style={{ flex: 1 }}>
          <div style={{ 
            display: 'flex', justifyContent: 'space-between', 
            color: '#848e9c', fontSize: '12px', paddingBottom: '10px',
            borderBottom: '1px solid #2b3139', marginBottom: '10px'
          }}>
            <span>ASK PRICE (USD)</span>
            <span>QTY (BTC)</span>
          </div>
          <div>
            {data?.asks.map(([price, qty], index) => (
              <React.Fragment key={`ask-${index}`}>
                {renderRow(price, qty, false)}
              </React.Fragment>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default App;