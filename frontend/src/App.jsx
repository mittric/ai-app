import React, { useState, useEffect } from 'react';
import { fetchFromApi } from './config';

// --- LOGIN KOMPONENTE ---
function Login({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // ERSETZE DAS PASSWORT HIER DURCH DEIN WUNSCHPASSWORT
    if (password === "träumer") {
      localStorage.setItem('app_password', password);
      onLogin();
    } else {
      setError(true);
    }
  };

  return (
    <div style={{ 
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
      height: '80vh', padding: '20px', textAlign: 'center' 
    }}>
      <h2>Zugang geschützt</h2>
      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '300px' }}>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Passwort eingeben"
          style={{ 
            width: '100%', padding: '15px', fontSize: '16px', 
            marginBottom: '10px', borderRadius: '8px', border: '1px solid #ccc' 
          }}
        />
        {error && <p style={{ color: 'red' }}>Falsches Passwort!</p>}
        <button type="submit" style={{ 
          width: '100%', padding: '15px', fontSize: '16px', 
          backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '8px' 
        }}>
          Anmelden
        </button>
      </form>
    </div>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('players');

  // Prüfen ob bereits eingeloggt
  useEffect(() => {
    const savedPassword = localStorage.getItem('app_password');
    if (savedPassword === "Turnier2024") {
      setIsAuthenticated(true);
    }
  }, []);

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div style={{ padding: '10px', fontFamily: 'Arial, sans-serif', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.2rem' }}>Turnierverwaltung</h1>
        <button 
          onClick={() => { localStorage.removeItem('app_password'); setIsAuthenticated(false); }}
          style={{ background: 'none', border: 'none', color: '#888', fontSize: '12px', cursor: 'pointer' }}
        >
          Logout
        </button>
      </div>
      
      <div style={{ 
        marginBottom: 20, borderBottom: '2px solid #ddd', display: 'flex', 
        overflowX: 'auto', WebkitOverflowScrolling: 'touch', whiteSpace: 'nowrap'
      }}>
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
              padding: '10px 15px', marginRight: 5,
              backgroundColor: activeTab === tab.id ? '#4CAF50' : '#f0f0f0',
              color: activeTab === tab.id ? 'white' : 'black',
              border: 'none', borderRadius: '4px 4px 0 0', fontSize: '16px'
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

  const loadPlayers = async () => {
    try {
      const response = await fetchFromApi('/api/players');
      if (response.ok) setPlayers(await response.json());
    } catch (err) { console.error(err); }
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
    } finally { setLoading(false); }
  };

  const handleDeletePlayer = async (id) => {
    if (!window.confirm('Spieler wirklich löschen?')) return;
    await fetchFromApi(`/api/players/${id}`, { method: 'DELETE' });
    await loadPlayers();
  };

  return (
    <div>
      <div style={{ marginBottom: 20, display: 'flex', gap: '10px' }}>
        <input 
          value={newPlayerName} 
          onChange={(e) => setNewPlayerName(e.target.value)} 
          placeholder="Name..." 
          style={{ padding: 10, flex: 1, minWidth: 0, fontSize: '16px' }} 
        />
        <button onClick={handleAddPlayer} disabled={loading} style={{ padding: '10px', fontSize: '16px' }}>
          {loading ? '+' : 'Add'}
        </button>
      </div>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {players.map(p => (
          <li key={p.id} style={{ padding: 10, background: '#f9f9f9', marginBottom: 5, borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{p.name}</span>
            <button onClick={() => handleDeletePlayer(p.id)} style={{ background: '#f44336', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 4 }}>Löschen</button>
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
    setLoading(true);
    const autoName = `${monthNames[newTournament.month - 1]} ${newTournament.year}`;
    const response = await fetchFromApi('/api/tournaments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newTournament, name: autoName })
    });
    if (response.ok) await loadTournaments();
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
      <div style={{ background: '#f0f0f0', padding: 15, borderRadius: 4, marginBottom: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <select 
              value={newTournament.month} 
              onChange={e => setNewTournament({...newTournament, month: parseInt(e.target.value)})}
              style={{ padding: 10, flex: 2, fontSize: '16px' }}
            >
              {monthNames.map((name, index) => (
                <option key={index + 1} value={index + 1}>{name}</option>
              ))}
            </select>
            <input 
              type="number" 
              value={newTournament.year} 
              onChange={e => setNewTournament({...newTournament, year: parseInt(e.target.value)})} 
              style={{ padding: 10, flex: 1, fontSize: '16px' }} 
            />
          </div>
          <button onClick={handleCreate} disabled={loading} style={{ padding: '12px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: 4, fontSize: '16px' }}>
            {loading ? '...' : 'Turnier erstellen'}
          </button>
        </div>
      </div>
      {tournaments.map(t => (
        <div key={t.id} style={{ border: '1px solid #ddd', padding: 12, marginBottom: 15, borderRadius: 4, background: '#fcfcfc' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ margin: 0 }}>{t.name}</h4>
            <button onClick={() => handleDelete(t.id)} style={{ background: '#f44336', color: 'white', border: 'none', padding: '5px 8px', borderRadius: 4, fontSize: '0.8rem' }}>Löschen</button>
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
    const previousGames = [...games];
    setGames(current => current.map(g => g.id === gameId ? { ...g, winner_pairing_id: winnerPairingId } : g));
    try {
      const response = await fetchFromApi(`/api/games/${gameId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winner_pairing_id: winnerPairingId })
      });
      if (response.ok) loadData(selectedTournament);
      else setGames(previousGames);
    } catch (err) { setGames(previousGames); }
  };

  if (!isActive) return null;

  return (
    <div>
      <select value={selectedTournament || ''} onChange={e => setSelectedTournament(parseInt(e.target.value))} style={{ padding: 12, marginBottom: 20, width: '100%', fontSize: '16px' }}>
        {tournaments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ background: '#e8f5e9', padding: 15, borderRadius: 8 }}>
          <h3 style={{ marginTop: 0, fontSize: '1.1rem' }}>Ranking</h3>
          <table style={{ width: '100%', fontSize: '0.85rem' }}>
            <tbody>
              {scores.map(s => (
                <tr key={s.pairing_id} style={{ borderBottom: '1px solid #c8e6c9' }}>
                  <td style={{ padding: '5px 0' }}>{s.pairing_names}</td>
                  <td style={{ textAlign: 'right' }}><strong>{s.points}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          {[1, 2, 3].map(round => (
            <div key={round} style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: '1.1rem', borderBottom: '1px solid #eee' }}>Runde {round}</h3>
              {games.filter(g => g.round_number === round).map(game => (
                <div key={game.id} style={{ padding: '12px', border: '1px solid #ddd', marginBottom: 10, borderRadius: 6, background: '#fff' }}>
                  <div style={{ marginBottom: 10, fontSize: '0.9rem', fontWeight: 'bold', textAlign: 'center' }}>
                    {game.pairing1_names} vs {game.pairing2_names}
                  </div>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    {!game.winner_pairing_id ? (
                      <>
                        <button onClick={() => handleUpdateGame(game.id, game.pairing1_id)} style={{ flex: 1, padding: '12px 5px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: 4 }}>Sieg P1</button>
                        <button onClick={() => handleUpdateGame(game.id, game.pairing2_id)} style={{ flex: 1, padding: '12px 5px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: 4 }}>Sieg P2</button>
                      </>
                    ) : (
                      <button onClick={() => handleUpdateGame(game.id, null)} style={{ flex: 1, padding: '12px', background: '#f0f0f0', border: '1px solid #ccc', borderRadius: 4 }}>Reset</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- STATISTIK TAB ---
function StatisticsTab() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [yearlyScores, setYearlyScores] = useState([]);
  useEffect(() => {
    const loadStats = async () => {
      const res = await fetchFromApi(`/api/statistics/yearly/${year}`);
      if (res.ok) setYearlyScores(await res.json());
    };
    loadStats();
  }, [year]);

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <label>Jahr: </label>
        <input type="number" value={year} onChange={e => setYear(parseInt(e.target.value))} style={{ padding: 10, width: '80px', fontSize: '16px' }} />
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ background: '#4CAF50', color: 'white' }}>
              <th style={{ padding: 10 }}>#</th>
              <th style={{ padding: 10, textAlign: 'left' }}>Spieler</th>
              <th style={{ padding: 10 }}>Pkt</th>
            </tr>
          </thead>
          <tbody>
            {yearlyScores.map((s, i) => (
              <tr key={s.player_id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: 10, textAlign: 'center' }}>{i+1}</td>
                <td style={{ padding: 10 }}>{s.player_name}</td>
                <td style={{ padding: 10, textAlign: 'center', fontWeight: 'bold' }}>{s.total_points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;