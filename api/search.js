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
    // 1. Ищем на iframe.cloud
    const searchUrl = `https://iframe.cloud/search?q=${encodeURIComponent(query)}`;
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) throw new Error('Поиск не удался');
    const html = await response.text();

    // 2. Ищем ссылку на страницу фильма (первый результат)
    // На iframe.cloud ссылки на фильмы имеют вид /watch/...
    const filmLinkMatch = html.match(/<a[^>]+href="\/(watch\/[^"]+)"[^>]*>/i);
    if (!filmLinkMatch) return res.json([]);

    const filmPath = filmLinkMatch[1];
    const filmUrl = `https://iframe.cloud/${filmPath}`;

    // 3. Загружаем страницу фильма
    const filmResponse = await fetch(filmUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const filmHtml = await filmResponse.text();

    // 4. Вытаскиваем название, постер, описание
    const titleMatch = filmHtml.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    const title = titleMatch ? titleMatch[1].trim() : query;

    const posterMatch = filmHtml.match(/<img[^>]+src="([^"]+)"[^>]+class="poster"/i);
    const poster = posterMatch ? posterMatch[1] : '';

    const descMatch = filmHtml.match(/<p[^>]*class="description"[^>]*>([^<]+)<\/p>/i);
    const description = descMatch ? descMatch[1].trim() : '';

    // 5. Ищем iframe-плеер внутри страницы
    const iframeMatch = filmHtml.match(/<iframe[^>]+src="([^"]+)"[^>]*>/i);
    if (!iframeMatch) return res.json([]);

    const iframeSrc = iframeMatch[1];

    // 6. Загружаем iframe, чтобы достать прямую ссылку на видео
    const iframeResponse = await fetch(iframeSrc, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const iframeHtml = await iframeResponse.text();

    // 7. Ищем видеофайл (mp4, m3u8)
    const videoMatch = iframeHtml.match(/(https?:\/\/[^\s"']+\.(mp4|m3u8)[^\s"']*)/i);
    if (!videoMatch) return res.json([]);

    const videoUrl = videoMatch[1];

    // 8. Возвращаем данные для твоего плеера
    res.json([{
      title: title,
      year: '', // на iframe.cloud нет года в явном виде
      poster: poster,
      description: description,
      videoUrl: videoUrl,
      seeders: 999
    }]);

  } catch (error) {
    console.error('Ошибка парсинга:', error);
    res.json([]);
  }
}
