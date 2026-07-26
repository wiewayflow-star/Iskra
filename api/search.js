// api/torrentclaw.js
export default async function handler(req, res) {
  // Разрешаем запросы с твоего сайта (CORS)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: 'Введите название фильма или сериала' });
  }

  try {
    // Запрос к API TorrentClaw
    // Согласно документации, API может принимать разные параметры для фильтрации
    // Мы используем базовый поиск по названию, но можно добавить type, year, quality и т.д.
    const response = await fetch(
      `https://torrentclaw.com/api/search?query=${encodeURIComponent(query)}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Преобразуем ответ от TorrentClaw в тот формат, который ожидает твой фронтенд
    // (чтобы не переписывать весь index.html)
    const results = data.results.map(item => ({
      title: item.title,
      year: item.year,
      poster: item.poster_path,
      magnet: item.magnet_url,
      // Добавь другие поля по необходимости
      quality: item.quality,
      seeders: item.seeders
    }));

    res.json(results);
  } catch (error) {
    console.error('Ошибка поиска через TorrentClaw:', error);
    res.status(500).json({ error: 'Не удалось выполнить поиск. Попробуйте позже.' });
  }
}
