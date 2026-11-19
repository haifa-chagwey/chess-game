package com.haifachagwey.chess;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.haifachagwey.chess.dto.AuthResponse;
import com.haifachagwey.chess.dto.GameDto;
import com.haifachagwey.chess.dto.GameMoveDto;
import com.haifachagwey.chess.dto.InvitationActionRequest;
import com.haifachagwey.chess.dto.InvitationRequest;
import com.haifachagwey.chess.dto.InvitationResponseDto;
import com.haifachagwey.chess.dto.LoginRequest;
import com.haifachagwey.chess.dto.MoveRequest;
import com.haifachagwey.chess.dto.RegisterRequest;
import com.haifachagwey.chess.model.Game;
import com.haifachagwey.chess.model.InvitationStatus;
import com.haifachagwey.chess.model.User;
import com.haifachagwey.chess.repository.GameMoveRepository;
import com.haifachagwey.chess.repository.UserRepository;
import com.haifachagwey.chess.service.GameService;
import com.haifachagwey.chess.service.InvitationService;
import com.haifachagwey.chess.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ChessBackendTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserService userService;

    @Autowired
    private InvitationService invitationService;

    @Autowired
    private GameService gameService;

    @Autowired
    private GameMoveRepository gameMoveRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    void testRegisterAndLogin() throws Exception {
        RegisterRequest register = RegisterRequest.builder()
                .username("player1")
                .password("password123")
                .email("player1@chess.com")
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(register)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.username").value("player1"))
                .andExpect(jsonPath("$.token").isNotEmpty());

        LoginRequest login = LoginRequest.builder()
                .username("player1")
                .password("password123")
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("player1"))
                .andExpect(jsonPath("$.token").isNotEmpty());
    }

    @Test
    void testInvitationWorkflow() throws Exception {
        // Create 2 users
        userService.register(RegisterRequest.builder().username("alice").password("pass123").build());
        userService.register(RegisterRequest.builder().username("bob").password("pass123").build());

        // Alice invites Bob
        InvitationRequest inviteBob = InvitationRequest.builder()
                .senderUsername("alice")
                .recipientUsername("bob")
                .build();

        mockMvc.perform(post("/api/invitations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(inviteBob)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.senderUsername").value("alice"))
                .andExpect(jsonPath("$.recipientUsername").value("bob"))
                .andExpect(jsonPath("$.status").value("PENDING"));

        // Bob checks pending invitations
        mockMvc.perform(get("/api/invitations/pending").param("username", "bob"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].senderUsername").value("alice"));

        // Bob accepts the invitation
        var pending = invitationService.getPendingInvitationsForUser("bob");
        assertThat(pending).isNotEmpty();
        Long invId = pending.get(0).getId();

        InvitationActionRequest acceptReq = InvitationActionRequest.builder()
                .invitationId(invId)
                .accept(true)
                .build();

        mockMvc.perform(post("/api/invitations/respond")
                        .param("username", "bob")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(acceptReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACCEPTED"));
    }

    @Test
    void testCannotInviteSelf() {
        userService.register(RegisterRequest.builder().username("charlie").password("pass123").build());

        InvitationRequest selfInvite = InvitationRequest.builder()
                .senderUsername("charlie")
                .recipientUsername("charlie")
                .build();

        assertThrows(IllegalArgumentException.class, () -> {
            invitationService.sendInvitation("charlie", selfInvite);
        });
    }

    @Test
    void testGameAndMovePersistence() throws Exception {
        User playerW = userRepository.findByUsername("alice").orElseGet(() ->
                userRepository.save(User.builder().username("alice").password("pass123").build()));
        User playerB = userRepository.findByUsername("bob").orElseGet(() ->
                userRepository.save(User.builder().username("bob").password("pass123").build()));

        Game game = gameService.createGame(playerW, playerB);
        assertThat(game.getId()).isNotNull();
        assertThat(game.getCurrentTurn()).isEqualTo("white");

        // Move 1: e2 -> e4 by alice (white)
        MoveRequest move1 = MoveRequest.builder()
                .gameId(game.getId())
                .senderUsername("alice")
                .color("white")
                .piece("pawn")
                .from("e2")
                .to("e4")
                .notation("e2-e4")
                .build();

        GameMoveDto recorded1 = gameService.recordAndBroadcastMove(move1);
        assertThat(recorded1.getMoveNumber()).isEqualTo(1);
        assertThat(recorded1.getFromSquare()).isEqualTo("e2");
        assertThat(recorded1.getToSquare()).isEqualTo("e4");

        // Verify turn switched to black
        assertThat(gameService.getGame(game.getId()).getCurrentTurn()).isEqualTo("black");

        // Move 2: e7 -> e5 by bob (black)
        MoveRequest move2 = MoveRequest.builder()
                .gameId(game.getId())
                .senderUsername("bob")
                .color("black")
                .piece("pawn")
                .from("e7")
                .to("e5")
                .notation("e7-e5")
                .build();

        GameMoveDto recorded2 = gameService.recordAndBroadcastMove(move2);
        assertThat(recorded2.getMoveNumber()).isEqualTo(2);

        // Fetch move history via REST
        mockMvc.perform(get("/api/games/" + game.getId() + "/moves"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].fromSquare").value("e2"))
                .andExpect(jsonPath("$[0].toSquare").value("e4"))
                .andExpect(jsonPath("$[1].fromSquare").value("e7"))
                .andExpect(jsonPath("$[1].toSquare").value("e5"));

        // Fetch game details via REST
        mockMvc.perform(get("/api/games/" + game.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(game.getId()))
                .andExpect(jsonPath("$.whitePlayerUsername").value("alice"))
                .andExpect(jsonPath("$.blackPlayerUsername").value("bob"))
                .andExpect(jsonPath("$.currentTurn").value("white"))
                .andExpect(jsonPath("$.moves.length()").value(2));
    }
}
