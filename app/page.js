'use client';
import { useState } from 'react';

export default function Home() {
  const [query, setQuery] = useState('');
  const [film, setFilm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const search = async (searchQuery) => {
    const q = searchQuery || query;
    if (!q.trim()) return;
    setLoading(true);
    setError('');
    setFilm(null);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setFilm(data);
    } catch (e) {
      setError(e.message || 'Не найдено');
    } finally {
      setLoading(false);
    }
  };

  const loadFilmById = async (id) => {
    if (!id) return;
    setLoading(true);
    setError('');
    setFilm(null);
    try {
      const res = await fetch(`/api/film/${id}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setFilm(data);
    } catch (e) {
      setError(e.message || 'Ошибка загрузки фильма');
    } finally {
      setLoading(false);
    }
  };

  const getRelationLabel = (type) => {
    const map = {
      SEQUEL: 'Сиквел',
      PREQUEL: 'Приквел',
      REMAKE: 'Ремейк',
      PARODY: 'Пародия',
      SIMILAR: 'Похожий',
      SPIN_OFF: 'Спин-офф',
    };
    return map[type] || type;
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '20px' }}>
      <h1 style={{ textAlign: 'center' }}>Поиск фильмов</h1>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '20px' }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Введите название, например: Бэтмен"
          style={{ flex: 1, padding: '10px', fontSize: '16px' }}
          onKeyDown={(e) => e.key === 'Enter' && search()}
        />
        <button onClick={() => search()} disabled={loading} style={{ padding: '10px 20px' }}>
          {loading ? 'Ищем...' : 'Найти'}
        </button>
      </div>

      {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}

      {film && (
        <div>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
            {film.poster && (
              <img src={film.poster} alt={film.title} style={{ width: '180px', borderRadius: '8px' }} />
            )}
            <div>
              <h2>{film.title} ({film.year})</h2>
            </div>
          </div>

          {film.iframe ? (
            <div style={{ marginTop: '20px', position: 'relative', paddingBottom: '56.25%', height: 0 }}>
              <iframe
                src={film.iframe}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                allowFullScreen
                frameBorder="0"
              />
            </div>
          ) : (
            <p style={{ color: 'red', marginTop: '20px' }}>
              Не удалось загрузить плеер для этого фильма. Попробуйте другой.
            </p>
          )}

          {film.relations && film.relations.length > 0 && (
            <div style={{ marginTop: '30px' }}>
              <h3>Связанные фильмы</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                {film.relations.map((rel, index) => (
                  <div
                    key={`${rel.kinopoiskId}-${index}`}
                    onClick={() => loadFilmById(rel.kinopoiskId)}
                    style={{
                      cursor: 'pointer',
                      width: '150px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      transition: '0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                  >
                    <img
                      src={rel.posterUrl || 'https://via.placeholder.com/150x225?text=No+Poster'}
                      alt={rel.nameRu || rel.nameEn}
                      style={{ width: '100%', height: 'auto' }}
                    />
                    <div style={{ padding: '8px', fontSize: '14px' }}>
                      <div style={{ fontWeight: 'bold' }}>
                        {rel.nameRu || rel.nameEn || 'Без названия'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {getRelationLabel(rel.relationType)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}