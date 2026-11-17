import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { Client, IMessage, Stomp } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

import { User } from '../models/user.model';
import { Invitation } from '../models/invitation.model';
import { WebSocketNotification } from '../models/websocket.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private stompClient: Client | null = null;
  private readonly WS_URL = 'http://localhost:8080/ws';

  private usersSubject = new BehaviorSubject<User[]>([]);
  public users$: Observable<User[]> = this.usersSubject.asObservable();

  private invitationReceivedSubject = new Subject<WebSocketNotification<Invitation>>();
  public invitationReceived$: Observable<WebSocketNotification<Invitation>> = this.invitationReceivedSubject.asObservable();

  private invitationResponseSubject = new Subject<WebSocketNotification<Invitation>>();
  public invitationResponse$: Observable<WebSocketNotification<Invitation>> = this.invitationResponseSubject.asObservable();

  private connectedSubject = new BehaviorSubject<boolean>(false);
  public connected$: Observable<boolean> = this.connectedSubject.asObservable();

  constructor(private authService: AuthService) {}

  connect(username: string): void {
    if (this.stompClient && this.stompClient.active) {
      console.log('WebSocket already active');
      return;
    }

    console.log('Initializing WebSocket connection for user:', username);

    this.stompClient = new Client({
      webSocketFactory: () => new SockJS(this.WS_URL),
      connectHeaders: {
        username: username
      },
      debug: (msg: string) => {
        // console.log('[STOMP]', msg);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000
    });

    this.stompClient.onConnect = () => {
      console.log('Connected to WebSocket server');
      this.connectedSubject.next(true);

      // Notify server of active user session
      this.stompClient?.publish({
        destination: '/app/users/connect',
        body: JSON.stringify({ username: username })
      });

      // Subscribe to public user list updates
      this.stompClient?.subscribe('/topic/users', (message: IMessage) => {
        try {
          const notification: WebSocketNotification<User[]> = JSON.parse(message.body);
          if (notification.type === 'USERS_LIST_UPDATED' && Array.isArray(notification.payload)) {
            this.usersSubject.next(notification.payload);
          }
        } catch (e) {
          console.error('Error parsing /topic/users message', e);
        }
      });

      // Subscribe to personal invitations topic
      this.stompClient?.subscribe(`/topic/invitations/${username}`, (message: IMessage) => {
        try {
          const notification: WebSocketNotification<Invitation> = JSON.parse(message.body);
          console.log('Received personal invitation notification:', notification);

          if (notification.type === 'INVITATION_RECEIVED') {
            this.invitationReceivedSubject.next(notification);
          } else if (
            notification.type === 'INVITATION_ACCEPTED' ||
            notification.type === 'INVITATION_DECLINED' ||
            notification.type === 'INVITATION_CANCELED'
          ) {
            this.invitationResponseSubject.next(notification);
          }
        } catch (e) {
          console.error('Error parsing invitation message', e);
        }
      });

      // Request initial users list
      this.stompClient?.publish({
        destination: '/app/users/list',
        body: '{}'
      });
    };

    this.stompClient.onDisconnect = () => {
      console.log('Disconnected from WebSocket server');
      this.connectedSubject.next(false);
    };

    this.stompClient.onStompError = (frame) => {
      console.error('STOMP broker error:', frame.headers['message'], frame.body);
    };

    this.stompClient.activate();
  }

  disconnect(): void {
    if (this.stompClient) {
      const username = this.authService.getUsername();
      if (username) {
        try {
          this.stompClient.publish({
            destination: '/app/users/disconnect',
            body: JSON.stringify({ username })
          });
        } catch {}
      }
      this.stompClient.deactivate();
      this.stompClient = null;
      this.connectedSubject.next(false);
    }
  }

  sendStompInvite(recipientUsername: string): void {
    const senderUsername = this.authService.getUsername();
    if (this.stompClient && this.stompClient.connected && senderUsername) {
      this.stompClient.publish({
        destination: '/app/invite',
        body: JSON.stringify({ senderUsername, recipientUsername })
      });
    }
  }

  sendStompInviteResponse(invitationId: number, accept: boolean): void {
    const responderUsername = this.authService.getUsername();
    if (this.stompClient && this.stompClient.connected && responderUsername) {
      this.stompClient.publish({
        destination: '/app/invite/respond',
        body: JSON.stringify({ responderUsername, invitationId, accept })
      });
    }
  }
}
