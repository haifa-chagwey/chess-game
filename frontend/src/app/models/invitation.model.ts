export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELED';

export interface Invitation {
  id: number;
  senderId: number;
  senderUsername: string;
  recipientId: number;
  recipientUsername: string;
  status: InvitationStatus;
  createdAt: string;
  respondedAt?: string;
}

export interface InvitationRequest {
  senderUsername?: string;
  recipientUsername: string;
}

export interface InvitationActionRequest {
  invitationId: number;
  accept: boolean;
}
