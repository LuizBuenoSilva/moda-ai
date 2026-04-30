import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequiredUser } from "@/lib/auth-helpers";

type Params = { params: Promise<{ id: string }> };

// Taxa da plataforma (5%)
const PLATFORM_FEE_PCT = 0.05;

// POST — iniciar compra (gera Pix via Mercado Pago Marketplace com split)
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { userId, unauthorized } = await getRequiredUser();
    if (!userId) return unauthorized!;

    const { id: listingId } = await params;

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        user: {
          select: {
            id: true, name: true, email: true,
            mpAccessToken: true, mpUserId: true,
          },
        },
      },
    });
    if (!listing) return NextResponse.json({ error: "Anúncio não encontrado" }, { status: 404 });
    if (listing.userId === userId) return NextResponse.json({ error: "Você não pode comprar seu próprio anúncio" }, { status: 400 });
    if (listing.status !== "ativo") return NextResponse.json({ error: "Este anúncio não está disponível" }, { status: 400 });

    const buyer = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    // Determinar qual access_token usar:
    // 1. Vendedor conectou conta MP → usa o token dele (split automático)
    // 2. Apenas plataforma configurada → usa token da plataforma (sem split)
    const sellerToken   = listing.user.mpAccessToken;
    const platformToken = process.env.MP_ACCESS_TOKEN;
    const activeToken   = sellerToken ?? platformToken;

    if (!activeToken) {
      // Nenhum pagamento configurado — redirecionar para contato direto
      return NextResponse.json({
        error: "pagamento_nao_configurado",
        message: "Pagamento ainda não configurado. Entre em contato com o vendedor.",
        whatsapp: listing.whatsapp,
      }, { status: 503 });
    }

    const applicationFee = sellerToken
      ? Math.round(listing.preco * PLATFORM_FEE_PCT * 100) / 100
      : undefined;

    const redirectUri = `${process.env.NEXTAUTH_URL}/api/marketplace/mp-callback`;

    // Criar pagamento Pix no Mercado Pago
    const body: Record<string, unknown> = {
      transaction_amount: listing.preco,
      description:        listing.titulo,
      payment_method_id:  "pix",
      payer: {
        email:      buyer?.email ?? "comprador@yuzo.com",
        first_name: buyer?.name  ?? "Comprador",
      },
      notification_url: `${process.env.NEXTAUTH_URL}/api/marketplace/webhook`,
      metadata: {
        listing_id: listingId,
        buyer_id:   userId,
        seller_id:  listing.userId,
      },
    };

    // Split: apenas quando vendedor conectou conta MP
    if (sellerToken && applicationFee !== undefined) {
      body.marketplace        = "YUZO";
      body.marketplace_fee    = applicationFee;
      body.collector          = { id: listing.user.mpUserId };
      // redirect_urls só é necessário para pagamentos com autenticação 3DS
    }

    const mpRes = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Authorization":     `Bearer ${activeToken}`,
        "Content-Type":      "application/json",
        "X-Idempotency-Key": `${listingId}-${userId}-${Date.now()}`,
      },
      body: JSON.stringify(body),
    });

    const mpData = await mpRes.json();
    if (!mpRes.ok || !mpData.point_of_interaction) {
      console.error("MP error:", mpData);
      return NextResponse.json({ error: "Erro ao gerar pagamento Pix" }, { status: 500 });
    }

    const pixCode   = mpData.point_of_interaction.transaction_data.qr_code;
    const pixQrCode = mpData.point_of_interaction.transaction_data.qr_code_base64;

    // Salvar pedido
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

    return NextResponse.json({
      order: {
        id:         order.id,
        pixCode,
        pixQrCode,
        valor:      order.valor,
        splitAtivo: !!sellerToken,
        taxaPlataforma: applicationFee,
      },
    });
  } catch (err) {
    console.error("buy POST error:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
