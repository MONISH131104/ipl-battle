import { useState, useEffect, useCallback, useRef } from 'react';
import {
  collection, doc, setDoc, onSnapshot, getDoc, getDocs, deleteDoc
} from 'firebase/firestore';
import { db } from './firebase';
import './App.css';
import {
  IPL_TEAMS, IPL_2026_MATCHES, PREDICTION_FIELDS,
  RUNS_RANGES_1ST, RUNS_RANGES_2ND, PARTNERSHIP_RANGES,
  TEAM_COLOR, TEAM_SHORT, calcScore, isCorrect, formatDate,
  encodeB64, decodeB64, ADMIN_PASSWORD,
  bucket1st, bucket2nd, bucketP
} from './data';

/* ─── HELPERS ───────────────────────────────────────────────── */
const tColor = n => TEAM_COLOR[n] || '#888';
const tShort = n => TEAM_SHORT[n] || (n||'').slice(0,3).toUpperCase();
const norm = s => (s||'').toLowerCase().trim().replace(/\s+/g,' ');

function loadUser() {
  try { return JSON.parse(localStorage.getItem('ipl26_user')); } catch { return null; }
}
function saveUser(u) {
  try { localStorage.setItem('ipl26_user', JSON.stringify(u)); } catch {}
}

/* ─── TOAST ─────────────────────────────────────────────────── */
function Toast({ toasts, remove }) {
  return (
    <div className="toast-wrap">
      {toasts.map(t => (
        <div key={t.id} className="toast" onClick={() => remove(t.id)}>{t.msg}</div>
      ))}
    </div>
  );
}

/* ─── LEADERBOARD POPUP ─────────────────────────────────────── */
function LeaderboardPopup({ ranked, matchInfo, onClose }) {
  return (
    <div className="lb-popup-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="lb-popup">
        <div className="lb-popup-crown">🏆</div>
        <div className="lb-popup-title">LEADERBOARD UPDATED!</div>
        <div className="lb-popup-sub">
          {matchInfo ? `${matchInfo.team1} vs ${matchInfo.team2} · Results are in!` : 'New results scored'}
        </div>
        {ranked.map((p, i) => {
          const rcls = ['rc1','rc2','rc3','rc4'][Math.min(i,3)];
          const rcls2 = ['lb-r1','lb-r2','lb-r3',''][Math.min(i,3)];
          const acc = p.total ? Math.round(p.points/p.maxPoints*100) : 0;
          return (
            <div key={p.name} className={`lb-row ${rcls2}`} style={{marginBottom:8}}>
              <div><div className={`rank-circle ${rcls}`}>{i+1}</div></div>
              <div>
                <div style={{fontWeight:500,fontSize:15}}>{p.name} {i===0?'👑':''}</div>
                <div className="acc-bar"><div className="acc-fill" style={{width:acc+'%'}} /></div>
              </div>
              <div className="text-right text-green" style={{fontFamily:'Rajdhani',fontSize:20,fontWeight:700}}>{p.points}</div>
              <div className="text-right" style={{fontFamily:'Rajdhani',fontSize:16}}>{acc}%</div>
              <div className="text-right text-muted">{p.matches}m</div>
              <div className="text-right" style={{fontFamily:'Rajdhani',fontSize:22,fontWeight:800,color:'var(--gold)'}}>{p.seasonPts}</div>
            </div>
          );
        })}
        <button className="btn btn-full mt20" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

/* ─── PREDICTION FIELD INPUT ─────────────────────────────────── */
function PredInput({ field, value, onChange, match }) {
  if (field.type==='team') return (
    <select value={value||''} onChange={e=>onChange(e.target.value)}>
      <option value="">Pick winner…</option>
      {[match.team1,match.team2].map(t=><option key={t} value={t}>{t}</option>)}
    </select>
  );
  if (field.type==='range1st') return (
    <select value={value||''} onChange={e=>onChange(e.target.value)}>
      <option value="">Select range…</option>
      {RUNS_RANGES_1ST.map(r=><option key={r} value={r}>{r} runs</option>)}
    </select>
  );
  if (field.type==='range2nd') return (
    <select value={value||''} onChange={e=>onChange(e.target.value)}>
      <option value="">Select range…</option>
      {RUNS_RANGES_2ND.map(r=><option key={r} value={r}>{r} runs</option>)}
    </select>
  );
  if (field.type==='partnership') return (
    <select value={value||''} onChange={e=>onChange(e.target.value)}>
      <option value="">Select range…</option>
      {PARTNERSHIP_RANGES.map(r=><option key={r} value={r}>{r} runs</option>)}
    </select>
  );
  return (
    <input type="text" placeholder="Player name…" value={value||''} onChange={e=>onChange(e.target.value)} />
  );
}

/* ─── PREDICTION MODAL ───────────────────────────────────────── */
function PredModal({ match, existing, onSave, onClose }) {
  const [form, setForm] = useState({
    winner:'',topScorer:'',wicketTaker:'',motm:'',
    firstInningsRuns:'',secondInningsRuns:'',mostSixes:'',highestPartnership:'',stakes:'',
    ...existing
  });
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const save=()=>{ if(!form.winner){alert('Pick a winner!');return;} onSave(form); };
  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-hdr">
          <div>
            <div className="modal-title">Your Predictions</div>
            <div className="text-muted mt6">{tShort(match.team1)} vs {tShort(match.team2)} · {formatDate(match.date)}</div>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="g2">
          {PREDICTION_FIELDS.map(f=>(
            <div className="pred-fg" key={f.key}>
              <div className="pred-lbl"><span>{f.icon}</span>{f.label}
                <span style={{marginLeft:'auto',fontSize:10,color:'var(--gold)',opacity:.7}}>{f.points}pt{f.points>1?'s':''}</span>
              </div>
              <PredInput field={f} value={form[f.key]} onChange={v=>set(f.key,v)} match={match}/>
            </div>
          ))}
        </div>
        <div className="fg mt16">
          <label>💰 Stakes (what loser does/pays)</label>
          <input type="text" placeholder="e.g. Buy group chai, ₹100…" value={form.stakes||''} onChange={e=>set('stakes',e.target.value)}/>
        </div>
        <div style={{fontSize:12,color:'var(--muted2)',marginTop:8}}>
          Points: Winner=2, MOTM=2, others=1 each. Max {PREDICTION_FIELDS.reduce((a,f)=>a+f.points,0)} pts per match.
        </div>
        <button className="btn btn-full mt16" onClick={save}>🔒 Lock In Predictions</button>
      </div>
    </div>
  );
}

/* ─── RESULT MODAL ───────────────────────────────────────────── */
function ResultModal({ match, existing, onSave, onClose }) {
  const [form,setForm]=useState({winner:'',topScorer:'',wicketTaker:'',motm:'',fi:'',si:'',hp:'',ms:'',...(existing||{})});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const save=()=>{
    if(!form.winner){alert('Select winner');return;}
    onSave({
      winner:form.winner, topScorer:form.topScorer, wicketTaker:form.wicketTaker, motm:form.motm,
      mostSixes:form.ms,
      firstInningsRuns: bucket1st(parseInt(form.fi)||0),
      secondInningsRuns: bucket2nd(parseInt(form.si)||0),
      highestPartnership: bucketP(parseInt(form.hp)||0),
      firstInningsExact: form.fi, secondInningsExact: form.si,
    });
  };
  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-hdr">
          <div><div className="modal-title">Enter Match Result</div>
            <div className="text-muted mt6">{match.team1} vs {match.team2}</div>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="g2">
          <div className="fg"><label>🏆 Winner</label>
            <select value={form.winner} onChange={e=>set('winner',e.target.value)}>
              <option value="">Select…</option>
              <option value={match.team1}>{match.team1}</option>
              <option value={match.team2}>{match.team2}</option>
            </select>
          </div>
          <div className="fg"><label>⭐ Man of the Match</label>
            <input type="text" placeholder="Player name" value={form.motm} onChange={e=>set('motm',e.target.value)}/>
          </div>
          <div className="fg"><label>🏏 Top Scorer</label>
            <input type="text" placeholder="Player name" value={form.topScorer} onChange={e=>set('topScorer',e.target.value)}/>
          </div>
          <div className="fg"><label>🎳 Top Wicket Taker</label>
            <input type="text" placeholder="Player name" value={form.wicketTaker} onChange={e=>set('wicketTaker',e.target.value)}/>
          </div>
          <div className="fg"><label>📊 1st Innings Runs (exact)</label>
            <input type="number" placeholder="e.g. 186" value={form.fi} onChange={e=>set('fi',e.target.value)}/>
            {form.fi&&<div style={{fontSize:11,color:'var(--gold)',marginTop:3}}>Range: {bucket1st(parseInt(form.fi)||0)}</div>}
          </div>
          <div className="fg"><label>📈 2nd Innings Runs (exact)</label>
            <input type="number" placeholder="e.g. 162" value={form.si} onChange={e=>set('si',e.target.value)}/>
            {form.si&&<div style={{fontSize:11,color:'var(--gold)',marginTop:3}}>Range: {bucket2nd(parseInt(form.si)||0)}</div>}
          </div>
          <div className="fg"><label>💥 Most Sixes (Player)</label>
            <input type="text" placeholder="Player name" value={form.ms} onChange={e=>set('ms',e.target.value)}/>
          </div>
          <div className="fg"><label>🤝 Highest Partnership (runs)</label>
            <input type="number" placeholder="e.g. 112" value={form.hp} onChange={e=>set('hp',e.target.value)}/>
            {form.hp&&<div style={{fontSize:11,color:'var(--gold)',marginTop:3}}>Range: {bucketP(parseInt(form.hp)||0)}</div>}
          </div>
        </div>
        <button className="btn btn-full mt20" onClick={save}>✅ Save & Auto-Score All Predictions</button>
      </div>
    </div>
  );
}

/* ─── ADD MATCH MODAL ────────────────────────────────────────── */
function AddMatchModal({ onSave, onClose }) {
  const [form,setForm]=useState({team1:'',team2:'',date:'',time:'19:30',venue:'',number:''});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const save=()=>{
    if(!form.team1||!form.team2||!form.date){alert('Fill required fields');return;}
    if(form.team1===form.team2){alert('Teams must differ');return;}
    onSave({...form,id:'m_'+Date.now()});
  };
  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-hdr"><div className="modal-title">Add New Match</div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="g2">
          <div className="fg"><label>Team 1</label>
            <select value={form.team1} onChange={e=>set('team1',e.target.value)}>
              <option value="">Select team</option>
              {IPL_TEAMS.map(t=><option key={t.name} value={t.name}>{t.name}</option>)}
            </select>
          </div>
          <div className="fg"><label>Team 2</label>
            <select value={form.team2} onChange={e=>set('team2',e.target.value)}>
              <option value="">Select team</option>
              {IPL_TEAMS.map(t=><option key={t.name} value={t.name}>{t.name}</option>)}
            </select>
          </div>
          <div className="fg"><label>Date</label>
            <input type="date" value={form.date} onChange={e=>set('date',e.target.value)}/>
          </div>
          <div className="fg"><label>Time (IST)</label>
            <input type="time" value={form.time} onChange={e=>set('time',e.target.value)}/>
          </div>
          <div className="fg"><label>Venue</label>
            <input type="text" placeholder="Stadium name" value={form.venue} onChange={e=>set('venue',e.target.value)}/>
          </div>
          <div className="fg"><label>Match Number</label>
            <input type="text" placeholder="e.g. 21" value={form.number} onChange={e=>set('number',e.target.value)}/>
          </div>
        </div>
        <button className="btn btn-full mt20" onClick={save}>Add Match</button>
      </div>
    </div>
  );
}

/* ─── MAIN APP ───────────────────────────────────────────────── */
export default function App() {
  const [page, setPage] = useState('matches');
  const [user, setUser] = useState(() => loadUser());
  const [matches, setMatches] = useState([]);
  const [predictions, setPredictions] = useState({}); // key: matchId__userName
  const [results, setResults] = useState({});
  const [members, setMembers] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [showSetup, setShowSetup] = useState(!loadUser());
  const [nameInput, setNameInput] = useState('');
  const [groupInput, setGroupInput] = useState('');
  const [predModal, setPredModal] = useState(null);
  const [resultModal, setResultModal] = useState(null);
  const [addMatchModal, setAddMatchModal] = useState(false);
  const [adminAuthed, setAdminAuthed] = useState(false);
  const [adminPass, setAdminPass] = useState('');
  const [lbPopup, setLbPopup] = useState(null); // {ranked, matchInfo}
  const [dbOk, setDbOk] = useState(true);
  const prevResultsRef = useRef({});
  const isInitialLoad = useRef(true);

  const toast = useCallback((msg) => {
    const id = Date.now()+Math.random();
    setToasts(t=>[...t,{id,msg}]);
    setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),3500);
  },[]);

  // ── FIREBASE LISTENERS ─────────────────────────────────────
  useEffect(() => {
    // Matches
    const unsubMatches = onSnapshot(collection(db,'matches'), snap=>{
      const ms = snap.docs.map(d=>({...d.data(),id:d.id}));
      if(!ms.length) {
        // Seed with IPL 2026 matches on first run
        seedMatches();
      } else {
        setMatches(ms.sort((a,b)=>new Date(a.date)-new Date(b.date)));
      }
      setDbOk(true);
    }, ()=>setDbOk(false));

    // Predictions
    const unsubPreds = onSnapshot(collection(db,'predictions'), snap=>{
      const obj={};
      snap.docs.forEach(d=>{ obj[d.id]=d.data(); });
      setPredictions(obj);
    });

    // Results — trigger leaderboard popup when new result added
    const unsubResults = onSnapshot(collection(db,'results'), snap=>{
      const obj={};
      snap.docs.forEach(d=>{ obj[d.id]=d.data(); });

      if (!isInitialLoad.current) {
        // Find newly added results
        const prev = prevResultsRef.current;
        const newResultIds = Object.keys(obj).filter(id => !prev[id]);
        if (newResultIds.length > 0) {
          // Delay slightly to let predictions state settle
          setTimeout(() => {
            setResults(obj);
            // Trigger popup — get match info for first new result
            const matchId = newResultIds[0];
            setLbPopup({ matchId });
          }, 400);
          prevResultsRef.current = obj;
          return;
        }
      } else {
        isInitialLoad.current = false;
      }

      prevResultsRef.current = obj;
      setResults(obj);
    });

    // Members
    const unsubMembers = onSnapshot(collection(db,'members'), snap=>{
      setMembers(snap.docs.map(d=>({...d.data(),id:d.id})));
    });

    return () => { unsubMatches(); unsubPreds(); unsubResults(); unsubMembers(); };
  }, []);

  // Check URL for versus view
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get('view')==='versus') setPage('versus');
  }, []);

  async function seedMatches() {
    for (const m of IPL_2026_MATCHES) {
      await setDoc(doc(db,'matches',m.id), m);
    }
  }

  // ── BUILD RANKED LIST ──────────────────────────────────────
  const buildRanked = useCallback((predsObj, resultsObj) => {
    const scoreMap={};
    Object.values(predsObj).forEach(pred=>{
      if(!scoreMap[pred.userName]) scoreMap[pred.userName]={name:pred.userName,points:0,score:0,total:0,maxPoints:0,matches:0};
      const result = resultsObj[pred.matchId];
      if (result) {
        const {score,points,total}=calcScore(pred,result);
        scoreMap[pred.userName].score+=score;
        scoreMap[pred.userName].points+=points;
        scoreMap[pred.userName].total+=total;
        scoreMap[pred.userName].maxPoints+=PREDICTION_FIELDS.reduce((a,f)=>pred[f.key]?a+f.points:a,0);
        scoreMap[pred.userName].matches++;
      }
    });
    return Object.values(scoreMap)
      .sort((a,b)=>b.points!==a.points?b.points-a.points:(b.maxPoints?b.points/b.maxPoints:0)-(a.maxPoints?a.points/a.maxPoints:0))
      .map(p=>({...p, seasonPts: p.points*10 }));
  },[]);

  // Trigger popup when lbPopup matchId is set
  useEffect(() => {
    if (!lbPopup?.matchId) return;
    const ranked = buildRanked(predictions, results);
    const matchInfo = matches.find(m=>m.id===lbPopup.matchId);
    setLbPopup({ranked, matchInfo});
  }, [lbPopup?.matchId, predictions, results, matches, buildRanked]);

  // ── JOIN / IDENTITY ────────────────────────────────────────
  const join = async () => {
    const name=nameInput.trim(), group=groupInput.trim();
    if(!name){toast('Enter your name');return;}
    if(!group){toast('Enter a group name');return;}
    const u={name,group};
    setUser(u); saveUser(u);
    setShowSetup(false);
    // Register in Firestore members
    await setDoc(doc(db,'members',`${group}__${name}`),{name,group,joinedAt:Date.now()});
    toast(`Welcome, ${name}! 🏏`);
  };

  // ── SAVE PREDICTION ────────────────────────────────────────
  const savePred = async (form) => {
    if(!user) return;
    const key=`${predModal}__${user.name}`;
    const pred={...form,matchId:predModal,userName:user.name,group:user.group,savedAt:Date.now()};
    await setDoc(doc(db,'predictions',key),pred);
    setPredModal(null);
    toast('Predictions locked in! 🔒');
  };

  // ── SAVE RESULT (admin) ────────────────────────────────────
  const saveResult = async (result) => {
    const matchId=resultModal.id;
    const finalResult={...result,matchId,savedAt:Date.now()};
    await setDoc(doc(db,'results',matchId),finalResult);
    setResultModal(null);
    toast('Results saved! Scoring all predictions… ✅');
  };

  // ── ADD MATCH ──────────────────────────────────────────────
  const addMatch = async (m) => {
    await setDoc(doc(db,'matches',m.id),m);
    setAddMatchModal(false);
    toast('Match added!');
  };

  // ── DELETE MATCH ───────────────────────────────────────────
  const deleteMatch = async (id) => {
    if(!window.confirm('Delete this match?')) return;
    await deleteDoc(doc(db,'matches',id));
    toast('Match deleted');
  };

  // ── MY PREDICTIONS ─────────────────────────────────────────
  const myPreds = user ? Object.values(predictions).filter(p=>p.userName===user.name) : [];
  const ranked = buildRanked(predictions, results);

  // ── FIREBASE NOT CONFIGURED CHECK ─────────────────────────
  const firebaseNotConfigured = !dbOk || (typeof process !== 'undefined' && false);

  /* ═══════════════════ SETUP SCREEN ════════════════════════ */
  if (showSetup) return (
    <div className="setup">
      <div className="setup-card">
        <div className="setup-icon">🏏</div>
        <div className="setup-title">IPL BATTLE 2026</div>
        <div className="setup-sub">Real-time group cricket predictions</div>
        {!dbOk && (
          <div className="setup-warn">
            <strong>⚠️ Firebase not configured yet</strong>
            Open <code>src/firebase.js</code> and add your Firebase credentials.
            See README.md for the 5-minute setup guide.
          </div>
        )}
        <div className="g2" style={{textAlign:'left',marginBottom:16}}>
          <div className="fg">
            <label>Your Name</label>
            <input type="text" placeholder="e.g. Rahul" value={nameInput} onChange={e=>setNameInput(e.target.value)}/>
          </div>
          <div className="fg">
            <label>Group Code</label>
            <input type="text" placeholder="e.g. FriendsBattle" value={groupInput} onChange={e=>setGroupInput(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&join()}/>
          </div>
        </div>
        <button className="btn btn-full" onClick={join}>Join the Battle 🏏</button>
        <div className="text-muted mt10" style={{fontSize:12}}>
          All your friends must use the same Group Code to see each other
        </div>
      </div>
    </div>
  );

  /* ═══════════════════ MAIN APP ════════════════════════════ */
  const predMatch = predModal ? matches.find(m=>m.id===predModal) : null;

  return (
    <div className="app">
      <Toast toasts={toasts} remove={id=>setToasts(t=>t.filter(x=>x.id!==id))}/>

      {/* LEADERBOARD POPUP */}
      {lbPopup?.ranked && (
        <LeaderboardPopup
          ranked={lbPopup.ranked}
          matchInfo={lbPopup.matchInfo}
          onClose={()=>setLbPopup(null)}
        />
      )}

      {/* PRED MODAL */}
      {predModal && predMatch && (
        <PredModal match={predMatch} existing={predictions[`${predModal}__${user?.name}`]}
          onSave={savePred} onClose={()=>setPredModal(null)}/>
      )}

      {/* RESULT MODAL */}
      {resultModal && (
        <ResultModal match={resultModal} existing={results[resultModal.id]}
          onSave={saveResult} onClose={()=>setResultModal(null)}/>
      )}

      {/* ADD MATCH MODAL */}
      {addMatchModal && <AddMatchModal onSave={addMatch} onClose={()=>setAddMatchModal(false)}/>}

      {/* HEADER */}
      <div className="header">
        <div className="header-inner">
          <div className="brand">
            <div className="brand-pill">IPL 2026</div>
            <div className="brand-title">PREDICTION <em>BATTLE</em>
              <span className="live-dot" title="Real-time sync active"/>
            </div>
          </div>
          <div className="nav">
            {[
              {id:'matches',label:'🏏 Matches'},
              {id:'mypicks',label:'🎯 My Picks'},
              {id:'versus',label:'⚔️ Versus'},
              {id:'leaderboard',label:'🏆 Leaderboard'},
              {id:'admin',label:'⚙️ Admin'},
            ].map(n=>(
              <button key={n.id} className={`nav-btn${page===n.id?' active':''}`} onClick={()=>setPage(n.id)}>
                {n.label}
              </button>
            ))}
          </div>
          <div className="user-chip" onClick={()=>setShowSetup(true)}>
            👤 {user?.name} <span style={{fontSize:11,opacity:.6}}>· {user?.group}</span>
          </div>
        </div>
      </div>

      <div className="main">

        {/* ── MATCHES PAGE ──────────────────────────────────── */}
        {page==='matches' && (
          <div>
            <div className="hero">
              <div className="hero-title">IPL PREDICTION BATTLE</div>
              <div className="hero-sub">
                <span className="online-dot"/>
                Real-time · All friends see the same data instantly
              </div>
              <div className="hero-badges">
                <span className="badge badge-gold">👥 {members.length} players</span>
                <span className="badge badge-done">✅ {Object.keys(results).length} results in</span>
                <span className="badge badge-up">📋 {matches.length} matches</span>
              </div>
            </div>
            <div className="sec-head">
              <div className="sec-title">IPL 2026 — All Matches</div>
            </div>
            {!matches.length ? (
              <div className="empty"><div className="empty-icon">⏳</div>
                <h3>Loading matches…</h3><p>Connecting to database</p>
              </div>
            ) : matches.map(match=>{
              const result = results[match.id];
              const myPred = user ? predictions[`${match.id}__${user.name}`] : null;
              const {score,points,total,breakdown} = result&&myPred ? calcScore(myPred,result) : {score:0,points:0,total:0,breakdown:{}};
              return (
                <div className="mc" key={match.id}>
                  <div className="mc-top">
                    <div className="mc-meta-row">
                      {match.number&&<span className="mc-num">Match #{match.number}</span>}
                      <span className={`badge ${result?'badge-done':match.isPlayoff?'badge-po':'badge-up'}`}>
                        {result?'✓ Completed':match.isPlayoff?'🏆 Playoff':'Upcoming'}
                      </span>
                      {myPred&&!result&&<span className="badge badge-gold">🔒 Locked</span>}
                    </div>
                    <div className="mc-teams">
                      <div className="flex-center" style={{gap:8,flex:1}}>
                        <div className="team-dot" style={{background:tColor(match.team1)}}/>
                        <div>
                          <div className="team-full" style={{color:tColor(match.team1)}}>{match.team1}</div>
                          <div className="team-short-lbl">{tShort(match.team1)}</div>
                        </div>
                      </div>
                      <div className="vs-lbl">VS</div>
                      <div className="flex-center" style={{gap:8,flex:1}}>
                        <div className="team-dot" style={{background:tColor(match.team2)}}/>
                        <div>
                          <div className="team-full" style={{color:tColor(match.team2)}}>{match.team2}</div>
                          <div className="team-short-lbl">{tShort(match.team2)}</div>
                        </div>
                      </div>
                    </div>
                    <div className="mc-info">
                      <span>📅 {formatDate(match.date)}</span>
                      <span>🕐 {match.time} IST</span>
                      {match.venue&&<span>📍 {match.venue}</span>}
                    </div>
                    {result&&(
                      <div className="rg">
                        {[
                          {l:'🏆 Winner',v:result.winner},
                          {l:'⭐ MOTM',v:result.motm},
                          {l:'🏏 Top Scorer',v:result.topScorer},
                          {l:'🎳 Top Wickets',v:result.wicketTaker},
                          {l:'📊 1st Innings',v:result.firstInningsExact?`${result.firstInningsExact} (${result.firstInningsRuns})`:result.firstInningsRuns},
                          {l:'📈 2nd Innings',v:result.secondInningsExact?`${result.secondInningsExact} (${result.secondInningsRuns})`:result.secondInningsRuns},
                        ].filter(x=>x.v).map(x=>(
                          <div className="rg-field" key={x.l}>
                            <div className="rg-label">{x.l}</div>
                            <div className="rg-value">{x.v}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {myPred&&(
                      <div className="pills">
                        {PREDICTION_FIELDS.filter(f=>myPred[f.key]).map(f=>{
                          const st=result?(isCorrect(f.key,myPred[f.key],result)?'ok':'bad'):'pending';
                          return <div key={f.key} className={`pill pill-${st}`}>
                            {f.icon} {f.label}: <strong>{myPred[f.key]}</strong>
                            {result&&(st==='ok'?' ✓':' ✗')}
                          </div>;
                        })}
                        {result&&<div className="pill pill-ok" style={{background:'rgba(255,179,0,.12)',borderColor:'var(--border)',color:'var(--gold)'}}>
                          {points}pts / {PREDICTION_FIELDS.filter(f=>myPred[f.key]).reduce((a,f)=>a+f.points,0)} possible
                        </div>}
                      </div>
                    )}
                  </div>
                  <div className="mc-bottom">
                    <div className="flex-gap">
                      {!result&&user&&(
                        <button className="btn btn-sm" onClick={()=>setPredModal(match.id)}>
                          {myPred?'✏️ Edit Picks':'🎯 Predict'}
                        </button>
                      )}
                    </div>
                    {!result&&!user&&<span className="text-muted">Set name to predict</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── MY PICKS PAGE ──────────────────────────────────── */}
        {page==='mypicks' && (
          <div>
            <div className="sec-head mb16">
              <div className="sec-title">My Predictions</div>
              {user&&<div className="user-chip">👤 {user.name}</div>}
            </div>
            {!myPreds.length ? (
              <div className="empty"><div className="empty-icon">🎯</div>
                <h3>No predictions yet</h3>
                <p>Click Predict on any upcoming match</p>
              </div>
            ) : (
              <>
                <div className="stat-row">
                  <div className="stat-chip">
                    <div className="stat-lbl">Predictions Made</div>
                    <div className="stat-val">{myPreds.length}</div>
                  </div>
                  <div className="stat-chip">
                    <div className="stat-lbl">Season Points</div>
                    <div className="stat-val text-green">
                      {myPreds.reduce((a,p)=>{const r=results[p.matchId];return a+(r?calcScore(p,r).points:0);},0)*10}
                    </div>
                  </div>
                  <div className="stat-chip">
                    <div className="stat-lbl">My Rank</div>
                    <div className="stat-val">{ranked.findIndex(r=>r.name===user?.name)+1||'—'}</div>
                    <div className="stat-sub">of {ranked.length}</div>
                  </div>
                </div>
                {myPreds.map(pred=>{
                  const match=matches.find(m=>m.id===pred.matchId);
                  if(!match) return null;
                  const result=results[pred.matchId];
                  const {points,total}=result?calcScore(pred,result):{points:0,total:0};
                  const maxPts=PREDICTION_FIELDS.filter(f=>pred[f.key]).reduce((a,f)=>a+f.points,0);
                  return (
                    <div className="mc" key={pred.matchId}>
                      <div className="mc-top">
                        <div className="mc-meta-row">
                          <span className={`badge ${result?'badge-done':'badge-up'}`}>{result?'✓ Done':'Upcoming'}</span>
                          {result&&<span style={{fontFamily:'Rajdhani',fontSize:16,fontWeight:700,color:'var(--gold)'}}>
                            {points}/{maxPts} pts
                          </span>}
                        </div>
                        <div style={{fontFamily:'Rajdhani',fontSize:20,fontWeight:700,marginBottom:6}}>
                          <span style={{color:tColor(match.team1)}}>{tShort(match.team1)}</span>
                          <span style={{color:'var(--muted)'}}> vs </span>
                          <span style={{color:tColor(match.team2)}}>{tShort(match.team2)}</span>
                        </div>
                        <div className="text-muted mb10">{formatDate(match.date)}</div>
                        <div className="pills">
                          {PREDICTION_FIELDS.filter(f=>pred[f.key]).map(f=>{
                            const st=result?(isCorrect(f.key,pred[f.key],result)?'ok':'bad'):'pending';
                            return <div key={f.key} className={`pill pill-${st}`}>
                              {f.icon} {f.label}: <strong>{pred[f.key]}</strong>
                              {result&&(st==='ok'?' ✓':' ✗')}
                            </div>;
                          })}
                        </div>
                      </div>
                      {!result&&(
                        <div className="mc-bottom">
                          <button className="btn btn-o btn-sm" onClick={()=>setPredModal(match.id)}>✏️ Edit Picks</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}

        {/* ── VERSUS PAGE ────────────────────────────────────── */}
        {page==='versus' && (
          <VersusPage matches={matches} predictions={predictions} results={results}
            user={user} toast={toast} onPredict={id=>setPredModal(id)}/>
        )}

        {/* ── LEADERBOARD PAGE ───────────────────────────────── */}
        {page==='leaderboard' && (
          <LeaderboardPage ranked={ranked} results={results} matches={matches}
            members={members} user={user} predictions={predictions}/>
        )}

        {/* ── ADMIN PAGE ─────────────────────────────────────── */}
        {page==='admin' && (
          <AdminPage
            authed={adminAuthed} pass={adminPass} setPass={setAdminPass}
            onLogin={()=>{ if(adminPass===ADMIN_PASSWORD){setAdminAuthed(true);toast('Admin unlocked 🔐');}else toast('Wrong password'); }}
            matches={matches} predictions={predictions} results={results}
            onAddMatch={()=>setAddMatchModal(true)}
            onEnterResult={m=>setResultModal(m)}
            onDeleteMatch={deleteMatch}
            toast={toast}
          />
        )}

      </div>
    </div>
  );
}

/* ─── VERSUS PAGE ────────────────────────────────────────────── */
function VersusPage({ matches, predictions, results, user, toast, onPredict }) {
  const [matchId, setMatchId] = useState('');
  const [stakes, setStakes] = useState('');
  const [linkInput, setLinkInput] = useState('');
  const [vsData, setVsData] = useState(null);

  useEffect(() => {
    const p=new URLSearchParams(window.location.search);
    if(p.get('view')==='versus'){
      const d=decodeB64(p.get('challenge'));
      if(d) setVsData(d);
    }
  },[]);

  const myPred = matchId&&user ? predictions[`${matchId}__${user.name}`] : null;

  const generateLink = () => {
    if(!matchId){toast('Pick a match');return null;}
    if(!myPred){toast('Make your prediction first!');return null;}
    const payload=encodeB64({matchId,challenger:user.name,challengerPred:myPred,stakes});
    return `${window.location.href.split('?')[0]}?view=versus&challenge=${payload}`;
  };

  const shareUrl = matchId&&myPred ? generateLink() : null;
  const copy = () => {
    if(!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(()=>toast('Link copied! 📋')).catch(()=>toast('Copy manually'));
  };

  const loadLink = () => {
    try {
      const d=decodeB64(new URL(linkInput).searchParams.get('challenge'));
      if(!d){toast('Invalid link');return;}
      setVsData(d);
    } catch {toast('Invalid URL');}
  };

  const vsMatch = vsData ? matches.find(m=>m.id===vsData.matchId) : null;
  const vsResult = vsData ? results[vsData.matchId] : null;
  const myVsPred = vsData&&user ? predictions[`${vsData.matchId}__${user.name}`] : null;

  const renderCard = (pred, name, isMe) => {
    if (!pred) return (
      <div className="card">
        <div style={{fontFamily:'Rajdhani',fontSize:18,fontWeight:700,color:'var(--gold)',marginBottom:14}}>{name}</div>
        <div className="empty"><div className="empty-icon">🎯</div><p>No picks yet</p></div>
        {isMe&&user&&vsData&&<button className="btn btn-full mt16" onClick={()=>onPredict(vsData.matchId)}>Make My Picks</button>}
      </div>
    );
    const {points,breakdown,total}=vsResult?calcScore(pred,vsResult):{points:0,breakdown:{},total:0};
    const maxPts=PREDICTION_FIELDS.filter(f=>pred[f.key]).reduce((a,f)=>a+f.points,0);
    return (
      <div className="card">
        <div className="flex-between mb16">
          <div style={{fontFamily:'Rajdhani',fontSize:18,fontWeight:700,color:'var(--gold)'}}>{name}</div>
          {vsResult&&<div className="score-big">{points}<span style={{fontSize:16,color:'var(--muted2)'}}>/{maxPts}</span></div>}
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:6}}>
          {PREDICTION_FIELDS.filter(f=>pred[f.key]).map(f=>{
            const st=vsResult?(breakdown[f.key]?'ok':'bad'):'pending';
            return <div key={f.key} style={{
              background:st==='ok'?'var(--green-bg)':st==='bad'?'var(--red-bg)':'rgba(255,255,255,.03)',
              border:`1px solid ${st==='ok'?'var(--green-border)':st==='bad'?'var(--red-border)':'var(--border2)'}`,
              borderRadius:8,padding:'8px 12px',display:'flex',justifyContent:'space-between',alignItems:'center'
            }}>
              <span style={{fontSize:12,color:'var(--muted2)'}}>{f.icon} {f.label}</span>
              <span style={{fontFamily:'Rajdhani',fontSize:15,fontWeight:600}}>
                {pred[f.key]} {vsResult?(breakdown[f.key]?'✓':'✗'):''}
              </span>
            </div>;
          })}
        </div>
        {pred.stakes&&<div className="text-muted mt10">💰 Stakes: {pred.stakes}</div>}
      </div>
    );
  };

  return (
    <div>
      <div className="card gold mb16">
        <div className="card-title">⚔️ Create a Challenge</div>
        <div className="g2">
          <div className="fg"><label>Select Match</label>
            <select value={matchId} onChange={e=>setMatchId(e.target.value)}>
              <option value="">-- Pick a match --</option>
              {matches.map(m=><option key={m.id} value={m.id}>{tShort(m.team1)} vs {tShort(m.team2)} · {formatDate(m.date)}</option>)}
            </select>
          </div>
          <div className="fg"><label>Stakes</label>
            <input type="text" placeholder="e.g. Buy group dinner, ₹100" value={stakes} onChange={e=>setStakes(e.target.value)}/>
          </div>
        </div>
        {matchId&&!myPred&&(
          <div className="mt10" style={{fontSize:13,color:'var(--gold)'}}>
            ⚠️ Make your picks first!
            <button className="btn btn-o btn-sm" style={{marginLeft:10}} onClick={()=>onPredict(matchId)}>Make Picks</button>
          </div>
        )}
        {shareUrl&&(
          <div className="mt16">
            <label>Share this link:</label>
            <div className="share-row">
              <div className="share-url">{shareUrl}</div>
              <button className="btn btn-sm" onClick={copy}>Copy</button>
            </div>
          </div>
        )}
      </div>

      <div className="card mb16">
        <div className="card-title">🔗 Open a Challenge Link</div>
        <div className="flex-gap">
          <input type="text" placeholder="Paste challenge URL…" value={linkInput} onChange={e=>setLinkInput(e.target.value)} style={{flex:1}}/>
          <button className="btn btn-o" onClick={loadLink}>Load</button>
        </div>
      </div>

      {vsData&&vsMatch&&(
        <div>
          <div className="mb16">
            <div style={{fontFamily:'Rajdhani',fontSize:26,fontWeight:800,color:'var(--gold)',marginBottom:4}}>
              {vsMatch.team1} vs {vsMatch.team2}
            </div>
            <div className="text-muted">{formatDate(vsMatch.date)} · {vsMatch.venue}</div>
          </div>
          {vsData.stakes&&(
            <div className="stakes-box mb16">
              <span style={{fontSize:24}}>🔥</span>
              <div>
                <div style={{fontFamily:'Rajdhani',fontSize:18,fontWeight:700,color:'var(--red)'}}>STAKES: {vsData.stakes}</div>
                <div className="text-muted">Fewer points = you owe this!</div>
              </div>
            </div>
          )}
          <div className="vs-grid">
            {renderCard(vsData.challengerPred,vsData.challenger,false)}
            <div className="vs-mid"><div className="vs-circle">VS</div></div>
            {renderCard(myVsPred,user?.name||'You',true)}
          </div>
          {vsResult&&(()=>{
            const c1=vsData.challengerPred?calcScore(vsData.challengerPred,vsResult).points:0;
            const c2=myVsPred?calcScore(myVsPred,vsResult).points:0;
            return (
              <div className="card mt16" style={{textAlign:'center',padding:20}}>
                {c1>c2?<div style={{fontFamily:'Rajdhani',fontSize:22,color:'var(--gold)'}}>🏆 {vsData.challenger} wins!</div>
                :c2>c1?<div style={{fontFamily:'Rajdhani',fontSize:22,color:'var(--gold)'}}>🏆 {user?.name} wins!</div>
                :<div style={{fontFamily:'Rajdhani',fontSize:22,color:'var(--muted2)'}}>🤝 It's a tie!</div>}
                {vsData.stakes&&<div className="text-muted mt6">Stakes: {vsData.stakes}</div>}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

/* ─── LEADERBOARD PAGE ───────────────────────────────────────── */
function LeaderboardPage({ ranked, results, matches, members, user, predictions }) {
  const completedMatches=Object.keys(results).length;
  const leader=ranked[0];
  const rcls=['lb-r1','lb-r2','lb-r3',''][Symbol.iterator] ? ['lb-r1','lb-r2','lb-r3'] : [];
  const rcircle = i => ['rc1','rc2','rc3','rc4'][Math.min(i,3)];
  const rrow = i => ['lb-r1','lb-r2','lb-r3',''][Math.min(i,3)];

  return (
    <div>
      <div className="stat-row">
        <div className="stat-chip"><div className="stat-lbl">Matches Done</div>
          <div className="stat-val">{completedMatches}</div>
          <div className="stat-sub">of {matches.length}</div>
        </div>
        <div className="stat-chip"><div className="stat-lbl">Season Leader</div>
          <div className="stat-val" style={{fontSize:22}}>{leader?.name||'—'}</div>
          <div className="stat-sub">{leader?`${leader.seasonPts} season pts`:''}</div>
        </div>
        <div className="stat-chip"><div className="stat-lbl">Players</div>
          <div className="stat-val">{ranked.length||members.length}</div>
        </div>
        <div className="stat-chip"><div className="stat-lbl">My Rank</div>
          <div className="stat-val">{ranked.findIndex(r=>r.name===user?.name)+1||'—'}</div>
          <div className="stat-sub">of {ranked.length}</div>
        </div>
      </div>

      {leader&&completedMatches>0&&(
        <div className="card gold mb16" style={{background:'linear-gradient(135deg,rgba(255,179,0,.08),rgba(255,179,0,.03))',textAlign:'center',padding:28}}>
          <div style={{fontSize:44,marginBottom:8}}>👑</div>
          <div style={{fontFamily:'Rajdhani',fontSize:32,fontWeight:800,color:'var(--gold)'}}>{leader.name}</div>
          <div className="text-muted mt6">Season Champion · {leader.seasonPts} Season Points · {leader.matches} matches</div>
        </div>
      )}

      <div className="card">
        <div className="card-title">🏆 Season Rankings</div>
        {!ranked.length?(
          <div className="empty"><div className="empty-icon">📊</div>
            <h3>No scored matches yet</h3>
            <p>Admin enters results → scores update instantly for everyone</p>
          </div>
        ):(
          <>
            <div className="lb-header">
              <div></div><div>Player</div>
              <div className="text-right">Pts</div>
              <div className="text-right">Acc%</div>
              <div className="text-right">Matches</div>
              <div className="text-right">Season Pts</div>
            </div>
            {ranked.map((p,i)=>{
              const acc=p.maxPoints?Math.round(p.points/p.maxPoints*100):0;
              const isMe=user?.name===p.name;
              return (
                <div key={p.name} className={`lb-row ${rrow(i)}`}
                  style={isMe?{outline:'1.5px solid var(--gold)',outlineOffset:'-1px'}:{}}>
                  <div><div className={`rank-circle ${rcircle(i)}`}>{i+1}</div></div>
                  <div>
                    <div style={{fontWeight:500}}>{p.name} {i===0?'👑':''} {isMe&&<span style={{fontSize:11,color:'var(--gold)'}}>← you</span>}</div>
                    <div className="acc-bar"><div className="acc-fill" style={{width:acc+'%'}}/></div>
                  </div>
                  <div className="text-right text-green" style={{fontFamily:'Rajdhani',fontSize:18,fontWeight:700}}>{p.points}</div>
                  <div className="text-right" style={{fontFamily:'Rajdhani',fontSize:15}}>{acc}%</div>
                  <div className="text-right text-muted">{p.matches}</div>
                  <div className="text-right" style={{fontFamily:'Rajdhani',fontSize:20,fontWeight:800,color:'var(--gold)'}}>{p.seasonPts}</div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {ranked.length>1&&completedMatches>0&&(
        <div className="card mt16">
          <div className="card-title">💸 Stakes Settlement</div>
          <div className="text-muted mb10">Based on current standings:</div>
          {ranked.map((p,i)=>(
            <div key={p.name} style={{display:'flex',alignItems:'center',gap:12,padding:'9px 0',borderBottom:'1px solid var(--border2)'}}>
              <div className={`rank-circle ${rcircle(i)}`} style={{width:28,height:28,fontSize:13}}>{i+1}</div>
              <div style={{flex:1}}>{p.name}</div>
              <div style={{fontFamily:'Rajdhani',fontSize:16,color:'var(--gold)'}}>{p.seasonPts} pts</div>
              {i===0&&<span className="badge badge-done">Collects 🏆</span>}
              {i===ranked.length-1&&<span className="badge badge-live">Owes 💸</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── ADMIN PAGE ─────────────────────────────────────────────── */
function AdminPage({ authed, pass, setPass, onLogin, matches, predictions, results, onAddMatch, onEnterResult, onDeleteMatch, toast }) {
  if (!authed) return (
    <div className="card" style={{maxWidth:380}}>
      <div className="card-title">🔐 Admin Login</div>
      <div className="fg mb16">
        <label>Password</label>
        <input type="password" placeholder="Admin password" value={pass} onChange={e=>setPass(e.target.value)}
          onKeyDown={e=>e.key==='Enter'&&onLogin()}/>
      </div>
      <button className="btn" onClick={onLogin}>Login</button>
      <div className="text-muted mt10">Default: <strong style={{color:'var(--gold)'}}>ipl2026</strong></div>
    </div>
  );

  const unresolved = matches.filter(m=>!results[m.id]);
  const allPreds = Object.values(predictions);

  return (
    <div>
      {/* QUICK ACTIONS */}
      <div className="card gold mb16">
        <div className="card-title">⚙️ Admin Controls</div>
        <div className="flex-gap flex-wrap">
          <button className="btn" onClick={onAddMatch}>➕ Add Match</button>
        </div>
        <div className="text-muted mt10" style={{fontSize:12}}>
          <span className="online-dot"/>
          All changes sync instantly to every player's device via Firebase real-time.
        </div>
      </div>

      {/* ENTER RESULTS */}
      <div className="card mb16">
        <div className="card-title">✅ Enter Match Results</div>
        <div style={{fontSize:13,color:'var(--muted2)',marginBottom:14}}>
          When you save a result, all predictions are automatically scored and a leaderboard popup appears for everyone.
        </div>
        {!unresolved.length?(
          <div className="text-muted">All matches have results.</div>
        ):unresolved.map(m=>(
          <div key={m.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 0',borderBottom:'1px solid var(--border2)'}}>
            <div>
              <div style={{fontFamily:'Rajdhani',fontSize:16,fontWeight:700}}>{m.team1} vs {m.team2}</div>
              <div className="text-muted">{formatDate(m.date)} · {m.venue}</div>
            </div>
            <div className="flex-gap">
              <button className="btn btn-o btn-sm" onClick={()=>onEnterResult(m)}>Enter Result</button>
              <button className="btn btn-g btn-xs" onClick={()=>onDeleteMatch(m.id)}>🗑</button>
            </div>
          </div>
        ))}
      </div>

      {/* ALL PREDICTIONS TABLE */}
      <div className="card">
        <div className="card-title">👥 All Predictions ({allPreds.length})</div>
        {!allPreds.length?<div className="text-muted">None yet.</div>:(
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
              <thead>
                <tr style={{borderBottom:'1px solid var(--border2)'}}>
                  {['User','Match','Winner Pick','MOTM','1st Inn','2nd Inn','Score'].map(h=>(
                    <th key={h} style={{padding:'8px 10px',textAlign:'left',color:'var(--muted)',fontSize:11,textTransform:'uppercase',letterSpacing:'.8px',fontWeight:600}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allPreds.map(pred=>{
                  const match=matches.find(m=>m.id===pred.matchId);
                  const result=results[pred.matchId];
                  const {points,total}=result?calcScore(pred,result):{points:'-',total:'-'};
                  const maxPts=result?PREDICTION_FIELDS.filter(f=>pred[f.key]).reduce((a,f)=>a+f.points,0):'-';
                  return (
                    <tr key={`${pred.matchId}__${pred.userName}`} style={{borderBottom:'1px solid var(--border2)'}}>
                      <td style={{padding:'8px 10px',fontWeight:500}}>{pred.userName}</td>
                      <td style={{padding:'8px 10px',color:'var(--muted2)'}}>{match?`${tShort(match.team1)} v ${tShort(match.team2)}`:'?'}</td>
                      <td style={{padding:'8px 10px'}}>{pred.winner?tShort(pred.winner):'—'}</td>
                      <td style={{padding:'8px 10px'}}>{pred.motm||'—'}</td>
                      <td style={{padding:'8px 10px'}}>{pred.firstInningsRuns||'—'}</td>
                      <td style={{padding:'8px 10px'}}>{pred.secondInningsRuns||'—'}</td>
                      <td style={{padding:'8px 10px',fontFamily:'Rajdhani',fontSize:16,fontWeight:700,color:'var(--gold)'}}>
                        {result?`${points}/${maxPts}`:'—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
