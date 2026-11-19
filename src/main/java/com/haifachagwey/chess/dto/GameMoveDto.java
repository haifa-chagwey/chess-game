package com.haifachagwey.chess.dto;

import com.haifachagwey.chess.model.GameMove;
import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GameMoveDto {

    private Long id;
    private Long gameId;
    private Long playerId;
    private String playerUsername;
    private Integer moveNumber;
    private String color;
    private String fromSquare;
    private String toSquare;
    private String piece;
    private String capturedPiece;
    private String notation;
    private LocalDateTime playedAt;

    public static GameMoveDto fromEntity(GameMove move) {
        if (move == null) return null;
        return GameMoveDto.builder()
                .id(move.getId())
                .gameId(move.getGame() != null ? move.getGame().getId() : null)
                .playerId(move.getPlayer() != null ? move.getPlayer().getId() : null)
                .playerUsername(move.getPlayer() != null ? move.getPlayer().getUsername() : null)
                .moveNumber(move.getMoveNumber())
                .color(move.getColor())
                .fromSquare(move.getFromSquare())
                .toSquare(move.getToSquare())
                .piece(move.getPiece())
                .capturedPiece(move.getCapturedPiece())
                .notation(move.getNotation())
                .playedAt(move.getPlayedAt())
                .build();
    }
}
