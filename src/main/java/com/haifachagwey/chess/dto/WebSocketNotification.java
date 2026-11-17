package com.haifachagwey.chess.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WebSocketNotification<T> {
    public enum Type {
        USER_CONNECTED,
        USER_DISCONNECTED,
        USERS_LIST_UPDATED,
        INVITATION_RECEIVED,
        INVITATION_ACCEPTED,
        INVITATION_DECLINED,
        INVITATION_CANCELED
    }

    private Type type;
    private String message;
    private T payload;
}
