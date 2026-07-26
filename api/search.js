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
    // 1. Запрос к Torrents-CSV
    const response = await fetch(
      `https://torrents-csv.com/service/search?q=${encodeURIComponent(query)}&size=50`
    );

    console.log('Torrents-CSV статус:', response.status);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log('Torrents-CSV ответ:', data);

    // 2. Проверяем, что data — это массив
    if (!Array.isArray(data)) {
      console.error('Ошибка: данные не массив', data);
      return res.json([]);
    }

    // 3. Преобразуем в формат, который ждёт фронтенд
    const results = data.map(item => {
      // Формируем magnet-ссылку, если её нет
      let magnet = item.magnet || '';
      if (!magnet && item.infohash) {
        magnet = `magnet:?xt=urn:btih:${item.infohash}&tr=udp://tracker.openbittorrent.com:80/announce`;
      }

      return {
        title: item.name || item.title || 'Без названия',
        year: item.year || (item.created_at ? new Date(item.created_at).getFullYear() : ''),
        poster: '', // У Torrents-CSV нет постеров
        magnet: magnet,
        quality: item.quality || 'unknown',
        seeders: item.seeders || 0
      };
    });

    console.log('Результатов после парсинга:', results.length);
    res.json(results);

  } catch (error) {
    console.error('Ошибка в api/search:', error);
    // ВСЕГДА возвращаем массив, даже при ошибке
    res.status(200).json([]);
  }
}
