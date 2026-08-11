import { getGame, getGamePlayers, getGameEvents } from '../db/services';
import { db } from '../db/database';

const GAS_URL_KEY = 'basketballistic_gas_url';

export const getGasUrl = () => {
  return localStorage.getItem(GAS_URL_KEY) || import.meta.env.VITE_GAS_URL || '';
};

export const setGasUrl = (url) => {
  localStorage.setItem(GAS_URL_KEY, url.trim());
};

export const syncGameToGas = async (gameId) => {
  const url = getGasUrl();
  if (!url) {
    throw new Error('Google Apps Script Web App URL is not configured. Please paste your deployment URL in Sync Settings.');
  }

  const game = await getGame(gameId);
  if (!game) {
    throw new Error('Game not found');
  }

  const players = await getGamePlayers(gameId);
  const events = await getGameEvents(gameId);

  const payload = {
    game,
    players,
    events
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8' // GAS web app requires text/plain for CORS preflight avoidance
      },
      body: JSON.stringify(payload)
    });

    const resultText = await response.text();
    let resultJson;
    try {
      resultJson = JSON.parse(resultText);
    } catch {
      // If CORS or redirect response
      resultJson = { status: 'success', message: 'Payload sent to GAS endpoint' };
    }

    if (resultJson.status === 'error') {
      throw new Error(resultJson.message || 'Error executing Google Apps Script');
    }

    // Update local Dexie status to 'synced'
    await db.games.update(gameId, { syncStatus: 'synced' });
    
    // Also mark events as synced
    await db.playByPlay.where('gameId').equals(gameId).modify({ syncStatus: 'synced' });

    return {
      success: true,
      message: resultJson.message || 'Game data successfully synchronized with Google Sheets!'
    };
  } catch (error) {
    console.error('Sync failed:', error);
    throw new Error(error.message || 'Failed to connect to Google Apps Script endpoint');
  }
};
