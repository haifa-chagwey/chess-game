package com.haifachagwey.chess.controller;

import com.haifachagwey.chess.config.WebSocketEventListener;
import com.haifachagwey.chess.dto.InvitationActionRequest;
import com.haifachagwey.chess.dto.InvitationRequest;
import com.haifachagwey.chess.dto.InvitationResponseDto;
import com.haifachagwey.chess.dto.MoveRequest;
import com.haifachagwey.chess.dto.UserDto;
import com.haifachagwey.chess.service.GameService;
import com.haifachagwey.chess.service.InvitationService;
import com.haifachagwey.chess.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.stereotype.Controller;

import java.util.List;
import java.util.Map;

@Controller
@RequiredArgsConstructor
@Slf4j
public class WebSocketController {

    private final UserService userService;
    private final InvitationService invitationService;
    private final GameService gameService;
    private final WebSocketEventListener eventListener;

    @MessageMapping("/users/connect")
    public void handleUserConnect(@Payload Map<String, String> payload,
                                  @Header(value = "simpSessionId", required = false) String sessionId) {
        String username = payload.get("username");
        if (username != null && !username.isBlank()) {
            log.info("STOMP connect message received for user: {}, sessionId: {}", username, sessionId);
            eventListener.registerUserSession(sessionId, username);
        }
    }

    @MessageMapping("/users/disconnect")
    public void handleUserDisconnect(@Payload Map<String, String> payload) {
        String username = payload.get("username");
        if (username != null && !username.isBlank()) {
            log.info("STOMP disconnect message received for user: {}", username);
            userService.setUserOnlineStatus(username, false);
        }
    }

    @MessageMapping("/users/list")
    public void handleRequestUsersList() {
        userService.broadcastUsers();
    }

    @MessageMapping("/invite")
    public void handleInvite(@Payload InvitationRequest request) {
        log.info("STOMP invite message from {} to {}", request.getSenderUsername(), request.getRecipientUsername());
        try {
            invitationService.sendInvitation(request.getSenderUsername(), request);
        } catch (Exception e) {
            log.error("Failed to process STOMP invitation: {}", e.getMessage());
        }
    }

    @MessageMapping("/invite/respond")
    public void handleInviteRespond(@Payload Map<String, Object> payload) {
        try {
            String responderUsername = (String) payload.get("responderUsername");
            Number invitationIdNum = (Number) payload.get("invitationId");
            Boolean accept = (Boolean) payload.get("accept");

            if (responderUsername != null && invitationIdNum != null && accept != null) {
                InvitationActionRequest actionRequest = InvitationActionRequest.builder()
                        .invitationId(invitationIdNum.longValue())
                        .accept(accept)
                        .build();
                invitationService.respondToInvitation(responderUsername, actionRequest);
            }
        } catch (Exception e) {
            log.error("Failed to process STOMP invitation response: {}", e.getMessage());
        }
    }

    @MessageMapping("/game/move")
    public void handleGameMove(@Payload MoveRequest request) {
        log.info("STOMP game move received for game {}: {} from {} to {} by {}",
                request.getGameId(), request.getPiece(), request.getFrom(), request.getTo(), request.getSenderUsername());
        try {
            gameService.recordAndBroadcastMove(request);
        } catch (Exception e) {
            log.error("Failed to process STOMP game move: {}", e.getMessage(), e);
        }
    }

    @MessageMapping("/game/{gameId}/move")
    public void handleGameMoveWithId(@DestinationVariable Long gameId, @Payload MoveRequest request) {
        request.setGameId(gameId);
        log.info("STOMP game/{}/move received: {} from {} to {} by {}",
                gameId, request.getPiece(), request.getFrom(), request.getTo(), request.getSenderUsername());
        try {
            gameService.recordAndBroadcastMove(request);
        } catch (Exception e) {
            log.error("Failed to process STOMP game move with ID: {}", e.getMessage(), e);
        }
    }
}
