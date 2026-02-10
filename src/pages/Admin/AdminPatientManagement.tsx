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
  Pagination,
  Badge,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
  AlertTitle,
  Snackbar,
} from '@mui/material';
import {
  Search,
  Visibility,
  Edit,
  Message,
  Schedule,
  Person,
  Phone,
  MedicalServices,
  Download,
  Upload,
  MoreVert,
  Block,
  CheckCircle,
  Warning,
  AccountCircle,
  History,
  AttachMoney,
  Security,
  Refresh,
  Print,
  PersonAdd,
  ContactEmergency,
  LocalHospital,
  Psychology,
} from '@mui/icons-material';
import AddPatientForm from '../../components/AddPatientForm';
import { apiService } from '../../services/apiService';

// Form data interface from AddPatientForm
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

// Enhanced patient interface for admin view
interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  age: number;
  phone: string;
  email: string;
  address: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  insurance: {
    provider: string;
    policyNumber: string;
    groupNumber: string;
  };
  registration: {
    date: string;
    status: 'active' | 'inactive' | 'suspended' | 'pending';
  };
  medical: {
    primaryDiagnosis: string;
    secondaryDiagnoses: string[];
    allergies: string[];
    medications: string[];
    primaryTherapist: string;
  };
  appointments: {
    total: number;
    upcoming: number;
    noShows: number;
    lastVisit: string;
    nextAppointment: string | null;
  };
  billing: {
    outstandingBalance: number;
    totalBilled: number;
    insuranceClaims: number;
  };
  compliance: {
    consentForms: boolean;
    privacyPolicy: boolean;
    treatmentAgreement: boolean;
  };
}

const AdminPatientManagement: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [addPatientOpen, setAddPatientOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  // Therapist loading removed - now handled inside AddPatientForm component

  // Load patients from API
  const loadPatients = async () => {
    try {
      const response = await apiService.get('/patients/');
      const apiPatients = response.data || response;
      
      // Ensure apiPatients is an array
      const patientsArray = Array.isArray(apiPatients) ? apiPatients : [];
      
      // Transform API data to match frontend Patient interface
      const transformedPatients: Patient[] = patientsArray.map((p: any) => ({
        id: p.id.toString(),
        firstName: p.first_name || '[Decryption Error]',
        lastName: p.last_name || '[Decryption Error]',
        dateOfBirth: p.date_of_birth || '',
        age: p.date_of_birth ? new Date().getFullYear() - new Date(p.date_of_birth).getFullYear() : 0,
        phone: p.phone || '',
        email: p.email || '',
        address: [p.street_address, p.city, p.state, p.zip_code].filter(Boolean).join(', ') || '',
        emergencyContact: {
          name: p.emergency_contact_name || '',
          phone: p.emergency_contact_phone || '',
          relationship: p.emergency_contact_relationship || '',
        },
        insurance: {
          provider: p.insurance_provider || '',
          policyNumber: p.insurance_policy_number || '',
          groupNumber: p.insurance_group_number || '',
        },
        registration: {
          date: p.admission_date || p.created_at || '',
          status: p.status || 'active',
        },
        medical: {
          primaryDiagnosis: p.primary_diagnosis || '',
          secondaryDiagnoses: [],
          allergies: p.allergies ? p.allergies.split(',').map((a: string) => a.trim()).filter(Boolean) : [],
          medications: p.current_medications ? p.current_medications.split(',').map((m: string) => m.trim()).filter(Boolean) : [],
          primaryTherapist: p.primary_therapist_info ? `${p.primary_therapist_info.first_name} ${p.primary_therapist_info.last_name}` : '',
        },
        appointments: {
          total: 0,
          upcoming: 0,
          noShows: 0,
          lastVisit: '',
          nextAppointment: null,
        },
        billing: {
          outstandingBalance: 0,
          totalBilled: 0,
          insuranceClaims: 0,
        },
        compliance: {
          consentForms: true,
          privacyPolicy: true,
          treatmentAgreement: true,
        },
      }));

      setPatients(transformedPatients);
    } catch (error) {
      console.error('Error loading patients:', error);
    }
  };

  // Load patients on component mount
  useEffect(() => {
    console.log('🚀 useEffect running - loading patients...');
    loadPatients();
  }, []);

  // Filter and search logic
  useEffect(() => {
    let filtered = patients;

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(patient => patient.registration.status === statusFilter);
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(patient =>
        `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.medical.primaryDiagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.phone.includes(searchTerm)
      );
    }

    setFilteredPatients(filtered);
  }, [searchTerm, statusFilter, patients]);

  const handleViewDetails = (patient: Patient) => {
    setSelectedPatient(patient);
    setDetailsOpen(true);
    setTabValue(0);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, patientId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedPatientId(patientId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedPatientId(null);
  };

  const handleStatusChange = (patientId: string, newStatus: Patient['registration']['status']) => {
    setPatients(prev => prev.map(patient =>
      patient.id === patientId
        ? { ...patient, registration: { ...patient.registration, status: newStatus } }
        : patient
    ));
    handleMenuClose();
  };

  const handleAddPatient = async (formData: PatientFormData) => {
    console.log('handleAddPatient called with:', formData);
    
    try {
      // Map gender to backend format (M, F, O, P)
      const genderMap: { [key: string]: string } = {
        'male': 'M',
        'female': 'F',
        'other': 'O',
        'prefer not to say': 'P',
      };
      const mappedGender = genderMap[formData.gender.toLowerCase()] || 'P';
      
      // Prepare data for API (matching backend Patient model fields)
      const patientData = {
        // Personal information
        first_name_write: formData.firstName,
        last_name_write: formData.lastName,
        middle_name_write: '',
        email_write: formData.email,
        phone_write: formData.phone,
        phone_secondary_write: '',
        date_of_birth: formData.dateOfBirth?.toISOString().split('T')[0] || '',
        gender: mappedGender,
        
        // Address
        street_address_write: formData.address.street,
        city_write: formData.address.city,
        state: formData.address.state,
        zip_code_write: formData.address.zipCode,
        
        // Emergency contact
        emergency_contact_name_write: formData.emergencyContact.name,
        emergency_contact_phone_write: formData.emergencyContact.phone,
        emergency_contact_relationship_write: formData.emergencyContact.relationship,
        
        // Medical information (Patient model fields only)
        allergies: formData.medical.allergies.join(', '),
        medications: formData.medical.medications.join(', '), // Changed from current_medications
        
        // Care team - primary_therapist is optional, will be assigned when scheduling first appointment
        primary_therapist: formData.medical.primaryTherapist || null,
        
        // Administrative (required fields)
        admission_date: new Date().toISOString().split('T')[0], // Required field - default to today
        status: 'active',
        
        // Portal access flag
        create_portal_access: true, // Auto-create user account and send welcome email
      };
      
      // Note: Insurance is a separate model (InsuranceInformation) and will need to be created separately
      // Note: primary_diagnosis doesn't exist in Patient model - removed

      // Create patient via API using apiService (auto token refresh)
      console.log('Sending patient data to API:', patientData);
      const response = await apiService.post('/patients/', patientData);
      
      // Check if the API request was actually successful
      if (!response || response.success === false) {
        // Log full response for debugging
        console.error('Full error response:', JSON.stringify(response, null, 2));
        
        // Try to extract meaningful error message
        let errorMessage = 'Failed to create patient';
        if (response?.errors && Array.isArray(response.errors) && response.errors.length > 0) {
          errorMessage = response.errors.join(', ');
        } else if (response?.message) {
          errorMessage = response.message;
        } else if (response?.data) {
          // Sometimes errors are in response.data
          errorMessage = JSON.stringify(response.data);
        }
        
        console.error('Patient creation failed:', errorMessage);
        setSuccessMessage(`Failed to add patient: ${errorMessage}`);
        setShowSuccess(true);
        return;
      }
      
      const createdPatient = response.data || response;
      
      console.log('Patient created successfully:', createdPatient);
      console.log('create_portal_access flag:', patientData.create_portal_access);

      // Refresh patient list from API
      await loadPatients();
      
      // Reset pagination and filters
      setPage(1);
      setSearchTerm('');
      setStatusFilter('all');
      
      setSuccessMessage(`Patient ${formData.firstName} ${formData.lastName} has been added successfully! A welcome email with portal credentials has been sent to ${formData.email}`);
      setShowSuccess(true);
      
    } catch (error: any) {
      console.error('Error creating patient:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Unknown error';
      setSuccessMessage(`Failed to add patient: ${errorMessage}`);
      setShowSuccess(true);
    }
  };

  const getStatusColor = (status: Patient['registration']['status']) => {
    switch (status) {
      case 'active': return 'success';
      case 'pending': return 'warning';
      case 'suspended': return 'error';
      case 'inactive': return 'default';
      default: return 'default';
    }
  };

  const getComplianceIcon = (patient: Patient) => {
    const total = 3;
    const completed = Object.values(patient.compliance).filter(Boolean).length;
    
    if (completed === total) return <CheckCircle color="success" />;
    if (completed === 0) return <Warning color="error" />;
    return <Warning color="warning" />;
  };

  // Calculate statistics
  const totalPatients = patients.length;
  const activePatients = patients.filter(p => p.registration.status === 'active').length;
  const pendingPatients = patients.filter(p => p.registration.status === 'pending').length;
  const suspendedPatients = patients.filter(p => p.registration.status === 'suspended').length;
  const totalOutstanding = patients.reduce((sum, p) => sum + p.billing.outstandingBalance, 0);
  const complianceIssues = patients.filter(p => !Object.values(p.compliance).every(Boolean)).length;

  // Pagination
  const startIndex = (page - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedPatients = filteredPatients.slice(startIndex, endIndex);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Patient Management - Admin
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<Download />}>
            Export
          </Button>
          <Button variant="outlined" startIcon={<Upload />}>
            Import
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

      {/* Statistics Overview */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="primary">{totalPatients}</Typography>
              <Typography variant="body2" color="text.secondary">Total</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="success.main">{activePatients}</Typography>
              <Typography variant="body2" color="text.secondary">Active</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="warning.main">{pendingPatients}</Typography>
              <Typography variant="body2" color="text.secondary">Pending</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="error.main">{suspendedPatients}</Typography>
              <Typography variant="body2" color="text.secondary">Suspended</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="info.main">${totalOutstanding.toFixed(0)}</Typography>
              <Typography variant="body2" color="text.secondary">Outstanding</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Badge badgeContent={complianceIssues} color="error">
                <Typography variant="h4" color="warning.main">{complianceIssues}</Typography>
              </Badge>
              <Typography variant="body2" color="text.secondary">Compliance</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters and Search */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search by name, email, phone, or diagnosis..."
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
            <FormControl fullWidth>
              <InputLabel>Status Filter</InputLabel>
              <Select
                value={statusFilter}
                label="Status Filter"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="suspended">Suspended</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setPage(1);
              }}
            >
              Reset Filters
            </Button>
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
                <TableCell>Contact</TableCell>
                <TableCell>Registration</TableCell>
                <TableCell>Medical Info</TableCell>
                <TableCell>Appointments</TableCell>
                <TableCell>Billing</TableCell>
                <TableCell>Compliance</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedPatients.map((patient) => (
                <TableRow key={patient.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2">
                          {patient.firstName} {patient.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Age: {patient.age} • ID: {patient.id}
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
                  <TableCell>
                    <Chip
                      label={patient.registration.status}
                      color={getStatusColor(patient.registration.status) as any}
                      size="small"
                      sx={{ mb: 0.5 }}
                    />
                    <Typography variant="caption" display="block" color="text.secondary">
                      {new Date(patient.registration.date).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      {patient.medical.primaryDiagnosis}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Therapist: {patient.medical.primaryTherapist}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">
                        Total: {patient.appointments.total} 
                        {patient.appointments.noShows > 0 && (
                          <Chip 
                            label={`${patient.appointments.noShows} No-shows`} 
                            size="small" 
                            color="warning" 
                            sx={{ ml: 1 }} 
                          />
                        )}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Next: {patient.appointments.nextAppointment || 'Not scheduled'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography 
                      variant="body2" 
                      color={patient.billing.outstandingBalance > 0 ? 'error.main' : 'text.primary'}
                      sx={{ fontWeight: 'medium' }}
                    >
                      ${patient.billing.outstandingBalance.toFixed(2)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Total: ${patient.billing.totalBilled.toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    {getComplianceIcon(patient)}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleViewDetails(patient)}
                    >
                      <Visibility />
                    </IconButton>
                    <IconButton size="small" color="info">
                      <Edit />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuClick(e, patient.id)}
                    >
                      <MoreVert />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <Pagination
            count={Math.ceil(filteredPatients.length / rowsPerPage)}
            page={page}
            onChange={(_, newPage) => setPage(newPage)}
            color="primary"
          />
        </Box>
      </Paper>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleStatusChange(selectedPatientId!, 'active')}>
          <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
          <ListItemText>Activate Patient</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange(selectedPatientId!, 'suspended')}>
          <ListItemIcon><Block color="error" /></ListItemIcon>
          <ListItemText>Suspend Patient</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem>
          <ListItemIcon><Message /></ListItemIcon>
          <ListItemText>Send Message</ListItemText>
        </MenuItem>
        <MenuItem>
          <ListItemIcon><Schedule /></ListItemIcon>
          <ListItemText>Schedule Appointment</ListItemText>
        </MenuItem>
        <MenuItem>
          <ListItemIcon><AttachMoney /></ListItemIcon>
          <ListItemText>View Billing</ListItemText>
        </MenuItem>
        <MenuItem>
          <ListItemIcon><Print /></ListItemIcon>
          <ListItemText>Print Summary</ListItemText>
        </MenuItem>
      </Menu>

      {/* Patient Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              {selectedPatient?.firstName.charAt(0)}{selectedPatient?.lastName.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="h6">
                {selectedPatient?.firstName} {selectedPatient?.lastName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Patient ID: {selectedPatient?.id} • Admin View
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
            <Tab icon={<Person />} label="Overview" />
            <Tab icon={<MedicalServices />} label="Medical" />
            <Tab icon={<Schedule />} label="Appointments" />
            <Tab icon={<AttachMoney />} label="Billing" />
            <Tab icon={<Security />} label="Compliance" />
            <Tab icon={<History />} label="Activity Log" />
          </Tabs>

          {/* Overview Tab */}
          {tabValue === 0 && selectedPatient && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      <AccountCircle sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Personal Information
                    </Typography>
                    <Typography><strong>Full Name:</strong> {selectedPatient.firstName} {selectedPatient.lastName}</Typography>
                    <Typography><strong>Date of Birth:</strong> {new Date(selectedPatient.dateOfBirth).toLocaleDateString()}</Typography>
                    <Typography><strong>Age:</strong> {selectedPatient.age}</Typography>
                    <Typography><strong>Registration Status:</strong> 
                      <Chip 
                        label={selectedPatient.registration.status} 
                        color={getStatusColor(selectedPatient.registration.status) as any}
                        size="small" 
                        sx={{ ml: 1 }}
                      />
                    </Typography>
                    <Typography><strong>Registration Date:</strong> {new Date(selectedPatient.registration.date).toLocaleDateString()}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      <Phone sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Contact Information
                    </Typography>
                    <Typography><strong>Phone:</strong> {selectedPatient.phone}</Typography>
                    <Typography><strong>Email:</strong> {selectedPatient.email}</Typography>
                    <Typography><strong>Address:</strong> {selectedPatient.address}</Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      <ContactEmergency sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Emergency Contact
                    </Typography>
                    <Typography><strong>Name:</strong> {selectedPatient.emergencyContact.name}</Typography>
                    <Typography><strong>Phone:</strong> {selectedPatient.emergencyContact.phone}</Typography>
                    <Typography><strong>Relationship:</strong> {selectedPatient.emergencyContact.relationship}</Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      <LocalHospital sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Insurance Information
                    </Typography>
                    <Typography><strong>Provider:</strong> {selectedPatient.insurance.provider}</Typography>
                    <Typography><strong>Policy Number:</strong> {selectedPatient.insurance.policyNumber}</Typography>
                    <Typography><strong>Group Number:</strong> {selectedPatient.insurance.groupNumber}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Medical Tab */}
          {tabValue === 1 && selectedPatient && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      <Psychology sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Primary Diagnosis & Treatment
                    </Typography>
                    <Typography sx={{ mb: 2 }}><strong>Primary Diagnosis:</strong> {selectedPatient.medical.primaryDiagnosis}</Typography>
                    <Typography sx={{ mb: 2 }}><strong>Primary Therapist:</strong> {selectedPatient.medical.primaryTherapist}</Typography>
                    
                    <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Secondary Diagnoses:</Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                      {selectedPatient.medical.secondaryDiagnoses.map((diagnosis, index) => (
                        <Chip key={index} label={diagnosis} size="small" />
                      ))}
                    </Box>

                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Current Medications:</Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                      {selectedPatient.medical.medications.map((medication, index) => (
                        <Chip key={index} label={medication} size="small" color="primary" />
                      ))}
                    </Box>

                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Allergies:</Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {selectedPatient.medical.allergies.length > 0 ? (
                        selectedPatient.medical.allergies.map((allergy, index) => (
                          <Chip key={index} label={allergy} size="small" color="error" />
                        ))
                      ) : (
                        <Typography color="text.secondary">No known allergies</Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Appointments Tab */}
          {tabValue === 2 && selectedPatient && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      <Schedule sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Appointment History & Statistics
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6} md={3}>
                        <Typography variant="h4" color="primary">{selectedPatient.appointments.total}</Typography>
                        <Typography variant="body2" color="text.secondary">Total Appointments</Typography>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Typography variant="h4" color="success.main">{selectedPatient.appointments.upcoming}</Typography>
                        <Typography variant="body2" color="text.secondary">Upcoming</Typography>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Typography variant="h4" color="error.main">{selectedPatient.appointments.noShows}</Typography>
                        <Typography variant="body2" color="text.secondary">No-Shows</Typography>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Typography variant="body1"><strong>Last Visit:</strong></Typography>
                        <Typography variant="body2">{selectedPatient.appointments.lastVisit}</Typography>
                      </Grid>
                    </Grid>
                    <Box sx={{ mt: 2 }}>
                      <Typography><strong>Next Appointment:</strong> {selectedPatient.appointments.nextAppointment || 'Not scheduled'}</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Billing Tab */}
          {tabValue === 3 && selectedPatient && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      <AttachMoney sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Billing Summary
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <Typography 
                          variant="h4" 
                          color={selectedPatient.billing.outstandingBalance > 0 ? 'error.main' : 'success.main'}
                        >
                          ${selectedPatient.billing.outstandingBalance.toFixed(2)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">Outstanding Balance</Typography>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Typography variant="h4" color="primary">${selectedPatient.billing.totalBilled.toFixed(2)}</Typography>
                        <Typography variant="body2" color="text.secondary">Total Billed</Typography>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Typography variant="h4" color="info.main">{selectedPatient.billing.insuranceClaims}</Typography>
                        <Typography variant="body2" color="text.secondary">Pending Claims</Typography>
                      </Grid>
                    </Grid>
                    {selectedPatient.billing.outstandingBalance > 0 && (
                      <Alert severity="warning" sx={{ mt: 2 }}>
                        <AlertTitle>Outstanding Balance</AlertTitle>
                        This patient has an outstanding balance that requires attention.
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Compliance Tab */}
          {tabValue === 4 && selectedPatient && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      <Security sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Compliance & Legal Documents
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          {selectedPatient.compliance.consentForms ? 
                            <CheckCircle color="success" /> : 
                            <Warning color="error" />
                          }
                          <Typography>Consent Forms</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          {selectedPatient.compliance.privacyPolicy ? 
                            <CheckCircle color="success" /> : 
                            <Warning color="error" />
                          }
                          <Typography>Privacy Policy</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          {selectedPatient.compliance.treatmentAgreement ? 
                            <CheckCircle color="success" /> : 
                            <Warning color="error" />
                          }
                          <Typography>Treatment Agreement</Typography>
                        </Box>
                      </Grid>
                    </Grid>
                    {!Object.values(selectedPatient.compliance).every(Boolean) && (
                      <Alert severity="error" sx={{ mt: 2 }}>
                        <AlertTitle>Compliance Issues</AlertTitle>
                        This patient has incomplete compliance documentation that must be addressed.
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Activity Log Tab */}
          {tabValue === 5 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      <History sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Recent Activity Log
                    </Typography>
                    <Typography color="text.secondary">
                      Activity log functionality would be implemented here showing patient interactions, 
                      status changes, billing updates, and administrative actions.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
          <Button variant="contained" color="primary">Edit Patient</Button>
        </DialogActions>
      </Dialog>

      {/* Add Patient Form */}
      <AddPatientForm
        open={addPatientOpen}
        onClose={() => setAddPatientOpen(false)}
        onSubmit={handleAddPatient}
      />

      {/* Success Notification */}
      <Snackbar
        open={showSuccess}
        autoHideDuration={6000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="success" onClose={() => setShowSuccess(false)}>
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminPatientManagement;