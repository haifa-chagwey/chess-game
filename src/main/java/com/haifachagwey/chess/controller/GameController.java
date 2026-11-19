package com.haifachagwey.chess.controller;

import com.haifachagwey.chess.dto.GameDto;
import com.haifachagwey.chess.dto.GameMoveDto;
import com.haifachagwey.chess.dto.MoveRequest;
import com.haifachagwey.chess.service.GameService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.AbstractMap;
import java.util.List;

@RestController
@RequestMapping("/api/games")
@RequiredArgsConstructor
@Slf4j
public class GameController {

    private final GameService gameService;

    @GetMapping("/{gameId}")
    public ResponseEntity<GameDto> getGame(@PathVariable Long gameId) {
        log.info("REST: Fetching game ID {}", gameId);
        GameDto game = gameService.getGame(gameId);
        return ResponseEntity.ok(game);
    }

    @GetMapping("/{gameId}/moves")
    public ResponseEntity<List<GameMoveDto>> getGameMoves(@PathVariable Long gameId) {
        log.info("REST: Fetching moves for game ID {}", gameId);
        List<GameMoveDto> moves = gameService.getGameMoves(gameId);
        return ResponseEntity.ok(moves);
    }

    @PostMapping("/find-or-create")
    public ResponseEntity<GameDto> findOrCreateGame(
            @RequestParam String whiteUsername,
            @RequestParam String blackUsername) {
        log.info("REST: find-or-create game between white={} and black={}", whiteUsername, blackUsername);
        GameDto game = gameService.findOrCreateGame(whiteUsername, blackUsername);
        return ResponseEntity.ok(game);
    }

    @PostMapping("/{gameId}/moves")
    public ResponseEntity<GameMoveDto> submitMove(
            @PathVariable Long gameId,
            @Valid @RequestBody MoveRequest request) {
        request.setGameId(gameId);
        log.info("REST: Submit move for game ID {}", gameId);
        GameMoveDto moveDto = gameService.recordAndBroadcastMove(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(moveDto);
    }
}
