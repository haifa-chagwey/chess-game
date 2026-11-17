import { Component, EventEmitter, Input, Output, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export type PieceColor = 'white' | 'black';
export type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';

export interface ChessPiece {
  type: PieceType;
  color: PieceColor;
  hasMoved?: boolean;
}

export interface Square {
  row: number; // 0 to 7 (0 is rank 8, 7 is rank 1 from white perspective)
  col: number; // 0 to 7 (0 is file a, 7 is file h)
  coordinate: string; // e.g. "e4"
  piece: ChessPiece | null;
  isLight: boolean;
  isSelected?: boolean;
  isPossibleTarget?: boolean;
  isLastMove?: boolean;
  isCheck?: boolean;
}

export interface MoveEvent {
  from: string; // e.g. "e2"
  to: string;   // e.g. "e4"
  piece: ChessPiece;
  captured?: ChessPiece | null;
}

@Component({
  selector: 'app-chess-board',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chessboard-wrapper select-none">
      <!-- Outer Board Frame with Coordinates -->
      <div class="board-container shadow-xl">
        
        <!-- Files Top Labels (optional) -->
        <div class="files-labels top-labels">
          <span class="corner-spacer"></span>
          @for (file of displayedFiles(); track file) {
            <span class="coord-label file-label">{{ file }}</span>
          }
          <span class="corner-spacer"></span>
        </div>

        <div class="board-middle-row">
          <!-- Ranks Left Labels -->
          <div class="ranks-labels">
            @for (rank of displayedRanks(); track rank) {
              <span class="coord-label rank-label">{{ rank }}</span>
            }
          </div>

          <!-- 8x8 Grid (64 Squares) -->
          <div class="board-grid">
            @for (row of displayedRows(); track rowIdx; let rowIdx = $index) {
              <div class="board-row">
                @for (square of row; track square.coordinate) {
                  <div
                    class="square"
                    [class.square-light]="square.isLight"
                    [class.square-dark]="!square.isLight"
                    [class.square-selected]="selectedSquare()?.coordinate === square.coordinate"
                    [class.square-last-move]="isLastMoveSquare(square.coordinate)"
                    [class.square-target]="isPossibleTarget(square.coordinate)"
                    (click)="onSquareClick(square)"
                  >
                    <!-- In-square coordinate annotations -->
                    @if (showInSquareCoords) {
                      @if (isRankCoordVisible(square)) {
                        <span class="in-square-rank" [class.dark-text]="square.isLight">{{ getSquareRank(square) }}</span>
                      }
                      @if (isFileCoordVisible(square)) {
                        <span class="in-square-file" [class.dark-text]="square.isLight">{{ getSquareFile(square) }}</span>
                      }
                    }

                    <!-- Possible move marker dot -->
                    @if (isPossibleTarget(square.coordinate)) {
                      <div class="target-indicator" [class.has-piece]="square.piece !== null"></div>
                    }

                    <!-- Piece Icon -->
                    @if (square.piece) {
                      <div
                        class="piece"
                        [class.white-piece]="square.piece.color === 'white'"
                        [class.black-piece]="square.piece.color === 'black'"
                        [attr.data-piece]="square.piece.type"
                        [attr.data-color]="square.piece.color"
                      >
                        {{ getPieceSymbol(square.piece) }}
                      </div>
                    }
                  </div>
                }
              </div>
            }
          </div>

          <!-- Ranks Right Labels -->
          <div class="ranks-labels">
            @for (rank of displayedRanks(); track rank) {
              <span class="coord-label rank-label">{{ rank }}</span>
            }
          </div>
        </div>

        <!-- Files Bottom Labels -->
        <div class="files-labels bottom-labels">
          <span class="corner-spacer"></span>
          @for (file of displayedFiles(); track file) {
            <span class="coord-label file-label">{{ file }}</span>
          }
          <span class="corner-spacer"></span>
        </div>

      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      touch-action: manipulation;
    }

    .chessboard-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 0.5rem;
    }

    .board-container {
      background: #ffffff;
      border: 3px solid #cbd5e1;
      border-radius: 1rem;
      padding: 0.5rem;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04);
      display: flex;
      flex-direction: column;
      width: fit-content;
    }

    .files-labels {
      display: flex;
      align-items: center;
      height: 1.5rem;
    }

    .top-labels {
      margin-bottom: 0.125rem;
    }

    .bottom-labels {
      margin-top: 0.125rem;
    }

    .corner-spacer {
      width: 1.5rem;
      flex-shrink: 0;
    }

    .coord-label {
      font-size: 0.8125rem;
      font-weight: 700;
      color: #64748b;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .file-label {
      flex: 1;
      width: var(--square-size, 60px);
      text-transform: uppercase;
    }

    .board-middle-row {
      display: flex;
      align-items: center;
    }

    .ranks-labels {
      display: flex;
      flex-direction: column;
      width: 1.5rem;
      flex-shrink: 0;
    }

    .rank-label {
      height: var(--square-size, 60px);
    }

    /* 8x8 Grid */
    .board-grid {
      display: flex;
      flex-direction: column;
      border: 2px solid #94a3b8;
      border-radius: 0.375rem;
      overflow: hidden;
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
      --square-size: 64px;
    }

    @media (max-width: 640px) {
      .board-grid {
        --square-size: 42px;
      }
      .coord-label {
        font-size: 0.65rem;
      }
      .corner-spacer, .ranks-labels {
        width: 1rem;
      }
    }

    @media (min-width: 1024px) {
      .board-grid {
        --square-size: 72px;
      }
    }

    .board-row {
      display: flex;
    }

    .square {
      width: var(--square-size, 64px);
      height: var(--square-size, 64px);
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background-color 0.15s ease;
      user-select: none;
    }

    /* Squares modern styling */
    .square-light {
      background-color: #f0d9b5; /* Classic clean wood/cream */
    }

    .square-dark {
      background-color: #b58863; /* Warm tournament wood/hazelnut */
    }

    .square:hover {
      filter: brightness(1.04);
    }

    /* Selected Square */
    .square-selected {
      background-color: #7dd3fc !important;
      box-shadow: inset 0 0 0 3px #0284c7;
    }

    /* Last Move Squares */
    .square-last-move {
      background-color: #fef08a !important;
    }
    .square-dark.square-last-move {
      background-color: #eab308 !important;
    }

    /* Target Square Indicator */
    .target-indicator {
      position: absolute;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: rgba(37, 99, 235, 0.4);
      pointer-events: none;
      z-index: 5;
    }

    .target-indicator.has-piece {
      width: 100%;
      height: 100%;
      border-radius: 0;
      background: transparent;
      box-shadow: inset 0 0 0 4px rgba(239, 68, 68, 0.6);
    }

    /* Pieces */
    .piece {
      font-size: calc(var(--square-size, 64px) * 0.76);
      line-height: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2;
      transition: transform 0.15s ease;
      font-family: "Segoe UI Symbol", "Apple Symbols", "DejaVu Sans", "Arial Unicode MS", sans-serif;
    }

    .piece:hover {
      transform: scale(1.08);
    }

    .white-piece {
      color: #ffffff;
      text-shadow:
        0 1px 2px rgba(0, 0, 0, 0.8),
        0 0 2px #000000,
        0 0 4px rgba(0, 0, 0, 0.6);
      filter: drop-shadow(0 3px 2px rgba(0, 0, 0, 0.3));
    }

    .black-piece {
      color: #1e293b;
      text-shadow:
        0 1px 1px rgba(255, 255, 255, 0.4),
        0 0 1px rgba(0, 0, 0, 0.9);
      filter: drop-shadow(0 3px 3px rgba(0, 0, 0, 0.4));
    }

    /* In-square coordinate mini labels */
    .in-square-rank {
      position: absolute;
      top: 2px;
      left: 3px;
      font-size: 0.625rem;
      font-weight: 700;
      color: rgba(255, 255, 255, 0.7);
      pointer-events: none;
    }

    .in-square-file {
      position: absolute;
      bottom: 2px;
      right: 4px;
      font-size: 0.625rem;
      font-weight: 700;
      color: rgba(255, 255, 255, 0.7);
      pointer-events: none;
    }

    .dark-text {
      color: rgba(0, 0, 0, 0.5) !important;
    }
  `]
})
export class ChessBoardComponent implements OnInit {
  @Input() orientation: PieceColor = 'white';
  @Input() interactive: boolean = true;
  @Input() showInSquareCoords: boolean = false;
  @Input() lastMove: { from: string; to: string } | null = null;

  @Output() moveMade = new EventEmitter<MoveEvent>();
  @Output() squareSelected = new EventEmitter<Square>();

  // 8x8 Board state (8 rows, 8 columns)
  board = signal<Square[][]>([]);
  selectedSquare = signal<Square | null>(null);
  possibleTargets = signal<string[]>([]);

  // Coordinates helper
  private readonly files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  private readonly ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  displayedFiles = computed(() => {
    return this.orientation === 'white' ? this.files : [...this.files].reverse();
  });

  displayedRanks = computed(() => {
    return this.orientation === 'white' ? this.ranks : [...this.ranks].reverse();
  });

  displayedRows = computed(() => {
    const currentBoard = this.board();
    if (this.orientation === 'white') {
      return currentBoard;
    } else {
      // Flip both rows and cols for black perspective
      return [...currentBoard].reverse().map(row => [...row].reverse());
    }
  });

  ngOnInit(): void {
    this.initBoard();
  }

  /**
   * Initializes standard 8x8 chess starting position.
   */
  initBoard(): void {
    const newBoard: Square[][] = [];

    for (let r = 0; r < 8; r++) {
      const row: Square[] = [];
      for (let c = 0; c < 8; c++) {
        const file = this.files[c];
        const rank = this.ranks[r];
        const coordinate = `${file}${rank}`;
        const isLight = (r + c) % 2 === 0;

        row.push({
          row: r,
          col: c,
          coordinate,
          piece: this.getInitialPiece(r, c),
          isLight
        });
      }
      newBoard.push(row);
    }

    this.board.set(newBoard);
    this.selectedSquare.set(null);
    this.possibleTargets.set([]);
  }

  /**
   * Returns initial standard piece setup at given 8x8 coordinate.
   */
  private getInitialPiece(row: number, col: number): ChessPiece | null {
    // Black major pieces (Row 0 / Rank 8)
    if (row === 0) {
      const types: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
      return { type: types[col], color: 'black' };
    }
    // Black pawns (Row 1 / Rank 7)
    if (row === 1) {
      return { type: 'pawn', color: 'black' };
    }
    // White pawns (Row 6 / Rank 2)
    if (row === 6) {
      return { type: 'pawn', color: 'white' };
    }
    // White major pieces (Row 7 / Rank 1)
    if (row === 7) {
      const types: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
      return { type: types[col], color: 'white' };
    }
    return null;
  }

  /**
   * Handles square click for selection and move execution.
   */
  onSquareClick(square: Square): void {
    if (!this.interactive) return;

    const currentSelected = this.selectedSquare();

    // 1. If clicking on already selected square, deselect
    if (currentSelected && currentSelected.coordinate === square.coordinate) {
      this.selectedSquare.set(null);
      this.possibleTargets.set([]);
      return;
    }

    // 2. If a piece is selected and clicking on a target square, make the move
    if (currentSelected && currentSelected.piece) {
      // Execute move
      this.executeMove(currentSelected, square);
      this.selectedSquare.set(null);
      this.possibleTargets.set([]);
      return;
    }

    // 3. Otherwise, select the square if it contains a piece
    if (square.piece) {
      this.selectedSquare.set(square);
      this.squareSelected.emit(square);
      this.computeSimpleTargets(square);
    }
  }

  /**
   * Moves piece from source square to destination square on board.
   */
  executeMove(fromSquare: Square, toSquare: Square): void {
    const currentBoard = this.board().map(row => row.map(sq => ({ ...sq })));
    const movingPiece = fromSquare.piece;
    if (!movingPiece) return;

    const capturedPiece = toSquare.piece;

    // Apply move on local board state
    const source = currentBoard[fromSquare.row][fromSquare.col];
    const target = currentBoard[toSquare.row][toSquare.col];

    target.piece = { ...movingPiece, hasMoved: true };
    source.piece = null;

    this.board.set(currentBoard);

    // Emit event
    this.moveMade.emit({
      from: fromSquare.coordinate,
      to: toSquare.coordinate,
      piece: movingPiece,
      captured: capturedPiece
    });
  }

  /**
   * Basic visual targets generator (can be expanded with full chess rules).
   */
  private computeSimpleTargets(square: Square): void {
    if (!square.piece) {
      this.possibleTargets.set([]);
      return;
    }

    const targets: string[] = [];
    const r = square.row;
    const c = square.col;
    const isWhite = square.piece.color === 'white';
    const currentBoard = this.board();

    // Simple forward moves for pawns
    if (square.piece.type === 'pawn') {
      const dir = isWhite ? -1 : 1;
      const nextR = r + dir;
      if (nextR >= 0 && nextR < 8 && !currentBoard[nextR][c].piece) {
        targets.push(currentBoard[nextR][c].coordinate);
        // Double step from start
        const startR = isWhite ? 6 : 1;
        const doubleR = r + (dir * 2);
        if (r === startR && !currentBoard[doubleR][c].piece) {
          targets.push(currentBoard[doubleR][c].coordinate);
        }
      }
      // Captures
      for (const dc of [-1, 1]) {
        const capC = c + dc;
        if (nextR >= 0 && nextR < 8 && capC >= 0 && capC < 8) {
          const targetPiece = currentBoard[nextR][capC].piece;
          if (targetPiece && targetPiece.color !== square.piece.color) {
            targets.push(currentBoard[nextR][capC].coordinate);
          }
        }
      }
    } else if (square.piece.type === 'knight') {
      const knightOffsets = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1]
      ];
      for (const [dr, dc] of knightOffsets) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
          const piece = currentBoard[nr][nc].piece;
          if (!piece || piece.color !== square.piece.color) {
            targets.push(currentBoard[nr][nc].coordinate);
          }
        }
      }
    }

    this.possibleTargets.set(targets);
  }

  isPossibleTarget(coord: string): boolean {
    return this.possibleTargets().includes(coord);
  }

  isLastMoveSquare(coord: string): boolean {
    if (!this.lastMove) return false;
    return this.lastMove.from === coord || this.lastMove.to === coord;
  }

  getSquareRank(square: Square): string {
    return square.coordinate.charAt(1);
  }

  getSquareFile(square: Square): string {
    return square.coordinate.charAt(0);
  }

  isRankCoordVisible(square: Square): boolean {
    return square.col === 0;
  }

  isFileCoordVisible(square: Square): boolean {
    return square.row === 7;
  }

  /**
   * Returns classic Unicode chess piece characters.
   */
  getPieceSymbol(piece: ChessPiece): string {
    const symbols: Record<PieceColor, Record<PieceType, string>> = {
      white: {
        king: '♔',
        queen: '♕',
        rook: '♖',
        bishop: '♗',
        knight: '♘',
        pawn: '♙'
      },
      black: {
        king: '♚',
        queen: '♛',
        rook: '♜',
        bishop: '♝',
        knight: '♞',
        pawn: '♟'
      }
    };
    return symbols[piece.color][piece.type] || '';
  }

  flipBoard(): void {
    this.orientation = this.orientation === 'white' ? 'black' : 'white';
  }
}
