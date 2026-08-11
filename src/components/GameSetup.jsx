import React, { useState, useMemo } from 'react';
import { Plus, Play, Trash2, Trophy, ArrowRight, Zap, Clock, Search, BarChart2, Activity, Filter } from 'lucide-react';
import { deleteGame } from '../db/services';
import NewMatchModal from './NewMatchModal';

export default function GameSetup({ games = [], onSelectGame, onGameCreated, onOpenRapport }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredGames = useMemo(() => {
    return games.filter((g) => {
      const matchesFilter =
        filterStatus === 'all'
          ? true
          : filterStatus === 'ongoing'
          ? g.status === 'ongoing'
          : g.status === 'finished';

      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        g.teamA.toLowerCase().includes(query) ||
        g.teamB.toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [games, filterStatus, searchQuery]);

  const handleDelete = async (gameId, e) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this match and all recorded stats?')) {
      await deleteGame(gameId);
      onGameCreated(null); // trigger refresh
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-8">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="space-y-3 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-xs font-bold text-amber-400">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Courtside Basketball Analytics</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Basketball Match History & Live Tracker
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            Select a match to review detailed team rapport analytics, or start a new match to record real-time play-by-play courtside stats.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black rounded-2xl shadow-xl shadow-amber-500/25 flex items-center gap-3 transition-all active:scale-95 text-base shrink-0"
        >
          <Plus className="w-5 h-5 text-slate-950 stroke-[3]" />
          <span>Start New Match</span>
        </button>
      </div>

      {/* Matches History Section */}
      <div className="space-y-4">
        {/* Controls & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-black text-white flex items-center gap-2 px-2">
              <Clock className="w-5 h-5 text-amber-400" />
              Recorded Matches ({games.length})
            </h3>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2">
            {/* Search Input */}
            <div className="relative w-full sm:w-48">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search team..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold w-full sm:w-auto justify-center">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  filterStatus === 'all' ? 'bg-amber-500 text-slate-950 font-extrabold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterStatus('ongoing')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  filterStatus === 'ongoing' ? 'bg-emerald-500 text-slate-950 font-extrabold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Ongoing
              </button>
              <button
                onClick={() => setFilterStatus('finished')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  filterStatus === 'finished' ? 'bg-indigo-500 text-white font-extrabold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Finished
              </button>
            </div>
          </div>
        </div>

        {/* Match Cards List */}
        {!filteredGames || filteredGames.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
            <Trophy className="w-12 h-12 text-slate-700 mx-auto" />
            <div className="space-y-1">
              <h4 className="text-slate-300 font-bold text-lg">
                {searchQuery || filterStatus !== 'all' ? 'No matching games found' : 'No match history recorded yet'}
              </h4>
              <p className="text-slate-500 text-sm max-w-sm mx-auto">
                {searchQuery || filterStatus !== 'all'
                  ? 'Try clearing your search query or filter.'
                  : 'Click "Start New Match" above to set up team rosters and start tracking stats.'}
              </p>
            </div>
            {!searchQuery && filterStatus === 'all' && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-amber-500/20 inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4 text-slate-950 stroke-[3]" />
                Create First Match
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredGames.map((g) => (
              <div
                key={g.id}
                onClick={() => onSelectGame(g.id)}
                className="bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-amber-500/40 rounded-3xl p-5 cursor-pointer transition-all space-y-4 group relative shadow-xl"
              >
                {/* Header info */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">
                    {new Date(g.date).toLocaleDateString(undefined, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                        g.status === 'finished'
                          ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-400'
                          : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                      }`}
                    >
                      {g.status === 'finished' ? 'Finished' : 'Live Match'}
                    </span>

                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                        g.syncStatus === 'synced'
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                          : 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                      }`}
                    >
                      {g.syncStatus === 'synced' ? 'Synced' : 'Pending Sync'}
                    </span>

                    <button
                      onClick={(e) => handleDelete(g.id, e)}
                      className="text-slate-500 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete Match"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Match Teams Banner */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 flex items-center justify-between">
                  <div className="text-center flex-1">
                    <div className="text-lg font-black text-white">{g.teamA}</div>
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Home</span>
                  </div>

                  <div className="px-3">
                    <span className="text-xs font-black text-slate-500 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                      VS
                    </span>
                  </div>

                  <div className="text-center flex-1">
                    <div className="text-lg font-black text-white">{g.teamB}</div>
                    <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">Away</span>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-between pt-1 text-xs font-bold">
                  <span className="text-amber-400 group-hover:text-amber-300 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" />
                    <span>Open Tracker / Box Score</span>
                  </span>

                  <div className="w-7 h-7 rounded-xl bg-amber-500/10 group-hover:bg-amber-500 flex items-center justify-center text-amber-400 group-hover:text-slate-950 transition-all">
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Match Modal */}
      <NewMatchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onGameCreated={(newId) => {
          onGameCreated(newId);
          setIsModalOpen(false);
        }}
      />
    </div>
  );
}
