package com.haifachagwey.chess.config;

import com.haifachagwey.chess.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketEventListener {

    private final UserService userService;
    // Map sessionId -> username
    private final Map<String, String> sessionUserMap = new ConcurrentHashMap<>();

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();
        log.info("New WebSocket connection established with session ID: {}", sessionId);
    }

    public void registerUserSession(String sessionId, String username) {
        if (sessionId != null && username != null && !username.isBlank()) {
            sessionUserMap.put(sessionId, username);
            userService.setUserOnlineStatus(username, true);
            log.info("Registered user {} with WebSocket session {}", username, sessionId);
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();

        String username = sessionUserMap.remove(sessionId);
        if (username != null) {
            log.info("WebSocket disconnected for user: {} (sessionId: {})", username, sessionId);
            // Check if user has no other active sessions before marking offline
            if (!sessionUserMap.containsValue(username)) {
                userService.setUserOnlineStatus(username, false);
            }
        } else {
            log.info("WebSocket session disconnected: {}", sessionId);
        }
    }
}
