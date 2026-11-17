package com.haifachagwey.chess;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.haifachagwey.chess.dto.AuthResponse;
import com.haifachagwey.chess.dto.InvitationActionRequest;
import com.haifachagwey.chess.dto.InvitationRequest;
import com.haifachagwey.chess.dto.InvitationResponseDto;
import com.haifachagwey.chess.dto.LoginRequest;
import com.haifachagwey.chess.dto.RegisterRequest;
import com.haifachagwey.chess.model.InvitationStatus;
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
}
