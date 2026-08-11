import React, { useState, useMemo } from 'react';
import { BarChart2, CloudUpload, Copy, Check, Trophy, Award, TrendingUp, Users, Target, ShieldCheck, Flame, PieChart } from 'lucide-react';
import { calculateBoxScore, getMatchRapportData } from '../db/services';

export default function BoxScore({ game, players, events, onOpenSyncModal }) {
  const [viewTab, setViewTab] = useState('rapport'); // 'rapport' | 'boxscore' | 'timeline'
  const [teamTab, setTeamTab] = useState('teamA');
  const [copied, setCopied] = useState(false);

  // Compute rapport and boxscore data
  const rapport = useMemo(() => getMatchRapportData(game, players, events), [game, players, events]);

  const displayedPlayers = teamTab === 'teamA' ? rapport.teamAPlayers : rapport.teamBPlayers;
  const currentTeamName = teamTab === 'teamA' ? game.teamA : game.teamB;
  const currentTeamTotals = teamTab === 'teamA' ? rapport.teamATotals : rapport.teamBTotals;

  const handleCopySummary = () => {
    let text = `🏀 MATCH REPORT: ${game.teamA} vs ${game.teamB}\n`;
    text += `Date: ${new Date(game.date).toLocaleDateString()}\n\n`;

    text += `SCORE: ${game.teamA} (${rapport.teamATotals.PTS}) - (${rapport.teamBTotals.PTS}) ${game.teamB}\n\n`;

    if (rapport.statLeaders.mvp) {
      text += `⭐ MVP Candidate: #${rapport.statLeaders.mvp.jerseyNumber} ${rapport.statLeaders.mvp.name} (${rapport.statLeaders.mvp.PTS} PTS, ${rapport.statLeaders.mvp.REB} REB, ${rapport.statLeaders.mvp.AST} AST)\n\n`;
    }

    const formatRoster = (tName, roster) => {
      let rText = `=== ${tName} Box Score ===\n`;
      roster.forEach((p) => {
        rText += `#${p.jerseyNumber} ${p.name} (${p.position}): ${p.PTS} PTS, ${p.REB} REB, ${p.AST} AST, ${p.STL} STL, ${p.BLK} BLK | FG: ${p.FGM}/${p.FGA} (${p.FGPct})\n`;
      });
      return rText + '\n';
    };

    text += formatRoster(game.teamA, rapport.teamAPlayers);
    text += formatRoster(game.teamB, rapport.teamBPlayers);

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-xs font-bold text-amber-400 mb-2">
            <Trophy className="w-3.5 h-3.5" />
            <span>Match Summary & Team Rapport</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
            {game.teamA} vs {game.teamB}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {new Date(game.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} • {events.length} Recorded Actions
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleCopySummary}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl border border-slate-700 text-xs transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
            <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
          </button>

          <button
            onClick={onOpenSyncModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all"
          >
            <CloudUpload className="w-4 h-4 text-slate-950" />
            <span>Sync Sheets</span>
          </button>
        </div>
      </div>

      {/* Main View Switcher Pills */}
      <div className="flex items-center bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs font-bold w-fit">
        <button
          onClick={() => setViewTab('rapport')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            viewTab === 'rapport'
              ? 'bg-amber-500 text-slate-950 font-extrabold shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Team Rapport & Analytics</span>
        </button>

        <button
          onClick={() => setViewTab('boxscore')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            viewTab === 'boxscore'
              ? 'bg-amber-500 text-slate-950 font-extrabold shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>Individual Box Scores</span>
        </button>

        <button
          onClick={() => setViewTab('timeline')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            viewTab === 'timeline'
              ? 'bg-amber-500 text-slate-950 font-extrabold shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>Play Timeline</span>
        </button>
      </div>

      {/* TAB 1: TEAM RAPPORT & ADVANCED ANALYTICS */}
      {viewTab === 'rapport' && (
        <div className="space-y-6">
          {/* Stat Leaders Grid */}
          <div className="space-y-3">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              Game Performers & Stat Leaders
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* MVP Candidate */}
              <div className="bg-gradient-to-br from-amber-500/10 to-slate-900 border border-amber-500/30 rounded-3xl p-4 space-y-3 shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between text-amber-400 text-xs font-black uppercase tracking-wider">
                  <span>MVP Candidate</span>
                  <Trophy className="w-4 h-4" />
                </div>
                {rapport.statLeaders.mvp ? (
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-black text-white">#{rapport.statLeaders.mvp.jerseyNumber}</span>
                      <span className="text-lg font-bold text-slate-100 truncate">{rapport.statLeaders.mvp.name}</span>
                    </div>
                    <div className="text-xs font-semibold text-amber-400/80 mb-2">
                      Position: {rapport.statLeaders.mvp.position || 'G'} ({rapport.statLeaders.mvp.teamId === 'teamA' ? game.teamA : game.teamB})
                    </div>
                    <div className="grid grid-cols-3 gap-1 bg-slate-950/80 p-2 rounded-xl text-center text-xs">
                      <div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase">PTS</div>
                        <div className="font-extrabold text-amber-400 text-sm">{rapport.statLeaders.mvp.PTS}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase">REB</div>
                        <div className="font-extrabold text-slate-200 text-sm">{rapport.statLeaders.mvp.REB}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase">AST</div>
                        <div className="font-extrabold text-amber-300 text-sm">{rapport.statLeaders.mvp.AST}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 italic">No stats recorded</div>
                )}
              </div>

              {/* Points Leader */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-3 shadow-xl">
                <div className="flex items-center justify-between text-emerald-400 text-xs font-black uppercase tracking-wider">
                  <span>Top Scorer</span>
                  <Target className="w-4 h-4" />
                </div>
                {rapport.statLeaders.topScorer ? (
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-black text-white">#{rapport.statLeaders.topScorer.jerseyNumber}</span>
                      <span className="text-lg font-bold text-slate-100 truncate">{rapport.statLeaders.topScorer.name}</span>
                    </div>
                    <div className="text-xs font-semibold text-emerald-400/80 mb-2">
                      {rapport.statLeaders.topScorer.teamId === 'teamA' ? game.teamA : game.teamB}
                    </div>
                    <div className="bg-slate-950 p-2 rounded-xl text-center">
                      <span className="text-2xl font-black text-emerald-400 font-mono-stats">
                        {rapport.statLeaders.topScorer.PTS} <span className="text-xs text-slate-400 font-sans">PTS</span>
                      </span>
                      <div className="text-[11px] text-slate-400 font-medium">FG: {rapport.statLeaders.topScorer.FGM}/{rapport.statLeaders.topScorer.FGA} ({rapport.statLeaders.topScorer.FGPct})</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 italic">No stats recorded</div>
                )}
              </div>

              {/* Rebounds Leader */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-3 shadow-xl">
                <div className="flex items-center justify-between text-blue-400 text-xs font-black uppercase tracking-wider">
                  <span>Rebounds Leader</span>
                  <ShieldCheck className="w-4 h-4" />
                </div>
                {rapport.statLeaders.topRebounder ? (
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-black text-white">#{rapport.statLeaders.topRebounder.jerseyNumber}</span>
                      <span className="text-lg font-bold text-slate-100 truncate">{rapport.statLeaders.topRebounder.name}</span>
                    </div>
                    <div className="text-xs font-semibold text-blue-400/80 mb-2">
                      {rapport.statLeaders.topRebounder.teamId === 'teamA' ? game.teamA : game.teamB}
                    </div>
                    <div className="bg-slate-950 p-2 rounded-xl text-center">
                      <span className="text-2xl font-black text-blue-400 font-mono-stats">
                        {rapport.statLeaders.topRebounder.REB} <span className="text-xs text-slate-400 font-sans">REB</span>
                      </span>
                      <div className="text-[11px] text-slate-400 font-medium">Off: {rapport.statLeaders.topRebounder.OREB} | Def: {rapport.statLeaders.topRebounder.DREB}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 italic">No stats recorded</div>
                )}
              </div>

              {/* Assists Leader */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-3 shadow-xl">
                <div className="flex items-center justify-between text-indigo-400 text-xs font-black uppercase tracking-wider">
                  <span>Assists Leader</span>
                  <Users className="w-4 h-4" />
                </div>
                {rapport.statLeaders.topAssister ? (
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-black text-white">#{rapport.statLeaders.topAssister.jerseyNumber}</span>
                      <span className="text-lg font-bold text-slate-100 truncate">{rapport.statLeaders.topAssister.name}</span>
                    </div>
                    <div className="text-xs font-semibold text-indigo-400/80 mb-2">
                      {rapport.statLeaders.topAssister.teamId === 'teamA' ? game.teamA : game.teamB}
                    </div>
                    <div className="bg-slate-950 p-2 rounded-xl text-center">
                      <span className="text-2xl font-black text-indigo-400 font-mono-stats">
                        {rapport.statLeaders.topAssister.AST} <span className="text-xs text-slate-400 font-sans">AST</span>
                      </span>
                      <div className="text-[11px] text-slate-400 font-medium">Playmaking Leader</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 italic">No stats recorded</div>
                )}
              </div>
            </div>
          </div>

          {/* Quarter-by-Quarter Scoring Trend */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-400" />
              Quarter-by-Quarter Scoring Trend
            </h3>

            <div className="grid grid-cols-5 gap-3 text-center">
              {['Q1', 'Q2', 'Q3', 'Q4', 'OT'].map((q) => {
                const ptsA = rapport.quarterScoring.teamA[q];
                const ptsB = rapport.quarterScoring.teamB[q];
                const maxPts = Math.max(ptsA, ptsB, 1);

                return (
                  <div key={q} className="bg-slate-950 p-3 rounded-2xl border border-slate-800/80 space-y-2">
                    <span className="text-xs font-black text-amber-400 uppercase">{q}</span>
                    
                    <div className="space-y-1 text-xs font-bold">
                      <div className="flex items-center justify-between bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/30 text-amber-300">
                        <span className="text-[10px] text-slate-400">{game.teamA}</span>
                        <span>{ptsA}</span>
                      </div>

                      <div className="flex items-center justify-between bg-orange-500/10 px-2 py-1 rounded-lg border border-orange-500/30 text-orange-300">
                        <span className="text-[10px] text-slate-400">{game.teamB}</span>
                        <span>{ptsB}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Team Efficiency Comparison */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <PieChart className="w-5 h-5 text-amber-400" />
              Team Efficiency & Shooting Breakdown
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Field Goal % */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="text-xs font-bold text-slate-400 uppercase">Field Goal % (FG%)</div>
                <div className="flex items-center justify-between pt-1">
                  <div className="text-amber-400 font-black text-lg">{game.teamA}: {rapport.teamATotals.FGPct}</div>
                  <div className="text-orange-400 font-black text-lg">{game.teamB}: {rapport.teamBTotals.FGPct}</div>
                </div>
              </div>

              {/* 3PT % */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="text-xs font-bold text-slate-400 uppercase">3-Point % (3P%)</div>
                <div className="flex items-center justify-between pt-1">
                  <div className="text-amber-400 font-black text-lg">{game.teamA}: {rapport.teamATotals.TPPct}</div>
                  <div className="text-orange-400 font-black text-lg">{game.teamB}: {rapport.teamBTotals.TPPct}</div>
                </div>
              </div>

              {/* Effective FG% */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="text-xs font-bold text-slate-400 uppercase">Effective FG% (eFG%)</div>
                <div className="flex items-center justify-between pt-1">
                  <div className="text-amber-400 font-black text-lg">{game.teamA}: {rapport.teamATotals.eFGPct}</div>
                  <div className="text-orange-400 font-black text-lg">{game.teamB}: {rapport.teamBTotals.eFGPct}</div>
                </div>
              </div>

              {/* True Shooting % */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="text-xs font-bold text-slate-400 uppercase">True Shooting % (TS%)</div>
                <div className="flex items-center justify-between pt-1">
                  <div className="text-amber-400 font-black text-lg">{game.teamA}: {rapport.teamATotals.TSPct}</div>
                  <div className="text-orange-400 font-black text-lg">{game.teamB}: {rapport.teamBTotals.TSPct}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INDIVIDUAL BOX SCORES */}
      {viewTab === 'boxscore' && (
        <div className="space-y-4">
          {/* Team Switcher Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTeamTab('teamA')}
              className={`px-5 py-2.5 rounded-xl font-black text-sm transition-all ${
                teamTab === 'teamA'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {game.teamA} Box Score
            </button>

            <button
              onClick={() => setTeamTab('teamB')}
              className={`px-5 py-2.5 rounded-xl font-black text-sm transition-all ${
                teamTab === 'teamB'
                  ? 'bg-orange-500 text-slate-950 shadow-md shadow-orange-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {game.teamB} Box Score
            </button>
          </div>

          {/* Table Container */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-black text-white text-base">{currentTeamName} Roster Performance</h3>
              <span className="text-xs font-semibold text-slate-400">{displayedPlayers.length} Active Players</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-950/80 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800 text-[11px]">
                    <th className="py-3 px-3">#</th>
                    <th className="py-3 px-4">Player</th>
                    <th className="py-3 px-2 text-center text-amber-300">POS</th>
                    <th className="py-3 px-3 text-center text-amber-400 font-black">PTS</th>
                    <th className="py-3 px-3 text-center">REB</th>
                    <th className="py-3 px-3 text-center text-slate-500 hidden md:table-cell">O-D</th>
                    <th className="py-3 px-3 text-center text-indigo-300">AST</th>
                    <th className="py-3 px-3 text-center">STL</th>
                    <th className="py-3 px-3 text-center">BLK</th>
                    <th className="py-3 px-3 text-center text-rose-400">TOV</th>
                    <th className="py-3 px-3 text-center text-red-400">PF</th>
                    <th className="py-3 px-3 text-center font-mono">FG</th>
                    <th className="py-3 px-3 text-center font-mono">3PT</th>
                    <th className="py-3 px-3 text-center font-mono">FT</th>
                    <th className="py-3 px-3 text-center font-mono text-emerald-400">eFG%</th>
                    <th className="py-3 px-3 text-center font-mono text-teal-400">TS%</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800/80 font-medium">
                  {displayedPlayers.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-3 font-black text-amber-400">#{p.jerseyNumber}</td>
                      <td className="py-3 px-4 font-bold text-white whitespace-nowrap">{p.name}</td>
                      <td className="py-3 px-2 text-center font-black text-amber-300">{p.position || 'G'}</td>
                      <td className="py-3 px-3 text-center font-extrabold text-amber-400 text-base">{p.PTS}</td>
                      <td className="py-3 px-3 text-center font-bold text-slate-200">{p.REB}</td>
                      <td className="py-3 px-3 text-center text-slate-400 text-xs hidden md:table-cell">{p.OREB}-{p.DREB}</td>
                      <td className="py-3 px-3 text-center font-bold text-indigo-300">{p.AST}</td>
                      <td className="py-3 px-3 text-center text-slate-300">{p.STL}</td>
                      <td className="py-3 px-3 text-center text-slate-300">{p.BLK}</td>
                      <td className="py-3 px-3 text-center text-rose-400">{p.TOV}</td>
                      <td className="py-3 px-3 text-center text-red-400">{p.PF}</td>
                      <td className="py-3 px-3 text-center font-mono text-xs whitespace-nowrap">
                        {p.FGM}/{p.FGA} <span className="text-slate-500">({p.FGPct})</span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-xs whitespace-nowrap">
                        {p.TPM}/{p.TPA} <span className="text-slate-500">({p.TPPct})</span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-xs whitespace-nowrap">
                        {p.FTM}/{p.FTA} <span className="text-slate-500">({p.FTPct})</span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-xs text-emerald-400 font-bold">{p.eFGPct}</td>
                      <td className="py-3 px-3 text-center font-mono text-xs text-teal-400 font-bold">{p.TSPct}</td>
                    </tr>
                  ))}
                </tbody>

                <tfoot>
                  <tr className="bg-slate-950 font-black text-white border-t-2 border-slate-700">
                    <td className="py-3.5 px-3" colSpan={3}>TEAM TOTALS</td>
                    <td className="py-3.5 px-3 text-center text-amber-400 text-base">{currentTeamTotals.PTS}</td>
                    <td className="py-3.5 px-3 text-center">{currentTeamTotals.REB}</td>
                    <td className="py-3.5 px-3 text-center text-xs hidden md:table-cell">{currentTeamTotals.OREB}-{currentTeamTotals.DREB}</td>
                    <td className="py-3.5 px-3 text-center text-indigo-300">{currentTeamTotals.AST}</td>
                    <td className="py-3.5 px-3 text-center">{currentTeamTotals.STL}</td>
                    <td className="py-3.5 px-3 text-center">{currentTeamTotals.BLK}</td>
                    <td className="py-3.5 px-3 text-center text-rose-400">{currentTeamTotals.TOV}</td>
                    <td className="py-3.5 px-3 text-center text-red-400">{currentTeamTotals.PF}</td>
                    <td className="py-3.5 px-3 text-center font-mono text-xs whitespace-nowrap">
                      {currentTeamTotals.FGM}/{currentTeamTotals.FGA} ({currentTeamTotals.FGPct})
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono text-xs whitespace-nowrap">
                      {currentTeamTotals.TPM}/{currentTeamTotals.TPA} ({currentTeamTotals.TPPct})
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono text-xs whitespace-nowrap">
                      {currentTeamTotals.FTM}/{currentTeamTotals.FTA} ({currentTeamTotals.FTPct})
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono text-xs text-emerald-400">{currentTeamTotals.eFGPct}</td>
                    <td className="py-3.5 px-3 text-center font-mono text-xs text-teal-400">{currentTeamTotals.TSPct}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PLAY-BY-PLAY TIMELINE LOG */}
      {viewTab === 'timeline' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-400" />
            Complete Chronological Event Log ({events.length} Events)
          </h3>

          {events.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs font-semibold">
              No events recorded for this match yet.
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {[...events]
                .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
                .map((ev, idx) => {
                  const pMap = {};
                  players.forEach((p) => (pMap[p.id] = p));
                  const player = pMap[ev.playerId] || {};
                  const assistPlayer = ev.assistPlayerId ? pMap[ev.assistPlayerId] : null;

                  return (
                    <div
                      key={ev.id}
                      className="flex items-center justify-between bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500 font-mono text-[11px]">#{idx + 1}</span>
                        <span className="font-mono text-xs font-extrabold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/30">
                          Q{ev.quarter}
                        </span>
                        <span className="font-black text-white">
                          #{player.jerseyNumber} {player.name}
                        </span>
                        <span className="text-slate-500 text-[11px]">
                          ({ev.teamId === 'teamA' ? game.teamA : game.teamB})
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-black text-amber-400 uppercase">{ev.eventType.replace('_', ' ')}</span>
                        {assistPlayer && (
                          <span className="text-[11px] text-slate-400 italic">
                            (Assist: #{assistPlayer.jerseyNumber} {assistPlayer.name})
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
