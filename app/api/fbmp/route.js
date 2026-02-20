import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const APIFY_TOKEN = process.env.APIFY_API_TOKEN
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const ACTOR_ID = 'curious_coder~facebook-marketplace'

// Southwest cities for scraping
const DEFAULT_URLS = [
  'https://www.facebook.com/marketplace/la/vehicles',
  'https://www.facebook.com/marketplace/san-diego/vehicles',
  'https://www.facebook.com/marketplace/phoenix/vehicles',
  'https://www.facebook.com/marketplace/tucson/vehicles',
  'https://www.facebook.com/marketplace/las-cruces-nm/vehicles',
  'https://www.facebook.com/marketplace/albuquerque/vehicles',
  'https://www.facebook.com/marketplace/el-paso-tx/vehicles',
  'https://www.facebook.com/marketplace/lubbock-tx/vehicles',
  'https://www.facebook.com/marketplace/midland-tx/vehicles',
  'https://www.facebook.com/marketplace/laredo-tx/vehicles',
  'https://www.facebook.com/marketplace/san-antonio/vehicles',
  'https://www.facebook.com/marketplace/austin/vehicles',
  'https://www.facebook.com/marketplace/houston/vehicles',
  'https://www.facebook.com/marketplace/dallas/vehicles',
]

// POST /api/fbmp - Trigger a new scrape and store results
export async function POST(request) {
  if (!APIFY_TOKEN) {
    return NextResponse.json({ error: 'APIFY_API_TOKEN not configured' }, { status: 500 })
  }

  const body = await request.json().catch(() => ({}))
  const maxItems = body.maxItems || 500
  const urls = body.urls || DEFAULT_URLS

  try {
    // Start the actor run
    const runRes = await fetch(
      `https://api.apify.com/v2/acts/${ACTOR_ID}/runs?token=${APIFY_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startUrls: urls.map(u => ({ url: u })),
          maxItems: maxItems,
        })
      }
    )

    if (!runRes.ok) {
      const err = await runRes.text()
      return NextResponse.json({ error: 'Apify run failed to start', detail: err }, { status: 500 })
    }

    const run = await runRes.json()
    const runId = run.data?.id

    // Wait for completion (poll every 5s, max 3 minutes)
    let status = 'RUNNING'
    let attempts = 0
    while ((status === 'RUNNING' || status === 'READY') && attempts < 36) {
      await new Promise(r => setTimeout(r, 5000))
      const sRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_TOKEN}`)
      const sData = await sRes.json()
      status = sData.data?.status || 'FAILED'
      attempts++
    }

    if (status !== 'SUCCEEDED') {
      return NextResponse.json({ error: 'Scrape did not complete', status, runId }, { status: 500 })
    }

    // Fetch results
    const datasetId = run.data?.defaultDatasetId
    const dataRes = await fetch(
      `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}&format=json`
    )
    const items = await dataRes.json()

    // Process and store
    const result = await storeListings(items)
    return NextResponse.json({ message: 'Scrape complete', runId, ...result })

  } catch (err) {
    console.error('FBMP scrape error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// GET /api/fbmp - Fetch stored FB marketplace listings from Supabase
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const make = searchParams.get('make') || ''
  const model = searchParams.get('model') || ''
  const priceMax = searchParams.get('price_max') || ''
  const city = searchParams.get('city') || ''
  const rows = parseInt(searchParams.get('rows') || '24')
  const start = parseInt(searchParams.get('start') || '0')

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

  let query = supabase
    .from('marketplace_listings')
    .select('*', { count: 'exact' })
    .eq('status', 'Available')
    .order('created_at', { ascending: false })
    .range(start, start + rows - 1)

  if (make) query = query.ilike('make', make)
  if (model) query = query.ilike('model', `%${model}%`)
  if (priceMax) query = query.lte('price', parseInt(priceMax))
  if (city) query = query.ilike('city', `%${city}%`)

  const { data, count, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Format for the frontend (same shape as MarketCheck listings)
  const listings = (data || []).map(l => ({
    id: 'fb_' + l.id,
    vin: null,
    year: l.year,
    make: l.make,
    model: l.model,
    trim: l.trim || '',
    price: l.price || 0,
    mileage: l.mileage || 0,
    exterior_color: '',
    body_type: l.body_type || '',
    fuel_type: '',
    city: l.city || '',
    state: l.state || '',
    photo: l.photo_url || null,
    photos: l.photo_url ? [l.photo_url] : [],
    seller_type: l.seller_type === 'dealer_on_marketplace' ? 'dealer' : 'private',
    dealer_name: l.seller_type === 'dealer_on_marketplace' ? (l.seller_name || 'Dealer') : null,
    source_url: l.source_url,
    source: 'facebook',
    distance: null,
  }))

  return NextResponse.json({ total: count || 0, listings })
}


// ═══ HELPERS ═══

async function storeListings(items) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
  let inserted = 0, skipped = 0, errors = 0

  for (const item of items) {
    // Skip non-live, sold, or pending items
    if (item.is_sold || item.is_pending || item.is_hidden) { skipped++; continue }

    // Parse title: "2020 Ford Fusion" or "2008 Ford Aerostar Passenger · Extended Minivan"
    const title = item.marketplace_listing_title || item.custom_title || ''
    const parsed = parseVehicleTitle(title)
    if (!parsed) { skipped++; continue }

    // Parse price
    const price = parseFloat(item.listing_price?.amount || '0')
    if (price <= 0) { skipped++; continue }

    // Parse mileage from subtitles: "93K miles"
    let mileage = 0
    const subs = item.custom_sub_titles_with_rendering_flags || []
    if (subs.length > 0) {
      mileage = parseMileage(subs[0].subtitle || '')
    }

    // Location
    const city = item.location?.reverse_geocode?.city || ''
    const state = item.location?.reverse_geocode?.state || ''

    // Photo
    const photo = item.primary_listing_photo?.listing_image?.uri || null

    // Source URL
    const sourceUrl = item.listingUrl || `https://www.facebook.com/marketplace/item/${item.id}`

    // Which input URL (tells us the market)
    const inputUrl = item.inputUrl || ''

    const record = {
      source_id: 'fb_' + item.id,
      year: parsed.year,
      make: parsed.make,
      model: parsed.model,
      trim: parsed.trim || null,
      price: Math.round(price),
      mileage: mileage,
      city: city,
      state: state,
      photo_url: photo,
      source: 'facebook_marketplace',
      source_url: sourceUrl,
      seller_type: 'private', // Default - could enhance with dealer detection
      seller_name: null, // FB no longer exposes seller info
      seller_location: city + (state ? ', ' + state : ''),
      status: 'Available',
      body_type: parsed.bodyType || null,
      description: title,
    }

    const { error } = await supabase
      .from('marketplace_listings')
      .upsert(record, { onConflict: 'source_id', ignoreDuplicates: true })

    if (!error) inserted++
    else { errors++; console.error('Insert error:', error.message) }
  }

  return { total: items.length, inserted, skipped, errors }
}

function parseVehicleTitle(title) {
  if (!title) return null

  // Clean up: remove " · " separator used in FB titles
  const clean = title.replace(/\s+·\s+/g, ' ').trim()

  // Match "2020 Ford Fusion" or "2008 Ford Aerostar Passenger Extended Minivan"
  const match = clean.match(/^(\d{4})\s+([A-Za-z][A-Za-z-]+)\s+(.+)$/)
  if (!match) return null

  const year = parseInt(match[1])
  if (year < 1990 || year > 2027) return null

  const make = capitalize(match[2].trim())
  let rest = match[3].trim()

  // Try to separate model from body type
  let model = rest
  let trim = ''
  let bodyType = null

  // Common body type keywords
  const bodyTypes = ['sedan', 'suv', 'truck', 'coupe', 'van', 'minivan', 'wagon', 'convertible', 'hatchback', 'cab', 'pickup']
  const lower = rest.toLowerCase()
  for (const bt of bodyTypes) {
    if (lower.includes(bt)) {
      bodyType = capitalize(bt)
      break
    }
  }

  // Take first 1-2 words as model
  const words = rest.split(/\s+/)
  if (words.length === 1) {
    model = words[0]
  } else if (words.length === 2) {
    model = words[0] + ' ' + words[1]
  } else {
    model = words[0]
    trim = words.slice(1).join(' ')
  }

  // Filter out non-car vehicles (motorcycles, ATVs, bikes, boats)
  const nonCar = ['yamaha', 'harley', 'kawasaki', 'suzuki', 'ducati', 'specialized', 'trek', 'giant', 'cannondale', 'haro', 'polaris', 'arctic cat', 'sea-doo', 'jet ski']
  if (nonCar.includes(make.toLowerCase())) return null

  return { year, make, model: capitalize(model), trim, bodyType }
}

function parseMileage(str) {
  if (!str) return 0
  // Handle "93K miles", "190K miles", "11K miles"
  const match = str.match(/([\d,.]+)\s*K?\s*miles?/i)
  if (!match) return 0
  let num = parseFloat(match[1].replace(/,/g, ''))
  if (str.toLowerCase().includes('k')) num *= 1000
  return Math.round(num)
}

function capitalize(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}
