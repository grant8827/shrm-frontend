import React, { useState, useEffect, useRef } from 'react';
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
} from '@mui/material';
import {
  Videocam,
  VideocamOff,
  Mic,
  MicOff,
  CallEnd,
  FiberManualRecord,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext';
import { apiClient } from '../../services/apiClient';

const VideoSession: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  // Video refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const websocketRef = useRef<WebSocket | null>(null);

  // Session state
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isRemoteVideoReady, setIsRemoteVideoReady] = useState(false);

  // Media controls
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);

  // Dialogs
  const [showEndDialog, setShowEndDialog] = useState(false);

  // ICE servers configuration
  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  // Fetch session details and get room_id
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await apiClient.get(`/telehealth/sessions/${sessionId}/`);
        const session = response.data;
        setRoomId(session.room_id);
        console.log('[VIDEO] Session loaded:', session);
      } catch (error) {
        console.error('[VIDEO] Error fetching session:', error);
        showError('Failed to load session');
      }
    };

    if (sessionId) {
      fetchSession();
    }
  }, [sessionId]);

  // Initialize session when room_id is available
  useEffect(() => {
    if (roomId) {
      startSession();
    }
    return () => {
      cleanupSession();
    };
  }, [roomId]);

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

  const startSession = async () => {
    try {
      console.log('[VIDEO] Starting session with room_id:', roomId);
      
      // Request media permissions
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      console.log('[VIDEO] Local stream obtained');
      
      // Initialize WebRTC peer connection
      initializePeerConnection();
      
      // Connect to WebSocket signaling server
      connectWebSocket();
      
      setSessionStartTime(new Date());
      showSuccess('Connected to session');
      
    } catch (error) {
      showError('Failed to access camera/microphone');
      console.error('[VIDEO] Media error:', error);
    }
  };

  const initializePeerConnection = () => {
    console.log('[VIDEO] Initializing peer connection');
    
    const peerConnection = new RTCPeerConnection(iceServers);
    peerConnectionRef.current = peerConnection;
    
    // Add local stream tracks to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStreamRef.current!);
        console.log('[VIDEO] Added track to peer connection:', track.kind);
      });
    }
    
    // Handle incoming tracks from remote peer
    peerConnection.ontrack = (event) => {
      console.log('[VIDEO] Received remote track:', event.track.kind);
      if (!remoteStreamRef.current) {
        remoteStreamRef.current = new MediaStream();
      }
      remoteStreamRef.current.addTrack(event.track);
      
      if (remoteVideoRef.current && remoteVideoRef.current.srcObject !== remoteStreamRef.current) {
        remoteVideoRef.current.srcObject = remoteStreamRef.current;
        setIsRemoteVideoReady(true);
        console.log('[VIDEO] Remote video stream set');
      }
    };
    
    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && websocketRef.current) {
        console.log('[VIDEO] Sending ICE candidate');
        websocketRef.current.send(JSON.stringify({
          type: 'ice_candidate',
          candidate: event.candidate,
        }));
      }
    };
    
    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log('[VIDEO] Connection state:', peerConnection.connectionState);
      if (peerConnection.connectionState === 'connected') {
        showSuccess('Connected to other participant');
      } else if (peerConnection.connectionState === 'disconnected') {
        showError('Participant disconnected');
      }
    };
  };

  const connectWebSocket = () => {
    if (!roomId) {
      console.error('[VIDEO] No room_id available');
      return;
    }
    
    // Determine WebSocket URL based on environment
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = import.meta.env.VITE_WS_HOST || window.location.host.replace(':5173', ':8000');
    const wsUrl = `${protocol}//${wsHost}/ws/video/${roomId}/`;
    
    console.log('[VIDEO] Connecting to WebSocket:', wsUrl);
    
    const ws = new WebSocket(wsUrl);
    websocketRef.current = ws;
    
    ws.onopen = () => {
      console.log('[VIDEO] WebSocket connected');
      // Check if we're the first or second participant
      // This will be determined by participant_joined messages
    };
    
    ws.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      console.log('[VIDEO] WebSocket message:', data.type, data);
      
      switch (data.type) {
        case 'participant_joined':
          console.log('[VIDEO] Participant joined - I am the initiator, creating offer');
          // Only create offer if we're already connected (not the first person)
          // The first person will receive this message about themselves and should ignore it
          if (peerConnectionRef.current && peerConnectionRef.current.signalingState === 'stable') {
            await createOffer();
          }
          break;
          
        case 'offer':
          console.log('[VIDEO] Received offer - I am the responder');
          await handleOffer(data.offer);
          break;
          
        case 'answer':
          console.log('[VIDEO] Received answer');
          await handleAnswer(data.answer);
          break;
          
        case 'ice_candidate':
          console.log('[VIDEO] Received ICE candidate');
          await handleIceCandidate(data.candidate);
          break;
          
        case 'participant_left':
          console.log('[VIDEO] Participant left');
          setIsRemoteVideoReady(false);
          break;
      }
    };
    
    ws.onerror = (error) => {
      console.error('[VIDEO] WebSocket error:', error);
      showError('Connection error');
    };
    
    ws.onclose = () => {
      console.log('[VIDEO] WebSocket closed');
    };
  };

  const createOffer = async () => {
    if (!peerConnectionRef.current || !websocketRef.current) return;
    
    try {
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      
      console.log('[VIDEO] Sending offer');
      websocketRef.current.send(JSON.stringify({
        type: 'offer',
        offer: offer,
      }));
    } catch (error) {
      console.error('[VIDEO] Error creating offer:', error);
    }
  };

  const handleOffer = async (offer: RTCSessionDescriptionInit) => {
    if (!peerConnectionRef.current || !websocketRef.current) return;
    
    try {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      
      console.log('[VIDEO] Sending answer');
      websocketRef.current.send(JSON.stringify({
        type: 'answer',
        answer: answer,
      }));
    } catch (error) {
      console.error('[VIDEO] Error handling offer:', error);
    }
  };

  const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
    if (!peerConnectionRef.current) return;
    
    try {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      console.log('[VIDEO] Answer applied');
    } catch (error) {
      console.error('[VIDEO] Error handling answer:', error);
    }
  };

  const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
    if (!peerConnectionRef.current) return;
    
    try {
      await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      console.log('[VIDEO] ICE candidate added');
    } catch (error) {
      console.error('[VIDEO] Error adding ICE candidate:', error);
    }
  };

  const cleanupSession = () => {
    console.log('[VIDEO] Cleaning up session');
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    
    if (websocketRef.current) {
      websocketRef.current.close();
    }
  };

  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOn(videoTrack.enabled);
      }
    }
  };

  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    }
  };

  const endSession = () => {
    cleanupSession();
    showSuccess('Session ended');
    navigate('/telehealth/dashboard');
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#1a1a1a' }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          bgcolor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6">Emergency Telehealth Session</Typography>
          <Chip
            label={formatDuration(sessionDuration)}
            color="error"
            size="small"
            icon={<FiberManualRecord />}
          />
          {isRemoteVideoReady && (
            <Chip label="Connected" color="success" size="small" />
          )}
        </Box>
      </Paper>

      {/* Main Video Area */}
      <Box sx={{ flex: 1, position: 'relative', bgcolor: '#000', display: 'flex' }}>
        {/* Remote Video (Main) */}
        <Box sx={{ flex: 1, position: 'relative' }}>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              backgroundColor: '#000',
            }}
          />
          
          {!isRemoteVideoReady && (
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                color: 'white',
              }}
            >
              <Typography variant="h6">Waiting for other participant...</Typography>
            </Box>
          )}
          
          {/* Local Video (Picture-in-Picture) */}
          <Paper
            elevation={4}
            sx={{
              position: 'absolute',
              bottom: 20,
              right: 20,
              width: 240,
              height: 180,
              overflow: 'hidden',
              bgcolor: '#000',
            }}
          >
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'scaleX(-1)',
              }}
            />
            {!isCameraOn && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'rgba(0,0,0,0.8)',
                  color: 'white',
                }}
              >
                <VideocamOff />
              </Box>
            )}
          </Paper>
        </Box>
      </Box>

      {/* Controls */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          bgcolor: 'rgba(0, 0, 0, 0.9)',
          display: 'flex',
          justifyContent: 'center',
          gap: 2,
        }}
      >
        <IconButton
          onClick={toggleMic}
          sx={{
            bgcolor: isMicOn ? 'rgba(255,255,255,0.1)' : 'error.main',
            color: 'white',
            '&:hover': {
              bgcolor: isMicOn ? 'rgba(255,255,255,0.2)' : 'error.dark',
            },
          }}
        >
          {isMicOn ? <Mic /> : <MicOff />}
        </IconButton>

        <IconButton
          onClick={toggleCamera}
          sx={{
            bgcolor: isCameraOn ? 'rgba(255,255,255,0.1)' : 'error.main',
            color: 'white',
            '&:hover': {
              bgcolor: isCameraOn ? 'rgba(255,255,255,0.2)' : 'error.dark',
            },
          }}
        >
          {isCameraOn ? <Videocam /> : <VideocamOff />}
        </IconButton>

        <IconButton
          onClick={() => setShowEndDialog(true)}
          sx={{
            bgcolor: 'error.main',
            color: 'white',
            '&:hover': {
              bgcolor: 'error.dark',
            },
          }}
        >
          <CallEnd />
        </IconButton>
      </Paper>

      {/* End Session Dialog */}
      <Dialog open={showEndDialog} onClose={() => setShowEndDialog(false)}>
        <DialogTitle>End Session</DialogTitle>
        <DialogContent>
          <Alert severity="warning">
            Are you sure you want to end this session? This action cannot be undone.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEndDialog(false)}>Cancel</Button>
          <Button onClick={endSession} color="error" variant="contained">
            End Session
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VideoSession;
