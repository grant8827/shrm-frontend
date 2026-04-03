import { useEffect, useRef, useState, useCallback } from 'react';

// 5 minutes of inactivity before showing the warning
const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 300 000 ms

// 3-minute countdown after the warning appears
const WARNING_DURATION_SECONDS = 3 * 60; // 180 seconds

const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  'mousemove',
  'mousedown',
  'keydown',
  'touchstart',
  'scroll',
  'click',
];

interface UseIdleTimerReturn {
  showWarning: boolean;
  secondsLeft: number;
  resetTimer: () => void;
}

/**
 * Tracks user inactivity.
 * After IDLE_TIMEOUT_MS of no activity, sets showWarning = true and begins
 * a WARNING_DURATION_SECONDS countdown.  When the countdown reaches 0 the
 * provided onLogout callback is invoked.
 */
export function useIdleTimer(onLogout: () => void): UseIdleTimerReturn {
  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(WARNING_DURATION_SECONDS);

  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const secondsLeftRef = useRef(WARNING_DURATION_SECONDS);
  const onLogoutRef = useRef(onLogout);

  // Keep logout ref up to date without re-registering effects
  useEffect(() => {
    onLogoutRef.current = onLogout;
  }, [onLogout]);

  const stopCountdown = useCallback(() => {
    if (countdownIntervalRef.current !== null) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  const startCountdown = useCallback(() => {
    secondsLeftRef.current = WARNING_DURATION_SECONDS;
    setSecondsLeft(WARNING_DURATION_SECONDS);
    setShowWarning(true);

    stopCountdown();
    countdownIntervalRef.current = setInterval(() => {
      secondsLeftRef.current -= 1;
      setSecondsLeft(secondsLeftRef.current);

      if (secondsLeftRef.current <= 0) {
        stopCountdown();
        setShowWarning(false);
        onLogoutRef.current();
      }
    }, 1000);
  }, [stopCountdown]);

  const resetTimer = useCallback(() => {
    // Clear any existing idle timer
    if (idleTimerRef.current !== null) {
      clearTimeout(idleTimerRef.current);
    }

    // Clear any running countdown and hide the dialog
    stopCountdown();
    setShowWarning(false);
    secondsLeftRef.current = WARNING_DURATION_SECONDS;
    setSecondsLeft(WARNING_DURATION_SECONDS);

    // Start a fresh idle timer
    idleTimerRef.current = setTimeout(() => {
      startCountdown();
    }, IDLE_TIMEOUT_MS);
  }, [startCountdown, stopCountdown]);

  useEffect(() => {
    // Start the initial idle timer
    resetTimer();

    // Register activity listeners
    const handleActivity = () => {
      // Only reset when the warning is NOT showing — once the dialog is up
      // the user must explicitly click "Stay Logged In".
      if (!countdownIntervalRef.current) {
        resetTimer();
      }
    };

    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      // Cleanup on unmount (e.g. component logs out)
      if (idleTimerRef.current !== null) clearTimeout(idleTimerRef.current);
      stopCountdown();
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
    // resetTimer is stable; eslint-disable-next-line is intentional
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { showWarning, secondsLeft, resetTimer };
}
