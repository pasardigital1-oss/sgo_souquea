import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

type NotifyType = 'placed' | 'confirmed' | 'shipped' | 'delivered' | 'vendor_new_order' | 'vendor_approved' | 'vendor_rejected'

const EMAIL_SUBJECTS: Record<NotifyType, string> = {
  placed:            '✅ Order Placed — SGO-SouqUAE',
  confirmed:         '🔄 Your Order is Confirmed — SGO-SouqUAE',
  shipped:           '🚚 Your Order Has Shipped — SGO-SouqUAE',
  delivered:         '📦 Your Order Has Been Delivered — SGO-SouqUAE',
  vendor_new_order:  '🛍️ New Order Received — SGO-SouqUAE',
  vendor_approved:   '🎉 Your Vendor Account is Approved — SGO-SouqUAE',
  vendor_rejected:   '❌ Vendor Application Update — SGO-SouqUAE',
}

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

function generateCustomerEmailHTML(order: any, type: NotifyType): string {
  const addr = order.shipping_address ?? {}
  const customerName = order.profiles?.full_name ?? addr.name ?? 'Customer'
  const items = order.order_items ?? []

  const itemsHtml = items.map((item: any) => {
    const name = item.part_snapshot?.name ?? item.spare_parts?.name ?? 'Part'
    return `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;">${name}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;text-align:center;">${item.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;text-align:right;">AED ${item.total_aed?.toFixed(2) ?? '0.00'}</td>
    </tr>`
  }).join('')

  const statusMessages: Record<string, string> = {
    placed:    "We've received your order and it's being reviewed by the vendor.",
    confirmed: 'Your order has been confirmed and is being prepared for shipment.',
    shipped:   `Great news! Your order is on its way.${order.tracking_number ? ` Tracking: <strong>${order.tracking_number}</strong>${order.courier ? ` via ${order.courier}` : ''}` : ''}`,
    delivered: "Your order has been delivered. We hope you're satisfied with your purchase!",
  }

  const trackingSection = (type === 'shipped' && order.tracking_number) ? `
    <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:16px;margin-bottom:24px;">
      <p style="margin:0 0 6px;font-size:13px;color:#0369a1;font-weight:bold;">📦 Tracking Information</p>
      <p style="margin:0 0 4px;font-size:14px;color:#1a1a2e;">Tracking Number: <strong>${order.tracking_number}</strong></p>
      ${order.courier ? `<p style="margin:0 0 4px;font-size:14px;color:#1a1a2e;">Courier: <strong>${order.courier}</strong></p>` : ''}
      ${order.tracking_url ? `<p style="margin:0;font-size:13px;"><a href="${order.tracking_url}" style="color:#c9a84c;">Track your package →</a></p>` : ''}
    </div>
  ` : ''

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:Arial,sans-serif;background:#f9fafb;margin:0;padding:20px;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:#1a1a2e;padding:24px 32px;">
      <h1 style="color:#ffffff;margin:0;font-size:22px;">SGO<span style="color:#c9a84c;">Souq</span>UAE</h1>
      <p style="color:#9ca3af;margin:4px 0 0;font-size:13px;">UAE's Premium Auto Parts Marketplace</p>
    </div>
    <div style="height:3px;background:linear-gradient(90deg,#c9a84c,#f0d080);"></div>
    <div style="padding:32px;">
      <h2 style="color:#1a1a2e;margin:0 0 8px;">${EMAIL_SUBJECTS[type]}</h2>
      <p style="color:#6b7280;margin:0 0 24px;">Hi ${customerName}, ${statusMessages[type] ?? ''}</p>

      <div style="background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:24px;">
        <p style="margin:0 0 8px;font-size:13px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;">Order Details</p>
        <p style="margin:0 0 4px;font-size:14px;color:#1a1a2e;"><strong>Order #:</strong> ${order.order_number}</p>
        <p style="margin:0;font-size:14px;color:#1a1a2e;"><strong>Vendor:</strong> ${order.vendors?.business_name ?? '—'}</p>
      </div>

      ${trackingSection}

      ${items.length > 0 ? `
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <thead>
          <tr style="background:#1a1a2e;">
            <th style="padding:10px 12px;text-align:left;color:#ffffff;font-size:12px;">Product</th>
            <th style="padding:10px 12px;text-align:center;color:#ffffff;font-size:12px;">Qty</th>
            <th style="padding:10px 12px;text-align:right;color:#ffffff;font-size:12px;">Total</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      ` : ''}

      <div style="border-top:2px solid #c9a84c;padding-top:16px;text-align:right;">
        <p style="margin:0;font-size:13px;color:#6b7280;">Subtotal: AED ${order.subtotal_aed?.toFixed(2) ?? '0.00'}</p>
        <p style="margin:4px 0;font-size:13px;color:#6b7280;">VAT (5%): AED ${order.vat_amount_aed?.toFixed(2) ?? '0.00'}</p>
        <p style="margin:8px 0 0;font-size:18px;font-weight:bold;color:#c9a84c;">Total: AED ${order.total_aed?.toFixed(2) ?? '0.00'}</p>
      </div>
    </div>
    <div style="background:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;text-align:center;">
      <p style="margin:0;font-size:12px;color:#9ca3af;">SGO-SouqUAE | support@sgosouquae.com | UAE Auto Parts Marketplace</p>
    </div>
  </div>
</body>
</html>`
}

function generateVendorNewOrderHTML(order: any): string {
  const items = order.order_items ?? []
  const itemsHtml = items.map((item: any) => {
    const name = item.part_snapshot?.name ?? item.spare_parts?.name ?? 'Part'
    return `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;">${name}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;text-align:center;">${item.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;text-align:right;">AED ${item.total_aed?.toFixed(2) ?? '0.00'}</td>
    </tr>`
  }).join('')

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f9fafb;margin:0;padding:20px;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:#1a1a2e;padding:24px 32px;">
      <h1 style="color:#ffffff;margin:0;font-size:22px;">SGO<span style="color:#c9a84c;">Souq</span>UAE</h1>
      <p style="color:#9ca3af;margin:4px 0 0;font-size:13px;">Vendor Notification</p>
    </div>
    <div style="height:3px;background:linear-gradient(90deg,#c9a84c,#f0d080);"></div>
    <div style="padding:32px;">
      <h2 style="color:#1a1a2e;margin:0 0 8px;">🛍️ New Order Received!</h2>
      <p style="color:#6b7280;margin:0 0 24px;">You have a new order waiting for confirmation. Please process it promptly.</p>

      <div style="background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:24px;">
        <p style="margin:0 0 4px;font-size:14px;color:#1a1a2e;"><strong>Order #:</strong> ${order.order_number}</p>
        <p style="margin:0 0 4px;font-size:14px;color:#1a1a2e;"><strong>Total:</strong> <span style="color:#c9a84c;font-weight:bold;">AED ${order.total_aed?.toFixed(2)}</span></p>
        <p style="margin:0;font-size:14px;color:#1a1a2e;"><strong>Customer:</strong> ${order.profiles?.full_name ?? 'Customer'}</p>
      </div>

      ${items.length > 0 ? `
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <thead>
          <tr style="background:#1a1a2e;">
            <th style="padding:10px 12px;text-align:left;color:#ffffff;font-size:12px;">Product</th>
            <th style="padding:10px 12px;text-align:center;color:#ffffff;font-size:12px;">Qty</th>
            <th style="padding:10px 12px;text-align:right;color:#ffffff;font-size:12px;">Total</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      ` : ''}

      <div style="text-align:center;margin-top:24px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/en/vendor/dashboard" 
           style="display:inline-block;padding:12px 32px;background:#c9a84c;color:#1a1a2e;border-radius:8px;font-weight:bold;text-decoration:none;font-size:14px;">
          View Order in Dashboard →
        </a>
      </div>
    </div>
    <div style="background:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;text-align:center;">
      <p style="margin:0;font-size:12px;color:#9ca3af;">SGO-SouqUAE | support@sgosouquae.com</p>
    </div>
  </div>
</body>
</html>`
}

function generateVendorStatusHTML(vendorName: string, status: 'approved' | 'rejected', reason?: string): string {
  const isApproved = status === 'approved'
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f9fafb;margin:0;padding:20px;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:#1a1a2e;padding:24px 32px;">
      <h1 style="color:#ffffff;margin:0;font-size:22px;">SGO<span style="color:#c9a84c;">Souq</span>UAE</h1>
    </div>
    <div style="height:3px;background:linear-gradient(90deg,#c9a84c,#f0d080);"></div>
    <div style="padding:32px;">
      <h2 style="color:#1a1a2e;margin:0 0 16px;">${isApproved ? '🎉 Welcome to SGO-SouqUAE!' : '❌ Application Update'}</h2>
      <p style="color:#6b7280;margin:0 0 16px;">Dear <strong>${vendorName}</strong>,</p>
      ${isApproved
        ? `<p style="color:#6b7280;">Your vendor application has been <strong style="color:#16a34a;">approved</strong>! You can now log in to your vendor dashboard and start listing your products.</p>
           <div style="text-align:center;margin-top:24px;">
             <a href="${process.env.NEXT_PUBLIC_APP_URL}/en/vendor/dashboard"
                style="display:inline-block;padding:12px 32px;background:#c9a84c;color:#1a1a2e;border-radius:8px;font-weight:bold;text-decoration:none;font-size:14px;">
               Go to Vendor Dashboard →
             </a>
           </div>`
        : `<p style="color:#6b7280;">Unfortunately, your vendor application has been <strong style="color:#dc2626;">rejected</strong>.</p>
           ${reason ? `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin-top:16px;"><p style="margin:0;font-size:14px;color:#7f1d1d;"><strong>Reason:</strong> ${reason}</p></div>` : ''}
           <p style="color:#6b7280;margin-top:16px;">If you believe this is an error, please contact our support team.</p>`
      }
    </div>
    <div style="background:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;text-align:center;">
      <p style="margin:0;font-size:12px;color:#9ca3af;">SGO-SouqUAE | support@sgosouquae.com</p>
    </div>
  </div>
</body>
</html>`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { orderId, type, vendorEmail, vendorName, rejectionReason } = body as {
      orderId?: string
      type: NotifyType
      vendorEmail?: string
      vendorName?: string
      rejectionReason?: string
    }

    const resendKey = process.env.RESEND_API_KEY
    const fromEmail = process.env.EMAIL_FROM ?? 'SGO-SouqUAE <onboarding@resend.dev>'

    // ── Vendor approval/rejection emails (no order needed) ──────────────────
    if (type === 'vendor_approved' || type === 'vendor_rejected') {
      if (!vendorEmail || !vendorName) {
        return NextResponse.json({ error: 'vendorEmail and vendorName required' }, { status: 400 })
      }

      if (resendKey) {
        const resend = new Resend(resendKey)
        await resend.emails.send({
          from: fromEmail,
          to: [vendorEmail],
          subject: EMAIL_SUBJECTS[type],
          html: generateVendorStatusHTML(vendorName, type === 'vendor_approved' ? 'approved' : 'rejected', rejectionReason),
        })
      } else {
        console.log(`[notify] RESEND_API_KEY not set — skipping email to ${vendorEmail}`)
      }

      return NextResponse.json({ success: true, message: `${type} email sent to ${vendorEmail}` })
    }

    // ── Order emails ─────────────────────────────────────────────────────────
    if (!orderId) {
      return NextResponse.json({ error: 'orderId required' }, { status: 400 })
    }

    const supabase = createServiceClient()
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`*, order_items(*, spare_parts(name)), profiles(full_name), vendors(business_name)`)
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      console.error('[notify-order] Order not found:', orderId, orderError)
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Get customer email separately (not in profiles table — in auth.users)
    const { data: authData } = await supabase.auth.admin.getUserById(order.customer_id)
    const customerEmail = authData?.user?.email

    // Get vendor email for new order notification
    const { data: vendorProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', order.vendor_id)
      .single()

    const { data: vendorAuthData } = vendorProfile
      ? await supabase.auth.admin.getUserById(vendorProfile.id)
      : { data: null }
    const vendorEmailAddr = vendorAuthData?.user?.email

    console.log(`[notify-order] type=${type} order=${order.order_number} customer=${customerEmail} vendor=${vendorEmailAddr}`)

    if (resendKey) {
      const resend = new Resend(resendKey)

      // Send to customer
      if (customerEmail && ['placed', 'confirmed', 'shipped', 'delivered'].includes(type)) {
        await resend.emails.send({
          from: fromEmail,
          to: [customerEmail],
          subject: EMAIL_SUBJECTS[type as NotifyType],
          html: generateCustomerEmailHTML(order, type as NotifyType),
        })
      }

      // Send to vendor on new order
      if (type === 'placed' && vendorEmailAddr) {
        await resend.emails.send({
          from: fromEmail,
          to: [vendorEmailAddr],
          subject: EMAIL_SUBJECTS.vendor_new_order,
          html: generateVendorNewOrderHTML(order),
        })
      }
    } else {
      console.log(`[notify-order] RESEND_API_KEY not set — email skipped for ${order.order_number}`)
    }

    return NextResponse.json({
      success: true,
      message: `Notification sent: ${type} for ${order.order_number}`,
      customerEmail: customerEmail ?? 'not-found',
    })
  } catch (err) {
    console.error('[notify-order] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
