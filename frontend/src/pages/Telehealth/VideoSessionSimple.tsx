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
  AspectRatio,
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
  const { showSuccess, showError } = useNotification();
  const { state } = useAuth();
  const user = state.user;

  // Session state
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<SessionDetails | null>(null);
  const [sessionError, setSessionError] = useState<'not_found' | 'forbidden' | 'not_started' | null>(null);
  const [videoFitMode, setVideoFitMode] = useState<'cover' | 'contain'>('cover');

  // Recording and Transcription
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptEntries, setTranscriptEntries] = useState<TranscriptEntry[]>([]);
  const transcriptEntriesRef = useRef<TranscriptEntry[]>([]);
  const [showTranscript, setShowTranscript] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSpeechDetected, setIsSpeechDetected] = useState(false);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const participantCountRef = useRef(0);
  // webSocketService is a module-level singleton – no ref needed
  const isInitiatorRef = useRef(false);
  const isTranscribingRef = useRef(false); // mirrors isTranscribing for use inside WS callbacks
  const keepTranscribingRef = useRef(false); // true = recognition should auto-restart after onend
  // Ref keeps the stream alive in closures registered BEFORE re-renders propagate
  const localStreamRef = useRef<MediaStream | null>(null);
  
  // Participant tracking
  const [participantCount, setParticipantCount] = useState(1); // Start at 1 for self
  const [participantName, setParticipantName] = useState<string>('');

  // Remote video container ref (keeps overflow:hidden behaviour)
  const remoteContainerRef = useRef<HTMLDivElement>(null);

  // Dialogs
  const [showEndDialog, setShowEndDialog] = useState(false);
  // Auto-transcription: patient side tracks whether therapist triggered transcription
  const [autoTranscribeRequested, setAutoTranscribeRequested] = useState(false);
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
    refreshVideoConstraints,
  } = useTelehealthMedia(showError);

  const sendMessage = useCallback((msg: WebSocketMessage) => {
    webSocketService.sendMessage(msg);
  }, []);

  const {
    remoteVideoRef,
    isRemoteVideoReady,
    isRemotePlaybackBlocked,
    remoteStream,
    initializePeerConnection,
    createOffer,
    handleOffer,
    handleAnswer,
    addIceCandidate,
    closePeerConnection,
  } = useWebRTC({
    sendMessage,
    onError: showError,
  });

  const hasRemoteVideo = isRemoteVideoReady;

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
  useEffect(() => { isTranscribingRef.current = isTranscribing; }, [isTranscribing]);

  useEffect(() => {
    const handleViewportChange = () => {
      void refreshVideoConstraints();
    };

    window.addEventListener('orientationchange', handleViewportChange);
    window.addEventListener('resize', handleViewportChange);

    return () => {
      window.removeEventListener('orientationchange', handleViewportChange);
      window.removeEventListener('resize', handleViewportChange);
    };
  }, [refreshVideoConstraints]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream && remoteVideoRef.current.srcObject !== remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      const playPromise = remoteVideoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.warn('[VIDEO] Remote playback retry blocked:', error);
        });
      }
    }
  }, [remoteStream, remoteVideoRef, hasRemoteVideo]);

  // Stops recognition, saves accumulated entries, clears state
  const stopAndSaveTranscription = useCallback(async () => {
    // Cancel any pending auto-restart BEFORE stopping recognition
    keepTranscribingRef.current = false;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsTranscribing(false);
    setIsSpeechDetected(false);
    const sid = sessionIdRef.current;
    if (transcriptEntriesRef.current.length > 0 && sid) {
      try {
        await apiClient.post('/api/telehealth/transcripts', {
          sessionId: sid,
          entries: transcriptEntriesRef.current,
        });
        showSuccess('Transcript saved');
      } catch (error) {
        console.error('Failed to save transcript:', error);
        showError('Failed to save transcript');
      }
    }
    transcriptEntriesRef.current = [];
    setTranscriptEntries([]);
  }, [showSuccess, showError]);

  // Starts Web Speech API on the local mic, labeling entries by role.
  // Auto-restarts on onend so mobile timeouts/no-speech events don't silently kill the mic.
  const startLocalTranscription = useCallback((speakerRole: 'therapist' | 'patient') => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;
    // Already running — nothing to do
    if (keepTranscribingRef.current && recognitionRef.current) return;

    const u = userRef.current;
    const speakerName = `${u?.firstName || ''} ${u?.lastName || ''}`.trim() || u?.username || speakerRole;

    keepTranscribingRef.current = true;

    const createAndStartRecognition = () => {
      if (!keepTranscribingRef.current) return;

      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimText = '';
        let finalText = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const text = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalText += text + ' ';
          } else {
            interimText += text;
          }
        }
        setInterimTranscript(interimText);
        if (finalText) {
          const entry: TranscriptEntry = {
            speakerName,
            speakerRole,
            text: finalText.trim(),
            timestamp: Date.now(),
          };
          transcriptEntriesRef.current = [...transcriptEntriesRef.current, entry];
          setTranscriptEntries(prev => [...prev, entry]);
          setInterimTranscript('');
          webSocketService.sendMessage({
            type: 'transcript-entry',
            sessionId: sessionIdRef.current ?? '',
            timestamp: new Date(),
            entry: entry as unknown as Record<string, unknown>,
          });
        }
      };

      recognition.onspeechstart = () => setIsSpeechDetected(true);
      recognition.onspeechend = () => setIsSpeechDetected(false);

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('[TRANSCRIBE] Error:', event.error);
        // Permanent permission errors — stop the restart loop
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          keepTranscribingRef.current = false;
          setIsTranscribing(false);
          recognitionRef.current = null;
        }
        // All other errors fall through to onend which handles the restart
      };

      // onend fires on every session end: silence timeout, no-speech, network blip, manual stop.
      // If keepTranscribingRef is still true, schedule a fresh session.
      recognition.onend = () => {
        recognitionRef.current = null;
        setIsSpeechDetected(false);
        if (keepTranscribingRef.current) {
          setTimeout(createAndStartRecognition, 500);
        }
      };

      try {
        recognition.start();
        recognitionRef.current = recognition;
        setIsTranscribing(true);
      } catch (err) {
        console.error('[TRANSCRIBE] Failed to start recognition:', err);
        recognitionRef.current = null;
        if (keepTranscribingRef.current) {
          setTimeout(createAndStartRecognition, 1000);
        }
      }
    };

    createAndStartRecognition();
  }, []);

  // Patient side: auto-start/stop recognition when therapist broadcasts
  useEffect(() => {
    const u = userRef.current;
    if (!u || ['admin', 'therapist', 'staff'].includes(u.role)) return;
    if (autoTranscribeRequested) {
      startLocalTranscription('patient');
    } else {
      // Always call stop — keepTranscribingRef=false inside guards against double-stop
      void stopAndSaveTranscription();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoTranscribeRequested]);

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
      // Call immediately — PC is guaranteed initialized before joinRoom now,
      // so there is no need for an artificial delay.
      void createOffer();
      // If therapist was already transcribing when the participant joined, re-signal them to start.
      // Use keepTranscribingRef (set synchronously) not isTranscribingRef (set via React effect, async)
      if (keepTranscribingRef.current && userRef.current && ['admin', 'therapist', 'staff'].includes(userRef.current.role)) {
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

    // start-transcription: therapist broadcast → patients auto-start their mic
    webSocketService.on('start-transcription', () => {
      const u = userRef.current;
      if (u && ['admin', 'therapist', 'staff'].includes(u.role)) return;
      setAutoTranscribeRequested(true);
    });

    // stop-transcription: therapist stopped → patients save and stop
    webSocketService.on('stop-transcription', () => {
      setAutoTranscribeRequested(false);
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
  }, [roomId, sessionId, user, showSuccess, showError, createOffer, handleOffer, handleAnswer, addIceCandidate, closePeerConnection]);

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
    stopLocalMedia();
    closePeerConnection();
    webSocketService.disconnect();
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  }, [stopLocalMedia, closePeerConnection]);

  const endSession = async () => {
    // Signal all other participants to stop transcribing and save their side
    if (user && ['admin', 'therapist', 'staff'].includes(user.role) && isTranscribing) {
      webSocketService.sendMessage({ type: 'stop-transcription', sessionId: sessionIdRef.current ?? '', timestamp: new Date() });
    }
    // Save our own side
    await stopAndSaveTranscription();
    cleanupSession();
    showSuccess('Session ended');
    navigate('/telehealth/dashboard');
  };

  const toggleRecording = async () => {
    if (!sessionId) return;
    try {
      if (!isRecording) {
        if (localStream) {
          const mediaRecorder = new MediaRecorder(localStream);
          const chunks: BlobPart[] = [];
          
          mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data);
          };
          
          mediaRecorder.onstop = async () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            const blobUrl = URL.createObjectURL(blob);
            try {
              await apiClient.post('/api/telehealth/recordings', {
                sessionId,
                fileUrl: blobUrl,
                fileSize: blob.size,
                storageProvider: 'local',
              });
              showSuccess('Recording saved successfully');
            } catch (error) {
              console.error('Failed to save recording:', error);
              showError('Failed to save recording');
            }
          };
          
          mediaRecorder.start(1000);
          mediaRecorderRef.current = mediaRecorder;
          setIsRecording(true);
          showSuccess('Recording started');
        }
      } else {
        if (mediaRecorderRef.current) {
          mediaRecorderRef.current.stop();
          mediaRecorderRef.current = null;
        }
        setIsRecording(false);
        showSuccess('Recording stopped');
      }
    } catch (error) {
      console.error('Recording error:', error);
      showError('Failed to toggle recording');
    }
  };

  const startTranscription = async () => {
    if (!sessionId) return;
    try {
      if (!(window.SpeechRecognition || window.webkitSpeechRecognition)) {
        showError('Speech recognition not supported in this browser');
        return;
      }
      const speakerRole: 'therapist' | 'patient' = user?.role === 'client' ? 'patient' : 'therapist';
      startLocalTranscription(speakerRole);
      webSocketService.sendMessage({ type: 'start-transcription', sessionId: sessionIdRef.current ?? '', timestamp: new Date() });
    } catch (error) {
      console.error('Transcription error:', error);
      showError('Failed to start transcription');
    }
  };

  const stopTranscription = async () => {
    if (!sessionId) return;
    try {
      webSocketService.sendMessage({ type: 'stop-transcription', sessionId: sessionIdRef.current ?? '', timestamp: new Date() });
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
      <Box sx={{ height: '100dvh', minHeight: '-webkit-fill-available', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#1a1a1a', overflow: 'hidden' }}>
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
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100dvh',
        minHeight: '-webkit-fill-available',
        overflow: 'hidden',
        bgcolor: '#050505',
        color: 'white',
        touchAction: 'manipulation',
      }}
    >
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          position: 'absolute',
          top: { xs: 6, sm: 12 },
          left: { xs: 6, sm: 12 },
          right: { xs: 6, sm: 12 },
          zIndex: 10,
          p: { xs: 1, sm: 1.5 },
          bgcolor: 'rgba(0, 0, 0, 0.58)',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderRadius: 2,
          backdropFilter: 'blur(12px)',
          pointerEvents: 'auto',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, overflow: 'hidden', flex: 1 }}>
          <Box sx={{ flexShrink: 1, minWidth: 0 }}>
            <Typography variant="h6" noWrap sx={{ fontSize: { xs: '0.85rem', sm: '1.1rem' } }}>{sessionData?.title || 'Telehealth Session'}</Typography>
            {user && ['admin', 'therapist', 'staff'].includes(user.role) && sessionData?.patient_details && (
              <Typography variant="caption" noWrap sx={{ opacity: 0.8, display: 'block' }}>
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
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          gridTemplateColumns: hasRemoteVideo ? { xs: '1fr', sm: '1fr 1fr' } : '1fr',
          gridTemplateRows: hasRemoteVideo ? { xs: '1fr 1fr', sm: '1fr' } : '1fr',
          gap: 0,
          overflow: 'hidden',
          ...(hasRemoteVideo
            ? {
                '@media (max-width: 639px) and (orientation: landscape)': {
                  gridTemplateColumns: '1fr 1fr',
                  gridTemplateRows: '1fr',
                },
                '@media (min-width: 640px) and (max-width: 1024px) and (orientation: portrait)': {
                  gridTemplateColumns: '1fr',
                  gridTemplateRows: '1fr 1fr',
                },
              }
            : {}),
        }}
      >
        {hasRemoteVideo && (
          <Box ref={remoteContainerRef} sx={{ position: 'relative', overflow: 'hidden', minWidth: 0, minHeight: 0, bgcolor: '#000' }}>
            <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: videoFitMode, backgroundColor: '#000' }} />
            {isRemotePlaybackBlocked && (
              <Box sx={{ position: 'absolute', bottom: { xs: 92, sm: 104 }, left: '50%', transform: 'translateX(-50%)', zIndex: 4 }}>
                <Button variant="contained" onClick={() => remoteVideoRef.current?.play()}>Tap to start video</Button>
              </Box>
            )}
          </Box>
        )}

        <Box sx={{ position: 'relative', overflow: 'hidden', minWidth: 0, minHeight: 0, bgcolor: '#000' }}>
          <video ref={localVideoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: videoFitMode, transform: 'scaleX(-1)', backgroundColor: '#000' }} />
          {!hasRemoteVideo && (
            <Box sx={{ position: 'absolute', inset: 0, px: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'white', bgcolor: 'linear-gradient(180deg, rgba(0,0,0,0.22), rgba(0,0,0,0.62))', pointerEvents: 'none' }}>
              <Box sx={{ maxWidth: 520, mt: { xs: 8, sm: 10 } }}>
                <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' }, textShadow: '0 1px 12px rgba(0,0,0,0.75)' }}>
                  {participantCount > 1
                    ? `Establishing connection with ${participantName || 'participant'}...`
                    : 'Waiting for other participant to join...'}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, opacity: 0.82, textShadow: '0 1px 10px rgba(0,0,0,0.75)' }}>
                  {participantCount > 1
                    ? 'Setting up video and audio...'
                    : 'Share the session link or wait for them to connect'}
                </Typography>
              </Box>
            </Box>
          )}
          {!isCameraOn && (
            <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(0,0,0,0.82)', color: 'white', width: '100%', height: '100%' }}>
              <VideocamOff sx={{ fontSize: 48 }} />
            </Box>
          )}
          <Chip
            size="small"
            label="You"
            sx={{ position: 'absolute', left: { xs: 10, sm: 14 }, bottom: { xs: 82, sm: 96 }, bgcolor: 'rgba(0,0,0,0.62)', color: 'white', backdropFilter: 'blur(8px)' }}
          />
        </Box>
      </Box>

      {/* Controls */}
      <Paper
        elevation={0}
        sx={{
          position: 'absolute',
          left: '50%',
          bottom: { xs: 10, sm: 18 },
          transform: 'translateX(-50%)',
          zIndex: 11,
          px: { xs: 1, sm: 1.5 },
          py: 1,
          maxWidth: 'calc(100vw - 16px)',
          bgcolor: 'rgba(0, 0, 0, 0.62)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: { xs: 0.75, sm: 1.25 },
          flexWrap: 'nowrap',
          overflowX: 'auto',
          borderRadius: 999,
          backdropFilter: 'blur(14px)',
        }}
      >
        <IconButton onClick={toggleMicrophone} sx={{ width: 44, height: 44, bgcolor: isMicOn ? 'rgba(255,255,255,0.14)' : 'error.main', color: 'white', flex: '0 0 auto' }}>
          {isMicOn ? <Mic /> : <MicOff />}
        </IconButton>
        <IconButton onClick={toggleCamera} sx={{ width: 44, height: 44, bgcolor: isCameraOn ? 'rgba(255,255,255,0.14)' : 'error.main', color: 'white', flex: '0 0 auto' }}>
          {isCameraOn ? <Videocam /> : <VideocamOff />}
        </IconButton>
        <IconButton
          onClick={() => setVideoFitMode((mode) => mode === 'cover' ? 'contain' : 'cover')}
          sx={{ width: 44, height: 44, bgcolor: videoFitMode === 'contain' ? 'primary.main' : 'rgba(255,255,255,0.14)', color: 'white', flex: '0 0 auto' }}
          aria-label={videoFitMode === 'cover' ? 'Show full camera frame' : 'Fill camera frame'}
        >
          <AspectRatio />
        </IconButton>
        
        {user && ['admin', 'therapist', 'staff'].includes(user.role) && (
          <>
            <IconButton onClick={toggleRecording} sx={{ width: 44, height: 44, bgcolor: isRecording ? 'error.main' : 'rgba(255,255,255,0.14)', color: 'white', flex: '0 0 auto' }}>
              {isRecording ? <StopCircle /> : <FiberManualRecord />}
            </IconButton>
            <IconButton onClick={() => setShowTranscript(prev => !prev)} sx={{ width: 44, height: 44, bgcolor: showTranscript ? 'primary.main' : isTranscribing ? 'primary.dark' : 'rgba(255,255,255,0.14)', color: 'white', flex: '0 0 auto' }}>
              <Transcribe />
            </IconButton>
          </>
        )}

        <IconButton onClick={() => setShowEndDialog(true)} sx={{ width: 48, height: 48, bgcolor: 'error.main', color: 'white', flex: '0 0 auto' }}>
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
      
      {/* Floating sidebar toggle tab — visible to staff/therapist/admin only */}
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

      {/* Transcript Drawer — visible to staff/therapist/admin only */}
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
        <Box sx={{ flex: 1, overflow: 'auto', mb: 2 }}>
          {isTranscribing && isSpeechDetected && <Typography variant="caption" color="success.main">Listening...</Typography>}
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
            disabled={isTranscribing}
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
