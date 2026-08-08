import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, key)
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ vin: string }> }
) {
  const { vin } = await params

  if (!vin || vin.length !== 17) {
    return NextResponse.json({ error: 'VIN must be exactly 17 characters' }, { status: 400 })
  }

  const vinUpper = vin.toUpperCase()

  // 1. Check Supabase cache first
  const supabase = createServiceClient()
  const { data: cached } = await supabase
    .from('vin_cache')
    .select('*')
    .eq('vin', vinUpper)
    .single()

  if (cached) {
    return NextResponse.json({ success: true, data: cached.decoded_data, source: 'cache' })
  }

  // 2. Call NHTSA free API
  try {
    const res = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/${vinUpper}?format=json`,
      { next: { revalidate: 86400 } }
    )

    if (!res.ok) {
      return NextResponse.json({ error: 'NHTSA API unavailable' }, { status: 503 })
    }

    const json = await res.json()
    const r = json?.Results?.[0]

    if (!r || !r.Make) {
      return NextResponse.json({ error: 'VIN not found in database' }, { status: 404 })
    }

    const decoded = {
      vin: vinUpper,
      make: r.Make || null,
      model: r.Model || null,
      year: r.ModelYear ? parseInt(r.ModelYear) : null,
      trim: r.Trim || null,
      engine: r.DisplacementL
        ? `${parseFloat(r.DisplacementL).toFixed(1)}L ${r.EngineCylinders ? r.EngineCylinders + '-cyl' : ''}`
        : r.EngineModel || null,
      fuel_type: r.FuelTypePrimary || null,
      transmission: r.TransmissionStyle || null,
      body_type: r.BodyClass || null,
      drive_type: r.DriveType || null,
      country: r.PlantCountry || null,
      manufacturer: r.Manufacturer || null,
    }

    // 3. Cache result in Supabase
    await supabase.from('vin_cache').upsert({
      vin: vinUpper,
      decoded_data: decoded,
      source: 'nhtsa',
      cached_at: new Date().toISOString(),
    }, { onConflict: 'vin' })

    return NextResponse.json({ success: true, data: decoded, source: 'nhtsa' })
  } catch (err) {
    console.error('[VIN API] Error:', err)
    return NextResponse.json({ error: 'Failed to decode VIN' }, { status: 500 })
  }
}
