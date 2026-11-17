package com.haifachagwey.chess.dto;

import com.haifachagwey.chess.model.Invitation;
import com.haifachagwey.chess.model.InvitationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvitationResponseDto {
    private Long id;
    private Long senderId;
    private String senderUsername;
    private Long recipientId;
    private String recipientUsername;
    private InvitationStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime respondedAt;

    public static InvitationResponseDto fromEntity(Invitation invitation) {
        if (invitation == null) return null;
        return InvitationResponseDto.builder()
                .id(invitation.getId())
                .senderId(invitation.getSender().getId())
                .senderUsername(invitation.getSender().getUsername())
                .recipientId(invitation.getRecipient().getId())
                .recipientUsername(invitation.getRecipient().getUsername())
                .status(invitation.getStatus())
                .createdAt(invitation.getCreatedAt())
                .respondedAt(invitation.getRespondedAt())
                .build();
    }
}
