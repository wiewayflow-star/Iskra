// api/search.js — универсальный агрегатор
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: 'Введите название' });

  const sources = [
    // Пробуем разные публичные API-агрегаторы
    {
      url: `https://api.videocdn.tv/search?q=${encodeURIComponent(query)}&type=all`,
      parser: (data) => data.results?.map(item => ({
        title: item.title,
        year: item.year,
        poster: item.poster,
        videoUrl: item.stream || item.url,
        description: item.description
      })) || []
    },
    {
      url: `https://kinobase.org/api/search?q=${encodeURIComponent(query)}`,
      parser: (data) => data.map(item => ({
        title: item.title,
        year: item.year,
        poster: item.poster,
        videoUrl: item.video || item.link,
        description: item.description
      })) || []
    },
    {
      url: `https://api.kinoflux.org/search?q=${encodeURIComponent(query)}`,
      parser: (data) => data.results?.map(item => ({
        title: item.name,
        year: item.year,
        poster: item.image,
        videoUrl: item.url,
        description: item.overview
      })) || []
    }
  ];

  for (const source of sources) {
    try {
      const response = await fetch(source.url, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      if (!response.ok) continue;
      const data = await response.json();
      const results = source.parser(data).filter(item => item.videoUrl);
      if (results.length > 0) {
        return res.json(results);
      }
    } catch (e) {
      console.warn('Источник не сработал:', e.message);
    }
  }

  // Если ничего не нашли — возвращаем пустой массив
  res.json([]);
}
