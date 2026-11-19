import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GameDto, GameMoveDto, MoveRequest } from '../models/game.model';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private readonly API_URL = 'http://localhost:8080/api/games';

  constructor(private http: HttpClient) {}

  getGame(gameId: number): Observable<GameDto> {
    return this.http.get<GameDto>(`${this.API_URL}/${gameId}`);
  }

  getGameMoves(gameId: number): Observable<GameMoveDto[]> {
    return this.http.get<GameMoveDto[]>(`${this.API_URL}/${gameId}/moves`);
  }

  findOrCreateGame(whiteUsername: string, blackUsername: string): Observable<GameDto> {
    return this.http.post<GameDto>(`${this.API_URL}/find-or-create`, null, {
      params: {
        whiteUsername,
        blackUsername
      }
    });
  }

  submitMove(gameId: number, move: MoveRequest): Observable<GameMoveDto> {
    return this.http.post<GameMoveDto>(`${this.API_URL}/${gameId}/moves`, move);
  }
}
