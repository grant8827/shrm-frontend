import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Tab,
  Tabs,
  Divider,
  Avatar,
  IconButton,
  FormControl,
  InputLabel,
  OutlinedInput,
  InputAdornment,
} from '@mui/material';
import {
  Person,
  Notifications,
  Security,
  Camera,
  Save,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { apiClient } from '../../services/apiClient';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const TherapistSettings: React.FC = () => {
  const { state } = useAuth();
  const { showSuccess, showError } = useNotification();
  
  const [activeTab, setActiveTab] = useState(0);
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [pwdValues, setPwdValues] = useState({ current: '', newPwd: '', confirm: '' });
  const [profileData, setProfileData] = useState({
    firstName: state.user?.firstName || '',
    lastName: state.user?.lastName || '',
    email: state.user?.email || '',
    phone: '',
    jobTitle: '',
    bio: '',
    specializations: '',
  });

  // Load current profile from API on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const userId = state.user?.id;
        if (!userId) return;
        const response = await apiClient.get(`/api/users/current/`);
        const data = response.data;
        setProfileData(prev => ({
          ...prev,
          firstName: data.first_name || prev.firstName,
          lastName: data.last_name || prev.lastName,
          email: data.email || prev.email,
          phone: data.phone_number || '',
          jobTitle: data.job_title || '',
          bio: data.bio || '',
        }));
      } catch (error) {
        // silently fail – form still usable with defaults
      }
    };
    loadProfile();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    appointmentReminders: true,
    newPatientAlerts: true,
    messageAlerts: true,
  });

  const handleSaveProfile = async () => {
    try {
      const userId = state.user?.id;
      if (!userId) { showError('User ID not found'); return; }
      await apiClient.put(`/api/users/profile/`, {
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        email: profileData.email,
        phone_number: profileData.phone,
        job_title: profileData.jobTitle,
        bio: profileData.bio,
      });
      showSuccess('Profile updated successfully');
    } catch (error) {
      showError('Failed to update profile');
    }
  };

  const handleSaveNotifications = async () => {
    try {
      await apiClient.patch('/api/users/profile/', { notification_settings: notificationSettings });
      showSuccess('Notification settings updated successfully');
    } catch {
      showError('Failed to update notification settings');
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Settings
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          aria-label="settings tabs"
        >
          <Tab icon={<Person />} label="Profile" />
          <Tab icon={<Notifications />} label="Notifications" />
          <Tab icon={<Security />} label="Security" />
        </Tabs>
      </Paper>

      {/* Profile Tab */}
      <TabPanel value={activeTab} index={0}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Avatar
                sx={{ width: 100, height: 100, mr: 3 }}
                src=""
                alt={`${profileData.firstName} ${profileData.lastName}`}
              >
                {profileData.firstName.charAt(0)}{profileData.lastName.charAt(0)}
              </Avatar>
              <Box>
                <IconButton color="primary" component="label">
                  <Camera />
                  <input hidden accept="image/*" type="file" />
                </IconButton>
                <Typography variant="body2" color="text.secondary">
                  Upload new photo
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={profileData.firstName}
                  onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={profileData.lastName}
                  onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Job Title"
                  value={profileData.jobTitle}
                  onChange={(e) => setProfileData({ ...profileData, jobTitle: e.target.value })}
                  placeholder="e.g., Licensed Therapist, Clinical Psychologist..."
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Professional Bio"
                  value={profileData.bio}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                  placeholder="Tell us about your background and experience..."
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Specializations"
                  value={profileData.specializations}
                  onChange={(e) => setProfileData({ ...profileData, specializations: e.target.value })}
                  placeholder="e.g., Cognitive Behavioral Therapy, Trauma, Anxiety..."
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleSaveProfile}
              >
                Save Profile
              </Button>
            </Box>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Notifications Tab */}
      <TabPanel value={activeTab} index={1}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Notification Preferences
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Manage how and when you receive notifications
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationSettings.emailNotifications}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
                        emailNotifications: e.target.checked
                      })}
                    />
                  }
                  label="Email Notifications"
                />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                  Receive notifications via email
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationSettings.smsNotifications}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
                        smsNotifications: e.target.checked
                      })}
                    />
                  }
                  label="SMS Notifications"
                />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                  Receive notifications via text message
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" gutterBottom>
                  Alert Types
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationSettings.appointmentReminders}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
                        appointmentReminders: e.target.checked
                      })}
                    />
                  }
                  label="Appointment Reminders"
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationSettings.newPatientAlerts}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
                        newPatientAlerts: e.target.checked
                      })}
                    />
                  }
                  label="New Patient Assignments"
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationSettings.messageAlerts}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
                        messageAlerts: e.target.checked
                      })}
                    />
                  }
                  label="New Messages"
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleSaveNotifications}
              >
                Save Preferences
              </Button>
            </Box>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Security Tab */}
      <TabPanel value={activeTab} index={2}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Security Settings
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Manage your password and security preferences
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel htmlFor="thr-current-password">Current Password</InputLabel>
                  <OutlinedInput
                    id="thr-current-password"
                    type={showCurrentPwd ? 'text' : 'password'}
                    placeholder="Enter current password"
                    value={pwdValues.current}
                    onChange={(e) => setPwdValues(p => ({ ...p, current: e.target.value }))}
                    label="Current Password"
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowCurrentPwd(p => !p)} edge="end">
                          {showCurrentPwd ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    }
                  />
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel htmlFor="thr-new-password">New Password</InputLabel>
                  <OutlinedInput
                    id="thr-new-password"
                    type={showNewPwd ? 'text' : 'password'}
                    placeholder="Enter new password"
                    value={pwdValues.newPwd}
                    onChange={(e) => setPwdValues(p => ({ ...p, newPwd: e.target.value }))}
                    label="New Password"
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowNewPwd(p => !p)} edge="end">
                          {showNewPwd ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    }
                  />
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel htmlFor="thr-confirm-password">Confirm New Password</InputLabel>
                  <OutlinedInput
                    id="thr-confirm-password"
                    type={showConfirmPwd ? 'text' : 'password'}
                    placeholder="Re-enter new password"
                    value={pwdValues.confirm}
                    onChange={(e) => setPwdValues(p => ({ ...p, confirm: e.target.value }))}
                    label="Confirm New Password"
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowConfirmPwd(p => !p)} edge="end">
                          {showConfirmPwd ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    }
                  />
                </FormControl>
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="contained" startIcon={<Security />}>
                Update Password
              </Button>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>
              Two-Factor Authentication
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Add an extra layer of security to your account
            </Typography>
            <Button variant="outlined">
              Enable Two-Factor Authentication
            </Button>
          </CardContent>
        </Card>
      </TabPanel>
    </Box>
  );
};

export default TherapistSettings;
