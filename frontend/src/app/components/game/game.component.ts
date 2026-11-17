import { Component, OnInit, OnDestroy, signal, computed, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { WebSocketService } from '../../services/websocket.service';
import { ChessBoardComponent, ChessPiece, MoveEvent, PieceColor } from '../chess-board/chess-board.component';

export interface PlayedMove {
  moveNumber: number;
  white?: string;
  black?: string;
  timestamp: Date;
}

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [CommonModule, RouterLink, ChessBoardComponent],
  template: `
    <div class="game-container">
      <!-- Navbar / Top Header -->
      <header class="navbar">
        <div class="nav-left">
          <button (click)="goToLobby()" class="back-btn" title="Retour au salon">
            <span>←</span>
            <span>Salon de jeu</span>
          </button>
          <div class="game-title-group">
            <span class="game-badge">Partie d'Échecs</span>
            <h1 class="game-heading">Plateau 8×8</h1>
          </div>
        </div>

        <div class="nav-right">
          <div class="turn-pill" [class.turn-white]="currentTurn() === 'white'" [class.turn-black]="currentTurn() === 'black'">
            <span class="turn-dot"></span>
            <span>Trait aux {{ currentTurn() === 'white' ? 'Blancs ♔' : 'Noirs ♚' }}</span>
          </div>

          <button (click)="flipBoard()" class="action-btn" title="Pivoter l'échiquier">
            🔄 Pivoter
          </button>
        </div>
      </header>

      <!-- Main Game Area -->
      <main class="game-main">
        <div class="board-column">

          <!-- Top Player Bar (Black or Opponent) -->
          <div class="player-bar top-player" [class.active-turn]="currentTurn() === topPlayerColor()">
            <div class="player-avatar-box">
              <div class="avatar" [class.avatar-black]="topPlayerColor() === 'black'">
                {{ topPlayerColor() === 'black' ? '♚' : '♔' }}
              </div>
              <div class="player-meta">
                <span class="player-name">{{ topPlayerName() }}</span>
                <span class="player-piece-color">{{ topPlayerColor() === 'black' ? 'Pièces Noires' : 'Pièces Blanches' }}</span>
              </div>
            </div>

            <!-- Captured pieces by top player -->
            <div class="captured-pieces">
              @for (piece of topPlayerCaptures(); track $index) {
                <span class="captured-symbol">{{ piece }}</span>
              }
            </div>
          </div>

          <!-- Central 8x8 Chessboard -->
          <div class="board-wrapper">
            <app-chess-board
              #boardComponent
              [orientation]="boardOrientation()"
              [lastMove]="lastMove()"
              (moveMade)="onMoveMade($event)"
            ></app-chess-board>
          </div>

          <!-- Bottom Player Bar (White or Current User) -->
          <div class="player-bar bottom-player" [class.active-turn]="currentTurn() === bottomPlayerColor()">
            <div class="player-avatar-box">
              <div class="avatar" [class.avatar-white]="bottomPlayerColor() === 'white'">
                {{ bottomPlayerColor() === 'white' ? '♔' : '♚' }}
              </div>
              <div class="player-meta">
                <span class="player-name">{{ bottomPlayerName() }} <span class="badge-you">(Vous)</span></span>
                <span class="player-piece-color">{{ bottomPlayerColor() === 'white' ? 'Pièces Blanches' : 'Pièces Noires' }}</span>
              </div>
            </div>

            <!-- Captured pieces by bottom player -->
            <div class="captured-pieces">
              @for (piece of bottomPlayerCaptures(); track $index) {
                <span class="captured-symbol">{{ piece }}</span>
              }
            </div>
          </div>

        </div>

        <!-- Sidebar / Game Controls & Move History -->
        <aside class="sidebar-column">
          
          <!-- Game Info Card -->
          <div class="card info-card">
            <div class="card-header">
              <span class="card-title">État de la partie</span>
              <span class="live-tag"><span class="live-dot"></span> EN COURS</span>
            </div>
            
            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-label">Total coups</span>
                <span class="stat-val">{{ moveCount() }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Perspective</span>
                <span class="stat-val">{{ boardOrientation() === 'white' ? 'Blancs' : 'Noirs' }}</span>
              </div>
            </div>

            <div class="board-controls">
              <button (click)="resetBoard()" class="btn-control btn-secondary">
                🔄 Réinitialiser
              </button>
              <button (click)="flipBoard()" class="btn-control btn-primary">
                ⇄ Inverser vue
              </button>
            </div>
          </div>

          <!-- Move History Card -->
          <div class="card history-card">
            <div class="card-header">
              <span class="card-title">Historique des coups</span>
              <span class="history-count">{{ movesHistory().length }} tours</span>
            </div>

            <div class="history-table-container">
              @if (movesHistory().length === 0) {
                <div class="empty-history">
                  <span class="empty-icon">♟</span>
                  <p>Aucun coup joué pour l'instant.</p>
                  <p class="empty-sub">Cliquez sur une pièce blanche pour démarrer la partie.</p>
                </div>
              } @else {
                <table class="history-table">
                  <thead>
                    <tr>
                      <th class="th-num">#</th>
                      <th class="th-move">Blancs</th>
                      <th class="th-move">Noirs</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (item of movesHistory(); track item.moveNumber) {
                      <tr>
                        <td class="td-num">{{ item.moveNumber }}.</td>
                        <td class="td-move white-move">{{ item.white || '-' }}</td>
                        <td class="td-move black-move">{{ item.black || '-' }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              }
            </div>
          </div>

        </aside>
      </main>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background: #f8fafc;
      color: #0f172a;
    }

    .game-container {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    /* Navbar */
    .navbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.875rem 2rem;
      background: #ffffff;
      border-bottom: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
      position: sticky;
      top: 0;
      z-index: 40;
    }

    .nav-left {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }

    .back-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.875rem;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 0.5rem;
      color: #334155;
      font-weight: 600;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .back-btn:hover {
      background: #e2e8f0;
      color: #0f172a;
    }

    .game-title-group {
      display: flex;
      flex-direction: column;
    }

    .game-badge {
      font-size: 0.75rem;
      font-weight: 700;
      color: #2563eb;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .game-heading {
      font-size: 1.25rem;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.2;
    }

    .nav-right {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .turn-pill {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.4rem 0.875rem;
      border-radius: 9999px;
      font-size: 0.875rem;
      font-weight: 700;
    }

    .turn-white {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      color: #0f172a;
    }

    .turn-black {
      background: #1e293b;
      border: 1px solid #0f172a;
      color: #f8fafc;
    }

    .turn-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #22c55e;
      box-shadow: 0 0 6px #22c55e;
    }

    .action-btn {
      padding: 0.45rem 0.875rem;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 0.5rem;
      color: #334155;
      font-weight: 600;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .action-btn:hover {
      background: #f8fafc;
      border-color: #94a3b8;
    }

    /* Main Grid Layout */
    .game-main {
      display: grid;
      grid-template-columns: 1fr 360px;
      gap: 2rem;
      padding: 1.5rem 2rem;
      max-width: 1400px;
      margin: 0 auto;
      width: 100%;
      flex: 1;
    }

    @media (max-width: 1024px) {
      .game-main {
        grid-template-columns: 1fr;
      }
    }

    /* Board Column */
    .board-column {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
    }

    .board-wrapper {
      display: flex;
      justify-content: center;
      width: 100%;
    }

    /* Player Bars */
    .player-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      max-width: 600px;
      padding: 0.625rem 1rem;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      transition: all 0.2s ease;
    }

    .player-bar.active-turn {
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }

    .player-avatar-box {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .avatar {
      width: 38px;
      height: 38px;
      border-radius: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      font-weight: 700;
    }

    .avatar-white {
      background: #e2e8f0;
      color: #0f172a;
      border: 1px solid #cbd5e1;
    }

    .avatar-black {
      background: #1e293b;
      color: #f8fafc;
      border: 1px solid #0f172a;
    }

    .player-meta {
      display: flex;
      flex-direction: column;
    }

    .player-name {
      font-weight: 700;
      font-size: 0.9375rem;
      color: #0f172a;
    }

    .badge-you {
      font-size: 0.75rem;
      color: #2563eb;
      font-weight: 600;
    }

    .player-piece-color {
      font-size: 0.75rem;
      color: #64748b;
    }

    .captured-pieces {
      display: flex;
      gap: 0.2rem;
      font-size: 1.25rem;
      min-height: 1.5rem;
    }

    .captured-symbol {
      line-height: 1;
    }

    /* Sidebar Column */
    .sidebar-column {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 1rem;
      padding: 1.25rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .card-title {
      font-weight: 700;
      font-size: 1rem;
      color: #0f172a;
    }

    .live-tag {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.2rem 0.5rem;
      background: #ecfdf5;
      color: #059669;
      border: 1px solid #a7f3d0;
      border-radius: 9999px;
    }

    .live-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #10b981;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    .stat-item {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      padding: 0.625rem;
      display: flex;
      flex-direction: column;
    }

    .stat-label {
      font-size: 0.75rem;
      color: #64748b;
    }

    .stat-val {
      font-size: 1.125rem;
      font-weight: 700;
      color: #0f172a;
    }

    .board-controls {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem;
    }

    .btn-control {
      padding: 0.6rem;
      border-radius: 0.5rem;
      font-weight: 600;
      font-size: 0.8125rem;
      cursor: pointer;
      text-align: center;
      transition: all 0.2s;
    }

    .btn-secondary {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      color: #334155;
    }

    .btn-secondary:hover {
      background: #e2e8f0;
      color: #0f172a;
    }

    .btn-primary {
      background: #2563eb;
      border: 1px solid #2563eb;
      color: #ffffff;
    }

    .btn-primary:hover {
      background: #1d4ed8;
    }

    /* History Card */
    .history-card {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 280px;
    }

    .history-count {
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
    }

    .history-table-container {
      flex: 1;
      overflow-y: auto;
      max-height: 380px;
    }

    .empty-history {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2.5rem 1rem;
      color: #64748b;
      text-align: center;
    }

    .empty-icon {
      font-size: 2.5rem;
      color: #cbd5e1;
      margin-bottom: 0.5rem;
    }

    .empty-sub {
      font-size: 0.75rem;
      color: #94a3b8;
      margin-top: 0.25rem;
    }

    .history-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }

    .history-table th {
      padding: 0.5rem;
      text-align: left;
      font-size: 0.75rem;
      color: #64748b;
      font-weight: 600;
      border-bottom: 1px solid #e2e8f0;
    }

    .th-num {
      width: 40px;
    }

    .history-table td {
      padding: 0.45rem 0.5rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .td-num {
      color: #94a3b8;
      font-weight: 600;
    }

    .white-move {
      color: #0f172a;
      font-weight: 600;
    }

    .black-move {
      color: #334155;
      font-weight: 600;
    }
  `]
})
export class GameComponent implements OnInit, OnDestroy {
  @ViewChild('boardComponent') boardComponent!: ChessBoardComponent;

  // Players info
  currentUser = this.authService.currentUser;
  opponentUsername = signal<string>('Adversaire');

  // Colors & orientation
  userColor = signal<PieceColor>('white');
  boardOrientation = signal<PieceColor>('white');

  // Turn state
  currentTurn = signal<PieceColor>('white');
  lastMove = signal<{ from: string; to: string } | null>(null);

  // Moves & Captures
  moveCount = signal<number>(0);
  movesHistory = signal<PlayedMove[]>([]);
  whiteCaptures = signal<string[]>([]);
  blackCaptures = signal<string[]>([]);

  // Computed layout helpers
  topPlayerName = computed(() => {
    return this.boardOrientation() === 'white' ? this.opponentUsername() : (this.currentUser()?.username || 'Joueur');
  });

  topPlayerColor = computed<PieceColor>(() => {
    return this.boardOrientation() === 'white' ? 'black' : 'white';
  });

  bottomPlayerName = computed(() => {
    return this.boardOrientation() === 'white' ? (this.currentUser()?.username || 'Joueur') : this.opponentUsername();
  });

  bottomPlayerColor = computed<PieceColor>(() => {
    return this.boardOrientation() === 'white' ? 'white' : 'black';
  });

  topPlayerCaptures = computed(() => {
    return this.topPlayerColor() === 'black' ? this.blackCaptures() : this.whiteCaptures();
  });

  bottomPlayerCaptures = computed(() => {
    return this.bottomPlayerColor() === 'white' ? this.whiteCaptures() : this.blackCaptures();
  });

  constructor(
    private authService: AuthService,
    private wsService: WebSocketService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    // Read query params (opponent, color)
    this.route.queryParams.subscribe(params => {
      if (params['opponent']) {
        this.opponentUsername.set(params['opponent']);
      }
      if (params['color'] === 'black') {
        this.userColor.set('black');
        this.boardOrientation.set('black');
      } else {
        this.userColor.set('white');
        this.boardOrientation.set('white');
      }
    });
  }

  ngOnDestroy(): void {}

  onMoveMade(event: MoveEvent): void {
    this.lastMove.set({ from: event.from, to: event.to });
    this.moveCount.update(c => c + 1);

    // Format algebraic-like notation (e.g. "e2-e4" or "Nf3")
    const notation = `${event.from}-${event.to}`;

    // Handle captures
    if (event.captured) {
      const pieceSymbol = this.boardComponent?.getPieceSymbol(event.captured) || '♟';
      if (event.piece.color === 'white') {
        this.whiteCaptures.update(caps => [...caps, pieceSymbol]);
      } else {
        this.blackCaptures.update(caps => [...caps, pieceSymbol]);
      }
    }

    // Update move history list
    const currentHist = [...this.movesHistory()];
    if (event.piece.color === 'white') {
      const newMoveNumber = currentHist.length + 1;
      currentHist.push({
        moveNumber: newMoveNumber,
        white: notation,
        timestamp: new Date()
      });
      this.currentTurn.set('black');
    } else {
      if (currentHist.length > 0 && !currentHist[currentHist.length - 1].black) {
        currentHist[currentHist.length - 1].black = notation;
      } else {
        currentHist.push({
          moveNumber: currentHist.length + 1,
          black: notation,
          timestamp: new Date()
        });
      }
      this.currentTurn.set('white');
    }

    this.movesHistory.set(currentHist);
  }

  flipBoard(): void {
    this.boardOrientation.update(o => o === 'white' ? 'black' : 'white');
  }

  resetBoard(): void {
    if (this.boardComponent) {
      this.boardComponent.initBoard();
      this.currentTurn.set('white');
      this.lastMove.set(null);
      this.moveCount.set(0);
      this.movesHistory.set([]);
      this.whiteCaptures.set([]);
      this.blackCaptures.set([]);
    }
  }

  goToLobby(): void {
    this.router.navigate(['/lobby']);
  }
}
