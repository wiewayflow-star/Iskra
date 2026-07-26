export default async function handler(req, res) {
  const query = req.query.q;
  if (!query) return res.json([]);
  
  const response = await fetch(`https://torapi.vercel.app/api/search?q=${query}&provider=all`);
  const data = await response.json();
  res.json(data);
}