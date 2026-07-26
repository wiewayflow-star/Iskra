// api/search.js — использует внутренний API Kinokong
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
    // Шаг 1: Ищем фильм через поиск Kinokong
    const searchUrl = `https://kinokong.org/search?q=${encodeURIComponent(query)}`;
    const searchResponse = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!searchResponse.ok) throw new Error('Поиск не удался');
    const html = await searchResponse.text();

    // Шаг 2: Вытаскиваем ID фильма из ссылки
    // Ищем ссылку вида /film/12345-название
    const idMatch = html.match(/href="\/film\/(\d+)-[^"]+"/);
    if (!idMatch) return res.json([]);
    const filmId = idMatch[1];

    // Шаг 3: Получаем данные фильма через внутренний API
    const apiUrl = `https://kinokong.org/api/film/${filmId}`;
    const apiResponse = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json'
      }
    });

    if (!apiResponse.ok) throw new Error('API не ответил');
    const data = await apiResponse.json();

    // Шаг 4: Парсим ответ API
    // У Kinokong API возвращает примерно такую структуру:
    // { film: { title, year, poster, description }, video: { url: '...' } }
    const film = data.film || data;
    const videoUrl = data.video?.url || data.url || data.stream || '';

    if (!videoUrl) {
      // Если прямой ссылки нет — ищем в плеере
      const playerMatch = html.match(/<iframe[^>]+src="([^"]+)"[^>]*>/i);
      if (playerMatch) {
        const iframeSrc = playerMatch[1];
        // Пробуем вытащить ссылку из iframe
        const iframeResponse = await fetch(iframeSrc, {
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const iframeHtml = await iframeResponse.text();
        const videoInIframe = iframeHtml.match(/(https?:\/\/[^\s"']+\.(mp4|m3u8)[^\s"']*)/i);
        if (videoInIframe) {
          return res.json([{
            title: film.title || query,
            year: film.year || '',
            poster: film.poster || '',
            description: film.description || '',
            videoUrl: videoInIframe[1],
            seeders: 999
          }]);
        }
      }
      return res.json([]);
    }

    // Шаг 5: Возвращаем результат
    res.json([{
      title: film.title || query,
      year: film.year || '',
      poster: film.poster || '',
      description: film.description || '',
      videoUrl: videoUrl,
      seeders: 999
    }]);

  } catch (error) {
    console.error('Ошибка:', error);
    res.json([]);
  }
}
