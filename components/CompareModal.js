'use client'
import { X, Gauge, Calendar, Fuel, MapPin, Award, Building2, User2, Check, Minus } from 'lucide-react'

function calcPay(pr, dn, apr, tm) {
  if (!pr || pr <= 0) return null
  const tx = pr * 0.0875, fe = 895, fin = pr + tx + fe - dn
  const mr = apr / 100 / 12
  const mp = apr === 0 ? fin / tm : fin * (mr * Math.pow(1 + mr, tm)) / (Math.pow(1 + mr, tm) - 1)
  return { mp: Math.round(mp), tot: Math.round(mp + 145) }
}

export default function CompareModal({ vehicles, onClose, onRemove, onSelect, rate = 6.99, session }) {
  if (!vehicles || vehicles.length === 0) return null

  /* Build rows comparing the vehicles. Highlight best in green. */
  const rows = [
    { label: 'Price', key: 'price', fmt: v => v.price ? '$' + v.price.toLocaleString() : '—', bestIs: 'low', numeric: v => v.price || Infinity },
    { label: 'Monthly (all-in)', key: 'monthly', fmt: v => { const p = calcPay(v.price, 3000, rate, 72); return p ? `$${p.tot}/mo` : '—' }, bestIs: 'low', numeric: v => { const p = calcPay(v.price, 3000, rate, 72); return p?.tot || Infinity }, locked: !session },
    { label: 'Year', key: 'year', fmt: v => v.year || '—', bestIs: 'high', numeric: v => v.year || 0 },
    { label: 'Mileage', key: 'mileage', fmt: v => v.mileage ? v.mileage.toLocaleString() + ' mi' : '—', bestIs: 'low', numeric: v => v.mileage || Infinity },
    { label: 'Fuel', key: 'fuel_type', fmt: v => v.fuel_type || '—' },
    { label: 'Trans', key: 'transmission', fmt: v => v.transmission || 'Auto' },
    { label: 'Body', key: 'body_type', fmt: v => v.body_type || '—' },
    { label: 'Color', key: 'exterior_color', fmt: v => v.exterior_color || '—' },
    { label: 'Source', key: 'source', fmt: v => v.source === 'facebook' ? 'Facebook' : v.seller_type === 'private' ? 'Private' : 'Dealer' },
    { label: 'Location', key: 'city', fmt: v => v.city ? `${v.city}${v.state ? ', ' + v.state : ''}` : '—' },
  ]

  /* Determine best per row */
  function bestIdx(row) {
    if (!row.bestIs) return -1
    const vals = vehicles.map(row.numeric)
    if (row.bestIs === 'low') return vals.indexOf(Math.min(...vals))
    return vals.indexOf(Math.max(...vals))
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(11,11,12,.65)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, overflow: 'auto',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="compare-modal-content" style={{
        background: 'var(--paper)', borderRadius: 24,
        width: '100%', maxWidth: 1100, maxHeight: 'calc(100vh - 48px)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-xl)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ padding: '22px 28px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
          <div>
            <h2 className="display" style={{ fontSize: 26, fontWeight: 500, letterSpacing: '-.02em', color: 'var(--ink)' }}>Compare {vehicles.length} vehicles</h2>
            <p style={{ fontSize: 13, color: 'var(--mute)', marginTop: 2 }}>Best values highlighted in green</p>
          </div>
          <button onClick={onClose} style={{ background: 'var(--bone)', border: 'none', width: 38, height: 38, borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={18} />
          </button>
        </div>

        {/* Body scroll */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
              <tr>
                <th style={{ position: 'sticky', left: 0, background: 'var(--paper)', zIndex: 2, padding: '20px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--mute)', borderBottom: '1px solid var(--line)', minWidth: 140 }}>Vehicle</th>
                {vehicles.map(v => (
                  <th key={v.id} style={{ padding: '16px', textAlign: 'left', verticalAlign: 'top', minWidth: 200, borderBottom: '1px solid var(--line)' }}>
                    <div style={{ position: 'relative' }}>
                      <button onClick={() => onRemove(v.id)} aria-label="Remove" style={{ position: 'absolute', top: 4, right: 4, width: 26, height: 26, borderRadius: '50%', background: 'rgba(255,255,255,.95)', border: '1px solid var(--line)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                        <X size={13} />
                      </button>
                      <div style={{ background: '#1A1A1D', borderRadius: 12, height: 120, overflow: 'hidden', marginBottom: 10 }}>
                        {v.photo ? (
                          <img src={v.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#3A3A3E', fontSize: 32 }}>🚗</div>
                        )}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.3 }}>
                        {v.year} {v.make} {v.model}
                      </div>
                      {v.trim && <div style={{ fontSize: 12, color: 'var(--mute)', marginTop: 2 }}>{v.trim}</div>}
                      <button onClick={() => onSelect(v)} style={{ marginTop: 10, padding: '7px 12px', background: 'var(--ink)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                        View details
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => {
                const best = bestIdx(row)
                return (
                  <tr key={row.label}>
                    <td style={{ position: 'sticky', left: 0, background: 'var(--paper)', zIndex: 1, padding: '14px 16px', fontSize: 13, fontWeight: 600, color: 'var(--mute)', borderBottom: '1px solid var(--line-2)' }}>
                      {row.label}
                    </td>
                    {vehicles.map((v, i) => {
                      const isBest = i === best && vehicles.length > 1
                      return (
                        <td key={v.id} style={{
                          padding: '14px 16px',
                          fontSize: 14,
                          color: 'var(--ink)',
                          fontWeight: isBest ? 700 : 500,
                          borderBottom: '1px solid var(--line-2)',
                          background: isBest ? 'rgba(46,125,91,.08)' : 'transparent',
                          position: 'relative',
                        }}>
                          {row.locked ? (
                            <span style={{ color: 'var(--mute)', fontStyle: 'italic', fontSize: 13 }}>Sign in to view</span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              {row.fmt(v)}
                              {isBest && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 11, color: 'var(--green)', fontWeight: 700 }}><Check size={11} strokeWidth={3} /> Best</span>}
                            </span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
