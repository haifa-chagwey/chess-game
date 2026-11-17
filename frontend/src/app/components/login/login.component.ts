import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <!-- Header -->
        <div class="card-header">
          <div class="logo-icon">♔</div>
          <h1 class="card-title">Chess Master</h1>
          <p class="card-subtitle">Plateforme d'échecs multijoueurs en temps réel</p>
        </div>

        <!-- Mode Toggle -->
        <div class="tabs-container">
          <button
            type="button"
            class="tab-btn"
            [class.active]="isLoginMode()"
            (click)="setMode(true)">
            Connexion
          </button>
          <button
            type="button"
            class="tab-btn"
            [class.active]="!isLoginMode()"
            (click)="setMode(false)">
            Créer un compte
          </button>
        </div>

        <!-- Feedback Alert -->
        <div *ngIf="errorMessage()" class="alert alert-error animate-fade-in">
          <span>⚠️</span> {{ errorMessage() }}
        </div>
        <div *ngIf="successMessage()" class="alert alert-success animate-fade-in">
          <span>✓</span> {{ successMessage() }}
        </div>

        <!-- Form -->
        <form (ngSubmit)="onSubmit()" class="login-form">
          <div class="form-group">
            <label class="form-label" for="username">Nom d'utilisateur</label>
            <div class="input-wrapper">
              <span class="input-icon">👤</span>
              <input
                id="username"
                type="text"
                class="form-input"
                placeholder="Ex: MagnusCarlsen"
                [(ngModel)]="username"
                name="username"
                required
                autocomplete="username"
              />
            </div>
          </div>

          <div *ngIf="!isLoginMode()" class="form-group animate-fade-in">
            <label class="form-label" for="email">Email <span class="optional">(optionnel)</span></label>
            <div class="input-wrapper">
              <span class="input-icon">✉️</span>
              <input
                id="email"
                type="email"
                class="form-input"
                placeholder="joueur@exemple.com"
                [(ngModel)]="email"
                name="email"
                autocomplete="email"
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="password">Mot de passe</label>
            <div class="input-wrapper">
              <span class="input-icon">🔒</span>
              <input
                id="password"
                type="password"
                class="form-input"
                placeholder="••••••••"
                [(ngModel)]="password"
                name="password"
                required
                autocomplete="current-password"
              />
            </div>
          </div>

          <button
            type="submit"
            class="submit-btn"
            [disabled]="loading() || !username.trim() || !password.trim()">
            <span *ngIf="loading()" class="spinner"></span>
            <span>{{ isLoginMode() ? 'Se connecter' : 'Créer mon compte' }}</span>
          </button>
        </form>

        <div class="card-footer">
          <span class="badge-level">🟢 Niveau 1 — Authentification & Joueurs en ligne</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    }

    .login-card {
      width: 100%;
      max-width: 440px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 1.25rem;
      padding: 2.25rem;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04);
    }

    .card-header {
      text-align: center;
      margin-bottom: 1.75rem;
    }

    .logo-icon {
      font-size: 3.5rem;
      color: #2563eb;
      margin-bottom: 0.25rem;
    }

    .card-title {
      font-size: 1.75rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.025em;
    }

    .card-subtitle {
      font-size: 0.875rem;
      color: #64748b;
      margin-top: 0.25rem;
    }

    .tabs-container {
      display: flex;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      padding: 0.25rem;
      margin-bottom: 1.5rem;
    }

    .tab-btn {
      flex: 1;
      padding: 0.625rem;
      border: none;
      background: transparent;
      color: #64748b;
      font-weight: 600;
      font-size: 0.875rem;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .tab-btn.active {
      background: #2563eb;
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
    }

    .alert {
      padding: 0.75rem 1rem;
      border-radius: 0.625rem;
      font-size: 0.875rem;
      margin-bottom: 1.25rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .alert-error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #b91c1c;
    }

    .alert-success {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      color: #15803d;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 1.125rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .form-label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: #334155;
    }

    .optional {
      font-size: 0.75rem;
      color: #94a3b8;
      font-weight: normal;
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-icon {
      position: absolute;
      left: 0.875rem;
      font-size: 1rem;
      color: #94a3b8;
      pointer-events: none;
    }

    .form-input {
      width: 100%;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      color: #0f172a;
      border-radius: 0.625rem;
      padding: 0.6875rem 1rem 0.6875rem 2.5rem;
      font-size: 0.9375rem;
      transition: all 0.2s ease;
    }

    .form-input:focus {
      outline: none;
      background: #ffffff;
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
    }

    .submit-btn {
      width: 100%;
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      color: #ffffff;
      border: none;
      border-radius: 0.625rem;
      padding: 0.8125rem;
      font-size: 0.9375rem;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: all 0.2s ease;
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);
      margin-top: 0.5rem;
    }

    .submit-btn:hover:not(:disabled) {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      transform: translateY(-1px);
      box-shadow: 0 6px 18px rgba(37, 99, 235, 0.35);
    }

    .submit-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .spinner {
      width: 1rem;
      height: 1rem;
      border: 2px solid #ffffff;
      border-bottom-color: transparent;
      border-radius: 50%;
      display: inline-block;
      animation: rotation 1s linear infinite;
    }

    @keyframes rotation {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .card-footer {
      margin-top: 1.75rem;
      text-align: center;
    }

    .badge-level {
      display: inline-block;
      padding: 0.35rem 0.75rem;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      color: #059669;
    }
  `]
})
export class LoginComponent {
  isLoginMode = signal<boolean>(true);
  loading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  username = '';
  password = '';
  email = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/lobby']);
    }
  }

  setMode(isLogin: boolean): void {
    this.isLoginMode.set(isLogin);
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  onSubmit(): void {
    if (!this.username.trim() || !this.password.trim()) {
      this.errorMessage.set('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    if (this.isLoginMode()) {
      this.authService.login({
        username: this.username.trim(),
        password: this.password.trim()
      }).subscribe({
        next: () => {
          this.loading.set(false);
          this.router.navigate(['/lobby']);
        },
        error: (err) => {
          this.loading.set(false);
          const msg = err.error?.error || 'Identifiants incorrects. Veuillez réessayer.';
          this.errorMessage.set(msg);
        }
      });
    } else {
      this.authService.register({
        username: this.username.trim(),
        password: this.password.trim(),
        email: this.email.trim() || undefined
      }).subscribe({
        next: () => {
          this.loading.set(false);
          this.successMessage.set('Compte créé avec succès ! Connexion...');
          setTimeout(() => {
            this.router.navigate(['/lobby']);
          }, 800);
        },
        error: (err) => {
          this.loading.set(false);
          const msg = err.error?.error || 'Échec de la création du compte.';
          this.errorMessage.set(msg);
        }
      });
    }
  }
}
