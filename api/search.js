// api/search.js — финальная версия
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

  try {
    // Только один источник — Torrents-CSV, он самый надёжный
    const response = await fetch(
      `https://torrents-csv.com/service/search?q=${encodeURIComponent(query)}&size=50`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    if (!data.torrents || !Array.isArray(data.torrents)) {
      return res.json([]);
    }

    // Преобразуем и фильтруем
    let results = data.torrents
      .filter(item => item.seeders > 0) // Только с сидами
      .map(item => {
        const trackerStr = trackers.map(t => `&tr=${encodeURIComponent(t)}`).join('');
        return {
          title: item.name || 'Без названия',
          year: item.created_unix ? new Date(item.created_unix * 1000).getFullYear() : '',
          poster: '',
          magnet: `magnet:?xt=urn:btih:${item.infohash}${trackerStr}`,
          quality: item.quality || 'unknown',
          seeders: item.seeders || 0,
          size: item.size_bytes || 0
        };
      })
      .sort((a, b) => b.seeders - a.seeders); // Сначала с большим количеством сидов

    // Ограничиваем до 20 результатов
    results = results.slice(0, 20);

    console.log(`✅ Найдено ${results.length} живых торрентов`);
    res.json(results);

  } catch (error) {
    console.error('Ошибка поиска:', error);
    res.json([]);
  }
}
