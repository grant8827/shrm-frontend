import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Dialog,
  Grid,
  Card,
  CardContent,
  Avatar,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Search,
  Visibility,
  Edit,
  PersonAdd,
  Refresh,
} from '@mui/icons-material';
import AddPatientForm from '../../components/AddPatientForm';
import { apiService } from '../../services/apiService';

// Backend patient interface - matches Django API response
interface BackendPatient {
  id: string;
  patient_number: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  date_of_birth: string;
  gender: string;
  status: string;
  primary_therapist: string | null;
  primary_therapist_name: string | null;
  admission_date: string;
  created_at: string;
  updated_at: string;
}

// Paginated API response interface
interface PaginatedResponse<T> {
  count: number;
  current_page: number;
  total_pages: number;
  page_size: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Form data interface
interface PatientFormData {
  firstName: string;
  lastName: string;
  dateOfBirth: Date | null;
  gender: string;
  phone: string;
  email: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
    email: string;
  };
  insurance: {
    provider: string;
    policyNumber: string;
    groupNumber: string;
    memberID: string;
    effectiveDate: Date | null;
  };
  medical: {
    primaryDiagnosis: string;
    secondaryDiagnoses: string[];
    allergies: string[];
    medications: string[];
    primaryTherapist: string;
    referringPhysician: string;
    medicalHistory: string;
  };
  compliance: {
    consentForms: boolean;
    privacyPolicy: boolean;
    treatmentAgreement: boolean;
    hipaaAuthorization: boolean;
  };
}

const AdminPatientManagement: React.FC = () => {
  const [patients, setPatients] = useState<BackendPatient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<BackendPatient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [addPatientOpen, setAddPatientOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showError, setShowError] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load patients from API
  const loadPatients = async () => {
    try {
      console.log('🔵 loadPatients called - starting...');
      setLoading(true);
      
      console.log('🔵 Making API call to /patients/...');
      const response = await apiService.get('/patients/');
      console.log('🔵 Raw API response:', response);
      
      const data = (response.data || response) as BackendPatient[] | PaginatedResponse<BackendPatient>;
      console.log('🔵 Extracted data:', data);
      
      // Handle paginated response - check if it has a 'results' field
      let patientsData: BackendPatient[] = [];
      
      if (Array.isArray(data)) {
        console.log('✅ Response is a plain array');
        patientsData = data;
      } else if (data && 'results' in data && Array.isArray(data.results)) {
        console.log('✅ Response is paginated - extracting results');
        patientsData = data.results;
      } else {
        console.error('❌ Unexpected API response format:', data);
        setErrorMessage('Unexpected response format from server');
        setShowError(true);
        setPatients([]);
        setFilteredPatients([]);
        return;
      }
      
      console.log('✅ Setting patients state with', patientsData.length, 'patients');
      console.log('✅ First patient:', patientsData[0]);
      setPatients(patientsData);
      setFilteredPatients(patientsData);
      console.log('✅ State updated');
      
    } catch (error: any) {
      console.error('❌ Error loading patients:', error);
      console.error('❌ Error response:', error.response);
      setErrorMessage(`Failed to load patients: ${error.message || 'Unknown error'}`);
      setShowError(true);
      setPatients([]);
      setFilteredPatients([]);
    } finally {
      setLoading(false);
      console.log('🔵 loadPatients completed');
    }
  };

  // Load patients on mount
  useEffect(() => {
    loadPatients();
  }, []);

  // Filter patients when search or status changes
  useEffect(() => {
    console.log('🔍 FILTER EFFECT running');
    console.log('🔍 patients array:', patients);
    console.log('🔍 statusFilter:', statusFilter);
    console.log('🔍 searchTerm:', searchTerm);
    
    let filtered = [...patients];

    // Apply status filter
    if (statusFilter !== 'all') {
      console.log('🔍 Applying status filter:', statusFilter);
      filtered = filtered.filter(p => p.status === statusFilter);
      console.log('🔍 After status filter:', filtered.length);
    }

    // Apply search filter
    if (searchTerm) {
      console.log('🔍 Applying search filter:', searchTerm);
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.first_name.toLowerCase().includes(search) ||
        p.last_name.toLowerCase().includes(search) ||
        p.email.toLowerCase().includes(search) ||
        p.phone.includes(search) ||
        p.patient_number.toLowerCase().includes(search)
      );
      console.log('🔍 After search filter:', filtered.length);
    }

    console.log('✅ FILTER RESULT - Setting filteredPatients to:', filtered.length, 'patients');
    setFilteredPatients(filtered);
  }, [searchTerm, statusFilter, patients]);

  // Handle add patient
  const handleAddPatient = async (formData: PatientFormData) => {
    try {
      // Transform form data to backend format
      const patientData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        date_of_birth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString().split('T')[0] : '',
        gender: formData.gender,
        phone: formData.phone,
        email: formData.email,
        street_address: formData.address.street,
        city: formData.address.city,
        state: formData.address.state,
        zip_code: formData.address.zipCode,
        emergency_contact_name: formData.emergencyContact.name,
        emergency_contact_phone: formData.emergencyContact.phone,
        emergency_contact_relationship: formData.emergencyContact.relationship,
        admission_date: new Date().toISOString().split('T')[0],
        status: 'active',
        create_portal_access: true,
      };

      console.log('📤 Sending patient data to API:', patientData);

      const response = await apiService.post('/patients/', patientData);
      
      console.log('✅ Patient created successfully:', response.data);

      setSuccessMessage('Patient created successfully! Welcome email has been sent.');
      setShowSuccess(true);
      setAddPatientOpen(false);
      
      // Reload patients
      await loadPatients();
      
    } catch (error: any) {
      console.error('❌ Error creating patient:', error);
      const errorMsg = error.response?.data?.email?.[0] || 
                      error.response?.data?.detail || 
                      error.message || 
                      'Failed to create patient';
      setErrorMessage(errorMsg);
      setShowError(true);
    }
  };

  // Calculate statistics
  const totalPatients = patients.length;
  const activePatients = patients.filter(p => p.status === 'active').length;
  const inactivePatients = patients.filter(p => p.status === 'inactive').length;
  const dischargedPatients = patients.filter(p => p.status === 'discharged').length;

  console.log('🔍 RENDER - patients.length:', patients.length);
  console.log('🔍 RENDER - filteredPatients.length:', filteredPatients.length);
  console.log('🔍 RENDER - loading:', loading);
  console.log('🔍 RENDER - statusFilter:', statusFilter);
  console.log('🔍 RENDER - searchTerm:', searchTerm);

  // Helper function to calculate age
  const calculateAge = (dateOfBirth: string): number => {
    if (!dateOfBirth) return 0;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'warning';
      case 'discharged':
        return 'default';
      case 'deceased':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Patient Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadPatients}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<PersonAdd />}
            onClick={() => setAddPatientOpen(true)}
          >
            Add Patient
          </Button>
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Total Patients
              </Typography>
              <Typography variant="h3" component="div">
                {totalPatients}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Active
              </Typography>
              <Typography variant="h3" component="div" color="success.main">
                {activePatients}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Inactive
              </Typography>
              <Typography variant="h3" component="div" color="warning.main">
                {inactivePatients}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Discharged
              </Typography>
              <Typography variant="h3" component="div" color="text.secondary">
                {dischargedPatients}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search by name, email, phone, or patient number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              select
              fullWidth
              label="Status Filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              SelectProps={{ native: true }}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="discharged">Discharged</option>
              <option value="deceased">Deceased</option>
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="body2" color="text.secondary">
              Showing {filteredPatients.length} of {totalPatients} patients
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Patients Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Patient</TableCell>
                <TableCell>Patient #</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Date of Birth</TableCell>
                <TableCell>Gender</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Admission Date</TableCell>
                <TableCell>Therapist</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(() => {
                console.log('🎨 TABLE RENDER - loading:', loading);
                console.log('🎨 TABLE RENDER - filteredPatients.length:', filteredPatients.length);
                console.log('🎨 TABLE RENDER - patients.length:', patients.length);
                console.log('🎨 TABLE RENDER - filteredPatients:', filteredPatients);
                return null;
              })()}
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Typography>Loading patients...</Typography>
                  </TableCell>
                </TableRow>
              ) : filteredPatients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Typography color="text.secondary">
                      {patients.length === 0 ? 'No patients found. Click "Add Patient" to create one.' : 'No patients match your search criteria.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPatients.map((patient) => {
                  console.log('🎨 Rendering patient row:', patient.first_name, patient.last_name);
                  return (
                  <TableRow key={patient.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {patient.first_name.charAt(0)}{patient.last_name.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">
                            {patient.first_name} {patient.last_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Age: {calculateAge(patient.date_of_birth)}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {patient.patient_number}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{patient.phone}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {patient.email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {new Date(patient.date_of_birth).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : patient.gender === 'O' ? 'Other' : 'Not specified'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={patient.status.charAt(0).toUpperCase() + patient.status.slice(1)}
                        color={getStatusColor(patient.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(patient.admission_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {patient.primary_therapist_name || 'Not assigned'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" color="primary" title="View Details">
                        <Visibility />
                      </IconButton>
                      <IconButton size="small" color="info" title="Edit">
                        <Edit />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Add Patient Dialog */}
      <Dialog
        open={addPatientOpen}
        onClose={() => setAddPatientOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <AddPatientForm
          open={addPatientOpen}
          onClose={() => setAddPatientOpen(false)}
          onSubmit={handleAddPatient}
        />
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={showSuccess}
        autoHideDuration={6000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setShowSuccess(false)} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>

      {/* Error Snackbar */}
      <Snackbar
        open={showError}
        autoHideDuration={6000}
        onClose={() => setShowError(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setShowError(false)} severity="error" sx={{ width: '100%' }}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminPatientManagement;
