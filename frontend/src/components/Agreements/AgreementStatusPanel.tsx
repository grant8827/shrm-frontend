import React from 'react';
import { Box, Typography, Paper, Grid, Chip, Button } from '@mui/material';
import { Patient } from '../../types';
import PrintIcon from '@mui/icons-material/Print';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

interface Props {
  patient: Patient;
}

const AgreementStatusPanel: React.FC<Props> = ({ patient }) => {
  const renderStatus = (
    signed?: boolean, 
    signature?: string, 
    date?: string, 
    title?: string
  ) => {
    return (
      <Grid item xs={12} md={6}>
        <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Typography variant="subtitle1" fontWeight="500">{title}</Typography>
            <Chip 
              icon={signed ? <CheckCircleIcon /> : <CancelIcon />} 
              label={signed ? 'Signed' : 'Pending'} 
              color={signed ? 'success' : 'warning'} 
              size="small" 
            />
          </Box>
          
          {signed ? (
            <Box>
              <Typography variant="body2" color="text.secondary">
                <strong>Signature:</strong> {signature}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Date:</strong> {date ? new Date(date).toLocaleString() : 'N/A'}
              </Typography>
              <Button 
                startIcon={<PrintIcon />} 
                size="small" 
                sx={{ mt: 2 }}
                onClick={() => window.print()}
              >
                Print Record
              </Button>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              Awaiting client signature.
            </Typography>
          )}
        </Paper>
      </Grid>
    );
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Grid container spacing={3}>
        {renderStatus(
          patient.consentFormSigned, 
          patient.consentFormSignature, 
          patient.consentFormDate, 
          "Consent for Treatment"
        )}
        {renderStatus(
          patient.treatmentAgreementSigned, 
          patient.treatmentAgreementSignature, 
          patient.treatmentAgreementDate, 
          "Treatment Agreement"
        )}
        {renderStatus(
          patient.hipaaAuthorized, 
          patient.hipaaSignature, 
          patient.hipaaDate, 
          "HIPAA Authorization"
        )}
        {renderStatus(
          patient.privacyPolicyAcknowledged, 
          patient.privacyPolicySignature, 
          patient.privacyPolicyDate, 
          "Privacy Policy"
        )}
      </Grid>
    </Box>
  );
};

export default AgreementStatusPanel;