import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Paper,
  IconButton,
  Button,
  Typography,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Drawer,
  List,
  ListItem,
  Divider,
} from '@mui/material';
import {
  Videocam,
  VideocamOff,
  Mic,
  MicOff,
  CallEnd,
  FiberManualRecord,
  Transcribe,
  StopCircle,
  Close as CloseIcon,
  ChevronLeft,
  ChevronRight,
} from '@mui/icons-material';
import PeopleIcon from '@mui/icons-material/People';
import { useParams, useNavigate } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../services/apiClient';
import { useTelehealthMedia } from '../../hooks/telehealth/useTelehealthMedia';
import { useWebRTC } from '../../hooks/telehealth/useWebRTC';
import { webSocketService, WebSocketMessage } from '../../services/webSocketService';
import type { SessionDetails } from '../../types'; // Update this path if needed based on where SessionDetails is actually defined

interface TranscriptEntry {
  speakerName: string;
  speakerRole: 'therapist' | 'patient' | 'participant';
  text: string;
  timestamp: number;
}

const VideoSession: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError, showInfo } = useNotification();
  const { state } = useAuth();
  const user = state.user;

  // Session state
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<SessionDetails | null>(null);
  const [sessionError, setSessionError] = useState<'not_found' | 'forbidden' | 'not_started' | null>(null);

  // Recording and Transcription
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptEntries, setTranscriptEntries] = useState<TranscriptEntry[]>([]);
  const transcriptEntriesRef = useRef<TranscriptEntry[]>([]);
  const [showTranscript, setShowTranscript] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSpeechDetected, setIsSpeechDetected] = useState(false);
  const [transcriptionStatus, setTranscriptionStatus] = useState<
    'idle' | 'starting' | 'listening' | 'error'
  >('idle');
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);
  const [showTranscriptionConsent, setShowTranscriptionConsent] = useState(false);
  const [transcriptionRequester, setTranscriptionRequester] = useState('Your therapist');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const transcriptionRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingStartedAtRef = useRef<number | null>(null);
  const participantCountRef = useRef(0);
  // Stable refs so connectWebSocket closures always call the latest version without stale-closure issues
  const startLocalTranscriptionRef = useRef<((speakerRole: 'therapist' | 'patient') => boolean) | null>(null);
  const stopAndSaveTranscriptionRef = useRef<(() => Promise<void>) | null>(null);
  // webSocketService is a module-level singleton – no ref needed
  const isInitiatorRef = useRef(false);
  // Ref keeps the stream alive in closures registered BEFORE re-renders propagate
  const localStreamRef = useRef<MediaStream | null>(null);
  
  // Participant tracking
  const [participantCount, setParticipantCount] = useState(1); // Start at 1 for self
  const [participantName, setParticipantName] = useState<string>('');

  // Remote video container ref (keeps overflow:hidden behaviour)
  const remoteContainerRef = useRef<HTMLDivElement>(null);

  // Dialogs
  const [showEndDialog, setShowEndDialog] = useState(false);
  // Stable refs so WS closures always read latest values without stale-closure issues
  const userRef = useRef(user);
  const sessionIdRef = useRef<string | null>(sessionId ?? null);

  // --- Hooks ---
  const {
    localVideoRef,
    localStream,
    isCameraOn,
    isMicOn,
    mediaInitFailed,
    isRetryingMedia,
    startLocalMedia,
    stopLocalMedia,
    toggleCamera,
    toggleMicrophone,
    retryMediaAccess,
  } = useTelehealthMedia(showError);

  const sendMessage = useCallback((msg: WebSocketMessage) => {
    webSocketService.sendMessage(msg);
  }, []);

  const {
    remoteVideoRef,
    isRemoteVideoReady,
    isRemotePlaybackBlocked,
    connectionState,
    initializePeerConnection,
    createOffer,
    handleOffer,
    handleAnswer,
    addIceCandidate,
    closePeerConnection,
  } = useWebRTC({
    sendMessage,
    onError: showError,
    isInitiatorRef,
  });

  // Fetch session details
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await apiClient.get(`/api/telehealth/sessions/${sessionId}/`);
        const session = response.data as SessionDetails;
        // Block entry if session hasn't started (still scheduled)
        if (session.status === 'scheduled') {
          setSessionError('not_started');
          return;
        }
        setRoomId(session.room_id);
        setSessionData(session);
        console.log('[VIDEO] Session loaded:', session);
      } catch (error: unknown) {
        const status = (error as { response?: { status?: number } })?.response?.status;
        if (status === 404) {
          setSessionError('not_found');
        } else if (status === 403) {
          setSessionError('forbidden');
        } else {
          setSessionError('not_found');
          console.error('[VIDEO] Error fetching session:', error);
        }
      }
    };

    if (sessionId) {
      fetchSession().catch(console.error);
    }
  }, [sessionId]);

  // Session timer
  useEffect(() => {
    if (sessionStartTime) {
      const interval = setInterval(() => {
        const now = new Date();
        const diff = Math.floor((now.getTime() - sessionStartTime.getTime()) / 1000);
        setSessionDuration(diff);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [sessionStartTime]);

  // Keep refs current on every render
  useEffect(() => { userRef.current = user; }, [user]);
  useEffect(() => { sessionIdRef.current = sessionId ?? null; }, [sessionId]);

  // Stops recognition but deliberately preserves visible entries. Entries are
  // already saved individually as they arrive.
  const stopAndSaveTranscription = useCallback(async () => {
    if (transcriptionRecorderRef.current) {
      const recorder = transcriptionRecorderRef.current;
      transcriptionRecorderRef.current = null;
      if (recorder.state !== 'inactive') recorder.stop();
      webSocketService.sendMessage({ type: 'stop-deepgram-transcription' });
    }
    setIsTranscribing(false);
    setIsSpeechDetected(false);
    setInterimTranscript('');
    setTranscriptionStatus('idle');
  }, []);
  // Update ref on every render so connectWebSocket closures always call the latest version
  stopAndSaveTranscriptionRef.current = stopAndSaveTranscription;

  // Starts a backend-proxied Deepgram stream using only the local microphone.
  // The API key remains on the server and is never exposed to the browser.
  const startLocalTranscription = useCallback((speakerRole: 'therapist' | 'patient') => {
    console.log('[TRANSCRIBE] startLocalTranscription called for role:', speakerRole);
    const stream = localStreamRef.current;
    const audioTrack = stream?.getAudioTracks()[0];
    if (!audioTrack) {
      const message = 'No active microphone is available for transcription.';
      setTranscriptionStatus('error');
      setTranscriptionError(message);
      showError(message);
      return false;
    }
    if (transcriptionRecorderRef.current) {
      showInfo('Transcription is already running.');
      return true;
    }

    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm';
    try {
      const recorder = new MediaRecorder(new MediaStream([audioTrack]), { mimeType });
      recorder.ondataavailable = async (event) => {
        if (event.data.size === 0) return;
        webSocketService.sendMessage({
          type: 'deepgram-audio',
          audio: await event.data.arrayBuffer(),
        });
      };
      recorder.onerror = () => {
        const message = 'The browser could not capture microphone audio for transcription.';
        setTranscriptionStatus('error');
        setTranscriptionError(message);
        setIsTranscribing(false);
        showError(message);
      };
      transcriptionRecorderRef.current = recorder;
      setTranscriptionStatus('starting');
      setTranscriptionError(null);
      webSocketService.sendMessage({
        type: 'start-deepgram-transcription',
        sessionId: sessionIdRef.current ?? '',
        speakerRole,
      });
      return true;
    } catch (error) {
      console.error('[TRANSCRIBE] Failed to create audio stream:', error);
      const message = 'Failed to prepare microphone audio for transcription.';
      setTranscriptionStatus('error');
      setTranscriptionError(message);
      showError(message);
      return false;
    }
  }, [showError, showInfo]);
  // Update ref on every render so connectWebSocket closures always call the latest version
  startLocalTranscriptionRef.current = startLocalTranscription;

  const connectWebSocket = useCallback(async () => {
    if (!roomId || !user) return;

    // Clear any stale listeners from a previous connection to prevent duplicate handlers
    webSocketService.clearListeners();

    try {
      await webSocketService.connect(
        sessionId ?? roomId,
        user.id,
        state.token ?? '',
        `${user.firstName} ${user.lastName}`.trim() || user.username,
        user.role,
      );
    } catch (err) {
      console.error('[VIDEO] Socket.io connection error:', err);
      showError('Failed to connect to session server');
      return;
    }

    // Join the signaling room AFTER registering listeners so no events are missed
    // ── Inbound signaling handlers ───────────────────────────────────────────

    // room-joined: sent to US when we enter a room that already has participants.
    // The server includes the list of who is already present.
    // We don't create an offer here — the existing participant will send one to us
    // because the server fires participant-joined on their side.
    webSocketService.on('room-joined', (data) => {
      const others = (data.participants as Array<{ userId: string; displayName: string }>) ?? [];
      if (others.length > 0) {
        const first = others[0];
        const name = first.displayName || 'A participant';
        console.log('[VIDEO] Room already has participants:', others);
        participantCountRef.current = others.length;
        setParticipantCount(others.length + 1); // +1 for ourselves
        setParticipantName(name);
      }
    });

    // participant-joined: sent to EXISTING participants when someone new arrives.
    // We are the initiator — create an offer for the new arrival.
    webSocketService.on('participant-joined', (data) => {
      const name = (data.displayName as string) || 'A participant';
      console.log('[VIDEO] Participant joined:', name);
      showSuccess(`${name} joined the session`);
      participantCountRef.current += 1;
      setParticipantCount(participantCountRef.current + 1);
      setParticipantName(name);
      isInitiatorRef.current = true;
      // Recreate the PC if the previous one was torn down during a leave/rejoin
      // race. createOffer() cannot run without an active RTCPeerConnection.
      const localStream = localStreamRef.current;
      if (!localStream) {
        console.warn('[VIDEO] Participant joined but local stream is not ready yet');
        return;
      }

      const needsPeerConnection = connectionState === 'closed' || connectionState === 'failed';
      if (needsPeerConnection) {
        void initializePeerConnection(localStream, true)
          .then(() => createOffer())
          .catch((err) => {
            console.error('[VIDEO] Failed to rebuild peer connection before offer:', err);
          });
        return;
      }

      void createOffer();
      // If therapist was already transcribing when the participant joined, re-signal them to start.
      if (transcriptionRecorderRef.current && userRef.current && ['admin', 'therapist', 'staff'].includes(userRef.current.role)) {
        webSocketService.sendMessage({ type: 'start-transcription', sessionId: sessionIdRef.current ?? '', timestamp: new Date() });
      }
    });

    // offer: we are the responder. Use localStreamRef so the closure always
    // reads the current stream regardless of when it was captured.
    webSocketService.on('offer', async (data) => {
      const offer = data.offer as RTCSessionDescriptionInit | undefined;
      const stream = localStreamRef.current;
      if (stream && offer) {
        await handleOffer(offer, stream);
      } else {
        console.warn('[VIDEO] Received offer but local stream is not ready. stream:', !!stream, 'offer:', !!offer);
      }
    });

    webSocketService.on('answer', async (data) => {
      const answer = data.answer as RTCSessionDescriptionInit | undefined;
      if (answer) await handleAnswer(answer);
    });

    webSocketService.on('ice-candidate', async (data) => {
      const candidate = data.candidate as RTCIceCandidateInit | undefined;
      if (candidate) await addIceCandidate(candidate);
    });

    // buffered-candidates: server replays ICE candidates that were queued in Redis
    // during the 10-second reconnection window. Without this handler they are lost.
    webSocketService.on('buffered-candidates', async (data) => {
      const candidates = (data.candidates as RTCIceCandidateInit[]) ?? [];
      if (candidates.length > 0) {
        console.log('[VIDEO] Processing', candidates.length, 'buffered ICE candidates from server');
        for (const candidate of candidates) {
          await addIceCandidate(candidate);
        }
      }
    });

    webSocketService.on('participant-left', () => {
      console.log('[VIDEO] Participant left');
      showError('Other participant left the session');
      participantCountRef.current = Math.max(0, participantCountRef.current - 1);
      setParticipantCount(participantCountRef.current + 1);
      setParticipantName('');
      closePeerConnection();
    });

    webSocketService.on('disconnected', () => {
      showError('Connection to session server lost');
    });

    webSocketService.on('request-transcription', (data) => {
      const u = userRef.current;
      if (u && ['admin', 'therapist', 'staff'].includes(u.role)) return;
      setTranscriptionRequester((data.initiatedByName as string) || 'Your therapist');
      setShowTranscriptionConsent(true);
    });

    webSocketService.on('transcription-response', (data) => {
      const u = userRef.current;
      if (!u || !['admin', 'therapist', 'staff'].includes(u.role)) return;
      if (data.accepted === true) {
        const started = startLocalTranscriptionRef.current?.('therapist');
        if (started) showSuccess('Client approved transcription. Transcription started.');
      } else {
        setTranscriptionStatus('idle');
        showInfo('The client declined transcription.');
      }
    });

    webSocketService.on('deepgram-ready', () => {
      const recorder = transcriptionRecorderRef.current;
      if (recorder && recorder.state === 'inactive') {
        recorder.start(250);
        setIsTranscribing(true);
        setTranscriptionStatus('listening');
        setTranscriptionError(null);
      }
    });

    webSocketService.on('deepgram-transcript', (data) => {
      const incoming = data.entry as (TranscriptEntry & { isFinal?: boolean }) | undefined;
      if (!incoming?.text) return;
      if (!incoming.isFinal) {
        setInterimTranscript(incoming.text);
        setIsSpeechDetected(true);
        return;
      }

      const entry: TranscriptEntry = {
        speakerName: incoming.speakerName,
        speakerRole: incoming.speakerRole,
        text: incoming.text,
        timestamp: incoming.timestamp,
      };
      transcriptEntriesRef.current = [...transcriptEntriesRef.current, entry];
      setTranscriptEntries((previous) => [...previous, entry]);
      setInterimTranscript('');
      setIsSpeechDetected(false);

      const currentUser = userRef.current;
      const sid = sessionIdRef.current;
      if (sid && currentUser && ['admin', 'therapist', 'staff'].includes(currentUser.role)) {
        apiClient.post('/api/telehealth/transcripts', {
          sessionId: sid,
          entries: [entry],
        }).catch((error) => console.error('[TRANSCRIBE] Failed to save Deepgram entry:', error));
      }
    });

    webSocketService.on('deepgram-error', (data) => {
      const message = (data.message as string) || 'The transcription service failed.';
      if (transcriptionRecorderRef.current?.state === 'recording') {
        transcriptionRecorderRef.current.stop();
      }
      transcriptionRecorderRef.current = null;
      setIsTranscribing(false);
      setTranscriptionStatus('error');
      setTranscriptionError(message);
      showError(message);
    });

    webSocketService.on('deepgram-stopped', () => {
      transcriptionRecorderRef.current = null;
      setIsTranscribing(false);
      setIsSpeechDetected(false);
      setInterimTranscript('');
      setTranscriptionStatus('idle');
    });

    // start-transcription: therapist broadcast → patients auto-start their mic
    // Call directly via ref to avoid stale-closure issues from async state → useEffect chain
    webSocketService.on('start-transcription', () => {
      const u = userRef.current;
      if (u && ['admin', 'therapist', 'staff'].includes(u.role)) return;
      // Open the panel so the client can see the listening state or complete a
      // local permission gesture if their browser blocks the remote start.
      setShowTranscript(true);
      startLocalTranscriptionRef.current?.('patient');
    });

    // stop-transcription: therapist stopped → patients stop their recognition
    webSocketService.on('stop-transcription', () => {
      void stopAndSaveTranscriptionRef.current?.();
      showInfo('Transcription was stopped by the other participant.');
    });

    // transcript-entry: remote participant's final speech result → append to local view
    webSocketService.on('transcript-entry', (data) => {
      const entry = data.entry as TranscriptEntry | undefined;
      if (entry) {
        transcriptEntriesRef.current = [...transcriptEntriesRef.current, entry];
        setTranscriptEntries(prev => [...prev, entry]);
      }
    });

    // Join the room AFTER handlers are registered
    webSocketService.joinRoom(roomId, sessionId ?? undefined);

    showSuccess('Connected to session server');
  // localStream intentionally omitted — we use localStreamRef instead to avoid stale closures
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, sessionId, user, showSuccess, showError, createOffer, handleOffer, handleAnswer, addIceCandidate, closePeerConnection, connectionState, initializePeerConnection]);

  // Start Session Effect
  useEffect(() => {
    const initSession = async () => {
      if (roomId && !localStream) {
        const stream = await startLocalMedia();
        if (stream) {
          // Store in ref so signaling-event closures always read the live stream
          localStreamRef.current = stream;

          // CRITICAL ORDER:
          // 1. Initialize peer connection FIRST so it is ready to handle an
          //    incoming offer before we announce our presence to the room.
          await initializePeerConnection(stream, false);

          // 2. Connect signaling and join the room AFTER the PC is prepared.
          await connectWebSocket();

          setSessionStartTime(new Date());
        }
      }
    };

    initSession().catch(console.error);

    return () => {
      stopLocalMedia();
      closePeerConnection();
      webSocketService.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]); 
  // Dependency on connectWebSocket and hooks is intentionally omitted to run once per roomId change
  // Note: Added localStream check to prevent re-running if stream exists

  const cleanupSession = useCallback(() => {
    if (transcriptionRecorderRef.current?.state !== 'inactive') {
      transcriptionRecorderRef.current?.stop();
    }
    transcriptionRecorderRef.current = null;
    stopLocalMedia();
    closePeerConnection();
    webSocketService.disconnect();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, [stopLocalMedia, closePeerConnection]);

  const endSession = async () => {
    // Signal all other participants to stop transcribing and save their side
    if (user && ['admin', 'therapist', 'staff'].includes(user.role) && isTranscribing) {
      webSocketService.sendMessage({ type: 'stop-transcription', sessionId: sessionIdRef.current ?? '', timestamp: new Date() });
    }
    // Save our own side
    await stopAndSaveTranscription();
    try {
      if (sessionId) {
        if (user && ['admin', 'therapist', 'staff'].includes(user.role)) {
          await apiClient.post(`/api/telehealth/sessions/${sessionId}/end`);
        } else {
          await apiClient.post(`/api/telehealth/sessions/${sessionId}/leave`);
        }
      }
      cleanupSession();
      showSuccess(
        user && ['admin', 'therapist', 'staff'].includes(user.role)
          ? 'Session ended and the next appointment is now scheduled'
          : 'You left the session'
      );
      navigate('/telehealth/dashboard');
    } catch (error) {
      console.error('Failed to end session:', error);
      showError('The session could not be ended. Please try again.');
    }
  };

  const toggleRecording = async () => {
    if (!sessionId) return;
    try {
      if (!isRecording) {
        if (localStream) {
          const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
            ? 'video/webm;codecs=vp9,opus'
            : 'video/webm';
          const mediaRecorder = new MediaRecorder(localStream, { mimeType });
          const chunks: BlobPart[] = [];

          mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data);
          };

          mediaRecorder.onstop = async () => {
            const blob = new Blob(chunks, { type: mimeType });
            const durationSeconds = recordingStartedAtRef.current
              ? Math.round((Date.now() - recordingStartedAtRef.current) / 1000)
              : 0;
            recordingStartedAtRef.current = null;

            try {
              const formData = new FormData();
              formData.append('recording', blob, `session-${sessionId}-${Date.now()}.webm`);
              formData.append('sessionId', sessionId);
              formData.append('duration', String(durationSeconds));

              // Raw fetch, not apiClient — apiClient defaults to a JSON
              // Content-Type header, which would break multer's multipart
              // parsing. Leaving Content-Type unset lets the browser add
              // the correct "multipart/form-data; boundary=..." itself.
              const baseUrl = (apiClient.defaults.baseURL as string) || '';
              const token = localStorage.getItem('access_token');
              const response = await fetch(`${baseUrl}/api/telehealth/recordings`, {
                method: 'POST',
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                body: formData,
              });
              if (!response.ok) {
                const body = await response.json().catch(() => ({}));
                throw new Error(body.error || `Upload failed (${response.status})`);
              }
              showSuccess('Recording saved successfully');
            } catch (error) {
              console.error('Failed to save recording:', error);
              showError(error instanceof Error ? error.message : 'Failed to save recording');
            }
          };

          mediaRecorder.start(1000);
          mediaRecorderRef.current = mediaRecorder;
          recordingStartedAtRef.current = Date.now();
          setIsRecording(true);
          showSuccess('Recording started');
        }
      } else {
        if (mediaRecorderRef.current) {
          mediaRecorderRef.current.stop();
          mediaRecorderRef.current = null;
        }
        setIsRecording(false);
        showSuccess('Recording stopped — saving...');
      }
    } catch (error) {
      console.error('Recording error:', error);
      showError('Failed to toggle recording');
    }
  };

  const startTranscription = async () => {
    // Unconditional — proves the click actually reached this handler at all,
    // regardless of what happens next (extension interference, disabled
    // state, etc. would all prevent even this line from running).
    console.log('[TRANSCRIBE] Start Transcription clicked', {
      sessionId,
      sessionDataId: sessionData?.id,
      isTranscribing,
      isSecureContext: window.isSecureContext,
      userRole: user?.role,
    });
    const activeSessionId = sessionId ?? (sessionData?.id != null ? String(sessionData.id) : undefined);
    if (!activeSessionId) {
      showError('Cannot start transcription because this session was not loaded correctly.');
      return;
    }
    try {
      if (user && ['admin', 'therapist', 'staff'].includes(user.role)) {
        setTranscriptionStatus('starting');
        setTranscriptionError(null);
        webSocketService.sendMessage({
          type: 'request-transcription',
          sessionId: activeSessionId,
          timestamp: new Date(),
        });
        showInfo('Transcription request sent to the client.');
        return;
      }

      const speakerRole: 'therapist' | 'patient' = user?.role === 'client' ? 'patient' : 'therapist';
      const started = startLocalTranscription(speakerRole);
      if (!started) return;
      showSuccess('Transcription started');
    } catch (error) {
      console.error('Transcription error:', error);
      showError('Failed to start transcription');
    }
  };

  const recordTranscriptionConsent = (accepted: boolean) => {
    const activeSessionId = sessionId ?? (sessionData?.id != null ? String(sessionData.id) : undefined);
    if (!activeSessionId) return;
    apiClient.post('/api/audit/logs/batch/', {
      logs: [{
        action: accepted ? 'TRANSCRIPTION_CONSENT_GRANTED' : 'TRANSCRIPTION_CONSENT_DECLINED',
        resource: 'telehealth_session',
        resourceId: activeSessionId,
        newValues: { accepted, decidedAt: new Date().toISOString() },
      }],
    }).catch((error) => console.error('[TRANSCRIBE] Failed to record consent decision:', error));
  };

  const respondToTranscriptionRequest = (accepted: boolean) => {
    setShowTranscriptionConsent(false);
    recordTranscriptionConsent(accepted);

    if (accepted) {
      const started = startLocalTranscription('patient');
      if (!started) {
        webSocketService.sendMessage({
          type: 'transcription-response',
          sessionId: sessionIdRef.current ?? '',
          accepted: false,
          timestamp: new Date(),
        });
        showError('You allowed transcription, but it could not start in this browser.');
        return;
      }
    }

    webSocketService.sendMessage({
      type: 'transcription-response',
      sessionId: sessionIdRef.current ?? '',
      accepted,
      timestamp: new Date(),
    });

    if (!accepted) {
      setTranscriptionStatus('idle');
      showInfo('Transcription request declined.');
      return;
    }
  };

  const stopTranscription = async () => {
    const activeSessionId = sessionId ?? (sessionData?.id != null ? String(sessionData.id) : undefined);
    if (!activeSessionId) {
      showError('Cannot stop transcription because this session was not loaded correctly.');
      return;
    }
    try {
      webSocketService.sendMessage({ type: 'stop-transcription', sessionId: activeSessionId, timestamp: new Date() });
      await stopAndSaveTranscription();
    } catch (error) {
      console.error('Transcription error:', error);
      showError('Failed to stop transcription');
    }
  };
  
  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Full-screen error state for invalid / inaccessible sessions
  if (sessionError) {
    const errorConfig = {
      not_found: {
        title: 'Session Not Found',
        message: 'This telehealth session does not exist or has been removed. Please check the link or contact your provider.',
        color: '#ef4444',
      },
      forbidden: {
        title: 'Access Denied',
        message: 'You are not authorized to join this session.',
        color: '#f97316',
      },
      not_started: {
        title: 'Meeting Not Started',
        message: 'This session is scheduled but has not started yet. Please wait in the waiting room or come back at your appointment time.',
        color: '#3b82f6',
      },
    }[sessionError];

    return (
      <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#1a1a1a' }}>
        <Box sx={{ textAlign: 'center', maxWidth: 480, p: 4 }}>
          <Box sx={{ width: 80, height: 80, borderRadius: '50%', bgcolor: errorConfig.color, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3 }}>
            <Typography variant="h3" sx={{ color: 'white' }}>
              {sessionError === 'not_started' ? '⏳' : '✕'}
            </Typography>
          </Box>
          <Typography variant="h5" sx={{ color: 'white', fontWeight: 700, mb: 2 }}>
            {errorConfig.title}
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)', mb: 4 }}>
            {errorConfig.message}
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/telehealth')}
            sx={{ bgcolor: errorConfig.color, '&:hover': { bgcolor: errorConfig.color, opacity: 0.85 } }}
          >
            Back to Telehealth
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#1a1a1a' }}>
      {/* Header */}
      <Paper elevation={0} sx={{ p: { xs: 1, sm: 2 }, bgcolor: 'rgba(0, 0, 0, 0.8)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, overflow: 'hidden', flex: 1 }}>
          <Box sx={{ flexShrink: 0 }}>
            <Typography variant="h6" sx={{ fontSize: { xs: '0.85rem', sm: '1.25rem' } }}>{sessionData?.title || 'Telehealth Session'}</Typography>
            {user && ['admin', 'therapist', 'staff'].includes(user.role) && sessionData?.patient_details && (
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                Client: {sessionData.patient_details.first_name} {sessionData.patient_details.last_name}
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Chip label={formatDuration(sessionDuration)} color="error" size="small" icon={<FiberManualRecord />} />
            <Chip
              label={`${participantCount} ${participantCount !== 1 ? 'Participants' : 'Participant'}`}
              color={participantCount > 1 ? "success" : "default"}
              size="small"
              icon={<PeopleIcon />}
            />
            {isRemoteVideoReady && <Chip label="Connected" color="success" size="small" />}
            {participantName && <Chip label={participantName} size="small" variant="outlined" sx={{ color: 'white', borderColor: 'white', display: { xs: 'none', sm: 'flex' } }} />}
          </Box>
        </Box>
      </Paper>

      {/* Main Video Area */}
      <Box sx={{ flex: 1, position: 'relative', bgcolor: '#000', display: 'flex' }}>
        <Box ref={remoteContainerRef} sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'contain', backgroundColor: '#000' }}
          />
          {!isRemoteVideoReady && (
            <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', color: 'white' }}>
              <Typography variant="h6">
                {participantCount > 1 
                  ? `Establishing connection with ${participantName || 'participant'}...`
                  : 'Waiting for other participant to join...'}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, opacity: 0.7 }}>
                {participantCount > 1 
                  ? 'Setting up video and audio...'
                  : 'Share the session link or wait for them to connect'}
              </Typography>
            </Box>
          )}
          {isRemoteVideoReady && isRemotePlaybackBlocked && (
            <Box sx={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)' }}>
              <Button
                variant="contained"
                onClick={() => {
                  if (remoteVideoRef.current) {
                    remoteVideoRef.current.muted = false;
                    remoteVideoRef.current.volume = 1;
                    void remoteVideoRef.current.play();
                  }
                }}
              >
                Tap to start video
              </Button>
            </Box>
          )}

          {/* Local Video */}
          <Paper elevation={4} sx={{ position: 'absolute', bottom: { xs: 8, sm: 20 }, right: { xs: 40, sm: 20 }, width: { xs: 80, sm: 240 }, height: { xs: 60, sm: 180 }, overflow: 'hidden', bgcolor: '#000' }}>
            <video ref={localVideoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
            {!isCameraOn && (
              <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(0,0,0,0.8)', color: 'white', width: '100%', height: '100%' }}>
                <VideocamOff />
              </Box>
            )}
          </Paper>
        </Box>
      </Box>

      {/* Controls */}
      <Paper elevation={0} sx={{ p: { xs: 1, sm: 2 }, bgcolor: 'rgba(0, 0, 0, 0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: { xs: 1, sm: 2 }, flexWrap: 'nowrap', overflowX: 'auto', flexShrink: 0 }}>
        <IconButton onClick={toggleMicrophone} sx={{ bgcolor: isMicOn ? 'rgba(255,255,255,0.1)' : 'error.main', color: 'white' }}>
          {isMicOn ? <Mic /> : <MicOff />}
        </IconButton>
        <IconButton onClick={toggleCamera} sx={{ bgcolor: isCameraOn ? 'rgba(255,255,255,0.1)' : 'error.main', color: 'white' }}>
          {isCameraOn ? <Videocam /> : <VideocamOff />}
        </IconButton>
        
        {user && ['admin', 'therapist', 'staff'].includes(user.role) && (
          <>
            <IconButton onClick={toggleRecording} sx={{ bgcolor: isRecording ? 'error.main' : 'rgba(255,255,255,0.1)', color: 'white' }}>
              {isRecording ? <StopCircle /> : <FiberManualRecord />}
            </IconButton>
            <IconButton onClick={() => setShowTranscript(prev => !prev)} sx={{ bgcolor: showTranscript ? 'primary.main' : isTranscribing ? 'primary.dark' : 'rgba(255,255,255,0.1)', color: 'white' }}>
              <Transcribe />
            </IconButton>
          </>
        )}

        <IconButton onClick={() => setShowEndDialog(true)} sx={{ bgcolor: 'error.main', color: 'white' }}>
          <CallEnd />
        </IconButton>
        
        {mediaInitFailed && (
          <Button onClick={retryMediaAccess} disabled={isRetryingMedia} variant="contained" color="warning" sx={{ ml: 1 }}>
            {isRetryingMedia ? 'Retrying...' : 'Retry Camera'}
          </Button>
        )}
      </Paper>
      
      {/* End Dialog */}
      <Dialog open={showEndDialog} onClose={() => setShowEndDialog(false)}>
        <DialogTitle>End Session</DialogTitle>
        <DialogContent><Alert severity="warning">Are you sure you want to end this session?</Alert></DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEndDialog(false)}>Cancel</Button>
          <Button onClick={endSession} color="error" variant="contained">End Session</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={showTranscriptionConsent}
        onClose={() => respondToTranscriptionRequest(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Transcription Request</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            {transcriptionRequester} would like to transcribe this session.
          </Alert>
          <Typography variant="body2">
            If you allow, your spoken conversation will appear as a labeled session transcript and
            will be saved with the session. Tell your therapist if you want transcription stopped.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => respondToTranscriptionRequest(false)} color="inherit">
            Decline
          </Button>
          <Button onClick={() => respondToTranscriptionRequest(true)} variant="contained">
            Allow Transcription
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Transcript controls and content are restricted to clinical staff. */}
      {user && ['admin', 'therapist', 'staff'].includes(user.role) && <Box
        onClick={() => setShowTranscript(prev => !prev)}
        sx={{
          position: 'fixed',
          left: showTranscript ? { xs: '85vw', sm: '400px' } : 0,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 1400,
          bgcolor: 'primary.main',
          color: 'white',
          borderRadius: '0 8px 8px 0',
          width: 28,
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: 3,
          transition: 'left 225ms cubic-bezier(0,0,0.2,1)',
          '&:hover': { bgcolor: 'primary.dark' },
        }}
      >
        {showTranscript ? <ChevronLeft fontSize="small" /> : <ChevronRight fontSize="small" />}
      </Box>}

      {/* Transcript Drawer */}
      {user && ['admin', 'therapist', 'staff'].includes(user.role) && <Drawer anchor="left" open={showTranscript} sx={{ '& .MuiDrawer-paper': { width: { xs: '85vw', sm: 400 }, p: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h6">Session Transcript</Typography>
          <IconButton size="small" onClick={() => setShowTranscript(false)} aria-label="Close panel">
            <CloseIcon />
          </IconButton>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Chip size="small" label="Therapist" sx={{ bgcolor: '#e3f2fd', color: '#1565c0' }} />
          <Chip size="small" label="Client" sx={{ bgcolor: '#e8f5e9', color: '#2e7d32' }} />
        </Box>
        {transcriptionError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {transcriptionError}
          </Alert>
        )}
        {!isTranscribing && !transcriptionError && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Each participant should click Start Transcription once so their browser can authorize speech recognition.
          </Alert>
        )}
        <Box sx={{ flex: 1, overflow: 'auto', mb: 2 }}>
          {transcriptionStatus === 'starting' && <Typography variant="caption">Starting transcription…</Typography>}
          {isTranscribing && (
            <Typography variant="caption" color="success.main">
              {isSpeechDetected ? 'Speech detected…' : 'Listening…'}
            </Typography>
          )}
          <List disablePadding>
            {transcriptEntries.map((entry, idx) => {
              const isTherapist = entry.speakerRole === 'therapist';
              return (
                <React.Fragment key={idx}>
                  <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                    <Box sx={{
                      width: '100%',
                      p: 1.5,
                      borderRadius: 1,
                      bgcolor: isTherapist ? '#e3f2fd' : '#e8f5e9',
                      borderLeft: `4px solid ${isTherapist ? '#1565c0' : '#2e7d32'}`,
                    }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Chip
                          size="small"
                          label={entry.speakerName}
                          color={isTherapist ? 'primary' : 'success'}
                          sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </Typography>
                      </Box>
                      <Typography variant="body2">{entry.text}</Typography>
                    </Box>
                  </ListItem>
                  <Divider />
                </React.Fragment>
              );
            })}
            {interimTranscript && (
              <ListItem sx={{ px: 0 }}>
                <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                  [Live] {interimTranscript}
                </Typography>
              </ListItem>
            )}
          </List>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Button
            fullWidth
            variant="contained"
            color="primary"
            onClick={startTranscription}
            disabled={isTranscribing || transcriptionStatus === 'starting'}
          >
            Start Transcription
          </Button>
          <Button
            fullWidth
            variant="contained"
            color="error"
            onClick={stopTranscription}
            disabled={!isTranscribing}
          >
            Stop Transcription
          </Button>
          <Button fullWidth variant="outlined" onClick={() => setShowTranscript(false)}>Close</Button>
        </Box>
      </Drawer>}
    </Box>
  );
};

export default VideoSession;
