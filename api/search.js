// api/search.js — минимальный прокси
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({ status: 'ok', message: 'Используй iframe.cloud для поиска' });
}
