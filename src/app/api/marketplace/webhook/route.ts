import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Webhook do Mercado Pago — atualiza status do pedido quando o Pix é pago
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, data } = body;

    if (action !== "payment.updated" || !data?.id) {
      return NextResponse.json({ ok: true });
    }

    const MP_TOKEN = process.env.MP_ACCESS_TOKEN;
    if (!MP_TOKEN) return NextResponse.json({ ok: true });

    // Consultar status no Mercado Pago
    const mpRes  = await fetch(`https://api.mercadopago.com/v1/payments/${data.id}`, {
      headers: { "Authorization": `Bearer ${MP_TOKEN}` },
    });
    const mpData = await mpRes.json();

    if (mpData.status === "approved") {
      const order = await prisma.order.findFirst({
        where: { mpPaymentId: String(data.id) },
      });
      if (order) {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: "pago" },
        });
        // Marcar anúncio como vendido
        await prisma.listing.update({
          where: { id: order.listingId },
          data: { status: "vendido" },
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("webhook error:", err);
    return NextResponse.json({ ok: true }); // sempre 200 para o MP não retentar
  }
}
