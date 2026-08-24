import React from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
} from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Patient } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

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
}) => {
  const { state } = useAuth();

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

  const prefillParams = new URLSearchParams({
    name: `${state.user?.firstName || ''} ${state.user?.lastName || ''}`.trim(),
    email: state.user?.email || '',
  });

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

      <Alert severity="info" sx={{ mb: 2 }}>
        This document has not been signed yet.
      </Alert>

      <Typography variant="body2" color="text.secondary" gutterBottom>
        Signing is done through our secure onboarding portal, where you'll review this and the other required
        documents and provide a drawn signature.
      </Typography>

      <Button
        variant="contained"
        color="primary"
        endIcon={<OpenInNewIcon />}
        href={`/consent-forms?${prefillParams.toString()}`}
        target="_blank"
        rel="noopener noreferrer"
        sx={{ mt: 2 }}
      >
        Sign Consent Forms
      </Button>
    </Paper>
  );
};

export default AgreementForm;
