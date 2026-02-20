'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Shell, Card, Btn, StatusBadge, DataTable, R, DK, GR, W, GN, BL, OR } from './ui'
import { Clipboard, BarChart3, ArrowLeft, CheckCircle, AlertCircle, X, DollarSign } from 'lucide-react'

export default function LenderPortal({ profile, onLogout }) {
  const [nav, setNav] = useState('queue')
  const [deals, setDeals] = useState([])
  const [sel, setSel] = useState(null)

  useEffect(() => { supabase.from('deals').select('*').in('status', ['SUBMITTED', 'CONDITIONAL', 'APPROVED', 'SIGNED', 'FUNDED']).order('created_at', { ascending: false }).then(({ data }) => setDeals(data || [])) }, [])

  async function updateDeal(deal, status) {
    const u = { status }
    if (status === 'APPROVED') u.approved_at = new Date().toISOString()
    if (status === 'FUNDED') { u.funded_at = new Date().toISOString(); u.funded_amount = deal.selling_price }
    const { data } = await supabase.from('deals').update(u).eq('id', deal.id).select()
    if (data?.length) { setDeals(deals.map(d => d.id === deal.id ? data[0] : d)); setSel(data[0]) }
  }

  const navItems = [{ k: 'queue', l: 'App Queue', i: Clipboard, b: deals.filter(d => d.status === 'SUBMITTED').length || undefined }, { k: 'rpt', l: 'Reports', i: BarChart3 }]

  return <Shell label={'Lender' + (profile.business_name ? ' — ' + profile.business_name : '')} nav={navItems} active={nav} setA={k => { setNav(k); setSel(null) }} onOut={onLogout} user={profile}>
    {nav === 'queue' && !sel && <DataTable cols={[{ k: 'id', l: 'Deal', r: v => <b>#{(v || '').substr(0, 8)}</b> }, { k: 'selling_price', l: 'Amount', r: v => v ? '$' + v.toLocaleString() : '' }, { k: 'credit_score', l: 'Score' }, { k: 'status', l: 'Status', r: v => <StatusBadge status={v} /> }]} data={deals} onRow={d => setSel(d)} />}
    {nav === 'queue' && sel && <div>
      <button onClick={() => setSel(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: R, fontWeight: 600, fontSize: 12, marginBottom: 16 }}><ArrowLeft size={15} style={{ verticalAlign: -3 }} /> Back</button>
      <Card><h3 style={{ margin: '0 0 12px' }}>Deal #{(sel.id || '').substr(0, 8)} · ${(sel.selling_price || 0).toLocaleString()} · Score: {sel.credit_score || 'N/A'}</h3><StatusBadge status={sel.status} />
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          {(sel.status === 'SUBMITTED' || sel.status === 'CONDITIONAL') && <Btn primary color={GN} icon={CheckCircle} onClick={() => updateDeal(sel, 'APPROVED')}>Approve</Btn>}
          {sel.status === 'SUBMITTED' && <Btn primary color={OR} icon={AlertCircle} onClick={() => updateDeal(sel, 'CONDITIONAL')}>Conditional</Btn>}
          {(sel.status === 'SUBMITTED' || sel.status === 'CONDITIONAL') && <Btn danger icon={X} onClick={() => updateDeal(sel, 'DECLINED')}>Decline</Btn>}
          {sel.status === 'SIGNED' && <Btn primary color={GN} icon={DollarSign} onClick={() => updateDeal(sel, 'FUNDED')}>Fund</Btn>}
        </div>
      </Card>
    </div>}
    {nav === 'rpt' && <Card><p style={{ color: GR }}>Total: {deals.length} · Funded: {deals.filter(d => d.status === 'FUNDED').length}</p></Card>}
  </Shell>
}
