import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { WebSocketService } from '../../services/websocket.service';
import { InvitationService } from '../../services/invitation.service';
import { User } from '../../models/user.model';
import { Invitation } from '../../models/invitation.model';
import { InvitationModalComponent } from '../invitation-modal/invitation-modal.component';

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [CommonModule, FormsModule, InvitationModalComponent],
  template: `
    <div class="lobby-layout">
      <!-- Top Navigation Bar -->
      <header class="navbar">
        <div class="nav-brand">
          <span class="brand-piece">♔</span>
          <span class="brand-name">Chess Master</span>
          <!-- <span class="badge-level">Niveau 1 & 2</span> -->
        </div>

        <div class="nav-right">
          <!-- Button to open 8x8 Board -->
          <!-- <button type="button" class="btn-play-board" (click)="openChessBoard()" title="Ouvrir le plateau d'échecs 8×8">
            ♟ Voir le Plateau 8×8
          </button> -->

          <!-- Connection Indicator -->
          <!-- <div class="connection-status" [class.connected]="wsConnected()">
            <span class="status-dot"></span>
            <span>{{ wsConnected() ? 'WebSocket Connecté' : 'Connexion...' }}</span>
          </div> -->

          <!-- Current User Profile & Logout -->
          <div class="user-profile" *ngIf="currentUser()">
            <div class="user-avatar">{{ currentUser()?.username?.charAt(0)?.toUpperCase() }}</div>
            <div class="user-info">
              <span class="username">{{ currentUser()?.username }}</span>
              <span class="user-badge">En ligne</span>
            </div>
            <button type="button" class="logout-btn" (click)="logout()" title="Déconnexion">
              🚪 Déconnexion
            </button>
          </div>
        </div>
      </header>

      <!-- Toast Alerts Area -->
      <div class="toasts-container" *ngIf="toastMessage()">
        <div class="toast animate-fade-in" [ngClass]="'toast-' + toastType()">
          <span>{{ toastType() === 'success' ? '✓' : toastType() === 'info' ? 'ℹ️' : '⚠️' }}</span>
          <span>{{ toastMessage() }}</span>
          <button type="button" class="toast-close" (click)="clearToast()">✕</button>
        </div>
      </div>

      <!-- Main Content -->
      <main class="main-content">
        <div class="content-grid">
          
          <!-- Left Column: Connected Online Players -->
          <section class="card players-card">
            <div class="card-title-bar">
              <div class="title-with-count">
                <h2 class="section-title">Joueurs Connectés</h2>
                <span class="count-badge count-online">{{ onlineOtherPlayers().length }} en ligne</span>
              </div>
              <button type="button" class="refresh-btn" (click)="refreshUsers()" title="Actualiser la liste">
                🔄
              </button>
            </div>

            <!-- Online Players List -->
            <div class="players-list">
              <div *ngIf="onlineOtherPlayers().length === 0" class="empty-state">
                <div class="empty-icon">⏳</div>
                <p class="empty-text">Aucun autre joueur connecté pour le moment.</p>
                <p class="empty-subtext">Ouvrez un autre navigateur pour tester les invitations en direct !</p>
              </div>

              <div
                *ngFor="let player of onlineOtherPlayers()"
                class="player-item animate-fade-in">
                <div class="player-left">
                  <div class="player-avatar">
                    {{ player.username.charAt(0).toUpperCase() }}
                    <span class="online-indicator"></span>
                  </div>
                  <div class="player-details">
                    <span class="player-username">{{ player.username }}</span>
                    <span class="player-status-text">Disponible pour jouer</span>
                  </div>
                </div>

                <div class="player-actions">
                  <button
                    type="button"
                    class="btn-invite"
                    [disabled]="isInviting(player.username)"
                    (click)="invitePlayer(player.username)">
                    <span *ngIf="isInviting(player.username)" class="btn-spinner"></span>
                    <span *ngIf="!isInviting(player.username)">⚔️ Défier</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Offline Players Accordion -->
            <div class="offline-section" *ngIf="offlinePlayers().length > 0">
              <h3 class="offline-title">Joueurs Hors Ligne ({{ offlinePlayers().length }})</h3>
              <div class="offline-list">
                <div *ngFor="let p of offlinePlayers()" class="offline-item">
                  <div class="offline-avatar">{{ p.username.charAt(0).toUpperCase() }}</div>
                  <span class="offline-username">{{ p.username }}</span>
                  <span class="offline-badge">Hors ligne</span>
                </div>
              </div>
            </div>
          </section>

          <!-- Right Column: Pending Invitations & Sent History -->
          <div class="side-column">
            
            <!-- Received Pending Invitations Card -->
            <section class="card invitations-card">
              <div class="card-title-bar">
                <div class="title-with-count">
                  <h2 class="section-title">Invitations Reçues</h2>
                  <span class="count-badge count-pending">{{ pendingInvitations().length }} en attente</span>
                </div>
              </div>

              <div class="invitations-list">
                <div *ngIf="pendingInvitations().length === 0" class="empty-state-small">
                  <p class="empty-subtext">Aucune invitation reçue en attente</p>
                </div>

                <div
                  *ngFor="let inv of pendingInvitations()"
                  class="invitation-item animate-fade-in">
                  <div class="inv-info">
                    <span class="inv-sender">⚔️ <strong>{{ inv.senderUsername }}</strong></span>
                    <span class="inv-time">{{ inv.createdAt | date:'HH:mm:ss' }}</span>
                  </div>
                  <div class="inv-actions">
                    <button
                      type="button"
                      class="btn-action btn-decline-sm"
                      (click)="respondInvitation(inv.id, false)">
                      Refuser
                    </button>
                    <button
                      type="button"
                      class="btn-action btn-accept-sm"
                      (click)="respondInvitation(inv.id, true)">
                      Accepter
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <!-- Sent Invitations History Card -->
            <section class="card history-card">
              <div class="card-title-bar">
                <h2 class="section-title">Invitations Envoyées</h2>
              </div>

              <div class="sent-list">
                <div *ngIf="sentInvitations().length === 0" class="empty-state-small">
                  <p class="empty-subtext">Aucune invitation envoyée</p>
                </div>

                <div
                  *ngFor="let inv of sentInvitations()"
                  class="sent-item animate-fade-in">
                  <div class="sent-info">
                    <span>Vers <strong>{{ inv.recipientUsername }}</strong></span>
                    <span class="sent-time">{{ inv.createdAt | date:'HH:mm' }}</span>
                  </div>
                  <span
                    class="status-pill"
                    [ngClass]="'status-' + inv.status.toLowerCase()">
                    {{ inv.status === 'PENDING' ? 'En attente...' : inv.status === 'ACCEPTED' ? '✓ Acceptée' : '✕ Refusée' }}
                  </span>
                </div>
              </div>
            </section>

          </div>
        </div>
      </main>

      <!-- Active Incoming Invitation Modal Popup -->
      <app-invitation-modal
        *ngIf="activeIncomingInvitation()"
        [invitation]="activeIncomingInvitation()!"
        (onAccept)="respondInvitation($event, true)"
        (onDecline)="respondInvitation($event, false)">
      </app-invitation-modal>
    </div>
  `,
  styles: [`
    .lobby-layout {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: #f8fafc;
    }

    .navbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 2rem;
      background: #ffffff;
      border-bottom: 1px solid #e2e8f0;
      position: sticky;
      top: 0;
      z-index: 50;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
    }

    .nav-brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .brand-piece {
      font-size: 2rem;
      color: #2563eb;
    }

    .brand-name {
      font-size: 1.25rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.025em;
    }

    .badge-level {
      padding: 0.2rem 0.5rem;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      border-radius: 9999px;
      font-size: 0.7rem;
      font-weight: 700;
      color: #059669;
    }

    .nav-right {
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }

    .btn-play-board {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.45rem 0.875rem;
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      color: #ffffff;
      border: none;
      border-radius: 0.5rem;
      font-size: 0.8125rem;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(37, 99, 235, 0.25);
      transition: all 0.2s ease;
    }

    .btn-play-board:hover {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(37, 99, 235, 0.35);
    }

    .connection-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8125rem;
      color: #64748b;
      background: #f1f5f9;
      padding: 0.375rem 0.75rem;
      border-radius: 9999px;
      border: 1px solid #e2e8f0;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      background: #ef4444;
      border-radius: 50%;
    }

    .connection-status.connected .status-dot {
      background: #16a34a;
      box-shadow: 0 0 8px rgba(22, 163, 74, 0.6);
    }

    .user-profile {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .user-avatar {
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      color: #ffffff;
      font-size: 0.9375rem;
      box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);
    }

    .user-info {
      display: flex;
      flex-direction: column;
    }

    .username {
      font-weight: 700;
      color: #0f172a;
      font-size: 0.875rem;
    }

    .user-badge {
      font-size: 0.7rem;
      color: #059669;
      font-weight: 600;
    }

    .logout-btn {
      padding: 0.4rem 0.75rem;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      color: #475569;
      border-radius: 0.5rem;
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .logout-btn:hover {
      background: #fef2f2;
      border-color: #fca5a5;
      color: #dc2626;
    }

    .toasts-container {
      position: fixed;
      top: 5rem;
      right: 2rem;
      z-index: 100;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-width: 400px;
    }

    .toast {
      padding: 0.875rem 1.125rem;
      border-radius: 0.75rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
      font-size: 0.875rem;
      font-weight: 500;
    }

    .toast-success {
      background: #059669;
      color: #ffffff;
    }

    .toast-info {
      background: #2563eb;
      color: #ffffff;
    }

    .toast-warning {
      background: #d97706;
      color: #ffffff;
    }

    .toast-error {
      background: #dc2626;
      color: #ffffff;
    }

    .toast-close {
      margin-left: auto;
      background: transparent;
      border: none;
      color: #ffffff;
      cursor: pointer;
      font-size: 1rem;
      opacity: 0.8;
    }

    .toast-close:hover {
      opacity: 1;
    }

    .main-content {
      flex: 1;
      padding: 2rem;
      max-width: 1280px;
      margin: 0 auto;
      width: 100%;
    }

    .content-grid {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 1.5rem;
    }

    @media (max-width: 900px) {
      .content-grid {
        grid-template-columns: 1fr;
      }
    }

    .card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 1rem;
      padding: 1.5rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
    }

    .card-title-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .title-with-count {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .section-title {
      font-size: 1.125rem;
      font-weight: 700;
      color: #0f172a;
    }

    .count-badge {
      padding: 0.2rem 0.6rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;
    }

    .count-online {
      background: #ecfdf5;
      color: #059669;
      border: 1px solid #a7f3d0;
    }

    .count-pending {
      background: #fef3c7;
      color: #d97706;
      border: 1px solid #fde68a;
    }

    .refresh-btn {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      color: #64748b;
      border-radius: 0.5rem;
      padding: 0.35rem 0.6rem;
      cursor: pointer;
      font-size: 0.875rem;
      transition: all 0.2s ease;
    }

    .refresh-btn:hover {
      background: #e2e8f0;
      color: #0f172a;
    }

    .players-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .empty-state {
      text-align: center;
      padding: 3rem 1.5rem;
      color: #64748b;
    }

    .empty-icon {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
    }

    .empty-text {
      font-size: 1rem;
      font-weight: 600;
      color: #334155;
    }

    .empty-subtext {
      font-size: 0.8125rem;
      color: #94a3b8;
      margin-top: 0.25rem;
    }

    .player-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.875rem 1.125rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      transition: all 0.2s ease;
    }

    .player-item:hover {
      border-color: #93c5fd;
      background: #f0f7ff;
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(37, 99, 235, 0.06);
    }

    .player-left {
      display: flex;
      align-items: center;
      gap: 0.875rem;
    }

    .player-avatar {
      position: relative;
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #0284c7, #0369a1);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      color: #ffffff;
      font-size: 1rem;
    }

    .online-indicator {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 10px;
      height: 10px;
      background: #16a34a;
      border: 2px solid #ffffff;
      border-radius: 50%;
      box-shadow: 0 0 4px #16a34a;
    }

    .player-details {
      display: flex;
      flex-direction: column;
    }

    .player-username {
      font-weight: 700;
      color: #0f172a;
      font-size: 0.9375rem;
    }

    .player-status-text {
      font-size: 0.75rem;
      color: #059669;
      font-weight: 500;
    }

    .btn-invite {
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      color: #ffffff;
      border: none;
      border-radius: 0.5rem;
      padding: 0.5rem 1rem;
      font-size: 0.8125rem;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.375rem;
      transition: all 0.2s ease;
      box-shadow: 0 2px 6px rgba(37, 99, 235, 0.25);
    }

    .btn-invite:hover:not(:disabled) {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);
      transform: translateY(-1px);
    }

    .btn-invite:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-spinner {
      width: 0.875rem;
      height: 0.875rem;
      border: 2px solid #ffffff;
      border-bottom-color: transparent;
      border-radius: 50%;
      display: inline-block;
      animation: rotation 1s linear infinite;
    }

    .offline-section {
      margin-top: 2rem;
      padding-top: 1.25rem;
      border-top: 1px solid #f1f5f9;
    }

    .offline-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: #64748b;
      margin-bottom: 0.75rem;
    }

    .offline-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .offline-item {
      display: flex;
      align-items: center;
      padding: 0.5rem 0.75rem;
      border-radius: 0.5rem;
      background: #f8fafc;
      border: 1px solid #f1f5f9;
      gap: 0.75rem;
    }

    .offline-avatar {
      width: 28px;
      height: 28px;
      background: #cbd5e1;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      color: #475569;
      font-weight: 600;
    }

    .offline-username {
      font-size: 0.8125rem;
      color: #64748b;
      font-weight: 500;
    }

    .offline-badge {
      margin-left: auto;
      font-size: 0.7rem;
      color: #94a3b8;
    }

    .side-column {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .empty-state-small {
      text-align: center;
      padding: 1.5rem 1rem;
    }

    .invitations-list, .sent-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .invitation-item {
      padding: 0.875rem;
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 0.625rem;
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
    }

    .inv-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .inv-sender {
      font-size: 0.875rem;
      font-weight: 600;
      color: #92400e;
    }

    .inv-time {
      font-size: 0.75rem;
      color: #b45309;
    }

    .inv-actions {
      display: flex;
      gap: 0.5rem;
    }

    .btn-action {
      flex: 1;
      padding: 0.375rem 0.5rem;
      border-radius: 0.375rem;
      font-size: 0.75rem;
      font-weight: 700;
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;
    }

    .btn-decline-sm {
      background: #ffffff;
      color: #dc2626;
      border: 1px solid #fca5a5;
    }

    .btn-decline-sm:hover {
      background: #fef2f2;
    }

    .btn-accept-sm {
      background: #16a34a;
      color: #ffffff;
    }

    .btn-accept-sm:hover {
      background: #15803d;
    }

    .sent-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 0.875rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      font-size: 0.8125rem;
    }

    .sent-info {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .sent-time {
      font-size: 0.7rem;
      color: #94a3b8;
    }

    .status-pill {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.2rem 0.5rem;
      border-radius: 0.375rem;
    }

    .status-pending {
      color: #d97706;
      background: #fef3c7;
      border: 1px solid #fde68a;
    }

    .status-accepted {
      color: #059669;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
    }

    .status-declined {
      color: #dc2626;
      background: #fef2f2;
      border: 1px solid #fecaca;
    }
  `]
})
export class LobbyComponent implements OnInit, OnDestroy {
  currentUser = this.authService.currentUser;
  wsConnected = signal<boolean>(false);

  allUsers = signal<User[]>([]);
  pendingInvitations = signal<Invitation[]>([]);
  sentInvitations = signal<Invitation[]>([]);
  activeIncomingInvitation = signal<Invitation | null>(null);

  invitingUsers = signal<Set<string>>(new Set());

  toastMessage = signal<string | null>(null);
  toastType = signal<'success' | 'info' | 'warning' | 'error'>('info');
  private toastTimeout: any;

  private subscriptions: Subscription[] = [];

  // Computed signals
  onlineOtherPlayers = computed(() => {
    const myName = this.currentUser()?.username;
    return this.allUsers().filter(u => u.username !== myName && u.online);
  });

  offlinePlayers = computed(() => {
    const myName = this.currentUser()?.username;
    return this.allUsers().filter(u => u.username !== myName && !u.online);
  });

  constructor(
    private authService: AuthService,
    private wsService: WebSocketService,
    private invitationService: InvitationService,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    const currentUsername = this.authService.getUsername()!;

    // 1. Connect WebSocket
    this.wsService.connect(currentUsername);

    // 2. Subscribe to WebSocket events
    this.subscriptions.push(
      this.wsService.connected$.subscribe(connected => {
        this.wsConnected.set(connected);
      }),

      this.wsService.users$.subscribe(users => {
        if (users && users.length > 0) {
          this.allUsers.set(users);
        }
      }),

      this.wsService.invitationReceived$.subscribe(notification => {
        console.log('Incoming invitation received:', notification);
        this.activeIncomingInvitation.set(notification.payload);
        this.showToast(`Nouvelle invitation de défi reçue de ${notification.payload.senderUsername} !`, 'info');
        this.refreshInvitations();
      }),

      this.wsService.invitationResponse$.subscribe(notification => {
        console.log('Invitation response received:', notification);
        const inv = notification.payload;
        if (inv.status === 'ACCEPTED') {
          this.showToast(`🎉 ${inv.recipientUsername} a accepté votre défi d'échecs ! Lancement de la partie...`, 'success');
          setTimeout(() => {
            this.router.navigate(['/game'], {
              queryParams: { opponent: inv.recipientUsername, color: 'white' }
            });
          }, 1500);
        } else if (inv.status === 'DECLINED') {
          this.showToast(`❌ ${inv.recipientUsername} a refusé votre invitation.`, 'warning');
        }
        this.refreshInvitations();
      })
    );

    // 3. Initial REST fetches
    this.refreshUsers();
    this.refreshInvitations();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.wsService.disconnect();
  }

  refreshUsers(): void {
    this.http.get<User[]>('http://localhost:8080/api/users').subscribe({
      next: (users) => this.allUsers.set(users),
      error: () => {}
    });
  }

  refreshInvitations(): void {
    this.invitationService.getPendingInvitations().subscribe({
      next: (invs) => this.pendingInvitations.set(invs),
      error: () => {}
    });

    this.invitationService.getSentInvitations().subscribe({
      next: (invs) => this.sentInvitations.set(invs),
      error: () => {}
    });
  }

  isInviting(username: string): boolean {
    return this.invitingUsers().has(username);
  }

  invitePlayer(recipientUsername: string): void {
    const updating = new Set(this.invitingUsers());
    updating.add(recipientUsername);
    this.invitingUsers.set(updating);

    this.invitationService.sendInvitation(recipientUsername).subscribe({
      next: (invitation) => {
        const set = new Set(this.invitingUsers());
        set.delete(recipientUsername);
        this.invitingUsers.set(set);

        this.showToast(`Invitation envoyée à ${recipientUsername}`, 'success');
        this.refreshInvitations();
      },
      error: (err) => {
        const set = new Set(this.invitingUsers());
        set.delete(recipientUsername);
        this.invitingUsers.set(set);

        const msg = err.error?.error || "Impossible d'envoyer l'invitation.";
        this.showToast(msg, 'error');
      }
    });
  }

  openChessBoard(): void {
    this.router.navigate(['/game']);
  }

  respondInvitation(invitationId: number, accept: boolean): void {
    this.activeIncomingInvitation.set(null);

    this.invitationService.respondToInvitation(invitationId, accept).subscribe({
      next: (invitation) => {
        if (accept) {
          this.showToast(`Défi accepté avec ${invitation.senderUsername} ! Lancement de la partie...`, 'success');
          setTimeout(() => {
            this.router.navigate(['/game'], {
              queryParams: { opponent: invitation.senderUsername, color: 'black' }
            });
          }, 1500);
        } else {
          this.showToast(`Défi refusé.`, 'info');
        }
        this.refreshInvitations();
      },
      error: (err) => {
        const msg = err.error?.error || "Erreur lors de la réponse à l'invitation.";
        this.showToast(msg, 'error');
      }
    });
  }

  showToast(message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info'): void {
    this.toastMessage.set(message);
    this.toastType.set(type);

    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    this.toastTimeout = setTimeout(() => {
      this.clearToast();
    }, 5000);
  }

  clearToast(): void {
    this.toastMessage.set(null);
  }

  logout(): void {
    this.wsService.disconnect();
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
