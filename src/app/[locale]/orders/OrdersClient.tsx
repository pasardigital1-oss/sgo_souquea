'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import {
  ShoppingBag, CheckCircle, Package, Truck, XCircle,
  Clock, Download, Loader2, ExternalLink,
} from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { formatAED, formatDate } from '@/lib/utils'
import type { Order } from '@/types'

interface Props {
  orders: Order[]
  locale: string
  showSuccess: boolean
}

const STATUS_CONFIG: Record<string, { color: string; icon: typeof Clock; label: string }> = {
  pending:    { color: 'bg-yellow-50 text-yellow-700 border-yellow-200',  icon: Clock,        label: 'Pending' },
  confirmed:  { color: 'bg-blue-50 text-blue-700 border-blue-200',        icon: CheckCircle,  label: 'Confirmed' },
  processing: { color: 'bg-purple-50 text-purple-700 border-purple-200',  icon: Package,      label: 'Processing' },
  shipped:    { color: 'bg-indigo-50 text-indigo-700 border-indigo-200',  icon: Truck,        label: 'Shipped' },
  delivered:  { color: 'bg-green-50 text-green-700 border-green-200',     icon: CheckCircle,  label: 'Delivered' },
  cancelled:  { color: 'bg-red-50 text-red-700 border-red-200',           icon: XCircle,      label: 'Cancelled' },
  refunded:   { color: 'bg-gray-50 text-gray-700 border-gray-200',        icon: XCircle,      label: 'Refunded' },
}

const TIMELINE_STEPS = [
  { key: 'pending',    label: 'Order\nPlaced',  icon: Clock },
  { key: 'confirmed',  label: 'Confirmed',       icon: CheckCircle },
  { key: 'processing', label: 'Processing',      icon: Package },
  { key: 'shipped',    label: 'Shipped',         icon: Truck },
  { key: 'delivered',  label: 'Delivered',       icon: CheckCircle },
]
const STATUS_ORDER = ['pending', 'confirmed', 'processing', 'shipped', 'delivered']

function OrderTimeline({ order }: { order: any }) {
  const currentIdx = STATUS_ORDER.indexOf(order.status)
  const isCancelled = order.status === 'cancelled' || order.status === 'refunded'

  if (isCancelled) {
    return (
      <div className="flex items-center gap-2 mt-3 p-3 bg-red-50 rounded-xl border border-red-100">
        <XCircle className="w-4 h-4 text-red-500 shrink-0" />
        <p className="text-xs text-red-600 font-medium">
          Order {order.status}{order.cancelled_reason ? ` — ${order.cancelled_reason}` : ''}
        </p>
      </div>
    )
  }

  return (
    <div className="mt-4">
      <div className="flex items-start">
        {TIMELINE_STEPS.map((step, idx) => {
          const StepIcon = step.icon
          const isDone = idx <= currentIdx
          const isCurrent = idx === currentIdx
          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center min-w-0">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 shrink-0 transition-all ${
                  isDone
                    ? isCurrent
                      ? 'bg-gold-500 border-gold-500 text-midnight-900'
                      : 'bg-green-500 border-green-500 text-white'
                    : 'bg-white border-gray-200 text-gray-300'
                }`}>
                  <StepIcon className="w-3 h-3" />
                </div>
                <p className={`text-[9px] mt-1 text-center leading-tight px-0.5 ${isDone ? 'text-midnight-700 font-medium' : 'text-gray-400'}`}>
                  {step.label}
                </p>
              </div>
              {idx < TIMELINE_STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mb-4 mx-1 mt-3.5 ${idx < currentIdx ? 'bg-green-400' : 'bg-gray-200'}`} />
              )}
            </div>
          )
        })}
      </div>

      {/* Tracking info box */}
      {order.tracking_number && (
        <div className="mt-3 p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-indigo-600 shrink-0" />
            <p className="text-xs font-semibold text-indigo-800">
              {order.courier ? `${order.courier} — ` : ''}
              Tracking: <span className="font-mono">{order.tracking_number}</span>
            </p>
          </div>
          {order.tracking_url && (
            <a
              href={order.tracking_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Track Package <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}
    </div>
  )
}

export default function OrdersClient({ orders, locale, showSuccess }: Props) {
  const t = useTranslations('orders')
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const handleDownloadInvoice = async (orderId: string, orderNumber: string) => {
    setDownloadingId(orderId)
    try {
      const res = await fetch(`/api/invoice/${orderId}`)
      if (!res.ok) throw new Error('Failed to generate invoice')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `SGO-Invoice-${orderNumber}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Invoice download error:', err)
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-warm-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="font-heading text-2xl font-bold text-midnight-900 mb-6">{t('title')}</h1>

        {showSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
            <div>
              <p className="font-semibold text-green-800 text-sm">Your order has been placed successfully!</p>
              <p className="text-xs text-green-600 mt-0.5">The vendor will confirm your order shortly. You will receive an email confirmation.</p>
            </div>
          </div>
        )}

        {orders.length === 0 ? (
          <div className="text-center py-24">
            <ShoppingBag className="w-14 h-14 text-gray-200 mx-auto mb-4" />
            <h3 className="font-heading text-xl font-semibold text-midnight-700 mb-2">{t('noOrders')}</h3>
            <p className="text-midnight-400 text-sm mb-6">{t('noOrdersDesc')}</p>
            <Link href={`/${locale}/catalog`} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl gold-gradient text-midnight-900 font-bold text-sm hover:opacity-90">
              Browse Parts →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order: any) => {
              const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
              const StatusIcon = config.icon
              return (
                <div key={order.id} className="bg-white rounded-2xl border border-gray-100 luxury-shadow overflow-hidden">
                  {/* Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 p-5 border-b border-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-midnight-50 flex items-center justify-center">
                        <Package className="w-5 h-5 text-midnight-600" />
                      </div>
                      <div>
                        <p className="font-mono font-semibold text-midnight-900 text-sm">{order.order_number}</p>
                        <p className="text-xs text-midnight-400">{formatDate(order.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${config.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {config.label}
                      </span>
                      <span className="font-heading font-bold text-midnight-900">{formatAED(order.total_aed)}</span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-5">
                    <div className="space-y-2 mb-4">
                      {order.order_items?.slice(0, 3).map((item: any) => (
                        <div key={item.id} className="flex justify-between items-center text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center">
                              <Package className="w-4 h-4 text-gray-300" />
                            </div>
                            <div>
                              <p className="text-midnight-800 font-medium line-clamp-1">
                                {item.spare_parts?.name || item.part_snapshot?.name}
                              </p>
                              <p className="text-xs text-midnight-400">x{item.quantity}</p>
                            </div>
                          </div>
                          <span className="font-medium text-midnight-900">{formatAED(item.total_aed)}</span>
                        </div>
                      ))}
                      {order.order_items?.length > 3 && (
                        <p className="text-xs text-midnight-400">+{order.order_items.length - 3} more items</p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-gray-50">
                      <p className="text-xs text-midnight-400">
                        Vendor: <span className="font-medium text-midnight-700">{order.vendors?.business_name}</span>
                      </p>
                      <div className="flex items-center gap-2 text-xs text-midnight-400">
                        <span>Subtotal: {formatAED(order.subtotal_aed)}</span>
                        <span>•</span>
                        <span>VAT: {formatAED(order.vat_amount_aed)}</span>
                      </div>
                    </div>

                    {/* Timeline + tracking */}
                    <OrderTimeline order={order} />

                    {/* Invoice */}
                    <div className="pt-3 mt-1">
                      <button
                        onClick={() => handleDownloadInvoice(order.id, order.order_number)}
                        disabled={downloadingId === order.id}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gold-200 text-gold-700 hover:bg-gold-50 transition-colors text-xs font-semibold disabled:opacity-60"
                      >
                        {downloadingId === order.id
                          ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...</>
                          : <><Download className="w-3.5 h-3.5" /> {t('downloadInvoice')}</>
                        }
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
