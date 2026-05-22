import { NextResponse } from 'next/server'

const SYSTEM_PROMPT = `You are a search query parser for Car Capitol, a vehicle marketplace.

Parse the user's natural-language car search into a JSON object with these optional fields:
- make: car manufacturer (e.g. "Toyota", "Honda", "BMW", "Mercedes-Benz", "Tesla")
- model: model name (only if explicitly specified, e.g. "Camry", "F-150")
- year_min: minimum year as 4-digit string
- year_max: maximum year as 4-digit string
- price_min: minimum price in dollars (number as string, no $ or commas)
- price_max: maximum price in dollars (number as string, no $ or commas)
- miles_max: maximum mileage (number as string)
- body_type: one of "Sedan", "SUV", "Truck", "Coupe", "Van", "Wagon", "Convertible", "Hatchback"
- fuel_type: one of "Gasoline", "Electric", "Hybrid", "Diesel"

Rules:
- Output ONLY a JSON object inside <filters>...</filters> tags. No prose, no explanation.
- Convert "$25K" or "25 thousand" to "25000"
- "low miles" = miles_max "50000"
- "new" or "newer" = year_min set to current year - 3
- "family car" → typically SUV or Sedan, prefer SUV
- "reliable" → bias toward Toyota or Honda but only if user names one
- Only include fields explicitly mentioned or strongly implied
- Don't guess too aggressively. Omit fields you're unsure about.

Examples:
"family SUV under 30K" → <filters>{"body_type":"SUV","price_max":"30000"}</filters>
"Toyota Camry low miles" → <filters>{"make":"Toyota","model":"Camry","miles_max":"50000"}</filters>
"electric car with 200 mile range" → <filters>{"fuel_type":"Electric"}</filters>
"2022 or newer truck" → <filters>{"body_type":"Truck","year_min":"2022"}</filters>`

export async function POST(request) {
  const { q } = await request.json()
  if (!q || typeof q !== 'string') {
    return NextResponse.json({ error: 'Missing query' }, { status: 400 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ filters: null, fallback: true })
  }

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: q }],
      }),
    })

    if (!r.ok) {
      return NextResponse.json({ filters: null, error: 'API error' })
    }

    const data = await r.json()
    const text = data.content?.[0]?.text || ''
    const match = text.match(/<filters>([\s\S]*?)<\/filters>/)
    if (!match) return NextResponse.json({ filters: null })

    try {
      const filters = JSON.parse(match[1].trim())
      return NextResponse.json({ filters })
    } catch {
      return NextResponse.json({ filters: null })
    }
  } catch (e) {
    return NextResponse.json({ filters: null, error: String(e) })
  }
}
