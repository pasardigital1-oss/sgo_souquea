'use client'

import { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MapPin, CreditCard, Package, CheckCircle } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { useCartStore } from '@/store/cartStore'
import { formatAED, generateOrderNumber } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

const EMIRATES = ['dubai','abu_dhabi','sharjah','ajman','rak','uaq','fujairah']

interface PaymentMethod {
  id: string
  label: string
  icon: string
  desc: string
  isSandbox: boolean
}

const ALL_PAYMENT_METHODS: Record<string, Omit<PaymentMethod,'id'|'isSandbox'>> = {
  cod:    { label: 'Cash on Delivery',     icon: '📦', desc: 'Pay when your order arrives' },
  stripe: { label: 'Stripe — Card',        icon: '💳', desc: 'Credit / Debit Card' },
  telr:   { label: 'Telr',                 icon: '🏦', desc: 'UAE Payment Gateway' },
  tabby:  { label: 'Tabby — Pay in 4',     icon: '📅', desc: 'Buy Now, Pay Later (4 installments)' },
  tamara: { label: 'Tamara — Pay in 3',    icon: '📅', desc: 'Buy Now, Pay Later (3 installments)' },
}

export default function CheckoutPage() {
  const tc = useTranslations('checkout')
  const locale = useLocale()
  const router = useRouter()
  const { items, subtotal, vatAmount, grandTotal, clearCart } = useCartStore()

  const [form, setForm] = useState({
    name: '', phone: '', emirate: 'dubai', area: '', street: '', building: '', flat: '', notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [selectedPayment, setSelectedPayment] = useState<string>('cod')
  const [paymentLoading, setPaymentLoading] = useState(true)

  // Load enabled payment methods from Supabase
  useEffect(() => {
    async function loadPaymentMethods() {
      setPaymentLoading(true)
      const supabase = createClient()
      const { data } = await supabase
        .from('payment_settings')
        .select('gateway, is_enabled, is_sandbox')
        .eq('is_enabled', true)

      if (data && data.length > 0) {
        const methods: PaymentMethod[] = data.map((row: any) => ({
          id: row.gateway,
          isSandbox: row.is_sandbox ?? true,
          ...(ALL_PAYMENT_METHODS[row.gateway] ?? {
            label: row.gateway,
            icon: '💰',
            desc: '',
          }),
        }))
        setPaymentMethods(methods)
        // Default to COD if available, otherwise first method
        const cod = methods.find(m => m.id === 'cod')
        setSelectedPayment(cod ? 'cod' : (methods[0]?.id ?? 'cod'))
      } else {
        // Fallback to COD if table not set up yet
        setPaymentMethods([{ id: 'cod', label: 'Cash on Delivery', icon: '📦', desc: 'Pay when your order arrives', isSandbox: false }])
        setSelectedPayment('cod')
      }
      setPaymentLoading(false)
    }
    loadPaymentMethods()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleOrder = async () => {
    if (!form.name || !form.phone || !form.area || !form.street) {
      setError('Please fill in all required fields')
      return
    }

    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push(`/${locale}/auth/login`)
      return
    }

    // Group items by vendor
    const vendorGroups: Record<string, typeof items> = {}
    items.forEach(item => {
      if (!vendorGroups[item.vendor_id]) vendorGroups[item.vendor_id] = []
      vendorGroups[item.vendor_id].push(item)
    })

    const shippingAddress = {
      name: form.name, phone: form.phone, emirate: form.emirate,
      area: form.area, street: form.street, building: form.building, flat: form.flat,
    }

    // Create one order per vendor
    const orderIds: string[] = []
    for (const [vendorId, vendorItems] of Object.entries(vendorGroups)) {
      const sub = vendorItems.reduce((s, i) => s + i.price_aed * i.quantity, 0)
      const vat = Math.round(sub * 0.05 * 100) / 100
      const total = sub + vat

      const { data: order, error: orderError } = await supabase.from('orders').insert({
        order_number: generateOrderNumber(),
        customer_id: user.id,
        vendor_id: vendorId,
        status: 'pending',
        subtotal_aed: sub,
        vat_amount_aed: vat,
        shipping_fee_aed: 0,
        discount_aed: 0,
        total_aed: total,
        shipping_address: shippingAddress,
        notes: form.notes || null,
      }).select().single()

      if (orderError || !order) {
        setError('Failed to create order. Please try again.')
        setLoading(false)
        return
      }

      const orderItems = vendorItems.map(item => ({
        order_id: order.id,
        part_id: item.part_id,
        inventory_id: item.inventory_id,
        part_snapshot: { name: item.name, part_number: item.part_number, brand: item.brand, image: item.image },
        quantity: item.quantity,
        unit_price_aed: item.price_aed,
        vat_per_unit: Math.round(item.price_aed * 0.05 * 100) / 100,
        total_aed: Math.round(item.price_aed * item.quantity * 1.05 * 100) / 100,
      }))

      await supabase.from('order_items').insert(orderItems)
      orderIds.push(order.id)

      // Notify — fire and forget
      fetch('/api/notify-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, type: 'placed' }),
      }).catch(console.error)
    }

    clearCart()
    router.push(`/${locale}/orders?success=true`)
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-warm-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-24 text-center">
          <p className="text-midnight-500 mb-4">Your cart is empty.</p>
          <Link href={`/${locale}/catalog`} className="text-gold-600 font-medium hover:underline">Browse catalog →</Link>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-warm-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="font-heading text-2xl font-bold text-midnight-900 mb-6">{tc('title')}</h1>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Form */}
          <div className="lg:col-span-2 space-y-5">
            {/* Shipping address */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 luxury-shadow">
              <h2 className="font-heading font-semibold text-midnight-900 mb-5 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-gold-500" />
                {tc('shippingAddress')}
              </h2>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-midnight-700">{tc('fullName')} *</label>
                  <input name="name" value={form.name} onChange={handleChange} required
                    placeholder="Abdul Waheed" className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gold-400 bg-gray-50" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-midnight-700">{tc('phone')} *</label>
                  <input name="phone" value={form.phone} onChange={handleChange} required
                    placeholder="+971 55 XXX XXXX" className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gold-400 bg-gray-50" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-midnight-700">{tc('emirate')} *</label>
                  <select name="emirate" value={form.emirate} onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gold-400 bg-gray-50">
                    {EMIRATES.map(e => <option key={e} value={e}>{e.replace('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-midnight-700">{tc('area')} *</label>
                  <input name="area" value={form.area} onChange={handleChange} required
                    placeholder="Deira, Al Quoz, JLT..." className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gold-400 bg-gray-50" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-sm font-medium text-midnight-700">{tc('street')} *</label>
                  <input name="street" value={form.street} onChange={handleChange} required
                    placeholder="Al Rigga Road" className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gold-400 bg-gray-50" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-midnight-700">{tc('building')}</label>
                  <input name="building" value={form.building} onChange={handleChange}
                    placeholder="Tower 5" className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gold-400 bg-gray-50" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-midnight-700">{tc('flat')}</label>
                  <input name="flat" value={form.flat} onChange={handleChange}
                    placeholder="Flat 1204" className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gold-400 bg-gray-50" />
                </div>
              </div>

              <div className="space-y-1.5 mt-4">
                <label className="text-sm font-medium text-midnight-700">{tc('notes')}</label>
                <textarea name="notes" value={form.notes} onChange={handleChange} rows={2}
                  placeholder="Please call before delivery..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gold-400 bg-gray-50 resize-none" />
              </div>
            </div>

            {/* Payment method */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 luxury-shadow">
              <h2 className="font-heading font-semibold text-midnight-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-gold-500" />
                {tc('paymentMethod')}
              </h2>

              {paymentLoading ? (
                <div className="flex items-center gap-3 text-sm text-midnight-400 py-3">
                  <span className="w-4 h-4 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
                  Loading payment methods...
                </div>
              ) : (
                <div className="space-y-3">
                  {paymentMethods.map(method => (
                    <label
                      key={method.id}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedPayment === method.id
                          ? 'border-gold-400 bg-gold-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.id}
                        checked={selectedPayment === method.id}
                        onChange={() => setSelectedPayment(method.id)}
                        className="sr-only"
                      />
                      <span className="text-2xl">{method.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-midnight-900 text-sm">{method.label}</p>
                          {method.isSandbox && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
                              TEST MODE
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-midnight-400 mt-0.5">{method.desc}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 transition-all ${
                        selectedPayment === method.id
                          ? 'border-gold-500 bg-gold-500'
                          : 'border-gray-300'
                      } flex items-center justify-center`}>
                        {selectedPayment === method.id && (
                          <div className="w-2.5 h-2.5 rounded-full bg-white" />
                        )}
                      </div>
                    </label>
                  ))}

                  {/* Info message for non-COD methods */}
                  {selectedPayment !== 'cod' && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
                      <Package className="w-4 h-4 inline-block me-1" />
                      Payment gateway will be configured by UAE team. Order will be placed and you will be contacted.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Order summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 luxury-shadow sticky top-20">
              <h2 className="font-heading font-semibold text-midnight-900 mb-4 pb-3 border-b border-gray-100">
                {tc('orderSummary')}
              </h2>

              <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                {items.map(item => (
                  <div key={item.inventory_id} className="flex justify-between gap-2 text-sm">
                    <div className="flex-1 min-w-0">
                      <p className="text-midnight-800 font-medium line-clamp-1">{item.name}</p>
                      <p className="text-midnight-400 text-xs">x{item.quantity}</p>
                    </div>
                    <span className="font-semibold text-midnight-900 shrink-0">
                      {formatAED(item.price_aed * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 border-t border-gray-100 pt-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-midnight-500">Subtotal</span>
                  <span>{formatAED(subtotal())}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-midnight-500">VAT (5%)</span>
                  <span>{formatAED(vatAmount())}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-midnight-500">Shipping</span>
                  <span className="text-green-600">Free</span>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3 mb-5">
                <div className="flex justify-between font-heading font-bold text-midnight-900">
                  <span>{useTranslations('cart')('total')}</span>
                  <span className="text-xl">{formatAED(grandTotal())}</span>
                </div>
              </div>

              <button
                onClick={handleOrder}
                disabled={loading || paymentLoading}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl gold-gradient text-midnight-900 font-bold hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {loading
                  ? <span className="w-4 h-4 border-2 border-midnight-700/30 border-t-midnight-700 rounded-full animate-spin" />
                  : <><CheckCircle className="w-4 h-4" />{tc('placeOrder')}</>
                }
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
