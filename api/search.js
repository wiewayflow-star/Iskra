// api/search.js
export default async function handler(req, res) {
  // Разрешаем запросы с любого источника (CORS)
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
    // Запрос к Torrents-CSV API
    const response = await fetch(
      `https://torrents-csv.com/service/search?q=${encodeURIComponent(query)}&size=50`
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    // Проверяем, что data — это массив
    if (!Array.isArray(data)) {
      throw new Error('API вернул не массив');
    }

    // Преобразуем в формат, который ждёт фронтенд
    const results = data.map(item => ({
      title: item.name || 'Без названия',
      year: item.year || '',
      poster: '', // У этого API нет постеров
      magnet: item.magnet || `magnet:?xt=urn:btih:${item.infohash}`,
      quality: item.quality || 'unknown',
      seeders: item.seeders || 0
    }));

    res.json(results);
  } catch (error) {
    console.error('Ошибка поиска:', error);
    // ВАЖНО: всегда возвращаем массив, даже при ошибке
    res.status(200).json([]); // ← пустой массив, чтобы фронтенд не падал
  }
}
