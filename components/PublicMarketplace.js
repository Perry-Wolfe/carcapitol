'use client'
import { useState, useEffect, useCallback } from 'react'
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight, Building2, User2, ExternalLink, MapPin, Gauge, Fuel, Calendar, ArrowRight, X, ChevronDown, Shield, DollarSign, Lock } from 'lucide-react'

const R='#B91C1C',DK='#0F172A',GR='#6B7280',GL='#9CA3AF',GB='#E5E7EB',W='#FFFFFF',GN='#059669',BL='#2563EB',OR='#D97706'

const MAKES=['Acura','Audi','BMW','Buick','Cadillac','Chevrolet','Chrysler','Dodge','Ford','GMC','Honda','Hyundai','Infiniti','Jaguar','Jeep','Kia','Land Rover','Lexus','Lincoln','Mazda','Mercedes-Benz','Mini','Mitsubishi','Nissan','Porsche','RAM','Subaru','Tesla','Toyota','Volkswagen','Volvo']
const MODELS={Toyota:['4Runner','Camry','Corolla','Highlander','RAV4','Tacoma','Tundra'],Honda:['Accord','Civic','CR-V','HR-V','Odyssey','Passport','Pilot','Ridgeline'],Ford:['Bronco','Edge','Escape','Explorer','F-150','Maverick','Mustang','Ranger'],Chevrolet:['Blazer','Camaro','Colorado','Equinox','Malibu','Silverado 1500','Tahoe','Traverse'],BMW:['2 Series','3 Series','4 Series','5 Series','X1','X3','X5','X7'],Nissan:['Altima','Frontier','Kicks','Maxima','Murano','Pathfinder','Rogue','Sentra','Titan'],Jeep:['Cherokee','Compass','Gladiator','Grand Cherokee','Renegade','Wrangler'],Hyundai:['Elantra','Kona','Palisade','Santa Fe','Sonata','Tucson'],Mercedes:['A-Class','C-Class','E-Class','GLA','GLC','GLE','GLS','S-Class'],Tesla:['Model 3','Model S','Model X','Model Y'],RAM:['1500','2500','3500']}
const BODIES=['Sedan','SUV','Truck','Coupe','Van','Wagon','Convertible','Hatchback']
const FUELS=['Gasoline','Electric','Hybrid','Diesel']

function Logo({sz}){return<svg width={sz||24} height={sz||24} viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="38" stroke={R} strokeWidth="7" strokeLinecap="round" strokeDasharray="200" strokeDashoffset="40"/><circle cx="50" cy="50" r="24" stroke={R} strokeWidth="6" strokeLinecap="round" strokeDasharray="130" strokeDashoffset="30"/></svg>}

function calcPay(pr,dn,apr,tm){const tx=pr*0.0875,fe=895,fin=pr+tx+fe-dn;const mr=apr/100/12;const mp=apr===0?fin/tm:fin*(mr*Math.pow(1+mr,tm))/(Math.pow(1+mr,tm)-1);return{mp:Math.round(mp),fin:Math.round(fin),tot:Math.round(mp+145)}}

export default function PublicMarketplace({session,profile,onOpenAuth,onOpenPortal,onLogout}){
  const [listings,setListings]=useState([])
  const [total,setTotal]=useState(0)
  const [loading,setLoading]=useState(false)
  const [page,setPage]=useState(0)
  const [sel,setSel]=useState(null)
  const [showFilters,setShowFilters]=useState(false)
  const [tab,setTab]=useState('all')
  const [bannerVisible,setBannerVisible]=useState(true)
  const [f,setF]=useState({make:'',model:'',year_min:'',year_max:'',price_min:'',price_max:'',miles_max:'',body_type:'',fuel_type:'',zip:'90001',radius:'50'})

  const rate=profile?.credit_score?(profile.credit_score>720?4.99:profile.credit_score>680?5.99:7.99):6.99
  const PER_PAGE=24

  useEffect(()=>{doSearch(0)},[])

  async function doSearch(pg){
    setLoading(true);setPage(pg);setSel(null)
    const p=new URLSearchParams()
    if(f.make)p.set('make',f.make)
    if(f.model)p.set('model',f.model)
    if(f.year_min)p.set('year_min',f.year_min)
    if(f.year_max)p.set('year_max',f.year_max)
    if(f.price_min)p.set('price_min',f.price_min)
    if(f.price_max)p.set('price_max',f.price_max)
    if(f.miles_max)p.set('miles_max',f.miles_max)
    if(f.body_type)p.set('body_type',f.body_type)
    if(f.fuel_type)p.set('fuel_type',f.fuel_type)
    if(f.zip)p.set('zip',f.zip)
    if(f.radius)p.set('radius',f.radius)
    p.set('rows',PER_PAGE.toString())
    p.set('start',(pg*PER_PAGE).toString())
    p.set('sort_by','price');p.set('sort_order','asc')
    try{
      p.set('type',tab==='private'?'fsbo':tab)
      const r=await fetch('/api/search?'+p);const d=await r.json();setListings(d.listings||[]);setTotal(d.total||0)
    }catch(e){console.error(e);setListings([])}
    setLoading(false)
  }

  function up(k,v){setF(prev=>({...prev,[k]:v}))}
  const modelOpts=f.make&&MODELS[f.make]?MODELS[f.make]:[]

  // ═══ VEHICLE DETAIL VIEW ═══
  if(sel){
    const v=sel,pm=v.price>0?calcPay(v.price,3000,rate,72):null
    return(<div style={{minHeight:'100vh',background:'#F8FAFC'}}>
      <Header session={session} profile={profile} onOpenAuth={onOpenAuth} onOpenPortal={onOpenPortal} onLogout={onLogout}/>
      <div style={{maxWidth:1200,margin:'0 auto',padding:'20px 24px'}}>
        <button onClick={()=>setSel(null)} style={{background:'none',border:'none',cursor:'pointer',color:R,fontWeight:600,fontSize:13,display:'flex',alignItems:'center',gap:4,marginBottom:16,padding:0}}><ChevronLeft size={16}/>Back to results</button>
        <div style={{display:'grid',gridTemplateColumns:'1fr 380px',gap:24}}>
          <div>
            <div style={{borderRadius:16,overflow:'hidden',background:DK,marginBottom:16}}>
              {v.photo?<img src={v.photo} alt="" style={{width:'100%',height:400,objectFit:'cover',display:'block'}} onError={e=>{e.target.style.display='none'}}/>:<div style={{height:400,display:'flex',alignItems:'center',justifyContent:'center',fontSize:80,color:'#333'}}>🚗</div>}
            </div>
            {v.photos&&v.photos.length>1&&<div style={{display:'flex',gap:8,overflowX:'auto',marginBottom:16}}>{v.photos.slice(0,6).map((p,i)=><img key={i} src={p} alt="" style={{width:100,height:70,objectFit:'cover',borderRadius:8,cursor:'pointer',border:'2px solid transparent'}} onError={e=>{e.target.style.display='none'}}/>)}</div>}
            <div style={{background:W,borderRadius:16,padding:24,border:'1px solid #E2E8F0'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16}}>
                <div><h1 style={{fontSize:24,fontWeight:700,color:DK,margin:0}}>{v.year} {v.make} {v.model} {v.trim}</h1><p style={{color:GR,fontSize:14,margin:'6px 0 0'}}>{(v.mileage||0).toLocaleString()} mi · {v.exterior_color||'N/A'} · {v.city}{v.state?', '+v.state:''}</p></div>
                <div style={{textAlign:'right'}}><div style={{fontSize:28,fontWeight:800,color:R}}>{v.price>0?'$'+v.price.toLocaleString():'Contact'}</div><span style={{display:'inline-flex',padding:'4px 10px',borderRadius:20,fontSize:11,fontWeight:600,background:v.source==='facebook'?'#DBEAFE':v.seller_type==='private'?'#DBEAFE':'#D1FAE5',color:v.source==='facebook'?'#1877F2':v.seller_type==='private'?BL:GN}}>{v.source==='facebook'?'📘 Facebook Marketplace':v.seller_type==='private'?'🏠 Private Seller':'🏢 Dealer'}</span></div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
                {[[Gauge,'Mileage',(v.mileage||0).toLocaleString()+' mi'],[Fuel,'Fuel',v.fuel_type||'Gas'],[Calendar,'Year',v.year],[SlidersHorizontal,'Trans',v.transmission||'Auto']].map(([I,l,val])=><div key={l} style={{background:'#F8FAFC',borderRadius:10,padding:14}}><I size={15} color={GR}/><div style={{fontSize:11,color:GR,marginTop:4}}>{l}</div><div style={{fontSize:14,fontWeight:600,color:DK}}>{val}</div></div>)}
              </div>
              {v.dealer_name&&<div style={{marginTop:16,padding:'10px 14px',background:'#F8FAFC',borderRadius:8,fontSize:13,color:GR,display:'flex',alignItems:'center',gap:6}}><Building2 size={14}/>{v.dealer_name}</div>}
              {v.source_url&&<a href={v.source_url} target="_blank" rel="noopener noreferrer" style={{display:'inline-flex',alignItems:'center',gap:4,marginTop:12,fontSize:13,color:BL,textDecoration:'none',fontWeight:500}}><ExternalLink size={13}/>View original listing</a>}
            </div>
          </div>
          <div>
            {pm&&<div style={{background:DK,borderRadius:16,padding:24,marginBottom:16}}>
              <div style={{fontSize:10,fontWeight:700,letterSpacing:2,color:R,textTransform:'uppercase',marginBottom:8}}>Your Real Monthly Payment</div>
              {session?<><div style={{fontSize:42,fontWeight:800,color:W}}>${pm.tot}<span style={{fontSize:15,color:GL}}>/mo</span></div><div style={{fontSize:12,color:GR,marginTop:4}}>72mo @ {rate}% · $3K down · incl. est. insurance</div><div style={{borderTop:'1px solid #2D3748',marginTop:16,paddingTop:16}}>
                {[['Vehicle','$'+v.price.toLocaleString()],['Tax (8.75%)','$'+Math.round(v.price*0.0875).toLocaleString()],['Doc Fee','$895'],['Down Payment','-$3,000'],['Financed','$'+pm.fin.toLocaleString()],['Payment','$'+pm.mp+'/mo'],['Est. Insurance','+$145/mo'],['TOTAL',('$'+pm.tot+'/mo')]].map(r=><div key={r[0]} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',fontSize:11,color:r[0]==='TOTAL'?R:'#718096'}}><span>{r[0]}</span><span style={{fontWeight:r[0]==='TOTAL'?700:400,color:r[0]==='TOTAL'?W:'#A0AEC0'}}>{r[1]}</span></div>)}
              </div></>:<div style={{textAlign:'center',padding:'10px 0'}}><Lock size={24} color={GL} style={{margin:'0 auto 8px'}}/><div style={{fontSize:20,fontWeight:700,color:W}}>See Your Real Payment</div><div style={{fontSize:12,color:GR,margin:'6px 0 16px'}}>Sign up free to see monthly payments with insurance included</div><button onClick={()=>onOpenAuth('reg')} style={{width:'100%',padding:'12px',background:R,color:W,border:'none',borderRadius:10,fontSize:14,fontWeight:600,cursor:'pointer'}}>Sign Up — It's Free</button></div>}
            </div>}
            {session&&v.seller_type==='dealer'&&<button onClick={()=>onOpenPortal&&onOpenPortal()} style={{width:'100%',padding:'14px',background:R,color:W,border:'none',borderRadius:10,fontSize:15,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6,marginBottom:12}}><ArrowRight size={16}/>Start This Deal</button>}
            <div style={{background:W,borderRadius:16,padding:20,border:'1px solid #E2E8F0'}}>
              <div style={{fontSize:11,fontWeight:700,color:GR,letterSpacing:1,textTransform:'uppercase',marginBottom:12}}>Protect Your Purchase</div>
              {[['CarCapitol GAP','Covers loan balance gap','$995'],['CarCapitol Warranty','Starting at','$1,495']].map(r=><div key={r[0]} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid #F1F5F9'}}><div><div style={{fontWeight:600,color:DK,fontSize:13}}>{r[0]}</div><div style={{fontSize:11,color:GR}}>{r[1]}</div></div><div style={{fontWeight:700,color:R}}>{r[2]}</div></div>)}
            </div>
          </div>
        </div>
      </div>
    </div>)
  }

  // ═══ MAIN SEARCH PAGE ═══
  return(<div style={{minHeight:'100vh',background:'#F8FAFC'}}>
    <Header session={session} profile={profile} onOpenAuth={onOpenAuth} onOpenPortal={onOpenPortal} onLogout={onLogout}/>

    {/* Sign-up banner for logged-out users */}
    {!session&&bannerVisible&&<div style={{background:'linear-gradient(135deg,'+DK+',#1E293B)',borderBottom:'1px solid #334155'}}>
      <div style={{maxWidth:1200,margin:'0 auto',padding:'10px 24px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{width:32,height:32,borderRadius:8,background:R+'20',display:'flex',alignItems:'center',justifyContent:'center'}}><DollarSign size={16} color={R}/></div>
          <div><span style={{color:W,fontSize:13,fontWeight:600}}>See your real monthly payment on every car</span><span style={{color:GL,fontSize:13}}> — with insurance, GAP & warranty included. </span><span onClick={()=>onOpenAuth('reg')} style={{color:R,fontSize:13,fontWeight:600,cursor:'pointer',textDecoration:'underline'}}>Sign up free →</span></div>
        </div>
        <button onClick={()=>setBannerVisible(false)} style={{background:'none',border:'none',cursor:'pointer',color:GL,padding:4}}><X size={16}/></button>
      </div>
    </div>}

    <div style={{maxWidth:1200,margin:'0 auto',padding:'20px 24px'}}>
      {/* Search Bar - CarGurus style */}
      <div style={{background:W,borderRadius:16,padding:20,border:'1px solid #E2E8F0',marginBottom:16,boxShadow:'0 1px 3px rgba(0,0,0,.04)'}}>
        <div style={{display:'flex',gap:10,alignItems:'flex-end',flexWrap:'wrap'}}>
          <Sel label="Make" value={f.make} onChange={v=>{up('make',v);up('model','')}} opts={MAKES} ph="All Makes" flex="1 1 160px"/>
          <Sel label="Model" value={f.model} onChange={v=>up('model',v)} opts={modelOpts} ph={f.make?'All Models':'Select make first'} flex="1 1 160px" disabled={!f.make}/>
          <Inp label="ZIP" value={f.zip} onChange={v=>up('zip',v)} w="90px" ph="ZIP"/>
          <Sel label="Distance" value={f.radius} onChange={v=>up('radius',v)} opts={['25','50','100','200','500']} labels={['25 mi','50 mi','100 mi','200 mi','500 mi']} flex="0 0 100px"/>
          <button onClick={()=>doSearch(0)} style={{height:40,padding:'0 24px',background:R,color:W,border:'none',borderRadius:10,fontSize:14,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:6}}><Search size={15}/>Search</button>
          <button onClick={()=>setShowFilters(!showFilters)} style={{height:40,padding:'0 14px',background:'#F1F5F9',color:DK,border:'1px solid #E2E8F0',borderRadius:10,fontSize:13,fontWeight:500,cursor:'pointer',display:'flex',alignItems:'center',gap:5}}><SlidersHorizontal size={14}/>{showFilters?'Less':'More Filters'}</button>
        </div>
        {showFilters&&<div style={{display:'flex',gap:10,marginTop:14,flexWrap:'wrap',paddingTop:14,borderTop:'1px solid #F1F5F9'}}>
          <Sel label="Min Year" value={f.year_min} onChange={v=>up('year_min',v)} opts={Array.from({length:16},(_,i)=>String(2010+i))} ph="Any" flex="0 0 90px"/>
          <Sel label="Max Year" value={f.year_max} onChange={v=>up('year_max',v)} opts={Array.from({length:16},(_,i)=>String(2010+i))} ph="Any" flex="0 0 90px"/>
          <Sel label="Min Price" value={f.price_min} onChange={v=>up('price_min',v)} opts={['5000','10000','15000','20000','25000','30000']} labels={['$5K','$10K','$15K','$20K','$25K','$30K']} ph="No Min" flex="0 0 90px"/>
          <Sel label="Max Price" value={f.price_max} onChange={v=>up('price_max',v)} opts={['15000','20000','25000','30000','40000','50000','75000','100000']} labels={['$15K','$20K','$25K','$30K','$40K','$50K','$75K','$100K']} ph="No Max" flex="0 0 90px"/>
          <Sel label="Max Miles" value={f.miles_max} onChange={v=>up('miles_max',v)} opts={['25000','50000','75000','100000','150000']} labels={['25K','50K','75K','100K','150K']} ph="Any" flex="0 0 90px"/>
          <Sel label="Body Type" value={f.body_type} onChange={v=>up('body_type',v)} opts={BODIES} ph="All" flex="0 0 110px"/>
          <Sel label="Fuel" value={f.fuel_type} onChange={v=>up('fuel_type',v)} opts={FUELS} ph="All" flex="0 0 100px"/>
        </div>}
      </div>

      {/* Tabs + Count */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
        <div style={{display:'flex',gap:6}}>{[['all','All'],['dealer','🏢 Dealers'],['private','🏠 Private Sellers'],['facebook','📘 Facebook']].map(([k,l])=><button key={k} onClick={()=>{setTab(k);setTimeout(()=>doSearch(0),50)}} style={{padding:'7px 16px',borderRadius:20,border:tab===k?'none':'1px solid #E2E8F0',background:tab===k?DK:W,color:tab===k?W:GR,fontSize:12,fontWeight:600,cursor:'pointer'}}>{l}</button>)}</div>
        <span style={{fontSize:13,color:GR}}>{loading?'Searching...':total.toLocaleString()+' vehicles'}</span>
      </div>

      {/* Results */}
      {loading?<div style={{textAlign:'center',padding:80,color:GR}}><div style={{width:40,height:40,border:'3px solid #E2E8F0',borderTopColor:R,borderRadius:'50%',margin:'0 auto 16px',animation:'spin 1s linear infinite'}}/><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>Searching millions of vehicles...</div>
      :listings.length===0?<div style={{background:W,borderRadius:16,padding:60,textAlign:'center',border:'1px solid #E2E8F0'}}><div style={{fontSize:40,marginBottom:8}}>🔍</div><div style={{fontWeight:700,color:DK,fontSize:18}}>No vehicles found</div><div style={{fontSize:13,color:GR,marginTop:6}}>Try adjusting your search filters or increasing the radius</div></div>
      :<div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16}}>{listings.map((v,i)=>{
        const pm=v.price>0?calcPay(v.price,3000,rate,72):null
        return<div key={v.id||i} onClick={()=>setSel(v)} style={{background:W,borderRadius:14,overflow:'hidden',border:'1px solid #E2E8F0',cursor:'pointer',transition:'box-shadow .15s',boxShadow:'0 1px 3px rgba(0,0,0,.04)'}}>
          <div style={{position:'relative',background:'#1E293B',height:180}}>
            {v.photo?<img src={v.photo} alt="" style={{width:'100%',height:180,objectFit:'cover',display:'block'}} onError={e=>{e.target.style.display='none';e.target.nextSibling&&(e.target.nextSibling.style.display='flex')}}/>:null}
            <div style={{display:v.photo?'none':'flex',position:'absolute',inset:0,alignItems:'center',justifyContent:'center',fontSize:56,background:'#1E293B'}}>🚗</div>
            <div style={{position:'absolute',top:10,left:10}}><span style={{padding:'3px 9px',borderRadius:14,fontSize:10,fontWeight:600,background:v.source==='facebook'?'rgba(24,119,242,.9)':v.seller_type==='private'?'rgba(37,99,235,.9)':'rgba(5,150,105,.85)',color:W,backdropFilter:'blur(4px)'}}>{v.source==='facebook'?'📘 Facebook':v.seller_type==='private'?'Private':'Dealer'}</span></div>
            {v.distance&&<div style={{position:'absolute',top:10,right:10}}><span style={{padding:'3px 8px',borderRadius:14,fontSize:10,fontWeight:500,background:'rgba(0,0,0,.6)',color:W}}><MapPin size={10} style={{verticalAlign:-1}}/> {Math.round(v.distance)} mi</span></div>}
          </div>
          <div style={{padding:16}}>
            <div style={{fontWeight:700,fontSize:15,color:DK,lineHeight:1.3}}>{v.year} {v.make} {v.model}</div>
            {v.trim&&<div style={{fontSize:12,color:GR,marginTop:1}}>{v.trim}</div>}
            <div style={{display:'flex',gap:8,marginTop:6,fontSize:11,color:GL}}>
              <span>{(v.mileage||0).toLocaleString()} mi</span>
              {v.exterior_color&&<><span>·</span><span>{v.exterior_color}</span></>}
              {v.city&&<><span>·</span><span>{v.city}{v.state?', '+v.state:''}</span></>}
            </div>
            {v.dealer_name&&<div style={{fontSize:11,color:GL,marginTop:3}}>{v.dealer_name}</div>}
            <div style={{borderTop:'1px solid #F1F5F9',marginTop:12,paddingTop:12,display:'flex',justifyContent:'space-between',alignItems:'flex-end'}}>
              <div style={{fontSize:22,fontWeight:800,color:R}}>{v.price>0?'$'+v.price.toLocaleString():'Contact'}</div>
              {pm&&session?<div style={{textAlign:'right'}}><div style={{fontSize:10,fontWeight:600,color:GR,letterSpacing:.5}}>EST. MONTHLY</div><div style={{fontSize:16,fontWeight:700,color:DK}}>${pm.tot}/mo</div></div>
              :pm&&!session?<div style={{textAlign:'right'}}><div style={{fontSize:10,color:GL}}>Monthly payment</div><button onClick={e=>{e.stopPropagation();onOpenAuth('reg')}} style={{fontSize:12,color:R,fontWeight:600,background:'none',border:'none',cursor:'pointer',padding:0}}>Sign up to see →</button></div>:null}
            </div>
          </div>
        </div>})}</div>}

      {/* Pagination */}
      {!loading&&listings.length>0&&<div style={{display:'flex',justifyContent:'center',gap:10,margin:'24px 0'}}>
        <PgBtn disabled={page===0} onClick={()=>doSearch(page-1)}><ChevronLeft size={14}/>Prev</PgBtn>
        <span style={{fontSize:13,color:GR,alignSelf:'center'}}>Page {page+1} of {Math.max(1,Math.ceil(total/PER_PAGE))}</span>
        <PgBtn disabled={(page+1)*PER_PAGE>=total} onClick={()=>doSearch(page+1)}>Next<ChevronRight size={14}/></PgBtn>
      </div>}
    </div>
  </div>)
}

function Header({session,profile,onOpenAuth,onOpenPortal,onLogout}){
  return<div style={{background:W,borderBottom:'1px solid #E2E8F0',position:'sticky',top:0,zIndex:50}}>
    <div style={{maxWidth:1200,margin:'0 auto',padding:'10px 24px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
      <div style={{display:'flex',alignItems:'center',gap:8}}><Logo sz={22}/><span style={{fontSize:13,fontWeight:800,letterSpacing:2.5,textTransform:'uppercase',color:DK}}>Car <span style={{color:R}}>Capitol</span></span></div>
      <div style={{display:'flex',gap:8,alignItems:'center'}}>
        {session&&profile?<>
          <span style={{fontSize:12,color:GR}}>{profile.full_name||profile.email}</span>
          <button onClick={onOpenPortal} style={{padding:'6px 14px',background:DK,color:W,border:'none',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer'}}>My Dashboard</button>
          <button onClick={onLogout} style={{padding:'6px 14px',background:'#F1F5F9',color:GR,border:'1px solid #E2E8F0',borderRadius:8,fontSize:12,cursor:'pointer'}}>Sign Out</button>
        </>:<>
          <button onClick={()=>onOpenAuth('login')} style={{padding:'6px 14px',background:'#F1F5F9',color:DK,border:'1px solid #E2E8F0',borderRadius:8,fontSize:12,fontWeight:500,cursor:'pointer'}}>Sign In</button>
          <button onClick={()=>onOpenAuth('reg')} style={{padding:'6px 14px',background:R,color:W,border:'none',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer'}}>Sign Up Free</button>
        </>}
      </div>
    </div>
  </div>
}

function Sel({label,value,onChange,opts,labels,ph,flex,disabled}){
  return<div style={{display:'flex',flexDirection:'column',gap:3,flex:flex||'auto'}}>
    {label&&<label style={{fontSize:10,fontWeight:600,color:GR,letterSpacing:.5}}>{label}</label>}
    <select value={value} onChange={e=>onChange(e.target.value)} disabled={disabled} style={{height:40,padding:'0 10px',borderRadius:10,border:'1px solid #E2E8F0',fontSize:13,color:value?DK:GL,background:W,cursor:'pointer',appearance:'auto'}}>
      <option value="">{ph||'Any'}</option>
      {opts.map((o,i)=><option key={o} value={o}>{labels?labels[i]:o}</option>)}
    </select>
  </div>
}

function Inp({label,value,onChange,w,ph}){
  return<div style={{display:'flex',flexDirection:'column',gap:3,flex:w?'0 0 '+w:'auto'}}>
    {label&&<label style={{fontSize:10,fontWeight:600,color:GR,letterSpacing:.5}}>{label}</label>}
    <input value={value} onChange={e=>onChange(e.target.value)} placeholder={ph} style={{height:40,padding:'0 10px',borderRadius:10,border:'1px solid #E2E8F0',fontSize:13,color:DK}}/>
  </div>
}

function PgBtn({children,disabled,onClick}){
  return<button disabled={disabled} onClick={onClick} style={{display:'flex',alignItems:'center',gap:4,padding:'8px 16px',borderRadius:8,border:'1px solid #E2E8F0',background:W,color:disabled?GL:DK,fontSize:12,fontWeight:500,cursor:disabled?'not-allowed':'pointer',opacity:disabled?.5:1}}>{children}</button>
}
