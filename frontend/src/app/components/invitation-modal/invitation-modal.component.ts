import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Invitation } from '../../models/invitation.model';

@Component({
  selector: 'app-invitation-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" (click)="onBackdropClick($event)">
      <div class="modal-card animate-fade-in animate-pulse-glow">
        <!-- Modal Header -->
        <div class="modal-header">
          <div class="challenge-icon">⚔️</div>
          <h2 class="modal-title">Défi d'échecs reçu !</h2>
          <span class="timer-badge">⏱️ {{ timeLeft }}s</span>
        </div>

        <!-- Modal Body -->
        <div class="modal-body">
          <div class="avatar-badge">
            <span class="avatar-initial">{{ invitation.senderUsername.charAt(0).toUpperCase() }}</span>
          </div>
          <p class="challenge-text">
            <strong class="player-name">{{ invitation.senderUsername }}</strong> vous invite à disputer une partie d'échecs en temps réel.
          </p>
        </div>

        <!-- Modal Actions -->
        <div class="modal-actions">
          <button
            type="button"
            class="btn btn-decline"
            [disabled]="loading"
            (click)="decline()">
            ✕ Refuser
          </button>
          <button
            type="button"
            class="btn btn-accept"
            [disabled]="loading"
            (click)="accept()">
            ✓ Accepter le défi
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      z-index: 1000;
    }

    .modal-card {
      width: 100%;
      max-width: 440px;
      background: #ffffff;
      border: 1px solid #93c5fd;
      border-radius: 1.25rem;
      padding: 2rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      text-align: center;
    }

    .modal-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
      position: relative;
    }

    .challenge-icon {
      font-size: 3rem;
      animation: bounce 1.5s infinite;
    }

    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-8px); }
    }

    .modal-title {
      font-size: 1.5rem;
      font-weight: 800;
      color: #0f172a;
    }

    .timer-badge {
      font-size: 0.75rem;
      font-weight: 700;
      color: #b45309;
      background: #fef3c7;
      border: 1px solid #fde68a;
      padding: 0.25rem 0.625rem;
      border-radius: 9999px;
    }

    .modal-body {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.75rem;
    }

    .avatar-badge {
      width: 64px;
      height: 64px;
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3);
    }

    .avatar-initial {
      font-size: 1.75rem;
      font-weight: 800;
      color: #ffffff;
    }

    .challenge-text {
      font-size: 1rem;
      color: #334155;
      line-height: 1.5;
    }

    .player-name {
      color: #2563eb;
      font-weight: 700;
    }

    .modal-actions {
      display: flex;
      gap: 1rem;
    }

    .btn {
      flex: 1;
      padding: 0.75rem 1rem;
      border-radius: 0.625rem;
      font-size: 0.9375rem;
      font-weight: 700;
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.375rem;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-decline {
      background: #ffffff;
      color: #dc2626;
      border: 1px solid #fca5a5;
    }

    .btn-decline:hover:not(:disabled) {
      background: #fef2f2;
      border-color: #ef4444;
    }

    .btn-accept {
      background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
      color: #ffffff;
      box-shadow: 0 4px 14px rgba(22, 163, 74, 0.3);
    }

    .btn-accept:hover:not(:disabled) {
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      box-shadow: 0 6px 18px rgba(22, 163, 74, 0.45);
      transform: translateY(-1px);
    }
  `]
})
export class InvitationModalComponent implements OnInit, OnDestroy {
  @Input({ required: true }) invitation!: Invitation;
  @Output() onAccept = new EventEmitter<number>();
  @Output() onDecline = new EventEmitter<number>();

  loading = false;
  timeLeft = 30;
  private timer: any;

  ngOnInit(): void {
    this.startTimer();
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  private startTimer(): void {
    this.timer = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        this.clearTimer();
        this.decline();
      }
    }, 1000);
  }

  private clearTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  accept(): void {
    this.loading = true;
    this.clearTimer();
    this.onAccept.emit(this.invitation.id);
  }

  decline(): void {
    this.loading = true;
    this.clearTimer();
    this.onDecline.emit(this.invitation.id);
  }

  onBackdropClick(event: MouseEvent): void {
    // Prevent accidental dismissal
  }
}
