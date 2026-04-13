import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { ArrowBack, Transcribe } from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { apiClient } from '../../services/apiClient';

interface TranscriptEntry {
  speakerName: string;
  speakerRole: 'therapist' | 'patient' | 'participant';
  text: string;
  timestamp: number;
}

interface TranscriptRecord {
  id: string;
  session: string;
  session_time: string;
  session_title: string;
  patient_name: string;
  therapist_name: string;
  entries: TranscriptEntry[];
  created_at: string;
}

const getSpeakerStyle = (
  role: string
): { label: string; color: 'primary' | 'success' | 'default'; bg: string; borderColor: string } => {
  if (role === 'therapist')
    return { label: 'Therapist', color: 'primary', bg: '#e3f2fd', borderColor: '#1976d2' };
  if (role === 'client')
    return { label: 'Client', color: 'success', bg: '#e8f5e9', borderColor: '#388e3c' };
  return { label: 'Participant', color: 'default', bg: '#f5f5f5', borderColor: '#9e9e9e' };
};

const TelehealthTranscripts: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { state } = useAuth();
  const { showError } = useNotification();

  const [loading, setLoading] = useState(false);
  const [transcripts, setTranscripts] = useState<TranscriptRecord[]>([]);
  const [selectedTranscript, setSelectedTranscript] = useState<TranscriptRecord | null>(null);

  const user = state.user;

  const sessionFilter = searchParams.get('sessionId');

  useEffect(() => {
    const loadTranscripts = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get('/api/telehealth/sessions/transcripts');
        const records = Array.isArray(response.data) ? response.data : [];
        setTranscripts(records);
      } catch (error) {
        console.error('Failed to load transcripts:', error);
        showError('Failed to load transcripts');
      } finally {
        setLoading(false);
      }
    };

    loadTranscripts();
  }, []);

  const filteredTranscripts = useMemo(() => {
    if (!sessionFilter) {
      return transcripts;
    }
    return transcripts.filter((item) => String(item.session) === sessionFilter);
  }, [transcripts, sessionFilter]);

  const formatTimestamp = (ms: number): string => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!user || !['admin', 'therapist'].includes(user.role)) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Only therapists and admins can access transcripts.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Session Transcripts
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Saved telehealth conversation transcripts from your completed sessions
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/telehealth/dashboard')}
        >
          Back to Dashboard
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Patient</TableCell>
              <TableCell>Session Time</TableCell>
              <TableCell>Session Title</TableCell>
              <TableCell>Therapist/Admin</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            ) : filteredTranscripts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                  <Typography color="text.secondary">
                    No transcripts saved yet
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredTranscripts.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>{row.patient_name}</TableCell>
                  <TableCell>{format(parseISO(row.session_time), 'PPp')}</TableCell>
                  <TableCell>{row.session_title}</TableCell>
                  <TableCell>{row.therapist_name}</TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<Transcribe />}
                      onClick={() => setSelectedTranscript(row)}
                    >
                      View Conversation
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={Boolean(selectedTranscript)}
        onClose={() => setSelectedTranscript(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box>
            <Typography variant="h6">
              {selectedTranscript?.session_title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedTranscript?.patient_name} &bull; Therapist: {selectedTranscript?.therapist_name}
              {selectedTranscript?.session_time
                ? ` • ${format(parseISO(selectedTranscript.session_time), 'PPp')}`
                : ''}
            </Typography>
            <Box display="flex" gap={1} mt={0.5}>
              <Chip label="Therapist" color="primary" size="small" />
              <Typography variant="caption" sx={{ lineHeight: '22px' }}>= Therapist speech</Typography>
              <Chip label="Patient" color="success" size="small" sx={{ ml: 1 }} />
              <Typography variant="caption" sx={{ lineHeight: '22px' }}>= Patient speech</Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedTranscript && selectedTranscript.entries.length > 0 ? (
            <Box>
              {selectedTranscript.entries.map((entry, i) => {
                const style = getSpeakerStyle(entry.speakerRole);
                return (
                  <Box
                    key={i}
                    sx={{
                      mb: 1.5,
                      p: 1.5,
                      borderRadius: 2,
                      backgroundColor: style.bg,
                      borderLeft: 4,
                      borderColor: style.borderColor,
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                      <Chip
                        label={style.label}
                        size="small"
                        color={style.color}
                        sx={{ fontWeight: 700, minWidth: 80 }}
                      />
                      <Typography variant="caption" fontWeight={600}>
                        {entry.speakerName}
                      </Typography>
                      {entry.timestamp > 0 && (
                        <Typography variant="caption" color="text.secondary">
                          {formatTimestamp(entry.timestamp)}
                        </Typography>
                      )}
                    </Box>
                    <Typography variant="body1" sx={{ pl: 1, lineHeight: 1.7 }}>
                      {entry.text}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
              No transcript entries available for this session.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedTranscript(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TelehealthTranscripts;
