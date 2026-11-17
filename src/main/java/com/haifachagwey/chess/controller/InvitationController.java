package com.haifachagwey.chess.controller;

import com.haifachagwey.chess.dto.InvitationActionRequest;
import com.haifachagwey.chess.dto.InvitationRequest;
import com.haifachagwey.chess.dto.InvitationResponseDto;
import com.haifachagwey.chess.service.InvitationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/invitations")
@RequiredArgsConstructor
@Slf4j
public class InvitationController {

    private final InvitationService invitationService;

    @PostMapping
    public ResponseEntity<?> sendInvitation(@RequestHeader(value = "X-Username", required = false) String headerUsername,
                                           @Valid @RequestBody InvitationRequest request) {
        try {
            String sender = request.getSenderUsername() != null && !request.getSenderUsername().isBlank()
                    ? request.getSenderUsername()
                    : headerUsername;

            if (sender == null || sender.isBlank()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Sender username must be specified"));
            }

            InvitationResponseDto dto = invitationService.sendInvitation(sender, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(dto);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error creating invitation", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to send invitation"));
        }
    }

    @PostMapping("/respond")
    public ResponseEntity<?> respondToInvitation(@RequestHeader(value = "X-Username", required = false) String headerUsername,
                                                @RequestParam(value = "username", required = false) String queryUsername,
                                                @Valid @RequestBody InvitationActionRequest request) {
        try {
            String responder = queryUsername != null && !queryUsername.isBlank() ? queryUsername : headerUsername;
            if (responder == null || responder.isBlank()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Username must be specified to respond to invitation"));
            }

            InvitationResponseDto dto = invitationService.respondToInvitation(responder, request);
            return ResponseEntity.ok(dto);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error responding to invitation", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to respond to invitation"));
        }
    }

    @GetMapping("/pending")
    public ResponseEntity<List<InvitationResponseDto>> getPendingInvitations(
            @RequestParam(required = false) String username,
            @RequestHeader(value = "X-Username", required = false) String headerUsername) {
        String user = username != null ? username : headerUsername;
        if (user == null || user.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(invitationService.getPendingInvitationsForUser(user));
    }

    @GetMapping("/received")
    public ResponseEntity<List<InvitationResponseDto>> getReceivedInvitations(
            @RequestParam(required = false) String username,
            @RequestHeader(value = "X-Username", required = false) String headerUsername) {
        String user = username != null ? username : headerUsername;
        if (user == null || user.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(invitationService.getReceivedInvitations(user));
    }

    @GetMapping("/sent")
    public ResponseEntity<List<InvitationResponseDto>> getSentInvitations(
            @RequestParam(required = false) String username,
            @RequestHeader(value = "X-Username", required = false) String headerUsername) {
        String user = username != null ? username : headerUsername;
        if (user == null || user.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(invitationService.getSentInvitations(user));
    }
}
