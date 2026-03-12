import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import LockResetIcon from '@mui/icons-material/LockReset';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { apiClient } from '../../services/apiClient';

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <Container maxWidth="xs">
        <Box mt={10}>
          <Alert severity="error">
            Invalid or missing reset token. Please request a new password reset link.
          </Alert>
          <Button fullWidth variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/login')}>
            Back to Login
          </Button>
        </Box>
      </Container>
    );
  }

  const handleSubmit = async () => {
    setError('');
    if (!newPassword || !confirmPassword) {
      setError('Both fields are required.');
      return;
    }
    if (newPassword.length < 12) {
      setError('Password must be at least 12 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/api/auth/password-reset', { token, newPassword });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Invalid or expired link. Please request a new one.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xs">
      <Box
        mt={10}
        display="flex"
        flexDirection="column"
        alignItems="center"
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Box textAlign="center" mb={3}>
            {success ? (
              <CheckCircleOutlineIcon sx={{ fontSize: 56, color: 'success.main' }} />
            ) : (
              <LockResetIcon sx={{ fontSize: 56, color: 'primary.main' }} />
            )}
            <Typography variant="h5" mt={1}>
              {success ? 'Password Reset!' : 'Create New Password'}
            </Typography>
          </Box>

          {success ? (
            <>
              <Alert severity="success" sx={{ mb: 2 }}>
                Your password has been reset successfully. Redirecting to login…
              </Alert>
              <Button fullWidth variant="contained" onClick={() => navigate('/login')}>
                Go to Login
              </Button>
            </>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Enter your new password below. Must be at least 12 characters.
              </Typography>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              <TextField
                fullWidth
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Confirm New Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') void handleSubmit(); }}
                disabled={loading}
                sx={{ mb: 3 }}
              />
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={() => { void handleSubmit(); }}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={18} /> : null}
              >
                {loading ? 'Resetting…' : 'Reset Password'}
              </Button>
              <Button
                fullWidth
                variant="text"
                sx={{ mt: 1 }}
                onClick={() => navigate('/login')}
                disabled={loading}
              >
                Back to Login
              </Button>
            </>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default ResetPassword;
