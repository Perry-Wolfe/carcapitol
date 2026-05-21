import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const APIFY_TOKEN = process.env.APIFY_API_TOKEN

// Apify Facebook Marketplace scraper actor
const APIFY_ACTOR = 'apify~facebook-marketplace-scraper'

const SOUTHWEST_CITIES = [
  { city: 'Phoenix', state: 'AZ', fb_url: 'https://www.facebook.com/marketplace/phoenix/vehicles' },
  { city: 'Tucson', state: 'AZ', fb_url: 'https://www.facebook.com/marketplace/tucson/vehicles' },
  { city: 'Las Vegas', state: 'NV', fb_url: 'https://www.facebook.com/marketplace/lasvegas/vehicles' },
  { city: 'Reno', state: 'NV', fb_url: 'https://www.facebook.com/marketplace/reno/vehicles' },
  { city: 'Albuquerque', state: 'NM', fb_url: 'https://www.facebook.com/marketplace/albuquerque/vehicles' },
  { city: 'Santa Fe', state: 'NM', fb_url: 'https://www.facebook.com/marketplace/santafe/vehicles' },
  { city: 'El Paso', state: 'TX', fb_url: 'https://www.facebook.com/marketplace/elpaso/vehicles' },
  { city: 'Dallas', state: 'TX', fb_url: 'https://www.facebook.com/marketplace/dallas/vehicles' },
  { city: 'Houston', state: 'TX', fb_url: 'https://www.facebook.com/marketplace/houston/vehicles' },
  { city: 'Austin', state: 'TX', fb_url: 'https://www.facebook.com/marketplace/austin/vehicles' },
  { city: 'San Antonio', state: 'TX', fb_url: 'https://www.facebook.com/marketplace/sanantonio/vehicles' },
  { city: 'Salt Lake City', state: 'UT', fb_url: 'https://www.facebook.com/marketplace/saltlakecity/vehicles' },
  { city: 'Denver', state: 'CO', fb_url: 'https://www.facebook.com/marketplace/denver/vehicles' },
  { city: 'Colorado Springs', state: 'CO', fb_url: 'https://www.facebook.com/marketplace/coloradosprings/vehicles' },
]

// ═══════════════════════════════════════════════════════════
// POST: Trigger a fresh Facebook Marketplace scrape
// ═══════════════════════════════════════════════════════════
export async function POST(request) {
  if (!APIFY_TOKEN) {
    return NextResponse.json({ error: 'APIFY_API_TOKEN not configured' }, { status: 500 })
  }
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  try {
    // Trigger Apify run
    const runRes = await fetch(`https://api.apify.com/v2/acts/${APIFY_ACTOR}/runs?token=${APIFY_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startUrls: SOUTHWEST_CITIES.map(c => ({ url: c.fb_url })),
        resultsPerPage: 50,
        maxItems: 700,
      }),
    })

    if (!runRes.ok) {
      const text = await runRes.text()
      return NextResponse.json({ error: 'Apify run failed', detail: text }, { status: 500 })
    }

    const runData = await runRes.json()
    const runId = runData.data?.id

    // Wait for run to complete (poll up to ~3 min)
    let status = 'RUNNING'
    let attempts = 0
    let datasetId = null
    while (status === 'RUNNING' && attempts < 36) {
      await new Promise(r => setTimeout(r, 5000))
      const statusRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_TOKEN}`)
      const statusData = await statusRes.json()
      status = statusData.data?.status
      datasetId = statusData.data?.defaultDatasetId
      attempts++
    }

    if (status !== 'SUCCEEDED' || !datasetId) {
      return NextResponse.json({ error: 'Apify run did not complete', status }, { status: 500 })
    }

    // Fetch dataset
    const dataRes = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}&format=json`)
    const items = await dataRes.json()

    // Transform and store
    const sb = createClient(SUPABASE_URL, SUPABASE_KEY)
    const rows = items.map(parseListing).filter(Boolean)

    // Upsert by url to dedupe
    const { error } = await sb.from('fb_listings').upsert(rows, { onConflict: 'url' })
    if (error) {
      return NextResponse.json({ error: 'Supabase insert failed', detail: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, scraped: items.length, stored: rows.length })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// ═══════════════════════════════════════════════════════════
// GET: List stored Facebook Marketplace listings
// ═══════════════════════════════════════════════════════════
export async function GET(request) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ listings: [], total: 0 })
  }
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '50')

  try {
    const sb = createClient(SUPABASE_URL, SUPABASE_KEY)
    const { data, count, error } = await sb
      .from('fb_listings')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      return NextResponse.json({ listings: [], total: 0, error: error.message })
    }
    return NextResponse.json({ listings: data || [], total: count || 0 })
  } catch (e) {
    return NextResponse.json({ listings: [], total: 0, error: e.message })
  }
}

// ═══════════════════════════════════════════════════════════
// Parse Apify FB Marketplace listing → our schema
// ═══════════════════════════════════════════════════════════
function parseListing(item) {
  if (!item || !item.url) return null

  // Extract year/make/model from title
  const title = item.title || item.name || ''
  const yearMatch = title.match(/\b(19|20)\d{2}\b/)
  const year = yearMatch ? parseInt(yearMatch[0]) : null

  // Common makes for parsing
  const MAKES = ['Toyota','Honda','Ford','Chevrolet','Chevy','GMC','Ram','RAM','Dodge','Jeep','Nissan','Hyundai','Kia','Mazda','Subaru','Volkswagen','VW','BMW','Mercedes','Audi','Lexus','Acura','Infiniti','Tesla','Cadillac','Buick','Lincoln','Chrysler','Mitsubishi','Volvo','Porsche','Jaguar','Land Rover','Mini','Fiat']
  let make = null, model = null
  for (const m of MAKES) {
    const re = new RegExp(`\\b${m}\\b`, 'i')
    if (re.test(title)) {
      make = m === 'Chevy' ? 'Chevrolet' : m === 'VW' ? 'Volkswagen' : m === 'RAM' ? 'Ram' : m
      // Model is what comes after the make
      const afterMake = title.split(re)[1] || ''
      model = afterMake.trim().split(/\s+/).slice(0, 2).join(' ').replace(/[^\w\-]/g, '')
      break
    }
  }

  // Price
  let price = null
  if (item.price) {
    if (typeof item.price === 'number') price = item.price
    else if (typeof item.price === 'string') {
      const m = item.price.replace(/[^\d]/g, '')
      if (m) price = parseInt(m)
    } else if (item.price.amount) price = parseInt(item.price.amount)
  }

  // Mileage
  let mileage = null
  const milesMatch = (title + ' ' + (item.description || '')).match(/(\d{1,3}[,\s]?\d{3})\s*(?:mi|miles|k)/i)
  if (milesMatch) mileage = parseInt(milesMatch[1].replace(/[,\s]/g, ''))

  // Location
  let city = item.location?.city || item.city || null
  let state = item.location?.state || item.state || null
  if (!city && item.location?.reverse_geocode_detailed?.city) city = item.location.reverse_geocode_detailed.city
  if (!state && item.location?.reverse_geocode_detailed?.state) state = item.location.reverse_geocode_detailed.state

  // Photos
  const photos = item.images || item.photos || (item.image ? [item.image] : [])
  const photo = photos[0] || item.primary_listing_photo?.image?.uri || null

  return {
    url: item.url,
    title: title.substring(0, 200),
    year, make, model,
    price: price || 0,
    mileage,
    description: (item.description || '').substring(0, 1000),
    city, state,
    photo, photos: photos.slice(0, 10),
    created_at: item.creation_time ? new Date(item.creation_time * 1000).toISOString() : new Date().toISOString(),
  }
}
