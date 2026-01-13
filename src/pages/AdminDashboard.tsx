import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Badge,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  PersonAdd as PersonAddIcon,
  Settings as SettingsIcon,
  Assessment as ReportsIcon,
  AttachMoney as BillingIcon,
  SecurityOutlined as SecurityIcon,
  Notifications as NotificationsIcon,
  Edit as EditIcon,
  Lock as LockIcon,
  MoreVert as MoreIcon,
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Schedule,
  Group,
} from '@mui/icons-material';
import { User, Patient, Appointment } from '../types';
import ReportsSection from '../components/Reports/ReportsSection';
// import { authService } from '../../services/authService_new';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalPatients: number;
  activePatients: number;
  todayAppointments: number;
  pendingAppointments: number;
  totalRevenue: number;
  monthlyRevenue: number;
  systemAlerts: number;
  failedLogins: number;
}

interface AdminDashboardProps {
  user: User;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user: _user }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [_users, _setUsers] = useState<User[]>([]);
  const [_patients, _setPatients] = useState<Patient[]>([]);
  const [_appointments, _setAppointments] = useState<Appointment[]>([]);
  const [_selectedUser, _setSelectedUser] = useState<User | null>(null);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Simulate API calls - replace with actual API calls
      const mockStats: DashboardStats = {
        totalUsers: 45,
        activeUsers: 42,
        totalPatients: 150,
        activePatients: 138,
        todayAppointments: 23,
        pendingAppointments: 8,
        totalRevenue: 125000,
        monthlyRevenue: 18500,
        systemAlerts: 3,
        failedLogins: 12,
      };

      setStats(mockStats);

      // Load recent users, patients, appointments
      // These would be actual API calls in production
      _setUsers([]);
      _setPatients([]);
      _setAppointments([]);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (action: string, _userId: string) => {
    try {
      switch (action) {
        case 'edit':
          // Open edit user dialog
          break;
        case 'lock':
          // Lock user account
          break;
        case 'unlock':
          // Unlock user account
          break;
        case 'delete':
          // Deactivate user account
          break;
      }
      await loadDashboardData();
    } catch (err: any) {
      setError(err.message || 'Action failed');
    }
  };

  const StatsCard: React.FC<{
    title: string;
    value: number | string;
    trend?: 'up' | 'down';
    trendValue?: string;
    color?: 'primary' | 'secondary' | 'error' | 'warning' | 'success';
    icon: React.ReactNode;
  }> = ({ title, value, trend, trendValue, color = 'primary', icon }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ bgcolor: `${color}.main`, mr: 2 }}>
            {icon}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" component="div">
              {title}
            </Typography>
            <Typography variant="h4" color={`${color}.main`}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </Typography>
          </Box>
        </Box>
        {trend && trendValue && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {trend === 'up' ? (
              <TrendingUp color="success" fontSize="small" />
            ) : (
              <TrendingDown color="error" fontSize="small" />
            )}
            <Typography
              variant="body2"
              color={trend === 'up' ? 'success.main' : 'error.main'}
              sx={{ ml: 0.5 }}
            >
              {trendValue}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const DashboardOverview = () => (
    <Box>
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Users"
            value={stats?.totalUsers || 0}
            trend="up"
            trendValue="+5 this week"
            color="primary"
            icon={<PeopleIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Active Patients"
            value={stats?.activePatients || 0}
            trend="up"
            trendValue="+12 this month"
            color="success"
            icon={<Group />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Today's Appointments"
            value={stats?.todayAppointments || 0}
            color="warning"
            icon={<Schedule />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Monthly Revenue"
            value={`$${(stats?.monthlyRevenue || 0).toLocaleString()}`}
            trend="up"
            trendValue="+8.5%"
            color="success"
            icon={<BillingIcon />}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* System Alerts */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '400px' }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <NotificationsIcon sx={{ mr: 1 }} />
              System Alerts
              <Badge badgeContent={stats?.systemAlerts || 0} color="error" sx={{ ml: 2 }}>
                <Box />
              </Badge>
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <Warning color="warning" />
                </ListItemIcon>
                <ListItemText
                  primary="Database backup overdue"
                  secondary="Last backup: 2 days ago"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <SecurityIcon color="error" />
                </ListItemIcon>
                <ListItemText
                  primary="Multiple failed login attempts"
                  secondary={`${stats?.failedLogins || 0} attempts in the last hour`}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircle color="success" />
                </ListItemIcon>
                <ListItemText
                  primary="HIPAA audit completed"
                  secondary="No issues found"
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '400px' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Recent Activity
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <PersonAddIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="New user registered"
                  secondary="Dr. Sarah Johnson - Therapist"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <EditIcon color="info" />
                </ListItemIcon>
                <ListItemText
                  primary="Patient record updated"
                  secondary="John Doe - Insurance information"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <Schedule color="warning" />
                </ListItemIcon>
                <ListItemText
                  primary="Appointment scheduled"
                  secondary="8 new appointments today"
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  const UserManagement = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">User Management</Typography>
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={() => setUserDialogOpen(true)}
        >
          Add User
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Last Login</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {/* Mock data - replace with actual user data */}
            <TableRow>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ mr: 2 }}>JD</Avatar>
                  <Box>
                    <Typography variant="subtitle2">John Doe</Typography>
                    <Typography variant="body2" color="textSecondary">
                      john.doe@theracare.com
                    </Typography>
                  </Box>
                </Box>
              </TableCell>
              <TableCell>
                <Chip label="Admin" color="primary" size="small" />
              </TableCell>
              <TableCell>
                <Chip label="Active" color="success" size="small" />
              </TableCell>
              <TableCell>2 hours ago</TableCell>
              <TableCell>
                <IconButton onClick={() => handleUserAction('edit', '1')}>
                  <EditIcon />
                </IconButton>
                <IconButton onClick={() => handleUserAction('lock', '1')}>
                  <LockIcon />
                </IconButton>
                <IconButton>
                  <MoreIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const SystemSettings = () => (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>
        System Settings
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Security Settings
            </Typography>
            <List>
              <ListItem>
                <ListItemText primary="Require password change" secondary="Force users to change passwords every 90 days" />
                <ListItemSecondaryAction>
                  <Switch defaultChecked />
                </ListItemSecondaryAction>
              </ListItem>
              <ListItem>
                <ListItemText primary="Two-factor authentication" secondary="Require 2FA for all admin users" />
                <ListItemSecondaryAction>
                  <Switch defaultChecked />
                </ListItemSecondaryAction>
              </ListItem>
              <ListItem>
                <ListItemText primary="Session timeout" secondary="Automatically log out inactive users" />
                <ListItemSecondaryAction>
                  <Switch defaultChecked />
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              System Maintenance
            </Typography>
            <List>
              <ListItem>
                <ListItemText primary="Database backup" secondary="Last backup: 6 hours ago" />
                <ListItemSecondaryAction>
                  <Button variant="outlined" size="small">
                    Backup Now
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>
              <ListItem>
                <ListItemText primary="System logs" secondary="View and download system logs" />
                <ListItemSecondaryAction>
                  <Button variant="outlined" size="small">
                    View Logs
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>
              <ListItem>
                <ListItemText primary="Audit trail" secondary="HIPAA compliance audit logs" />
                <ListItemSecondaryAction>
                  <Button variant="outlined" size="small">
                    Generate Report
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  const tabPanels = [
    { label: 'Dashboard', icon: <DashboardIcon />, component: <DashboardOverview /> },
    { label: 'Users', icon: <PeopleIcon />, component: <UserManagement /> },
    { label: 'Settings', icon: <SettingsIcon />, component: <SystemSettings /> },
    { label: 'Reports', icon: <ReportsIcon />, component: <ReportsSection /> },
  ];

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Admin Dashboard
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_event: React.SyntheticEvent, newValue: number) => setActiveTab(newValue)}>
          {tabPanels.map((panel, index) => (
            <Tab
              key={index}
              icon={panel.icon}
              label={panel.label}
              iconPosition="start"
            />
          ))}
        </Tabs>
      </Box>

      {tabPanels[activeTab]?.component}

      {/* Add User Dialog */}
      <Dialog open={userDialogOpen} onClose={() => setUserDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New User</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Username"
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select label="Role">
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="therapist">Therapist</MenuItem>
                  <MenuItem value="staff">Staff</MenuItem>
                  <MenuItem value="client">Client</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Phone Number"
                variant="outlined"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDialogOpen(false)}>Cancel</Button>
          <Button variant="contained">Create User</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminDashboard;