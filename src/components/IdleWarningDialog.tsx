import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  LinearProgress,
  Box,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

interface IdleWarningDialogProps {
  open: boolean;
  countdown: number;
  warningDuration: number;
  onStayLoggedIn: () => void;
  onLogout: () => void;
}

export function IdleWarningDialog({
  open,
  countdown,
  warningDuration,
  onStayLoggedIn,
  onLogout,
}: IdleWarningDialogProps) {
  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;
  const timeStr = `${minutes}:${String(seconds).padStart(2, '0')}`;
  const progress = Math.max(0, (countdown / warningDuration) * 100);
  const isUrgent = countdown <= 60;

  return (
    <Dialog
      open={open}
      disableEscapeKeyDown
      // Clicking backdrop = stay logged in
      onClose={onStayLoggedIn}
      PaperProps={{ sx: { minWidth: 360, borderRadius: 2 } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
        <AccessTimeIcon color={isUrgent ? 'error' : 'warning'} />
        Session Timeout Warning
      </DialogTitle>

      <DialogContent>
        <Typography variant="body1" gutterBottom>
          You've been inactive. Your session will expire in:
        </Typography>

        <Box sx={{ textAlign: 'center', my: 2 }}>
          <Typography
            variant="h2"
            fontWeight="bold"
            color={isUrgent ? 'error.main' : 'warning.main'}
          >
            {timeStr}
          </Typography>
        </Box>

        <LinearProgress
          variant="determinate"
          value={progress}
          color={isUrgent ? 'error' : 'warning'}
          sx={{ borderRadius: 1, height: 8 }}
        />

        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
          Click <strong>Stay Logged In</strong> to continue your session, or it will
          automatically log out when the timer reaches 0:00.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button variant="outlined" color="error" onClick={onLogout}>
          Log Out
        </Button>
        <Button variant="contained" color="primary" onClick={onStayLoggedIn} autoFocus>
          Stay Logged In
        </Button>
      </DialogActions>
    </Dialog>
  );
}
