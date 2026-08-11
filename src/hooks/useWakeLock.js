import { useState, useEffect, useCallback } from 'react';

export function useWakeLock() {
  const [isSupported, setIsSupported] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [wakeLockSentinel, setWakeLockSentinel] = useState(null);

  useEffect(() => {
    if ('wakeLock' in navigator) {
      setIsSupported(true);
    }
  }, []);

  const requestWakeLock = useCallback(async () => {
    if (!('wakeLock' in navigator)) return false;
    try {
      const sentinel = await navigator.wakeLock.request('screen');
      setWakeLockSentinel(sentinel);
      setIsActive(true);

      sentinel.addEventListener('release', () => {
        setIsActive(false);
        setWakeLockSentinel(null);
      });

      return true;
    } catch (err) {
      console.warn('Wake Lock request failed:', err);
      setIsActive(false);
      return false;
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockSentinel) {
      try {
        await wakeLockSentinel.release();
      } catch (err) {
        console.warn('Wake Lock release failed:', err);
      }
      setWakeLockSentinel(null);
      setIsActive(false);
    }
  }, [wakeLockSentinel]);

  const toggleWakeLock = useCallback(async () => {
    if (isActive) {
      await releaseWakeLock();
    } else {
      await requestWakeLock();
    }
  }, [isActive, requestWakeLock, releaseWakeLock]);

  // Re-acquire lock if tab visibility changes
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isActive && !wakeLockSentinel) {
        await requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isActive, wakeLockSentinel, requestWakeLock]);

  return { isSupported, isActive, requestWakeLock, releaseWakeLock, toggleWakeLock };
}
