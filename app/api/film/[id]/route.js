import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'Не указан ID' }, { status: 400 });
  }

  const apiKey = process.env.KINOPOISK_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API ключ не настроен' }, { status: 500 });
  }

  try {
    const filmRes = await fetch(
      `https://kinopoiskapiunofficial.tech/api/v2.2/films/${id}`,
      { headers: { 'X-API-KEY': apiKey } }
    );
    const film = await filmRes.json();
    if (!film || !film.filmId) {
      return NextResponse.json({ error: 'Фильм не найден' }, { status: 404 });
    }

    const kinopoiskId = film.filmId;

    // Получение iframe от Kinobox
    let iframeUrl = null;
    try {
      const kinoboxRes = await fetch(
        `https://kinobox.tv/api/player?kinopoisk_id=${kinopoiskId}&type=movie`
      );
      if (kinoboxRes.ok) {
        const kinoboxData = await kinoboxRes.json();
        iframeUrl = kinoboxData.iframe;
      }
    } catch {}

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
      title: film.nameRu || film.nameEn || 'Без названия',
      year: film.year,
      poster: film.posterUrl || '',
      kinopoiskId,
      iframe: iframeUrl,
      relations,
    });
  } catch {
    return NextResponse.json({ error: 'Ошибка получения фильма' }, { status: 500 });
  }
}