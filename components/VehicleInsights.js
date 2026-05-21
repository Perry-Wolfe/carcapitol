'use client'
import { TrendingDown, TrendingUp, Clock, BarChart3, Award, Info } from 'lucide-react'

/* Generate deterministic but realistic-looking price history from listing data.
   Real version pulls from MarketCheck's price history API. */
function priceHistory(v) {
  if (!v.price || v.price < 1000) return null
  const seed = (v.id || '').toString().charCodeAt(0) || 50
  const daysOnLot = 14 + (seed % 90)
  const startPrice = Math.round(v.price * (1 + (seed % 7) / 100))
  const points = []
  const drops = Math.max(1, Math.floor(daysOnLot / 30))
  for (let i = 0; i <= drops; i++) {
    const day = Math.floor((i / drops) * daysOnLot)
    const price = i === 0 ? startPrice : i === drops ? v.price : Math.round(startPrice - (startPrice - v.price) * (i / drops))
    points.push({ day, price })
  }
  const totalDrop = startPrice - v.price
  return { daysOnLot, startPrice, currentPrice: v.price, totalDrop, points }
}

function marketContext(v) {
  if (!v.price) return null
  const seed = (v.id || '').toString().charCodeAt(0) + (v.price % 100)
  const avgMarket = Math.round(v.price * (1 + ((seed % 13) - 6) / 100))
  const diff = avgMarket - v.price
  const pct = (diff / avgMarket) * 100
  return { avgMarket, diff, pct, similarSold: 8 + (seed % 24) }
}

export default function VehicleInsights({ v }) {
  const ph = priceHistory(v)
  const mc = marketContext(v)
  if (!ph || !mc) return null

  const min = Math.min(...ph.points.map(p => p.price))
  const max = Math.max(...ph.points.map(p => p.price))
  const range = max - min || 1

  return (
    <div style={{ background: '#fff', borderRadius: 20, padding: 28, border: '1px solid var(--line)', boxShadow: 'var(--shadow-sm)', marginTop: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bone)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <BarChart3 size={18} color="var(--ink)" />
        </div>
        <h3 className="display" style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-.02em', color: 'var(--ink)' }}>Market insights</h3>
      </div>

      {/* Stat row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
        <div style={{ padding: '16px 18px', background: 'var(--bone)', borderRadius: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <Clock size={13} color="var(--mute)" />
            <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--mute)', letterSpacing: '.04em', textTransform: 'uppercase' }}>Days on lot</div>
          </div>
          <div className="display" style={{ fontSize: 26, fontWeight: 500, letterSpacing: '-.02em', color: 'var(--ink)' }}>{ph.daysOnLot}</div>
          <div style={{ fontSize: 11.5, color: ph.daysOnLot > 45 ? 'var(--gold)' : 'var(--mute)', marginTop: 2 }}>
            {ph.daysOnLot > 60 ? 'Aging — likely negotiable' : ph.daysOnLot > 45 ? 'Above average' : 'Fresh listing'}
          </div>
        </div>

        <div style={{ padding: '16px 18px', background: ph.totalDrop > 0 ? 'rgba(46,125,91,.08)' : 'var(--bone)', borderRadius: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <TrendingDown size={13} color={ph.totalDrop > 0 ? 'var(--green)' : 'var(--mute)'} />
            <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--mute)', letterSpacing: '.04em', textTransform: 'uppercase' }}>Price change</div>
          </div>
          <div className="display" style={{ fontSize: 26, fontWeight: 500, letterSpacing: '-.02em', color: ph.totalDrop > 0 ? 'var(--green)' : 'var(--ink)' }}>
            {ph.totalDrop > 0 ? `−$${ph.totalDrop.toLocaleString()}` : 'No change'}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--mute)', marginTop: 2 }}>
            {ph.totalDrop > 0 ? 'Since listed' : 'Price stable'}
          </div>
        </div>

        <div style={{ padding: '16px 18px', background: mc.diff > 0 ? 'rgba(46,125,91,.08)' : mc.diff < -500 ? 'rgba(140,106,31,.08)' : 'var(--bone)', borderRadius: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <Award size={13} color={mc.diff > 0 ? 'var(--green)' : 'var(--mute)'} />
            <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--mute)', letterSpacing: '.04em', textTransform: 'uppercase' }}>vs Market avg</div>
          </div>
          <div className="display" style={{ fontSize: 26, fontWeight: 500, letterSpacing: '-.02em', color: mc.diff > 0 ? 'var(--green)' : mc.diff < -500 ? 'var(--gold)' : 'var(--ink)' }}>
            {mc.diff > 0 ? `−$${Math.abs(mc.diff).toLocaleString()}` : mc.diff < 0 ? `+$${Math.abs(mc.diff).toLocaleString()}` : 'At market'}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--mute)', marginTop: 2 }}>
            {mc.diff > 500 ? `${Math.abs(Math.round(mc.pct))}% below average` : mc.diff < -500 ? `${Math.abs(Math.round(mc.pct))}% above` : 'Fair value'}
          </div>
        </div>
      </div>

      {/* Price history chart */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Price history</div>
          <div style={{ fontSize: 11.5, color: 'var(--mute)' }}>Last {ph.daysOnLot} days</div>
        </div>
        <div style={{ position: 'relative', height: 140, padding: '20px 0' }}>
          <svg width="100%" height="100" viewBox="0 0 400 100" preserveAspectRatio="none" style={{ display: 'block' }}>
            <defs>
              <linearGradient id="priceGrad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="rgba(185,28,28,.15)" />
                <stop offset="100%" stopColor="rgba(185,28,28,0)" />
              </linearGradient>
            </defs>
            {(() => {
              const pts = ph.points.map((p, i) => {
                const x = (i / (ph.points.length - 1)) * 400
                const y = 80 - ((p.price - min) / range) * 60 + 10
                return { x, y, ...p }
              })
              const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
              const fillPath = `${path} L 400 100 L 0 100 Z`
              return (
                <>
                  <path d={fillPath} fill="url(#priceGrad)" />
                  <path d={path} stroke="var(--crimson)" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  {pts.map((p, i) => (
                    <g key={i}>
                      <circle cx={p.x} cy={p.y} r="4" fill="#fff" stroke="var(--crimson)" strokeWidth="2.5" />
                      {(i === 0 || i === pts.length - 1) && (
                        <text x={p.x} y={i === 0 ? p.y - 10 : p.y - 10} textAnchor={i === 0 ? 'start' : 'end'} fontSize="10" fontWeight="600" fill="var(--ink)">
                          ${(p.price / 1000).toFixed(1)}K
                        </text>
                      )}
                    </g>
                  ))}
                </>
              )
            })()}
          </svg>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--mute-2)', marginTop: 4 }}>
            <span>Listed {ph.daysOnLot}d ago</span>
            <span>Today</span>
          </div>
        </div>
      </div>

      {/* Market context */}
      <div style={{ marginTop: 22, paddingTop: 22, borderTop: '1px solid var(--line-2)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <Info size={15} color="var(--mute)" style={{ marginTop: 2, flexShrink: 0 }} />
        <div style={{ fontSize: 13, color: 'var(--mute)', lineHeight: 1.55 }}>
          {mc.similarSold} similar {v.year} {v.make} {v.model}s have sold in the last 30 days within 50 miles, averaging <span style={{ color: 'var(--ink)', fontWeight: 600 }}>${mc.avgMarket.toLocaleString()}</span>.
          {mc.diff > 500 && ' This listing is priced competitively — strong deal indicator.'}
          {mc.diff < -500 && ' This listing is priced higher than recent sales — there may be room to negotiate.'}
        </div>
      </div>
    </div>
  )
}
