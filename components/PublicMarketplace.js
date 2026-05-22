'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Search, SlidersHorizontal, ChevronLeft, ChevronRight, Building2, User2,
  ExternalLink, MapPin, Gauge, Fuel, Calendar, ArrowRight, X, ChevronDown,
  Shield, DollarSign, Lock, Heart, GitCompare, Bookmark, Star, TrendingDown,
  Award, Sparkles, Camera, Phone, Mail, Check, Zap, Car, Bell
} from 'lucide-react'
import AISearch from './AISearch'
import CompareModal from './CompareModal'
import TradeInWidget from './TradeInWidget'
import CapitolAIChat from './CapitolAIChat'
import VehicleInsights from './VehicleInsights'

/* ════════════════════════════════════════════════════════════
   DATA
   ════════════════════════════════════════════════════════════ */
const MAKES = ['Acura','Audi','BMW','Buick','Cadillac','Chevrolet','Chrysler','Dodge','Ford','GMC','Honda','Hyundai','Infiniti','Jaguar','Jeep','Kia','Land Rover','Lexus','Lincoln','Mazda','Mercedes-Benz','Mini','Mitsubishi','Nissan','Porsche','RAM','Subaru','Tesla','Toyota','Volkswagen','Volvo']
const MODELS = {Toyota:['4Runner','Camry','Corolla','Highlander','RAV4','Tacoma','Tundra'],Honda:['Accord','Civic','CR-V','HR-V','Odyssey','Passport','Pilot','Ridgeline'],Ford:['Bronco','Edge','Escape','Explorer','F-150','Maverick','Mustang','Ranger'],Chevrolet:['Blazer','Camaro','Colorado','Equinox','Malibu','Silverado 1500','Tahoe','Traverse'],BMW:['2 Series','3 Series','4 Series','5 Series','X1','X3','X5','X7'],Nissan:['Altima','Frontier','Kicks','Maxima','Murano','Pathfinder','Rogue','Sentra','Titan'],Jeep:['Cherokee','Compass','Gladiator','Grand Cherokee','Renegade','Wrangler'],Hyundai:['Elantra','Kona','Palisade','Santa Fe','Sonata','Tucson'],'Mercedes-Benz':['A-Class','C-Class','E-Class','GLA','GLC','GLE','GLS','S-Class'],Tesla:['Model 3','Model S','Model X','Model Y'],RAM:['1500','2500','3500']}
const BODIES = ['Sedan','SUV','Truck','Coupe','Van','Wagon','Convertible','Hatchback']
const FUELS = ['Gasoline','Electric','Hybrid','Diesel']

const POPULAR_MAKES = ['Toyota','Honda','Ford','Chevrolet','BMW','Tesla','Jeep','Hyundai','Nissan','Mercedes-Benz']

const BODY_TILES = [
  { key: 'SUV', label: 'SUVs', sub: 'Family & adventure', icon: 'suv' },
  { key: 'Truck', label: 'Trucks', sub: 'Work & weekend', icon: 'truck' },
  { key: 'Sedan', label: 'Sedans', sub: 'Daily driving', icon: 'sedan' },
  { key: 'Coupe', label: 'Coupes', sub: 'Sport & style', icon: 'coupe' },
  { key: 'Convertible', label: 'Convertibles', sub: 'Open-air', icon: 'convertible' },
  { key: 'Van', label: 'Vans', sub: 'Space for all', icon: 'van' },
]

const PRICE_TILES = [
  { label: 'Under $15K', max: '15000', icon: '$' },
  { label: '$15K–$25K', min: '15000', max: '25000', icon: '$$' },
  { label: '$25K–$40K', min: '25000', max: '40000', icon: '$$$' },
  { label: 'Luxury $40K+', min: '40000', icon: '◆' },
]

/* ════════════════════════════════════════════════════════════
   HELPERS
   ════════════════════════════════════════════════════════════ */
function calcPay(pr, dn, apr, tm) {
  const tx = pr * 0.0875, fe = 895, fin = pr + tx + fe - dn
  const mr = apr / 100 / 12
  const mp = apr === 0 ? fin / tm : fin * (mr * Math.pow(1 + mr, tm)) / (Math.pow(1 + mr, tm) - 1)
  return { mp: Math.round(mp), fin: Math.round(fin), tot: Math.round(mp + 145) }
}

/* Deal rating from MarketCheck-ish heuristic */
function dealRating(v) {
  // Use price vs avg if we had it; for now use a stable hash to demo
  if (!v.price || v.price < 1000) return null
  const seed = (v.id || '').toString().charCodeAt(0) + (v.price % 100)
  const r = seed % 10
  if (r < 3) return { kind: 'great', label: 'Great Deal', save: 1200 + (seed % 800) }
  if (r < 6) return { kind: 'good', label: 'Good Deal', save: 500 + (seed % 600) }
  if (r < 8) return { kind: 'fair', label: 'Fair Deal' }
  return null
}

/* ════════════════════════════════════════════════════════════
   SVG ICONS — body type silhouettes
   ════════════════════════════════════════════════════════════ */
const BodyIcon = ({ kind, size = 64 }) => {
  const c = '#0B0B0C'
  if (kind === 'suv') return (
    <svg width={size} height={size * 0.55} viewBox="0 0 120 66" fill="none">
      <path d="M8 48 L12 32 Q15 22 24 20 L42 18 Q48 12 58 12 L78 12 Q88 12 96 22 L108 28 Q116 30 116 38 L116 48" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M8 48 L116 48" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="32" cy="52" r="8" fill="#fff" stroke={c} strokeWidth="2.5"/>
      <circle cx="92" cy="52" r="8" fill="#fff" stroke={c} strokeWidth="2.5"/>
      <path d="M44 20 L44 32 L62 32 L62 20 M64 20 L64 32 L86 32 L92 22" stroke={c} strokeWidth="1.5" fill="none"/>
    </svg>
  )
  if (kind === 'truck') return (
    <svg width={size} height={size * 0.55} viewBox="0 0 120 66" fill="none">
      <path d="M8 48 L12 36 Q14 26 22 24 L44 22 Q48 14 56 14 L72 14 Q78 14 82 22 L82 38 L116 38 L116 48" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M8 48 L116 48" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M82 38 L82 48" stroke={c} strokeWidth="2.5"/>
      <circle cx="32" cy="52" r="8" fill="#fff" stroke={c} strokeWidth="2.5"/>
      <circle cx="96" cy="52" r="8" fill="#fff" stroke={c} strokeWidth="2.5"/>
      <path d="M46 22 L46 34 L72 34 L72 22" stroke={c} strokeWidth="1.5" fill="none"/>
    </svg>
  )
  if (kind === 'sedan') return (
    <svg width={size} height={size * 0.5} viewBox="0 0 120 60" fill="none">
      <path d="M6 44 L10 36 Q14 28 24 26 L36 22 Q42 14 54 14 L76 14 Q86 14 94 24 L106 30 Q114 32 114 40 L114 44" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M6 44 L114 44" stroke={c} strokeWidth="2.5"/>
      <circle cx="32" cy="48" r="7" fill="#fff" stroke={c} strokeWidth="2.5"/>
      <circle cx="90" cy="48" r="7" fill="#fff" stroke={c} strokeWidth="2.5"/>
      <path d="M40 22 Q44 16 54 16 L74 16 Q82 16 88 24 L88 30 L40 30 Z" stroke={c} strokeWidth="1.5" fill="none"/>
    </svg>
  )
  if (kind === 'coupe') return (
    <svg width={size} height={size * 0.45} viewBox="0 0 120 54" fill="none">
      <path d="M6 40 L12 32 Q18 22 30 22 Q40 12 56 12 L72 12 Q86 14 96 24 L108 28 Q114 30 114 38 L114 40" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M6 40 L114 40" stroke={c} strokeWidth="2.5"/>
      <circle cx="30" cy="44" r="6.5" fill="#fff" stroke={c} strokeWidth="2.5"/>
      <circle cx="92" cy="44" r="6.5" fill="#fff" stroke={c} strokeWidth="2.5"/>
      <path d="M32 22 Q40 14 56 14 L72 14 Q82 16 90 26" stroke={c} strokeWidth="1.5" fill="none"/>
    </svg>
  )
  if (kind === 'convertible') return (
    <svg width={size} height={size * 0.45} viewBox="0 0 120 54" fill="none">
      <path d="M6 40 L12 32 Q18 24 32 24 L60 22 Q80 22 96 26 L108 30 Q114 32 114 38 L114 40" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M6 40 L114 40" stroke={c} strokeWidth="2.5"/>
      <circle cx="30" cy="44" r="6.5" fill="#fff" stroke={c} strokeWidth="2.5"/>
      <circle cx="92" cy="44" r="6.5" fill="#fff" stroke={c} strokeWidth="2.5"/>
      <path d="M32 24 L88 24" stroke={c} strokeWidth="1.5" strokeDasharray="2 3"/>
    </svg>
  )
  if (kind === 'van') return (
    <svg width={size} height={size * 0.55} viewBox="0 0 120 66" fill="none">
      <path d="M8 48 L12 30 Q14 18 26 16 L88 16 Q102 16 108 24 L116 32 L116 48" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M8 48 L116 48" stroke={c} strokeWidth="2.5"/>
      <circle cx="32" cy="52" r="8" fill="#fff" stroke={c} strokeWidth="2.5"/>
      <circle cx="96" cy="52" r="8" fill="#fff" stroke={c} strokeWidth="2.5"/>
      <path d="M28 20 L28 32 L64 32 L64 20 M68 20 L68 32 L96 32" stroke={c} strokeWidth="1.5" fill="none"/>
    </svg>
  )
  return null
}

/* Logo */
function Logo({ sz = 24, mono }) {
  const c = mono ? 'currentColor' : '#B91C1C'
  return (
    <svg width={sz} height={sz} viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="38" stroke={c} strokeWidth="7" strokeLinecap="round" strokeDasharray="200" strokeDashoffset="40"/>
      <circle cx="50" cy="50" r="24" stroke={c} strokeWidth="6" strokeLinecap="round" strokeDasharray="130" strokeDashoffset="30"/>
    </svg>
  )
}

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════════════ */
export default function PublicMarketplace({ session, profile, onOpenAuth, onOpenPortal, onLogout }) {
  const [listings, setListings] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [sel, setSel] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [tab, setTab] = useState('all')
  const [hasSearched, setHasSearched] = useState(false)
  const [saved, setSaved] = useState(new Set())
  const [compare, setCompare] = useState([])
  const [showCompare, setShowCompare] = useState(false)
  const [savedSearches, setSavedSearches] = useState([])
  const [sort, setSort] = useState('price_asc')
  const [aiQuery, setAiQuery] = useState('')
  const resultsRef = useRef(null)
  const [f, setF] = useState({ make:'', model:'', year_min:'', year_max:'', price_min:'', price_max:'', miles_max:'', body_type:'', fuel_type:'', zip:'90001', radius:'50' })

  const rate = profile?.credit_score ? (profile.credit_score > 720 ? 4.99 : profile.credit_score > 680 ? 5.99 : 7.99) : 6.99
  const PER_PAGE = 24

  const doSearch = useCallback(async (pg, overrideTab, overrideFilters) => {
    setLoading(true); setPage(pg); setSel(null); setHasSearched(true)
    const filters = overrideFilters || f
    const p = new URLSearchParams()
    Object.entries(filters).forEach(([k,v]) => { if (v) p.set(k, v) })
    p.set('rows', PER_PAGE.toString())
    p.set('start', (pg * PER_PAGE).toString())
    const [sb, so] = sort.split('_')
    p.set('sort_by', sb === 'price' ? 'price' : sb === 'miles' ? 'miles' : sb === 'year' ? 'year' : 'price')
    p.set('sort_order', so || 'asc')
    const useTab = overrideTab || tab
    p.set('type', useTab === 'private' ? 'fsbo' : useTab)
    try {
      const r = await fetch('/api/search?' + p)
      const d = await r.json()
      setListings(d.listings || [])
      setTotal(d.total || 0)
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
    } catch (e) {
      console.error(e); setListings([])
    }
    setLoading(false)
  }, [f, tab, sort])

  function up(k, v) { setF(prev => ({ ...prev, [k]: v })) }

  function quickSearch(updates) {
    const newF = { ...f, ...updates }
    setF(newF)
    doSearch(0, null, newF)
  }

  function toggleSaved(id) {
    setSaved(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  function toggleCompare(v) {
    setCompare(prev => {
      const idx = prev.findIndex(x => x.id === v.id)
      if (idx >= 0) return prev.filter(x => x.id !== v.id)
      if (prev.length >= 4) return prev
      return [...prev, v]
    })
  }

  function handleAIParse(filters, originalQuery) {
    // When AI returns filters, RESET filters first so previous selections don't bleed through,
    // but keep zip and radius (location is sticky).
    const newF = {
      make: '', model: '', year_min: '', year_max: '',
      price_min: '', price_max: '', miles_max: '',
      body_type: '', fuel_type: '',
      zip: f.zip, radius: f.radius,
      ...filters,
    }
    setF(newF)
    setAiQuery(originalQuery)
    doSearch(0, null, newF)
  }

  function handleAIChatSearch(text) {
    fetch('/api/ai-parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: text }),
    }).then(r => r.json()).then(d => {
      if (d.filters) handleAIParse(d.filters, text)
    }).catch(() => {})
  }

  function saveCurrentSearch() {
    const label = [f.year_min && `${f.year_min}+`, f.make, f.model, f.body_type, f.price_max && `<$${(+f.price_max/1000).toFixed(0)}K`].filter(Boolean).join(' ') || 'All vehicles'
    setSavedSearches(prev => prev.find(s => s.label === label) ? prev : [...prev, { label, filters: { ...f }, id: Date.now() }])
  }

  const modelOpts = f.make && MODELS[f.make] ? MODELS[f.make] : []

  /* ═══ DETAIL VIEW ═══ */
  if (sel) {
    return (
      <>
        <DetailView v={sel} session={session} profile={profile} rate={rate}
          saved={saved} toggleSaved={toggleSaved}
          onBack={() => setSel(null)} onOpenAuth={onOpenAuth} onOpenPortal={onOpenPortal} onLogout={onLogout}
          header={<Header session={session} profile={profile} onOpenAuth={onOpenAuth} onOpenPortal={onOpenPortal} onLogout={onLogout} />}/>
        <CapitolAIChat
          context={{ viewing: `${sel.year} ${sel.make} ${sel.model} priced at $${(sel.price||0).toLocaleString()}` }}
          onRunSearch={handleAIChatSearch}
        />
      </>
    )
  }

  /* ═══ LANDING + SEARCH RESULTS ═══ */
  return (
    <div className="paper-grain" style={{ minHeight: '100vh', position: 'relative' }}>
      <Header session={session} profile={profile} onOpenAuth={onOpenAuth} onOpenPortal={onOpenPortal} onLogout={onLogout} />

      {/* ═══ HERO ═══ */}
      {!hasSearched && (
        <Hero
          f={f} up={up} setF={setF}
          modelOpts={modelOpts}
          showFilters={showFilters} setShowFilters={setShowFilters}
          doSearch={() => doSearch(0)}
          onAIParse={handleAIParse}
          session={session}
          onOpenAuth={onOpenAuth}
        />
      )}

      {/* ═══ COMPACT SEARCH BAR (after search) ═══ */}
      {hasSearched && (
        <CompactSearch
          f={f} up={up}
          modelOpts={modelOpts}
          showFilters={showFilters} setShowFilters={setShowFilters}
          doSearch={() => doSearch(0)}
          onAIParse={handleAIParse}
        />
      )}

      {/* ═══ BODY TYPE TILES ═══ */}
      {!hasSearched && (
        <section style={{ maxWidth: 1240, margin: '0 auto', padding: '80px 24px 0', position: 'relative', zIndex: 2 }}>
          <SectionHeader
            eyebrow="Shop by style"
            title="Find the body that fits your life"
            sub="From daily commuters to weekend warriors."
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14, marginTop: 32 }}>
            {BODY_TILES.map((b, i) => (
              <button key={b.key} className="cat-tile fade-up" style={{ animationDelay: `${i * 40}ms`, background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '24px 18px 22px', cursor: 'pointer', textAlign: 'left', boxShadow: 'var(--shadow-sm)' }}
                onClick={() => quickSearch({ body_type: b.key })}>
                <div className="cat-tile-icon" style={{ marginBottom: 14 }}>
                  <BodyIcon kind={b.icon} size={72} />
                </div>
                <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-.02em' }}>{b.label}</div>
                <div style={{ fontSize: 12, color: 'var(--mute)', marginTop: 2 }}>{b.sub}</div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ═══ POPULAR MAKES ═══ */}
      {!hasSearched && (
        <section style={{ maxWidth: 1240, margin: '0 auto', padding: '64px 24px 0' }}>
          <SectionHeader eyebrow="Popular brands" title="Browse the names you know" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginTop: 28 }}>
            {POPULAR_MAKES.map(m => (
              <button key={m} className="make-tile" style={{ height: 64, borderRadius: 12, border: '1px solid var(--line)', background: '#fff', color: 'var(--ink)', fontSize: 14, fontWeight: 600, letterSpacing: '-.01em', cursor: 'pointer' }} onClick={() => quickSearch({ make: m, model: '' })}>
                {m}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ═══ SHOP BY PRICE ═══ */}
      {!hasSearched && (
        <section style={{ maxWidth: 1240, margin: '0 auto', padding: '64px 24px 0' }}>
          <SectionHeader eyebrow="By your budget" title="Shop by price range" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginTop: 28 }}>
            {PRICE_TILES.map((t, i) => (
              <button key={t.label} className="cat-tile" style={{ background: i === 3 ? 'var(--ink)' : '#fff', color: i === 3 ? 'var(--paper)' : 'var(--ink)', border: `1px solid ${i === 3 ? 'var(--ink)' : 'var(--line)'}`, borderRadius: 14, padding: '28px 22px', cursor: 'pointer', textAlign: 'left', boxShadow: 'var(--shadow-sm)' }}
                onClick={() => quickSearch({ price_min: t.min || '', price_max: t.max || '' })}>
                <div className="display" style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-.03em', color: i === 3 ? 'var(--gold-soft)' : 'var(--crimson)', marginBottom: 8 }}>{t.icon}</div>
                <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-.02em' }}>{t.label}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, marginTop: 10, color: i === 3 ? 'var(--gold-soft)' : 'var(--mute)' }}>
                  Browse <ArrowRight size={13} />
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ═══ VALUE PROPS ═══ */}
      {!hasSearched && <ValueProps onOpenAuth={onOpenAuth} session={session} />}

      {/* ═══ TRADE-IN WIDGET ═══ */}
      {!hasSearched && <TradeInWidget />}

      {/* ═══ HOW IT WORKS ═══ */}
      {!hasSearched && <HowItWorks />}

      {/* ═══ RESULTS ═══ */}
      <div ref={resultsRef} />
      {hasSearched && (
        <section style={{ maxWidth: 1240, margin: '0 auto', padding: '24px 24px 80px' }}>
          {/* Filter chips */}
          <FilterChips f={f} setF={setF} onChange={() => doSearch(0)} />

          {/* Source tabs + sort + count */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[['all','All sources'],['dealer','Dealers'],['private','Private'],['facebook','Facebook']].map(([k,l]) => (
                <button key={k} className={`tab-pill ${tab === k ? 'active' : ''}`} onClick={() => { setTab(k); setTimeout(() => doSearch(0, k), 50) }}>{l}</button>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, color: 'var(--mute)', fontWeight: 500 }}>
                {loading ? 'Searching…' : <><span style={{ color: 'var(--ink)', fontWeight: 700 }}>{total.toLocaleString()}</span> vehicles</>}
              </span>
              <button onClick={saveCurrentSearch} className="btn-ghost" style={{ height: 38, padding: '0 14px', fontSize: 12.5, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Bell size={13} /> Save search
              </button>
              <select className="select" style={{ height: 38, fontSize: 13 }} value={sort} onChange={e => { setSort(e.target.value); setTimeout(() => doSearch(0), 50) }}>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="miles_asc">Mileage: Low to High</option>
                <option value="year_desc">Year: Newest First</option>
                <option value="year_asc">Year: Oldest First</option>
              </select>
            </div>
          </div>

          {/* Saved searches strip */}
          {savedSearches.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18, padding: '12px 14px', background: 'var(--bone)', borderRadius: 12 }}>
              <span style={{ fontSize: 11.5, color: 'var(--mute)', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', alignSelf: 'center' }}>
                <Bell size={12} style={{ verticalAlign: -1, marginRight: 4 }} /> Alerts on
              </span>
              {savedSearches.map(s => (
                <button key={s.id} onClick={() => { setF(s.filters); setTimeout(() => doSearch(0), 50) }} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 100, background: '#fff', border: '1px solid var(--line)', fontSize: 12, fontWeight: 500, color: 'var(--ink)', cursor: 'pointer' }}>
                  {s.label}
                  <X size={11} color="var(--mute)" onClick={e => { e.stopPropagation(); setSavedSearches(prev => prev.filter(x => x.id !== s.id)) }} />
                </button>
              ))}
            </div>
          )}

          {/* Grid */}
          {loading ? (
            <SkeletonGrid />
          ) : listings.length === 0 ? (
            <EmptyState />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 20 }}>
              {listings.map((v, i) => (
                <VehicleCard
                  key={v.id || i}
                  v={v}
                  i={i}
                  pm={v.price > 0 ? calcPay(v.price, 3000, rate, 72) : null}
                  session={session}
                  saved={saved.has(v.id)}
                  inCompare={!!compare.find(x => x.id === v.id)}
                  onClick={() => setSel(v)}
                  onSave={e => { e.stopPropagation(); toggleSaved(v.id) }}
                  onCompare={e => { e.stopPropagation(); toggleCompare(v) }}
                  onOpenAuth={onOpenAuth}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && listings.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 40 }}>
              <button className="btn-ghost" disabled={page === 0} style={{ height: 40, padding: '0 16px', fontSize: 13, opacity: page === 0 ? .4 : 1, cursor: page === 0 ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }} onClick={() => doSearch(page - 1)}>
                <ChevronLeft size={15} /> Previous
              </button>
              <span style={{ fontSize: 13, color: 'var(--mute)', alignSelf: 'center', padding: '0 12px', fontWeight: 500 }}>
                Page {page + 1} of {Math.max(1, Math.ceil(total / PER_PAGE))}
              </span>
              <button className="btn-ghost" disabled={(page + 1) * PER_PAGE >= total} style={{ height: 40, padding: '0 16px', fontSize: 13, opacity: (page + 1) * PER_PAGE >= total ? .4 : 1, cursor: (page + 1) * PER_PAGE >= total ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }} onClick={() => doSearch(page + 1)}>
                Next <ChevronRight size={15} />
              </button>
            </div>
          )}
        </section>
      )}

      <Footer />

      {/* Compare tray */}
      {compare.length > 0 && (
        <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: 'var(--ink)', color: 'var(--paper)', borderRadius: 14, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: 'var(--shadow-xl)', zIndex: 80, maxWidth: 'calc(100vw - 32px)' }}>
          <GitCompare size={16} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>{compare.length} to compare</span>
          <button onClick={() => setCompare([])} style={{ background: 'transparent', border: 'none', color: 'var(--mute-2)', cursor: 'pointer', fontSize: 12 }}>Clear</button>
          <button onClick={() => setShowCompare(true)} className="btn-crimson" style={{ height: 32, padding: '0 14px', fontSize: 12 }}>Compare →</button>
        </div>
      )}

      {/* Compare modal */}
      {showCompare && (
        <CompareModal
          vehicles={compare}
          rate={rate}
          session={session}
          onClose={() => setShowCompare(false)}
          onRemove={id => setCompare(prev => prev.filter(x => x.id !== id))}
          onSelect={v => { setShowCompare(false); setSel(v) }}
        />
      )}

      {/* Floating AI chat */}
      <CapitolAIChat
        context={{ viewing: hasSearched ? `search results for "${aiQuery || [f.make, f.model, f.body_type].filter(Boolean).join(' ') || 'all vehicles'}"` : 'the homepage' }}
        onRunSearch={handleAIChatSearch}
      />
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   HEADER
   ════════════════════════════════════════════════════════════ */
function Header({ session, profile, onOpenAuth, onOpenPortal, onLogout }) {
  return (
    <header style={{ background: 'rgba(250,248,244,.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderBottom: '1px solid var(--line-2)', position: 'sticky', top: 0, zIndex: 50 }}>
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <Logo sz={24} />
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
            <span className="display" style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-.02em', color: 'var(--ink)' }}>Car</span>
            <span className="display" style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-.02em', color: 'var(--crimson)' }}>Capitol</span>
          </div>
        </a>
        <nav style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
          <a href="#" style={{ fontSize: 13, color: 'var(--ink)', textDecoration: 'none', fontWeight: 500 }}>Buy</a>
          <a href="#" style={{ fontSize: 13, color: 'var(--ink)', textDecoration: 'none', fontWeight: 500 }}>Sell</a>
          <a href="#" style={{ fontSize: 13, color: 'var(--ink)', textDecoration: 'none', fontWeight: 500 }}>Finance</a>
          <a href="#" style={{ fontSize: 13, color: 'var(--ink)', textDecoration: 'none', fontWeight: 500 }}>Research</a>
        </nav>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {session && profile ? (
            <>
              <span style={{ fontSize: 12, color: 'var(--mute)' }}>{profile.full_name || profile.email}</span>
              <button className="btn-primary" style={{ height: 36, padding: '0 14px', fontSize: 13 }} onClick={onOpenPortal}>Dashboard</button>
              <button className="btn-ghost" style={{ height: 36, padding: '0 12px', fontSize: 12 }} onClick={onLogout}>Sign Out</button>
            </>
          ) : (
            <>
              <button className="btn-ghost" style={{ height: 36, padding: '0 14px', fontSize: 13 }} onClick={() => onOpenAuth('login')}>Sign In</button>
              <button className="btn-crimson" style={{ height: 36, padding: '0 16px', fontSize: 13 }} onClick={() => onOpenAuth('reg')}>Get Started</button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

/* ════════════════════════════════════════════════════════════
   HERO
   ════════════════════════════════════════════════════════════ */
function Hero({ f, up, setF, modelOpts, showFilters, setShowFilters, doSearch, onAIParse, session, onOpenAuth }) {
  return (
    <section style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Background image — sweeping editorial automotive photo */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <img
          src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=2400&q=80"
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 60%' }}
        />
        <div className="hero-veil" style={{ position: 'absolute', inset: 0 }} />
      </div>

      <div style={{ position: 'relative', maxWidth: 1240, margin: '0 auto', padding: '90px 24px 140px', zIndex: 2 }}>
        {/* Eyebrow */}
        <div className="fade-up" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 14px', borderRadius: 100, background: 'rgba(255,255,255,.12)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,.18)', marginBottom: 28 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#5BE584', animation: 'pulse-dot 2s ease-in-out infinite' }}/>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#fff', letterSpacing: '.06em', textTransform: 'uppercase' }}>4.2M+ vehicles live now</span>
        </div>

        {/* Headline */}
        <h1 className="display fade-up" style={{ animationDelay: '60ms', fontSize: 'clamp(48px, 7vw, 84px)', lineHeight: .98, letterSpacing: '-.035em', fontWeight: 500, color: '#fff', maxWidth: 880, marginBottom: 20 }}>
          Every car.<br/>
          <em style={{ fontStyle: 'italic', color: '#E8C77A', fontWeight: 400 }}>One real price.</em>
        </h1>
        <p className="fade-up" style={{ animationDelay: '120ms', fontSize: 18, lineHeight: 1.55, color: 'rgba(255,255,255,.86)', maxWidth: 560, marginBottom: 40, fontWeight: 400 }}>
          Search dealers, private sellers, and Facebook Marketplace in one place. See your actual monthly payment — financing, insurance, GAP, and warranty included — on every listing.
        </p>

        {/* AI Search */}
        <div className="fade-up" style={{ animationDelay: '160ms', maxWidth: 980, marginBottom: 16 }}>
          <AISearch onParsed={onAIParse} onOpenAuth={onOpenAuth} />
        </div>

        {/* Search divider */}
        <div className="fade-up" style={{ animationDelay: '170ms', display: 'flex', alignItems: 'center', gap: 14, maxWidth: 980, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.15)' }} />
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,.55)', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase' }}>or filter manually</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.15)' }} />
        </div>

        {/* Search card */}
        <div className="fade-up search-card" style={{ animationDelay: '180ms', background: 'rgba(250,248,244,.98)', backdropFilter: 'blur(20px)', borderRadius: 20, padding: 18, border: '1px solid rgba(255,255,255,.3)', boxShadow: 'var(--shadow-xl)', maxWidth: 980 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 110px 130px auto', gap: 10, alignItems: 'end' }}>
            <Sel label="Make" value={f.make} onChange={v => { up('make', v); up('model', '') }} opts={MAKES} ph="Any make" />
            <Sel label="Model" value={f.model} onChange={v => up('model', v)} opts={modelOpts} ph={f.make ? 'Any model' : 'Pick a make'} disabled={!f.make} />
            <Inp label="ZIP" value={f.zip} onChange={v => up('zip', v)} ph="ZIP" />
            <Sel label="Distance" value={f.radius} onChange={v => up('radius', v)} opts={['25','50','100','200','500']} labels={['25 mi','50 mi','100 mi','200 mi','500 mi']} />
            <button className="btn-crimson" style={{ height: 48, padding: '0 28px', fontSize: 15, display: 'inline-flex', alignItems: 'center', gap: 8 }} onClick={doSearch}>
              <Search size={17} /> Search
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--line-2)' }}>
            <button onClick={() => setShowFilters(!showFilters)} style={{ background: 'none', border: 'none', color: 'var(--ink)', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <SlidersHorizontal size={14} /> {showFilters ? 'Hide' : 'Show'} advanced filters
              <ChevronDown size={14} style={{ transform: showFilters ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}/>
            </button>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12, color: 'var(--mute)' }}>
              <Lock size={12} /> Secure search • No spam
            </div>
          </div>
          {showFilters && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--line-2)' }}>
              <Sel label="Min Year" value={f.year_min} onChange={v => up('year_min', v)} opts={Array.from({length: 16}, (_, i) => String(2010 + i))} ph="Any"/>
              <Sel label="Max Year" value={f.year_max} onChange={v => up('year_max', v)} opts={Array.from({length: 16}, (_, i) => String(2010 + i))} ph="Any"/>
              <Sel label="Min Price" value={f.price_min} onChange={v => up('price_min', v)} opts={['5000','10000','15000','20000','25000','30000']} labels={['$5K','$10K','$15K','$20K','$25K','$30K']} ph="No min"/>
              <Sel label="Max Price" value={f.price_max} onChange={v => up('price_max', v)} opts={['15000','20000','25000','30000','40000','50000','75000','100000']} labels={['$15K','$20K','$25K','$30K','$40K','$50K','$75K','$100K']} ph="No max"/>
              <Sel label="Max Miles" value={f.miles_max} onChange={v => up('miles_max', v)} opts={['25000','50000','75000','100000','150000']} labels={['25K','50K','75K','100K','150K']} ph="Any"/>
              <Sel label="Body" value={f.body_type} onChange={v => up('body_type', v)} opts={BODIES} ph="All"/>
              <Sel label="Fuel" value={f.fuel_type} onChange={v => up('fuel_type', v)} opts={FUELS} ph="All"/>
            </div>
          )}
        </div>

        {/* Trust strip */}
        <div className="fade-up" style={{ animationDelay: '240ms', display: 'flex', gap: 32, marginTop: 36, flexWrap: 'wrap' }}>
          {[
            ['4.2M+', 'Listings'],
            ['12,400+', 'Dealers'],
            ['$0', 'Sign-up fee'],
            ['Real-time', 'Price drops'],
          ].map(([n, l]) => (
            <div key={l}>
              <div className="display" style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-.02em', color: '#fff' }}>{n}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.7)', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 500, marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ════════════════════════════════════════════════════════════
   COMPACT SEARCH (after first search)
   ════════════════════════════════════════════════════════════ */
function CompactSearch({ f, up, modelOpts, showFilters, setShowFilters, doSearch, onAIParse }) {
  return (
    <div style={{ background: '#fff', borderBottom: '1px solid var(--line-2)', boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '18px 24px' }}>
        {/* AI Search at top */}
        {onAIParse && (
          <div style={{ marginBottom: 14 }}>
            <CompactAISearch onParsed={onAIParse} />
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px 120px auto auto', gap: 10, alignItems: 'end' }}>
          <Sel label="Make" value={f.make} onChange={v => { up('make', v); up('model', '') }} opts={MAKES} ph="Any make"/>
          <Sel label="Model" value={f.model} onChange={v => up('model', v)} opts={modelOpts} ph={f.make ? 'Any model' : 'Pick make'} disabled={!f.make}/>
          <Inp label="ZIP" value={f.zip} onChange={v => up('zip', v)} ph="ZIP"/>
          <Sel label="Distance" value={f.radius} onChange={v => up('radius', v)} opts={['25','50','100','200','500']} labels={['25 mi','50 mi','100 mi','200 mi','500 mi']}/>
          <button className="btn-ghost" style={{ height: 48, padding: '0 14px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={() => setShowFilters(!showFilters)}>
            <SlidersHorizontal size={14}/> Filters
          </button>
          <button className="btn-crimson" style={{ height: 48, padding: '0 22px', fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={doSearch}>
            <Search size={15}/> Search
          </button>
        </div>
        {showFilters && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--line-2)' }}>
            <Sel label="Min Year" value={f.year_min} onChange={v => up('year_min', v)} opts={Array.from({length: 16}, (_, i) => String(2010 + i))} ph="Any"/>
            <Sel label="Max Year" value={f.year_max} onChange={v => up('year_max', v)} opts={Array.from({length: 16}, (_, i) => String(2010 + i))} ph="Any"/>
            <Sel label="Min Price" value={f.price_min} onChange={v => up('price_min', v)} opts={['5000','10000','15000','20000','25000','30000']} labels={['$5K','$10K','$15K','$20K','$25K','$30K']} ph="No min"/>
            <Sel label="Max Price" value={f.price_max} onChange={v => up('price_max', v)} opts={['15000','20000','25000','30000','40000','50000','75000','100000']} labels={['$15K','$20K','$25K','$30K','$40K','$50K','$75K','$100K']} ph="No max"/>
            <Sel label="Max Miles" value={f.miles_max} onChange={v => up('miles_max', v)} opts={['25000','50000','75000','100000','150000']} labels={['25K','50K','75K','100K','150K']} ph="Any"/>
            <Sel label="Body" value={f.body_type} onChange={v => up('body_type', v)} opts={BODIES} ph="All"/>
            <Sel label="Fuel" value={f.fuel_type} onChange={v => up('fuel_type', v)} opts={FUELS} ph="All"/>
          </div>
        )}
      </div>
    </div>
  )
}

/* Compact AI search bar - smaller version for results page */
function CompactAISearch({ onParsed }) {
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit() {
    const query = q.trim()
    if (!query || busy) return
    setBusy(true)
    try {
      const r = await fetch('/api/ai-parse', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ q: query }) })
      const d = await r.json()
      if (d.filters) onParsed(d.filters, query)
    } catch {}
    setBusy(false); setQ('')
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bone)', borderRadius: 12, padding: '4px 4px 4px 14px', height: 48, border: '1px solid var(--line)' }}>
      <Sparkles size={16} color="var(--crimson)" style={{ flexShrink: 0 }} />
      <input
        value={q}
        onChange={e => setQ(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && submit()}
        placeholder="Or describe what you want — &quot;reliable SUV under $25K with low miles&quot;…"
        style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', padding: '0 12px', fontSize: 14, color: 'var(--ink)', minWidth: 0 }}
      />
      <button onClick={submit} disabled={!q.trim() || busy} style={{ height: 40, padding: '0 16px', background: 'var(--ink)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: !q.trim() || busy ? 'not-allowed' : 'pointer', opacity: !q.trim() || busy ? .4 : 1, display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        {busy ? 'Thinking…' : 'Ask AI'}
      </button>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   SECTION HEADER
   ════════════════════════════════════════════════════════════ */
function SectionHeader({ eyebrow, title, sub }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--crimson)' }}>{eyebrow}</div>
      <h2 className="display" style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 500, letterSpacing: '-.025em', color: 'var(--ink)', marginTop: 8, lineHeight: 1.08 }}>{title}</h2>
      {sub && <p style={{ fontSize: 16, color: 'var(--mute)', marginTop: 10, maxWidth: 560 }}>{sub}</p>}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   VALUE PROPS — the moat
   ════════════════════════════════════════════════════════════ */
function ValueProps({ onOpenAuth, session }) {
  return (
    <section style={{ maxWidth: 1240, margin: '0 auto', padding: '120px 24px 0', position: 'relative' }}>
      <div style={{ background: 'var(--ink)', borderRadius: 28, padding: '72px 56px', position: 'relative', overflow: 'hidden' }}>
        {/* Decorative gradient */}
        <div style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, background: 'radial-gradient(circle, rgba(232,199,122,.15) 0%, transparent 70%)', pointerEvents: 'none' }}/>
        <div style={{ position: 'absolute', bottom: -150, left: -150, width: 500, height: 500, background: 'radial-gradient(circle, rgba(185,28,28,.12) 0%, transparent 70%)', pointerEvents: 'none' }}/>

        <div style={{ position: 'relative', maxWidth: 720 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--gold-soft)' }}>The Car Capitol difference</div>
          <h2 className="display" style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 500, letterSpacing: '-.03em', color: '#fff', marginTop: 12, lineHeight: 1.05 }}>
            The sticker price isn't the price.<br/>
            <em style={{ fontStyle: 'italic', color: 'var(--gold-soft)', fontWeight: 400 }}>We show you the real one.</em>
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 28, marginTop: 56, position: 'relative' }}>
          {[
            { icon: DollarSign, num: '01', title: 'Real monthly payment', body: 'Financing + tax + insurance + GAP + warranty — itemized, on every listing.' },
            { icon: Shield, num: '02', title: 'Every seller in one search', body: 'Dealers, private sellers, Facebook Marketplace. No more switching tabs.' },
            { icon: TrendingDown, num: '03', title: 'Deal ratings & price drops', body: 'See how every listing compares to market — and get notified when prices fall.' },
          ].map((v, i) => (
            <div key={i} className="fade-up" style={{ animationDelay: `${i * 80}ms` }}>
              <div style={{ fontSize: 11, color: 'var(--gold-soft)', fontWeight: 600, letterSpacing: '.1em' }}>{v.num}</div>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(232,199,122,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 14, marginBottom: 18 }}>
                <v.icon size={20} color="#E8C77A" strokeWidth={1.75}/>
              </div>
              <h3 className="display" style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-.02em', color: '#fff', marginBottom: 10 }}>{v.title}</h3>
              <p style={{ fontSize: 14.5, color: 'rgba(255,255,255,.7)', lineHeight: 1.55 }}>{v.body}</p>
            </div>
          ))}
        </div>

        {!session && (
          <div style={{ marginTop: 56, paddingTop: 40, borderTop: '1px solid rgba(255,255,255,.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20, position: 'relative' }}>
            <div>
              <div style={{ fontSize: 18, color: '#fff', fontWeight: 500, letterSpacing: '-.01em' }}>Create a free account to see your real payment on every car.</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,.55)', marginTop: 4 }}>No credit check. Takes 30 seconds.</div>
            </div>
            <button className="btn-crimson" style={{ height: 50, padding: '0 26px', fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 8 }} onClick={() => onOpenAuth('reg')}>
              Get Started Free <ArrowRight size={16}/>
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

/* ════════════════════════════════════════════════════════════
   HOW IT WORKS
   ════════════════════════════════════════════════════════════ */
function HowItWorks() {
  return (
    <section style={{ maxWidth: 1240, margin: '0 auto', padding: '120px 24px 0' }}>
      <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--crimson)' }}>Three steps</div>
        <h2 className="display" style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 500, letterSpacing: '-.025em', color: 'var(--ink)', marginTop: 8, lineHeight: 1.08 }}>How Car Capitol works</h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24, marginTop: 56 }}>
        {[
          { num: '1', title: 'Search every source', body: 'Browse dealer inventory, private listings, and Facebook Marketplace in one unified search.' },
          { num: '2', title: 'See your real price', body: 'Sign up free to view your real monthly payment — including taxes, fees, and protection products.' },
          { num: '3', title: 'Start your deal online', body: 'Get pre-qualified, lock financing, and start paperwork — all before you visit the dealer.' },
        ].map((s, i) => (
          <div key={i} style={{ position: 'relative', paddingTop: 28 }}>
            {i < 2 && <div style={{ position: 'absolute', top: 36, right: -12, width: 24, height: 1, background: 'var(--line)', display: 'none' }}/>}
            <div className="display" style={{ fontSize: 56, fontWeight: 500, letterSpacing: '-.04em', color: 'var(--crimson)', lineHeight: 1, marginBottom: 16 }}>{s.num}</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-.02em', color: 'var(--ink)', marginBottom: 10 }}>{s.title}</h3>
            <p style={{ fontSize: 15, color: 'var(--mute)', lineHeight: 1.55 }}>{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ════════════════════════════════════════════════════════════
   FILTER CHIPS
   ════════════════════════════════════════════════════════════ */
function FilterChips({ f, setF, onChange }) {
  const chips = []
  if (f.make) chips.push({ k: 'make', l: f.make })
  if (f.model) chips.push({ k: 'model', l: f.model })
  if (f.body_type) chips.push({ k: 'body_type', l: f.body_type })
  if (f.fuel_type) chips.push({ k: 'fuel_type', l: f.fuel_type })
  if (f.year_min || f.year_max) chips.push({ k: ['year_min','year_max'], l: `${f.year_min || 'Any'}–${f.year_max || 'Now'}` })
  if (f.price_min || f.price_max) chips.push({ k: ['price_min','price_max'], l: `$${f.price_min || '0'}–$${f.price_max || '∞'}` })
  if (f.miles_max) chips.push({ k: 'miles_max', l: `≤${(+f.miles_max/1000).toFixed(0)}K mi` })

  if (chips.length === 0) return null
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
      {chips.map((c, i) => (
        <button key={i} onClick={() => {
          const next = { ...f }
          if (Array.isArray(c.k)) c.k.forEach(k => next[k] = '')
          else next[c.k] = ''
          setF(next)
          setTimeout(onChange, 50)
        }} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 100, background: '#fff', border: '1px solid var(--line)', fontSize: 12, fontWeight: 500, color: 'var(--ink)', cursor: 'pointer' }}>
          {c.l} <X size={12} color="var(--mute)"/>
        </button>
      ))}
      <button onClick={() => { setF({ make:'', model:'', year_min:'', year_max:'', price_min:'', price_max:'', miles_max:'', body_type:'', fuel_type:'', zip:f.zip, radius:f.radius }); setTimeout(onChange, 50) }} style={{ fontSize: 12, color: 'var(--crimson)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
        Clear all
      </button>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   VEHICLE CARD — the centerpiece
   ════════════════════════════════════════════════════════════ */
function VehicleCard({ v, i, pm, session, saved, inCompare, onClick, onSave, onCompare, onOpenAuth }) {
  const rating = dealRating(v)
  const isNew = v.created_at && (Date.now() - new Date(v.created_at).getTime()) < 7 * 86400000

  return (
    <article className="v-card fade-up" style={{ animationDelay: `${Math.min(i * 30, 300)}ms`, background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--line)', cursor: 'pointer', boxShadow: 'var(--shadow-sm)', position: 'relative' }} onClick={onClick}>
      {/* Image */}
      <div style={{ position: 'relative', background: 'linear-gradient(135deg, #1A1A1D 0%, #2A2A2E 100%)', height: 210, overflow: 'hidden' }}>
        {v.photo ? (
          <img
            className="v-card-img"
            src={v.photo}
            alt={`${v.year} ${v.make} ${v.model}`}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={e => { e.target.style.display = 'none'; e.target.nextSibling && (e.target.nextSibling.style.display = 'flex') }}
          />
        ) : null}
        <div style={{ display: v.photo ? 'none' : 'flex', position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', color: '#3A3A3E' }}>
          <Car size={56} strokeWidth={1.5}/>
        </div>

        {/* Top-left badges */}
        <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 6, flexWrap: 'wrap', maxWidth: 'calc(100% - 80px)' }}>
          {rating && (
            <span className={`pill deal-${rating.kind}`} style={{ padding: '5px 11px', fontSize: 10.5 }}>
              {rating.kind === 'great' && <Award size={11} strokeWidth={2.5}/>}
              {rating.label}
            </span>
          )}
          {isNew && (
            <span className="pill" style={{ background: 'rgba(255,255,255,.95)', color: 'var(--ink)', backdropFilter: 'blur(4px)', padding: '5px 10px', fontSize: 10.5 }}>
              <Sparkles size={11}/> New
            </span>
          )}
        </div>

        {/* Top-right actions */}
        <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 6 }}>
          <button onClick={onSave} title={saved ? 'Saved' : 'Save'} style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,.95)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', boxShadow: '0 2px 8px rgba(0,0,0,.15)' }}>
            <Heart size={15} fill={saved ? 'var(--crimson)' : 'none'} color={saved ? 'var(--crimson)' : 'var(--ink)'} strokeWidth={2}/>
          </button>
          <button onClick={onCompare} title={inCompare ? 'Remove from compare' : 'Add to compare'} style={{ width: 34, height: 34, borderRadius: '50%', background: inCompare ? 'var(--ink)' : 'rgba(255,255,255,.95)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', boxShadow: '0 2px 8px rgba(0,0,0,.15)' }}>
            <GitCompare size={14} color={inCompare ? '#fff' : 'var(--ink)'} strokeWidth={2}/>
          </button>
        </div>

        {/* Bottom-left source */}
        <div style={{ position: 'absolute', bottom: 12, left: 12 }}>
          <span className="pill" style={{ background: 'rgba(11,11,12,.78)', backdropFilter: 'blur(6px)', color: '#fff', padding: '5px 11px', fontSize: 10.5 }}>
            {v.source === 'facebook' ? <><Building2 size={11}/> Facebook</> : v.seller_type === 'private' ? <><User2 size={11}/> Private</> : <><Building2 size={11}/> Dealer</>}
          </span>
        </div>

        {/* Bottom-right photos count */}
        {v.photos && v.photos.length > 1 && (
          <div style={{ position: 'absolute', bottom: 12, right: 12 }}>
            <span className="pill" style={{ background: 'rgba(11,11,12,.78)', backdropFilter: 'blur(6px)', color: '#fff', padding: '5px 9px', fontSize: 10.5 }}>
              <Camera size={11}/> {v.photos.length}
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '18px 18px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ minWidth: 0 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.25, letterSpacing: '-.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {v.year} {v.make} {v.model}
            </h3>
            {v.trim && <div style={{ fontSize: 12.5, color: 'var(--mute)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.trim}</div>}
          </div>
          <div className="display" style={{ fontSize: 22, fontWeight: 600, color: 'var(--ink)', letterSpacing: '-.02em', whiteSpace: 'nowrap' }}>
            {v.price > 0 ? '$' + v.price.toLocaleString() : 'Inquire'}
          </div>
        </div>

        {/* Specs row */}
        <div style={{ display: 'flex', gap: 10, marginTop: 12, fontSize: 12, color: 'var(--mute)', flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Gauge size={12} strokeWidth={1.75}/> {(v.mileage || 0).toLocaleString()} mi
          </span>
          {v.exterior_color && (
            <>
              <span style={{ color: 'var(--line)' }}>·</span>
              <span>{v.exterior_color}</span>
            </>
          )}
          {v.fuel_type && (
            <>
              <span style={{ color: 'var(--line)' }}>·</span>
              <span>{v.fuel_type}</span>
            </>
          )}
        </div>

        {/* Location */}
        {(v.city || v.distance) && (
          <div style={{ fontSize: 12, color: 'var(--mute-2)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
            <MapPin size={12} strokeWidth={1.75}/>
            {v.city ? `${v.city}${v.state ? ', ' + v.state : ''}` : ''}
            {v.distance && <span style={{ marginLeft: 'auto' }}>{Math.round(v.distance)} mi away</span>}
          </div>
        )}

        {/* Payment row */}
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--line-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {rating?.save ? (
            <div>
              <div style={{ fontSize: 10.5, color: 'var(--mute)', fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase' }}>Below market</div>
              <div style={{ fontSize: 13, color: 'var(--green)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                <TrendingDown size={13}/> ${rating.save.toLocaleString()}
              </div>
            </div>
          ) : v.dealer_name ? (
            <div style={{ fontSize: 11.5, color: 'var(--mute-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>{v.dealer_name}</div>
          ) : <div/>}

          {pm && session ? (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--mute)', letterSpacing: '.04em', textTransform: 'uppercase' }}>All-in</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-.01em' }}>${pm.tot}<span style={{ fontSize: 12, fontWeight: 500, color: 'var(--mute)' }}>/mo</span></div>
            </div>
          ) : pm && !session ? (
            <button onClick={e => { e.stopPropagation(); onOpenAuth('reg') }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'right' }}>
              <div style={{ fontSize: 10.5, color: 'var(--mute)', fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase' }}>Real payment</div>
              <div style={{ fontSize: 12.5, color: 'var(--crimson)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Lock size={11}/> Unlock free
              </div>
            </button>
          ) : null}
        </div>
      </div>
    </article>
  )
}

/* ════════════════════════════════════════════════════════════
   SKELETON / EMPTY
   ════════════════════════════════════════════════════════════ */
function SkeletonGrid() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 20 }}>
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--line)', boxShadow: 'var(--shadow-sm)' }}>
          <div className="skeleton" style={{ height: 210 }}/>
          <div style={{ padding: 18 }}>
            <div className="skeleton" style={{ height: 18, width: '70%', borderRadius: 4 }}/>
            <div className="skeleton" style={{ height: 12, width: '50%', borderRadius: 4, marginTop: 10 }}/>
            <div className="skeleton" style={{ height: 14, width: '80%', borderRadius: 4, marginTop: 14 }}/>
            <div className="skeleton" style={{ height: 22, width: '40%', borderRadius: 4, marginTop: 14 }}/>
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div style={{ background: '#fff', borderRadius: 20, padding: '80px 40px', textAlign: 'center', border: '1px solid var(--line)' }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--bone)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
        <Search size={26} color="var(--mute)" strokeWidth={1.75}/>
      </div>
      <h3 className="display" style={{ fontSize: 26, fontWeight: 500, letterSpacing: '-.02em', color: 'var(--ink)' }}>No vehicles matched your search</h3>
      <p style={{ fontSize: 15, color: 'var(--mute)', marginTop: 10, maxWidth: 400, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.55 }}>
        Try widening your distance, removing a filter, or browsing nearby models.
      </p>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   DETAIL VIEW
   ════════════════════════════════════════════════════════════ */
function DetailView({ v, session, profile, rate, saved, toggleSaved, onBack, onOpenAuth, onOpenPortal, onLogout, header }) {
  const [gallery, setGallery] = useState(0)
  const pm = v.price > 0 ? calcPay(v.price, 3000, rate, 72) : null
  const rating = dealRating(v)
  const photos = v.photos && v.photos.length ? v.photos : (v.photo ? [v.photo] : [])

  return (
    <div className="paper-grain" style={{ minHeight: '100vh' }}>
      {header}
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '28px 24px' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink)', fontWeight: 500, fontSize: 13, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 20, padding: 0 }}>
          <ChevronLeft size={16}/> Back to results
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 400px', gap: 32 }}>
          {/* LEFT: Gallery + details */}
          <div>
            {/* Gallery */}
            <div style={{ borderRadius: 20, overflow: 'hidden', background: '#1A1A1D', marginBottom: 12, boxShadow: 'var(--shadow-md)' }}>
              {photos[gallery] ? (
                <img src={photos[gallery]} alt="" style={{ width: '100%', height: 520, objectFit: 'cover', display: 'block' }}/>
              ) : (
                <div style={{ height: 520, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3A3A3E' }}>
                  <Car size={100} strokeWidth={1.5}/>
                </div>
              )}
            </div>
            {photos.length > 1 && (
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 20 }}>
                {photos.slice(0, 8).map((p, i) => (
                  <button key={i} onClick={() => setGallery(i)} style={{ flex: '0 0 auto', width: 104, height: 78, borderRadius: 10, overflow: 'hidden', border: i === gallery ? '2px solid var(--ink)' : '2px solid transparent', cursor: 'pointer', padding: 0, background: '#1A1A1D' }}>
                    <img src={p} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                  </button>
                ))}
              </div>
            )}

            {/* Title block */}
            <div style={{ background: '#fff', borderRadius: 20, padding: 32, border: '1px solid var(--line)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                {rating && (
                  <span className={`pill deal-${rating.kind}`} style={{ padding: '5px 11px', fontSize: 11 }}>
                    {rating.kind === 'great' && <Award size={11} strokeWidth={2.5}/>}
                    {rating.label}{rating.save ? ` · $${rating.save.toLocaleString()} below market` : ''}
                  </span>
                )}
                <span className="pill" style={{ background: v.source === 'facebook' ? '#E0EBFB' : v.seller_type === 'private' ? '#E0EBFB' : '#E0F0E6', color: v.source === 'facebook' ? '#1E4F8A' : v.seller_type === 'private' ? '#1E4F8A' : '#1f5a40', padding: '5px 11px', fontSize: 11 }}>
                  {v.source === 'facebook' ? <><Building2 size={11}/> Facebook Marketplace</> : v.seller_type === 'private' ? <><User2 size={11}/> Private Seller</> : <><Building2 size={11}/> Dealer</>}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20 }}>
                <div>
                  <h1 className="display" style={{ fontSize: 36, fontWeight: 500, letterSpacing: '-.025em', color: 'var(--ink)', lineHeight: 1.1 }}>{v.year} {v.make} {v.model}</h1>
                  {v.trim && <div style={{ fontSize: 17, color: 'var(--mute)', marginTop: 4 }}>{v.trim}</div>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="display" style={{ fontSize: 36, fontWeight: 600, color: 'var(--ink)', letterSpacing: '-.03em', lineHeight: 1 }}>
                    {v.price > 0 ? '$' + v.price.toLocaleString() : 'Contact'}
                  </div>
                </div>
              </div>

              {/* Spec grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 28 }}>
                {[
                  [Gauge, 'Mileage', (v.mileage || 0).toLocaleString() + ' mi'],
                  [Fuel, 'Fuel', v.fuel_type || 'Gas'],
                  [Calendar, 'Year', v.year],
                  [SlidersHorizontal, 'Transmission', v.transmission || 'Auto'],
                ].map(([I, l, val]) => (
                  <div key={l} style={{ background: 'var(--bone)', borderRadius: 12, padding: '14px 16px' }}>
                    <I size={14} color="var(--mute)" strokeWidth={1.75}/>
                    <div style={{ fontSize: 11, color: 'var(--mute)', marginTop: 6, fontWeight: 500, letterSpacing: '.02em', textTransform: 'uppercase' }}>{l}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginTop: 2 }}>{val}</div>
                  </div>
                ))}
              </div>

              {(v.dealer_name || v.city) && (
                <div style={{ marginTop: 20, padding: '14px 18px', background: 'var(--bone)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: 'var(--ink)' }}>
                  {v.dealer_name ? <><Building2 size={14} color="var(--mute)"/> {v.dealer_name}</> : null}
                  {v.city && <><MapPin size={14} color="var(--mute)" style={{ marginLeft: v.dealer_name ? 'auto' : 0 }}/> {v.city}{v.state ? ', ' + v.state : ''}</>}
                </div>
              )}

              {v.source_url && (
                <a href={v.source_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 16, fontSize: 13, color: 'var(--mute)', textDecoration: 'none', fontWeight: 500 }}>
                  <ExternalLink size={13}/> View original listing
                </a>
              )}
            </div>

            {/* Market Insights */}
            <VehicleInsights v={v} />
          </div>

          {/* RIGHT: Payment + actions (sticky) */}
          <div style={{ position: 'sticky', top: 90, alignSelf: 'start' }}>
            {pm ? (
              <div style={{ background: 'var(--ink)', borderRadius: 20, padding: 28, marginBottom: 14, boxShadow: 'var(--shadow-lg)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, background: 'radial-gradient(circle, rgba(232,199,122,.18) 0%, transparent 70%)', pointerEvents: 'none' }}/>
                <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--gold-soft)', marginBottom: 8 }}>Your real monthly payment</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <div className="display" style={{ fontSize: 56, fontWeight: 500, color: '#fff', letterSpacing: '-.035em', lineHeight: 1 }}>${pm.tot}</div>
                  <div style={{ fontSize: 14, color: 'rgba(255,255,255,.6)', fontWeight: 500 }}>/month</div>
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,.55)', marginTop: 6 }}>72 mo · {rate}% APR · $3,000 down</div>

                {session ? (
                  <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,.1)' }}>
                    {[
                      ['Financing', `$${pm.mp}`],
                      ['Insurance (est.)', '$120'],
                      ['GAP coverage', '$15'],
                      ['Warranty', '$10'],
                    ].map(([l, v2]) => (
                      <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', fontSize: 13, color: 'rgba(255,255,255,.8)' }}>
                        <span>{l}</span><span style={{ fontWeight: 600, color: '#fff' }}>{v2}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ marginTop: 18, padding: '14px 16px', background: 'rgba(232,199,122,.08)', borderRadius: 12, border: '1px solid rgba(232,199,122,.18)' }}>
                    <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.85)', lineHeight: 1.5 }}>Sign up free to see the itemized breakdown — insurance, GAP, and warranty included.</div>
                  </div>
                )}

                <button onClick={() => session ? onOpenPortal() : onOpenAuth('reg')} className="btn-crimson" style={{ width: '100%', height: 52, marginTop: 20, fontSize: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {session ? 'Start This Deal' : 'Sign Up Free to Continue'} <ArrowRight size={16}/>
                </button>
              </div>
            ) : null}

            <div style={{ background: '#fff', borderRadius: 16, padding: 18, border: '1px solid var(--line)', display: 'flex', gap: 10 }}>
              <button onClick={() => toggleSaved(v.id)} className="btn-ghost" style={{ flex: 1, height: 44, fontSize: 13, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Heart size={14} fill={saved.has(v.id) ? 'var(--crimson)' : 'none'} color={saved.has(v.id) ? 'var(--crimson)' : 'currentColor'}/>
                {saved.has(v.id) ? 'Saved' : 'Save'}
              </button>
              <button className="btn-ghost" style={{ flex: 1, height: 44, fontSize: 13, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Mail size={14}/> Contact
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   FOOTER
   ════════════════════════════════════════════════════════════ */
function Footer() {
  return (
    <footer style={{ background: 'var(--ink)', color: 'rgba(255,255,255,.7)', marginTop: 100, padding: '64px 24px 32px' }}>
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 40, marginBottom: 56 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginBottom: 14 }}>
              <span className="display" style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-.02em', color: '#fff' }}>Car</span>
              <span className="display" style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-.02em', color: 'var(--crimson)' }}>Capitol</span>
            </div>
            <p style={{ fontSize: 13.5, lineHeight: 1.6, maxWidth: 320 }}>Every car, one real price. The marketplace where what you see is what you actually pay.</p>
          </div>
          {[
            ['Buy', ['New', 'Used', 'Certified', 'Browse by make', 'Browse by body type']],
            ['Sell', ['Get an offer', 'Trade-in', 'List your car']],
            ['Finance', ['Pre-qualify', 'Auto loans', 'Refinance', 'Calculators']],
            ['About', ['How it works', 'Contact', 'Careers', 'Press']],
          ].map(([h, items]) => (
            <div key={h}>
              <div style={{ fontSize: 11, color: '#fff', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 16 }}>{h}</div>
              {items.map(i => (
                <a key={i} href="#" style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,.6)', textDecoration: 'none', padding: '4px 0' }}>{i}</a>
              ))}
            </div>
          ))}
        </div>
        <div style={{ paddingTop: 28, borderTop: '1px solid rgba(255,255,255,.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.45)' }}>© 2026 Car Capitol. All rights reserved.</div>
          <div style={{ display: 'flex', gap: 24 }}>
            <a href="#" style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', textDecoration: 'none' }}>Privacy</a>
            <a href="#" style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', textDecoration: 'none' }}>Terms</a>
            <a href="#" style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', textDecoration: 'none' }}>Do Not Sell My Info</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

/* ════════════════════════════════════════════════════════════
   INPUTS
   ════════════════════════════════════════════════════════════ */
function Sel({ label, value, onChange, opts, labels, ph, disabled }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0 }}>
      {label && <label style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--mute)', letterSpacing: '.06em', textTransform: 'uppercase' }}>{label}</label>}
      <select className="select" value={value} onChange={e => onChange(e.target.value)} disabled={disabled} style={{ color: value ? 'var(--ink)' : 'var(--mute-2)', opacity: disabled ? .5 : 1 }}>
        <option value="">{ph || 'Any'}</option>
        {opts.map((o, i) => <option key={o} value={o}>{labels ? labels[i] : o}</option>)}
      </select>
    </div>
  )
}

function Inp({ label, value, onChange, ph }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0 }}>
      {label && <label style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--mute)', letterSpacing: '.06em', textTransform: 'uppercase' }}>{label}</label>}
      <input className="input" value={value} onChange={e => onChange(e.target.value)} placeholder={ph}/>
    </div>
  )
}
