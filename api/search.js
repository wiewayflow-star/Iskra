// api/search.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: 'Введите название' });
  }

  // Проверенные рабочие трекеры
  const trackers = [
    'udp://tracker.opentrackr.org:1337/announce',
    'udp://tracker.coppersurfer.tk:6969/announce',
    'udp://tracker.leechers-paradise.org:6969/announce',
    'udp://explodie.org:6969/announce',
    'udp://tracker.zer0day.to:1337/announce',
    'udp://tracker.cyberia.is:6969/announce',
    'wss://tracker.btorrent.xyz',
    'wss://tracker.openwebtorrent.com'
  ];

  const sources = [
    {
      name: 'Torrents-CSV',
      url: `https://torrents-csv.com/service/search?q=${encodeURIComponent(query)}&size=50`,
      parser: (data) => {
        if (!data.torrents || !Array.isArray(data.torrents)) return [];
        return data.torrents.map(item => {
          const trackerStr = trackers.map(t => `&tr=${encodeURIComponent(t)}`).join('');
          return {
            title: item.name || 'Без названия',
            year: item.created_unix ? new Date(item.created_unix * 1000).getFullYear() : '',
            poster: '',
            magnet: `magnet:?xt=urn:btih:${item.infohash}${trackerStr}`,
            quality: item.quality || 'unknown',
            seeders: item.seeders || 0
          };
        });
      }
    },
    {
      name: 'TorAPI (запасной)',
      url: `https://torapi.vercel.app/api/search?q=${encodeURIComponent(query)}&provider=all`,
      parser: (data) => {
        if (!Array.isArray(data)) return [];
        return data.filter(item => item.magnet).map(item => ({
          title: item.title || 'Без названия',
          year: item.year || '',
          poster: item.poster || '',
          magnet: item.magnet,
          quality: item.quality || 'unknown',
          seeders: item.seeders || 0
        }));
      }
    }
  ];

  for (const source of sources) {
    try {
      console.log(`Пробуем источник: ${source.name}`);
      const response = await fetch(source.url, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });

      if (!response.ok) {
        console.log(`${source.name} вернул ошибку ${response.status}`);
        continue;
      }

      const data = await response.json();
      const results = source.parser(data);

      if (results && results.length > 0) {
        console.log(`✅ Найдено ${results.length} результатов через ${source.name}`);
        return res.json(results);
      }
    } catch (error) {
      console.error(`❌ Ошибка с источником ${source.name}:`, error.message);
    }
  }

  res.json([]);
}
