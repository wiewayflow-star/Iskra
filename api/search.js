// api/search.js — парсинг видео с пиратских сайтов
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: 'Введите название' });

  try {
    // Идём на kinokong.org, ищем фильм
    const searchUrl = `https://kinokong.org/search?q=${encodeURIComponent(query)}`;
    const response = await fetch(searchUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const html = await response.text();

    // Вытаскиваем первую ссылку на фильм (простой парсинг)
    const match = html.match(/<a href="\/([^"]+)"[^>]*>.*?<\/a>/i);
    if (!match) return res.json([]);

    const filmSlug = match[1];
    const filmUrl = `https://kinokong.org/${filmSlug}`;
    
    // Идём на страницу фильма
    const filmResponse = await fetch(filmUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const filmHtml = await filmResponse.text();

    // Ищем ссылку на видео (mp4 или m3u8)
    const videoMatch = filmHtml.match(/(https?:\/\/[^\s"']+\.(mp4|m3u8)[^\s"']*)/i);
    if (!videoMatch) return res.json([]);

    const videoUrl = videoMatch[1];

    // Вытаскиваем название и постер (если есть)
    const titleMatch = filmHtml.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    const title = titleMatch ? titleMatch[1].trim() : query;
    
    const posterMatch = filmHtml.match(/<img[^>]+src="([^"]+)"[^>]+class="poster"/i);
    const poster = posterMatch ? posterMatch[1] : '';

    res.json([{
      title: title,
      year: '',
      poster: poster,
      videoUrl: videoUrl,
      seeders: 999
    }]);

  } catch (error) {
    console.error('Ошибка парсинга:', error);
    res.json([]);
  }
}
