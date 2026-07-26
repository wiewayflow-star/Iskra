// api/search.js
export default async function handler(req, res) {
  // ... (настройки CORS и обработка OPTIONS остаются без изменений) ...

  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: 'Введите название фильма' });
  }

  try {
    // Запрос к API Torrents-CSV
    const response = await fetch(
      `https://torrents-csv.com/service/search?q=${encodeURIComponent(query)}&size=50`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Преобразуем ответ в нужный тебе формат
    const results = data.map(item => ({
      title: item.name,
      year: item.created_at ? new Date(item.created_at).getFullYear() : '',
      poster: '', // У этого API нет постеров, нужно будет добавить позже
      magnet: `magnet:?xt=urn:btih:${item.infohash}`, // Формируем magnet-ссылку
      quality: 'unknown',
      seeders: item.seeders || 0
    }));

    res.json(results);
  } catch (error) {
    console.error('Ошибка поиска:', error);
    res.status(500).json({ error: 'Не удалось выполнить поиск' });
  }
}
