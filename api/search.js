// api/search.js — использует публичный агрегатор
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
    // Используем публичный API для поиска фильмов
    // Этот API берёт данные с разных пиратских сайтов
    const response = await fetch(
      `https://videocdn.tv/api/search?q=${encodeURIComponent(query)}&type=all`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    // Преобразуем в нужный формат
    if (data && data.results && data.results.length > 0) {
      const results = data.results.map(item => ({
        title: item.title || 'Без названия',
        year: item.year || '',
        poster: item.poster || '',
        videoUrl: item.stream || item.url || item.link || '',
        seeders: 999
      })).filter(item => item.videoUrl);

      return res.json(results);
    }

    // Если API не сработал — пробуем запасной источник
    const backupResponse = await fetch(
      `https://kinobase.org/api/search?q=${encodeURIComponent(query)}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );

    if (backupResponse.ok) {
      const backupData = await backupResponse.json();
      if (backupData && backupData.length > 0) {
        const results = backupData.map(item => ({
          title: item.title || 'Без названия',
          year: item.year || '',
          poster: item.poster || '',
          videoUrl: item.video || item.url || '',
          seeders: 999
        })).filter(item => item.videoUrl);
        return res.json(results);
      }
    }

    res.json([]);
  } catch (error) {
    console.error('Ошибка поиска:', error);
    res.json([]);
  }
}
