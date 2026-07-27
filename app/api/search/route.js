import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  if (!query?.trim()) {
    return NextResponse.json({ error: 'Введите название' }, { status: 400 });
  }

  const apiKey = process.env.KINOPOISK_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API ключ не настроен' }, { status: 500 });
  }

  // Поиск на Кинопоиске
  const searchUrl = `https://kinopoiskapiunofficial.tech/api/v2.1/films/search-by-keyword?keyword=${encodeURIComponent(query)}&page=1`;
  let filmData;
  try {
    const res = await fetch(searchUrl, { headers: { 'X-API-KEY': apiKey } });
    const data = await res.json();
    if (!data.films?.length) {
      return NextResponse.json({ error: 'Фильм не найден' }, { status: 404 });
    }
    filmData = data.films[0];
  } catch {
    return NextResponse.json({ error: 'Ошибка поиска' }, { status: 500 });
  }

  const kinopoiskId = filmData.filmId;

  // Получение iframe от Kinobox (автоматически с токенами)
  let iframeUrl = null;
  try {
    const kinoboxRes = await fetch(
      `https://kinobox.tv/api/player?kinopoisk_id=${kinopoiskId}&type=movie`
    );
    if (kinoboxRes.ok) {
      const kinoboxData = await kinoboxRes.json();
      iframeUrl = kinoboxData.iframe;
    }
  } catch {
    // если Kinobox не ответит – оставляем null
  }

  // Если Kinobox не дал iframe, пробуем резервный вариант через vidsrc (без токенов, но может работать)
  if (!iframeUrl) {
    // можно попробовать vidsrc.to, но он часто требует реферала
    // оставляем null – тогда покажем сообщение
  }

  // Связанные фильмы
  let relations = [];
  try {
    const relRes = await fetch(
      `https://kinopoiskapiunofficial.tech/api/v2.2/films/${kinopoiskId}/relations`,
      { headers: { 'X-API-KEY': apiKey } }
    );
    const relData = await relRes.json();
    relations = relData.items || [];
  } catch {}

  return NextResponse.json({
    title: filmData.nameRu || filmData.nameEn || 'Без названия',
    year: filmData.year,
    poster: filmData.posterUrl || '',
    kinopoiskId,
    iframe: iframeUrl, // готовый iframe с токенами, или null
    relations,
  });
}