import { useRef, useState, useCallback, useEffect } from 'react';

interface UseTelehealthMediaResult {
  localVideoRef: React.RefObject<HTMLVideoElement>;
  localStream: MediaStream | null;
  isCameraOn: boolean;
  isMicOn: boolean;
  mediaInitFailed: boolean;
  isRetryingMedia: boolean;
  startLocalMedia: () => Promise<MediaStream | null>;
  stopLocalMedia: () => void;
  toggleCamera: () => void;
  toggleMicrophone: () => void;
  retryMediaAccess: () => Promise<void>;
  refreshVideoConstraints: () => Promise<void>;
}

export const useTelehealthMedia = (
  onError: (message: string) => void
): UseTelehealthMediaResult => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [mediaInitFailed, setMediaInitFailed] = useState(false);
  const [isRetryingMedia, setIsRetryingMedia] = useState(false);

  const isMobileOrTablet = () => (
    /Mobi|Android|iPad|iPhone/i.test(navigator.userAgent) ||
    window.matchMedia('(pointer: coarse)').matches ||
    window.innerWidth < 1024
  );

  const buildOptimizedVideoConstraints = (): MediaTrackConstraints => {
    const mobileOrTablet = isMobileOrTablet();
    const isPortrait = window.innerHeight >= window.innerWidth;

    if (!mobileOrTablet) {
      return {
        facingMode: 'user',
        width: { ideal: 1280, max: 1920 },
        height: { ideal: 720, max: 1080 },
        aspectRatio: { ideal: 16 / 9 },
      };
    }

    return {
      facingMode: 'user',
      width: isPortrait ? { ideal: 480, max: 720 } : { ideal: 720, max: 1280 },
      height: isPortrait ? { ideal: 640, max: 1280 } : { ideal: 480, max: 720 },
      aspectRatio: { ideal: isPortrait ? 0.75 : 16 / 9 },
      frameRate: { ideal: 24, max: 30 },
    };
  };

  const buildOptimizedAudioConstraints = (): MediaTrackConstraints => ({
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  });

  // Force strict cleanup on unmount
  useEffect(() => {
    return () => {
      stopLocalMedia();
    };
  }, []);

  const getMediaStreamWithFallback = async (): Promise<MediaStream> => {
    const attempts: MediaStreamConstraints[] = [
      {
        video: buildOptimizedVideoConstraints(),
        audio: buildOptimizedAudioConstraints(),
      },
      {
        video: { facingMode: 'user' },
        audio: buildOptimizedAudioConstraints(),
      },
      { video: true, audio: true },
      { video: true, audio: false },
    ];

    let lastError: Error | unknown = null;

    for (let index = 0; index < attempts.length; index += 1) {
      try {
        console.log(`[useTelehealthMedia] getUserMedia attempt ${index + 1}/${attempts.length}`);
        const stream = await navigator.mediaDevices.getUserMedia(attempts[index]);
        console.log(`[useTelehealthMedia] getUserMedia succeeded on attempt ${index + 1}`);
        return stream;
      } catch (error: any) {
        lastError = error;
        console.warn(`[useTelehealthMedia] getUserMedia attempt ${index + 1} failed:`, error?.name, error?.message);

        // Permission denial should not retry with other constraints
        if (error?.name === 'NotAllowedError' || error?.name === 'SecurityError') {
          throw error;
        }
      }
    }

    throw lastError;
  };

  const startLocalMedia = useCallback(async (): Promise<MediaStream | null> => {
    try {
      setMediaInitFailed(false);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        onError('Camera/microphone is not supported in this browser. Please use a modern browser.');
        return null;
      }

      // Check for secure context (HTTPS or localhost)
      if (!window.isSecureContext) {
        onError('Camera/microphone requires HTTPS. Please access this page using https://');
        return null;
      }

      const stream = await getMediaStreamWithFallback();
      localStreamRef.current = stream;
      setLocalStream(stream);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true;
        
        try {
          await localVideoRef.current.play();
        } catch (playError) {
          console.warn('[useTelehealthMedia] Local preview autoplay blocked:', playError);
        }
      }

      setIsCameraOn(true);
      setIsMicOn(true);

      return stream;

    } catch (error: any) {
      console.error('[useTelehealthMedia] Media error:', error);
      setMediaInitFailed(true);
      
      let errorMessage = `Failed to access camera/microphone: ${error?.message || 'Unknown error'}`;

      if (error?.name === 'NotAllowedError') {
        errorMessage = 'Camera/microphone permission denied. Please allow updated permissions in browser settings.';
      } else if (error?.name === 'NotFoundError') {
        errorMessage = 'No camera or microphone found. Please connect a device and try again.';
      } else if (error?.name === 'NotReadableError') {
        errorMessage = 'Camera/microphone is in use by another app. Please close other apps using the camera.';
      } else if (error?.name === 'OverconstrainedError') {
        errorMessage = 'Camera constraints not supported. Please refresh and try again.';
      } else if (error?.name === 'NotSupportedError') {
        errorMessage = 'Camera/microphone not supported in this context (requires HTTPS).';
      }

      onError(errorMessage);
      return null;
    }
  }, [onError]);

  const stopLocalMedia = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
  }, []);

  const refreshVideoConstraints = useCallback(async () => {
    const videoTrack = localStreamRef.current?.getVideoTracks()[0];
    if (!videoTrack || videoTrack.readyState !== 'live') return;

    try {
      await videoTrack.applyConstraints(buildOptimizedVideoConstraints());
    } catch (error) {
      console.warn('[useTelehealthMedia] Could not apply orientation video constraints:', error);
    }
  }, []);

  useEffect(() => {
    let timeoutId: number | undefined;
    const handleViewportChange = () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        void refreshVideoConstraints();
      }, 250);
    };

    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('orientationchange', handleViewportChange);

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('orientationchange', handleViewportChange);
    };
  }, [refreshVideoConstraints]);

  const retryMediaAccess = useCallback(async () => {
    try {
      setIsRetryingMedia(true);
      setMediaInitFailed(false);
      await startLocalMedia();
    } catch (err) {
      console.error('[useTelehealthMedia] Retry failed', err);
    } finally {
      setIsRetryingMedia(false);
    }
  }, [startLocalMedia]);

  const toggleCamera = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOn(videoTrack.enabled);
      }
    }
  }, []);

  const toggleMicrophone = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    }
  }, []);

  return {
    localVideoRef,
    localStream,
    isCameraOn,
    isMicOn,
    mediaInitFailed,
    isRetryingMedia,
    startLocalMedia,
    stopLocalMedia,
    toggleCamera,
    toggleMicrophone,
    retryMediaAccess,
    refreshVideoConstraints,
  };
};
