import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Box,
} from '@mui/material';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import { apiClient } from '../services/apiClient';

interface ForgotPasswordDialogProps {
  open: boolean;
  onClose: () => void;
}

export const ForgotPasswordDialog: React.FC<ForgotPasswordDialogProps> = ({ open, onClose }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => {
    setEmail('');
    setSent(false);
    setError('');
    onClose();
  };

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await apiClient.post('/api/auth/password-reset-request', { email: email.trim() });
      setSent(true);
    } catch {
      // Still show success to prevent email enumeration
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>Reset Your Password</DialogTitle>
      <DialogContent>
        {sent ? (
          <Box textAlign="center" py={2}>
            <EmailOutlinedIcon sx={{ fontSize: 56, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>Check your email</Typography>
            <Typography variant="body2" color="text.secondary">
              If <strong>{email}</strong> is registered, you'll receive a password reset link
              within a few minutes. The link expires in 1 hour.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Don't see it? Check your spam folder.
            </Typography>
          </Box>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Enter the email address associated with your account and we'll send you a link to reset your password.
            </Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <TextField
              autoFocus
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void handleSubmit(); }}
              disabled={loading}
            />
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        {sent ? (
          <Button onClick={handleClose} variant="contained" fullWidth>Close</Button>
        ) : (
          <>
            <Button onClick={handleClose} disabled={loading}>Cancel</Button>
            <Button
              onClick={() => { void handleSubmit(); }}
              variant="contained"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} /> : null}
            >
              {loading ? 'Sending…' : 'Send Reset Link'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};
