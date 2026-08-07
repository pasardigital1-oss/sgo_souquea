import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// TODO: Uncomment and install when integrating Resend:
// import { Resend } from 'resend'
// const resend = new Resend(process.env.RESEND_API_KEY)

type NotifyType = 'placed' | 'confirmed' | 'shipped' | 'delivered'

const EMAIL_SUBJECTS: Record<NotifyType, string> = {
  placed:    '✅ Order Placed — SGO-SouqUAE',
  confirmed: '🔄 Your Order is Confirmed — SGO-SouqUAE',
  shipped:   '🚚 Your Order Has Shipped — SGO-SouqUAE',
  delivered: '📦 Your Order Has Been Delivered — SGO-SouqUAE',
}

function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, key)
}

function generateEmailHTML(order: any, type: NotifyType): string {
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

  const statusMessages: Record<NotifyType, string> = {
    placed:    'We have received your order and it\'s being reviewed by the vendor.',
    confirmed: 'Your order has been confirmed and is being prepared.',
    shipped:   'Great news! Your order is on its way to you.',
    delivered: 'Your order has been delivered. We hope you\'re satisfied with your purchase!',
  }

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f9fafb;margin:0;padding:20px;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:#1a1a2e;padding:24px 32px;">
      <h1 style="color:#ffffff;margin:0;font-size:22px;">SGO<span style="color:#c9a84c;">Souq</span>UAE</h1>
      <p style="color:#9ca3af;margin:4px 0 0;font-size:13px;">UAE's Premium Auto Parts Marketplace</p>
    </div>
    <div style="height:3px;background:linear-gradient(90deg,#c9a84c,#f0d080);"></div>
    <div style="padding:32px;">
      <h2 style="color:#1a1a2e;margin:0 0 8px;">${EMAIL_SUBJECTS[type]}</h2>
      <p style="color:#6b7280;margin:0 0 24px;">Hi ${customerName}, ${statusMessages[type]}</p>

      <div style="background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:24px;">
        <p style="margin:0 0 8px;font-size:13px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;">Order Details</p>
        <p style="margin:0 0 4px;font-size:14px;color:#1a1a2e;"><strong>Order #:</strong> ${order.order_number}</p>
        <p style="margin:0;font-size:14px;color:#1a1a2e;"><strong>Vendor:</strong> ${order.vendors?.business_name ?? '—'}</p>
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

      <div style="border-top:2px solid #c9a84c;padding-top:16px;text-align:right;">
        <p style="margin:0;font-size:13px;color:#6b7280;">Subtotal: AED ${order.subtotal_aed?.toFixed(2) ?? '0.00'}</p>
        <p style="margin:4px 0;font-size:13px;color:#6b7280;">VAT (5%): AED ${order.vat_amount_aed?.toFixed(2) ?? '0.00'}</p>
        <p style="margin:8px 0 0;font-size:18px;font-weight:bold;color:#c9a84c;">Total: AED ${order.total_aed?.toFixed(2) ?? '0.00'}</p>
      </div>
    </div>
    <div style="background:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;text-align:center;">
      <p style="margin:0;font-size:12px;color:#9ca3af;">SGO-SouqUAE | support@sgosouq.ae | UAE Auto Parts Marketplace</p>
    </div>
  </div>
</body>
</html>`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { orderId?: string; type?: NotifyType }
    const { orderId, type } = body

    if (!orderId || !type) {
      return NextResponse.json({ error: 'orderId and type are required' }, { status: 400 })
    }

    const validTypes: NotifyType[] = ['placed', 'confirmed', 'shipped', 'delivered']
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: `type must be one of: ${validTypes.join(', ')}` }, { status: 400 })
    }

    // Fetch order with customer & vendor info
    const supabase = createServiceClient()
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(*, spare_parts(name)),
        profiles(full_name, email),
        vendors(business_name)
      `)
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      console.error('[notify-order] Order not found:', orderId)
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const customerEmail = order.profiles?.email
    const subject = EMAIL_SUBJECTS[type]
    const html = generateEmailHTML(order, type)

    console.log(`[notify-order] Order: ${order.order_number} | Type: ${type} | To: ${customerEmail ?? 'unknown'}`)
    console.log(`[notify-order] Subject: ${subject}`)

    // ─── Send email via Resend (uncomment when RESEND_API_KEY is configured) ──
    // if (customerEmail && process.env.RESEND_API_KEY) {
    //   await resend.emails.send({
    //     from: 'SGO-SouqUAE <orders@sgosouq.ae>',
    //     to: [customerEmail],
    //     subject,
    //     html,
    //   })
    // }

    // ─── Alternative: Send via SendGrid ──────────────────────────────────────
    // if (customerEmail && process.env.SENDGRID_API_KEY) {
    //   await fetch('https://api.sendgrid.com/v3/mail/send', {
    //     method: 'POST',
    //     headers: {
    //       Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify({
    //       personalizations: [{ to: [{ email: customerEmail }] }],
    //       from: { email: 'orders@sgosouq.ae', name: 'SGO-SouqUAE' },
    //       subject,
    //       content: [{ type: 'text/html', value: html }],
    //     }),
    //   })
    // }

    return NextResponse.json({
      success: true,
      message: `Notification queued: ${type} for order ${order.order_number}`,
      email: customerEmail ?? 'no-email',
    })
  } catch (err) {
    console.error('[notify-order] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
