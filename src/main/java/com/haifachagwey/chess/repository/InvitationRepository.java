package com.haifachagwey.chess.repository;

import com.haifachagwey.chess.model.Invitation;
import com.haifachagwey.chess.model.InvitationStatus;
import com.haifachagwey.chess.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InvitationRepository extends JpaRepository<Invitation, Long> {

    List<Invitation> findByRecipientAndStatus(User recipient, InvitationStatus status);

    List<Invitation> findBySenderAndStatus(User sender, InvitationStatus status);

    List<Invitation> findByRecipientOrderByCreatedAtDesc(User recipient);

    List<Invitation> findBySenderOrderByCreatedAtDesc(User sender);

    @Query("SELECT i FROM Invitation i WHERE ((i.sender = :user1 AND i.recipient = :user2) OR (i.sender = :user2 AND i.recipient = :user1)) AND i.status = 'PENDING'")
    Optional<Invitation> findPendingBetweenUsers(@Param("user1") User user1, @Param("user2") User user2);

    @Query("SELECT i FROM Invitation i WHERE i.recipient.username = :username AND i.status = :status")
    List<Invitation> findByRecipientUsernameAndStatus(@Param("username") String username, @Param("status") InvitationStatus status);
}
