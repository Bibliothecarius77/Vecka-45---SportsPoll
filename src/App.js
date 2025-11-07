import React, { useEffect, useMemo, useState } from 'react';
import './App.css';

const LOCALSTORAGE_KEY = 'sports_poll';

function generateOdds() {
  const a = Math.random();
  const b = Math.random();
  const c = Math.random();
  const sum = a + b + c;
  const profitMargin = 0.01 + Math.random() * 0.05;

  const pHome = (a / sum) * (1 - profitMargin);
  const pAway = (b / sum) * (1 - profitMargin);
  const pDraw = (c / sum) * (1 - profitMargin);

  return {
    home: toDecimalOdds(pHome),
    draw: toDecimalOdds(pDraw),
    away: toDecimalOdds(pAway)
  };
}

function toDecimalOdds(p) {
  return Math.max(1.01, +(1 / p).toFixed(2));
}

export default function App() {
  const [events, setEvents] = useState([]);
  const [sport, setSport] = useState('FOOTBALL');
  const [oddsMap, setOddsMap] = useState({});

  const [votes, setVotes] = useState(() => {
    try {
      const raw = localStorage.getItem(LOCALSTORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    fetch('/players.json')
      .then(r => r.json())
      .then(data => {
        // Normalize keys
        // const ev = data.map(item => ({
        //   id: item.id || item.objectId || item.name,
        //   homeName: item.homeName || item.teamHome || (item.name && item.name.split(' - ')[0]) || 'Home',
        //   awayName: item.awayName || item.teamAway || (item.name && item.name.split(' - ')[1]) || 'Away',
        //   sport: item.sport || item.type || 'UNKNOWN',
        //   group: item.group || '',
        //   state: item.state || ''
        // }));
        const ev = data.map(item => ({
          id: item.id,
          homeName: item.homeName || '',
          awayName: item.awayName || '',
          country: item.country || '',
          sport: item.sport || 'UNKNOWN',
          group: item.group || '',
          state: item.state || ''
        }));
        setEvents(ev);

        // Generate odds for each match ID
        const om = {};
        ev.forEach(e => { om[e.id] = generateOdds(); });
        setOddsMap(om);
      })
      .catch(() => {
        setEvents([]);
      });
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(votes));
  }, [votes]);

  const filtered = useMemo(() => events.filter(e => {
    if (!e.sport) return false;

    const s = e.sport.toUpperCase();
    if (sport === 'FOOTBALL')
      return s === 'FOOTBALL' || s === 'SOCCER';
    if (sport === 'TENNIS')
      return s === 'TENNIS';
    if (sport === 'ICE_HOCKEY')
      return s === 'ICE_HOCKEY' || s === 'HOCKEY' || s === 'ICE-HOCKEY';

    return s === sport;
  }), [events, sport]);

  function castVote(matchId, choice) {
    setVotes(prev => ({ ...prev, [matchId]: choice }));
  }

  function clearVotes() {
    setVotes({});
  }

  function regenerateOdds() {
    const om = {};
    events.forEach(e => { om[e.id] = generateOdds(); });
    setOddsMap(om);
  }

  return (
    <div className="app-root">
      <header>
        <div>
          <h1>Sports Poll</h1>
          <p className="subtitle">Vote on your favourite sports!</p>
          </div>
        <div className="controls">
          <button className="ghost" onClick={regenerateOdds}>Regenerate odds</button>
        </div>
      </header>

      <nav className="sport-tabs">
        <button className={sport==='FOOTBALL'?'active':''} onClick={() => setSport('FOOTBALL')}>Football</button>
        <button className={sport==='HANDBALL'?'active':''} onClick={() => setSport('HANDBALL')}>Handball</button>
        <button className={sport==='ICE_HOCKEY'?'active':''} onClick={() => setSport('ICE_HOCKEY')}>Ice Hockey</button>
        <button className={sport==='SNOOKER'?'active':''} onClick={() => setSport('SNOOKER')}>Snooker</button>
        <button className={sport==='TENNIS'?'active':''} onClick={() => setSport('TENNIS')}>Tennis</button>
      </nav>

      <div className="container">
        <main>
          <div className="summary-line">
            <div className="dimmed">{filtered.length} matches in this sport · {events.length} matches in total</div>
            <div className="dimmed">You voted on <strong>{Object.keys(votes).length}</strong> match{Object.keys(votes).length!==1?'es':''}</div>
          </div>

          <div className="matches">
            {filtered.map(match => {
              const odds = oddsMap[match.id] || generateOdds();

              return (
                <div className="card" key={match.id}>
                  <div className="match-row">
                    <div className="player">
                      <div className="name">{match.homeName}</div>
                    </div>

                    <div className="odds">
                      <div className="player-meta">{match.group}</div>
                    </div>

                    <div className="player">
                      <div className="name away">{match.awayName}</div>
                    </div>
                  </div>

                  <div className="info-row">
                    <div className={`match-state-btn ${match.state=='FINISHED'?'finished':'started'}`}>{match.state}</div>
                  </div>

                  {match.state!='FINISHED' &&
                  <div className="vote-controls-new">
                    <div className="odds-row">
                      <p className="number">{odds.home}</p>
                      <p className="number">{odds.draw}</p>
                      <p className="number">{odds.away}</p>
                    </div>
                    <div className="odds-row">
                      <button className={`vote-btn ${votes[match.id]==='H'?'voted':''}`} onClick={() => castVote(match.id,'H')} aria-pressed={votes[match.id]==='H'}>Home</button>
                      <button className={`vote-btn ${votes[match.id]==='D'?'voted':''}`} onClick={() => castVote(match.id,'D')} aria-pressed={votes[match.id]==='D'}>Draw</button>
                      <button className={`vote-btn ${votes[match.id]==='A'?'voted':''}`} onClick={() => castVote(match.id,'A')} aria-pressed={votes[match.id]==='A'}>Away</button>
                    </div>
                  </div>}
                </div>
              );
            })}
          </div>
        </main>

        <aside className="sidebar">
          <div className="card">
            <h3>Your Votes</h3>
            <div className="votes-list">
              {Object.keys(votes).length===0 && <div className="muted">No votes yet.</div>}
              {Object.entries(votes).map(([matchId, choice]) => {
                const m = events.find(x => x.id == matchId) || {};
                const label = choice=='H'?`${m.homeName} wins`:choice=='A'?`${m.awayName} wins`:'Draw';
                return (
                  <div className="vote-item" key={matchId}>
                    <div><strong className="small">{m.homeName || 'Home'} vs {m.awayName || 'Away'}</strong></div>
                    <div className="muted small">{label}</div>
                    <div className="vote-actions">
                      <button className="ghost" onClick={() => { const nv = {...votes}; delete nv[matchId]; setVotes(nv); }}>Remove</button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="actions">
              <button className="btn" onClick={clearVotes}>Clear votes</button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
