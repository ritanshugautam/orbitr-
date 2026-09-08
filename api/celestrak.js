export default async function handler(req, res) {
  try {
    const response = await fetch(
      'https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=JSON',
      {
        headers: {
          'User-Agent': 'Orbitr/1.0 (satellite visualizer; contactritanshu@gmail.com)',
          'Accept': 'application/json',
        },
      }
    )
    if (!response.ok) {
      return res.status(502).json({ error: `CelesTrak returned ${response.status}` })
    }
    const data = await response.json()
    // Cache at CDN edge for 2 hours — respects CelesTrak usage policy
    res.setHeader('Cache-Control', 'public, s-maxage=7200, stale-while-revalidate=3600')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
