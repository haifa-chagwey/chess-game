package com.haifachagwey.chess.dto;

import com.haifachagwey.chess.model.Game;
import com.haifachagwey.chess.model.GameStatus;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GameDto {

    private Long id;
    private Long whitePlayerId;
    private String whitePlayerUsername;
    private Long blackPlayerId;
    private String blackPlayerUsername;
    private GameStatus status;
    private String currentTurn;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<GameMoveDto> moves;

    public static GameDto fromEntity(Game game) {
        if (game == null) return null;
        return GameDto.builder()
                .id(game.getId())
                .whitePlayerId(game.getWhitePlayer() != null ? game.getWhitePlayer().getId() : null)
                .whitePlayerUsername(game.getWhitePlayer() != null ? game.getWhitePlayer().getUsername() : null)
                .blackPlayerId(game.getBlackPlayer() != null ? game.getBlackPlayer().getId() : null)
                .blackPlayerUsername(game.getBlackPlayer() != null ? game.getBlackPlayer().getUsername() : null)
                .status(game.getStatus())
                .currentTurn(game.getCurrentTurn())
                .createdAt(game.getCreatedAt())
                .updatedAt(game.getUpdatedAt())
                .build();
    }
}
