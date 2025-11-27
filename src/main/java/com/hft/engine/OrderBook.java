package com.hft.engine;

import org.json.JSONObject;
import org.springframework.stereotype.Component;
import java.util.*;
import java.util.concurrent.locks.ReentrantReadWriteLock;

@Component
public class OrderBook {
    // NavigableMap allows generic type matching; TreeMap keeps keys sorted
    // Bids: Descending (Highest price first)
    private final NavigableMap<Double, Double> bids = new TreeMap<>(Collections.reverseOrder());
    // Asks: Ascending (Lowest price first)
    private final NavigableMap<Double, Double> asks = new TreeMap<>();
    
    private final ReentrantReadWriteLock lock = new ReentrantReadWriteLock();

    public void update(double price, double qty, boolean isBid) {
        lock.writeLock().lock();
        try {
            NavigableMap<Double, Double> book = isBid ? bids : asks;
            if (qty == 0) {
                book.remove(price);
            } else {
                book.put(price, qty);
            }
        } finally {
            lock.writeLock().unlock();
        }
    }

 // Inside getSnapshot()
public JSONObject getSnapshot(long eventTime) {
    lock.readLock().lock();
    try {
        JSONObject json = new JSONObject();
        json.put("eventTime", eventTime); 
        
        // NEW: Send the time right now (Server Output Time)
        json.put("serverTime", System.currentTimeMillis()); 
        
        json.put("bids", getTopLevels(bids));
        json.put("asks", getTopLevels(asks));
        return json;
    } finally {
        lock.readLock().unlock();
    }
}

    private List<List<Double>> getTopLevels(NavigableMap<Double, Double> map) {
        List<List<Double>> levels = new ArrayList<>();
        int count = 0;
        for (Map.Entry<Double, Double> entry : map.entrySet()) {
            if (count++ >= 10) break; // Only send top 10 levels
            levels.add(List.of(entry.getKey(), entry.getValue()));
        }
        return levels;
    }
}