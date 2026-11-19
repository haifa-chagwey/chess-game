package com.haifachagwey.chess.repository;

import com.haifachagwey.chess.model.Game;
import com.haifachagwey.chess.model.GameStatus;
import com.haifachagwey.chess.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GameRepository extends JpaRepository<Game, Long> {

    List<Game> findByWhitePlayerOrBlackPlayerOrderByCreatedAtDesc(User whitePlayer, User blackPlayer);

    @Query("SELECT g FROM Game g WHERE ((g.whitePlayer = :p1 AND g.blackPlayer = :p2) OR (g.whitePlayer = :p2 AND g.blackPlayer = :p1)) AND g.status = :status ORDER BY g.createdAt DESC")
    List<Game> findActiveGamesBetweenUsers(@Param("p1") User p1, @Param("p2") User p2, @Param("status") GameStatus status);
}
