package com.haifachagwey.chess.service;

import com.haifachagwey.chess.dto.InvitationActionRequest;
import com.haifachagwey.chess.dto.InvitationRequest;
import com.haifachagwey.chess.dto.InvitationResponseDto;
import com.haifachagwey.chess.model.Invitation;
import com.haifachagwey.chess.model.InvitationStatus;
import com.haifachagwey.chess.model.User;
import com.haifachagwey.chess.repository.InvitationRepository;
import com.haifachagwey.chess.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class InvitationService {

    private final InvitationRepository invitationRepository;
    private final UserRepository userRepository;
    private final WebSocketNotificationService notificationService;
    private final GameService gameService;

    @Transactional
    public InvitationResponseDto sendInvitation(String senderUsername, InvitationRequest request) {
        String recipientUsername = request.getRecipientUsername().trim();

        if (senderUsername.equalsIgnoreCase(recipientUsername)) {
            throw new IllegalArgumentException("You cannot invite yourself");
        }

        User sender = userRepository.findByUsernameIgnoreCase(senderUsername)
                .orElseThrow(() -> new IllegalArgumentException("Sender user not found: " + senderUsername));

        User recipient = userRepository.findByUsernameIgnoreCase(recipientUsername)
                .orElseThrow(() -> new IllegalArgumentException("Recipient user not found: " + recipientUsername));

        // Check if there is already a pending invitation between these two users
        Optional<Invitation> existingPending = invitationRepository.findPendingBetweenUsers(sender, recipient);
        if (existingPending.isPresent()) {
            Invitation pending = existingPending.get();
            if (pending.getSender().getId().equals(sender.getId())) {
                throw new IllegalStateException("An invitation is already pending for this player");
            } else {
                throw new IllegalStateException("This player has already sent you an invitation! Check your pending invitations");
            }
        }

        Invitation invitation = Invitation.builder()
                .sender(sender)
                .recipient(recipient)
                .status(InvitationStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();

        Invitation saved = invitationRepository.save(invitation);
        log.info("Invitation #{} created from {} to {}", saved.getId(), sender.getUsername(), recipient.getUsername());

        InvitationResponseDto dto = InvitationResponseDto.fromEntity(saved);

        // Send real-time notification to recipient via WebSocket
        notificationService.sendInvitationNotification(recipient.getUsername(), dto);

        return dto;
    }

    @Transactional
    public InvitationResponseDto respondToInvitation(String responderUsername, InvitationActionRequest request) {
        Invitation invitation = invitationRepository.findById(request.getInvitationId())
                .orElseThrow(() -> new IllegalArgumentException("Invitation not found: " + request.getInvitationId()));

        if (!invitation.getRecipient().getUsername().equalsIgnoreCase(responderUsername)) {
            throw new IllegalArgumentException("You are not authorized to respond to this invitation");
        }

        if (invitation.getStatus() != InvitationStatus.PENDING) {
            throw new IllegalStateException("This invitation has already been " + invitation.getStatus().name().toLowerCase());
        }

        InvitationStatus newStatus = request.isAccept() ? InvitationStatus.ACCEPTED : InvitationStatus.DECLINED;
        invitation.setStatus(newStatus);
        invitation.setRespondedAt(LocalDateTime.now());

        if (request.isAccept()) {
            com.haifachagwey.chess.model.Game game = gameService.createGame(invitation.getSender(), invitation.getRecipient());
            invitation.setGameId(game.getId());
        }

        Invitation saved = invitationRepository.save(invitation);
        log.info("Invitation #{} responded by {}: {}", saved.getId(), responderUsername, newStatus);

        InvitationResponseDto dto = InvitationResponseDto.fromEntity(saved);

        // Send real-time response notification to sender via WebSocket
        notificationService.sendInvitationResponseNotification(saved.getSender().getUsername(), dto);

        return dto;
    }

    @Transactional(readOnly = true)
    public List<InvitationResponseDto> getPendingInvitationsForUser(String username) {
        return invitationRepository.findByRecipientUsernameAndStatus(username, InvitationStatus.PENDING).stream()
                .map(InvitationResponseDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<InvitationResponseDto> getReceivedInvitations(String username) {
        User user = userRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));
        return invitationRepository.findByRecipientOrderByCreatedAtDesc(user).stream()
                .map(InvitationResponseDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<InvitationResponseDto> getSentInvitations(String username) {
        User user = userRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));
        return invitationRepository.findBySenderOrderByCreatedAtDesc(user).stream()
                .map(InvitationResponseDto::fromEntity)
                .collect(Collectors.toList());
    }
}
