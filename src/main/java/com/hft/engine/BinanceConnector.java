package com.hft.engine;

import com.hft.socket.UIBridge;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.WebSocket;
import java.util.concurrent.CompletionStage;
import java.util.concurrent.CountDownLatch;

@Component
public class BinanceConnector implements CommandLineRunner, WebSocket.Listener {
    private final OrderBook orderBook;
    private final UIBridge uiBridge;
    private final CountDownLatch latch = new CountDownLatch(1);

    public BinanceConnector(OrderBook orderBook, UIBridge uiBridge) {
        this.orderBook = orderBook;
        this.uiBridge = uiBridge;
    }

    @Override
    public void run(String... args) {
        try {
            HttpClient client = HttpClient.newHttpClient();
            
            // 🚀 PRODUCTION URL (Works in Singapore/Tokyo/Europe)
            // This is the real, high-performance feed used by HFTs.
            String url = "wss://stream.binance.com:9443/ws/btcusdt@depth@100ms"; 
            
            System.out.println("🔄 Connecting to PRODUCTION Binance Stream: " + url);

            client.newWebSocketBuilder()
                  .buildAsync(URI.create(url), this)
                  .join(); 
                  
            System.out.println("✅ Connected to Production Stream Successfully");
            
            latch.await();
            
        } catch (Exception e) {
            System.err.println("❌ Failed to connect: " + e.getMessage());
        }
    }

    @Override
    public CompletionStage<?> onText(WebSocket webSocket, CharSequence data, boolean last) {
        try {
            JSONObject json = new JSONObject(data.toString());
            
            if (!json.has("b") || !json.has("a")) {
                webSocket.request(1);
                return null;
            }

            long eventTime = json.getLong("E");

            // --- ⏱️ HFT BENCHMARK ---
            long startTime = System.nanoTime();

            processUpdates(json.getJSONArray("b"), true);
            processUpdates(json.getJSONArray("a"), false);

            long duration = System.nanoTime() - startTime;
            
            // Only log meaningful spikes (>100µs) to keep logs clean in production
            if (duration > 100_000) { 
                 System.out.println("⚠️ High Latency Tick: " + (duration / 1000) + " µs");
            }
            // --- BENCHMARK END ---

            uiBridge.broadcast(eventTime);

        } catch (Exception e) {
            System.err.println("Error parsing data: " + e.getMessage());
        }
        
        webSocket.request(1);
        return null;
    }

    private void processUpdates(JSONArray updates, boolean isBid) {
        for (int i = 0; i < updates.length(); i++) {
            JSONArray entry = updates.getJSONArray(i);
            orderBook.update(entry.getDouble(0), entry.getDouble(1), isBid);
        }
    }
}
