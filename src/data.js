// ── IPL 2026 TEAMS ──────────────────────────────────────────
export const IPL_TEAMS = [
  { name: 'Royal Challengers Bengaluru', short: 'RCB', color: '#EC1C24', accent: '#1C1C1C' },
  { name: 'Mumbai Indians',              short: 'MI',  color: '#005DA0', accent: '#D1AB3E' },
  { name: 'Chennai Super Kings',         short: 'CSK', color: '#F7C201', accent: '#0081C8' },
  { name: 'Kolkata Knight Riders',       short: 'KKR', color: '#3A225D', accent: '#D4A843' },
  { name: 'Delhi Capitals',              short: 'DC',  color: '#0078BC', accent: '#EF1C25' },
  { name: 'Rajasthan Royals',            short: 'RR',  color: '#E8175D', accent: '#0072BC' },
  { name: 'Sunrisers Hyderabad',         short: 'SRH', color: '#FF822A', accent: '#1C1C1C' },
  { name: 'Punjab Kings',               short: 'PBKS',color: '#DC143C', accent: '#DCBA56' },
  { name: 'Gujarat Titans',              short: 'GT',  color: '#1C2B50', accent: '#9DC0E6' },
  { name: 'Lucknow Super Giants',        short: 'LSG', color: '#A72056', accent: '#FEDB00' },
];

export const TEAM_COLOR = Object.fromEntries(IPL_TEAMS.map(t => [t.name, t.color]));
export const TEAM_SHORT = Object.fromEntries(IPL_TEAMS.map(t => [t.name, t.short]));
export const TEAM_BY_SHORT = Object.fromEntries(IPL_TEAMS.map(t => [t.short, t.name]));

// ── IPL 2026 — FIRST 20 MATCHES (officially announced) ──────
export const IPL_2026_MATCHES = [
  { id:'ipl26_01', number:1,  team1:'Royal Challengers Bengaluru', team2:'Sunrisers Hyderabad',    date:'2026-03-28', time:'19:30', venue:'M. Chinnaswamy Stadium, Bengaluru' },
  { id:'ipl26_02', number:2,  team1:'Mumbai Indians',              team2:'Kolkata Knight Riders',  date:'2026-03-29', time:'19:30', venue:'Wankhede Stadium, Mumbai' },
  { id:'ipl26_03', number:3,  team1:'Rajasthan Royals',            team2:'Chennai Super Kings',    date:'2026-03-30', time:'19:30', venue:'Barsapara Cricket Stadium, Guwahati' },
  { id:'ipl26_04', number:4,  team1:'Punjab Kings',                team2:'Gujarat Titans',         date:'2026-03-31', time:'15:30', venue:'PCA Stadium, New Chandigarh' },
  { id:'ipl26_05', number:5,  team1:'Lucknow Super Giants',        team2:'Delhi Capitals',         date:'2026-03-31', time:'19:30', venue:'Ekana Cricket Stadium, Lucknow' },
  { id:'ipl26_06', number:6,  team1:'Kolkata Knight Riders',       team2:'Sunrisers Hyderabad',    date:'2026-04-01', time:'19:30', venue:'Eden Gardens, Kolkata' },
  { id:'ipl26_07', number:7,  team1:'Chennai Super Kings',         team2:'Royal Challengers Bengaluru', date:'2026-04-02', time:'19:30', venue:'Barsapara Cricket Stadium, Guwahati' },
  { id:'ipl26_08', number:8,  team1:'Mumbai Indians',              team2:'Punjab Kings',           date:'2026-04-03', time:'19:30', venue:'Wankhede Stadium, Mumbai' },
  { id:'ipl26_09', number:9,  team1:'Delhi Capitals',              team2:'Gujarat Titans',         date:'2026-04-04', time:'15:30', venue:'Arun Jaitley Stadium, Delhi' },
  { id:'ipl26_10', number:10, team1:'Gujarat Titans',              team2:'Rajasthan Royals',       date:'2026-04-04', time:'19:30', venue:'Narendra Modi Stadium, Ahmedabad' },
  { id:'ipl26_11', number:11, team1:'Sunrisers Hyderabad',         team2:'Lucknow Super Giants',   date:'2026-04-05', time:'19:30', venue:'Rajiv Gandhi Int. Cricket Stadium, Hyderabad' },
  { id:'ipl26_12', number:12, team1:'Royal Challengers Bengaluru', team2:'Chennai Super Kings',    date:'2026-04-06', time:'15:30', venue:'M. Chinnaswamy Stadium, Bengaluru' },
  { id:'ipl26_13', number:13, team1:'Kolkata Knight Riders',       team2:'Punjab Kings',           date:'2026-04-06', time:'19:30', venue:'Eden Gardens, Kolkata' },
  { id:'ipl26_14', number:14, team1:'Rajasthan Royals',            team2:'Mumbai Indians',         date:'2026-04-07', time:'19:30', venue:'Barsapara Cricket Stadium, Guwahati' },
  { id:'ipl26_15', number:15, team1:'Delhi Capitals',              team2:'Chennai Super Kings',    date:'2026-04-08', time:'19:30', venue:'Arun Jaitley Stadium, Delhi' },
  { id:'ipl26_16', number:16, team1:'Kolkata Knight Riders',       team2:'Lucknow Super Giants',   date:'2026-04-09', time:'19:30', venue:'Eden Gardens, Kolkata' },
  { id:'ipl26_17', number:17, team1:'Rajasthan Royals',            team2:'Royal Challengers Bengaluru', date:'2026-04-10', time:'19:30', venue:'Sawai Mansingh Stadium, Jaipur' },
  { id:'ipl26_18', number:18, team1:'Punjab Kings',                team2:'Sunrisers Hyderabad',    date:'2026-04-11', time:'15:30', venue:'PCA Stadium, New Chandigarh' },
  { id:'ipl26_19', number:19, team1:'Chennai Super Kings',         team2:'Delhi Capitals',         date:'2026-04-11', time:'19:30', venue:'MA Chidambaram Stadium, Chennai' },
  { id:'ipl26_20', number:20, team1:'Mumbai Indians',              team2:'Royal Challengers Bengaluru', date:'2026-04-12', time:'19:30', venue:'Wankhede Stadium, Mumbai' },
];

// ── PREDICTION FIELDS ────────────────────────────────────────
export const PREDICTION_FIELDS = [
  { key: 'winner',             label: 'Match Winner',         icon: '🏆', type: 'team',        points: 2 },
  { key: 'topScorer',          label: 'Top Scorer',           icon: '🏏', type: 'text',        points: 1 },
  { key: 'wicketTaker',        label: 'Top Wicket Taker',     icon: '🎳', type: 'text',        points: 1 },
  { key: 'motm',               label: 'Man of the Match',     icon: '⭐', type: 'text',        points: 2 },
  { key: 'firstInningsRuns',   label: '1st Innings Score',    icon: '📊', type: 'range1st',    points: 1 },
  { key: 'secondInningsRuns',  label: '2nd Innings Score',    icon: '📈', type: 'range2nd',    points: 1 },
  { key: 'mostSixes',          label: 'Most Sixes (Player)',  icon: '💥', type: 'text',        points: 1 },
  { key: 'highestPartnership', label: 'Highest Partnership',  icon: '🤝', type: 'partnership', points: 1 },
];

// ── RANGE OPTIONS ────────────────────────────────────────────
export const RUNS_RANGES_1ST = ['Under 140','140–159','160–179','180–199','200–219','220–239','240+'];
export const RUNS_RANGES_2ND = ['Under 130','130–149','150–169','170–189','190–209','210–229','230+'];
export const PARTNERSHIP_RANGES = ['Under 50','50–74','75–99','100–124','125–149','150+'];

// ── RANGE BUCKETISERS ────────────────────────────────────────
export function bucket1st(n) {
  const ts = [140,160,180,200,220,240];
  for (let i=0;i<ts.length;i++) if (n<ts[i]) return RUNS_RANGES_1ST[i];
  return RUNS_RANGES_1ST[RUNS_RANGES_1ST.length-1];
}
export function bucket2nd(n) {
  const ts = [130,150,170,190,210,230];
  for (let i=0;i<ts.length;i++) if (n<ts[i]) return RUNS_RANGES_2ND[i];
  return RUNS_RANGES_2ND[RUNS_RANGES_2ND.length-1];
}
export function bucketP(n) {
  const ts = [50,75,100,125,150];
  for (let i=0;i<ts.length;i++) if (n<ts[i]) return PARTNERSHIP_RANGES[i];
  return PARTNERSHIP_RANGES[PARTNERSHIP_RANGES.length-1];
}

// ── SCORING ──────────────────────────────────────────────────
export function isCorrect(key, predVal, result) {
  if (!result || !predVal) return false;
  const norm = s => (s||'').toLowerCase().trim().replace(/\s+/g,' ');
  if (key==='winner'||key==='firstInningsRuns'||key==='secondInningsRuns'||key==='highestPartnership')
    return predVal === result[key];
  return norm(predVal) === norm(result[key]);
}

export function calcScore(pred, result) {
  if (!pred||!result) return { score:0, points:0, total:0, breakdown:{} };
  let score=0, points=0, total=0;
  const breakdown={};
  PREDICTION_FIELDS.forEach(f => {
    if (!pred[f.key]) return;
    total++;
    const ok = isCorrect(f.key, pred[f.key], result);
    breakdown[f.key]=ok;
    if (ok) { score++; points+=f.points; }
  });
  return { score, points, total, breakdown };
}

// ── HELPERS ──────────────────────────────────────────────────
export function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr+'T00:00:00').toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'});
}
export function encodeB64(obj) {
  try { return btoa(unescape(encodeURIComponent(JSON.stringify(obj)))); } catch { return ''; }
}
export function decodeB64(str) {
  try { return JSON.parse(decodeURIComponent(escape(atob(str)))); } catch { return null; }
}

export const ADMIN_PASSWORD = 'ipl2026';
