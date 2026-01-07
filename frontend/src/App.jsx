import React, { useState, useEffect } from 'react';
import { fetchFromApi } from './config';

// --- LOGIN KOMPONENTE ---
function Login({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
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
          style={{ background: 'none', border: 'none', color: '#888', fontSize: '12px' }}
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

// --- SPIELER TAB (lovable.dev UI) ---
import { Button } from "./components/ui/button.jsx";
import { Input } from "./components/ui/input.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card.jsx";
import { UserPlus, Trash2, Users, Loader2 } from "lucide-react";

function PlayersTab() {
  const [players, setPlayers] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingPlayers, setLoadingPlayers] = useState(true);

  const loadPlayers = async () => {
    try {
      setLoadingPlayers(true);
      const response = await fetchFromApi("/api/players");
      if (response.ok) setPlayers(await response.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPlayers(false);
    }
  };

  useEffect(() => {
    loadPlayers();
  }, []);

  const handleAddPlayer = async () => {
    if (!newPlayerName.trim()) return;
    setLoading(true);
    try {
      const response = await fetchFromApi("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newPlayerName.trim() }),
      });
      if (response.ok) {
        setNewPlayerName("");
        await loadPlayers();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlayer = async (id) => {
    if (!window.confirm("Spieler wirklich löschen?")) return;
    await fetchFromApi(`/api/players/${id}`, { method: "DELETE" });
    await loadPlayers();
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !loading) {
      handleAddPlayer();
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg border-0 bg-card">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-2xl font-bold">
          <div className="p-2 rounded-xl bg-primary/10">
            <Users className="h-6 w-6 text-primary" />
          </div>
          Spieler verwalten
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add Player Form */}
        <div className="flex gap-3">
          <Input
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Spielername eingeben..."
            className="flex-1 h-12 text-base bg-secondary/50 border-0 focus-visible:ring-2 focus-visible:ring-primary"
            disabled={loading}
          />
          <Button
            onClick={handleAddPlayer}
            disabled={loading || !newPlayerName.trim()}
            className="h-12 px-6 gap-2 font-semibold shadow-md hover:shadow-lg transition-all duration-200"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <UserPlus className="h-5 w-5" />
                Hinzufügen
              </>
            )}
          </Button>
        </div>

        {/* Players List */}
        <div className="space-y-3">
          {loadingPlayers ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : players.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p className="text-lg">Noch keine Spieler vorhanden</p>
              <p className="text-sm">Füge deinen ersten Spieler hinzu!</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {players.map((player, index) => (
                <li
                  key={player.id}
                  className="group flex items-center justify-between p-4 bg-secondary/30 hover:bg-secondary/60 rounded-xl transition-all duration-200"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center font-semibold text-primary">
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-foreground">{player.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeletePlayer(player.id)}
                    className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Löschen
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Player Count */}
        {players.length > 0 && (
          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground text-center">
              <span className="font-semibold text-primary">{players.length}</span>{' '}
              {players.length === 1 ? 'Spieler' : 'Spieler'} registriert
            </p>
          </div>
        )}
      </CardContent>
    </Card>
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
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl font-bold text-primary">
            Turnier anlegen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <select
              value={newTournament.month}
              onChange={e => setNewTournament({ ...newTournament, month: parseInt(e.target.value) })}
              className="flex-1 h-12 rounded-xl border border-border bg-secondary/50 px-3 text-base focus-visible:ring-2 focus-visible:ring-primary"
            >
              {monthNames.map((name, index) => (
                <option key={index + 1} value={index + 1}>{name}</option>
              ))}
            </select>
            <input
              type="number"
              value={newTournament.year}
              onChange={e => setNewTournament({ ...newTournament, year: parseInt(e.target.value) })}
              className="w-24 h-12 rounded-xl border border-border px-3 text-base focus-visible:ring-2 focus-visible:ring-primary"
            />
            <Button
              onClick={handleCreate}
              disabled={loading}
              className="h-12 px-6 gap-2 font-semibold shadow-md hover:shadow-lg transition-all duration-200"
            >
              {loading ? '...' : 'Erstellen'}
            </Button>
          </div>
        </CardContent>
      </Card>
      {tournaments.map(t => (
        <Card key={t.id} className="bg-card border border-border mb-2">
          <CardContent>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-lg text-primary">{t.name}</span>
              <Button
                onClick={() => handleDelete(t.id)}
                className="bg-destructive text-white px-3 py-1 rounded hover:bg-red-500 text-xs"
              >
                Löschen
              </Button>
            </div>
            <div className="mt-2 text-sm">
              <strong>Paarungen:</strong>
              <ul className="list-disc pl-5 mt-1">
                {t.pairings?.map(p => <li key={p.id}>{p.player1_name} & {p.player2_name}</li>)}
              </ul>
            </div>
          </CardContent>
        </Card>
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
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl font-bold text-primary">
            Spiele & Ranking
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <select
            value={selectedTournament || ''}
            onChange={e => setSelectedTournament(parseInt(e.target.value))}
            className="w-full h-12 rounded-xl border border-border bg-secondary/50 px-3 text-base focus-visible:ring-2 focus-visible:ring-primary mb-4"
          >
            {tournaments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <div className="bg-secondary/30 rounded-xl p-4">
            <h3 className="text-lg font-semibold mb-2">Ranking</h3>
            <table className="w-full text-sm">
              <tbody>
                {scores.map(s => (
                  <tr key={s.pairing_id} className="border-b border-secondary/60">
                    <td className="py-1">{s.pairing_names}</td>
                    <td className="text-right font-bold">{s.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="space-y-6 mt-4">
            {[1, 2, 3].map(round => (
              <div key={round}>
                <h3 className="text-base font-semibold border-b border-border mb-2">Runde {round}</h3>
                {games.filter(g => g.round_number === round).map(game => (
                  <Card key={game.id} className="mb-2">
                    <CardContent>
                      <div className="mb-2 text-center font-bold text-sm">
                        {game.pairing1_names} vs {game.pairing2_names}
                      </div>
                      <div className="flex gap-2">
                        {!game.winner_pairing_id ? (
                          <>
                            <Button onClick={() => handleUpdateGame(game.id, game.pairing1_id)} className="flex-1 bg-primary text-white">Sieg P1</Button>
                            <Button onClick={() => handleUpdateGame(game.id, game.pairing2_id)} className="flex-1 bg-primary text-white">Sieg P2</Button>
                          </>
                        ) : (
                          <Button onClick={() => handleUpdateGame(game.id, null)} className="flex-1 bg-secondary border border-border">Reset</Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
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
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl font-bold text-primary">
            Jahresstatistik
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-2">
            <label className="text-sm font-medium">Jahr:</label>
            <input
              type="number"
              value={year}
              onChange={e => setYear(parseInt(e.target.value))}
              className="w-24 h-10 rounded-xl border border-border px-3 text-base focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm bg-card rounded-xl">
              <thead>
                <tr className="bg-primary text-white">
                  <th className="py-2 px-4">#</th>
                  <th className="py-2 px-4 text-left">Spieler</th>
                  <th className="py-2 px-4">Pkt</th>
                </tr>
              </thead>
              <tbody>
                {yearlyScores.map((s, i) => (
                  <tr key={s.player_id} className="border-b border-border">
                    <td className="py-2 px-4 text-center">{i + 1}</td>
                    <td className="py-2 px-4">{s.player_name}</td>
                    <td className="py-2 px-4 text-center font-bold">{s.total_points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default App;