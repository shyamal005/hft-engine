package com.hft.socket;

import com.hft.engine.OrderBook;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import java.io.IOException;
import java.util.concurrent.CopyOnWriteArrayList;

@Component
public class UIBridge extends TextWebSocketHandler {
    // Thread-safe list of connected UI clients
    private final CopyOnWriteArrayList<WebSocketSession> sessions = new CopyOnWriteArrayList<>();
    private final OrderBook orderBook;

    public UIBridge(OrderBook orderBook) {
        this.orderBook = orderBook;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        sessions.add(session);
    }

    public void broadcast(long eventTime) {
        String payload = orderBook.getSnapshot(eventTime).toString();
        for (WebSocketSession session : sessions) {
            if (session.isOpen()) {
                try {
                    session.sendMessage(new TextMessage(payload));
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }
    }
}