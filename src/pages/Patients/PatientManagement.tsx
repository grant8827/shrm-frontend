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
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  Avatar,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add,
  Search,
  Visibility,
  Message,
  Schedule,
  Person,
  Phone,
  MedicalServices
} from '@mui/icons-material';
import { apiClient } from '../../services/apiClient';

const PatientManagement: React.FC = () => {
  const [patients, setPatients] = useState<any[]>([]);
  const [, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPatients: 0,
    activePatients: 0,
    thisWeek: 0,
    nextWeek: 0
  });

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      // TODO: Replace with actual API endpoints
      // const patientsRes = await apiClient.get('/patients/');
      // const activeRes = await apiClient.get('/patients/?status=active');
      // const thisWeekRes = await apiClient.get('/appointments/?week=current');
      // const nextWeekRes = await apiClient.get('/appointments/?week=next');
      
      // setPatients(patientsRes.data);
      // setStats({
      //   totalPatients: patientsRes.data.length,
      //   activePatients: activeRes.data.length,
      //   thisWeek: thisWeekRes.data.length,
      //   nextWeek: nextWeekRes.data.length
      // });
      
      setPatients([]);
      setStats({
        totalPatients: 0,
        activePatients: 0,
        thisWeek: 0,
        nextWeek: 0
      });
      setLoading(false);
    } catch (error) {
      console.error('Error loading patients:', error);
      setLoading(false);
    }
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [addPatientOpen, setAddPatientOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  
  const [newPatientData, setNewPatientData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    diagnosis: '',
    assigned_therapist: '',
  });
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.diagnosis.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewDetails = (patient: any) => {
    setSelectedPatient(patient);
    setDetailsOpen(true);
  };

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'success' : 'default';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Patient Management
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<Add />}
          onClick={() => setAddPatientOpen(true)}
        >
          Add New Patient
        </Button>
      </Box>

      {/* Search Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search patients by name or diagnosis..."
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
      </Paper>

      {/* Patient Statistics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary">{stats.totalPatients}</Typography>
              <Typography variant="body2">Total Patients</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">{stats.activePatients}</Typography>
              <Typography variant="body2">Active</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main">{stats.thisWeek}</Typography>
              <Typography variant="body2">This Week</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="info.main">{stats.nextWeek}</Typography>
              <Typography variant="body2">Next Week</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Patients Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Patient</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Last Visit</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Primary Diagnosis</TableCell>
                <TableCell>Next Appointment</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPatients.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar>{patient.name.charAt(0)}</Avatar>
                      <Box>
                        <Typography variant="subtitle2">{patient.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Age: {patient.age}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{patient.phone}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {patient.email}
                    </Typography>
                  </TableCell>
                  <TableCell>{patient.lastVisit}</TableCell>
                  <TableCell>
                    <Chip
                      label={patient.status}
                      color={getStatusColor(patient.status) as any}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{patient.diagnosis}</TableCell>
                  <TableCell>{patient.nextAppointment || 'Not scheduled'}</TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleViewDetails(patient)}
                    >
                      <Visibility />
                    </IconButton>
                    <IconButton size="small" color="info">
                      <Message />
                    </IconButton>
                    <IconButton size="small" color="success">
                      <Schedule />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Patient Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Patient Details - {selectedPatient?.name}
        </DialogTitle>
        <DialogContent>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab label="Overview" />
            <Tab label="Medical History" />
            <Tab label="Treatment Plan" />
            <Tab label="Notes" />
          </Tabs>

          {tabValue === 0 && selectedPatient && (
            <Box sx={{ mt: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Personal Information
                      </Typography>
                      <Typography><strong>Name:</strong> {selectedPatient.name}</Typography>
                      <Typography><strong>Age:</strong> {selectedPatient.age}</Typography>
                      <Typography><strong>Status:</strong> {selectedPatient.status}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        <Phone sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Contact Information
                      </Typography>
                      <Typography><strong>Phone:</strong> {selectedPatient.phone}</Typography>
                      <Typography><strong>Email:</strong> {selectedPatient.email}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        <MedicalServices sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Clinical Information
                      </Typography>
                      <Typography><strong>Primary Diagnosis:</strong> {selectedPatient.diagnosis}</Typography>
                      <Typography><strong>Last Visit:</strong> {selectedPatient.lastVisit}</Typography>
                      <Typography><strong>Next Appointment:</strong> {selectedPatient.nextAppointment || 'Not scheduled'}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}

          {tabValue === 1 && (
            <Box sx={{ mt: 3 }}>
              <Typography>Medical history details would be displayed here...</Typography>
            </Box>
          )}

          {tabValue === 2 && (
            <Box sx={{ mt: 3 }}>
              <Typography>Treatment plan details would be displayed here...</Typography>
            </Box>
          )}

          {tabValue === 3 && (
            <Box sx={{ mt: 3 }}>
              <Typography>Clinical notes would be displayed here...</Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Add New Patient Dialog */}
      <Dialog 
        open={addPatientOpen} 
        onClose={() => setAddPatientOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Add New Patient</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={newPatientData.first_name}
                  onChange={(e) => setNewPatientData(prev => ({ ...prev, first_name: e.target.value }))}
                  error={!!formErrors.first_name}
                  helperText={formErrors.first_name}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={newPatientData.last_name}
                  onChange={(e) => setNewPatientData(prev => ({ ...prev, last_name: e.target.value }))}
                  error={!!formErrors.last_name}
                  helperText={formErrors.last_name}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={newPatientData.email}
                  onChange={(e) => setNewPatientData(prev => ({ ...prev, email: e.target.value }))}
                  error={!!formErrors.email}
                  helperText={formErrors.email}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={newPatientData.phone}
                  onChange={(e) => setNewPatientData(prev => ({ ...prev, phone: e.target.value }))}
                  error={!!formErrors.phone}
                  helperText={formErrors.phone}
                  placeholder="(555) 123-4567"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Date of Birth"
                  type="date"
                  value={newPatientData.date_of_birth}
                  onChange={(e) => setNewPatientData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                  error={!!formErrors.date_of_birth}
                  helperText={formErrors.date_of_birth}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Primary Diagnosis"
                  value={newPatientData.diagnosis}
                  onChange={(e) => setNewPatientData(prev => ({ ...prev, diagnosis: e.target.value }))}
                  error={!!formErrors.diagnosis}
                  helperText={formErrors.diagnosis}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth error={!!formErrors.assigned_therapist}>
                  <InputLabel>Assigned Therapist (Optional)</InputLabel>
                  <Select
                    value={newPatientData.assigned_therapist}
                    label="Assigned Therapist (Optional)"
                    onChange={(e) => setNewPatientData(prev => ({ ...prev, assigned_therapist: e.target.value }))}
                  >
                    <MenuItem value="">None</MenuItem>
                    <MenuItem value="1">Dr. Sarah Wilson</MenuItem>
                    <MenuItem value="2">Dr. Michael Johnson</MenuItem>
                    <MenuItem value="3">Dr. Emily Brown</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Box sx={{ mt: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
              <Typography variant="body2">
                <strong>Note:</strong> A registration link will be emailed to the patient so they can create their own username and password.
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setAddPatientOpen(false);
            setNewPatientData({
              first_name: '',
              last_name: '',
              email: '',
              phone: '',
              date_of_birth: '',
              diagnosis: '',
              assigned_therapist: '',
            });
            setFormErrors({});
          }}>
            Cancel
          </Button>
          <Button 
            variant="contained"
            onClick={async () => {
              try {
                setIsLoading(true);
                setFormErrors({});
                
                // Validate
                const errors: Record<string, string> = {};
                if (!newPatientData.first_name.trim()) errors.first_name = 'Required';
                if (!newPatientData.last_name.trim()) errors.last_name = 'Required';
                if (!newPatientData.email.trim()) errors.email = 'Required';
                
                if (Object.keys(errors).length > 0) {
                  setFormErrors(errors);
                  setIsLoading(false);
                  return;
                }
                
                // Create patient record via backend API and trigger token-based portal registration email
                const patientData = {
                  first_name_write: newPatientData.first_name,
                  last_name_write: newPatientData.last_name,
                  email_write: newPatientData.email,
                  phone_write: newPatientData.phone || '',
                  date_of_birth: newPatientData.date_of_birth || '1990-01-01',
                  gender: 'P',
                  admission_date: new Date().toISOString().split('T')[0],
                  create_portal_access: true,
                };
                
                console.log('Creating patient:', patientData);
                
                const response = await apiClient.post('/api/patients/', patientData);
                console.log('Patient created:', response.data);
                
                setSnackbar({ open: true, message: 'Patient added successfully. Registration email sent.', severity: 'success' });
                setAddPatientOpen(false);
                setNewPatientData({
                  first_name: '',
                  last_name: '',
                  email: '',
                  phone: '',
                  date_of_birth: '',
                  diagnosis: '',
                  assigned_therapist: '',
                });
              } catch (error: any) {
                console.error('Failed to add patient:', error);
                console.error('Error response:', error.response?.data);
                
                // Handle validation errors from backend
                if (error.response?.data) {
                  const backendErrors = error.response.data;
                  const formattedErrors: Record<string, string> = {};
                  
                  Object.keys(backendErrors).forEach(key => {
                    const errorValue = backendErrors[key];
                    if (Array.isArray(errorValue)) {
                      formattedErrors[key] = errorValue[0];
                    } else if (typeof errorValue === 'string') {
                      formattedErrors[key] = errorValue;
                    }
                  });
                  
                  setFormErrors(formattedErrors);
                }
                
                setSnackbar({ 
                  open: true, 
                  message: error.response?.data?.detail || error.response?.data?.message || 'Failed to add patient', 
                  severity: 'error' 
                });
              } finally {
                setIsLoading(false);
              }
            }}
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : <Add />}
          >
            {isLoading ? 'Adding...' : 'Add Patient'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PatientManagement;