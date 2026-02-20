'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { X } from 'lucide-react'

const R='#B91C1C',DK='#0F172A',GR='#6B7280',GL='#9CA3AF',GB='#E2E8F0',W='#FFFFFF'

export default function AuthModal({mode,onClose,onModeChange}){
  const [form,setForm]=useState({email:'',pw:'',name:'',role:'consumer',biz:'',phone:''})
  const [err,setErr]=useState('')
  const [msg,setMsg]=useState('')
  const [loading,setLoading]=useState(false)
  function s(k,v){setForm({...form,[k]:v})}

  async function handleSubmit(){
    setErr('');setMsg('');setLoading(true)
    if(!form.email||!form.pw){setErr('Email and password required');setLoading(false);return}
    if(mode==='reg'){
      if(!form.name){setErr('Name required');setLoading(false);return}
      const{data,error}=await supabase.auth.signUp({email:form.email,password:form.pw,options:{data:{full_name:form.name,role:form.role,phone:form.phone,business_name:form.biz}}})
      if(error){setErr(error.message);setLoading(false);return}
      if(data.user&&!data.session){setMsg('Check your email for a confirmation link, then sign in.');onModeChange('login')}
      else onClose()
    }else{
      const{error}=await supabase.auth.signInWithPassword({email:form.email,password:form.pw})
      if(error){setErr(error.message);setLoading(false);return}
      onClose()
    }
    setLoading(false)
  }

  return<div style={{position:'fixed',inset:0,zIndex:100,display:'flex',alignItems:'center',justifyContent:'center'}}>
    <div onClick={onClose} style={{position:'absolute',inset:0,background:'rgba(0,0,0,.5)',backdropFilter:'blur(4px)'}}/>
    <div style={{position:'relative',width:440,background:W,borderRadius:20,padding:32,boxShadow:'0 20px 60px rgba(0,0,0,.2)'}}>
      <button onClick={onClose} style={{position:'absolute',top:16,right:16,background:'none',border:'none',cursor:'pointer',color:GL}}><X size={18}/></button>
      <h2 style={{fontSize:22,fontWeight:700,color:DK,margin:'0 0 4px'}}>{mode==='reg'?'Create Your Free Account':'Welcome Back'}</h2>
      <p style={{color:GR,fontSize:13,margin:'0 0 20px'}}>{mode==='reg'?'See real payments, save vehicles, start deals':'Sign in to your account'}</p>
      {err&&<div style={{background:'#FEF2F2',color:R,padding:'8px 12px',borderRadius:8,fontSize:12,marginBottom:12}}>{err}</div>}
      {msg&&<div style={{background:'#D1FAE5',color:'#059669',padding:'8px 12px',borderRadius:8,fontSize:12,marginBottom:12}}>{msg}</div>}
      {mode==='reg'&&<Field label="I am a..." value={form.role} onChange={v=>s('role',v)} type="select" opts={[['consumer','Consumer — Shopping'],['dealer','Dealer — Selling'],['lender','Lender — Financing']]}/>}
      {mode==='reg'&&<Field label="Full Name" value={form.name} onChange={v=>s('name',v)} req/>}
      {mode==='reg'&&form.role!=='consumer'&&<Field label={form.role==='dealer'?'Dealership Name':'Institution Name'} value={form.biz} onChange={v=>s('biz',v)}/>}
      <Field label="Email" value={form.email} onChange={v=>s('email',v)} type="email" req/>
      <Field label="Password" value={form.pw} onChange={v=>s('pw',v)} type="password" req/>
      {mode==='reg'&&<Field label="Phone" value={form.phone} onChange={v=>s('phone',v)}/>}
      <button onClick={handleSubmit} disabled={loading} style={{width:'100%',padding:'12px',background:loading?'#9CA3AF':R,color:W,border:'none',borderRadius:10,fontSize:14,fontWeight:600,cursor:loading?'wait':'pointer',marginTop:8}}>{loading?'Please wait...':mode==='reg'?'Create Account':'Sign In'}</button>
      <div style={{textAlign:'center',marginTop:14}}><span style={{fontSize:12,color:GR}}>{mode==='reg'?'Have an account? ':'Need one? '}</span><span onClick={()=>{onModeChange(mode==='reg'?'login':'reg');setErr('');setMsg('')}} style={{fontSize:12,color:R,fontWeight:600,cursor:'pointer'}}>{mode==='reg'?'Sign In':'Sign Up Free'}</span></div>
    </div>
  </div>
}

function Field({label,value,onChange,type,req,opts}){
  return<div style={{marginBottom:12}}>
    <label style={{fontSize:11,fontWeight:600,color:GR,display:'block',marginBottom:3}}>{label}{req&&<span style={{color:R}}> *</span>}</label>
    {type==='select'?<select value={value} onChange={e=>onChange(e.target.value)} style={{width:'100%',padding:'9px 12px',borderRadius:8,border:'1px solid '+GB,fontSize:13,color:DK}}>{opts.map(o=><option key={o[0]} value={o[0]}>{o[1]}</option>)}</select>
    :<input type={type||'text'} value={value||''} onChange={e=>onChange(e.target.value)} style={{width:'100%',padding:'9px 12px',borderRadius:8,border:'1px solid '+GB,fontSize:13,color:DK}}/>}
  </div>
}
