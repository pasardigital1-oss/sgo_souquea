import { createClient } from './server'
import { createServiceClient } from './server'
import type { CatalogFilters } from '@/types'

const ITEMS_PER_PAGE = 20

// =============================================
// CATALOG QUERIES
// =============================================

export async function getProducts(filters: CatalogFilters = {}) {
  const supabase = await createClient()
  const page = filters.page || 1
  const from = (page - 1) * ITEMS_PER_PAGE
  const to = from + ITEMS_PER_PAGE - 1

  let query = supabase
    .from('spare_parts')
    .select(`
      *,
      vendors!inner(id, business_name, business_name_ar, rating, emirate, status),
      part_categories(id, name, name_ar, slug),
      inventory(id, price_aed, quantity, emirate, vendor_id)
    `, { count: 'exact' })
    .eq('is_active', true)
    .eq('vendors.status', 'approved')

  // Filters
  if (filters.q) {
    query = query.textSearch('search_vector', filters.q, { type: 'websearch' })
  }

  if (filters.category) {
    const { data: catData } = await supabase
      .from('part_categories')
      .select('id')
      .eq('slug', filters.category)
      .single()
    if (catData) query = query.eq('category_id', catData.id)
  }

  if (filters.brand) {
    query = query.ilike('brand', `%${filters.brand}%`)
  }

  if (filters.part_type) {
    query = query.eq('part_type', filters.part_type)
  }

  if (filters.make) {
    const { data: makeData } = await supabase
      .from('vehicle_makes')
      .select('id')
      .ilike('name', `%${filters.make}%`)
      .limit(1)
      .single()
    if (makeData) {
      const { data: compatData } = await supabase
        .from('part_compatibility')
        .select('part_id')
        .eq('make_id', makeData.id)
      if (compatData && compatData.length > 0) {
        const partIds = compatData.map((c: { part_id: string }) => c.part_id)
        query = query.in('id', partIds)
      }
    }
  }

  // Vehicle type filter — map to search keywords since spare_parts has no vehicle_type column
  if ((filters as any).vehicle_type) {
    const vehicleTypeKeywords: Record<string, string[]> = {
      sedan: ['sedan', 'camry', 'corolla', 'civic', 'accord', 'altima', 'car'],
      suv: ['land cruiser', 'patrol', 'prado', 'rav4', 'fortuner', 'explorer', 'tahoe', 'suv', '4wd'],
      pickup: ['hilux', 'ranger', 'navara', 'dmax', 'pickup', 'f-150', 'tundra'],
      van: ['hiace', 'sprinter', 'caravan', 'van', 'bus', 'transit'],
      truck: ['truck', 'lorry', 'hino', 'isuzu truck', 'actros'],
      heavy: ['excavator', 'bulldozer', 'forklift', 'crane', 'heavy equipment', 'caterpillar'],
    }
    const vt = (filters as any).vehicle_type as string
    const keywords = vehicleTypeKeywords[vt]
    if (keywords && keywords.length > 0 && !filters.q) {
      const orConditions = keywords.map(k => `name.ilike.%${k}%`).join(',')
      query = query.or(orConditions)
    }
  }

  if (filters.min_price !== undefined || filters.max_price !== undefined) {
    let invQuery = supabase.from('inventory').select('part_id')
    if (filters.min_price !== undefined) invQuery = invQuery.gte('price_aed', filters.min_price)
    if (filters.max_price !== undefined) invQuery = invQuery.lte('price_aed', filters.max_price)
    const { data: invData } = await invQuery
    if (invData && invData.length > 0) {
      const partIds = invData.map((i: { part_id: string }) => i.part_id)
      query = query.in('id', partIds)
    }
  }

  // Sort
  switch (filters.sort) {
    case 'newest':
      query = query.order('created_at', { ascending: false })
      break
    default:
      query = query.order('is_featured', { ascending: false }).order('created_at', { ascending: false })
  }

  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) {
    console.error('getProducts error:', error)
    return { data: [], count: 0 }
  }

  return { data: data || [], count: count || 0 }
}

export async function getProductById(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('spare_parts')
    .select(`
      *,
      vendors(id, business_name, business_name_ar, rating, emirate, address),
      part_categories(id, name, name_ar, slug),
      inventory(id, price_aed, quantity, emirate, sku),
      part_compatibility(
        id, year_from, year_to, notes,
        vehicle_makes(id, name, name_ar),
        vehicle_models(id, model_name, model_name_ar)
      )
    `)
    .eq('id', id)
    .eq('is_active', true)
    .single()

  if (error) return null
  return data
}

export async function getFeaturedProducts(limit = 8) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('spare_parts')
    .select(`
      *,
      vendors(id, business_name, rating),
      part_categories(id, name, name_ar, slug),
      inventory(id, price_aed, quantity, emirate, vendor_id)
    `)
    .eq('is_active', true)
    .eq('is_featured', true)
    .limit(limit)
    .order('created_at', { ascending: false })

  return data || []
}

// =============================================
// VEHICLE QUERIES
// =============================================

export async function getVehicleMakes(popularOnly = false) {
  const supabase = await createClient()
  let query = supabase.from('vehicle_makes').select('*').eq('is_active', true).order('name')
  if (popularOnly) query = query.eq('is_popular', true)
  const { data } = await query
  return data || []
}

export async function getVehicleModels(makeId?: number) {
  const supabase = await createClient()
  let query = supabase
    .from('vehicle_models')
    .select('*, vehicle_makes(name, name_ar)')
    .eq('is_active', true)
    .order('model_name')
  if (makeId) query = query.eq('make_id', makeId)
  const { data } = await query
  return data || []
}

// =============================================
// CATEGORIES
// =============================================

export async function getCategories(parentOnly = false) {
  const supabase = await createClient()
  let query = supabase.from('part_categories').select('*').eq('is_active', true).order('sort_order')
  if (parentOnly) query = query.is('parent_id', null)
  const { data } = await query
  return data || []
}

// =============================================
// VENDOR QUERIES
// =============================================

export async function getVendorByUserId(userId: string) {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('vendors')
    .select('*')
    .eq('user_id', userId)
    .single()
  return data
}

export async function getVendorProducts(vendorId: string) {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('spare_parts')
    .select('*, inventory(id, price_aed, quantity, emirate), part_categories(name, name_ar)')
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false })
  return data || []
}

export async function getVendorOrders(vendorId: string) {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('orders')
    .select('*, order_items(*, spare_parts(name, images)), profiles(full_name, phone)')
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false })
  return data || []
}

// =============================================
// ORDERS
// =============================================

export async function getCustomerOrders(customerId: string) {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('orders')
    .select('*, order_items(*, spare_parts(name, name_ar, images)), vendors(business_name)')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
  return data || []
}

// =============================================
// CART
// =============================================

export async function getCartItems(userId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('cart_items')
    .select(`
      *,
      inventory(
        id, price_aed, quantity, emirate,
        spare_parts(id, name, name_ar, images, part_number, brand, warranty_months),
        vendors(business_name)
      )
    `)
    .eq('user_id', userId)
  return data || []
}

// =============================================
// ADMIN QUERIES — uses service client to bypass RLS
// =============================================

export async function getPendingVendors() {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
  if (error) console.error('getPendingVendors error:', error)
  return data || []
}

export async function getAllVendors() {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) console.error('getAllVendors error:', error)
  return data || []
}
