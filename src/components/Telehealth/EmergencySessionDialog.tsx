import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Typography,
  Box,
} from '@mui/material';
import { Warning } from '@mui/icons-material';
import apiClient from '../../services/apiClient';

interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

interface EmergencySessionDialogProps {
  open: boolean;
  onClose: () => void;
  onSessionCreated: () => void;
}

const EmergencySessionDialog: React.FC<EmergencySessionDialogProps> = ({
  open,
  onClose,
  onSessionCreated,
}) => {
  const [patients, setPatients] = useState<User[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (open) {
      fetchPatients();
    }
  }, [open]);

  const fetchPatients = async () => {
    try {
      const response = await apiClient.get('/auth/');
      const allUsers = response.data as User[];
      const clientUsers = allUsers.filter(user => user.role === 'client');
      setPatients(clientUsers);
    } catch (error) {
      console.error('Error fetching patients:', error);
      setError('Failed to load patients');
    }
  };

  const handleCreateEmergencySession = async () => {
    if (!selectedPatientId) {
      setError('Please select a patient');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await apiClient.post('/telehealth/sessions/create_emergency/', {
        patient_id: selectedPatientId,
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setSelectedPatientId('');
        onSessionCreated();
        onClose();
      }, 2000);
    } catch (error: any) {
      console.error('Error creating emergency session:', error);
      setError(
        error.response?.data?.error ||
        error.response?.data?.detail ||
        'Failed to create emergency session'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setSelectedPatientId('');
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <Warning color="error" />
          <Typography variant="h6">Start Emergency Session</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Emergency session created! Email sent to patient.
          </Alert>
        )}

        <Alert severity="warning" sx={{ mb: 3 }}>
          This will immediately start a session and send an email to the patient with a join link.
        </Alert>

        <FormControl fullWidth>
          <InputLabel id="patient-select-label">Select Patient *</InputLabel>
          <Select
            labelId="patient-select-label"
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value as number)}
            label="Select Patient *"
            disabled={loading || success}
          >
            {patients.map((patient) => (
              <MenuItem key={patient.id} value={patient.id}>
                {patient.first_name} {patient.last_name} ({patient.email})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {selectedPatient && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid #e0e0e0' }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>Patient Details:</strong>
            </Typography>
            <Typography variant="body2">
              Name: {selectedPatient.first_name} {selectedPatient.last_name}
            </Typography>
            <Typography variant="body2">
              Email: {selectedPatient.email}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, color: 'primary.main' }}>
              ✉️ An email will be sent to this address with the session link
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleCreateEmergencySession}
          variant="contained"
          color="error"
          disabled={!selectedPatientId || loading || success}
          startIcon={loading && <CircularProgress size={20} />}
        >
          {loading ? 'Creating...' : 'Start Emergency Session'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmergencySessionDialog;
