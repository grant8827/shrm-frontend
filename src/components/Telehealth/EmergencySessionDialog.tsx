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
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
} from '@mui/material';
import { Warning } from '@mui/icons-material';
import { apiClient } from '../../services/apiClient';

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
  const [patientType, setPatientType] = useState<'existing' | 'new'>('existing');
  const [selectedPatientId, setSelectedPatientId] = useState<number | ''>('');
  
  // New patient fields
  const [newPatientEmail, setNewPatientEmail] = useState('');
  const [newPatientFirstName, setNewPatientFirstName] = useState('');
  const [newPatientLastName, setNewPatientLastName] = useState('');
  
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
      // Handle both array and paginated responses
      const allUsers = Array.isArray(response.data) 
        ? response.data 
        : (response.data?.results || []);
      const clientUsers = allUsers.filter((user: User) => user.role === 'client');
      setPatients(clientUsers);
      
      if (clientUsers.length === 0) {
        console.warn('No patients found in the system');
      }
    } catch (error: any) {
      console.error('Error fetching patients:', error);
      console.error('Error details:', error.response?.data);
      setError(`Failed to load patients: ${error.response?.data?.detail || error.message || 'Unknown error'}`);
    }
  };

  const validateForm = () => {
    if (patientType === 'existing') {
      if (!selectedPatientId) {
        setError('Please select a patient');
        return false;
      }
    } else {
      if (!newPatientEmail || !newPatientFirstName || !newPatientLastName) {
        setError('Please fill in all patient information');
        return false;
      }
      
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newPatientEmail)) {
        setError('Please enter a valid email address');
        return false;
      }
    }
    return true;
  };

  const handleCreateEmergencySession = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const requestData = patientType === 'existing'
        ? { patient_id: selectedPatientId }
        : {
            patient_email: newPatientEmail,
            patient_first_name: newPatientFirstName,
            patient_last_name: newPatientLastName,
          };

      await apiClient.post('/telehealth/sessions/create_emergency/', requestData);

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        resetForm();
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

  const resetForm = () => {
    setPatientType('existing');
    setSelectedPatientId('');
    setNewPatientEmail('');
    setNewPatientFirstName('');
    setNewPatientLastName('');
    setError(null);
    setSuccess(false);
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
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
            Emergency session created! Email sent successfully.
          </Alert>
        )}

        <Alert severity="warning" sx={{ mb: 3 }}>
          This will immediately start a session and send an email with a join link.
        </Alert>

        <FormControl component="fieldset" sx={{ mb: 3 }}>
          <FormLabel component="legend">Patient Type</FormLabel>
          <RadioGroup
            row
            value={patientType}
            onChange={(e) => {
              setPatientType(e.target.value as 'existing' | 'new');
              setError(null);
            }}
          >
            <FormControlLabel
              value="existing"
              control={<Radio />}
              label="Existing Patient"
              disabled={loading || success}
            />
            <FormControlLabel
              value="new"
              control={<Radio />}
              label="New/External Patient"
              disabled={loading || success}
            />
          </RadioGroup>
        </FormControl>

        {patientType === 'existing' ? (
          <>
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
          </>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="First Name *"
              value={newPatientFirstName}
              onChange={(e) => setNewPatientFirstName(e.target.value)}
              fullWidth
              disabled={loading || success}
            />
            <TextField
              label="Last Name *"
              value={newPatientLastName}
              onChange={(e) => setNewPatientLastName(e.target.value)}
              fullWidth
              disabled={loading || success}
            />
            <TextField
              label="Email Address *"
              type="email"
              value={newPatientEmail}
              onChange={(e) => setNewPatientEmail(e.target.value)}
              fullWidth
              disabled={loading || success}
              helperText="Emergency session link will be sent to this email"
            />
            
            {newPatientEmail && newPatientFirstName && newPatientLastName && (
              <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid #e0e0e0' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Session Details:</strong>
                </Typography>
                <Typography variant="body2">
                  Patient: {newPatientFirstName} {newPatientLastName}
                </Typography>
                <Typography variant="body2">
                  Email: {newPatientEmail}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, color: 'warning.main' }}>
                  ⚠️ This patient is not in the system. They will receive a join link via email.
                </Typography>
              </Box>
            )}
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
          disabled={loading || success}
          startIcon={loading && <CircularProgress size={20} />}
        >
          {loading ? 'Creating...' : 'Start Emergency Session'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmergencySessionDialog;
