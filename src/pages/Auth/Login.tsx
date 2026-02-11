import React, { useState } from 'react';
import {
  Container,
  Paper,
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Link,
  Divider,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';

const validationSchema = yup.object({
  username: yup
    .string()
    .required('Username is required')
    .min(3, 'Username must be at least 3 characters'),
  password: yup
    .string()
    .min(12, 'Password must be at least 12 characters')
    .required('Password is required'),
});

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPasswordChangeDialog, setShowPasswordChangeDialog] = useState(false);
  const { login } = useAuth();
  const { showError, showSuccess } = useNotification();
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: {
      username: '',
      password: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        const success = await login(values.username, values.password);
        
        if (success) {
          // Check if user needs to change password
          const userStr = localStorage.getItem('user');
          if (userStr) {
            const user = JSON.parse(userStr);
            if (user.must_change_password) {
              // Show popup dialog instead of redirecting immediately
              setShowPasswordChangeDialog(true);
              return;
            }
          }
          
          // Redirect to appropriate dashboard after successful login
          showSuccess('Login successful! Redirecting to dashboard...');
          setTimeout(() => {
            navigate('/dashboard');
          }, 1000);
        } else {
          showError('Invalid username or password. Please try again.');
        }
      } catch (error) {
        showError('Login failed. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 3,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            maxWidth: 400,
            borderRadius: 2,
          }}
        >
          {/* Header */}
          <Box textAlign="center" mb={4}>
            <Typography variant="h4" component="h1" gutterBottom color="primary">
              SafeHaven EHR
            </Typography>
            <Typography variant="h6" component="h2" color="text.secondary">
              Secure EHR Login
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              HIPAA-Compliant Electronic Health Records
            </Typography>
          </Box>

          {/* Security Notice */}
          <Alert severity="info" sx={{ mb: 3 }}>
            This is a secure healthcare system. All access is monitored and logged for HIPAA compliance.
          </Alert>

          {/* Login Form */}
          <form onSubmit={formik.handleSubmit}>
            <TextField
              fullWidth
              id="username"
              name="username"
              label="Username"
              type="text"
              value={formik.values.username}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.username && Boolean(formik.errors.username)}
              helperText={formik.touched.username && formik.errors.username}
              margin="normal"
              autoComplete="username"
              autoFocus
            />
            
            <TextField
              fullWidth
              id="password"
              name="password"
              label="Password"
              type="password"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.password && Boolean(formik.errors.password)}
              helperText={formik.touched.password && formik.errors.password}
              margin="normal"
              autoComplete="current-password"
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  color="primary"
                />
              }
              label="Remember me on this device"
              sx={{ mt: 1, mb: 2 }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 2, mb: 2, py: 1.5 }}
            >
              {loading ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <Divider sx={{ my: 3 }} />

          {/* Additional Actions */}
          <Box textAlign="center">
            <Link href="#" variant="body2" sx={{ display: 'block', mb: 1 }}>
              Forgot your password?
            </Link>
            <Link href="#" variant="body2">
              Need help accessing your account?
            </Link>
          </Box>

          {/* Footer */}
          <Box mt={4} textAlign="center">
            <Typography variant="caption" color="text.secondary">
              Protected by HIPAA compliance measures
            </Typography>
          </Box>
        </Paper>
      </Box>

      {/* Password Change Required Dialog */}
      <Dialog
        open={showPasswordChangeDialog}
        onClose={() => {}} // Prevent closing by clicking outside
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h5" component="span" color="warning.main">
            ⚠️ Password Change Required
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <strong>Security Notice:</strong> You are using a temporary password.
          </Alert>
          <Typography variant="body1" paragraph>
            For your security, you must change your temporary password before accessing the system.
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Your new password must:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 2 }}>
            <Typography component="li" variant="body2" color="text.secondary">
              Be at least 12 characters long
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              Contain uppercase and lowercase letters
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              Include at least one number
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              Be different from your temporary password
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={() => {
              setShowPasswordChangeDialog(false);
              navigate('/change-password');
            }}
          >
            Change Password Now
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Login;