package com.haifachagwey.chess.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "game_moves")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GameMove {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "game_id", nullable = false)
    private Game game;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "player_id", nullable = false)
    private User player;

    @Column(nullable = false)
    private Integer moveNumber;

    @Column(nullable = false)
    private String color; // "white" or "black"

    @Column(nullable = false)
    private String fromSquare; // e.g. "e2"

    @Column(nullable = false)
    private String toSquare; // e.g. "e4"

    @Column
    private String piece; // e.g. "pawn"

    @Column
    private String capturedPiece;

    @Column
    private String notation; // e.g. "e2-e4"

    @Column(nullable = false)
    private LocalDateTime playedAt;

    @PrePersist
    protected void onCreate() {
        if (this.playedAt == null) {
            this.playedAt = LocalDateTime.now();
        }
    }
}
