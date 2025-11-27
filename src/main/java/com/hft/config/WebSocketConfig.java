package com.hft.config;

import com.hft.socket.UIBridge;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.*;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {
    private final UIBridge uiBridge;

    public WebSocketConfig(UIBridge uiBridge) {
        this.uiBridge = uiBridge;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(uiBridge, "/stream")
                .setAllowedOrigins("*"); // <--- THIS IS MANDATORY
    }
}