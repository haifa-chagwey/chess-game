package com.haifachagwey.chess.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvitationActionRequest {

    @NotNull(message = "Invitation ID is required")
    private Long invitationId;

    private boolean accept;
}
