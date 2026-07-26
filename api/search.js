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
    // 1. Идём на kinokong.org через публичный прокси (чтобы обойти блокировки)
    const searchUrl = `https://kinokong.org/search?q=${encodeURIComponent(query)}`;
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(searchUrl)}`;
    
    const response = await fetch(proxyUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();

    // 2. Парсим ссылку на первый фильм
    const filmLinkMatch = html.match(/<a[^>]+href="\/([^"]+)"[^>]*>.*?<\/a>/i);
    if (!filmLinkMatch) return res.json([]);
    
    const filmSlug = filmLinkMatch[1];
    const filmUrl = `https://kinokong.org/${filmSlug}`;

    // 3. Идём на страницу фильма через прокси
    const filmProxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(filmUrl)}`;
    const filmResponse = await fetch(filmProxyUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const filmHtml = await filmResponse.text();

    // 4. Вытаскиваем данные
    const titleMatch = filmHtml.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    const title = titleMatch ? titleMatch[1].trim() : query;

    const posterMatch = filmHtml.match(/<img[^>]+src="([^"]+)"[^>]+class="poster"/i);
    const poster = posterMatch ? posterMatch[1] : '';

    const yearMatch = filmHtml.match(/(?:20\d{2}|19\d{2})/);
    const year = yearMatch ? yearMatch[0] : '';

    const descMatch = filmHtml.match(/<p[^>]*class="desc"[^>]*>([^<]+)<\/p>/i);
    const description = descMatch ? descMatch[1].trim() : '';

    // 5. Ищем прямую ссылку на видео (mp4 или m3u8)
    const videoMatch = filmHtml.match(/(https?:\/\/[^\s"']+\.(mp4|m3u8)[^\s"']*)/i);
    const videoUrl = videoMatch ? videoMatch[1] : '';

    if (!videoUrl) {
      // Если не нашли — ищем через iframe-плеер (запасной вариант)
      const iframeMatch = filmHtml.match(/<iframe[^>]+src="([^"]+)"/i);
      const iframeUrl = iframeMatch ? iframeMatch[1] : '';
      if (iframeUrl) {
        // Пробуем вытащить ссылку из iframe
        const iframeProxy = `https://api.allorigins.win/raw?url=${encodeURIComponent(iframeUrl)}`;
        const iframeResponse = await fetch(iframeProxy);
        const iframeHtml = await iframeResponse.text();
        const videoInIframe = iframeHtml.match(/(https?:\/\/[^\s"']+\.(mp4|m3u8)[^\s"']*)/i);
        if (videoInIframe) {
          return res.json([{
            title,
            year,
            poster,
            description,
            videoUrl: videoInIframe[1],
            seeders: 999
          }]);
        }
      }
      return res.json([]);
    }

    // 6. Возвращаем результат
    res.json([{
      title,
      year,
      poster,
      description,
      videoUrl,
      seeders: 999
    }]);

  } catch (error) {
    console.error('Ошибка парсинга:', error);
    res.json([]);
  }
}
