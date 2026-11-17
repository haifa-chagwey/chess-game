import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Invitation, InvitationActionRequest, InvitationRequest } from '../models/invitation.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class InvitationService {
  private readonly API_URL = 'http://localhost:8080/api/invitations';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const username = this.authService.getUsername() || '';
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'X-Username': username
    });
  }

  sendInvitation(recipientUsername: string): Observable<Invitation> {
    const senderUsername = this.authService.getUsername();
    const body: InvitationRequest = {
      senderUsername,
      recipientUsername
    };
    return this.http.post<Invitation>(this.API_URL, body, { headers: this.getHeaders() });
  }

  respondToInvitation(invitationId: number, accept: boolean): Observable<Invitation> {
    const username = this.authService.getUsername() || '';
    const body: InvitationActionRequest = {
      invitationId,
      accept
    };
    return this.http.post<Invitation>(`${this.API_URL}/respond?username=${encodeURIComponent(username)}`, body, {
      headers: this.getHeaders()
    });
  }

  getPendingInvitations(): Observable<Invitation[]> {
    const username = this.authService.getUsername() || '';
    return this.http.get<Invitation[]>(`${this.API_URL}/pending?username=${encodeURIComponent(username)}`, {
      headers: this.getHeaders()
    });
  }

  getReceivedInvitations(): Observable<Invitation[]> {
    const username = this.authService.getUsername() || '';
    return this.http.get<Invitation[]>(`${this.API_URL}/received?username=${encodeURIComponent(username)}`, {
      headers: this.getHeaders()
    });
  }

  getSentInvitations(): Observable<Invitation[]> {
    const username = this.authService.getUsername() || '';
    return this.http.get<Invitation[]>(`${this.API_URL}/sent?username=${encodeURIComponent(username)}`, {
      headers: this.getHeaders()
    });
  }
}
