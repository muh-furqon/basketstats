import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db/database';
import { useWakeLock } from './hooks/useWakeLock';
import Header from './components/Header';
import GameSetup from './components/GameSetup';
import CourtsideTracker from './components/CourtsideTracker';
import BoxScore from './components/BoxScore';
import SyncModal from './components/SyncModal';

export default function App() {
  const [activeView, setActiveView] = useState('dashboard'); // 'dashboard' | 'courtside' | 'boxscore'
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [syncModalOpen, setSyncModalOpen] = useState(false);

  const wakeLock = useWakeLock();

  // Reactive Dexie queries
  const games = useLiveQuery(() => db.games.orderBy('date').reverse().toArray(), []);

  const currentGame = useLiveQuery(
    () => (selectedGameId ? db.games.get(selectedGameId) : null),
    [selectedGameId]
  );

  const gamePlayers = useLiveQuery(
    () => (selectedGameId ? db.players.where('gameId').equals(selectedGameId).toArray() : []),
    [selectedGameId]
  );

  const gameEvents = useLiveQuery(
    () => (selectedGameId ? db.playByPlay.where('gameId').equals(selectedGameId).toArray() : []),
    [selectedGameId]
  );

  // Auto-select latest game if available on initial load
  useEffect(() => {
    if (games && games.length > 0 && !selectedGameId) {
      setSelectedGameId(games[0].id);
    }
  }, [games, selectedGameId]);

  const handleSelectGame = (gameId) => {
    setSelectedGameId(gameId);
    setActiveView('courtside');
  };

  const handleOpenRapport = (gameId) => {
    setSelectedGameId(gameId);
    setActiveView('boxscore');
  };

  const handleGameCreated = (newGameId) => {
    if (newGameId) {
      setSelectedGameId(newGameId);
      setActiveView('courtside');
    } else {
      setSelectedGameId(null);
      setActiveView('dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Outfit',sans-serif]">
      <Header
        activeView={activeView}
        setActiveView={setActiveView}
        currentGame={currentGame}
        wakeLock={wakeLock}
        onOpenSyncModal={() => setSyncModalOpen(true)}
        syncStatus={currentGame ? currentGame.syncStatus : 'synced'}
      />

      <main className="flex-1 pb-10">
        {activeView === 'dashboard' || !currentGame ? (
          <GameSetup
            games={games || []}
            onSelectGame={handleSelectGame}
            onGameCreated={handleGameCreated}
            onOpenRapport={handleOpenRapport}
          />
        ) : activeView === 'courtside' ? (
          <CourtsideTracker
            game={currentGame}
            players={gamePlayers || []}
            events={gameEvents || []}
            onEventsUpdated={() => {}}
            onExitTracker={() => setActiveView('dashboard')}
            onOpenRapport={handleOpenRapport}
          />
        ) : (
          <BoxScore
            game={currentGame}
            players={gamePlayers || []}
            events={gameEvents || []}
            onOpenSyncModal={() => setSyncModalOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-4 px-4 text-center text-xs text-slate-500">
        BasketBallistic • Courtside Basketball Stats & Match Rapport • Dexie.js + GAS
      </footer>

      {/* Sync Modal */}
      <SyncModal
        isOpen={syncModalOpen}
        onClose={() => setSyncModalOpen(false)}
        currentGame={currentGame}
        onSyncSuccess={() => {}}
      />
    </div>
  );
}
