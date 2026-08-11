import React from 'react';
import { UserCheck, X } from 'lucide-react';

export default function AssistModal({ isOpen, scorer, teamPlayers, onSelectAssist, onClose }) {
  if (!isOpen || !scorer) return null;

  // Filter out the scorer from potential assisters
  const assisters = (teamPlayers || []).filter((p) => p.id !== scorer.id);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-md w-full p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-slate-100">Record Assist</h3>
          </div>
          <button
            onClick={() => onSelectAssist(null)}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4 bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Scorer</span>
          <div className="text-base font-bold text-amber-400">
            #{scorer.jerseyNumber} {scorer.name}
          </div>
        </div>

        <p className="text-sm font-medium text-slate-300 mb-3">Select assisting teammate:</p>

        <div className="grid grid-cols-2 gap-2.5 max-h-56 overflow-y-auto mb-4 pr-1">
          {assisters.map((player) => (
            <button
              key={player.id}
              onClick={() => onSelectAssist(player.id)}
              className="flex items-center gap-3 p-3 bg-slate-800 hover:bg-amber-500/20 hover:border-amber-500/50 border border-slate-700 rounded-xl transition-all active:scale-95 text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 font-extrabold flex items-center justify-center text-sm">
                #{player.jerseyNumber}
              </div>
              <span className="font-semibold text-slate-200 text-sm truncate">{player.name}</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => onSelectAssist(null)}
          className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl border border-slate-700 transition-all active:scale-95 text-center text-sm"
        >
          Unassisted / Solo Play
        </button>
      </div>
    </div>
  );
}
