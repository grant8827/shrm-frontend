import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import { Patient } from '../../types';
import { apiClient } from '../../services/apiClient';

interface AgreementProps {
  patient: Patient;
  agreementType: 'consentForm' | 'treatmentAgreement' | 'hipaa' | 'privacyPolicy';
  title: string;
  content: React.ReactNode;
  onSuccess: (updatedPatient: Patient) => void;
}

const AgreementForm: React.FC<AgreementProps> = ({
  patient,
  agreementType,
  title,
  content,
  onSuccess
}) => {
  const [signature, setSignature] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if already signed
  const isSigned = () => {
    switch (agreementType) {
      case 'consentForm': return patient.consentFormSigned;
      case 'treatmentAgreement': return patient.treatmentAgreementSigned;
      case 'hipaa': return patient.hipaaAuthorized;
      case 'privacyPolicy': return patient.privacyPolicyAcknowledged;
      default: return false;
    }
  };

  const getSignatureDetails = () => {
    let sig = '';
    let date = '';
    switch (agreementType) {
      case 'consentForm':
        sig = patient.consentFormSignature || '';
        date = patient.consentFormDate || '';
        break;
      case 'treatmentAgreement':
        sig = patient.treatmentAgreementSignature || '';
        date = patient.treatmentAgreementDate || '';
        break;
      case 'hipaa':
        sig = patient.hipaaSignature || '';
        date = patient.hipaaDate || '';
        break;
      case 'privacyPolicy':
        sig = patient.privacyPolicySignature || '';
        date = patient.privacyPolicyDate || '';
        break;
    }
    return { sig, date };
  };

  const handleAccept = async () => {
    if (!signature.trim()) {
      setError('Please type your name as an electronic signature.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await apiClient.put(`/api/patients/${patient.id}/agreements`, {
        agreementType,
        signature: signature.trim(),
        date: new Date().toISOString()
      });
      onSuccess(response.data);
    } catch (err: any) {
      console.error('Error signing agreement:', err);
      setError(err.response?.data?.error || 'Failed to submit agreement. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSigned()) {
    const details = getSignatureDetails();
    return (
      <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', mb: 3 }}>
        <Typography variant="h6" gutterBottom>{title}</Typography>
        <Alert severity="success" sx={{ mb: 2 }}>
          You have already signed this agreement.
        </Alert>
        <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Electronically Signed By:</strong> {details.sig}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Date:</strong> {details.date ? new Date(details.date).toLocaleString() : 'N/A'}
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', mb: 3 }}>
      <Typography variant="h6" gutterBottom>{title}</Typography>
      
      <Box sx={{ 
        maxHeight: '300px', 
        overflowY: 'auto', 
        p: 2, 
        bgcolor: 'grey.50', 
        border: '1px solid', 
        borderColor: 'grey.200',
        borderRadius: 1,
        mb: 3
      }}>
        {content}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Divider sx={{ mb: 3 }} />

      <Typography variant="body2" color="text.secondary" gutterBottom>
        By typing my name below, I acknowledge that I have read and agree to the terms above. This serves as my electronic signature.
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mt: 2 }}>
        <TextField
          label="Type Full Name to Sign"
          variant="outlined"
          fullWidth
          value={signature}
          onChange={(e) => setSignature(e.target.value)}
          disabled={isSubmitting}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleAccept}
          disabled={isSubmitting || !signature.trim()}
          sx={{ height: '56px', px: 4 }}
        >
          {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Accept & Sign'}
        </Button>
      </Box>
    </Paper>
  );
};

export default AgreementForm;