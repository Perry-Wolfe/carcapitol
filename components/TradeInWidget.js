'use client'
import { useState } from 'react'
import { ArrowRight, Check, Loader2, Car, DollarSign, Sparkles } from 'lucide-react'

const MAKES = ['Acura','Audi','BMW','Buick','Cadillac','Chevrolet','Chrysler','Dodge','Ford','GMC','Honda','Hyundai','Infiniti','Jaguar','Jeep','Kia','Land Rover','Lexus','Lincoln','Mazda','Mercedes-Benz','Mini','Mitsubishi','Nissan','Porsche','RAM','Subaru','Tesla','Toyota','Volkswagen','Volvo']
const MODELS = {Toyota:['4Runner','Camry','Corolla','Highlander','RAV4','Tacoma','Tundra'],Honda:['Accord','Civic','CR-V','HR-V','Odyssey','Passport','Pilot','Ridgeline'],Ford:['Bronco','Edge','Escape','Explorer','F-150','Maverick','Mustang','Ranger'],Chevrolet:['Blazer','Camaro','Colorado','Equinox','Malibu','Silverado 1500','Tahoe','Traverse'],BMW:['2 Series','3 Series','4 Series','5 Series','X1','X3','X5','X7'],Nissan:['Altima','Frontier','Kicks','Maxima','Murano','Pathfinder','Rogue','Sentra','Titan'],Jeep:['Cherokee','Compass','Gladiator','Grand Cherokee','Renegade','Wrangler'],Hyundai:['Elantra','Kona','Palisade','Santa Fe','Sonata','Tucson'],'Mercedes-Benz':['A-Class','C-Class','E-Class','GLA','GLC','GLE','GLS','S-Class'],Tesla:['Model 3','Model S','Model X','Model Y'],RAM:['1500','2500','3500']}
const CONDITIONS = [
  { key: 'excellent', label: 'Excellent', mult: 1.0, desc: 'Like new, no flaws' },
  { key: 'good', label: 'Good', mult: 0.88, desc: 'Minor wear, well-maintained' },
  { key: 'fair', label: 'Fair', mult: 0.72, desc: 'Visible wear, runs well' },
  { key: 'poor', label: 'Poor', mult: 0.55, desc: 'Mechanical or cosmetic issues' },
]

function estimate(form) {
  // Realistic-feeling estimator based on year/miles/condition
  // Real version would call MarketCheck or KBB API
  if (!form.year || !form.make || !form.miles) return null
  const cy = new Date().getFullYear()
  const age = cy - parseInt(form.year)
  // Base MSRP estimate by make (rough)
  const luxMakes = ['BMW','Mercedes-Benz','Audi','Lexus','Porsche','Cadillac','Land Rover','Jaguar','Lincoln','Infiniti','Acura']
  const truckMakes = ['Ford','RAM','GMC','Chevrolet','Toyota']
  let base = 28000
  if (luxMakes.includes(form.make)) base = 48000
  else if (truckMakes.includes(form.make) && (form.model || '').match(/F-150|Silverado|1500|Tundra|Sierra/i)) base = 42000
  // Depreciation curve
  const depYear = Math.pow(0.85, age) // ~15%/yr
  const milesOver = Math.max(0, parseInt(form.miles) - age * 12000)
  const milesAdj = 1 - (milesOver / 200000) * 0.3
  const cond = CONDITIONS.find(c => c.key === form.condition)?.mult || 0.85
  const tradeIn = Math.round(base * depYear * milesAdj * cond * 0.9) // 90% of retail = trade-in
  const retail = Math.round(tradeIn / 0.85)
  return { low: tradeIn - 800, mid: tradeIn, high: tradeIn + 800, retail }
}

export default function TradeInWidget() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({ year: '', make: '', model: '', miles: '', condition: '' })
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)
  const [email, setEmail] = useState('')

  const yearOpts = Array.from({ length: 26 }, (_, i) => String(new Date().getFullYear() - i))

  function next() {
    setBusy(true)
    setTimeout(() => {
      setResult(estimate(form))
      setBusy(false)
      setStep(4)
    }, 1200)
  }

  function reset() {
    setStep(0); setForm({ year: '', make: '', model: '', miles: '', condition: '' }); setResult(null); setEmail('')
  }

  const canAdvance = [
    () => form.year && form.make,
    () => form.model,
    () => form.miles && +form.miles > 0,
    () => form.condition,
  ]

  return (
    <section style={{ maxWidth: 1240, margin: '0 auto', padding: '120px 24px 0' }}>
      <div style={{
        background: 'linear-gradient(135deg, #FAF8F4 0%, #F5F1EA 100%)',
        borderRadius: 28,
        padding: '56px 48px',
        border: '1px solid var(--line)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative */}
        <div style={{ position: 'absolute', top: -80, right: -80, width: 280, height: 280, background: 'radial-gradient(circle, rgba(184,137,58,.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56, alignItems: 'center', position: 'relative' }} className="tradein-grid">
          {/* Left: pitch */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--crimson)' }}>Trade-in</div>
            <h2 className="display" style={{ fontSize: 'clamp(32px, 4.5vw, 50px)', fontWeight: 500, letterSpacing: '-.025em', color: 'var(--ink)', marginTop: 10, lineHeight: 1.05 }}>
              Sell us your car.<br/>
              <em style={{ fontStyle: 'italic', color: 'var(--crimson)', fontWeight: 400 }}>Real offer in 2 minutes.</em>
            </h2>
            <p style={{ fontSize: 16, color: 'var(--mute)', marginTop: 16, lineHeight: 1.55, maxWidth: 460 }}>
              Skip the haggle. Get an instant cash offer or apply it toward your next car. No obligation, no spam.
            </p>
            <div style={{ display: 'flex', gap: 18, marginTop: 28, flexWrap: 'wrap' }}>
              {['No obligation', 'Cash or trade', 'Good for 7 days'].map(t => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--ink)' }}>
                  <Check size={14} color="var(--green)" strokeWidth={2.5} />
                  {t}
                </div>
              ))}
            </div>
          </div>

          {/* Right: form */}
          <div style={{ background: '#fff', borderRadius: 20, padding: 28, boxShadow: 'var(--shadow-md)', border: '1px solid var(--line)' }}>
            {step < 4 && (
              <>
                <div style={{ display: 'flex', gap: 4, marginBottom: 22 }}>
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= step ? 'var(--crimson)' : 'var(--line)', transition: 'background .3s' }} />
                  ))}
                </div>
                <div style={{ fontSize: 11, color: 'var(--mute)', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase' }}>Step {step + 1} of 4</div>
                <h3 className="display" style={{ fontSize: 24, fontWeight: 500, letterSpacing: '-.02em', color: 'var(--ink)', marginTop: 6, marginBottom: 22 }}>
                  {step === 0 && 'Year and make'}
                  {step === 1 && 'Which model?'}
                  {step === 2 && 'How many miles?'}
                  {step === 3 && 'What\'s the condition?'}
                </h3>

                {step === 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <select className="select" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })}>
                      <option value="">Year</option>
                      {yearOpts.map(y => <option key={y}>{y}</option>)}
                    </select>
                    <select className="select" value={form.make} onChange={e => setForm({ ...form, make: e.target.value, model: '' })}>
                      <option value="">Make</option>
                      {MAKES.map(m => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                )}

                {step === 1 && (
                  <div>
                    <select className="select" value={form.model} onChange={e => setForm({ ...form, model: e.target.value })}>
                      <option value="">{form.make ? `${form.make} models` : 'Pick a make first'}</option>
                      {(MODELS[form.make] || []).map(m => <option key={m}>{m}</option>)}
                      <option value="Other">Other / Not listed</option>
                    </select>
                  </div>
                )}

                {step === 2 && (
                  <input
                    className="input"
                    type="number"
                    placeholder="e.g. 45000"
                    value={form.miles}
                    onChange={e => setForm({ ...form, miles: e.target.value })}
                    style={{ width: '100%' }} />
                )}

                {step === 3 && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {CONDITIONS.map(c => (
                      <button key={c.key} onClick={() => setForm({ ...form, condition: c.key })} style={{
                        textAlign: 'left',
                        padding: '14px 16px',
                        background: form.condition === c.key ? 'var(--ink)' : '#fff',
                        color: form.condition === c.key ? '#fff' : 'var(--ink)',
                        border: `1px solid ${form.condition === c.key ? 'var(--ink)' : 'var(--line)'}`,
                        borderRadius: 12,
                        cursor: 'pointer',
                        transition: 'all .15s',
                      }}>
                        <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-.01em' }}>{c.label}</div>
                        <div style={{ fontSize: 11.5, color: form.condition === c.key ? 'rgba(255,255,255,.65)' : 'var(--mute)', marginTop: 3 }}>{c.desc}</div>
                      </button>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
                  {step > 0 && (
                    <button onClick={() => setStep(step - 1)} className="btn-ghost" style={{ height: 48, padding: '0 18px', fontSize: 14 }}>Back</button>
                  )}
                  <button
                    onClick={() => step === 3 ? next() : setStep(step + 1)}
                    disabled={!canAdvance[step]() || busy}
                    className="btn-crimson"
                    style={{
                      flex: 1, height: 48, fontSize: 14,
                      opacity: !canAdvance[step]() || busy ? .4 : 1,
                      cursor: !canAdvance[step]() || busy ? 'not-allowed' : 'pointer',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}>
                    {busy ? <><Loader2 size={16} className="spinner" /> Calculating…</> : step === 3 ? <>Get My Offer <ArrowRight size={15} /></> : <>Continue <ArrowRight size={15} /></>}
                  </button>
                </div>
              </>
            )}

            {step === 4 && result && (
              <div className="fade-up">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(46,125,91,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Sparkles size={18} color="var(--green)" />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--mute)', fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase' }}>Your estimated offer</div>
                </div>
                <div style={{ background: 'var(--ink)', borderRadius: 16, padding: 24, color: '#fff', marginBottom: 18, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: -50, right: -50, width: 180, height: 180, background: 'radial-gradient(circle, rgba(232,199,122,.2) 0%, transparent 70%)' }} />
                  <div style={{ fontSize: 11, color: 'var(--gold-soft)', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase' }}>{form.year} {form.make} {form.model}</div>
                  <div className="display" style={{ fontSize: 44, fontWeight: 500, letterSpacing: '-.03em', color: '#fff', marginTop: 8, lineHeight: 1 }}>
                    ${result.low.toLocaleString()} – ${result.high.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', marginTop: 8 }}>
                    Based on {parseInt(form.miles).toLocaleString()} mi · {CONDITIONS.find(c => c.key === form.condition)?.label} condition
                  </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', display: 'block', marginBottom: 6 }}>Want a firm offer? Enter your email:</label>
                  <input
                    className="input"
                    type="email"
                    placeholder="you@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    style={{ width: '100%' }} />
                </div>

                <button className="btn-primary" style={{ width: '100%', height: 48, fontSize: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 8 }}>
                  Send Firm Offer <ArrowRight size={15} />
                </button>
                <button onClick={reset} style={{ width: '100%', background: 'none', border: 'none', color: 'var(--mute)', fontSize: 13, fontWeight: 500, cursor: 'pointer', padding: 6 }}>
                  Start over
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
