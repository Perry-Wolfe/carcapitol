'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import PublicMarketplace from '@/components/PublicMarketplace'
import AuthModal from '@/components/AuthModal'
import ConsumerPortal from '@/components/ConsumerPortal'
import DealerPortal from '@/components/DealerPortal'
import LenderPortal from '@/components/LenderPortal'

export default function Home() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authModal, setAuthModal] = useState(null) // null, 'login', 'reg'
  const [showPortal, setShowPortal] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) loadProfile(session)
      else setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) loadProfile(session)
      else { setProfile(null); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(sess) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', sess.user.id)
      .single()
    if (data) setProfile(data)
    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setSession(null)
    setProfile(null)
    setShowPortal(false)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0A0A0A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <svg width={48} height={48} viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="38" stroke="#B91C1C" strokeWidth="7" strokeLinecap="round" strokeDasharray="200" strokeDashoffset="40" />
            <circle cx="50" cy="50" r="24" stroke="#B91C1C" strokeWidth="6" strokeLinecap="round" strokeDasharray="130" strokeDashoffset="30" />
          </svg>
          <p style={{ color: '#6B7280', marginTop: 12, fontFamily: 'system-ui' }}>Loading...</p>
        </div>
      </div>
    )
  }

  // Show portal if logged in AND user clicked "My Dashboard"
  if (session && profile && showPortal) {
    if (profile.role === 'consumer') return <ConsumerPortal profile={profile} onLogout={handleLogout} onProfileUpdate={p => setProfile(p)} onBack={() => setShowPortal(false)} />
    if (profile.role === 'dealer') return <DealerPortal profile={profile} onLogout={handleLogout} />
    if (profile.role === 'lender') return <LenderPortal profile={profile} onLogout={handleLogout} />
  }

  // Default: Public marketplace (search-first)
  return (
    <>
      <PublicMarketplace
        session={session}
        profile={profile}
        onOpenAuth={(mode) => setAuthModal(mode)}
        onOpenPortal={() => setShowPortal(true)}
        onLogout={handleLogout}
      />
      {authModal && (
        <AuthModal
          mode={authModal}
          onClose={() => setAuthModal(null)}
          onModeChange={(m) => setAuthModal(m)}
        />
      )}
    </>
  )
}
