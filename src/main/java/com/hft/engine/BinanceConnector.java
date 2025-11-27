package com.hft.engine;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.WebSocket;
import java.util.concurrent.CompletionStage;
import java.util.concurrent.CountDownLatch;

import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import com.hft.socket.UIBridge;

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
        HttpClient client = HttpClient.newHttpClient();
        String url = "wss://stream.binance.com:443/ws/btcusdt@depth@100ms"; 
        
        client.newWebSocketBuilder()
              .buildAsync(URI.create(url), this)
              .join(); 
              
        System.out.println("✅ Connected to Binance Stream: " + url);
        try {
            latch.await();
        } catch (InterruptedException e) {
            e.printStackTrace();
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

            // --- ⏱️ PERFORMANCE BENCHMARK START ---
            long startTime = System.nanoTime();

            processUpdates(json.getJSONArray("b"), true);
            processUpdates(json.getJSONArray("a"), false);

            long duration = System.nanoTime() - startTime;
            // Only log if it takes > 0 microseconds to avoid spamming too much
            System.out.println("☕ Java Engine Processing Time: " + duration + " ns (" + (duration / 1000) + " µs)");
            // --- ⏱️ PERFORMANCE BENCHMARK END ---

            uiBridge.broadcast(eventTime);

        } catch (Exception e) {
            System.err.println("Error parsing Binance data: " + e.getMessage());
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