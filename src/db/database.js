import Dexie from 'dexie';

export const db = new Dexie('BasketballStatsDB');

db.version(1).stores({
  games: 'id, date, status, syncStatus',
  players: 'id, gameId, teamId, jerseyNumber, position, isStarter',
  playByPlay: 'id, gameId, timestamp, quarter, teamId, playerId, eventType, assistPlayerId, syncStatus'
});
