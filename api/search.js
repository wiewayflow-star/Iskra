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
    // 1. Ищем фильм на kinokong.org
    const searchUrl = `https://kinokong.org/search?q=${encodeURIComponent(query)}`;
    const searchResponse = await fetch(searchUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    if (!searchResponse.ok) throw new Error('Поиск не удался');
    const html = await searchResponse.text();

    // 2. Находим ссылку на страницу первого фильма
    const filmLinkMatch = html.match(/<a[^>]+href="\/(film\/\d+[^"]+)"[^>]*>/i);
    if (!filmLinkMatch) return res.json([]);
    
    const filmPath = filmLinkMatch[1];
    const filmUrl = `https://kinokong.org/${filmPath}`;

    // 3. Загружаем страницу фильма
    const filmResponse = await fetch(filmUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const filmHtml = await filmResponse.text();

    // 4. Парсим название, постер, описание
    const titleMatch = filmHtml.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    const title = titleMatch ? titleMatch[1].trim() : query;

    const posterMatch = filmHtml.match(/<img[^>]+src="([^"]+)"[^>]+class="poster"/i);
    const poster = posterMatch ? posterMatch[1] : '';

    const yearMatch = filmHtml.match(/(?:20\d{2}|19\d{2})/);
    const year = yearMatch ? yearMatch[0] : '';

    const descMatch = filmHtml.match(/<div[^>]*class="desc"[^>]*>([^<]+)<\/div>/i);
    const description = descMatch ? descMatch[1].trim() : '';

    // 5. НАХОДИМ ПРЯМУЮ ССЫЛКУ НА ВИДЕО (без рекламы!)
    // Ищем в коде страницы ссылку на .mp4 или .m3u8
    let videoUrl = '';
    
    // Сначала ищем в iframe плеера
    const iframeMatch = filmHtml.match(/<iframe[^>]+src="([^"]+)"[^>]*>/i);
    if (iframeMatch) {
      const iframeSrc = iframeMatch[1];
      // Загружаем iframe, чтобы достать видео оттуда
      const iframeResponse = await fetch(iframeSrc, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      const iframeHtml = await iframeResponse.text();
      const videoInIframe = iframeHtml.match(/(https?:\/\/[^\s"']+\.(mp4|m3u8)[^\s"']*)/i);
      if (videoInIframe) {
        videoUrl = videoInIframe[1];
      }
    }

    // Если в iframe не нашли — ищем прямо в HTML страницы
    if (!videoUrl) {
      const directVideo = filmHtml.match(/(https?:\/\/[^\s"']+\.(mp4|m3u8)[^\s"']*)/i);
      if (directVideo) {
        videoUrl = directVideo[1];
      }
    }

    if (!videoUrl) {
      return res.json([]);
    }

    // 6. Возвращаем данные для твоего плеера
    res.json([{
      title: title,
      year: year,
      poster: poster,
      description: description,
      videoUrl: videoUrl,  // ← чистая ссылка на видео!
      seeders: 999
    }]);

  } catch (error) {
    console.error('Ошибка парсинга:', error);
    res.json([]);
  }
}
