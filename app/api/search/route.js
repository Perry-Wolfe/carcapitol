import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const MC_KEY = process.env.MARKETCHECK_API_KEY
const MC_BASE = 'https://api.marketcheck.com/v2'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'all' // 'all', 'dealer', 'fsbo', 'facebook'
  const make = searchParams.get('make') || ''
  const model = searchParams.get('model') || ''
  const yearMin = searchParams.get('year_min') || ''
  const yearMax = searchParams.get('year_max') || ''
  const priceMin = searchParams.get('price_min') || ''
  const priceMax = searchParams.get('price_max') || ''
  const milesMax = searchParams.get('miles_max') || ''
  const bodyType = searchParams.get('body_type') || ''
  const fuelType = searchParams.get('fuel_type') || ''
  const zip = searchParams.get('zip') || '90001'
  const radius = searchParams.get('radius') || '50'
  const rows = parseInt(searchParams.get('rows') || '24')
  const start = parseInt(searchParams.get('start') || '0')
  const sort = searchParams.get('sort_by') || 'price'
  const order = searchParams.get('sort_order') || 'asc'

  const promises = []

  // ═══ MARKETCHECK (dealers + fsbo) ═══
  if (type !== 'facebook') {
    // Dealer listings
    if (type === 'all' || type === 'dealer') {
      promises.push(fetchMarketCheck('dealer', { make, model, yearMin, yearMax, priceMin, priceMax, milesMax, bodyType, fuelType, zip, radius, rows, start, sort, order }))
    }
    // Private party (Craigslist etc)
    if (type === 'all' || type === 'fsbo') {
      const fsboRows = type === 'all' ? Math.min(8, rows) : rows
      promises.push(fetchMarketCheck('fsbo', { make, model, yearMin, yearMax, priceMin, priceMax, milesMax, bodyType, fuelType, zip, radius, rows: fsboRows, start, sort, order }))
    }
  }

  // ═══ FACEBOOK MARKETPLACE (from Supabase) ═══
  if (type === 'all' || type === 'fsbo' || type === 'facebook') {
    promises.push(fetchFacebookListings({ make, model, yearMin, yearMax, priceMin, priceMax, milesMax, rows, start }))
  }

  try {
    const results = await Promise.all(promises)

    // Merge all listings
    let allListings = []
    let totalCount = 0
    for (const r of results) {
      allListings = allListings.concat(r.listings || [])
      totalCount += r.total || 0
    }

    // Deduplicate by VIN (if available) or by id
    const seen = new Set()
    const deduped = []
    for (const l of allListings) {
      const key = l.vin || l.id
      if (!seen.has(key)) {
        seen.add(key)
        deduped.push(l)
      }
    }

    // Sort merged results
    deduped.sort((a, b) => {
      const av = sort === 'price' ? (a.price || 999999) : sort === 'miles' ? (a.mileage || 999999) : (a.year || 0)
      const bv = sort === 'price' ? (b.price || 999999) : sort === 'miles' ? (b.mileage || 999999) : (b.year || 0)
      return order === 'asc' ? av - bv : bv - av
    })

    return NextResponse.json({
      listings: deduped.slice(0, rows),
      total: totalCount,
      sources: results.map(r => ({ source: r.source, count: r.listings?.length || 0 }))
    })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ listings: [], total: 0, error: error.message }, { status: 500 })
  }
}

// ═══════════════════════════════════════════════════════════
// MARKETCHECK FETCH
// ═══════════════════════════════════════════════════════════
async function fetchMarketCheck(sellerType, params) {
  if (!MC_KEY) {
    return { source: sellerType, listings: [], total: 0, error: 'MARKETCHECK_API_KEY not set' }
  }

  const p = new URLSearchParams({
    api_key: MC_KEY,
    rows: String(params.rows),
    start: String(params.start),
    sort_by: params.sort,
    sort_order: params.order,
    zip: params.zip,
    radius: params.radius,
    seller_type: sellerType, // 'dealer' or 'fsbo'
  })

  if (params.make) p.set('make', params.make)
  if (params.model) p.set('model', params.model)
  if (params.yearMin) p.set('year_min', params.yearMin)
  if (params.yearMax) p.set('year_max', params.yearMax)
  if (params.priceMin) p.set('price_min', params.priceMin)
  if (params.priceMax) p.set('price_max', params.priceMax)
  if (params.milesMax) p.set('miles_max', params.milesMax)
  if (params.bodyType) p.set('body_type', params.bodyType.toLowerCase())
  if (params.fuelType) p.set('fuel_type', params.fuelType.toLowerCase())

  try {
    const url = `${MC_BASE}/search/car/active?${p}`
    const res = await fetch(url, { next: { revalidate: 60 } })
    if (!res.ok) {
      const text = await res.text()
      console.error(`MarketCheck ${sellerType} error:`, res.status, text)
      return { source: sellerType, listings: [], total: 0 }
    }
    const data = await res.json()
    const listings = (data.listings || []).map(l => ({
      id: l.id || l.vin,
      vin: l.vin,
      source: 'marketcheck',
      seller_type: sellerType === 'fsbo' ? 'private' : 'dealer',
      year: l.build?.year || l.year,
      make: l.build?.make || l.make,
      model: l.build?.model || l.model,
      trim: l.build?.trim || l.trim,
      price: l.price ? parseInt(l.price) : 0,
      mileage: l.miles ? parseInt(l.miles) : 0,
      exterior_color: l.exterior_color,
      interior_color: l.interior_color,
      fuel_type: l.build?.fuel_type || l.fuel_type,
      transmission: l.build?.transmission || l.transmission,
      body_type: l.build?.body_type || l.body_type,
      drivetrain: l.build?.drivetrain || l.drivetrain,
      engine: l.build?.engine,
      city: l.dealer?.city || l.city,
      state: l.dealer?.state || l.state,
      zip: l.dealer?.zip || l.zip,
      distance: l.dist,
      dealer_name: sellerType === 'dealer' ? (l.dealer?.name || l.dealer?.dealer_name) : null,
      dealer_phone: l.dealer?.phone,
      photo: l.media?.photo_links?.[0] || null,
      photos: l.media?.photo_links || [],
      source_url: l.vdp_url,
      created_at: l.first_seen_at_date,
    }))
    return { source: sellerType, listings, total: data.num_found || listings.length }
  } catch (e) {
    console.error(`MarketCheck ${sellerType} fetch error:`, e)
    return { source: sellerType, listings: [], total: 0 }
  }
}

// ═══════════════════════════════════════════════════════════
// FACEBOOK MARKETPLACE FETCH (from Supabase)
// ═══════════════════════════════════════════════════════════
async function fetchFacebookListings(params) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return { source: 'facebook', listings: [], total: 0, error: 'Supabase not configured' }
  }

  try {
    const sb = createClient(SUPABASE_URL, SUPABASE_KEY)
    let q = sb.from('fb_listings').select('*', { count: 'exact' })

    if (params.make) q = q.ilike('make', `%${params.make}%`)
    if (params.model) q = q.ilike('model', `%${params.model}%`)
    if (params.yearMin) q = q.gte('year', parseInt(params.yearMin))
    if (params.yearMax) q = q.lte('year', parseInt(params.yearMax))
    if (params.priceMin) q = q.gte('price', parseInt(params.priceMin))
    if (params.priceMax) q = q.lte('price', parseInt(params.priceMax))
    if (params.milesMax) q = q.lte('mileage', parseInt(params.milesMax))

    q = q.order('created_at', { ascending: false }).range(params.start, params.start + params.rows - 1)

    const { data, count, error } = await q
    if (error) {
      console.error('Supabase FB error:', error)
      return { source: 'facebook', listings: [], total: 0 }
    }

    const listings = (data || []).map(l => ({
      id: 'fb_' + l.id,
      source: 'facebook',
      seller_type: 'private',
      year: l.year,
      make: l.make,
      model: l.model,
      trim: l.trim,
      price: l.price || 0,
      mileage: l.mileage || 0,
      exterior_color: l.exterior_color,
      fuel_type: l.fuel_type,
      transmission: l.transmission,
      body_type: l.body_type,
      city: l.city,
      state: l.state,
      photo: l.photo,
      photos: l.photos || (l.photo ? [l.photo] : []),
      source_url: l.url,
      created_at: l.created_at,
    }))

    return { source: 'facebook', listings, total: count || listings.length }
  } catch (e) {
    console.error('Facebook fetch error:', e)
    return { source: 'facebook', listings: [], total: 0 }
  }
}
