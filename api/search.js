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

  try {
    // Запрос к Torrents-CSV
    const response = await fetch(
      `https://torrents-csv.com/service/search?q=${encodeURIComponent(query)}&size=50`
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    // Проверяем, что data — это объект с полем torrents и это массив
    if (!data.torrents || !Array.isArray(data.torrents)) {
      console.error('Ошибка: данные не содержат массив torrents', data);
      return res.json([]);
    }

    // Преобразуем в формат, который ждёт фронтенд
    const results = data.torrents.map(item => ({
      title: item.name || 'Без названия',
      year: item.created_unix ? new Date(item.created_unix * 1000).getFullYear() : '',
      poster: '', // У этого API нет постеров
      magnet: `magnet:?xt=urn:btih:${item.infohash}&tr=udp://tracker.openbittorrent.com:80/announce`,
      quality: item.quality || 'unknown',
      seeders: item.seeders || 0
    }));

    res.json(results);
  } catch (error) {
    console.error('Ошибка поиска:', error);
    res.status(200).json([]);
  }
}
