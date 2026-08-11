import { useState, useEffect, useCallback } from 'react';

export function useMatchClock(initialPlayers = []) {
  const [isRunning, setIsRunning] = useState(false);
  const [playedSecondsMap, setPlayedSecondsMap] = useState({});
  const [onCourtPlayerIds, setOnCourtPlayerIds] = useState([]);

  // Initialize on-court players from starters or first 5
  useEffect(() => {
    if (initialPlayers.length > 0 && onCourtPlayerIds.length === 0) {
      const startersA = initialPlayers.filter((p) => p.teamId === 'teamA' && p.isStarter).map((p) => p.id);
      const startersB = initialPlayers.filter((p) => p.teamId === 'teamB' && p.isStarter).map((p) => p.id);

      const teamA = startersA.length > 0 ? startersA : initialPlayers.filter((p) => p.teamId === 'teamA').slice(0, 5).map((p) => p.id);
      const teamB = startersB.length > 0 ? startersB : initialPlayers.filter((p) => p.teamId === 'teamB').slice(0, 5).map((p) => p.id);

      setOnCourtPlayerIds([...teamA, ...teamB]);
    }
  }, [initialPlayers]);

  // Interval timer tick for on-court players
  useEffect(() => {
    let interval = null;
    if (isRunning) {
      interval = setInterval(() => {
        setPlayedSecondsMap((prev) => {
          const next = { ...prev };
          onCourtPlayerIds.forEach((id) => {
            next[id] = (next[id] || 0) + 1;
          });
          return next;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRunning, onCourtPlayerIds]);

  const toggleTimer = useCallback(() => {
    setIsRunning((prev) => !prev);
  }, []);

  const toggleOnCourt = useCallback((playerId) => {
    setOnCourtPlayerIds((prev) => {
      if (prev.includes(playerId)) {
        return prev.filter((id) => id !== playerId);
      } else {
        return [...prev, playerId];
      }
    });
  }, []);

  return {
    isRunning,
    toggleTimer,
    playedSecondsMap,
    onCourtPlayerIds,
    toggleOnCourt
  };
}
