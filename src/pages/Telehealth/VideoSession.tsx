import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  IconButton,
  Button,
  Typography,
  Chip,
  List,
  ListItem,
  ListItemText,
  TextField,
  Badge,
  Avatar,
  Switch,
  FormControlLabel,
  Grid,
  Card,
  CardContent,
  Alert,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
} from '@mui/material';
import {
  Videocam,
  VideocamOff,
  Mic,
  MicOff,
  ScreenShare,
  StopScreenShare,
  CallEnd,
  Chat,
  ClosedCaption,
  FiberManualRecord,
  Stop,
  Send,
  People,
  Settings,
  Download
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

interface Participant {
  id: string;
  name: string;
  role: 'therapist' | 'patient';
  avatar?: string;
  isMuted: boolean;
  isVideoOff: boolean;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: Date;
}

interface TranscriptEntry {
  id: string;
  speaker: string;
  text: string;
  timestamp: Date;
  confidence: number;
}

const VideoSession: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { state } = useAuth();
  const { showSuccess, showError, showInfo } = useNotification();
  const user = state.user;

  // Video refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Session state
  const [, setIsConnected] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);

  // Media controls
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [, setIsFullscreen] = useState(false);
  const [, setVolume] = useState(100);

  // Features
  const [showChat, setShowChat] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [autoTranscribe, setAutoTranscribe] = useState(true);

  // Data
  const [participants] = useState<Participant[]>([
    {
      id: '1',
      name: 'Dr. Sarah Smith',
      role: 'therapist',
      isMuted: false,
      isVideoOff: false,
    },
    {
      id: '2',
      name: 'John Doe',
      role: 'patient',
      isMuted: false,
      isVideoOff: false,
    },
  ]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);

  // Dialogs
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [, setShowSettingsDialog] = useState(false);

  // Initialize session
  useEffect(() => {
    startSession();
    return () => {
      cleanupSession();
    };
  }, []);

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

  // Simulated transcript updates
  useEffect(() => {
    if (isTranscribing && autoTranscribe) {
      const interval = setInterval(() => {
        const speakers = ['Dr. Sarah Smith', 'John Doe'];
        const sampleTexts = [
          "How have you been feeling this week?",
          "I've been feeling much better, thank you.",
          "That's great to hear. Let's discuss your progress.",
          "I've been practicing the techniques we talked about.",
          "Excellent. Can you tell me more about that?",
        ];
        
        const newEntry: TranscriptEntry = {
          id: Math.random().toString(36).substr(2, 9),
          speaker: speakers[Math.floor(Math.random() * speakers.length)],
          text: sampleTexts[Math.floor(Math.random() * sampleTexts.length)],
          timestamp: new Date(),
          confidence: 0.85 + Math.random() * 0.15,
        };
        
        setTranscript(prev => [...prev, newEntry]);
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [isTranscribing, autoTranscribe]);

  const startSession = async () => {
    try {
      // Request media permissions
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      setIsConnected(true);
      setSessionStartTime(new Date());
      showSuccess('Connected to session');
      
      // Auto-start transcription if enabled
      if (autoTranscribe) {
        setIsTranscribing(true);
      }
    } catch (error) {
      showError('Failed to access camera/microphone');
      console.error('Media error:', error);
    }
  };

  const cleanupSession = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
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

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        setIsScreenSharing(true);
        showInfo('Screen sharing started');
        
        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          showInfo('Screen sharing stopped');
        };
      } catch (error) {
        showError('Failed to share screen');
      }
    } else {
      setIsScreenSharing(false);
    }
  };

  const toggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      showSuccess('Recording started');
    } else {
      setIsRecording(false);
      showSuccess('Recording stopped and saved');
    }
  };

  const toggleTranscription = () => {
    setIsTranscribing(!isTranscribing);
    if (!isTranscribing) {
      showSuccess('Transcription started');
    } else {
      showInfo('Transcription paused');
    }
  };

  const sendMessage = () => {
    if (newMessage.trim()) {
      const message: ChatMessage = {
        id: Math.random().toString(36).substr(2, 9),
        senderId: user?.id || '',
        senderName: user?.email?.split('@')[0] || 'Me',
        message: newMessage,
        timestamp: new Date(),
      };
      setChatMessages([...chatMessages, message]);
      setNewMessage('');
    }
  };

  const endSession = () => {
    cleanupSession();
    showSuccess('Session ended');
    navigate('/telehealth/dashboard');
  };

  const downloadTranscript = () => {
    const content = transcript
      .map(entry => `[${entry.timestamp.toLocaleTimeString()}] ${entry.speaker}: ${entry.text}`)
      .join('\n\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${sessionId}-${new Date().toISOString()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showSuccess('Transcript downloaded');
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
          <Typography variant="h6">Telehealth Session</Typography>
          <Chip
            label={formatDuration(sessionDuration)}
            color="error"
            size="small"
            icon={isRecording ? <FiberManualRecord /> : undefined}
          />
          {isRecording && (
            <Chip label="Recording" color="error" size="small" />
          )}
          {isTranscribing && (
            <Chip label="Transcribing" color="success" size="small" />
          )}
        </Box>
        <Box>
          <IconButton color="inherit" onClick={() => setShowSettingsDialog(true)}>
            <Settings />
          </IconButton>
        </Box>
      </Paper>

      {/* Main Video Area */}
      <Box sx={{ flex: 1, position: 'relative', bgcolor: '#000' }}>
        <Grid container sx={{ height: '100%' }}>
          {/* Remote Video (Main) */}
          <Grid item xs={12} md={showChat || showTranscript ? 9 : 12}>
            <Box sx={{ height: '100%', position: 'relative' }}>
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
                    }}
                  >
                    <Avatar sx={{ width: 80, height: 80 }}>
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </Avatar>
                  </Box>
                )}
              </Paper>

              {/* Session Info Overlay */}
              <Paper
                elevation={2}
                sx={{
                  position: 'absolute',
                  top: 20,
                  left: 20,
                  p: 2,
                  bgcolor: 'rgba(0, 0, 0, 0.7)',
                  color: 'white',
                }}
              >
                <Typography variant="subtitle2">Participants: {participants.length}</Typography>
              </Paper>
            </Box>
          </Grid>

          {/* Side Panel (Chat or Transcript) */}
          {(showChat || showTranscript) && (
            <Grid item xs={12} md={3}>
              <Paper
                elevation={0}
                sx={{
                  height: '100%',
                  bgcolor: '#f5f5f5',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {showChat && (
                  <>
                    <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                      <Typography variant="h6">Chat</Typography>
                    </Box>
                    <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                      <List>
                        {chatMessages.map((msg) => (
                          <ListItem key={msg.id} sx={{ px: 0 }}>
                            <ListItemText
                              primary={msg.senderName}
                              secondary={
                                <>
                                  <Typography variant="body2">{msg.message}</Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {msg.timestamp.toLocaleTimeString()}
                                  </Typography>
                                </>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                    <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                          fullWidth
                          size="small"
                          placeholder="Type a message..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        />
                        <IconButton color="primary" onClick={sendMessage}>
                          <Send />
                        </IconButton>
                      </Box>
                    </Box>
                  </>
                )}

                {showTranscript && (
                  <>
                    <Box
                      sx={{
                        p: 2,
                        borderBottom: 1,
                        borderColor: 'divider',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography variant="h6">Live Transcript</Typography>
                      <IconButton size="small" onClick={downloadTranscript}>
                        <Download />
                      </IconButton>
                    </Box>
                    <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                      {transcript.length === 0 ? (
                        <Alert severity="info">
                          {isTranscribing
                            ? 'Waiting for speech...'
                            : 'Start transcription to see live captions'}
                        </Alert>
                      ) : (
                        <List>
                          {transcript.map((entry) => (
                            <ListItem key={entry.id} sx={{ px: 0, alignItems: 'flex-start' }}>
                              <ListItemText
                                primary={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="subtitle2" color="primary">
                                      {entry.speaker}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {entry.timestamp.toLocaleTimeString()}
                                    </Typography>
                                  </Box>
                                }
                                secondary={
                                  <>
                                    <Typography variant="body2">{entry.text}</Typography>
                                    <LinearProgress
                                      variant="determinate"
                                      value={entry.confidence * 100}
                                      sx={{ mt: 0.5, height: 2 }}
                                    />
                                  </>
                                }
                              />
                            </ListItem>
                          ))}
                        </List>
                      )}
                    </Box>
                    <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={autoTranscribe}
                            onChange={(e) => setAutoTranscribe(e.target.checked)}
                          />
                        }
                        label="Auto-transcribe"
                      />
                    </Box>
                  </>
                )}
              </Paper>
            </Grid>
          )}
        </Grid>
      </Box>

      {/* Controls Bar */}
      <Paper
        elevation={8}
        sx={{
          p: 2,
          bgcolor: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Left Controls */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title={isCameraOn ? 'Turn off camera' : 'Turn on camera'}>
              <IconButton
                onClick={toggleCamera}
                sx={{
                  bgcolor: isCameraOn ? 'transparent' : 'error.main',
                  color: 'white',
                  '&:hover': { bgcolor: isCameraOn ? 'rgba(255,255,255,0.1)' : 'error.dark' },
                }}
              >
                {isCameraOn ? <Videocam /> : <VideocamOff />}
              </IconButton>
            </Tooltip>

            <Tooltip title={isMicOn ? 'Mute microphone' : 'Unmute microphone'}>
              <IconButton
                onClick={toggleMic}
                sx={{
                  bgcolor: isMicOn ? 'transparent' : 'error.main',
                  color: 'white',
                  '&:hover': { bgcolor: isMicOn ? 'rgba(255,255,255,0.1)' : 'error.dark' },
                }}
              >
                {isMicOn ? <Mic /> : <MicOff />}
              </IconButton>
            </Tooltip>

            <Tooltip title={isScreenSharing ? 'Stop sharing' : 'Share screen'}>
              <IconButton
                onClick={toggleScreenShare}
                sx={{
                  bgcolor: isScreenSharing ? 'primary.main' : 'transparent',
                  color: 'white',
                  '&:hover': { bgcolor: isScreenSharing ? 'primary.dark' : 'rgba(255,255,255,0.1)' },
                }}
              >
                {isScreenSharing ? <StopScreenShare /> : <ScreenShare />}
              </IconButton>
            </Tooltip>
          </Box>

          {/* Center Controls */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title={isRecording ? 'Stop recording' : 'Start recording'}>
              <IconButton
                onClick={toggleRecording}
                sx={{
                  bgcolor: isRecording ? 'error.main' : 'transparent',
                  color: 'white',
                  '&:hover': { bgcolor: isRecording ? 'error.dark' : 'rgba(255,255,255,0.1)' },
                }}
              >
                {isRecording ? <Stop /> : <FiberManualRecord />}
              </IconButton>
            </Tooltip>

            <Tooltip title={isTranscribing ? 'Stop transcription' : 'Start transcription'}>
              <IconButton
                onClick={toggleTranscription}
                sx={{
                  bgcolor: isTranscribing ? 'success.main' : 'transparent',
                  color: 'white',
                  '&:hover': { bgcolor: isTranscribing ? 'success.dark' : 'rgba(255,255,255,0.1)' },
                }}
              >
                <ClosedCaption />
              </IconButton>
            </Tooltip>

            <Tooltip title="Chat">
              <IconButton
                onClick={() => {
                  setShowChat(!showChat);
                  setShowTranscript(false);
                }}
                sx={{
                  bgcolor: showChat ? 'primary.main' : 'transparent',
                  color: 'white',
                  '&:hover': { bgcolor: showChat ? 'primary.dark' : 'rgba(255,255,255,0.1)' },
                }}
              >
                <Badge badgeContent={chatMessages.length} color="error">
                  <Chat />
                </Badge>
              </IconButton>
            </Tooltip>

            <Tooltip title="Transcript">
              <IconButton
                onClick={() => {
                  setShowTranscript(!showTranscript);
                  setShowChat(false);
                }}
                sx={{
                  bgcolor: showTranscript ? 'primary.main' : 'transparent',
                  color: 'white',
                  '&:hover': { bgcolor: showTranscript ? 'primary.dark' : 'rgba(255,255,255,0.1)' },
                }}
              >
                <ClosedCaption />
              </IconButton>
            </Tooltip>

            <Tooltip title="Participants">
              <IconButton
                onClick={() => setShowParticipants(!showParticipants)}
                sx={{ color: 'white' }}
              >
                <Badge badgeContent={participants.length} color="primary">
                  <People />
                </Badge>
              </IconButton>
            </Tooltip>
          </Box>

          {/* Right Controls */}
          <Box>
            <Button
              variant="contained"
              color="error"
              startIcon={<CallEnd />}
              onClick={() => setShowEndDialog(true)}
              size="large"
            >
              End Session
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* End Session Dialog */}
      <Dialog open={showEndDialog} onClose={() => setShowEndDialog(false)}>
        <DialogTitle>End Telehealth Session?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to end this session? The recording and transcript will be saved.
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Session Duration: {formatDuration(sessionDuration)}
            </Typography>
            {isRecording && (
              <Alert severity="info" sx={{ mt: 1 }}>
                Recording will be saved automatically
              </Alert>
            )}
            {transcript.length > 0 && (
              <Alert severity="info" sx={{ mt: 1 }}>
                {transcript.length} transcript entries will be saved
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEndDialog(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={endSession}>
            End Session
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VideoSession;
