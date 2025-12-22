import React, { useState } from 'react';
import { fetchFromApi } from './config';

function App() {
  const [activeTab, setActiveTab] = useState('players');

  return (
    <div style={{ padding: 20, fontFamily: 'Arial, sans-serif', maxWidth: 1200, margin: '0 auto' }}>
      <h1>Kartenspiel-Turnierverwaltung</h1>
      
      <div style={{ marginBottom: 20, borderBottom: '2px solid #ddd' }}>
        <button
          onClick={() => setActiveTab('players')}
          style={{
            padding: '10px 20px',
            marginRight: 10,
            backgroundColor: activeTab === 'players' ? '#4CAF50' : '#f0f0f0',
            color: activeTab === 'players' ? 'white' : 'black',
            border: 'none',
            cursor: 'pointer',
            borderRadius: '4px 4px 0 0'
          }}
        >
          Spieler
        </button>
        <button
          onClick={() => setActiveTab('tournaments')}
          style={{
            padding: '10px 20px',
            marginRight: 10,
            backgroundColor: activeTab === 'tournaments' ? '#4CAF50' : '#f0f0f0',
            color: activeTab === 'tournaments' ? 'white' : 'black',
            border: 'none',
            cursor: 'pointer',
            borderRadius: '4px 4px 0 0'
          }}
        >
          Turniere
        </button>
        <button
          onClick={() => setActiveTab('games')}
          style={{
            padding: '10px 20px',
            marginRight: 10,
            backgroundColor: activeTab === 'games' ? '#4CAF50' : '#f0f0f0',
            color: activeTab === 'games' ? 'white' : 'black',
            border: 'none',
            cursor: 'pointer',
            borderRadius: '4px 4px 0 0'
          }}
        >
          Spiele
        </button>
        <button
          onClick={() => setActiveTab('statistics')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeTab === 'statistics' ? '#4CAF50' : '#f0f0f0',
            color: activeTab === 'statistics' ? 'white' : 'black',
            border: 'none',
            cursor: 'pointer',
            borderRadius: '4px 4px 0 0'
          }}
        >
          Übersichten
        </button>
      </div>

      {activeTab === 'players' && <PlayersTab />}
      {activeTab === 'tournaments' && <TournamentsTab />}
      {activeTab === 'games' && <GamesTab />}
      {activeTab === 'statistics' && <StatisticsTab />}
    </div>
  );
}

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
        setError('');
      } else {
        throw new Error('Fehler beim Laden der Spieler');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  React.useEffect(() => {
    loadPlayers();
  }, []);

  const handleAddPlayer = async () => {
    if (!newPlayerName.trim()) {
      setError('Bitte gib einen Namen ein.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetchFromApi('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newPlayerName.trim() })
      });
      
      if (response.ok) {
        setNewPlayerName('');
        await loadPlayers();
      } else {
        const data = await response.json();
        throw new Error(data.detail || 'Fehler beim Hinzufügen des Spielers');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlayer = async (id) => {
    if (!window.confirm('Möchtest du diesen Spieler wirklich löschen?')) {
      return;
    }

    setError('');
    try {
      const response = await fetchFromApi(`/api/players/${id}`, { method: 'DELETE' });
      if (response.ok) {
        await loadPlayers();
      } else {
        let errorMessage = 'Fehler beim Löschen des Spielers';
        try {
          const data = await response.json();
          if (data.detail) {
            errorMessage = data.detail;
          }
        } catch (e) {
          // JSON-Parsing fehlgeschlagen, verwende Standard-Fehlermeldung
        }
        setError(errorMessage);
      }
    } catch (err) {
      setError(err.message || 'Fehler beim Löschen des Spielers');
    }
  };

  return (
    <div>
      <h2>Spieler-Verwaltung</h2>
      <p style={{ color: '#666' }}>Es müssen genau 8 Spieler vorhanden sein.</p>
      
      <div style={{ marginBottom: 20 }}>
        <input
          value={newPlayerName}
          onChange={(e) => setNewPlayerName(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && !loading && handleAddPlayer()}
          placeholder="Spielername eingeben..."
          style={{ padding: 10, fontSize: 16, width: 300, marginRight: 10 }}
        />
        <button
          onClick={handleAddPlayer}
          disabled={loading}
          style={{ padding: '10px 20px', fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          {loading ? 'Hinzufügen...' : 'Spieler hinzufügen'}
        </button>
      </div>

      {error && (
        <div style={{ color: 'red', marginBottom: 20, padding: 10, backgroundColor: '#ffe6e6', borderRadius: 4 }}>
          {error}
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        <h3>Aktuelle Spieler ({players.length}/8)</h3>
        {players.length === 0 ? (
          <p>Noch keine Spieler vorhanden.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {players.map((player) => (
              <li
                key={player.id}
                style={{
                  padding: 10,
                  marginBottom: 8,
                  backgroundColor: '#f9f9f9',
                  borderRadius: 4,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span>{player.name}</span>
                <button
                  onClick={() => handleDeletePlayer(player.id)}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: '#f44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer'
                  }}
                >
                  Löschen
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function TournamentsTab() {
  const [tournaments, setTournaments] = useState([]);
  const [newTournament, setNewTournament] = useState({ name: '', year: new Date().getFullYear(), month: new Date().getMonth() + 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadTournaments = async () => {
    try {
      const response = await fetchFromApi('/api/tournaments');
      if (response.ok) {
        const data = await response.json();
        setTournaments(data);
        setError('');
      } else {
        throw new Error('Fehler beim Laden der Turniere');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  React.useEffect(() => {
    loadTournaments();
  }, []);

  const handleCreateTournament = async () => {
    if (!newTournament.name.trim()) {
      setError('Bitte gib einen Namen ein.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetchFromApi('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTournament)
      });
      
      if (response.ok) {
        setNewTournament({ name: '', year: new Date().getFullYear(), month: new Date().getMonth() + 1 });
        await loadTournaments();
      } else {
        const data = await response.json();
        throw new Error(data.detail || 'Fehler beim Erstellen des Turniers');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTournament = async (id, name) => {
    if (!window.confirm(`Möchtest du das Turnier "${name}" wirklich löschen? Alle Paarungen und Spiele werden ebenfalls gelöscht.`)) {
      return;
    }

    try {
      const response = await fetchFromApi(`/api/tournaments/${id}`, { method: 'DELETE' });
      if (response.ok) {
        await loadTournaments();
      } else {
        throw new Error('Fehler beim Löschen des Turniers');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const monthNames = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

  return (
    <div>
      <h2>Turnier-Verwaltung</h2>
      
      <div style={{ marginBottom: 20, padding: 15, backgroundColor: '#f0f0f0', borderRadius: 4 }}>
        <h3>Neues Turnier erstellen</h3>
        <div style={{ marginBottom: 10 }}>
          <input
            value={newTournament.name}
            onChange={(e) => setNewTournament({ ...newTournament, name: e.target.value })}
            placeholder="Turniername (z.B. Januar 2024)"
            style={{ padding: 8, fontSize: 14, width: 250, marginRight: 10 }}
          />
          <input
            type="number"
            value={newTournament.year}
            onChange={(e) => setNewTournament({ ...newTournament, year: parseInt(e.target.value) })}
            placeholder="Jahr"
            style={{ padding: 8, fontSize: 14, width: 100, marginRight: 10 }}
          />
          <select
            value={newTournament.month}
            onChange={(e) => setNewTournament({ ...newTournament, month: parseInt(e.target.value) })}
            style={{ padding: 8, fontSize: 14, width: 150, marginRight: 10 }}
          >
            {monthNames.map((name, index) => (
              <option key={index + 1} value={index + 1}>{name}</option>
            ))}
          </select>
          <button
            onClick={handleCreateTournament}
            disabled={loading}
            style={{ padding: '8px 16px', fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Erstellen...' : 'Turnier erstellen'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ color: 'red', marginBottom: 20, padding: 10, backgroundColor: '#ffe6e6', borderRadius: 4 }}>
          {error}
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        <h3>Bestehende Turniere</h3>
        {tournaments.length === 0 ? (
          <p>Noch keine Turniere vorhanden.</p>
        ) : (
          tournaments.map((tournament) => (
            <div
              key={tournament.id}
              style={{
                padding: 15,
                marginBottom: 15,
                backgroundColor: '#f9f9f9',
                borderRadius: 4,
                border: '1px solid #ddd',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start'
              }}
            >
              <div style={{ flex: 1 }}>
                <h4>{tournament.name} ({tournament.month} / {tournament.year})</h4>
                <div style={{ marginTop: 10 }}>
                  <strong>Paarungen:</strong>
                  <ul style={{ marginTop: 5 }}>
                    {tournament.pairings.map((pairing) => (
                      <li key={pairing.id}>
                        {pairing.player1_name} & {pairing.player2_name}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <button
                onClick={() => handleDeleteTournament(tournament.id, tournament.name)}
                style={{
                  padding: '8px 12px',
                  marginLeft: 10,
                  backgroundColor: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                Löschen
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function GamesTab() {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [games, setGames] = useState([]);
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadTournaments = async () => {
    try {
      const response = await fetch('/api/tournaments');
      if (response.ok) {
        const data = await response.json();
        setTournaments(data);
        if (data.length > 0 && !selectedTournament) {
          setSelectedTournament(data[0].id);
        }
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const loadGames = async (tournamentId) => {
    if (!tournamentId) return;
    
    setLoading(true);
    try {
      const [gamesRes, scoresRes] = await Promise.all([
        fetchFromApi(`/api/tournaments/${tournamentId}/games`),
        fetchFromApi(`/api/tournaments/${tournamentId}/scores`)
      ]);
      
      if (gamesRes.ok && scoresRes.ok) {
        const gamesData = await gamesRes.json();
        const scoresData = await scoresRes.json();
        setGames(gamesData);
        setScores(scoresData);
        setError('');
      } else {
        throw new Error('Fehler beim Laden der Spiele');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadTournaments();
  }, []);

  React.useEffect(() => {
    if (selectedTournament) {
      loadGames(selectedTournament);
    }
  }, [selectedTournament]);

  const handleUpdateGame = async (gameId, winnerPairingId) => {
    try {
      const response = await fetchFromApi(`/api/games/${gameId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winner_pairing_id: winnerPairingId })
      });
      
      if (response.ok) {
        await loadGames(selectedTournament);
      } else {
        try {
          const data = await response.json();
          throw new Error(data.detail || 'Fehler beim Aktualisieren des Spiels');
        } catch (parseErr) {
          throw new Error('Fehler beim Aktualisieren des Spiels');
        }
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const tournament = tournaments.find(t => t.id === selectedTournament);

  return (
    <div>
      <h2>Spiel-Erfassung</h2>
      
      <div style={{ marginBottom: 20 }}>
        <label>
          <strong>Turnier auswählen: </strong>
          <select
            value={selectedTournament || ''}
            onChange={(e) => setSelectedTournament(parseInt(e.target.value))}
            style={{ padding: 8, fontSize: 14, marginLeft: 10 }}
          >
            <option value="">-- Bitte wählen --</option>
            {tournaments.map((t) => (
              <option key={t.id} value={t.id}>{t.name} ({t.month}/{t.year})</option>
            ))}
          </select>
        </label>
      </div>

      {error && (
        <div style={{ color: 'red', marginBottom: 20, padding: 10, backgroundColor: '#ffe6e6', borderRadius: 4 }}>
          {error}
        </div>
      )}

      {selectedTournament && tournament && (
        <>
          <div style={{ marginBottom: 20, padding: 15, backgroundColor: '#e8f5e9', borderRadius: 4 }}>
            <h3>Punktestand: {tournament.name}</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#4CAF50', color: 'white' }}>
                  <th style={{ padding: 10, textAlign: 'left' }}>Paarung</th>
                  <th style={{ padding: 10, textAlign: 'center' }}>Punkte</th>
                  <th style={{ padding: 10, textAlign: 'center' }}>Gespielt</th>
                  <th style={{ padding: 10, textAlign: 'center' }}>Gewonnen</th>
                </tr>
              </thead>
              <tbody>
                {scores.map((score, index) => (
                  <tr key={score.pairing_id} style={{ backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white' }}>
                    <td style={{ padding: 10 }}>{score.pairing_names}</td>
                    <td style={{ padding: 10, textAlign: 'center', fontWeight: 'bold' }}>{score.points}</td>
                    <td style={{ padding: 10, textAlign: 'center' }}>{score.games_played}</td>
                    <td style={{ padding: 10, textAlign: 'center' }}>{score.games_won}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <h3>Spiele</h3>
            {loading ? (
              <p>Lade Spiele...</p>
            ) : games.length === 0 ? (
              <p>Noch keine Spiele vorhanden.</p>
            ) : (
              <div>
                {[1, 2, 3].map((round) => (
                  <div key={round} style={{ marginBottom: 30 }}>
                    <h4>Runde {round}</h4>
                    {games
                      .filter(g => g.round_number === round)
                      .map((game) => (
                        <div
                          key={game.id}
                          style={{
                            padding: 15,
                            marginBottom: 10,
                            backgroundColor: '#f9f9f9',
                            borderRadius: 4,
                            border: '1px solid #ddd'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <strong>{game.pairing1_names}</strong> vs <strong>{game.pairing2_names}</strong>
                              {game.winner_names && (
                                <span style={{ marginLeft: 10, color: '#4CAF50' }}>
                                  → Gewinner: {game.winner_names}
                                </span>
                              )}
                            </div>
                            <div>
                              {!game.winner_pairing_id ? (
                                <>
                                  <button
                                    onClick={() => handleUpdateGame(game.id, game.pairing1_id)}
                                    style={{
                                      padding: '5px 10px',
                                      marginRight: 5,
                                      backgroundColor: '#4CAF50',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: 4,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    {game.pairing1_names.split(' & ')[0]} gewinnt
                                  </button>
                                  <button
                                    onClick={() => handleUpdateGame(game.id, game.pairing2_id)}
                                    style={{
                                      padding: '5px 10px',
                                      backgroundColor: '#4CAF50',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: 4,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    {game.pairing2_names.split(' & ')[0]} gewinnt
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => handleUpdateGame(game.id, null)}
                                  style={{
                                    padding: '5px 10px',
                                    backgroundColor: '#f44336',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: 4,
                                    cursor: 'pointer'
                                  }}
                                >
                                  Ergebnis zurücksetzen
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function StatisticsTab() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [yearlyScores, setYearlyScores] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [playerDetails, setPlayerDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadYearlyScores = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetchFromApi(`/api/statistics/yearly/${year}`);
      if (response.ok) {
        const data = await response.json();
        setYearlyScores(data);
      } else {
        throw new Error('Fehler beim Laden der Jahresübersicht');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadPlayerDetails = async (playerId) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetchFromApi(`/api/statistics/player/${playerId}/yearly/${year}`);
      if (response.ok) {
        const data = await response.json();
        setPlayerDetails(data);
        setSelectedPlayer(playerId);
      } else {
        throw new Error('Fehler beim Laden der Spielerdetails');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadYearlyScores();
  }, [year]);

  return (
    <div>
      <h2>Jahresübersicht</h2>
      
      <div style={{ marginBottom: 20 }}>
        <label>
          <strong>Jahr: </strong>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            style={{ padding: 8, fontSize: 14, marginLeft: 10, width: 100 }}
          />
        </label>
        <button
          onClick={loadYearlyScores}
          style={{ padding: '8px 16px', fontSize: 14, marginLeft: 10, cursor: 'pointer' }}
        >
          Laden
        </button>
      </div>

      {error && (
        <div style={{ color: 'red', marginBottom: 20, padding: 10, backgroundColor: '#ffe6e6', borderRadius: 4 }}>
          {error}
        </div>
      )}

      {loading && <p>Lade Daten...</p>}

      {yearlyScores.length > 0 && (
        <div style={{ marginBottom: 30 }}>
          <h3>Jahreswertung {year}</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#4CAF50', color: 'white' }}>
                <th style={{ padding: 10, textAlign: 'left' }}>Platz</th>
                <th style={{ padding: 10, textAlign: 'left' }}>Spieler</th>
                <th style={{ padding: 10, textAlign: 'center' }}>Gesamtpunkte</th>
                <th style={{ padding: 10, textAlign: 'center' }}>Turniere</th>
                <th style={{ padding: 10, textAlign: 'center' }}>Aktion</th>
              </tr>
            </thead>
            <tbody>
              {yearlyScores.map((score, index) => (
                <tr
                  key={score.player_id}
                  style={{
                    backgroundColor: index === 0 ? '#fff9c4' : index % 2 === 0 ? '#f9f9f9' : 'white',
                    cursor: 'pointer'
                  }}
                  onClick={() => loadPlayerDetails(score.player_id)}
                >
                  <td style={{ padding: 10, fontWeight: index === 0 ? 'bold' : 'normal' }}>
                    {index + 1}
                  </td>
                  <td style={{ padding: 10, fontWeight: index === 0 ? 'bold' : 'normal' }}>
                    {score.player_name}
                  </td>
                  <td style={{ padding: 10, textAlign: 'center', fontWeight: index === 0 ? 'bold' : 'normal' }}>
                    {score.total_points}
                  </td>
                  <td style={{ padding: 10, textAlign: 'center' }}>{score.tournaments_played}</td>
                  <td style={{ padding: 10, textAlign: 'center' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        loadPlayerDetails(score.player_id);
                      }}
                      style={{
                        padding: '5px 10px',
                        backgroundColor: '#2196F3',
                        color: 'white',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer'
                      }}
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {playerDetails && (
        <div style={{ padding: 20, backgroundColor: '#f0f0f0', borderRadius: 4 }}>
          <h3>Details: {playerDetails.player_name} ({year})</h3>
          <p><strong>Gesamtpunkte: {playerDetails.total_points}</strong></p>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 10 }}>
            <thead>
              <tr style={{ backgroundColor: '#4CAF50', color: 'white' }}>
                <th style={{ padding: 10, textAlign: 'left' }}>Turnier</th>
                <th style={{ padding: 10, textAlign: 'left' }}>Partner</th>
                <th style={{ padding: 10, textAlign: 'center' }}>Punkte</th>
              </tr>
            </thead>
            <tbody>
              {playerDetails.tournaments.map((tournament, index) => (
                <tr key={tournament.tournament_id} style={{ backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white' }}>
                  <td style={{ padding: 10 }}>{tournament.tournament_name}</td>
                  <td style={{ padding: 10 }}>{tournament.partner || '-'}</td>
                  <td style={{ padding: 10, textAlign: 'center' }}>{tournament.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;
