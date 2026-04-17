/**
 * Telehealth Signaling Client
 * Uses socket.io-client to communicate with the Socket.io signaling server.
 *
 * The backend signaling server (signalingServer.js) expects:
 *   connect auth:  { userId, token, displayName, role }
 *   client emits:  join-room, offer, answer, ice-candidate, leave-room, heartbeat
 *   server emits:  room-joined, participant-joined, participant-left,
 *                  offer, answer, ice-candidate, buffered-candidates
 */
import { io, Socket } from 'socket.io-client';

export interface WebSocketMessage {
  type: string;
  sessionId?: string;
  participantId?: string;
  data?: Record<string, unknown>;
  timestamp?: Date;
  // WebRTC fields (used by useWebRTC)
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  // Allow arbitrary extra keys
  [key: string]: unknown;
}

type EventCallback = (data: Record<string, unknown>) => void;

class WebSocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, EventCallback[]> = new Map();
  private sessionId: string | null = null;
  private roomId: string | null = null;

  // ─── Public API ────────────────────────────────────────────────────────────

  /**
   * Connect to the Socket.io signaling server.
   * Must be called before joinRoom / sendMessage.
   */
  connect(
    sessionId: string,
    userId: string,
    token?: string,
    displayName?: string,
    role?: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      // Close any existing connection cleanly
      if (this.socket) {
        this.socket.removeAllListeners();
        this.socket.disconnect();
        this.socket = null;
      }

      this.sessionId = sessionId;

      // Derive the socket.io server URL – strip any trailing /api from the REST base
      const rawBase = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';
      const serverUrl = rawBase.replace(/\/api\/?$/, '') || 'http://localhost:8000';

      // Token falls back to localStorage
      const authToken = token ?? localStorage.getItem('access_token') ?? '';

      this.socket = io(serverUrl, {
        path: '/socket.io',
        auth: {
          userId,
          token: authToken,
          displayName: displayName ?? userId,
          role: role ?? 'client',
        },
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
      });

      // ── Forward server events to listeners ─────────────────────────────
      const serverEvents: string[] = [
        'room-joined',
        'participant-joined',
        'participant-left',
        'offer',
        'answer',
        'ice-candidate',
        'buffered-candidates',
        'start-transcription',
        'stop-transcription',
        'transcript-entry',
      ];

      for (const event of serverEvents) {
        this.socket.on(event, (data: Record<string, unknown>) => {
          this._emit(event, data);
        });
      }

      this.socket.on('disconnect', (reason: string) => {
        console.warn('[WS] Disconnected:', reason);
        this._emit('disconnected', { reason });
      });

      this.socket.on('connect', () => {
        console.log('[WS] Socket.io connected:', this.socket?.id);
        resolve();
      });

      this.socket.on('connect_error', (err: Error) => {
        console.error('[WS] Socket.io connection error:', err.message);
        reject(err);
      });
    });
  }

  /**
   * Explicitly join a signaling room AFTER registering all listeners.
   * Emits the `join-room` event the server expects.
   */
  joinRoom(roomId: string, sessionId?: string): void {
    if (!this.socket?.connected) {
      console.warn('[WS] joinRoom called before socket is connected');
      return;
    }
    this.roomId = roomId;
    this.socket.emit('join-room', {
      roomId,
      sessionId: sessionId ?? this.sessionId ?? roomId,
    });
    console.log('[WS] Emitted join-room for room:', roomId);
  }

  /**
   * Remove all event listeners (call before re-connecting to avoid duplicates).
   */
  clearListeners(): void {
    this.listeners.clear();
  }

  /**
   * Translate a WebSocketMessage (as produced by useWebRTC) into the correct
   * socket.io event and emit it to the signaling server.
   */
  sendMessage(message: WebSocketMessage): void {
    if (!this.socket?.connected) {
      console.error('[WS] Cannot send – socket not connected');
      return;
    }
    const roomId = this.roomId;

    switch (message.type) {
      case 'offer':
        this.socket.emit('offer', { roomId, offer: message.offer });
        break;
      case 'answer':
        this.socket.emit('answer', { roomId, answer: message.answer });
        break;
      // useWebRTC sends both spellings
      case 'ice_candidate':
      case 'ice-candidate': {
        const candidate = message.candidate ?? (message.data?.candidate as RTCIceCandidateInit | undefined);
        this.socket.emit('ice-candidate', { roomId, candidate });
        break;
      }
      default:
        this.socket.emit(message.type, { roomId, ...message });
    }
  }

  /** Convenience wrapper used by telehealthService to send a WebRTC answer. */
  sendAnswer(answer: RTCSessionDescriptionInit, _targetParticipantId?: string): void {
    this.sendMessage({ type: 'answer', answer });
  }

  /** Convenience wrapper used by telehealthService to send an ICE candidate. */
  sendIceCandidate(candidate: RTCIceCandidate, _targetParticipantId?: string): void {
    this.sendMessage({ type: 'ice-candidate', candidate });
  }

  /** Register a listener for a server-emitted event. */
  on(event: string, callback: EventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  /** Remove a previously registered listener. */
  off(event: string, callback: EventCallback): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const idx = callbacks.indexOf(callback);
      if (idx > -1) callbacks.splice(idx, 1);
    }
  }

  /** Gracefully disconnect from the signaling server. */
  disconnect(): void {
    if (this.socket) {
      if (this.roomId) {
        try { this.socket.emit('leave-room', { roomId: this.roomId }); } catch (_) { /* ignore */ }
      }
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.sessionId = null;
    this.roomId = null;
  }

  /** @returns true if the socket is currently connected */
  isWebSocketConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  getConnectionStatus(): 'connected' | 'connecting' | 'disconnected' {
    if (!this.socket) return 'disconnected';
    if (this.socket.connected) return 'connected';
    return 'connecting';
  }

  // ─── Private ───────────────────────────────────────────────────────────────

  private _emit(event: string, data: Record<string, unknown>): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      for (const cb of callbacks) {
        try { cb(data); } catch (err) { console.error('[WS] Listener error for', event, err); }
      }
    }
  }
}

export const webSocketService = new WebSocketService();
