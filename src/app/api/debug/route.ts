import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [makes, categories, parts] = await Promise.all([
    supabase.from('vehicle_makes').select('id, name').limit(5),
    supabase.from('part_categories').select('id, name, slug').limit(5),
    supabase.from('spare_parts').select('id, name, is_featured, is_active').limit(5),
  ])

  return NextResponse.json({
    makes: { data: makes.data, error: makes.error?.message, count: makes.data?.length },
    categories: { data: categories.data, error: categories.error?.message, count: categories.data?.length },
    parts: { data: parts.data, error: parts.error?.message, count: parts.data?.length },
  })
}
