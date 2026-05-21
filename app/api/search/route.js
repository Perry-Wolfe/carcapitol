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
    const deduped = allListings.filter(l => {
      const key = l.vin || l.id
      if (!key) return true
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    // Sort merged results
    deduped.sort((a, b) => {
      if (sort === 'price') {
        const pa = a.price || 0, pb = b.price || 0
        return order === 'asc' ? pa - pb : pb - pa
      }
      if (sort === 'miles') {
        const ma = a.mileage || 0, mb = b.mileage || 0
        return order === 'asc' ? ma - mb : mb - ma
      }
      if (sort === 'year') {
        const ya = a.year || 0, yb = b.year || 0
        return order === 'asc' ? ya - yb : yb - ya
      }
      return 0
    })

    // Trim to requested page size
    const paged = deduped.slice(0, rows)

    return NextResponse.json({
      total: totalCount,
      listings: paged,
    })

  } catch (err) {
    console.error('Search error:', err)
    return NextResponse.json({ error: 'Search failed', detail: err.message }, { status: 500 })
  }
}


// ═══ MARKETCHECK FETCH ═══

async function fetchMarketCheck(listingType, filters) {
  const { make, model, yearMin, yearMax, priceMin, priceMax, milesMax, bodyType, fuelType, zip, radius, rows, start, sort, order } = filters

  const endpoint = listingType === 'fsbo'
    ? `${MC_BASE}/search/car/fsbo/active`
    : `${MC_BASE}/search/car/active`

  const params = new URLSearchParams()
  params.set('api_key', MC_KEY)
  params.set('rows', String(rows))
  params.set('start', String(start))
  params.set('sort_by', sort)
  params.set('sort_order', order)
  params.set('include_relevant_links', 'false')

  if (make) params.set('make', make)
  if (model) params.set('model', model)
  if (yearMin || yearMax) params.set('year_range', (yearMin || '2000') + '-' + (yearMax || '2026'))
  if (priceMin || priceMax) params.set('price_range', (priceMin || '0') + '-' + (priceMax || '999999'))
  if (milesMax) params.set('miles_range', '0-' + milesMax)
  if (bodyType) params.set('body_type', bodyType)
  if (fuelType) params.set('fuel_type', fuelType)
  if (zip) { params.set('zip', zip); params.set('radius', radius) }
  if (listingType !== 'fsbo') params.set('car_type', 'used')

  try {
    const res = await fetch(`${endpoint}?${params.toString()}`, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 3600 }
    })

    if (!res.ok) {
      console.error('MarketCheck error:', res.status)
      return { total: 0, listings: [] }
    }

    const data = await res.json()

    const listings = (data.listings || []).map(l => ({
      id: l.id,
      vin: l.vin,
      year: l.build?.year || l.year,
      make: l.build?.make || l.make,
      model: l.build?.model || l.model,
      trim: l.build?.trim || l.trim || '',
      price: l.price || 0,
      mileage: l.miles || l.mileage || 0,
      exterior_color: l.exterior_color || l.build?.exterior_color || '',
      interior_color: l.interior_color || '',
      body_type: l.build?.body_type || '',
      fuel_type: l.build?.fuel_type || '',
      drivetrain: l.build?.drivetrain || '',
      engine: l.build?.engine || '',
      transmission: l.build?.transmission || '',
      city: l.dealer?.city || '',
      state: l.dealer?.state || '',
      zip: l.dealer?.zip || '',
      photo: l.media?.photo_links?.[0] || l.media?.cached_photo_links?.[0] || null,
      photos: l.media?.photo_links || l.media?.cached_photo_links || [],
      seller_type: listingType === 'fsbo' ? 'private' : 'dealer',
      dealer_name: l.dealer?.name || null,
      source_url: l.vdp_url || l.ref_url || null,
      source: listingType === 'fsbo' ? 'private' : 'dealer',
      distance: l.dist || null,
      days_on_market: l.dom || l.dom_active || null,
    }))

    return { total: data.num_found || 0, listings }
  } catch (err) {
    console.error('MarketCheck fetch error:', err)
    return { total: 0, listings: [] }
  }
}


// ═══ FACEBOOK MARKETPLACE FETCH (from Supabase) ═══

async function fetchFacebookListings(filters) {
  const { make, model, yearMin, yearMax, priceMin, priceMax, milesMax, rows, start } = filters

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

    let query = supabase
      .from('marketplace_listings')
      .select('*', { count: 'exact' })
      .eq('status', 'Available')
      .order('created_at', { ascending: false })
      .range(start, start + rows - 1)

    if (make) query = query.ilike('make', make)
    if (model) query = query.ilike('model', `%${model}%`)
    if (yearMin) query = query.gte('year', parseInt(yearMin))
    if (yearMax) query = query.lte('year', parseInt(yearMax))
    if (priceMin) query = query.gte('price', parseInt(priceMin))
    if (priceMax) query = query.lte('price', parseInt(priceMax))
    if (milesMax) query = query.lte('mileage', parseInt(milesMax))

    const { data, count, error } = await query

    if (error) {
      console.error('Supabase FB query error:', error.message)
      return { total: 0, listings: [] }
    }

    const listings = (data || []).map(l => ({
      id: 'fb_' + l.id,
      vin: null,
      year: l.year,
      make: l.make,
      model: l.model,
      trim: l.trim || '',
      price: l.price || 0,
      mileage: l.mileage || 0,
      exterior_color: l.color_exterior || '',
      body_type: l.body_type || '',
      fuel_type: l.fuel_type || '',
      city: l.city || '',
      state: l.state || '',
      photo: l.photo_url || null,
      photos: l.photo_url ? [l.photo_url] : [],
      seller_type: 'private',
      dealer_name: null,
      source_url: l.source_url,
      source: 'facebook',
      distance: null,
    }))

    return { total: count || 0, listings }
  } catch (err) {
    console.error('FB listings fetch error:', err)
    return { total: 0, listings: [] }
  }
}
