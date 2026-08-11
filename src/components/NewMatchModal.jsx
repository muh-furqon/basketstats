import React, { useState } from 'react';
import { X, Plus, Trash2, Trophy, Play, Users, Sparkles, CheckCircle2 } from 'lucide-react';
import { createGame } from '../db/services';

const POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C'];

const DEFAULT_TEAM_A = [
  { name: 'LeBron James', jerseyNumber: '23', position: 'SF', isStarter: true },
  { name: 'Anthony Davis', jerseyNumber: '3', position: 'C', isStarter: true },
  { name: "D'Angelo Russell", jerseyNumber: '1', position: 'PG', isStarter: true },
  { name: 'Austin Reaves', jerseyNumber: '15', position: 'SG', isStarter: true },
  { name: 'Rui Hachimura', jerseyNumber: '28', position: 'PF', isStarter: true }
];

const DEFAULT_TEAM_B = [
  { name: 'Stephen Curry', jerseyNumber: '30', position: 'PG', isStarter: true },
  { name: 'Klay Thompson', jerseyNumber: '11', position: 'SG', isStarter: true },
  { name: 'Draymond Green', jerseyNumber: '23', position: 'PF', isStarter: true },
  { name: 'Andrew Wiggins', jerseyNumber: '22', position: 'SF', isStarter: true },
  { name: 'Kevon Looney', jerseyNumber: '5', position: 'C', isStarter: true }
];

export default function NewMatchModal({ isOpen, onClose, onGameCreated }) {
  const [activeTab, setActiveTab] = useState('teamA');
  const [teamAName, setTeamAName] = useState('Lakers');
  const [teamBName, setTeamBName] = useState('Warriors');
  const [teamARoster, setTeamARoster] = useState(DEFAULT_TEAM_A);
  const [teamBRoster, setTeamBRoster] = useState(DEFAULT_TEAM_B);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAddPlayer = (team) => {
    if (team === 'A') {
      setTeamARoster([...teamARoster, { name: '', jerseyNumber: '', position: 'PG', isStarter: false }]);
    } else {
      setTeamBRoster([...teamBRoster, { name: '', jerseyNumber: '', position: 'PG', isStarter: false }]);
    }
  };

  const handleUpdatePlayer = (team, index, field, value) => {
    if (team === 'A') {
      const updated = [...teamARoster];
      updated[index][field] = value;
      setTeamARoster(updated);
    } else {
      const updated = [...teamBRoster];
      updated[index][field] = value;
      setTeamBRoster(updated);
    }
  };

  const handleToggleStarter = (team, index) => {
    if (team === 'A') {
      const updated = [...teamARoster];
      updated[index].isStarter = !updated[index].isStarter;
      setTeamARoster(updated);
    } else {
      const updated = [...teamBRoster];
      updated[index].isStarter = !updated[index].isStarter;
      setTeamBRoster(updated);
    }
  };

  const handleRemovePlayer = (team, index) => {
    if (team === 'A') {
      setTeamARoster(teamARoster.filter((_, i) => i !== index));
    } else {
      setTeamBRoster(teamBRoster.filter((_, i) => i !== index));
    }
  };

  const handleLoadSample = () => {
    setTeamAName('Lakers');
    setTeamBName('Warriors');
    setTeamARoster(DEFAULT_TEAM_A);
    setTeamBRoster(DEFAULT_TEAM_B);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validA = teamARoster.filter((p) => p.name.trim() !== '');
    const validB = teamBRoster.filter((p) => p.name.trim() !== '');

    if (validA.length === 0 || validB.length === 0) {
      alert('Please add at least 1 player with a name for each team.');
      return;
    }

    setIsSubmitting(true);
    try {
      const gameId = await createGame({
        teamAName: teamAName.trim() || 'Team A',
        teamBName: teamBName.trim() || 'Team B',
        teamARoster: validA,
        teamBRoster: validB
      });

      onGameCreated(gameId);
      onClose();
    } catch (err) {
      console.error('Failed to create game:', err);
      alert('Error creating match. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">Create New Match</h3>
              <p className="text-xs font-semibold text-slate-400">Configure team names, positions & starting 5 on-court players</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLoadSample}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Demo Rosters</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Team Names Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-amber-400 uppercase tracking-wider block">Home Team Name</label>
              <input
                type="text"
                required
                value={teamAName}
                onChange={(e) => setTeamAName(e.target.value)}
                placeholder="e.g. Lakers"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white font-bold focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-orange-400 uppercase tracking-wider block">Away Team Name</label>
              <input
                type="text"
                required
                value={teamBName}
                onChange={(e) => setTeamBName(e.target.value)}
                placeholder="e.g. Warriors"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white font-bold focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Roster Switcher Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <button
              type="button"
              onClick={() => setActiveTab('teamA')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                activeTab === 'teamA'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {teamAName || 'Team A'} Roster ({teamARoster.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('teamB')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                activeTab === 'teamB'
                  ? 'bg-orange-500 text-slate-950 shadow-md shadow-orange-500/20'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {teamBName || 'Team B'} Roster ({teamBRoster.length})
            </button>
          </div>

          {/* Active Team Roster List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span>Player Roster & Starting On-Court Flag</span>
              <button
                type="button"
                onClick={() => handleAddPlayer(activeTab === 'teamA' ? 'A' : 'B')}
                className="text-amber-400 hover:underline flex items-center gap-1 font-bold text-xs"
              >
                <Plus className="w-4 h-4" /> Add Player
              </button>
            </div>

            <div className="space-y-2">
              {(activeTab === 'teamA' ? teamARoster : teamBRoster).map((player, idx) => (
                <div
                  key={idx}
                  className="flex flex-wrap sm:flex-nowrap items-center gap-2 p-2 bg-slate-950 border border-slate-800/80 rounded-2xl"
                >
                  <div className="w-16">
                    <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Jersey</label>
                    <input
                      type="text"
                      required
                      placeholder="#"
                      value={player.jerseyNumber}
                      onChange={(e) =>
                        handleUpdatePlayer(activeTab === 'teamA' ? 'A' : 'B', idx, 'jerseyNumber', e.target.value)
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-1.5 text-center font-black text-amber-400 text-sm"
                    />
                  </div>

                  <div className="flex-1 min-w-[140px]">
                    <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Player Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Stephen Curry"
                      value={player.name}
                      onChange={(e) =>
                        handleUpdatePlayer(activeTab === 'teamA' ? 'A' : 'B', idx, 'name', e.target.value)
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-bold text-sm"
                    />
                  </div>

                  <div className="w-20">
                    <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Position</label>
                    <select
                      value={player.position || 'PG'}
                      onChange={(e) =>
                        handleUpdatePlayer(activeTab === 'teamA' ? 'A' : 'B', idx, 'position', e.target.value)
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-1.5 text-amber-300 font-extrabold text-xs focus:outline-none"
                    >
                      {POSITIONS.map((pos) => (
                        <option key={pos} value={pos}>
                          {pos}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Starter / Bench Toggle Flag */}
                  <div className="pt-4">
                    <button
                      type="button"
                      onClick={() => handleToggleStarter(activeTab === 'teamA' ? 'A' : 'B', idx)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                        player.isStarter
                          ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      {player.isStarter ? 'Starter (On Court)' : 'Bench'}
                    </button>
                  </div>

                  <div className="pt-4">
                    {(activeTab === 'teamA' ? teamARoster : teamBRoster).length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePlayer(activeTab === 'teamA' ? 'A' : 'B', idx)}
                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-900 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="p-5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>{isSubmitting ? 'Creating Match...' : 'Launch Match Tracker'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
