
import { useState, useEffect } from 'react';
import './App.css';

// Type colors mapping
const typeColors = {
  normal: '#A8A878',
  fire: '#F08030',
  water: '#6890F0',
  electric: '#F8D030',
  grass: '#78C850',
  ice: '#98D8D8',
  fighting: '#C03028',
  poison: '#A040A0',
  ground: '#E0C068',
  flying: '#A890F0',
  psychic: '#F85888',
  bug: '#A8B820',
  rock: '#B8A038',
  ghost: '#705898',
  dragon: '#7038F8',
  dark: '#705848',
  steel: '#B8B8D0',
  fairy: '#EE99AC',
};

function App() {
  const [search, setSearch] = useState('');
  const [pokemonList, setPokemonList] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selected, setSelected] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [details, setDetails] = useState({});
  const [selectedType, setSelectedType] = useState(null);

  // Fetch all Pokémon names and URLs on mount
  useEffect(() => {
    setLoading(true);
    fetch('https://pokeapi.co/api/v2/pokemon?limit=151')
      .then(res => res.json())
      .then(data => {
        setPokemonList(data.results);
        setFiltered(data.results);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load Pokémon.');
        setLoading(false);
      });
  }, []);

  // Filter Pokémon by search
  useEffect(() => {
    let result = pokemonList.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase())
    );

    // Filter by type if selected
    if (selectedType) {
      result = result.filter(p => {
        const pDetails = details[p.name];
        if (!pDetails) return false;
        return pDetails.types.some(t => t.type.name === selectedType);
      });
    }

    setFiltered(result);
  }, [search, pokemonList, selectedType, details]);

  // Fetch details for selected Pokémon
  const handleSelect = async (pokemon, index) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(pokemon.url);
      const detailsData = await res.json();
      setDetails(prev => ({ ...prev, [pokemon.name]: detailsData }));
      // Fetch species for evolution chain
      const speciesRes = await fetch(detailsData.species.url);
      const species = await speciesRes.json();
      // Fetch evolution chain
      const evoRes = await fetch(species.evolution_chain.url);
      const evo = await evoRes.json();
      setSelected({ details: detailsData, species, evo });
      setModalOpen(true);
    } catch {
      setError('Failed to load details.');
    }
    setLoading(false);
  };

  // Helper to get evolution chain as array
  const getEvolutionChain = (chain) => {
    const evoArr = [];
    let curr = chain;
    while (curr) {
      evoArr.push(curr.species.name);
      curr = curr.evolves_to[0];
    }
    return evoArr;
  };

  // Helper to get primary type color
  const getTypeColor = (types) => {
    if (!types || types.length === 0) return '#999';
    const primaryType = types[0].type.name;
    return typeColors[primaryType] || '#999';
  };

  return (
    <div className="pokemon-app">
      <div className="header">
        <h1>⚡ Pokémon Search App</h1>
        <p className="subtitle">Explore and discover Pokémon</p>
      </div>
      <input
        type="text"
        placeholder="🔍 Search Pokémon..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="search-input"
      />
      <div className="type-filter-container">
        <button 
          className={`type-filter-btn ${selectedType === null ? 'active' : ''}`}
          onClick={() => setSelectedType(null)}
        >
          All Types
        </button>
        {Object.entries(typeColors).map(([type, color]) => (
          <button
            key={type}
            className={`type-filter-btn ${selectedType === type ? 'active' : ''}`}
            style={{
              backgroundColor: selectedType === type ? color : 'transparent',
              borderColor: color,
            }}
            onClick={() => setSelectedType(selectedType === type ? null : type)}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>
      {loading && <div className="loader"><div className="spinner"></div> Loading...</div>}
      {error && <p className="error-message">❌ {error}</p>}
      <div className="pokemon-grid">
        {filtered.map((p, i) => {
          const typeColorStyle = details[p.name] ? getTypeColor(details[p.name].types) : '#999';
          return (
            <div key={p.name} className="pokemon-card" onClick={() => handleSelect(p, i)} style={{'--card-color': typeColorStyle}}>
              <div className="card-image-wrapper">
                <img
                  src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${i+1}.png`}
                  alt={p.name}
                  className="pokemon-image"
                />
              </div>
              <div className="pokemon-name">{p.name.charAt(0).toUpperCase() + p.name.slice(1)}</div>
              <div className="pokemon-id">#{String(i+1).padStart(3, '0')}</div>
            </div>
          );
        })}
      </div>
      {modalOpen && selected && (
        <div className="modal" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{'--primary-color': getTypeColor(selected.details.types)}}>
            <button className="close-btn" onClick={() => setModalOpen(false)}>✕</button>
            <div className="modal-header">
              <h2>{selected.details.name.charAt(0).toUpperCase() + selected.details.name.slice(1)}</h2>
              <div className="pokemon-number">#{String(selected.details.id).padStart(3, '0')}</div>
            </div>
            <img
              src={selected.details.sprites.front_default}
              alt={selected.details.name}
              className="modal-image"
            />
            <div className="types-container">
              {selected.details.types.map(t => (
                <span key={t.type.name} className="type-badge" style={{background: typeColors[t.type.name]}}>
                  {t.type.name.charAt(0).toUpperCase() + t.type.name.slice(1)}
                </span>
              ))}
            </div>
            <div className="modal-section">
              <h3>Stats</h3>
              <div className="stats-grid">
                {selected.details.stats.map(s => (
                  <div key={s.stat.name} className="stat-bar">
                    <div className="stat-name">{s.stat.name.toUpperCase()}</div>
                    <div className="stat-bar-bg">
                      <div className="stat-bar-fill" style={{'--stat': s.base_stat}}></div>
                    </div>
                    <div className="stat-value">{s.base_stat}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-section">
              <h3>Evolution Chain</h3>
              <div className="evolution-chain">
                {getEvolutionChain(selected.evo.chain).map((name, idx, arr) => (
                  <div key={name} style={{display: 'flex', alignItems: 'center'}}>
                    <span className="evolution-name">{name.charAt(0).toUpperCase() + name.slice(1)}</span>
                    {idx < arr.length - 1 && <span className="evolution-arrow">→</span>}
                  </div>
                ))}
              </div>
            </div>
            <button className="close-modal-btn" onClick={() => setModalOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
