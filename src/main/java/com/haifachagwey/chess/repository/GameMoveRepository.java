package com.haifachagwey.chess.repository;

import com.haifachagwey.chess.model.Game;
import com.haifachagwey.chess.model.GameMove;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GameMoveRepository extends JpaRepository<GameMove, Long> {

    List<GameMove> findByGameOrderByMoveNumberAsc(Game game);

    List<GameMove> findByGameIdOrderByMoveNumberAsc(Long gameId);

    long countByGame(Game game);
}
