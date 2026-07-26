// api/search.js — парсим lordfilm
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
    // 1. Поиск на lordfilm
    const searchUrl = `https://lordfilm.work/search/?q=${encodeURIComponent(query)}`;
    const response = await fetch(searchUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    if (!response.ok) throw new Error('Поиск не удался');
    const html = await response.text();

    // 2. Ищем ссылку на первый фильм (обычно /films/...)
    const filmLinkMatch = html.match(/<a[^>]+href="\/(films\/[^"]+)"[^>]*>/i);
    if (!filmLinkMatch) return res.json([]);

    const filmPath = filmLinkMatch[1];
    const filmUrl = `https://lordfilm.work/${filmPath}`;

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

    const descMatch = filmHtml.match(/<div[^>]*class="description"[^>]*>([^<]+)<\/div>/i);
    const description = descMatch ? descMatch[1].trim() : '';

    // 5. Ищем iframe плеера (часто бывает на lordfilm)
    const iframeMatch = filmHtml.match(/<iframe[^>]+src="([^"]+)"[^>]*>/i);
    if (!iframeMatch) return res.json([]);

    const iframeSrc = iframeMatch[1];

    // 6. Загружаем iframe, чтобы достать прямую ссылку на видео
    const iframeResponse = await fetch(iframeSrc, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const iframeHtml = await iframeResponse.text();

    // 7. Ищем mp4 или m3u8
    const videoMatch = iframeHtml.match(/(https?:\/\/[^\s"']+\.(mp4|m3u8)[^\s"']*)/i);
    if (!videoMatch) return res.json([]);

    const videoUrl = videoMatch[1];

    res.json([{
      title: title,
      year: '',
      poster: poster,
      description: description,
      videoUrl: videoUrl,
      seeders: 999
    }]);

  } catch (error) {
    console.error('Ошибка парсинга lordfilm:', error);
    res.json([]);
  }
}
