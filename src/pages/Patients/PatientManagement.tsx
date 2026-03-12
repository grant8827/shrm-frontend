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
  Menu,
  ListItemIcon,
  ListItemText,
  DialogContentText,
  Snackbar,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Search,
  MoreVert,
  CheckCircleOutline,
  HighlightOff,
  Block,
  AssignmentTurnedIn,
  Person,
  Phone,
  MedicalServices,
  PersonAdd,
} from '@mui/icons-material';
import { apiClient } from '../../services/apiClient';

interface PatientItem {
  id: string;
  name: string;
  age: number;
  phone: string;
  email: string;
  lastVisit: string;
  status: string;
  diagnosis: string;
  nextAppointment?: string;
  assignedTherapist?: string;
  assignedTherapistId?: string;
}

const PatientManagement: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [patients, setPatients] = useState<PatientItem[]>([]);
  const [, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPatients: 0,
    activePatients: 0,
    thisWeek: 0,
    nextWeek: 0
  });

  useEffect(() => {
    void loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const patientsRes = await apiClient.get('/api/patients/');
      
      // Transform backend data to match PatientItem interface
      const transformedPatients = patientsRes.data.results.map((patient: any) => ({
        id: patient.id,
        name: `${patient.first_name} ${patient.last_name}`,
        age: patient.date_of_birth ? 
          new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear() : 0,
        phone: patient.phone_number || patient.phone || '',
        email: patient.email,
        lastVisit: patient.updated_at || patient.created_at,
        status: patient.is_active ? 'active' : 'inactive',
        diagnosis: patient.medical_history || '',
        nextAppointment: '',
        assignedTherapist: patient.assigned_therapist_name || '',
        assignedTherapistId: patient.assigned_therapist_id || '',
      }));
      
      setPatients(transformedPatients);
      setStats({
        totalPatients: patientsRes.data.count || transformedPatients.length,
        activePatients: transformedPatients.filter((p: PatientItem) => p.status === 'active').length,
        thisWeek: 0,
        nextWeek: 0
      });
      setLoading(false);
    } catch (error) {
      console.error('Error loading patients:', error);
      setPatients([]);
      setStats({
        totalPatients: 0,
        activePatients: 0,
        thisWeek: 0,
        nextWeek: 0
      });
      setLoading(false);
    }
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<PatientItem | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [actionAnchorEl, setActionAnchorEl] = useState<null | HTMLElement>(null);
  const [actionPatient, setActionPatient] = useState<PatientItem | null>(null);
  const [completePatientOpen, setCompletePatientOpen] = useState(false);

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.diagnosis.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenActions = (event: React.MouseEvent<HTMLElement>, patient: PatientItem) => {
    setActionAnchorEl(event.currentTarget);
    setActionPatient(patient);
    setSelectedPatient(patient);
  };

  const handleCloseActions = () => {
    setActionAnchorEl(null);
  };

  const handleOpenCompletePatient = () => {
    setCompletePatientOpen(true);
    handleCloseActions();
  };

  const handleCompletePatient = async () => {
    if (!actionPatient) return;

    try {
      await apiClient.patch(`/api/patients/${actionPatient.id}/`, {
        status: 'discharged',
        discharge_date: new Date().toISOString().split('T')[0],
      });

      setPatients(prev => prev.map(patient => (
        patient.id === actionPatient.id
          ? { ...patient, status: 'discharged' }
          : patient
      )));

      setSnackbar({ open: true, message: 'Patient marked complete (sessions complete)', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Failed to mark patient complete', severity: 'error' });
    } finally {
      setCompletePatientOpen(false);
      setActionPatient(null);
    }
  };


  const getStatusColor = (status: string): 'success' | 'default' => {
    return status === 'active' ? 'success' : 'default';
  };

  const handleSetStatus = async (newStatus: string) => {
    if (!actionPatient) return;
    handleCloseActions();
    try {
      await apiClient.patch(`/api/patients/${actionPatient.id}/`, { status: newStatus });
      setPatients(prev => prev.map(p =>
        p.id === actionPatient.id ? { ...p, status: newStatus } : p
      ));
      setSnackbar({ open: true, message: `Patient status set to ${newStatus}`, severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Failed to update patient status', severity: 'error' });
    } finally {
      setActionPatient(null);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: 1.5, mb: 3 }}>
        <Typography variant="h4" component="h1">
          Patient Management
        </Typography>
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
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary">{stats.totalPatients}</Typography>
              <Typography variant="body2">Total Patients</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">{stats.activePatients}</Typography>
              <Typography variant="body2">Active</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main">{stats.thisWeek}</Typography>
              <Typography variant="body2">This Week</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="info.main">{stats.nextWeek}</Typography>
              <Typography variant="body2">Next Week</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Patients List */}
      {isMobile ? (
        <Box sx={{ display: 'grid', gap: 1.5 }}>
          {filteredPatients.length === 0 ? (
            <Paper sx={{ p: 2.5, textAlign: 'center' }}>
              <Typography color="text.secondary">No patients found.</Typography>
            </Paper>
          ) : (
            filteredPatients.map((patient) => (
              <Card key={patient.id}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar>{patient.name.charAt(0)}</Avatar>
                      <Box>
                        <Typography variant="subtitle1">{patient.name}</Typography>
                        <Typography variant="caption" color="text.secondary">Age: {patient.age}</Typography>
                      </Box>
                    </Box>
                    <IconButton size="small" onClick={(event) => handleOpenActions(event, patient)}>
                      <MoreVert />
                    </IconButton>
                  </Box>

                  <Chip
                    label={patient.status}
                    color={getStatusColor(patient.status)}
                    size="small"
                    variant="outlined"
                    sx={{ mb: 1.25 }}
                  />

                  <Typography variant="body2"><strong>Therapist:</strong> {patient.assignedTherapist || 'Unassigned'}</Typography>
                  <Typography variant="body2"><strong>Diagnosis:</strong> {patient.diagnosis || 'Not specified'}</Typography>
                  <Typography variant="body2"><strong>Phone:</strong> {patient.phone || 'N/A'}</Typography>
                  <Typography variant="body2"><strong>Email:</strong> {patient.email || 'N/A'}</Typography>
                  <Typography variant="body2"><strong>Last Visit:</strong> {patient.lastVisit || 'N/A'}</Typography>
                  <Typography variant="body2"><strong>Next Appointment:</strong> {patient.nextAppointment || 'Not scheduled'}</Typography>
                </CardContent>
              </Card>
            ))
          )}
        </Box>
      ) : (
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Patient</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Last Visit</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Therapist</TableCell>
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
                        color={getStatusColor(patient.status)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {patient.assignedTherapist ? (
                        <Chip
                          icon={<PersonAdd fontSize="small" />}
                          label={patient.assignedTherapist}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                      ) : (
                        <Typography variant="caption" color="text.secondary">Unassigned</Typography>
                      )}
                    </TableCell>
                    <TableCell>{patient.diagnosis}</TableCell>
                    <TableCell>{patient.nextAppointment || 'Not scheduled'}</TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={(event) => handleOpenActions(event, patient)}
                      >
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <Menu
        anchorEl={actionAnchorEl}
        open={Boolean(actionAnchorEl)}
        onClose={handleCloseActions}
      >
        <MenuItem onClick={() => void handleSetStatus('active')}>
          <ListItemIcon>
            <CheckCircleOutline fontSize="small" color="success" />
          </ListItemIcon>
          <ListItemText>Set Active</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => void handleSetStatus('inactive')}>
          <ListItemIcon>
            <HighlightOff fontSize="small" />
          </ListItemIcon>
          <ListItemText>Set Inactive</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => void handleSetStatus('suspended')}>
          <ListItemIcon>
            <Block fontSize="small" color="warning" />
          </ListItemIcon>
          <ListItemText>Suspend</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleOpenCompletePatient}>
          <ListItemIcon>
            <AssignmentTurnedIn fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText>Complete</ListItemText>
        </MenuItem>
      </Menu>

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
          <Tabs value={tabValue} onChange={(_event: React.SyntheticEvent, newValue: number) => setTabValue(newValue)}>
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

      <Dialog
        open={completePatientOpen}
        onClose={() => setCompletePatientOpen(false)}
      >
        <DialogTitle>Complete Patient</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Mark {actionPatient?.name || 'this patient'} as complete? This will set status to discharged.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompletePatientOpen(false)}>Cancel</Button>
          <Button color="success" variant="contained" onClick={() => void handleCompletePatient()}>
            Complete
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