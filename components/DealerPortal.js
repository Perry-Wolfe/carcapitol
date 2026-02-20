'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Shell, Card, Btn, StatusBadge, DataTable, Input, GAP_PRICE, WTIERS, R, DK, GR, W, GB, GN, BL } from './ui'
import { Home, Package, FileText, Briefcase, BarChart3, Plus, ArrowLeft, Edit, Send, DollarSign, CheckCircle, Users } from 'lucide-react'

export default function DealerPortal({ profile, onLogout }) {
  const [nav, setNav] = useState('dash')
  const [vehicles, setVehicles] = useState([])
  const [deals, setDeals] = useState([])
  const [sel, setSel] = useState(null)
  const [adding, setAdding] = useState(false)
  const [nv, setNV] = useState({ yr: '', mk: '', md: '', price: '', mi: '', clr: '', body: 'Sedan' })

  useEffect(() => {
    supabase.from('vehicles').select('*').eq('dealer_id', profile.id).order('created_at', { ascending: false }).then(({ data }) => setVehicles(data || []))
    supabase.from('deals').select('*').eq('dealer_id', profile.id).order('created_at', { ascending: false }).then(({ data }) => setDeals(data || []))
  }, [])

  async function addVehicle() {
    if (!nv.yr || !nv.mk || !nv.md || !nv.price) return
    const { data } = await supabase.from('vehicles').insert({ dealer_id: profile.id, year: parseInt(nv.yr), make: nv.mk, model: nv.md, price: parseFloat(nv.price), mileage: parseInt(nv.mi) || 0, color_exterior: nv.clr || null, body_type: nv.body, status: 'Available' }).select()
    if (data?.length) { setVehicles([data[0], ...vehicles]); setAdding(false); setNV({ yr: '', mk: '', md: '', price: '', mi: '', clr: '', body: 'Sedan' }) }
  }

  async function updateDeal(deal, status) {
    const { data } = await supabase.from('deals').update({ status }).eq('id', deal.id).select()
    if (data?.length) { setDeals(deals.map(d => d.id === deal.id ? data[0] : d)); setSel(data[0]) }
  }

  const navItems = [{ k: 'dash', l: 'Home', i: Home }, { k: 'inv', l: 'Inventory', i: Package }, { k: 'deal', l: 'Deals', i: FileText, b: deals.length || undefined }, { k: 'fi', l: 'F&I Products', i: Briefcase }]

  return <Shell label={'Dealer' + (profile.business_name ? ' — ' + profile.business_name : '')} nav={navItems} active={nav} setA={k => { setNav(k); setSel(null) }} onOut={onLogout} user={profile}>
    {nav === 'dash' && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>{[[Package, 'Inventory', vehicles.length, DK], [FileText, 'Deals', deals.length, R], [Users, 'Leads', deals.filter(d => d.status === 'LEAD').length, BL], [DollarSign, 'Funded', deals.filter(d => d.status === 'FUNDED').length, GN]].map(([I, l, v, c]) => <Card key={l}><I size={18} color={c} /><div style={{ fontSize: 26, fontWeight: 700, color: DK, marginTop: 8 }}>{v}</div><div style={{ fontSize: 12, color: GR }}>{l}</div></Card>)}</div>}
    {nav === 'inv' && <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}><b>{vehicles.length} vehicles</b><Btn primary sm icon={Plus} onClick={() => setAdding(!adding)}>{adding ? 'Cancel' : 'Add Vehicle'}</Btn></div>
      {adding && <Card style={{ marginBottom: 14 }}><div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}><Input label="Year" value={nv.yr} onChange={v => setNV({ ...nv, yr: v })} req /><Input label="Make" value={nv.mk} onChange={v => setNV({ ...nv, mk: v })} req /><Input label="Model" value={nv.md} onChange={v => setNV({ ...nv, md: v })} req /><Input label="Price" value={nv.price} onChange={v => setNV({ ...nv, price: v })} type="number" req /></div><Btn primary onClick={addVehicle} style={{ marginTop: 10 }} icon={Plus}>Save</Btn></Card>}
      <DataTable cols={[{ k: 'year', l: 'Vehicle', r: (_, r) => <b>{r.year} {r.make} {r.model}</b> }, { k: 'price', l: 'Price', r: v => '$' + (v || 0).toLocaleString() }, { k: 'mileage', l: 'Miles', r: v => (v || 0).toLocaleString() }, { k: 'status', l: 'Status', r: v => <StatusBadge status={v} /> }]} data={vehicles} />
    </div>}
    {nav === 'deal' && !sel && <DataTable cols={[{ k: 'id', l: 'Deal', r: v => <b>#{(v || '').substr(0, 8)}</b> }, { k: 'selling_price', l: 'Amount', r: v => v ? '$' + v.toLocaleString() : '' }, { k: 'status', l: 'Status', r: v => <StatusBadge status={v} /> }, { k: 'created_at', l: 'Date', r: v => v ? (v + '').split('T')[0] : '' }]} data={deals} onRow={d => setSel(d)} />}
    {nav === 'deal' && sel && <div>
      <button onClick={() => setSel(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: R, fontWeight: 600, fontSize: 12, marginBottom: 16 }}><ArrowLeft size={15} style={{ verticalAlign: -3 }} /> Back</button>
      <Card><h3 style={{ margin: '0 0 12px' }}>Deal #{(sel.id || '').substr(0, 8)} — <StatusBadge status={sel.status} /></h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {sel.status === 'LEAD' && <Btn primary icon={Edit} onClick={() => updateDeal(sel, 'DESKING')}>Move to Desking</Btn>}
          {sel.status === 'DESKING' && <Btn primary icon={Send} onClick={() => updateDeal(sel, 'SUBMITTED')}>Submit to Lender</Btn>}
          {sel.status === 'APPROVED' && <Btn primary icon={FileText} onClick={() => updateDeal(sel, 'SIGNED')}>Send for E-Sign</Btn>}
          {sel.status === 'SIGNED' && <Btn primary color={GN} icon={DollarSign} onClick={() => updateDeal(sel, 'FUNDED')}>Fund</Btn>}
          {sel.status === 'FUNDED' && <div style={{ background: '#D1FAE5', padding: 12, borderRadius: 8 }}><CheckCircle size={16} color={GN} /> Funded!</div>}
        </div>
      </Card>
    </div>}
    {nav === 'fi' && <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
      <Card><b>CarCapitol GAP — ${GAP_PRICE}</b><p style={{ color: GR, fontSize: 12, marginTop: 4 }}>Flat rate · 100% retained</p></Card>
      <Card><b>CarCapitol VSC</b>{WTIERS.map(w => <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F3F4F6', fontSize: 12 }}><span>{w.name} ({w.term})</span><b style={{ color: R }}>${w.price.toLocaleString()}</b></div>)}</Card>
    </div>}
  </Shell>
}
