import React, { useState } from 'react';
import {
  Container,
  Paper,
  Box,
  Button,
  Typography,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  OutlinedInput,
  InputAdornment,
  IconButton,
  FormHelperText,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Invalid or missing reset token. Please request a new reset link.');
      return;
    }
    if (newPassword.length < 10) {
      setError('Password must be at least 10 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const base = ((import.meta.env.VITE_API_BASE_URL as string | undefined) || 'http://localhost:8000').replace(/\/api\/?$/, '');
      await axios.post(`${base}/api/auth/password-reset`, { token, newPassword });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Reset failed. The link may have expired. Please request a new one.');
    } finally {
      setLoading(false);
    }
  };

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
        <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 400, borderRadius: 2 }}>
          <Box textAlign="center" mb={3}>
            <Typography variant="h4" color="primary" gutterBottom>
              SafeHaven EHR
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Set New Password
            </Typography>
          </Box>

          {success ? (
            <Box textAlign="center">
              <Alert severity="success" sx={{ mb: 3 }}>
                Your password has been reset successfully.
              </Alert>
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={() => navigate('/login')}
              >
                Go to Login
              </Button>
            </Box>
          ) : (
            <form onSubmit={handleSubmit}>
              {!token && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  No reset token found. Please use the link from your email.
                </Alert>
              )}
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
              )}

              <FormControl fullWidth margin="normal" variant="outlined">
                <InputLabel htmlFor="reset-new-password">New Password</InputLabel>
                <OutlinedInput
                  id="reset-new-password"
                  type={showNewPwd ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  label="New Password"
                  autoFocus
                  endAdornment={
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowNewPwd(p => !p)} edge="end">
                        {showNewPwd ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  }
                />
                <FormHelperText>Minimum 10 characters</FormHelperText>
              </FormControl>
              <FormControl fullWidth margin="normal" variant="outlined">
                <InputLabel htmlFor="reset-confirm-password">Confirm New Password</InputLabel>
                <OutlinedInput
                  id="reset-confirm-password"
                  type={showConfirmPwd ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading || !token}
                sx={{ mt: 3 }}
              >
                {loading ? <CircularProgress size={22} /> : 'Reset Password'}
              </Button>

              <Button
                fullWidth
                variant="text"
                sx={{ mt: 1 }}
                onClick={() => navigate('/login')}
              >
                Back to Login
              </Button>
            </form>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default ResetPassword;
