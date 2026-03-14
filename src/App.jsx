
import { useState, useEffect, useRef } from 'react';
import './App.css';
import { seasonData } from './seasonData';

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

// Pokémon IDs to use as stickers (a fun spread across all 151)
const stickerIds = [
  25, 1, 4, 7, 39, 52, 54, 58, 63, 79,
  92, 94, 104, 113, 121, 126, 129, 131, 133, 137,
  143, 144, 145, 146, 147, 150, 6, 9, 3, 35
];

// Sticker positions: [top%, left%, size(px), rotation(deg), animDelay(s)]
// Designed to ring around the centered title
const stickerLayout = [
  // === LEFT SIDE ===
  [10,  1,  100, -15, 0.0],
  [42,  0,  110,  10, 0.6],
  [68,  2,   95, -20, 1.1],
  [20,  8,   80,  18, 0.3],
  [58,  7,   85,  -8, 0.9],

  // === RIGHT SIDE ===
  [8,  84,  100,  12, 0.4],
  [38, 87,  110, -15, 1.0],
  [65, 85,   95,  20, 0.2],
  [22, 78,   80, -10, 0.7],
  [55, 80,   90,   8, 1.3],

  // === TOP ROW ===
  [2,  18,   85, -12, 0.5],
  [0,  32,   90,   6, 1.2],
  [5,  48,   75, -18, 0.1],
  [1,  62,   88,  14, 0.8],
  [3,  76,   80,  -6, 1.4],

  // === BOTTOM ROW ===
  [75, 15,   90,  10, 0.6],
  [78, 30,   85, -14, 0.2],
  [80, 48,   78,  20, 1.0],
  [77, 63,   88,  -8, 0.4],
  [74, 78,   80,  15, 1.5],

  // === EXTRAS (edges) ===
  [30,  3,   75, -22, 0.2],
  [50, 88,   80,  18, 0.8],
  [88,  5,   70,  -5, 1.3],
  [85, 85,   75,  12, 0.5],
  [15, 90,   70, -16, 1.1],
  [92, 40,   78, -10, 0.3],
];

// Sticker background component for the header
const StickerBackground = () => (
  <div className="sticker-bg" aria-hidden="true">
    {stickerIds.map((id, i) => {
      const [top, left, size, rotate, delay] = stickerLayout[i] || [10, 10, 80, 0, 0];
      return (
        <img
          key={i}
          className="sticker-pokemon"
          src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`}
          alt=""
          style={{
            top: `${top}%`,
            left: `${left}%`,
            width: `${size}px`,
            height: `${size}px`,
            transform: `rotate(${rotate}deg)`,
            animationDelay: `${delay}s`,
          }}
          onError={(e) => {
            e.target.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
          }}
        />
      );
    })}
  </div>
);



// Skeleton loader component
const SkeletonCard = () => (
  <div className="pokemon-card skeleton">
    <div className="card-header">
      <div className="pokemon-id skeleton-id-header"></div>
    </div>
    <div className="card-image-wrapper skeleton-image"></div>
    <div className="card-info">
      <div className="skeleton-name"></div>
      <div className="card-types">
        <div className="skeleton-type"></div>
        <div className="skeleton-type"></div>
      </div>
    </div>
  </div>
);

// Sidebar Stats Component (Vertical Segmented Bars)
const SidebarStats = ({ stats, color }) => {
  return (
    <div className="sidebar-stats-container">
      <h3>Stats</h3>
      <div className="sidebar-stats-grid">
        {stats.map(s => {
          const SEGMENTS = 15;
          const MAX_STAT = 200;
          const filled = Math.round((s.base_stat / MAX_STAT) * SEGMENTS);
          const statLabel = s.stat.name
            .replace('special-attack', 'Sp. Atk')
            .replace('special-defense', 'Sp. Def')
            .replace('attack', 'Attack')
            .replace('defense', 'Defense')
            .replace('speed', 'Speed')
            .replace('hp', 'HP')
            .replace(/^\w/, c => c.toUpperCase());
          return (
            <div key={s.stat.name} className="sidebar-stat-col">
              <div className="sidebar-stat-bars">
                {Array.from({ length: SEGMENTS }).map((_, i) => {
                  const segIndex = SEGMENTS - 1 - i;
                  const isFilled = segIndex < filled;
                  return (
                    <div
                      key={i}
                      className={`sidebar-stat-seg ${isFilled ? 'filled' : 'empty'}`}
                      style={{ '--seg-color': isFilled ? color : 'rgba(255,255,255,0.1)' }}
                    />
                  );
                })}
              </div>
              <div className="sidebar-stat-label">{statLabel}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Sound button component - plays Pokémon cry
const SoundButton = ({ pokemonId }) => {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);

  const playCry = (e) => {
    e.stopPropagation();
    if (playing) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setPlaying(false);
      return;
    }

    const urls = [
      `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${pokemonId}.ogg`,
      `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/legacy/${pokemonId}.ogg`,
    ];

    const tryPlay = (index) => {
      if (index >= urls.length) {
        setPlaying(false);
        return;
      }
      const audio = new Audio(urls[index]);
      audioRef.current = audio;
      audio.volume = 0.7;
      audio.play()
        .then(() => {
          setPlaying(true);
          audio.onended = () => setPlaying(false);
        })
        .catch(() => tryPlay(index + 1));
    };

    tryPlay(0);
  };

  return (
    <button
      className={`sound-btn ${playing ? 'sound-btn--playing' : ''}`}
      onClick={playCry}
      title={playing ? 'Stop cry' : 'Play Pokémon cry'}
      aria-label={playing ? 'Stop Pokémon cry' : 'Play Pokémon cry'}
    >
      {playing ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none"/>
          <line x1="15" y1="9" x2="21" y2="15"/>
          <line x1="21" y1="9" x2="15" y2="15"/>
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none"/>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
        </svg>
      )}
      {playing && (
        <span className="sound-waves">
          <span/>
          <span/>
          <span/>
        </span>
      )}
    </button>
  );
};

function App() {
  const [search, setSearch] = useState('');
  const [pokemonList, setPokemonList] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selected, setSelected] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [details, setDetails] = useState({});
  const [selectedType, setSelectedType] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [expandedSeason, setExpandedSeason] = useState(null);

  // Helper to fetch random fun facts
  const [randomFacts, setRandomFacts] = useState([]);
  const [loadingFacts, setLoadingFacts] = useState(false);

  const fetchRandomFacts = async () => {
    setLoadingFacts(true);
    const randomIds = Array.from({ length: 3 }, () => Math.floor(Math.random() * 151) + 1);
    try {
      const factPromises = randomIds.map(async id => {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
        const data = await res.json();
        const speciesRes = await fetch(data.species.url);
        const speciesData = await speciesRes.json();
        const flavor = speciesData.flavor_text_entries.find(e => e.language.name === 'en')?.flavor_text.replace(/\f|\n/g, ' ').trim();
        return { name: data.name, id, flavor, image: data.sprites.other['official-artwork'].front_default };
      });
      const facts = await Promise.all(factPromises);
      setRandomFacts(facts);
    } catch (err) {
      console.error("Failed to fetch fun facts:", err);
    }
    setLoadingFacts(false);
  };

  useEffect(() => {
    if (activeTab === 'facts' && randomFacts.length === 0) {
      fetchRandomFacts();
    }
  }, [activeTab]);



  // Fetch all Pokémon names and URLs on mount
  useEffect(() => {
    setInitialLoading(true);
    fetch('https://pokeapi.co/api/v2/pokemon?limit=151')
      .then(res => res.json())
      .then(async data => {
        const basicList = data.results;
        setPokemonList(basicList);
        setFiltered(basicList);
        
        // Fetch details for all 151 to make filters workable immediately
        try {
          const detailPromises = basicList.map(p => fetch(p.url).then(res => res.json()));
          const allDetails = await Promise.all(detailPromises);
          const detailsMap = {};
          allDetails.forEach(d => {
            detailsMap[d.name] = d;
          });
          setDetails(detailsMap);
        } catch (err) {
          console.error("Failed to fetch all details:", err);
        }
        
        setInitialLoading(false);
      })
      .catch(() => {
        setError('Failed to load Pokémon. Please try again.');
        setInitialLoading(false);
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
      // Use existing details if available, otherwise fetch
      let detailsData = details[pokemon.name];
      if (!detailsData) {
        const res = await fetch(pokemon.url);
        detailsData = await res.json();
        setDetails(prev => ({ ...prev, [pokemon.name]: detailsData }));
      }
      
      // Fetch species for evolution chain and flavor text
      const speciesRes = await fetch(detailsData.species.url);
      const species = await speciesRes.json();
      
      // Get flavor text
      let flavorText = '';
      if (species.flavor_text_entries && species.flavor_text_entries.length > 0) {
        const flavorEntry = species.flavor_text_entries.find(entry => entry.language.name === 'en');
        if (flavorEntry) {
          flavorText = flavorEntry.flavor_text.replace(/\f|\n/g, ' ').trim();
        }
      }
      
      // Get category
      const category = species.genera?.find(g => g.language.name === 'en')?.genus || 'Unknown';
      
      // Calculate weaknesses
      const typeEffectiveness = {
        normal: ['fighting'],
        fire: ['water', 'ground', 'rock'],
        water: ['electric', 'grass'],
        electric: ['ground'],
        grass: ['fire', 'ice', 'poison', 'flying', 'bug'],
        ice: ['fire', 'fighting', 'rock', 'steel'],
        fighting: ['flying', 'psychic', 'fairy'],
        poison: ['ground', 'psychic'],
        ground: ['water', 'grass', 'ice'],
        flying: ['electric', 'ice', 'rock'],
        psychic: ['bug', 'ghost', 'dark'],
        bug: ['fire', 'flying', 'rock'],
        rock: ['water', 'grass', 'fighting', 'ground', 'steel'],
        ghost: ['ghost', 'dark'],
        dragon: ['ice', 'dragon', 'fairy'],
        dark: ['fighting', 'bug', 'fairy'],
        steel: ['fire', 'water', 'ground'],
        fairy: ['poison', 'steel']
      };
      
      const weaknessSet = new Set();
      detailsData.types.forEach(typeInfo => {
        const typeName = typeInfo.type.name;
        if (typeEffectiveness[typeName]) {
          typeEffectiveness[typeName].forEach(weakness => {
            weaknessSet.add(weakness);
          });
        }
      });
      
      const weaknesses = Array.from(weaknessSet);
      
      // Fetch evolution chain
      const evoRes = await fetch(species.evolution_chain.url);
      const evo = await evoRes.json();
      setSelected({ 
        details: detailsData, 
        species, 
        evo, 
        flavor: flavorText,
        category: category,
        weaknesses: weaknesses
      });
      setModalOpen(true);
    } catch {
      setError('Failed to load details.');
    }
    setLoading(false);
  };

  const handleSurpriseMe = () => {
    if (pokemonList.length === 0) return;
    const randomIndex = Math.floor(Math.random() * pokemonList.length);
    handleSelect(pokemonList[randomIndex], randomIndex);
  };

  // Helper to get evolution chain as array of { name, id, minLevel }
  const getEvolutionChain = (chain) => {
    const evoArr = [];
    let curr = chain;
    while (curr) {
      // Extract ID from species URL: .../pokemon-species/{id}/
      const urlParts = curr.species.url.split('/').filter(Boolean);
      const id = urlParts[urlParts.length - 1];
      const minLevel = curr.evolution_details?.[0]?.min_level || null;
      const trigger = curr.evolution_details?.[0]?.trigger?.name || null;
      evoArr.push({ name: curr.species.name, id, minLevel, trigger });
      curr = curr.evolves_to?.[0];
    }
    return evoArr;
  };

  // Helper to get primary type color
  const getTypeColor = (types) => {
    if (!types || types.length === 0) return '#999';
    const primaryType = types[0].type.name;
    return typeColors[primaryType] || '#999';
  };

  // Helper to convert hex to rgba
  const hexToRgba = (hex, alpha = 0.15) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // Get modal background color based on type
  const getModalBgColor = (types) => {
    const typeColor = getTypeColor(types);
    return hexToRgba(typeColor, 0.12);
  };

  return (
    <div className="pokemon-app">
      <div className="header-wrapper">
        <StickerBackground />
        <div className="header">
          <h1>⚡ Pokémon Search App</h1>
          <p className="subtitle">Explore and discover Pokémon</p>
        </div>
      </div>

      <nav className={`navbar ${modalOpen || expandedSeason !== null ? 'navbar-hidden' : ''}`}>
        <div className={`nav-indicator ${activeTab}`} />
        <button 
          className={`nav-link ${activeTab === 'home' ? 'active' : ''}`} 
          onClick={() => setActiveTab('home')}
        >
          <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span>Home</span>
        </button>
        <button 
          className={`nav-link ${activeTab === 'facts' ? 'active' : ''}`} 
          onClick={() => setActiveTab('facts')}
        >
          <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.547.547A3 3 0 0 0 14 18.277V20a2 2 0 0 1-2 2h0a2 2 0 0 1-2-2v-1.723a3 3 0 0 0-.814-2.144l-.547-.547z" />
          </svg>
          <span>Fun Facts</span>
        </button>
        <button 
          className={`nav-link ${activeTab === 'sequels' ? 'active' : ''}`} 
          onClick={() => setActiveTab('sequels')}
        >
          <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="15" rx="2" ry="2" />
            <polyline points="17 2 12 7 7 2" />
          </svg>
          <span>Show Sequel</span>
        </button>
      </nav>

      {activeTab === 'home' && (
        <>
          <div className="search-container">
            <input
              type="text"
              placeholder="🔍 Search Pokémon..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="search-input"
            />
            <button className="surprise-me-btn" onClick={handleSurpriseMe}>
              ✨ Surprise Me
            </button>
          </div>
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
                  '--active-bg': color,
                  '--active-shadow': color,
                }}
                onClick={() => setSelectedType(selectedType === type ? null : type)}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
          {initialLoading && (
            <div className="pokemon-grid">
              {[...Array(12)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}
          {!initialLoading && (
            <>
              {error && (
                <div className="error-state">
                  <div className="error-icon">⚠️</div>
                  <p className="error-message">{error}</p>
                  <button className="retry-btn" onClick={() => window.location.reload()}>
                    Try Again
                  </button>
                </div>
              )}
              {filtered.length === 0 && !error && (
                <div className="empty-state">
                  <div className="empty-icon">🔍</div>
                  <h3>No Pokémon Found</h3>
                  <p>Try adjusting your search or filters</p>
                </div>
              )}
              {loading && (
                <div className="loader">
                  <video
                    className="pokeball-loader"
                    src="/Pokeball.webm"
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                  <span>Loading...</span>
                </div>
              )}
              <div className="pokemon-grid">
                {filtered.map((p, i) => {
                  const pokemonDetails = details[p.name];
                  const typeColorStyle = pokemonDetails ? getTypeColor(pokemonDetails.types) : '#999';
                  
                  // Extract actual ID from URL
                  const idFromUrl = p.url.split('/').filter(Boolean).pop();
                  const displayId = idFromUrl.padStart(4, '0');
                  
                  return (
                    <div key={p.name} className="pokemon-card" onClick={() => handleSelect(p, i)} style={{'--card-color': typeColorStyle}}>
                      <div className="card-header">
                        <div className="pokemon-id">#{displayId}</div>
                      </div>
                      
                      <div className="card-image-wrapper">
                        <img
                          src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${idFromUrl}.png`}
                          alt={p.name}
                          className="pokemon-image"
                          onError={(e) => {
                            e.target.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${idFromUrl}.png`;
                          }}
                        />
                      </div>
                      
                      <div className="card-info">
                        <div className="pokemon-name">{p.name.charAt(0).toUpperCase() + p.name.slice(1)}</div>
                        
                        {pokemonDetails && (
                          <div className="card-types">
                            {pokemonDetails.types.map((t) => (
                              <span key={t.type.name} className="type-tag" style={{background: typeColors[t.type.name]}}>
                                {t.type.name.charAt(0).toUpperCase() + t.type.name.slice(1)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

      {activeTab === 'facts' && (
        <div className="facts-page">
          <div className="facts-header">
            <h2>✨ Random Pokémon Fun Facts</h2>
            <button className="refresh-facts-btn" onClick={fetchRandomFacts} disabled={loadingFacts}>
              {loadingFacts ? 'Fetching...' : 'Get New Facts'}
            </button>
          </div>
          <div className="facts-grid">
            {randomFacts.map((fact, i) => (
              <div key={i} className="fact-card">
                <img src={fact.image} alt={fact.name} className="fact-image" />
                <h3>{fact.name.charAt(0).toUpperCase() + fact.name.slice(1)}</h3>
                <p>"{fact.flavor}"</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'sequels' && (
        <div className="sequels-page">
          <h2>📺 Pokémon Series & Sequels</h2>
          <div className="sequels-grid">
            {seasonData.map((show, i) => (
              <div 
                key={i} 
                className="sequel-card"
                onClick={() => setExpandedSeason(i)}
              >
                <div className="sequel-content">
                  <div className="sequel-number">Season {show.season}</div>
                  <h3>{show.name}</h3>
                  <div className="sequel-episodes">{show.episodes.length} Episodes</div>
                  <div className="view-episodes-hint">Click to view episodes</div>
                </div>
              </div>
            ))}
          </div>

          {expandedSeason !== null && (
            <div className="episode-modal-overlay" onClick={() => setExpandedSeason(null)}>
              <div className="episode-modal-card" onClick={e => e.stopPropagation()}>
                <button className="close-modal-btn" onClick={() => setExpandedSeason(null)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                </button>
                <div className="episode-modal-header">
                  <div className="episode-modal-season">Season {seasonData[expandedSeason].season}</div>
                  <h2 className="episode-modal-title">{seasonData[expandedSeason].name}</h2>
                </div>
                
                <div className="episode-list-grid">
                  {seasonData[expandedSeason].episodes.map((ep, idx) => (
                    <div key={idx} className="episode-card-item">
                      <div className="ep-num">{String(idx + 1).padStart(2, '0')}</div>
                      <div className="ep-name">{ep}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {modalOpen && selected && (
        <div className="modal" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{'--primary-color': getTypeColor(selected.details.types), '--modal-bg-color': getModalBgColor(selected.details.types)}}>
            <button className="close-btn" onClick={() => setModalOpen(false)}>✕</button>
            <div className="modal-layout">
              {/* Left Column - Image */}
              <div className="modal-left">
                <img
                  src={selected.details.sprites.other['official-artwork'].front_default || selected.details.sprites.front_default}
                  alt={selected.details.name}
                  className="modal-image"
                />
                <SidebarStats stats={selected.details.stats} color={getTypeColor(selected.details.types)} />
              </div>
              
              {/* Right Column - Details */}
              <div className="modal-right">
                <div className="modal-header-right">
                  <div>
                    <div className="pokemon-name-sound-row">
                      <h2>{selected.details.name.charAt(0).toUpperCase() + selected.details.name.slice(1)}</h2>
                      <SoundButton pokemonId={selected.details.id} />
                    </div>
                    <div className="pokemon-number">#{String(selected.details.id).padStart(4, '0')}</div>
                  </div>
                </div>
                
                {/* Flavor Text */}
                {selected.flavor && (
                  <p className="flavor-text">{selected.flavor}</p>
                )}
                

                
                {/* Info Box */}
                <div className="info-box">
                  <div className="info-row">
                    <div className="info-item">
                      <div className="info-label">Height</div>
                      <div className="info-value">{(selected.details.height / 10).toFixed(1)}'</div>
                    </div>
                    <div className="info-item">
                      <div className="info-label">Category</div>
                      <div className="info-value">{selected.category || 'Unknown'}</div>
                    </div>
                  </div>
                  <div className="info-row">
                    <div className="info-item">
                      <div className="info-label">Weight</div>
                      <div className="info-value">{(selected.details.weight / 10).toFixed(1)} lbs</div>
                    </div>
                    <div className="info-item">
                      <div className="info-label">Abilities</div>
                      <div className="info-value">{selected.details.abilities[0].ability.name.charAt(0).toUpperCase() + selected.details.abilities[0].ability.name.slice(1)}</div>
                    </div>
                  </div>
                  <div className="info-row">
                    <div className="info-item">
                      <div className="info-label">Gender</div>
                      <div className="info-value">♂ ♀</div>
                    </div>
                  </div>
                </div>
                
                {/* Type */}
                <div className="modal-types-section">
                  <h4>Type</h4>
                  <div className="types-inline">
                    {selected.details.types.map(t => (
                      <span key={t.type.name} className="type-badge-inline" style={{background: typeColors[t.type.name]}}>
                        {t.type.name.charAt(0).toUpperCase() + t.type.name.slice(1)}
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* Weaknesses */}
                {selected.weaknesses && selected.weaknesses.length > 0 && (
                  <div className="modal-weaknesses-section">
                    <h4>Weaknesses</h4>
                    <div className="types-inline">
                      {selected.weaknesses.map(w => (
                        <span key={w} className="weakness-badge" style={{background: typeColors[w]}}>
                          {w.charAt(0).toUpperCase() + w.slice(1)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Evolution Chain */}
            {selected.evo && (() => {
              const chain = getEvolutionChain(selected.evo.chain);
              if (chain.length <= 1) return null;
              return (
                <div className="modal-section modal-evo-section">
                  <h3>Evolution Chain</h3>
                  <div className="evo-chain">
                    {chain.map((evo, idx) => (
                      <div key={evo.name} className="evo-chain-item">
                        {idx > 0 && (
                          <div className="evo-arrow">
                            <div className="evo-arrow-line" />
                            <div className="evo-arrow-label">
                              {evo.minLevel ? `Lv ${evo.minLevel}` : evo.trigger === 'use-item' ? 'Item' : '✦'}
                            </div>
                            <div className="evo-arrow-head">▶</div>
                          </div>
                        )}
                        <div
                          className={`evo-stage ${selected.details.name === evo.name ? 'evo-stage--active' : ''}`}
                          onClick={() => {
                            const evoIndex = parseInt(evo.id) - 1;
                            const pokemon = pokemonList.find(p => p.name === evo.name) || pokemonList[evoIndex];
                            if (pokemon) {
                              setModalOpen(false);
                              setTimeout(() => handleSelect(pokemon, evoIndex), 200);
                            }
                          }}
                          title={`View ${evo.name.charAt(0).toUpperCase() + evo.name.slice(1)}`}
                        >
                          <div className="evo-sprite-wrapper">
                            <img
                              className="evo-sprite"
                              src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${evo.id}.png`}
                              alt={evo.name}
                              onError={(e) => {
                                e.target.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${evo.id}.png`;
                              }}
                            />
                          </div>
                          <span className="evo-name">{evo.name.charAt(0).toUpperCase() + evo.name.slice(1)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

          </div>
        </div>
      )}
    </div>
  );
}

export default App;
