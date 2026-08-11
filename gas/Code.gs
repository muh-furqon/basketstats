/**
 * BasketBallistic - Google Apps Script (GAS) Backend Sync Endpoint
 * 
 * Instructions:
 * 1. Open Google Sheets -> Extensions -> Apps Script
 * 2. Paste this code into Code.gs
 * 3. Click "Deploy" -> "New deployment"
 * 4. Select type: "Web app"
 * 5. Set Execute as: "Me"
 * 6. Set Who has access: "Anyone"
 * 7. Click Deploy, copy the Web App URL and paste it into the app's Sync Settings!
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  // Request lock for up to 30 seconds to handle concurrent sync requests safely
  var hasLock = lock.tryLock(30000);
  
  if (!hasLock) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: 'Server busy. Lock timeout.' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error('No payload data received');
    }

    var payload = JSON.parse(e.postData.contents);
    var game = payload.game;
    var players = payload.players || [];
    var events = payload.events || [];

    if (!game || !game.id) {
      throw new Error('Invalid game data structure');
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. Get or Create Sheets with upgraded columns (Position, eFG%, TS%)
    var gamesSheet = getOrCreateSheet(ss, 'Games', ['Game ID', 'Date', 'Team A', 'Team B', 'Status', 'Synced At']);
    var pbpSheet = getOrCreateSheet(ss, 'PlayByPlay', ['Event ID', 'Game ID', 'Timestamp', 'Quarter', 'Team', 'Player Name', 'Jersey #', 'Position', 'Event Type', 'Assist Player']);
    var boxSheet = getOrCreateSheet(ss, 'BoxScore', ['Game ID', 'Team', 'Player Name', 'Jersey #', 'Position', 'PTS', 'REB', 'OREB', 'DREB', 'AST', 'STL', 'BLK', 'TOV', 'PF', 'FG%', '3P%', 'FT%', 'eFG%', 'TS%']);

    // 2. Remove existing data for this Game ID (Idempotency)
    removeExistingGameData(gamesSheet, game.id);
    removeExistingGameData(pbpSheet, game.id);
    removeExistingGameData(boxSheet, game.id);

    // 3. Append to Games Sheet
    var gameRow = [
      game.id,
      game.date || new Date().toISOString(),
      game.teamA || 'Team A',
      game.teamB || 'Team B',
      game.status || 'finished',
      new Date().toISOString()
    ];
    gamesSheet.appendRow(gameRow);

    // 4. Append to PlayByPlay Sheet
    var playerMap = {};
    players.forEach(function(p) {
      playerMap[p.id] = p;
    });

    if (events.length > 0) {
      var pbpRows = events.map(function(ev) {
        var player = playerMap[ev.playerId] || {};
        var assistPlayer = ev.assistPlayerId ? (playerMap[ev.assistPlayerId] || {}) : {};
        return [
          ev.id,
          ev.gameId,
          ev.timestamp,
          'Q' + (ev.quarter || 1),
          ev.teamId === 'teamA' ? game.teamA : game.teamB,
          player.name || ev.playerId,
          player.jerseyNumber || '',
          player.position || 'G',
          ev.eventType,
          assistPlayer.name ? (assistPlayer.name + ' (#' + assistPlayer.jerseyNumber + ')') : ''
        ];
      });

      pbpSheet.getRange(pbpSheet.getLastRow() + 1, 1, pbpRows.length, pbpRows[0].length).setValues(pbpRows);
    }

    // 5. Calculate Box Score Aggregation & Batch Write
    var boxScoreRows = calculateBoxScoreRows(game, players, events);
    if (boxScoreRows.length > 0) {
      boxSheet.getRange(boxSheet.getLastRow() + 1, 1, boxScoreRows.length, boxScoreRows[0].length).setValues(boxScoreRows);
    }

    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'success',
        gameId: game.id,
        message: 'Successfully synced game ' + game.id + ' (' + events.length + ' events)',
        syncedAt: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'BasketBallistic GAS Sync Service is Running' }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Setup Sheets Initializer
 */
function setupSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  getOrCreateSheet(ss, 'Games', ['Game ID', 'Date', 'Team A', 'Team B', 'Status', 'Synced At']);
  getOrCreateSheet(ss, 'PlayByPlay', ['Event ID', 'Game ID', 'Timestamp', 'Quarter', 'Team', 'Player Name', 'Jersey #', 'Position', 'Event Type', 'Assist Player']);
  getOrCreateSheet(ss, 'BoxScore', ['Game ID', 'Team', 'Player Name', 'Jersey #', 'Position', 'PTS', 'REB', 'OREB', 'DREB', 'AST', 'STL', 'BLK', 'TOV', 'PF', 'FG%', '3P%', 'FT%', 'eFG%', 'TS%']);
  Logger.log('Sheets initialized successfully!');
}

function getOrCreateSheet(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#f1f5f9');
  }
  return sheet;
}

function removeExistingGameData(sheet, gameId) {
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return; // Only headers

  for (var i = data.length - 1; i >= 1; i--) {
    var rowGameId = data[i][0] === gameId || data[i][1] === gameId;
    if (rowGameId) {
      sheet.deleteRow(i + 1);
    }
  }
}

function calculateBoxScoreRows(game, players, events) {
  var statsMap = {};
  players.forEach(function(p) {
    statsMap[p.id] = {
      player: p,
      PTS: 0, REB: 0, OREB: 0, DREB: 0, AST: 0, STL: 0, BLK: 0, TOV: 0, PF: 0,
      FGM: 0, FGA: 0, TPM: 0, TPA: 0, FTM: 0, FTA: 0
    };
  });

  events.forEach(function(ev) {
    var s = statsMap[ev.playerId];
    if (!s) return;
    switch (ev.eventType) {
      case '2PT_MAKE': s.PTS += 2; s.FGM++; s.FGA++; break;
      case '2PT_MISS': s.FGA++; break;
      case '3PT_MAKE': s.PTS += 3; s.FGM++; s.FGA++; s.TPM++; s.TPA++; break;
      case '3PT_MISS': s.FGA++; s.TPA++; break;
      case 'FT_MAKE': s.PTS += 1; s.FTM++; s.FTA++; break;
      case 'FT_MISS': s.FTA++; break;
      case 'REB_OFF': s.REB++; s.OREB++; break;
      case 'REB_DEF': s.REB++; s.DREB++; break;
      case 'ASSIST': s.AST++; break;
      case 'STEAL': s.STL++; break;
      case 'BLOCK': s.BLK++; break;
      case 'TURNOVER': s.TOV++; break;
      case 'FOUL': s.PF++; break;
    }
  });

  var rows = [];
  players.forEach(function(p) {
    var s = statsMap[p.id];
    var fgPct = s.FGA > 0 ? Math.round((s.FGM / s.FGA) * 100) + '%' : '0%';
    var tpPct = s.TPA > 0 ? Math.round((s.TPM / s.TPA) * 100) + '%' : '0%';
    var ftPct = s.FTA > 0 ? Math.round((s.FTM / s.FTA) * 100) + '%' : '0%';
    
    var eFG = s.FGA > 0 ? Math.round(((s.FGM + 0.5 * s.TPM) / s.FGA) * 100) + '%' : '0%';
    var tsAttempts = 2 * (s.FGA + 0.44 * s.FTA);
    var ts = tsAttempts > 0 ? Math.round((s.PTS / tsAttempts) * 100) + '%' : '0%';

    rows.push([
      game.id,
      p.teamId === 'teamA' ? game.teamA : game.teamB,
      p.name,
      p.jerseyNumber,
      p.position || 'G',
      s.PTS, s.REB, s.OREB, s.DREB, s.AST, s.STL, s.BLK, s.TOV, s.PF,
      fgPct, tpPct, ftPct, eFG, ts
    ]);
  });

  return rows;
}
