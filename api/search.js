// api/search.js — ищем iframe-плеер
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
    // Ищем на Kinokong
    const searchUrl = `https://kinokong.org/search?q=${encodeURIComponent(query)}`;
    const response = await fetch(searchUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    if (!response.ok) throw new Error('Поиск не удался');
    const html = await response.text();

    // Ищем ссылку на страницу фильма
    const filmLinkMatch = html.match(/<a[^>]+href="\/(film\/\d+[^"]+)"[^>]*>/i);
    if (!filmLinkMatch) return res.json([]);
    
    const filmPath = filmLinkMatch[1];
    const filmUrl = `https://kinokong.org/${filmPath}`;

    // Загружаем страницу фильма
    const filmResponse = await fetch(filmUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const filmHtml = await filmResponse.text();

    // Вытаскиваем название и постер
    const titleMatch = filmHtml.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    const title = titleMatch ? titleMatch[1].trim() : query;

    const posterMatch = filmHtml.match(/<img[^>]+src="([^"]+)"[^>]+class="poster"/i);
    const poster = posterMatch ? posterMatch[1] : '';

    const yearMatch = filmHtml.match(/(?:20\d{2}|19\d{2})/);
    const year = yearMatch ? yearMatch[0] : '';

    // Ищем iframe-плеер
    const iframeMatch = filmHtml.match(/<iframe[^>]+src="([^"]+)"[^>]*>/i);
    if (!iframeMatch) return res.json([]);
    
    const iframeSrc = iframeMatch[1];

    // Возвращаем ссылку на iframe
    res.json([{
      title: title,
      year: year,
      poster: poster,
      videoUrl: iframeSrc,  // ← это ссылка на iframe-плеер
      seeders: 999
    }]);

  } catch (error) {
    console.error('Ошибка:', error);
    res.json([]);
  }
}
