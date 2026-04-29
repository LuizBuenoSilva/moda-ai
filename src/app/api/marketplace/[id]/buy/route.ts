import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequiredUser } from "@/lib/auth-helpers";

type Params = { params: Promise<{ id: string }> };

// POST — iniciar compra (gera Pix via Mercado Pago)
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { userId, unauthorized } = await getRequiredUser();
    if (!userId) return unauthorized!;

    const { id: listingId } = await params;

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    if (!listing) return NextResponse.json({ error: "Anúncio não encontrado" }, { status: 404 });
    if (listing.userId === userId) return NextResponse.json({ error: "Você não pode comprar seu próprio anúncio" }, { status: 400 });
    if (listing.status !== "ativo") return NextResponse.json({ error: "Este anúncio não está disponível" }, { status: 400 });

    const buyer = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } });

    const MP_TOKEN = process.env.MP_ACCESS_TOKEN;

    if (!MP_TOKEN) {
      // Pagamento não configurado — retorna para contato direto
      return NextResponse.json({
        error: "pagamento_nao_configurado",
        message: "Pagamento via plataforma ainda não configurado. Entre em contato com o vendedor pelo WhatsApp ou chat.",
        whatsapp: listing.whatsapp,
      }, { status: 503 });
    }

    // Criar pagamento Pix no Mercado Pago
    const mpRes = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${MP_TOKEN}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": `${listingId}-${userId}-${Date.now()}`,
      },
      body: JSON.stringify({
        transaction_amount: listing.preco,
        description: listing.titulo,
        payment_method_id: "pix",
        payer: {
          email: buyer?.email ?? "comprador@yuzo.com",
          first_name: buyer?.name ?? "Comprador",
        },
        notification_url: `${process.env.NEXTAUTH_URL}/api/marketplace/webhook`,
        metadata: { listing_id: listingId, buyer_id: userId, seller_id: listing.userId },
      }),
    });

    const mpData = await mpRes.json();
    if (!mpRes.ok || !mpData.point_of_interaction) {
      console.error("MP error:", mpData);
      return NextResponse.json({ error: "Erro ao gerar pagamento Pix" }, { status: 500 });
    }

    const pixCode   = mpData.point_of_interaction.transaction_data.qr_code;
    const pixQrCode = mpData.point_of_interaction.transaction_data.qr_code_base64;

    // Salvar pedido no banco
    const order = await prisma.order.create({
      data: {
        listingId,
        buyerId:     userId,
        sellerId:    listing.userId,
        valor:       listing.preco,
        status:      "pendente",
        pixCode,
        pixQrCode,
        mpPaymentId: String(mpData.id),
      },
    });

    return NextResponse.json({ order: { id: order.id, pixCode, pixQrCode, valor: order.valor } });
  } catch (err) {
    console.error("buy POST error:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
