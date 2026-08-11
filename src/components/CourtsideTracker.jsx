import React, { useState, useMemo } from 'react';
import { RotateCcw, ArrowLeft, Play, Pause, Zap, CheckCircle2, AlertTriangle, ShieldCheck, Clock, Sparkles, Flag, Lock, TrendingUp } from 'lucide-react';
import { addPlayByPlayEvent, undoLastEvent, updateGameQuarter, updateGameStatus, calculateBoxScore } from '../db/services';
import { useMatchClock } from '../hooks/useMatchClock';
import AssistModal from './AssistModal';

export default function CourtsideTracker({ game, players, events, onEventsUpdated, onExitTracker, onOpenRapport }) {
  const [selectedTeam, setSelectedTeam] = useState('teamA');
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [assistModalOpen, setAssistModalOpen] = useState(false);
  const [pendingScorer, setPendingScorer] = useState(null);
  const [pendingShotType, setPendingShotType] = useState(null);

  // Match clock hook
  const {
    isRunning,
    toggleTimer,
    playedSecondsMap,
    onCourtPlayerIds,
    toggleOnCourt
  } = useMatchClock(players);

  // Compute live scores and stats
  const boxScores = useMemo(() => calculateBoxScore(players, events), [players, events]);

  const teamAPlayers = useMemo(() => players.filter((p) => p.teamId === 'teamA'), [players]);
  const teamBPlayers = useMemo(() => players.filter((p) => p.teamId === 'teamB'), [players]);

  const activeTeamPlayers = selectedTeam === 'teamA' ? teamAPlayers : teamBPlayers;

  // Total scores per team
  const teamAScore = useMemo(() => {
    return boxScores
      .filter((p) => p.teamId === 'teamA')
      .reduce((sum, p) => sum + p.PTS, 0);
  }, [boxScores]);

  const teamBScore = useMemo(() => {
    return boxScores
      .filter((p) => p.teamId === 'teamB')
      .reduce((sum, p) => sum + p.PTS, 0);
  }, [boxScores]);

  // Selected player object
  const selectedPlayer = useMemo(() => {
    return players.find((p) => p.id === selectedPlayerId);
  }, [players, selectedPlayerId]);

  const isMatchFinished = game.status === 'finished';
  const isNotStarted = game.status === 'not_started';

  const handleStartMatch = async () => {
    await updateGameStatus(game.id, 'ongoing');
    if (!isRunning) {
      toggleTimer();
    }
    onEventsUpdated();
  };

  const handleFinishMatch = async () => {
    if (confirm('Are you sure you want to finish this match? Once finished, the score and stats will be finalized.')) {
      await updateGameStatus(game.id, 'finished');
      if (isRunning) {
        toggleTimer();
      }
      onEventsUpdated();
      if (onOpenRapport) {
        onOpenRapport(game.id);
      }
    }
  };

  const handleAction = async (eventType) => {
    if (isMatchFinished) {
      alert('This match is finished and locked!');
      return;
    }

    if (!selectedPlayerId) {
      alert('Please select a player from the roster first!');
      return;
    }

    if (eventType === '2PT_MAKE' || eventType === '3PT_MAKE') {
      setPendingScorer(selectedPlayer);
      setPendingShotType(eventType);
      setAssistModalOpen(true);
      return;
    }

    await addPlayByPlayEvent({
      gameId: game.id,
      quarter: game.currentQuarter || 1,
      teamId: selectedTeam,
      playerId: selectedPlayerId,
      eventType
    });

    onEventsUpdated();
  };

  const handleAssistSelected = async (assistPlayerId) => {
    if (!pendingScorer || !pendingShotType) return;

    await addPlayByPlayEvent({
      gameId: game.id,
      quarter: game.currentQuarter || 1,
      teamId: pendingScorer.teamId,
      playerId: pendingScorer.id,
      eventType: pendingShotType,
      assistPlayerId
    });

    setAssistModalOpen(false);
    setPendingScorer(null);
    setPendingShotType(null);
    onEventsUpdated();
  };

  const handleUndo = async () => {
    if (isMatchFinished) return;
    await undoLastEvent(game.id);
    onEventsUpdated();
  };

  const handleQuarterChange = async (q) => {
    await updateGameQuarter(game.id, q);
    onEventsUpdated();
  };

  const formatTime = (totalSec = 0) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  // Recent play-by-play events
  const recentEvents = useMemo(() => {
    const playerMap = {};
    players.forEach((p) => {
      playerMap[p.id] = p;
    });

    return [...events]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10)
      .map((ev) => {
        const p = playerMap[ev.playerId] || {};
        const assistP = ev.assistPlayerId ? playerMap[ev.assistPlayerId] : null;
        return {
          ...ev,
          playerName: p.name || 'Unknown',
          jerseyNumber: p.jerseyNumber || '',
          position: p.position || '',
          assistPlayerName: assistP ? assistP.name : null,
          assistJersey: assistP ? assistP.jerseyNumber : null
        };
      });
  }, [events, players]);

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-5 space-y-4">
      {/* 1. Header Bar & Match Lifecycle Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4">
        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <button
            onClick={onExitTracker}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 text-xs font-bold transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          {/* Lifecycle Action Buttons: Start Match vs Finish Match vs Finished Badge */}
          <div className="flex items-center gap-2">
            {isNotStarted ? (
              <button
                onClick={handleStartMatch}
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition-all active:scale-95 animate-bounce"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>Start Match</span>
              </button>
            ) : isMatchFinished ? (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 border border-slate-800 text-slate-400 rounded-xl text-xs font-bold">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Match Finished & Locked</span>
                </span>
                <button
                  onClick={() => onOpenRapport && onOpenRapport(game.id)}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl text-xs shadow-md shadow-amber-500/20"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>View Team Rapport</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {/* Timer Play/Pause */}
                <button
                  onClick={toggleTimer}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                    isRunning
                      ? 'bg-amber-500 text-slate-950 shadow-md animate-pulse'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {isRunning ? <Pause className="w-3.5 h-3.5 fill-slate-950" /> : <Play className="w-3.5 h-3.5 fill-emerald-400" />}
                  <span>{isRunning ? 'Clock Running' : 'Pause Clock'}</span>
                </button>

                {/* Finish Match Button */}
                <button
                  onClick={handleFinishMatch}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/50 rounded-xl text-xs font-black transition-all active:scale-95"
                >
                  <Flag className="w-3.5 h-3.5 text-red-400" />
                  <span>Finish Match</span>
                </button>
              </div>
            )}
          </div>

          {/* Quarter Pills */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {[1, 2, 3, 4, 'OT'].map((q, idx) => {
              const qVal = typeof q === 'number' ? q : 5;
              const isSelected = (game.currentQuarter || 1) === qVal;
              return (
                <button
                  key={idx}
                  disabled={isMatchFinished}
                  onClick={() => handleQuarterChange(qVal)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {typeof q === 'number' ? `Q${q}` : q}
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Scoreboard */}
        <div className="flex items-center justify-between gap-4 px-2">
          {/* Team A */}
          <div className="flex-1 text-center sm:text-left flex flex-col sm:flex-row items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-xl shadow-lg">
              A
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white leading-none">{game.teamA}</h2>
              <div className="text-4xl sm:text-5xl font-black text-amber-400 font-mono-stats mt-1">
                {teamAScore}
              </div>
            </div>
          </div>

          <div className="text-slate-600 font-black text-xl">VS</div>

          {/* Team B */}
          <div className="flex-1 text-center sm:text-right flex flex-col sm:flex-row-reverse items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 font-black text-xl shadow-lg">
              B
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white leading-none">{game.teamB}</h2>
              <div className="text-4xl sm:text-5xl font-black text-orange-400 font-mono-stats mt-1">
                {teamBScore}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Roster Select & 6-Min Rule Indicators (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-4 shadow-xl">
          {/* Team Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800">
            <button
              onClick={() => {
                setSelectedTeam('teamA');
                setSelectedPlayerId(null);
              }}
              className={`py-2.5 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 ${
                selectedTeam === 'teamA'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="truncate">{game.teamA}</span>
            </button>

            <button
              onClick={() => {
                setSelectedTeam('teamB');
                setSelectedPlayerId(null);
              }}
              className={`py-2.5 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 ${
                selectedTeam === 'teamB'
                  ? 'bg-orange-500 text-slate-950 shadow-lg shadow-orange-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="truncate">{game.teamB}</span>
            </button>
          </div>

          {/* Roster Cards with 6-Min Indicators */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
              <span>Roster & Tournament Minutes</span>
              <span className="text-[10px] text-amber-400">Min 6m in Q1-Q3</span>
            </div>

            <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
              {activeTeamPlayers.map((player) => {
                const isSelected = selectedPlayerId === player.id;
                const isOnCourt = onCourtPlayerIds.includes(player.id);
                const playedSec = playedSecondsMap[player.id] || 0;
                const isFulfilled = playedSec >= 360;
                const isQuarter4 = (game.currentQuarter || 1) >= 4;
                const isPenaltyRisk = isQuarter4 && !isFulfilled;
                const progressPct = Math.min(100, Math.round((playedSec / 360) * 100));

                return (
                  <div
                    key={player.id}
                    className={`p-3 rounded-2xl border transition-all space-y-2.5 ${
                      isSelected
                        ? 'bg-slate-800 border-amber-500 ring-2 ring-amber-500/30 shadow-lg'
                        : isPenaltyRisk
                        ? 'bg-red-950/20 border-red-500/60'
                        : isFulfilled
                        ? 'bg-emerald-950/20 border-emerald-500/40'
                        : 'bg-slate-950/80 border-slate-800/90'
                    }`}
                  >
                    {/* Top row */}
                    <div className="flex items-center justify-between gap-2">
                      <div
                        onClick={() => setSelectedPlayerId(player.id)}
                        className="flex items-center gap-2.5 cursor-pointer flex-1"
                      >
                        <div
                          className={`w-9 h-9 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          #{player.jerseyNumber}
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white text-sm leading-tight">{player.name}</span>
                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                              {player.position || 'G'}
                            </span>
                          </div>

                          <div className="text-[11px] font-semibold text-slate-400 mt-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>{formatTime(playedSec)} / 6m</span>
                          </div>
                        </div>
                      </div>

                      {/* Right actions: Sub In/Out */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          disabled={isMatchFinished}
                          onClick={() => toggleOnCourt(player.id)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                            isOnCourt
                              ? 'bg-emerald-500 text-slate-950 shadow-sm'
                              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {isOnCourt ? 'On Court' : 'Bench'}
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar & Rule Compliance Indicators */}
                    <div className="space-y-1 pt-1 border-t border-slate-800/80">
                      <div className="flex items-center justify-between text-[10px] font-bold">
                        {isFulfilled ? (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>6m Rule Met (Compliant)</span>
                          </span>
                        ) : isPenaltyRisk ? (
                          <span className="text-red-400 flex items-center gap-1 font-black animate-pulse">
                            <AlertTriangle className="w-3 h-3 text-red-400" />
                            <span>Q4 Penalty Risk! Under 6m</span>
                          </span>
                        ) : (
                          <span className="text-slate-400">
                            Tournament Min: {progressPct}%
                          </span>
                        )}

                        <span className="text-slate-400 font-mono">{formatTime(playedSec)}</span>
                      </div>

                      <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className={`h-full transition-all duration-300 ${
                            isFulfilled
                              ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50'
                              : isPenaltyRisk
                              ? 'bg-red-500 shadow-sm shadow-red-500/50 animate-pulse'
                              : 'bg-gradient-to-r from-amber-500 to-orange-500'
                          }`}
                          style={{ width: `${progressPct}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Action Pad & Live Feed (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Active Target Banner & Undo */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-bold uppercase">Active Target:</span>
              {selectedPlayer ? (
                <span className="text-xs font-black text-amber-400 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/30 flex items-center gap-1.5">
                  <span>#{selectedPlayer.jerseyNumber} {selectedPlayer.name}</span>
                  <span className="text-[10px] text-amber-300/80">({selectedPlayer.position || 'G'})</span>
                </span>
              ) : (
                <span className="text-xs font-semibold text-red-400 italic">Select a player from left panel</span>
              )}
            </div>

            <button
              onClick={handleUndo}
              disabled={events.length === 0 || isMatchFinished}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 transition-all active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Undo</span>
            </button>
          </div>

          {/* Action Pad Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <button
              disabled={isMatchFinished}
              onClick={() => handleAction('2PT_MAKE')}
              className="p-3.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/50 disabled:opacity-40 rounded-2xl flex flex-col items-center justify-center transition-all active:scale-95 group"
            >
              <span className="text-xl font-black text-emerald-400">+2 PT</span>
              <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">Made Field Goal</span>
            </button>

            <button
              disabled={isMatchFinished}
              onClick={() => handleAction('2PT_MISS')}
              className="p-3.5 bg-red-600/15 hover:bg-red-600/25 border border-red-500/40 disabled:opacity-40 rounded-2xl flex flex-col items-center justify-center transition-all active:scale-95"
            >
              <span className="text-lg font-extrabold text-red-400">2PT Miss</span>
              <span className="text-[10px] font-bold text-red-300 uppercase tracking-wider">FG Missed</span>
            </button>

            <button
              disabled={isMatchFinished}
              onClick={() => handleAction('3PT_MAKE')}
              className="p-3.5 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/50 disabled:opacity-40 rounded-2xl flex flex-col items-center justify-center transition-all active:scale-95 group"
            >
              <span className="text-xl font-black text-amber-400">+3 PT</span>
              <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">3-Pointer Made</span>
            </button>

            <button
              disabled={isMatchFinished}
              onClick={() => handleAction('3PT_MISS')}
              className="p-3.5 bg-red-600/15 hover:bg-red-600/25 border border-red-500/40 disabled:opacity-40 rounded-2xl flex flex-col items-center justify-center transition-all active:scale-95"
            >
              <span className="text-lg font-extrabold text-red-400">3PT Miss</span>
              <span className="text-[10px] font-bold text-red-300 uppercase tracking-wider">3P Missed</span>
            </button>

            <button
              disabled={isMatchFinished}
              onClick={() => handleAction('FT_MAKE')}
              className="p-3.5 bg-teal-600/20 hover:bg-teal-600/30 border border-teal-500/50 disabled:opacity-40 rounded-2xl flex flex-col items-center justify-center transition-all active:scale-95"
            >
              <span className="text-xl font-black text-teal-400">+1 FT</span>
              <span className="text-[10px] font-bold text-teal-300 uppercase tracking-wider">Free Throw</span>
            </button>

            <button
              disabled={isMatchFinished}
              onClick={() => handleAction('FT_MISS')}
              className="p-3.5 bg-red-600/15 hover:bg-red-600/25 border border-red-500/40 disabled:opacity-40 rounded-2xl flex flex-col items-center justify-center transition-all active:scale-95"
            >
              <span className="text-lg font-extrabold text-red-400">FT Miss</span>
              <span className="text-[10px] font-bold text-red-300 uppercase tracking-wider">FT Missed</span>
            </button>

            <button
              disabled={isMatchFinished}
              onClick={() => handleAction('REB_DEF')}
              className="p-3 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 disabled:opacity-40 rounded-xl flex flex-col items-center justify-center transition-all active:scale-95"
            >
              <span className="text-sm font-extrabold text-blue-300">Def Rebound</span>
            </button>

            <button
              disabled={isMatchFinished}
              onClick={() => handleAction('REB_OFF')}
              className="p-3 bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 disabled:opacity-40 rounded-xl flex flex-col items-center justify-center transition-all active:scale-95"
            >
              <span className="text-sm font-extrabold text-cyan-300">Off Rebound</span>
            </button>

            <button
              disabled={isMatchFinished}
              onClick={() => handleAction('ASSIST')}
              className="p-3 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 disabled:opacity-40 rounded-xl flex flex-col items-center justify-center transition-all active:scale-95"
            >
              <span className="text-sm font-extrabold text-indigo-300">Assist</span>
            </button>

            <button
              disabled={isMatchFinished}
              onClick={() => handleAction('STEAL')}
              className="p-3 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 disabled:opacity-40 rounded-xl flex flex-col items-center justify-center transition-all active:scale-95"
            >
              <span className="text-sm font-extrabold text-purple-300">Steal</span>
            </button>

            <button
              disabled={isMatchFinished}
              onClick={() => handleAction('BLOCK')}
              className="p-3 bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/40 disabled:opacity-40 rounded-xl flex flex-col items-center justify-center transition-all active:scale-95"
            >
              <span className="text-sm font-extrabold text-violet-300">Block</span>
            </button>

            <button
              disabled={isMatchFinished}
              onClick={() => handleAction('TURNOVER')}
              className="p-3 bg-rose-950/60 hover:bg-rose-900/60 border border-rose-700/50 disabled:opacity-40 rounded-xl flex flex-col items-center justify-center transition-all active:scale-95"
            >
              <span className="text-sm font-extrabold text-rose-300">Turnover</span>
            </button>

            <button
              disabled={isMatchFinished}
              onClick={() => handleAction('FOUL')}
              className="p-3 bg-red-950/80 hover:bg-red-900/80 border border-red-600/60 disabled:opacity-40 rounded-xl flex flex-col items-center justify-center col-span-2 sm:col-span-1 transition-all active:scale-95"
            >
              <span className="text-sm font-black text-red-400">Personal Foul</span>
            </button>
          </div>

          {/* Live Play Feed */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-3 shadow-xl">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2">
              <span>Live Play Feed</span>
              <span>{events.length} Total Events</span>
            </div>

            {recentEvents.length === 0 ? (
              <div className="text-center py-4 text-slate-500 text-xs font-semibold">
                No events recorded yet. Select a player and tap an action button above!
              </div>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {recentEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="flex items-center justify-between bg-slate-950/70 border border-slate-800/80 px-3 py-2 rounded-xl text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded font-extrabold">
                        Q{ev.quarter}
                      </span>
                      <span className="font-extrabold text-slate-200">
                        #{ev.jerseyNumber} {ev.playerName}
                      </span>
                      <span className="text-slate-500 text-[11px]">({ev.position})</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-black text-amber-400 uppercase text-[11px]">
                        {ev.eventType.replace('_', ' ')}
                      </span>
                      {ev.assistPlayerName && (
                        <span className="text-[10px] text-slate-400 italic">
                          (ast: #{ev.assistJersey} {ev.assistPlayerName})
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assist Selection Modal */}
      <AssistModal
        isOpen={assistModalOpen}
        scorer={pendingScorer}
        teamPlayers={pendingScorer ? (pendingScorer.teamId === 'teamA' ? teamAPlayers : teamBPlayers) : []}
        onSelectAssist={handleAssistSelected}
        onClose={() => setAssistModalOpen(false)}
      />
    </div>
  );
}
