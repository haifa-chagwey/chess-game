package com.haifachagwey.chess.service;

import com.haifachagwey.chess.dto.InvitationResponseDto;
import com.haifachagwey.chess.dto.UserDto;
import com.haifachagwey.chess.dto.WebSocketNotification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class WebSocketNotificationService {

    private final SimpMessagingTemplate messagingTemplate;

    public void broadcastUserList(List<UserDto> users) {
        log.info("Broadcasting updated users list ({} users)", users.size());
        WebSocketNotification<List<UserDto>> notification = WebSocketNotification.<List<UserDto>>builder()
                .type(WebSocketNotification.Type.USERS_LIST_UPDATED)
                .message("Users list updated")
                .payload(users)
                .build();
        messagingTemplate.convertAndSend("/topic/users", notification);
    }

    public void sendInvitationNotification(String recipientUsername, InvitationResponseDto invitation) {
        log.info("Sending invitation notification to recipient: {}", recipientUsername);
        WebSocketNotification<InvitationResponseDto> notification = WebSocketNotification.<InvitationResponseDto>builder()
                .type(WebSocketNotification.Type.INVITATION_RECEIVED)
                .message("You received a chess game invitation from " + invitation.getSenderUsername())
                .payload(invitation)
                .build();
        messagingTemplate.convertAndSend("/topic/invitations/" + recipientUsername, notification);
    }

    public void sendInvitationResponseNotification(String senderUsername, InvitationResponseDto invitation) {
        log.info("Sending invitation response notification to sender: {}", senderUsername);
        WebSocketNotification.Type type = invitation.getStatus() == com.haifachagwey.chess.model.InvitationStatus.ACCEPTED
                ? WebSocketNotification.Type.INVITATION_ACCEPTED
                : WebSocketNotification.Type.INVITATION_DECLINED;

        String msg = invitation.getRecipientUsername() + (invitation.getStatus() == com.haifachagwey.chess.model.InvitationStatus.ACCEPTED
                ? " accepted your invitation!"
                : " declined your invitation.");

        WebSocketNotification<InvitationResponseDto> notification = WebSocketNotification.<InvitationResponseDto>builder()
                .type(type)
                .message(msg)
                .payload(invitation)
                .build();
        messagingTemplate.convertAndSend("/topic/invitations/" + senderUsername, notification);
    }
}
