import React, { useState, useEffect } from 'react';
import { fetchFromApi } from './config';

function App() {
  const [activeTab, setActiveTab] = useState('players');

  return (
    <div style={{ padding: 20, fontFamily: 'Arial, sans-serif', maxWidth: 1200, margin: '0 auto' }}>
      <h1>Kartenspiel-Turnierverwaltung</h1>
      
      <div style={{ marginBottom: 20, borderBottom: '2px solid #ddd' }}>
        {['players', 'tournaments', 'games', 'statistics'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 20px',
              marginRight: 10,
              backgroundColor: activeTab === tab ? '#4CAF50' : '#f0f0f0',
              color: activeTab === tab ? 'white' : 'black',
              border: 'none',
              cursor: 'pointer',
              borderRadius: '4px 4px 0 0'
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1).replace('statistics', 'Übersichten').replace('players', 'Spieler').replace('tournaments', 'Turniere').replace('games', 'Spiele')}
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
    if (!window.confirm('Spieler löschen?')) return;
    try {
      const response = await fetchFromApi(`/api/players/${id}`, { method: 'DELETE' });
      if (response.ok) await loadPlayers();
    } catch (err) { setError(err.message); }
  };

  return (
    <div>
      <h2>Spieler-Verwaltung</h2>
      <div style={{ marginBottom: 20 }}>
        <input value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)} placeholder="Name..." style={{ padding: 10, marginRight: 10 }} />
        <button onClick={handleAddPlayer} disabled={loading}>{loading ? 'Lädt...' : 'Hinzufügen'}</button>
      </div>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {players.map(p => (
          <li key={p.id} style={{ padding: 10, background: '#f9f9f9', marginBottom: 5, display: 'flex', justifyContent: 'space-between' }}>
            {p.name} <button onClick={() => handleDeletePlayer(p.id)} style={{ background: 'red', color: 'white', border: 'none' }}>Löschen</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// --- TURNIER TAB ---
function TournamentsTab() {
  const [tournaments, setTournaments] = useState([]);
  const [newTournament, setNewTournament] = useState({ name: '', year: new Date().getFullYear(), month: new Date().getMonth() + 1 });
  const [error, setError] = useState('');

  const loadTournaments = async () => {
    const response = await fetchFromApi('/api/tournaments');
    if (response.ok) setTournaments(await response.json());
  };

  useEffect(() => { loadTournaments(); }, []);

  const handleCreate = async () => {
    const response = await fetchFromApi('/api/tournaments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTournament)
    });
    if (response.ok) {
        setNewTournament({ name: '', year: new Date().getFullYear(), month: new Date().getMonth() + 1 });
        loadTournaments();
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Turnier löschen?')) {
        await fetchFromApi(`/api/tournaments/${id}`, { method: 'DELETE' });
        loadTournaments();
    }
  };

  return (
    <div>
      <h2>Turniere</h2>
      <div style={{ background: '#f0f0f0', padding: 15, borderRadius: 4, marginBottom: 20 }}>
        <input value={newTournament.name} onChange={e => setNewTournament({...newTournament, name: e.target.value})} placeholder="Turniername" style={{ padding: 8, marginRight: 5 }} />
        <button onClick={handleCreate}>Erstellen</button>
      </div>
      {tournaments.map(t => (
        <div key={t.id} style={{ border: '1px solid #ddd', padding: 15, marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>{t.name}</strong>
            <button onClick={() => handleDelete(t.id)} style={{ color: 'red' }}>Löschen</button>
          </div>
          <ul style={{ fontSize: '0.9em' }}>
            {t.pairings?.map(p => <li key={p.id}>{p.player1_name} & {p.player2_name}</li>)}
          </ul>
        </div>
      ))}
    </div>
  );
}

// --- SPIELE TAB (OPTIMIERT GEGEN RE-RENDER) ---
function GamesTab({ isActive }) {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [games, setGames] = useState([]);
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadData = async (tId) => {
    // Nur beim ersten Laden oder Turnierwechsel zeigen wir den Lade-Spinner
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
    // 1. Optimistic Update: Wir ändern den State sofort lokal
    const previousGames = [...games];
    setGames(currentGames => currentGames.map(g => 
      g.id === gameId ? { ...g, winner_pairing_id: winnerPairingId } : g
    ));

    try {
      const response = await fetchFromApi(`/api/games/${gameId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winner_pairing_id: winnerPairingId })
      });
      
      if (response.ok) {
        // Im Hintergrund die echten Daten (inkl. neuer Scores) laden, ohne "loading" State
        loadData(selectedTournament);
      } else {
        setGames(previousGames); // Rollback bei Fehler
      }
    } catch (err) {
      setGames(previousGames);
    }
  };

  if (!isActive) return null;

  return (
    <div>
      <h2>Spiele erfassen</h2>
      <select value={selectedTournament || ''} onChange={e => setSelectedTournament(parseInt(e.target.value))} style={{ padding: 10, marginBottom: 20 }}>
        {tournaments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>

      {loading ? <p>Lade Spiele...</p> : (
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
          {/* Linke Seite: Spiele */}
          <div style={{ flex: 2 }}>
            {[1, 2, 3].map(round => (
              <div key={round}>
                <h3>Runde {round}</h3>
                {games.filter(g => g.round_number === round).map(game => (
                  <div key={game.id} style={{ padding: 10, border: '1px solid #eee', marginBottom: 10, borderRadius: 4, background: '#fcfcfc' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{game.pairing1_names} vs {game.pairing2_names}</span>
                      <div>
                        {!game.winner_pairing_id ? (
                          <>
                            <button onClick={() => handleUpdateGame(game.id, game.pairing1_id)} style={{ marginRight: 5 }}>Sieg P1</button>
                            <button onClick={() => handleUpdateGame(game.id, game.pairing2_id)}>Sieg P2</button>
                          </>
                        ) : (
                          <button onClick={() => handleUpdateGame(game.id, null)} style={{ background: '#ddd' }}>Reset</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
          
          {/* Rechte Seite: Live-Punktestand */}
          <div style={{ flex: 1, position: 'sticky', top: 20, background: '#e8f5e9', padding: 15, borderRadius: 8 }}>
            <h3 style={{ marginTop: 0 }}>Live-Stand</h3>
            {scores.map(s => (
              <div key={s.pairing_id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #c8e6c9', padding: '5px 0' }}>
                <span style={{ fontSize: '0.85em' }}>{s.pairing_names}</span>
                <strong>{s.points} Pkt.</strong>
              </div>
            ))}
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
      <input type="number" value={year} onChange={e => setYear(parseInt(e.target.value))} style={{ padding: 8, marginBottom: 20 }} />
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr style={{ background: '#4CAF50', color: 'white' }}><th>Platz</th><th>Spieler</th><th>Punkte</th></tr></thead>
        <tbody>
          {yearlyScores.map((s, i) => (
            <tr key={s.player_id} style={{ borderBottom: '1px solid #ddd', textAlign: 'center' }}>
              <td>{i+1}</td><td>{s.player_name}</td><td>{s.total_points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;