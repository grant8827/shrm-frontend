import React, { useState, useEffect } from 'react';
import { Box, Typography, Tabs, Tab, CircularProgress } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { Patient } from '../../types';
import { apiClient } from '../../services/apiClient';
import AgreementForm from './AgreementForm';

// Placeholder texts for agreements (you can edit these later)
const agreementTexts = {
  consentForm: (
    <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
      I hereby consent to engage in telehealth services and/or in-person therapy at Safe Haven EHR. 
      I understand that telehealth involves the communication of my medical/mental health information, both orally and visually.
      
      1. I have the right to withhold or withdraw consent at any time without affecting my right to future care or treatment.
      2. The laws that protect the confidentiality of my medical information also apply to telehealth.
      3. I understand that there are risks and consequences from telehealth, including, but not limited to, the possibility, despite reasonable efforts on the part of my provider, that the transmission of my medical information could be disrupted or distorted by technical failures.
    </Typography>
  ),
  treatmentAgreement: (
    <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
      This agreement outlines the terms of therapeutic treatment.
      
      1. Appointments: Sessions are typically 50 minutes. Cancellations must be made 24 hours in advance.
      2. Fees: You are responsible for all fees associated with treatment. Copays/deductibles are due at the time of service.
      3. Emergencies: In case of emergency, call 911 or go to the nearest emergency room.
      4. Termination: You have the right to terminate therapy at any time.
    </Typography>
  ),
  hipaa: (
    <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
      HIPAA Notice of Privacy Practices
      
      This notice describes how medical information about you may be used and disclosed and how you can get access to this information.
      
      1. Your Rights: You have the right to request a copy of your paper or electronic medical record.
      2. Our Responsibilities: We are required by law to maintain the privacy and security of your protected health information.
      3. Disclosures: We may use and share your information as we provide treatment, bill for your services, and run our practice.
    </Typography>
  ),
  privacyPolicy: (
    <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
      Privacy Policy Acknowledgment
      
      I acknowledge that I have received and reviewed the Safe Haven EHR Privacy Policy.
      I understand how my data is stored, processed, and protected within the platform.
    </Typography>
  )
};

const PatientAgreementsView: React.FC = () => {
  const { state } = useAuth();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        // Assuming client sees their own data
        const response = await apiClient.get('/api/patients/');
        if (response.data.results && response.data.results.length > 0) {
          setPatient(response.data.results[0]);
        }
      } catch (error) {
        console.error("Failed to fetch patient data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPatientData();
  }, [state.user?.id]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSuccess = (updatedPatient: Patient) => {
    setPatient(updatedPatient);
  };

  if (loading) return <CircularProgress />;
  if (!patient) return <Typography>No client record found.</Typography>;

  return (
    <Box>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab label="Consent for Treatment" />
          <Tab label="Treatment Agreement" />
          <Tab label="HIPAA Authorization" />
          <Tab label="Privacy Policy" />
        </Tabs>
      </Box>

      {tabValue === 0 && (
        <AgreementForm 
          patient={patient}
          agreementType="consentForm"
          title="Consent for Telehealth & Treatment"
          content={agreementTexts.consentForm}
          onSuccess={handleSuccess}
        />
      )}
      
      {tabValue === 1 && (
        <AgreementForm 
          patient={patient}
          agreementType="treatmentAgreement"
          title="Treatment Agreement & Policies"
          content={agreementTexts.treatmentAgreement}
          onSuccess={handleSuccess}
        />
      )}
      
      {tabValue === 2 && (
        <AgreementForm 
          patient={patient}
          agreementType="hipaa"
          title="HIPAA Notice of Privacy Practices"
          content={agreementTexts.hipaa}
          onSuccess={handleSuccess}
        />
      )}
      
      {tabValue === 3 && (
        <AgreementForm 
          patient={patient}
          agreementType="privacyPolicy"
          title="Platform Privacy Policy"
          content={agreementTexts.privacyPolicy}
          onSuccess={handleSuccess}
        />
      )}
    </Box>
  );
};

export default PatientAgreementsView;