import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Tab,
  Tabs,
  Alert,
  CircularProgress,
  Tooltip,
  Paper,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  VideoCall,
  Add,
  Schedule,
  People,
  History,
  PlayArrow,
  Edit,
  Delete,
  ContentCopy,
  AccessTime,
  CalendarMonth,
  Person,
  EventAvailable,
  Pending,
  CheckCircle,
  Cancel,
  Transcribe,
  RecordVoiceOver,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { format, parseISO } from 'date-fns';

interface TelehealthSession {
  id: string;
  title: string;
  patient: {
    id: string;
    name: string;
    avatar?: string;
  };
  therapist: {
    id: string;
    name: string;
  };
  scheduledAt: string;
  duration: number;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  sessionUrl?: string;
  hasRecording: boolean;
  hasTranscript: boolean;
  notes?: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const TelehealthDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useAuth();
  const { showSuccess, showError } = useNotification();
  const user = state.user;

  const [tabValue, setTabValue] = useState(0);
  const [sessions, setSessions] = useState<TelehealthSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [openNewSessionDialog, setOpenNewSessionDialog] = useState(false);

  // New session form state
  const [newSession, setNewSession] = useState({
    title: '',
    patientId: '',
    scheduledAt: '',
    duration: 30,
    notes: '',
  });

  // Mock data - replace with actual API calls
  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call to /api/telehealth/sessions/
      // const response = await apiClient.get('/telehealth/sessions/');
      // setSessions(response.data);
      setSessions([]);
    } catch (error) {
      showError('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async () => {
    try {
      // Validate form
      if (!newSession.title || !newSession.patientId || !newSession.scheduledAt) {
        showError('Please fill in all required fields');
        return;
      }

      // Mock API call - replace with actual implementation
      const session: TelehealthSession = {
        id: Math.random().toString(36).substr(2, 9),
        title: newSession.title,
        patient: { id: newSession.patientId, name: 'Selected Patient' },
        therapist: { id: user?.id || '', name: user?.username || '' },
        scheduledAt: newSession.scheduledAt,
        duration: newSession.duration,
        status: 'scheduled',
        hasRecording: false,
        hasTranscript: false,
        notes: newSession.notes,
      };

      setSessions([...sessions, session]);
      showSuccess('Session created successfully');
      setOpenNewSessionDialog(false);
      resetNewSessionForm();
    } catch (error) {
      showError('Failed to create session');
    }
  };

  const resetNewSessionForm = () => {
    setNewSession({
      title: '',
      patientId: '',
      scheduledAt: '',
      duration: 30,
      notes: '',
    });
  };

  const handleJoinSession = (sessionId: string) => {
    navigate(`/telehealth/session/${sessionId}`);
  };

  const handleCopySessionLink = (session: TelehealthSession) => {
    const link = `${window.location.origin}${session.sessionUrl}`;
    navigator.clipboard.writeText(link);
    showSuccess('Session link copied to clipboard');
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      // Mock API call
      setSessions(sessions.filter(s => s.id !== sessionId));
      showSuccess('Session deleted successfully');
    } catch (error) {
      showError('Failed to delete session');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'info';
      case 'in-progress': return 'success';
      case 'completed': return 'default';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return <Pending />;
      case 'in-progress': return <PlayArrow />;
      case 'completed': return <CheckCircle />;
      case 'cancelled': return <Cancel />;
      default: return null;
    }
  };

  const filterSessions = (status?: string) => {
    if (!status) return sessions;
    return sessions.filter(s => s.status === status);
  };

  const upcomingSessions = filterSessions('scheduled');
  const completedSessions = filterSessions('completed');

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Telehealth Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage video sessions, recordings, and transcripts
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenNewSessionDialog(true)}
          size="large"
        >
          New Session
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <EventAvailable color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">{upcomingSessions.length}</Typography>
              </Box>
              <Typography color="text.secondary" variant="body2">
                Upcoming Sessions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CheckCircle color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">{completedSessions.length}</Typography>
              </Box>
              <Typography color="text.secondary" variant="body2">
                Completed Sessions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Transcribe color="info" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  {sessions.filter(s => s.hasTranscript).length}
                </Typography>
              </Box>
              <Typography color="text.secondary" variant="body2">
                Transcripts Available
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <RecordVoiceOver color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  {sessions.filter(s => s.hasRecording).length}
                </Typography>
              </Box>
              <Typography color="text.secondary" variant="body2">
                Recordings Saved
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(_e, v) => setTabValue(v)}>
          <Tab icon={<Schedule />} label="Upcoming" iconPosition="start" />
          <Tab icon={<History />} label="Past Sessions" iconPosition="start" />
          <Tab icon={<People />} label="All Sessions" iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Tab Panels */}
      <TabPanel value={tabValue} index={0}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : upcomingSessions.length === 0 ? (
          <Alert severity="info">No upcoming sessions scheduled</Alert>
        ) : (
          <Grid container spacing={3}>
            {upcomingSessions.map((session) => (
              <Grid item xs={12} md={6} lg={4} key={session.id}>
                <Card elevation={2}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6" noWrap>
                        {session.title}
                      </Typography>
                      <Chip
                        icon={getStatusIcon(session.status) || undefined}
                        label={session.status}
                        color={getStatusColor(session.status) as any}
                        size="small"
                      />
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Person fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">{session.patient.name}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <CalendarMonth fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {format(parseISO(session.scheduledAt), 'PPp')}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AccessTime fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">{session.duration} minutes</Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {session.hasRecording && (
                        <Chip label="Recording" size="small" color="success" variant="outlined" />
                      )}
                      {session.hasTranscript && (
                        <Chip label="Transcript" size="small" color="info" variant="outlined" />
                      )}
                    </Box>
                  </CardContent>

                  <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                    <Box>
                      <Tooltip title="Copy session link">
                        <IconButton size="small" onClick={() => handleCopySessionLink(session)}>
                          <ContentCopy fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit session">
                        <IconButton size="small">
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete session">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteSession(session.id)}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <Button
                      variant="contained"
                      startIcon={<VideoCall />}
                      onClick={() => handleJoinSession(session.id)}
                      size="small"
                    >
                      Join
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {completedSessions.length === 0 ? (
          <Alert severity="info">No completed sessions</Alert>
        ) : (
          <Grid container spacing={3}>
            {completedSessions.map((session) => (
              <Grid item xs={12} md={6} lg={4} key={session.id}>
                <Card elevation={2}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6" noWrap>
                        {session.title}
                      </Typography>
                      <Chip
                        icon={<CheckCircle />}
                        label="Completed"
                        color="success"
                        size="small"
                      />
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Person fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">{session.patient.name}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <CalendarMonth fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {format(parseISO(session.scheduledAt), 'PPp')}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AccessTime fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">{session.duration} minutes</Typography>
                      </Box>
                    </Box>

                    {session.notes && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {session.notes}
                      </Typography>
                    )}

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {session.hasRecording && (
                        <Chip label="Recording Available" size="small" color="success" />
                      )}
                      {session.hasTranscript && (
                        <Chip label="Transcript Available" size="small" color="info" />
                      )}
                    </Box>
                  </CardContent>

                  <CardActions sx={{ px: 2, pb: 2 }}>
                    <Button size="small" startIcon={<PlayArrow />}>
                      View Recording
                    </Button>
                    <Button size="small" startIcon={<Transcribe />}>
                      View Transcript
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <List>
          {sessions.map((session, index) => (
            <React.Fragment key={session.id}>
              <ListItem
                secondaryAction={
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<VideoCall />}
                      onClick={() => handleJoinSession(session.id)}
                    >
                      {session.status === 'completed' ? 'View' : 'Join'}
                    </Button>
                  </Box>
                }
              >
                <ListItemAvatar>
                  <Avatar>
                    <VideoCall />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {session.title}
                      <Chip
                        label={session.status}
                        size="small"
                        color={getStatusColor(session.status) as any}
                      />
                    </Box>
                  }
                  secondary={
                    <>
                      {session.patient.name} •{' '}
                      {format(parseISO(session.scheduledAt), 'PPp')} •{' '}
                      {session.duration} min
                    </>
                  }
                />
              </ListItem>
              {index < sessions.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </TabPanel>

      {/* New Session Dialog */}
      <Dialog
        open={openNewSessionDialog}
        onClose={() => setOpenNewSessionDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Schedule New Telehealth Session</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Session Title"
              value={newSession.title}
              onChange={(e) => setNewSession({ ...newSession, title: e.target.value })}
              fullWidth
              required
            />

            <FormControl fullWidth required>
              <InputLabel>Patient</InputLabel>
              <Select
                value={newSession.patientId}
                onChange={(e) => setNewSession({ ...newSession, patientId: e.target.value })}
                label="Patient"
              >
                <MenuItem value="1">John Doe</MenuItem>
                <MenuItem value="2">Jane Smith</MenuItem>
                <MenuItem value="3">Alice Johnson</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Scheduled Date & Time"
              type="datetime-local"
              value={newSession.scheduledAt}
              onChange={(e) => setNewSession({ ...newSession, scheduledAt: e.target.value })}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
            />

            <FormControl fullWidth>
              <InputLabel>Duration (minutes)</InputLabel>
              <Select
                value={newSession.duration}
                onChange={(e) => setNewSession({ ...newSession, duration: Number(e.target.value) })}
                label="Duration (minutes)"
              >
                <MenuItem value={15}>15 minutes</MenuItem>
                <MenuItem value={30}>30 minutes</MenuItem>
                <MenuItem value={45}>45 minutes</MenuItem>
                <MenuItem value={50}>50 minutes</MenuItem>
                <MenuItem value={60}>60 minutes</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Session Notes (Optional)"
              value={newSession.notes}
              onChange={(e) => setNewSession({ ...newSession, notes: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNewSessionDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateSession}>
            Create Session
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TelehealthDashboard;
