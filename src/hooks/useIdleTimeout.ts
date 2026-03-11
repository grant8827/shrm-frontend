import { useEffect, useRef, useState, useCallback } from 'react';

const IDLE_EVENTS = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart', 'click'];

interface UseIdleTimeoutOptions {
  /** Milliseconds of inactivity before the warning dialog appears */
  idleTimeout: number;
  /** Seconds the countdown runs before auto-logout */
  warningDuration: number;
  /** Called when the session should be terminated */
  onLogout: () => void;
  /** Set to false to disable the watcher (e.g. when not authenticated) */
  enabled: boolean;
}

export function useIdleTimeout({
  idleTimeout,
  warningDuration,
  onLogout,
  enabled,
}: UseIdleTimeoutOptions) {
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(warningDuration);

  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isWarningActiveRef = useRef(false);

  // Keep onLogout in a ref so timer callbacks always call the latest version
  const onLogoutRef = useRef(onLogout);
  onLogoutRef.current = onLogout;

  const clearIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }, []);

  const clearCountdown = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  const startCountdown = useCallback(() => {
    isWarningActiveRef.current = true;
    setShowWarning(true);
    setCountdown(warningDuration);

    let remaining = warningDuration;
    countdownIntervalRef.current = setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(countdownIntervalRef.current!);
        countdownIntervalRef.current = null;
        isWarningActiveRef.current = false;
        setShowWarning(false);
        onLogoutRef.current();
      }
    }, 1000);
  }, [warningDuration, clearCountdown]); // eslint-disable-line react-hooks/exhaustive-deps

  const startIdleTimer = useCallback(() => {
    clearIdleTimer();
    idleTimerRef.current = setTimeout(() => {
      startCountdown();
    }, idleTimeout);
  }, [idleTimeout, clearIdleTimer, startCountdown]);

  /** User clicked "Stay Logged In" — reset everything */
  const handleStayLoggedIn = useCallback(() => {
    clearCountdown();
    isWarningActiveRef.current = false;
    setShowWarning(false);
    setCountdown(warningDuration);
    startIdleTimer();
  }, [clearCountdown, warningDuration, startIdleTimer]);

  /** User clicked "Log Out" — terminate immediately */
  const handleLogout = useCallback(() => {
    clearIdleTimer();
    clearCountdown();
    isWarningActiveRef.current = false;
    setShowWarning(false);
    onLogoutRef.current();
  }, [clearIdleTimer, clearCountdown]);

  useEffect(() => {
    if (!enabled) {
      clearIdleTimer();
      clearCountdown();
      isWarningActiveRef.current = false;
      setShowWarning(false);
      return;
    }

    startIdleTimer();

    const handleActivity = () => {
      // Only reset the idle timer while the warning dialog is NOT showing.
      // Once the warning is up, only the dialog buttons can dismiss it.
      if (!isWarningActiveRef.current) {
        startIdleTimer();
      }
    };

    IDLE_EVENTS.forEach(event =>
      window.addEventListener(event, handleActivity, { passive: true })
    );

    return () => {
      clearIdleTimer();
      clearCountdown();
      IDLE_EVENTS.forEach(event => window.removeEventListener(event, handleActivity));
    };
  }, [enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  return { showWarning, countdown, handleStayLoggedIn, handleLogout };
}
