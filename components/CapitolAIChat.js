'use client'
import { useState, useRef, useEffect } from 'react'
import { Sparkles, X, Send, Loader2, MessageCircle } from 'lucide-react'

const INTRO = "Hi! I'm Capitol AI. Tell me what you're looking for — \"family SUV under $30K\", \"reliable first car\", or anything else — and I'll help you narrow it down."

export default function CapitolAIChat({ context, onRunSearch }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([{ role: 'assistant', content: INTRO }])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [unread, setUnread] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, open])

  async function send() {
    const text = input.trim()
    if (!text || busy) return
    const next = [...messages, { role: 'user', content: text }]
    setMessages(next); setInput(''); setBusy(true)
    try {
      const r = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next, context }),
      })
      const d = await r.json()
      setMessages(prev => [...prev, { role: 'assistant', content: d.reply || 'Sorry, no reply.' }])
      if (!open) setUnread(true)
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection problem. Try again.' }])
    }
    setBusy(false)
  }

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => { setOpen(true); setUnread(false) }}
          aria-label="Open Capitol AI chat"
          style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 90,
            width: 60, height: 60, borderRadius: '50%',
            background: 'var(--ink)', color: '#fff', border: 'none',
            cursor: 'pointer',
            boxShadow: '0 14px 32px -10px rgba(11,11,12,.4), 0 4px 10px rgba(11,11,12,.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'transform .2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}>
          <Sparkles size={24} color="var(--gold-soft)" />
          {unread && (
            <span style={{
              position: 'absolute', top: 6, right: 6,
              width: 12, height: 12, borderRadius: '50%',
              background: 'var(--crimson)', border: '2px solid var(--ink)',
            }} />
          )}
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="cap-chat" style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 90,
          width: 380, maxWidth: 'calc(100vw - 32px)',
          height: 560, maxHeight: 'calc(100vh - 100px)',
          background: '#fff', borderRadius: 20,
          boxShadow: 'var(--shadow-xl)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid var(--line)',
        }}>
          {/* Header */}
          <div style={{
            padding: '18px 20px',
            background: 'var(--ink)',
            color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, background: 'radial-gradient(circle, rgba(232,199,122,.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(232,199,122,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={18} color="var(--gold-soft)" />
              </div>
              <div>
                <div className="display" style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-.01em' }}>Capitol AI</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.55)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#5BE584' }} /> Shopping assistant
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close" style={{ background: 'rgba(255,255,255,.1)', border: 'none', color: '#fff', cursor: 'pointer', width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '18px 16px', background: 'var(--paper)' }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: 10,
              }}>
                <div style={{
                  maxWidth: '85%',
                  padding: '10px 14px',
                  borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: m.role === 'user' ? 'var(--ink)' : '#fff',
                  color: m.role === 'user' ? '#fff' : 'var(--ink)',
                  fontSize: 14,
                  lineHeight: 1.5,
                  border: m.role === 'user' ? 'none' : '1px solid var(--line)',
                  boxShadow: m.role === 'user' ? 'none' : 'var(--shadow-sm)',
                  whiteSpace: 'pre-wrap',
                }}>
                  {m.content.split('🔍').map((part, idx) => idx === 0 ? part : (
                    <span key={idx}>
                      <button onClick={() => onRunSearch?.(part.trim())} style={{ display: 'block', marginTop: 8, padding: '8px 12px', background: 'var(--bone)', border: '1px solid var(--line)', borderRadius: 10, fontSize: 13, fontWeight: 500, color: 'var(--ink)', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                        🔍 {part.trim()}
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            ))}
            {busy && (
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 10 }}>
                <div style={{ padding: '12px 16px', background: '#fff', borderRadius: '16px 16px 16px 4px', border: '1px solid var(--line)', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[0,1,2].map(i => (
                      <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--mute-2)', animation: 'pulse-dot 1.4s ease-in-out infinite', animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div style={{ padding: '12px 14px', borderTop: '1px solid var(--line)', background: '#fff' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                placeholder="Ask anything…"
                rows={1}
                style={{
                  flex: 1, resize: 'none', border: '1px solid var(--line)',
                  borderRadius: 12, padding: '10px 14px', fontSize: 14,
                  fontFamily: 'inherit', outline: 'none',
                  maxHeight: 100,
                }} />
              <button onClick={send} disabled={!input.trim() || busy} aria-label="Send"
                style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: 'var(--ink)', color: '#fff', border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: !input.trim() || busy ? 'not-allowed' : 'pointer',
                  opacity: !input.trim() || busy ? .4 : 1,
                  flexShrink: 0,
                }}>
                {busy ? <Loader2 size={16} className="spinner" /> : <Send size={15} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
