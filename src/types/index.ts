export type Locale = 'en' | 'ar' | 'id'

export type Role = 'customer' | 'vendor' | 'admin'

export type AdminRole = 'super_admin' | 'admin'

export type Emirates = 'dubai' | 'abu_dhabi' | 'sharjah' | 'ajman' | 'rak' | 'uaq' | 'fujairah'

export type PartType = 'oem' | 'aftermarket' | 'remanufactured' | 'used'

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'

export type VendorStatus = 'pending' | 'approved' | 'suspended' | 'rejected'

export interface Profile {
  id: string
  full_name: string | null
  phone: string | null
  role: Role
  admin_role: AdminRole | null
  emirate: Emirates | null
  preferred_lang: Locale
  avatar_url: string | null
  is_active: boolean
  created_at: string
}

export interface Vendor {
  id: string
  user_id: string
  business_name: string
  business_name_ar: string | null
  trade_license_no: string
  trade_license_expiry: string
  trade_license_url: string | null
  vat_trn: string | null
  business_type: string | null
  emirate: Emirates | null
  address: string | null
  bank_name: string | null
  bank_iban: string | null
  commission_rate: number
  status: VendorStatus
  rating: number
  rejection_reason?: string | null
  total_sales: number
  created_at: string
}

export interface VehicleMake {
  id: number
  name: string
  name_ar: string | null
  logo_url: string | null
  origin: string | null
  is_popular: boolean
}

export interface VehicleModel {
  id: number
  make_id: number
  model_name: string
  model_name_ar: string | null
  body_type: string | null
  year_start: number
  year_end: number | null
  vehicle_makes?: VehicleMake
}

export interface PartCategory {
  id: number
  parent_id: number | null
  name: string
  name_ar: string | null
  slug: string
  icon: string | null
  sort_order: number
}

export interface SparePart {
  id: string
  vendor_id: string
  category_id: number | null
  part_number: string
  oem_code: string | null
  aftermarket_code: string | null
  name: string
  name_ar: string | null
  description: string | null
  description_ar: string | null
  brand: string | null
  part_type: PartType
  condition: string
  weight_kg: number | null
  warranty_months: number
  images: string[]
  is_active: boolean
  is_featured: boolean
  created_at: string
  // Joined
  vendors?: Vendor
  part_categories?: PartCategory
  inventory?: Inventory[]
}

export interface Inventory {
  id: string
  part_id: string
  vendor_id: string
  emirate: Emirates
  quantity: number
  reserved_qty: number
  price_aed: number
  sku: string | null
  low_stock_alert: number
  // Joined
  spare_parts?: SparePart
  vendors?: Vendor
}

export interface CartItem {
  id: string
  user_id: string
  inventory_id: string
  quantity: number
  created_at: string
  // Joined
  inventory?: Inventory & {
    spare_parts?: SparePart
  }
}

export interface Order {
  id: string
  order_number: string
  customer_id: string
  vendor_id: string
  status: OrderStatus
  subtotal_aed: number
  vat_amount_aed: number
  shipping_fee_aed: number
  discount_aed: number
  total_aed: number
  shipping_address: ShippingAddress
  notes: string | null
  created_at: string
  // Joined
  order_items?: OrderItem[]
  vendors?: Vendor
}

export interface OrderItem {
  id: string
  order_id: string
  part_id: string
  inventory_id: string
  part_snapshot: Record<string, unknown>
  quantity: number
  unit_price_aed: number
  vat_per_unit: number
  total_aed: number
}

export interface ShippingAddress {
  name: string
  phone: string
  emirate: Emirates
  area: string
  street: string
  building?: string
  flat?: string
}

export interface Review {
  id: string
  part_id: string
  vendor_id: string
  customer_id: string
  rating: number
  title: string | null
  comment: string | null
  created_at: string
  profiles?: Profile
}

// Search & filter params
export interface CatalogFilters {
  q?: string
  category?: string
  make?: string
  model?: string
  year?: number
  brand?: string
  part_type?: PartType
  min_price?: number
  max_price?: number
  emirate?: Emirates
  sort?: 'price_asc' | 'price_desc' | 'newest' | 'rating'
  page?: number
}
