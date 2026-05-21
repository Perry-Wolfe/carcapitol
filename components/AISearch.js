'use client'
import { useState, useRef, useEffect } from 'react'
import { Sparkles, Search, Loader2, ArrowRight } from 'lucide-react'

const SUGGESTIONS = [
  'Family SUV under $30K with low miles',
  'Reliable Toyota or Honda for under $20K',
  'Electric car with 200+ mile range',
  'Truck under $40K, 4WD',
  'Luxury sedan with leather, under $35K',
  'First car for my teen under $15K',
]

export default function AISearch({ onParsed, onOpenAuth }) {
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const [focused, setFocused] = useState(false)
  const [placeholderIdx, setPlaceholderIdx] = useState(0)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (focused || q) return
    const id = setInterval(() => setPlaceholderIdx(i => (i + 1) % SUGGESTIONS.length), 3200)
    return () => clearInterval(id)
  }, [focused, q])

  async function submit(text) {
    const query = (text || q).trim()
    if (!query) return
    setBusy(true); setError('')
    try {
      const r = await fetch('/api/ai-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: query }),
      })
      const d = await r.json()
      if (d.filters) {
        onParsed(d.filters, query)
      } else {
        setError('Sorry, I couldn\'t understand that. Try something like "Honda under $20K".')
      }
    } catch (e) {
      // Fallback: regex parse client-side so AI search still works even if API fails
      const filters = clientFallbackParse(query)
      onParsed(filters, query)
    }
    setBusy(false)
  }

  return (
    <div style={{ width: '100%' }}>
      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        background: '#fff',
        borderRadius: 16,
        border: `1.5px solid ${focused ? 'var(--ink)' : 'var(--line)'}`,
        boxShadow: focused ? '0 0 0 4px rgba(11,11,12,.06), var(--shadow-md)' : 'var(--shadow-sm)',
        transition: 'all .2s',
        padding: '4px 6px 4px 18px',
        height: 64,
      }}>
        <Sparkles size={20} color="var(--crimson)" style={{ flexShrink: 0 }} />
        <input
          ref={inputRef}
          value={q}
          onChange={e => setQ(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder={focused || q ? 'Describe the car you want…' : SUGGESTIONS[placeholderIdx]}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            fontSize: 16,
            padding: '0 14px',
            background: 'transparent',
            color: 'var(--ink)',
            fontWeight: 500,
            minWidth: 0,
          }}
        />
        <button
          onClick={() => submit()}
          disabled={busy || !q.trim()}
          style={{
            height: 52,
            padding: '0 22px',
            background: 'var(--ink)',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 600,
            cursor: busy || !q.trim() ? 'not-allowed' : 'pointer',
            opacity: busy || !q.trim() ? .5 : 1,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            flexShrink: 0,
          }}>
          {busy ? <Loader2 size={16} className="spinner" /> : <Search size={16} />}
          <span className="ai-search-label">{busy ? 'Thinking…' : 'Ask AI'}</span>
        </button>
      </div>

      {focused && !q && (
        <div className="fade-up" style={{ marginTop: 14 }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.65)', fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 10 }}>
            Try one of these
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {SUGGESTIONS.slice(0, 4).map(s => (
              <button
                key={s}
                onMouseDown={() => { setQ(s); submit(s) }}
                style={{
                  padding: '8px 14px',
                  background: 'rgba(255,255,255,.12)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,.2)',
                  color: '#fff',
                  borderRadius: 100,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all .15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.2)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.12)' }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div style={{ marginTop: 10, padding: '10px 14px', background: 'rgba(185,28,28,.1)', borderRadius: 10, color: '#fff', fontSize: 13 }}>
          {error}
        </div>
      )}
    </div>
  )
}

/* Client-side fallback parser — works even if AI API is down */
function clientFallbackParse(q) {
  const text = q.toLowerCase()
  const out = {}

  const MAKES = ['toyota','honda','ford','chevy','chevrolet','bmw','tesla','jeep','hyundai','nissan','mercedes','audi','lexus','kia','mazda','subaru','dodge','ram','gmc','cadillac','volkswagen','vw','porsche','volvo','acura','infiniti','mini','jaguar','lincoln','buick','chrysler','mitsubishi']
  for (const m of MAKES) {
    if (text.includes(m)) {
      out.make = m === 'chevy' ? 'Chevrolet' : m === 'vw' ? 'Volkswagen' : m === 'mercedes' ? 'Mercedes-Benz' : m.charAt(0).toUpperCase() + m.slice(1)
      break
    }
  }

  // Price
  const priceUnder = text.match(/under\s*\$?\s*(\d+)\s*(k|thousand)?/i)
  if (priceUnder) {
    const v = parseInt(priceUnder[1])
    out.price_max = String(priceUnder[2] ? v * 1000 : v)
  }
  const priceOver = text.match(/over\s*\$?\s*(\d+)\s*(k|thousand)?/i)
  if (priceOver) {
    const v = parseInt(priceOver[1])
    out.price_min = String(priceOver[2] ? v * 1000 : v)
  }

  // Body type
  if (/\bsuv\b/.test(text)) out.body_type = 'SUV'
  else if (/\btruck\b|\bpickup\b/.test(text)) out.body_type = 'Truck'
  else if (/\bsedan\b/.test(text)) out.body_type = 'Sedan'
  else if (/\bcoupe\b/.test(text)) out.body_type = 'Coupe'
  else if (/\bconvertible\b/.test(text)) out.body_type = 'Convertible'
  else if (/\bvan\b|\bminivan\b/.test(text)) out.body_type = 'Van'
  else if (/\bhatchback\b/.test(text)) out.body_type = 'Hatchback'

  // Fuel
  if (/\belectric\b|\bev\b|\btesla\b/.test(text)) out.fuel_type = 'Electric'
  else if (/\bhybrid\b/.test(text)) out.fuel_type = 'Hybrid'
  else if (/\bdiesel\b/.test(text)) out.fuel_type = 'Diesel'

  // Miles
  const milesUnder = text.match(/under\s*(\d+)\s*(k|thousand)?\s*miles?/i)
  if (milesUnder) {
    const v = parseInt(milesUnder[1])
    out.miles_max = String(milesUnder[2] || v < 1000 ? v * 1000 : v)
  }
  if (/low\s*mile/.test(text) && !out.miles_max) out.miles_max = '50000'

  // Year
  const yearMatch = text.match(/\b(20\d{2})\b/)
  if (yearMatch) out.year_min = yearMatch[1]

  return out
}
