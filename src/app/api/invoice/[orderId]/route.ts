import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { renderToBuffer, Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'
import React from 'react'

// Service role Supabase client for server-side data fetching
function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, key)
}

// ─── PDF Styles ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1a1a2e',
    paddingHorizontal: 40,
    paddingVertical: 40,
    backgroundColor: '#ffffff',
  },
  // Header
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  logoText: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: '#1a1a2e' },
  logoGold: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: '#c9a84c' },
  tagline: { fontSize: 8, color: '#9ca3af', marginTop: 2 },
  invoiceLabel: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#c9a84c', textAlign: 'right' },
  invoiceNumber: { fontSize: 10, color: '#6b7280', textAlign: 'right', marginTop: 3 },
  trnText: { fontSize: 8, color: '#9ca3af', textAlign: 'right', marginTop: 2 },
  // Gold divider
  divider: { height: 2, backgroundColor: '#c9a84c', marginVertical: 16 },
  thinDivider: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 8 },
  // Info section
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  infoBox: { width: '48%' },
  infoLabel: { fontSize: 8, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  infoValue: { fontSize: 10, color: '#1a1a2e', marginBottom: 2 },
  infoBold: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#1a1a2e', marginBottom: 2 },
  // Table
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  tableRowAlt: { backgroundColor: '#fafafa' },
  colDesc: { flex: 3 },
  colQty: { flex: 1, textAlign: 'center' },
  colUnit: { flex: 1.5, textAlign: 'right' },
  colVat: { flex: 1.2, textAlign: 'right' },
  colTotal: { flex: 1.5, textAlign: 'right' },
  thText: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#ffffff' },
  tdText: { fontSize: 9, color: '#374151' },
  tdTextBold: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#1a1a2e' },
  // Summary
  summaryBox: {
    marginLeft: 'auto',
    width: 220,
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  summaryLabel: { fontSize: 9, color: '#6b7280' },
  summaryValue: { fontSize: 9, color: '#1a1a2e' },
  summaryTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#c9a84c',
  },
  summaryTotalLabel: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#1a1a2e' },
  summaryTotalValue: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#c9a84c' },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: { fontSize: 8, color: '#9ca3af' },
  footerBadge: {
    fontSize: 8,
    color: '#c9a84c',
    fontFamily: 'Helvetica-Bold',
    borderWidth: 1,
    borderColor: '#c9a84c',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
  },
})

// ─── PDF Document Component ───────────────────────────────────────────────────
function InvoiceDocument({ order, platformTRN }: { order: any; platformTRN: string }) {
  const year = new Date(order.created_at).getFullYear()
  const invoiceNumber = `AS-INV-${year}-${order.order_number.split('-').pop() ?? order.order_number}`
  const invoiceDate = new Date(order.created_at).toLocaleDateString('en-AE', {
    year: 'numeric', month: 'long', day: 'numeric'
  })

  const items: any[] = order.order_items ?? []
  const addr = order.shipping_address ?? {}
  const customerName = order.profiles?.full_name ?? addr.name ?? 'Customer'
  const customerPhone = order.profiles?.phone ?? addr.phone ?? ''
  const shipAddress = [addr.building, addr.street, addr.area, addr.emirate?.replace('_', ' ')]
    .filter(Boolean)
    .map((s: string) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(', ')

  return React.createElement(
    Document,
    { title: `Invoice ${invoiceNumber}` },
    React.createElement(
      Page,
      { size: 'A4', style: styles.page },

      // ── Header ──
      React.createElement(
        View,
        { style: styles.headerRow },
        React.createElement(
          View,
          null,
          React.createElement(
            Text,
            null,
            React.createElement(Text, { style: styles.logoText }, 'SGO'),
            React.createElement(Text, { style: styles.logoGold }, 'Souq'),
            React.createElement(Text, { style: styles.logoText }, 'UAE')
          ),
          React.createElement(Text, { style: styles.tagline }, "UAE's Premium Auto Parts Marketplace")
        ),
        React.createElement(
          View,
          null,
          React.createElement(Text, { style: styles.invoiceLabel }, 'TAX INVOICE'),
          React.createElement(Text, { style: styles.invoiceNumber }, invoiceNumber),
          React.createElement(Text, { style: styles.trnText }, `TRN: ${platformTRN}`)
        )
      ),

      // ── Gold divider ──
      React.createElement(View, { style: styles.divider }),

      // ── Invoice info + Customer info ──
      React.createElement(
        View,
        { style: styles.infoRow },
        // Invoice details
        React.createElement(
          View,
          { style: styles.infoBox },
          React.createElement(Text, { style: styles.infoLabel }, 'Invoice Details'),
          React.createElement(Text, { style: styles.infoValue }, `Date: ${invoiceDate}`),
          React.createElement(Text, { style: styles.infoValue }, `Invoice #: ${invoiceNumber}`),
          React.createElement(Text, { style: styles.infoValue }, `Order #: ${order.order_number}`),
          React.createElement(Text, { style: styles.infoValue }, `Payment: ${order.payment_method ?? 'Cash on Delivery'}`)
        ),
        // Customer details
        React.createElement(
          View,
          { style: styles.infoBox },
          React.createElement(Text, { style: styles.infoLabel }, 'Bill / Ship To'),
          React.createElement(Text, { style: styles.infoBold }, customerName),
          customerPhone ? React.createElement(Text, { style: styles.infoValue }, `Tel: ${customerPhone}`) : null,
          React.createElement(Text, { style: styles.infoValue }, shipAddress)
        )
      ),

      React.createElement(View, { style: styles.thinDivider }),

      // ── Table header ──
      React.createElement(
        View,
        { style: styles.tableHeader },
        React.createElement(Text, { style: [styles.thText, styles.colDesc] }, 'Description'),
        React.createElement(Text, { style: [styles.thText, styles.colQty] }, 'Qty'),
        React.createElement(Text, { style: [styles.thText, styles.colUnit] }, 'Unit Price'),
        React.createElement(Text, { style: [styles.thText, styles.colVat] }, 'VAT 5%'),
        React.createElement(Text, { style: [styles.thText, styles.colTotal] }, 'Total')
      ),

      // ── Table rows ──
      ...items.map((item: any, i: number) => {
        const name = item.part_snapshot?.name ?? item.spare_parts?.name ?? 'Part'
        const qty = item.quantity ?? 1
        const unit = item.unit_price_aed ?? 0
        const vat = item.vat_per_unit ?? (unit * 0.05)
        const total = item.total_aed ?? (unit * qty * 1.05)
        return React.createElement(
          View,
          { key: item.id ?? i, style: [styles.tableRow, i % 2 !== 0 ? styles.tableRowAlt : {}] },
          React.createElement(
            View,
            { style: styles.colDesc },
            React.createElement(Text, { style: styles.tdTextBold }, name),
            item.part_snapshot?.part_number
              ? React.createElement(Text, { style: { fontSize: 8, color: '#9ca3af' } }, `P/N: ${item.part_snapshot.part_number}`)
              : null
          ),
          React.createElement(Text, { style: [styles.tdText, styles.colQty] }, String(qty)),
          React.createElement(Text, { style: [styles.tdText, styles.colUnit] }, `AED ${unit.toFixed(2)}`),
          React.createElement(Text, { style: [styles.tdText, styles.colVat] }, `AED ${(vat * qty).toFixed(2)}`),
          React.createElement(Text, { style: [styles.tdTextBold, styles.colTotal] }, `AED ${total.toFixed(2)}`)
        )
      }),

      // ── Summary ──
      React.createElement(
        View,
        { style: styles.summaryBox },
        React.createElement(
          View,
          { style: styles.summaryRow },
          React.createElement(Text, { style: styles.summaryLabel }, 'Subtotal'),
          React.createElement(Text, { style: styles.summaryValue }, `AED ${order.subtotal_aed?.toFixed(2) ?? '0.00'}`)
        ),
        React.createElement(
          View,
          { style: styles.summaryRow },
          React.createElement(Text, { style: styles.summaryLabel }, 'VAT (5%)'),
          React.createElement(Text, { style: styles.summaryValue }, `AED ${order.vat_amount_aed?.toFixed(2) ?? '0.00'}`)
        ),
        React.createElement(
          View,
          { style: styles.summaryRow },
          React.createElement(Text, { style: styles.summaryLabel }, 'Shipping'),
          React.createElement(Text, { style: styles.summaryValue },
            order.shipping_fee_aed > 0 ? `AED ${order.shipping_fee_aed.toFixed(2)}` : 'Free'
          )
        ),
        React.createElement(
          View,
          { style: styles.summaryTotalRow },
          React.createElement(Text, { style: styles.summaryTotalLabel }, 'TOTAL'),
          React.createElement(Text, { style: styles.summaryTotalValue }, `AED ${order.total_aed?.toFixed(2) ?? '0.00'}`)
        )
      ),

      // ── Footer ──
      React.createElement(
        View,
        { style: styles.footer },
        React.createElement(
          View,
          null,
          React.createElement(Text, { style: styles.footerText }, 'SGO-SouqUAE | UAE Auto Parts Marketplace'),
          React.createElement(Text, { style: styles.footerText }, 'support@sgosouq.ae | www.sgosouq.ae')
        ),
        React.createElement(Text, { style: styles.footerBadge }, 'VAT Compliant Invoice per UAE FTA Standards')
      )
    )
  )
}

// ─── Route Handler ─────────────────────────────────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params

  const supabase = createServiceClient()

  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items(*, spare_parts(name, images)),
      profiles(full_name, phone)
    `)
    .eq('id', orderId)
    .single()

  if (error || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  // Get platform TRN from site_settings
  const { data: trnSetting } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'vat_trn')
    .single()
  const platformTRN = trnSetting?.value || 'Pending UAE Registration'

  const pdfBuffer = await renderToBuffer(React.createElement(InvoiceDocument, { order, platformTRN }) as unknown as React.ReactElement<import('@react-pdf/renderer').DocumentProps>)

  const year = new Date(order.created_at).getFullYear()
  const filename = `AS-INV-${year}-${order.order_number}.pdf`

  return new NextResponse(pdfBuffer as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(pdfBuffer.length),
    },
  })
}
