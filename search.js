export default async function handler(req, res) {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: 'Введите название' });
  }
  
  try {
    const response = await fetch(`https://torapi.vercel.app/api/search?q=${encodeURIComponent(query)}&provider=all`);
    const data = await response.json();
    const results = data.filter(item => item.magnet);
    res.json(results);
  } catch (error) {
    console.error('Ошибка поиска:', error);
    res.status(500).json({ error: 'Ошибка поиска' });
  }
}