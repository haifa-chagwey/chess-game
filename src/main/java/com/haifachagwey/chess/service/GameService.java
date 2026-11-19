package com.haifachagwey.chess.service;

import com.haifachagwey.chess.dto.GameDto;
import com.haifachagwey.chess.dto.GameMoveDto;
import com.haifachagwey.chess.dto.MoveRequest;
import com.haifachagwey.chess.model.Game;
import com.haifachagwey.chess.model.GameMove;
import com.haifachagwey.chess.model.GameStatus;
import com.haifachagwey.chess.model.User;
import com.haifachagwey.chess.repository.GameMoveRepository;
import com.haifachagwey.chess.repository.GameRepository;
import com.haifachagwey.chess.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class GameService {

    private final GameRepository gameRepository;
    private final GameMoveRepository gameMoveRepository;
    private final UserRepository userRepository;
    private final WebSocketNotificationService notificationService;

    @Transactional
    public Game createGame(User whitePlayer, User blackPlayer) {
        log.info("Creating new chess game: white={} vs black={}", whitePlayer.getUsername(), blackPlayer.getUsername());
        Game game = Game.builder()
                .whitePlayer(whitePlayer)
                .blackPlayer(blackPlayer)
                .status(GameStatus.IN_PROGRESS)
                .currentTurn("white")
                .build();

        Game savedGame = gameRepository.save(game);
        log.info("Game created with ID: {}", savedGame.getId());
        return savedGame;
    }

    @Transactional
    public GameDto findOrCreateGame(String whiteUsername, String blackUsername) {
        User white = userRepository.findByUsername(whiteUsername)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + whiteUsername));
        User black = userRepository.findByUsername(blackUsername)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + blackUsername));

        List<Game> activeGames = gameRepository.findActiveGamesBetweenUsers(white, black, GameStatus.IN_PROGRESS);
        Game game;
        if (!activeGames.isEmpty()) {
            game = activeGames.get(0);
            log.info("Found existing active game ID: {}", game.getId());
        } else {
            game = createGame(white, black);
        }

        return getGameDtoWithMoves(game);
    }

    @Transactional(readOnly = true)
    public GameDto getGame(Long gameId) {
        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new IllegalArgumentException("Game not found with ID: " + gameId));
        return getGameDtoWithMoves(game);
    }

    @Transactional(readOnly = true)
    public List<GameMoveDto> getGameMoves(Long gameId) {
        return gameMoveRepository.findByGameIdOrderByMoveNumberAsc(gameId).stream()
                .map(GameMoveDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public GameMoveDto recordAndBroadcastMove(MoveRequest request) {
        log.info("Recording move for game {}: {} from {} to {}", 
                request.getGameId(), request.getPiece(), request.getFrom(), request.getTo());

        Game game = gameRepository.findById(request.getGameId())
                .orElseThrow(() -> new IllegalArgumentException("Game not found with ID: " + request.getGameId()));

        User player = userRepository.findByUsername(request.getSenderUsername())
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + request.getSenderUsername()));

        long currentMoveCount = gameMoveRepository.countByGame(game);
        int nextMoveNumber = (int) currentMoveCount + 1;

        String notation = request.getNotation();
        if (notation == null || notation.isBlank()) {
            notation = request.getFrom() + "-" + request.getTo();
        }

        GameMove move = GameMove.builder()
                .game(game)
                .player(player)
                .moveNumber(nextMoveNumber)
                .color(request.getColor() != null ? request.getColor().toLowerCase() : "white")
                .fromSquare(request.getFrom().toLowerCase())
                .toSquare(request.getTo().toLowerCase())
                .piece(request.getPiece())
                .capturedPiece(request.getCaptured())
                .notation(notation)
                .build();

        GameMove savedMove = gameMoveRepository.save(move);

        // Update current turn on game
        String nextTurn = "white".equalsIgnoreCase(request.getColor()) ? "black" : "white";
        game.setCurrentTurn(nextTurn);
        gameRepository.save(game);

        GameMoveDto moveDto = GameMoveDto.fromEntity(savedMove);

        // Broadcast move in real-time via WebSocket
        notificationService.broadcastGameMove(game.getId(), moveDto);

        return moveDto;
    }

    private GameDto getGameDtoWithMoves(Game game) {
        GameDto dto = GameDto.fromEntity(game);
        List<GameMoveDto> moves = gameMoveRepository.findByGameOrderByMoveNumberAsc(game).stream()
                .map(GameMoveDto::fromEntity)
                .collect(Collectors.toList());
        dto.setMoves(moves);
        return dto;
    }
}
