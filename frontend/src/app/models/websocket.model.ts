export type WebSocketNotificationType =
  | 'USER_CONNECTED'
  | 'USER_DISCONNECTED'
  | 'USERS_LIST_UPDATED'
  | 'INVITATION_RECEIVED'
  | 'INVITATION_ACCEPTED'
  | 'INVITATION_DECLINED'
  | 'INVITATION_CANCELED'
  | 'GAME_STARTED'
  | 'GAME_MOVE'
  | 'GAME_ENDED';

export interface WebSocketNotification<T = any> {
  type: WebSocketNotificationType;
  message?: string;
  payload: T;
}
