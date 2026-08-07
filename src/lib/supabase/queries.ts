import { createClient } from './server'
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
    query = query.eq('part_categories.slug', filters.category)
  }

  if (filters.brand) {
    query = query.ilike('brand', `%${filters.brand}%`)
  }

  if (filters.part_type) {
    query = query.eq('part_type', filters.part_type)
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
      inventory(id, price_aed, quantity, emirate)
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
  const supabase = await createClient()
  const { data } = await supabase
    .from('vendors')
    .select('*')
    .eq('user_id', userId)
    .single()
  return data
}

export async function getVendorProducts(vendorId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('spare_parts')
    .select('*, inventory(id, price_aed, quantity, emirate), part_categories(name, name_ar)')
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false })
  return data || []
}

export async function getVendorOrders(vendorId: string) {
  const supabase = await createClient()
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
  const supabase = await createClient()
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
// ADMIN QUERIES
// =============================================

export async function getPendingVendors() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('vendors')
    .select('*, profiles(full_name, email:id)')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
  return data || []
}

export async function getAllVendors() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('vendors')
    .select('*, profiles(full_name)')
    .order('created_at', { ascending: false })
  return data || []
}
