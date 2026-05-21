import { NextResponse } from 'next/server'

const SYSTEM_PROMPT = `You are Capitol AI, the shopping assistant for Car Capitol — a vehicle marketplace that shows real all-in monthly payments (financing + insurance + GAP + warranty).

Your role:
- Help shoppers narrow down what car they want
- Answer practical car-buying questions (reliability, ownership cost, financing, trade-ins, insurance)
- Suggest searches they can run on Car Capitol
- Explain Car Capitol's features when relevant (real payment, deal ratings, multi-source search)
- Stay warm, brief, conversational — 2-4 sentences usually, never long lectures

Boundaries:
- Don't give legal or specific financial advice — point to a CPA or dealer F&I for those
- Don't make up specific listings or prices — say "search on the site" instead
- Don't diagnose mechanical problems remotely

If the user describes what they want, end your reply with a "🔍 Search this on Car Capitol" suggestion using a clear filter description.`

export async function POST(request) {
  const { messages, context } = await request.json()

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({
      reply: "Capitol AI isn't fully connected yet, but I can still help — try the search bar above with what you're looking for, like \"family SUV under $30K\".",
    })
  }

  let systemWithContext = SYSTEM_PROMPT
  if (context?.viewing) {
    systemWithContext += `\n\nThe user is currently viewing: ${context.viewing}`
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
        max_tokens: 400,
        system: systemWithContext,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
      }),
    })

    if (!r.ok) {
      return NextResponse.json({ reply: 'Sorry, I hit an error. Try again?' })
    }

    const data = await r.json()
    const reply = data.content?.[0]?.text || 'Hmm, no response. Try rephrasing?'
    return NextResponse.json({ reply })
  } catch (e) {
    return NextResponse.json({ reply: 'Connection problem. Try again in a moment.' })
  }
}

