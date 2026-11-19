package com.haifachagwey.chess.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MoveRequest {

    @NotNull
    private Long gameId;

    @NotBlank
    private String senderUsername;

    @NotBlank
    private String from;

    @NotBlank
    private String to;

    private String piece;

    @NotBlank
    private String color; // "white" or "black"

    private String captured;

    private String notation;
}
