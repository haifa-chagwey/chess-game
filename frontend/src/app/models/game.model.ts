export interface GameMoveDto {
  id?: number;
  gameId: number;
  playerId?: number;
  playerUsername: string;
  moveNumber: number;
  color: 'white' | 'black';
  fromSquare: string;
  toSquare: string;
  piece?: string;
  capturedPiece?: string;
  notation?: string;
  playedAt?: string;
}

export interface GameDto {
  id: number;
  whitePlayerId: number;
  whitePlayerUsername: string;
  blackPlayerId: number;
  blackPlayerUsername: string;
  status: 'IN_PROGRESS' | 'WHITE_WON' | 'BLACK_WON' | 'DRAW' | 'RESIGNED' | 'FINISHED';
  currentTurn: 'white' | 'black';
  createdAt: string;
  updatedAt?: string;
  moves?: GameMoveDto[];
}

export interface MoveRequest {
  gameId: number;
  senderUsername: string;
  from: string;
  to: string;
  piece?: string;
  color: 'white' | 'black';
  captured?: string;
  notation?: string;
}
