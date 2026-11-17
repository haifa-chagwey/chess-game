package com.haifachagwey.chess.service;

import com.haifachagwey.chess.dto.AuthResponse;
import com.haifachagwey.chess.dto.LoginRequest;
import com.haifachagwey.chess.dto.RegisterRequest;
import com.haifachagwey.chess.dto.UserDto;
import com.haifachagwey.chess.model.User;
import com.haifachagwey.chess.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final WebSocketNotificationService notificationService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String trimmedUsername = request.getUsername().trim();

        if (userRepository.existsByUsernameIgnoreCase(trimmedUsername)) {
            throw new IllegalArgumentException("Username '" + trimmedUsername + "' is already taken");
        }

        User user = User.builder()
                .username(trimmedUsername)
                .password(passwordEncoder.encode(request.getPassword()))
                .email(request.getEmail() != null ? request.getEmail().trim() : null)
                .online(true)
                .createdAt(LocalDateTime.now())
                .lastActiveAt(LocalDateTime.now())
                .build();

        User savedUser = userRepository.save(user);
        log.info("Registered new user: {}", savedUser.getUsername());

        // Broadcast updated user list
        broadcastUsers();

        String token = generateToken(savedUser);

        return AuthResponse.builder()
                .token(token)
                .id(savedUser.getId())
                .username(savedUser.getUsername())
                .email(savedUser.getEmail())
                .online(savedUser.isOnline())
                .message("Registration successful")
                .build();
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        String trimmedUsername = request.getUsername().trim();

        User user = userRepository.findByUsernameIgnoreCase(trimmedUsername)
                .orElseThrow(() -> new IllegalArgumentException("Invalid username or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid username or password");
        }

        user.setOnline(true);
        user.setLastActiveAt(LocalDateTime.now());
        User savedUser = userRepository.save(user);
        log.info("User logged in: {}", savedUser.getUsername());

        // Broadcast updated user list
        broadcastUsers();

        String token = generateToken(savedUser);

        return AuthResponse.builder()
                .token(token)
                .id(savedUser.getId())
                .username(savedUser.getUsername())
                .email(savedUser.getEmail())
                .online(savedUser.isOnline())
                .message("Login successful")
                .build();
    }

    @Transactional
    public void logout(String username) {
        if (username == null || username.isBlank()) return;

        userRepository.findByUsernameIgnoreCase(username.trim()).ifPresent(user -> {
            user.setOnline(false);
            user.setLastActiveAt(LocalDateTime.now());
            userRepository.save(user);
            log.info("User logged out: {}", user.getUsername());
            broadcastUsers();
        });
    }

    @Transactional
    public void setUserOnlineStatus(String username, boolean online) {
        if (username == null || username.isBlank()) return;

        userRepository.findByUsernameIgnoreCase(username.trim()).ifPresent(user -> {
            if (user.isOnline() != online) {
                user.setOnline(online);
                user.setLastActiveAt(LocalDateTime.now());
                userRepository.save(user);
                log.info("User {} online status changed to: {}", user.getUsername(), online);
                broadcastUsers();
            }
        });
    }

    @Transactional(readOnly = true)
    public List<UserDto> getAllUsers() {
        return userRepository.findAllByOrderByOnlineDescUsernameAsc().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<UserDto> getOnlineUsers() {
        return userRepository.findByOnlineTrue().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsernameIgnoreCase(username);
    }

    public void broadcastUsers() {
        List<UserDto> allUsers = getAllUsers();
        notificationService.broadcastUserList(allUsers);
    }

    public UserDto toDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .online(user.isOnline())
                .lastActiveAt(user.getLastActiveAt())
                .build();
    }

    private String generateToken(User user) {
        // Simple secure token with username for Level 1 session identification
        return UUID.randomUUID().toString() + ":" + user.getUsername();
    }
}
