import { db } from './database';

export const createGame = async ({ teamAName, teamBName, teamARoster, teamBRoster }) => {
  const gameId = crypto.randomUUID();
  const date = new Date().toISOString();

  await db.transaction('rw', db.games, db.players, async () => {
    await db.games.add({
      id: gameId,
      teamA: teamAName || 'Team A',
      teamB: teamBName || 'Team B',
      date,
      status: 'not_started',
      currentQuarter: 1,
      syncStatus: 'pending'
    });

    const playerDocs = [];

    (teamARoster || []).forEach((p) => {
      playerDocs.push({
        id: crypto.randomUUID(),
        gameId,
        teamId: 'teamA',
        name: p.name.trim(),
        jerseyNumber: String(p.jerseyNumber).trim(),
        position: p.position || 'G',
        isStarter: Boolean(p.isStarter)
      });
    });

    (teamBRoster || []).forEach((p) => {
      playerDocs.push({
        id: crypto.randomUUID(),
        gameId,
        teamId: 'teamB',
        name: p.name.trim(),
        jerseyNumber: String(p.jerseyNumber).trim(),
        position: p.position || 'G',
        isStarter: Boolean(p.isStarter)
      });
    });

    if (playerDocs.length > 0) {
      await db.players.bulkAdd(playerDocs);
    }
  });

  return gameId;
};

export const getGamesList = async () => {
  return await db.games.orderBy('date').reverse().toArray();
};

export const getGame = async (gameId) => {
  return await db.games.get(gameId);
};

export const getGamePlayers = async (gameId) => {
  return await db.players.where('gameId').equals(gameId).toArray();
};

export const getGameEvents = async (gameId) => {
  return await db.playByPlay.where('gameId').equals(gameId).toArray();
};

export const addPlayByPlayEvent = async ({
  gameId,
  quarter,
  teamId,
  playerId,
  eventType,
  assistPlayerId = null
}) => {
  const eventId = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  const eventDoc = {
    id: eventId,
    gameId,
    timestamp,
    quarter: quarter || 1,
    teamId,
    playerId,
    eventType,
    assistPlayerId,
    syncStatus: 'pending'
  };

  await db.playByPlay.add(eventDoc);

  // If there's an assist associated, create an ASSIST event for the assister player as well
  if (assistPlayerId) {
    await db.playByPlay.add({
      id: crypto.randomUUID(),
      gameId,
      timestamp,
      quarter: quarter || 1,
      teamId,
      playerId: assistPlayerId,
      eventType: 'ASSIST',
      linkedShotEventId: eventId,
      syncStatus: 'pending'
    });
  }

  // Update game sync status to pending whenever new event is logged
  await db.games.update(gameId, { syncStatus: 'pending' });

  return eventDoc;
};

export const undoLastEvent = async (gameId) => {
  const events = await db.playByPlay.where('gameId').equals(gameId).reverse().sortBy('timestamp');
  if (events.length === 0) return null;

  const lastEvent = events[0];

  await db.transaction('rw', db.playByPlay, db.games, async () => {
    // Delete the event
    await db.playByPlay.delete(lastEvent.id);

    // If it was linked to an assist event or was a shot with linked assist, clean up associated assist event
    if (lastEvent.assistPlayerId) {
      const linkedAssist = events.find((e) => e.linkedShotEventId === lastEvent.id);
      if (linkedAssist) {
        await db.playByPlay.delete(linkedAssist.id);
      }
    }

    await db.games.update(gameId, { syncStatus: 'pending' });
  });

  return lastEvent;
};

export const updateGameQuarter = async (gameId, currentQuarter) => {
  await db.games.update(gameId, { currentQuarter, syncStatus: 'pending' });
};

export const updateGameStatus = async (gameId, status) => {
  await db.games.update(gameId, { status, syncStatus: 'pending' });
};

export const deleteGame = async (gameId) => {
  await db.transaction('rw', db.games, db.players, db.playByPlay, async () => {
    await db.games.delete(gameId);
    await db.players.where('gameId').equals(gameId).delete();
    await db.playByPlay.where('gameId').equals(gameId).delete();
  });
};

export const calculateBoxScore = (players = [], events = []) => {
  const playerStatsMap = {};

  players.forEach((p) => {
    playerStatsMap[p.id] = {
      id: p.id,
      name: p.name,
      jerseyNumber: p.jerseyNumber,
      position: p.position || 'G',
      isStarter: Boolean(p.isStarter),
      teamId: p.teamId,
      PTS: 0,
      REB: 0,
      OREB: 0,
      DREB: 0,
      AST: 0,
      STL: 0,
      BLK: 0,
      TOV: 0,
      PF: 0,
      FGM: 0,
      FGA: 0,
      FGPct: '0%',
      TPM: 0,
      TPA: 0,
      TPPct: '0%',
      FTM: 0,
      FTA: 0,
      FTPct: '0%',
      eFGPct: '0%',
      TSPct: '0%'
    };
  });

  events.forEach((ev) => {
    const pStats = playerStatsMap[ev.playerId];
    if (!pStats) return;

    switch (ev.eventType) {
      case '2PT_MAKE':
        pStats.PTS += 2;
        pStats.FGM += 1;
        pStats.FGA += 1;
        break;
      case '2PT_MISS':
        pStats.FGA += 1;
        break;
      case '3PT_MAKE':
        pStats.PTS += 3;
        pStats.FGM += 1;
        pStats.FGA += 1;
        pStats.TPM += 1;
        pStats.TPA += 1;
        break;
      case '3PT_MISS':
        pStats.FGA += 1;
        pStats.TPA += 1;
        break;
      case 'FT_MAKE':
        pStats.PTS += 1;
        pStats.FTM += 1;
        pStats.FTA += 1;
        break;
      case 'FT_MISS':
        pStats.FTA += 1;
        break;
      case 'REB_OFF':
        pStats.REB += 1;
        pStats.OREB += 1;
        break;
      case 'REB_DEF':
        pStats.REB += 1;
        pStats.DREB += 1;
        break;
      case 'ASSIST':
        pStats.AST += 1;
        break;
      case 'STEAL':
        pStats.STL += 1;
        break;
      case 'BLOCK':
        pStats.BLK += 1;
        break;
      case 'TURNOVER':
        pStats.TOV += 1;
        break;
      case 'FOUL':
        pStats.PF += 1;
        break;
      default:
        break;
    }
  });

  // Calculate percentages and advanced stats
  Object.values(playerStatsMap).forEach((stat) => {
    stat.FGPct = stat.FGA > 0 ? `${Math.round((stat.FGM / stat.FGA) * 100)}%` : '0%';
    stat.TPPct = stat.TPA > 0 ? `${Math.round((stat.TPM / stat.TPA) * 100)}%` : '0%';
    stat.FTPct = stat.FTA > 0 ? `${Math.round((stat.FTM / stat.FTA) * 100)}%` : '0%';
    
    // Effective Field Goal % = (FGM + 0.5 * 3PM) / FGA
    const eFG = stat.FGA > 0 ? ((stat.FGM + 0.5 * stat.TPM) / stat.FGA) * 100 : 0;
    stat.eFGPct = `${Math.round(eFG)}%`;

    // True Shooting % = PTS / (2 * (FGA + 0.44 * FTA))
    const tsAttempts = 2 * (stat.FGA + 0.44 * stat.FTA);
    const ts = tsAttempts > 0 ? (stat.PTS / tsAttempts) * 100 : 0;
    stat.TSPct = `${Math.round(ts)}%`;
  });

  return Object.values(playerStatsMap);
};

export const getMatchRapportData = (game, players = [], events = []) => {
  const boxScores = calculateBoxScore(players, events);
  
  const teamAPlayers = boxScores.filter((p) => p.teamId === 'teamA');
  const teamBPlayers = boxScores.filter((p) => p.teamId === 'teamB');

  const calcTeamTotals = (pList) => {
    const totals = pList.reduce(
      (acc, p) => {
        acc.PTS += p.PTS;
        acc.REB += p.REB;
        acc.OREB += p.OREB;
        acc.DREB += p.DREB;
        acc.AST += p.AST;
        acc.STL += p.STL;
        acc.BLK += p.BLK;
        acc.TOV += p.TOV;
        acc.PF += p.PF;
        acc.FGM += p.FGM;
        acc.FGA += p.FGA;
        acc.TPM += p.TPM;
        acc.TPA += p.TPA;
        acc.FTM += p.FTM;
        acc.FTA += p.FTA;
        return acc;
      },
      { PTS: 0, REB: 0, OREB: 0, DREB: 0, AST: 0, STL: 0, BLK: 0, TOV: 0, PF: 0, FGM: 0, FGA: 0, TPM: 0, TPA: 0, FTM: 0, FTA: 0 }
    );

    totals.FGPct = totals.FGA > 0 ? `${Math.round((totals.FGM / totals.FGA) * 100)}%` : '0%';
    totals.TPPct = totals.TPA > 0 ? `${Math.round((totals.TPM / totals.TPA) * 100)}%` : '0%';
    totals.FTPct = totals.FTA > 0 ? `${Math.round((totals.FTM / totals.FTA) * 100)}%` : '0%';
    totals.eFGPct = totals.FGA > 0 ? `${Math.round(((totals.FGM + 0.5 * totals.TPM) / totals.FGA) * 100)}%` : '0%';
    
    const tsAttempts = 2 * (totals.FGA + 0.44 * totals.FTA);
    totals.TSPct = tsAttempts > 0 ? `${Math.round((totals.PTS / tsAttempts) * 100)}%` : '0%';

    return totals;
  };

  const teamATotals = calcTeamTotals(teamAPlayers);
  const teamBTotals = calcTeamTotals(teamBPlayers);

  // Quarter scoring breakdown
  const quarterScoring = {
    teamA: { Q1: 0, Q2: 0, Q3: 0, Q4: 0, OT: 0 },
    teamB: { Q1: 0, Q2: 0, Q3: 0, Q4: 0, OT: 0 }
  };

  events.forEach((ev) => {
    let pts = 0;
    if (ev.eventType === '2PT_MAKE') pts = 2;
    else if (ev.eventType === '3PT_MAKE') pts = 3;
    else if (ev.eventType === 'FT_MAKE') pts = 1;

    if (pts > 0) {
      const qKey = ev.quarter === 1 ? 'Q1' : ev.quarter === 2 ? 'Q2' : ev.quarter === 3 ? 'Q3' : ev.quarter === 4 ? 'Q4' : 'OT';
      if (ev.teamId === 'teamA') {
        quarterScoring.teamA[qKey] += pts;
      } else {
        quarterScoring.teamB[qKey] += pts;
      }
    }
  });

  // Stat Leaders
  const sortedByPoints = [...boxScores].sort((a, b) => b.PTS - a.PTS);
  const sortedByRebounds = [...boxScores].sort((a, b) => b.REB - a.REB);
  const sortedByAssists = [...boxScores].sort((a, b) => b.AST - a.AST);

  // Simple MVP Score = PTS + REB + AST + STL + BLK - TOV
  const sortedByMVP = [...boxScores].sort((a, b) => {
    const mvpA = a.PTS + a.REB * 1.2 + a.AST * 1.5 + a.STL * 2 + a.BLK * 2 - a.TOV * 1.5;
    const mvpB = b.PTS + b.REB * 1.2 + b.AST * 1.5 + b.STL * 2 + b.BLK * 2 - b.TOV * 1.5;
    return mvpB - mvpA;
  });

  return {
    boxScores,
    teamAPlayers,
    teamBPlayers,
    teamATotals,
    teamBTotals,
    quarterScoring,
    statLeaders: {
      topScorer: sortedByPoints[0] || null,
      topRebounder: sortedByRebounds[0] || null,
      topAssister: sortedByAssists[0] || null,
      mvp: sortedByMVP[0] || null
    }
  };
};
