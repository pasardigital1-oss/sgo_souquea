import { NextRequest, NextResponse } from 'next/server'

// TODO: Integrate Resend or SendGrid for transactional emails
// import Resend from 'resend'
// const resend = new Resend(process.env.RESEND_API_KEY)

type NotifyType = 'placed' | 'confirmed' | 'shipped' | 'delivered'

const EMAIL_SUBJECTS: Record<NotifyType, string> = {
  placed: '✅ Order Confirmed — SGO-SouqUAE',
  confirmed: '🔄 Your Order is Being Processed — SGO-SouqUAE',
  shipped: '🚚 Your Order Has Shipped — SGO-SouqUAE',
  delivered: '📦 Your Order Has Been Delivered — SGO-SouqUAE',
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

    // ── Placeholder: log the notification ──────────────────────────────────────
    console.log(`[notify-order] orderId=${orderId} type=${type} subject="${EMAIL_SUBJECTS[type]}"`)

    // TODO: Fetch customer email from Supabase and send email
    // const supabase = createServiceClient()
    // const { data: order } = await supabase
    //   .from('orders')
    //   .select('*, profiles(email, full_name)')
    //   .eq('id', orderId)
    //   .single()
    //
    // if (order?.profiles?.email) {
    //   await resend.emails.send({
    //     from: 'SGO-SouqUAE <orders@sgosouq.ae>',
    //     to: [order.profiles.email],
    //     subject: EMAIL_SUBJECTS[type],
    //     html: generateEmailHTML(order, type),
    //   })
    // }

    // TODO: Replace above with your chosen email provider (Resend, SendGrid, etc.)

    return NextResponse.json({
      success: true,
      message: `Notification queued: ${type} for order ${orderId}`,
    })
  } catch (err) {
    console.error('[notify-order] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
