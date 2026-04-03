import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  LinearProgress,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

interface IdleTimeoutDialogProps {
  open: boolean;
  secondsLeft: number;
  onStayLoggedIn: () => void;
  onLogoutNow: () => void;
}

/**
 * Warning dialog shown when the user has been idle for 5 minutes.
 * Displays a live countdown (3 minutes) and offers two actions.
 */
const IdleTimeoutDialog: React.FC<IdleTimeoutDialogProps> = ({
  open,
  secondsLeft,
  onStayLoggedIn,
  onLogoutNow,
}) => {
  const totalSeconds = 3 * 60; // must match WARNING_DURATION_SECONDS in hook
  const progress = (secondsLeft / totalSeconds) * 100;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeDisplay = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const isUrgent = secondsLeft <= 60;

  return (
    <Dialog
      open={open}
      // Prevent accidental dismissal by clicking outside
      disableEscapeKeyDown
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <AccessTimeIcon color={isUrgent ? 'error' : 'warning'} />
          <Typography variant="h6">Session Timeout Warning</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body1" gutterBottom>
          You have been inactive for 5 minutes. For your security, you will be
          automatically signed out in:
        </Typography>

        <Box textAlign="center" my={2}>
          <Typography
            variant="h3"
            fontWeight="bold"
            color={isUrgent ? 'error.main' : 'warning.main'}
          >
            {timeDisplay}
          </Typography>
        </Box>

        <LinearProgress
          variant="determinate"
          value={progress}
          color={isUrgent ? 'error' : 'warning'}
          sx={{ borderRadius: 1, height: 6 }}
        />

        <Typography variant="body2" color="text.secondary" mt={2}>
          Click <strong>Stay Logged In</strong> to continue your session.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button variant="outlined" color="inherit" onClick={onLogoutNow}>
          Log Out Now
        </Button>
        <Button variant="contained" color="primary" onClick={onStayLoggedIn} autoFocus>
          Stay Logged In
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default IdleTimeoutDialog;
