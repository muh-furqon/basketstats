import React from 'react';
import { Activity, ShieldCheck, Sun, Moon, CloudUpload, BarChart2, LayoutDashboard, TrendingUp } from 'lucide-react';

export default function Header({
  activeView,
  setActiveView,
  currentGame,
  wakeLock,
  onOpenSyncModal,
  syncStatus
}) {
  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* Brand Logo & Name */}
        <div
          onClick={() => setActiveView('dashboard')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <Activity className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-1.5 leading-none">
              Basket<span className="text-amber-400">Ballistic</span>
            </h1>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest leading-tight">Courtside Stats & Rapport</p>
          </div>
        </div>

        {/* View Switcher Navigation */}
        <nav className="flex items-center bg-slate-950/90 p-1 rounded-2xl border border-slate-800 text-xs font-bold">
          <button
            onClick={() => setActiveView('dashboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
              activeView === 'dashboard'
                ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Matches</span>
          </button>

          {currentGame && (
            <>
              <button
                onClick={() => setActiveView('courtside')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                  activeView === 'courtside'
                    ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Courtside</span>
              </button>

              <button
                onClick={() => setActiveView('boxscore')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                  activeView === 'boxscore'
                    ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Team Rapport</span>
              </button>
            </>
          )}
        </nav>

        {/* Right Utility Tools */}
        <div className="flex items-center gap-2">
          {/* Wake Lock Toggle */}
          {wakeLock.isSupported && (
            <button
              onClick={wakeLock.toggleWakeLock}
              title={wakeLock.isActive ? 'Screen Wake Lock Active' : 'Enable Screen Wake Lock'}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                wakeLock.isActive
                  ? 'bg-amber-500/10 border-amber-500/50 text-amber-400 shadow-sm shadow-amber-500/10'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              {wakeLock.isActive ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span className="hidden md:inline">Screen ON</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4" />
                  <span className="hidden md:inline">Wake Lock</span>
                </>
              )}
            </button>
          )}

          {/* Sync Sheets */}
          <button
            onClick={onOpenSyncModal}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
              syncStatus === 'synced'
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/40 text-amber-400 hover:bg-amber-500/20'
            }`}
          >
            {syncStatus === 'synced' ? (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">Synced</span>
              </>
            ) : (
              <>
                <CloudUpload className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Sync Sheets</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
