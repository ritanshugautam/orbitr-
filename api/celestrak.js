export const config = { runtime: 'edge' }

export default async function handler(req) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 25000)

  try {
    const response = await fetch(
      'https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=JSON',
      {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Orbitr/1.0 (satellite visualizer)',
          'Accept': 'application/json',
        },
      }
    )
    clearTimeout(timeout)

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `CelesTrak returned HTTP ${response.status}` }),
        { status: 502, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    const data = await response.text()
    return new Response(data, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=7200, stale-while-revalidate=3600',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (err) {
    clearTimeout(timeout)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )
  }
}
