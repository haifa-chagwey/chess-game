package com.haifachagwey.chess.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvitationRequest {

    private String senderUsername;

    @NotBlank(message = "Recipient username is required")
    private String recipientUsername;
}
