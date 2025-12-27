import React, { useState, useEffect } from 'react';
import { fetchFromApi } from './config';

function App() {
  const [activeTab, setActiveTab] = useState('players');

  return (
    <div style={{ padding: 20, fontFamily: 'Arial, sans-serif', maxWidth: 1200, margin: '0 auto' }}>
      <h1>Kartenspiel-Turnierverwaltung</h1>
      
      <div style={{ marginBottom: 20, borderBottom: '2px solid #ddd' }}>
        {[
          { id: 'players', label: 'Spieler' },
          { id: 'tournaments', label: 'Turniere' },
          { id: 'games', label: 'Spiele' },
          { id: 'statistics', label: 'Übersichten' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 20px',
              marginRight: 10,
              backgroundColor: activeTab === tab.id ? '#4CAF50' : '#f0f0f0',
              color: activeTab === tab.id ? 'white' : 'black',
              border: 'none',
              cursor: 'pointer',
              borderRadius: '4px 4px 0 0'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'players' && <PlayersTab />}
      {activeTab === 'tournaments' && <TournamentsTab />}
      {activeTab === 'games' && <GamesTab isActive={activeTab === 'games'} />}
      {activeTab === 'statistics' && <StatisticsTab />}
    </div>
  );
}

// --- SPIELER TAB ---
function PlayersTab() {
  const [players, setPlayers] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadPlayers = async () => {
    try {
      const response = await fetchFromApi('/api/players');
      if (response.ok) {
        const data = await response.json();
        setPlayers(data);
      }
    } catch (err) { setError(err.message); }
  };

  useEffect(() => { loadPlayers(); }, []);

  const handleAddPlayer = async () => {
    if (!newPlayerName.trim()) return;
    setLoading(true);
    try {
      const response = await fetchFromApi('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newPlayerName.trim() })
      });
      if (response.ok) {
        setNewPlayerName('');
        await loadPlayers();
      }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleDeletePlayer = async (id) => {
    if (!window.confirm('Spieler wirklich löschen?')) return;
    try {
      const response = await fetchFromApi(`/api/players/${id}`, { method: 'DELETE' });
      if (response.ok) await loadPlayers();
    } catch (err) { setError(err.message); }
  };

  return (
    <div>
      <h2>Spieler-Verwaltung</h2>
      <div style={{ marginBottom: 20 }}>
        <input 
          value={newPlayerName} 
          onChange={(e) => setNewPlayerName(e.target.value)} 
          placeholder="Spielername..." 
          style={{ padding: 10, marginRight: 10, width: '250px' }} 
        />
        <button onClick={handleAddPlayer} disabled={loading} style={{ padding: '10px 20px' }}>
          {loading ? 'Hinzufügen...' : 'Spieler hinzufügen'}
        </button>
      </div>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {players.map(p => (
          <li key={p.id} style={{ padding: 10, background: '#f9f9f9', marginBottom: 5, borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{p.name}</span>
            <button onClick={() => handleDeletePlayer(p.id)} style={{ background: '#f44336', color: 'white', border: 'none', padding: '5px 10px', borderRadius: 4, cursor: 'pointer' }}>Löschen</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// --- TURNIER TAB ---
function TournamentsTab() {
  const [tournaments, setTournaments] = useState([]);
  const [newTournament, setNewTournament] = useState({ 
    name: '', 
    year: new Date().getFullYear(), 
    month: new Date().getMonth() + 1 
  });
  const [loading, setLoading] = useState(false);

  const monthNames = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

  const loadTournaments = async () => {
    const response = await fetchFromApi('/api/tournaments');
    if (response.ok) setTournaments(await response.json());
  };

  useEffect(() => { loadTournaments(); }, []);

  const handleCreate = async () => {
    if (!newTournament.name.trim()) return;
    setLoading(true);
    const response = await fetchFromApi('/api/tournaments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTournament)
    });
    if (response.ok) {
        setNewTournament({ name: '', year: new Date().getFullYear(), month: new Date().getMonth() + 1 });
        await loadTournaments();
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Turnier wirklich löschen?')) {
        await fetchFromApi(`/api/tournaments/${id}`, { method: 'DELETE' });
        loadTournaments();
    }
  };

  return (
    <div>
      <h2>Turnier-Verwaltung</h2>
      <div style={{ background: '#f0f0f0', padding: 20, borderRadius: 4, marginBottom: 20 }}>
        <h3>Neues Turnier erstellen</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input 
            value={newTournament.name} 
            onChange={e => setNewTournament({...newTournament, name: e.target.value})} 
            placeholder="Turniername (z.B. Neujahrs-Cup)" 
            style={{ padding: 10, flex: '1 1 200px' }} 
          />
          <input 
            type="number" 
            value={newTournament.year} 
            onChange={e => setNewTournament({...newTournament, year: parseInt(e.target.value)})} 
            style={{ padding: 10, width: '100px' }} 
          />
          <select 
            value={newTournament.month} 
            onChange={e => setNewTournament({...newTournament, month: parseInt(e.target.value)})}
            style={{ padding: 10 }}
          >
            {monthNames.map((name, index) => (
              <option key={index + 1} value={index + 1}>{name}</option>
            ))}
          </select>
          <button onClick={handleCreate} disabled={loading} style={{ padding: '10px 20px' }}>
            {loading ? 'Erstellen...' : 'Turnier erstellen'}
          </button>
        </div>
      </div>

      {tournaments.map(t => (
        <div key={t.id} style={{ border: '1px solid #ddd', padding: 15, marginBottom: 15, borderRadius: 4, background: '#fcfcfc' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ margin: 0 }}>{t.name} ({monthNames[t.month - 1]} {t.year})</h4>
            <button onClick={() => handleDelete(t.id)} style={{ background: '#f44336', color: 'white', border: 'none', padding: '5px 10px', borderRadius: 4 }}>Löschen</button>
          </div>
          <div style={{ marginTop: 10 }}>
            <strong>Paarungen:</strong>
            <ul style={{ fontSize: '0.9em', marginTop: 5 }}>
              {t.pairings?.map(p => <li key={p.id}>{p.player1_name} & {p.player2_name}</li>)}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}

// --- SPIELE TAB ---
function GamesTab({ isActive }) {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [games, setGames] = useState([]);
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadData = async (tId) => {
    const [gRes, sRes] = await Promise.all([
      fetchFromApi(`/api/tournaments/${tId}/games`),
      fetchFromApi(`/api/tournaments/${tId}/scores`)
    ]);
    if (gRes.ok && sRes.ok) {
      setGames(await gRes.json());
      setScores(await sRes.json());
    }
  };

  useEffect(() => {
    const fetchTournaments = async () => {
      const res = await fetchFromApi('/api/tournaments');
      if (res.ok) {
        const data = await res.json();
        setTournaments(data);
        if (data.length > 0 && !selectedTournament) setSelectedTournament(data[0].id);
      }
    };
    if (isActive) fetchTournaments();
  }, [isActive]);

  useEffect(() => {
    if (selectedTournament) {
      setLoading(true);
      loadData(selectedTournament).finally(() => setLoading(false));
    }
  }, [selectedTournament]);

  const handleUpdateGame = async (gameId, winnerPairingId) => {
    // Optimistic Update: Sofortige UI-Reaktion ohne Reload
    const previousGames = [...games];
    setGames(current => current.map(g => g.id === gameId ? { ...g, winner_pairing_id: winnerPairingId } : g));

    try {
      const response = await fetchFromApi(`/api/games/${gameId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winner_pairing_id: winnerPairingId })
      });
      if (response.ok) {
        loadData(selectedTournament); // Hintergrund-Update der Scores
      } else {
        setGames(previousGames);
      }
    } catch (err) { setGames(previousGames); }
  };

  if (!isActive) return null;

  return (
    <div>
      <h2>Spiele erfassen</h2>
      <select value={selectedTournament || ''} onChange={e => setSelectedTournament(parseInt(e.target.value))} style={{ padding: 10, marginBottom: 20, width: '300px' }}>
        {tournaments.map(t => <option key={t.id} value={t.id}>{t.name} ({t.month}/{t.year})</option>)}
      </select>

      {loading ? <p>Lade Spiele...</p> : (
        <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
          <div style={{ flex: 2 }}>
            {[1, 2, 3].map(round => (
              <div key={round} style={{ marginBottom: 25 }}>
                <h3 style={{ borderBottom: '1px solid #eee' }}>Runde {round}</h3>
                {games.filter(g => g.round_number === round).map(game => (
                  <div key={game.id} style={{ padding: '15px', border: '1px solid #ddd', marginBottom: 10, borderRadius: 6, background: '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 'bold' }}>{game.pairing1_names} vs {game.pairing2_names}</span>
                      <div>
                        {!game.winner_pairing_id ? (
                          <>
                            <button onClick={() => handleUpdateGame(game.id, game.pairing1_id)} style={{ marginRight: 5, padding: '5px 10px', cursor: 'pointer', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: 4 }}>Sieg Links</button>
                            <button onClick={() => handleUpdateGame(game.id, game.pairing2_id)} style={{ padding: '5px 10px', cursor: 'pointer', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: 4 }}>Sieg Rechts</button>
                          </>
                        ) : (
                          <button onClick={() => handleUpdateGame(game.id, null)} style={{ background: '#f0f0f0', border: '1px solid #ccc', padding: '5px 10px', borderRadius: 4, cursor: 'pointer' }}>Ergebnis zurücksetzen</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
          
          <div style={{ flex: 1, position: 'sticky', top: '20px', background: '#e8f5e9', padding: 20, borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0 }}>Turnier-Ranking</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {scores.map(s => (
                  <tr key={s.pairing_id} style={{ borderBottom: '1px solid #c8e6c9' }}>
                    <td style={{ padding: '8px 0', fontSize: '0.9em' }}>{s.pairing_names}</td>
                    <td style={{ padding: '8px 0', textAlign: 'right' }}><strong>{s.points} Pkt.</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// --- STATISTIK TAB ---
function StatisticsTab() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [yearlyScores, setYearlyScores] = useState([]);
  
  const loadStats = async () => {
    const res = await fetchFromApi(`/api/statistics/yearly/${year}`);
    if (res.ok) setYearlyScores(await res.json());
  };

  useEffect(() => { loadStats(); }, [year]);

  return (
    <div>
      <h2>Jahreswertung {year}</h2>
      <div style={{ marginBottom: 20 }}>
        <label>Jahr wechseln: </label>
        <input type="number" value={year} onChange={e => setYear(parseInt(e.target.value))} style={{ padding: 8, width: '100px' }} />
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
        <thead>
          <tr style={{ background: '#4CAF50', color: 'white' }}>
            <th style={{ padding: 12 }}>Platz</th>
            <th style={{ padding: 12, textAlign: 'left' }}>Spieler</th>
            <th style={{ padding: 12 }}>Punkte</th>
            <th style={{ padding: 12 }}>Turniere</th>
          </tr>
        </thead>
        <tbody>
          {yearlyScores.map((s, i) => (
            <tr key={s.player_id} style={{ borderBottom: '1px solid #eee', textAlign: 'center' }}>
              <td style={{ padding: 12 }}>{i+1}</td>
              <td style={{ padding: 12, textAlign: 'left' }}>{s.player_name}</td>
              <td style={{ padding: 12, fontWeight: 'bold' }}>{s.total_points}</td>
              <td style={{ padding: 12 }}>{s.tournaments_played}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;