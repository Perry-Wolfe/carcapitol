'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Shell, Card, Btn, StatusBadge, DataTable, calcPay, R, DK, GR, GN, BL, W, GB } from './ui'
import { Home, Search, Shield, Gauge, FileText, CheckCircle } from 'lucide-react'

export default function ConsumerPortal({ profile, onLogout, onProfileUpdate }) {
  const [nav, setNav] = useState('dash')
  const [deals, setDeals] = useState([])
  const rate = profile.credit_score ? (profile.credit_score > 720 ? 4.99 : profile.credit_score > 680 ? 5.99 : 7.99) : 6.99

  useEffect(() => { supabase.from('deals').select('*').eq('consumer_id', profile.id).order('created_at', { ascending: false }).then(({ data }) => setDeals(data || [])) }, [])

  async function doPrequal() {
    const sc = 680 + Math.floor(Math.random() * 100)
    const { data } = await supabase.from('profiles').update({ credit_score: sc, credit_pull_date: new Date().toISOString(), prequal_budget: Math.round(sc * 45) }).eq('id', profile.id).select().single()
    if (data) onProfileUpdate(data)
  }

  const navItems = [
    { k: 'dash', l: 'Dashboard', i: Home },
    { k: 'pq', l: 'Pre-Qualify', i: Gauge },
    { k: 'deals', l: 'My Deals', i: FileText, b: deals.length || undefined },
    { k: 'garage', l: 'My Garage', i: Shield },
  ]

  return <Shell label="Consumer" nav={navItems} active={nav} setA={setNav} onOut={onLogout} user={profile}>
    {nav === 'dash' && <div>
      <h3 style={{ fontSize: 22, fontWeight: 700, color: DK, margin: '0 0 20px' }}>Welcome, {(profile.full_name || '').split(' ')[0]}</h3>
      {!profile.credit_score && <Card onClick={() => setNav('pq')} style={{ cursor: 'pointer', background: 'linear-gradient(135deg,#0A0A0A,#1a1a2e)', border: '1px solid rgba(185,28,28,.3)', marginBottom: 16 }}><div style={{ fontSize: 18, fontWeight: 700, color: W }}>Get Pre-Qualified in 60 Seconds</div><div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>Soft pull — no impact to your score</div></Card>}
      {profile.credit_score && <Card style={{ background: '#D1FAE5', marginBottom: 16 }}><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><CheckCircle size={20} color={GN} /><b style={{ color: DK }}>Pre-Qualified! Score: {profile.credit_score} · Budget: ${(profile.prequal_budget || 0).toLocaleString()}</b></div></Card>}
      <p style={{ color: GR, fontSize: 13 }}>Use the main search page to browse millions of vehicles with your real payment.</p>
    </div>}
    {nav === 'pq' && <Card style={{ maxWidth: 520 }}>{profile.credit_score ? <div><div style={{ textAlign: 'center', marginBottom: 20 }}><div style={{ width: 100, height: 100, borderRadius: '50%', border: '5px solid ' + GN, margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div><div style={{ fontSize: 28, fontWeight: 800, color: DK }}>{profile.credit_score}</div><div style={{ fontSize: 10, color: GN, fontWeight: 700 }}>{profile.credit_score > 720 ? 'EXCELLENT' : 'GOOD'}</div></div></div></div><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}><Card style={{ background: '#D1FAE5', textAlign: 'center', padding: 14 }}><div style={{ fontSize: 22, fontWeight: 800, color: DK }}>${(profile.prequal_budget || 0).toLocaleString()}</div><div style={{ fontSize: 11, color: GN }}>Budget</div></Card><Card style={{ background: '#DBEAFE', textAlign: 'center', padding: 14 }}><div style={{ fontSize: 22, fontWeight: 800, color: DK }}>{rate}%</div><div style={{ fontSize: 11, color: BL }}>Est. APR</div></Card></div></div> : <div><h3 style={{ color: DK, margin: '0 0 6px' }}>Get Pre-Qualified</h3><p style={{ color: GR, fontSize: 13, marginBottom: 16 }}>Simulated soft credit check</p><Btn primary onClick={doPrequal} style={{ width: '100%', justifyContent: 'center' }}>Check My Rate</Btn></div>}</Card>}
    {nav === 'deals' && <DataTable cols={[{ k: 'id', l: 'Deal', r: v => <b>#{(v || '').substr(0, 8)}</b> }, { k: 'selling_price', l: 'Amount', r: v => v ? '$' + v.toLocaleString() : '' }, { k: 'status', l: 'Status', r: v => <StatusBadge status={v} /> }, { k: 'created_at', l: 'Date', r: v => v ? (v + '').split('T')[0] : '' }]} data={deals} />}
    {nav === 'garage' && <Card><div style={{ fontWeight: 700, color: DK, marginBottom: 14 }}>My Garage</div><p style={{ color: GR }}>Coming with insurance integration</p></Card>}
  </Shell>
}
