import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequiredUser } from "@/lib/auth-helpers";

type Params = { params: Promise<{ id: string }> };

// GET — detalhe do anúncio
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { userId } = await getRequiredUser();
    const { id } = await params;

    const listing = await prisma.listing.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    if (!listing) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

    // Incrementar views (sem bloquear a resposta)
    if (listing.userId !== userId) {
      prisma.listing.update({ where: { id }, data: { views: { increment: 1 } } }).catch(() => {});
    }

    let imageUrls: string[] = [];
    try { imageUrls = JSON.parse(listing.imageUrls); } catch {}

    return NextResponse.json({
      listing: {
        id: listing.id,
        titulo: listing.titulo,
        descricao: listing.descricao,
        preco: listing.preco,
        categoria: listing.categoria,
        tamanho: listing.tamanho,
        condicao: listing.condicao,
        status: listing.status,
        views: listing.views,
        imageUrls,
        whatsapp: listing.whatsapp,
        vendedorId:   listing.userId,
        vendedorNome: listing.user.name ?? "Usuário",
        isMine: listing.userId === userId,
        createdAt: listing.createdAt,
      }
    });
  } catch (err) {
    console.error("listing GET error:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// PUT — editar anúncio
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { userId, unauthorized } = await getRequiredUser();
    if (!userId) return unauthorized!;

    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.listing.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const updated = await prisma.listing.update({
      where: { id },
      data: {
        ...(body.titulo    ? { titulo: body.titulo.trim() }      : {}),
        ...(body.descricao !== undefined ? { descricao: body.descricao } : {}),
        ...(body.preco     ? { preco: Number(body.preco) }       : {}),
        ...(body.categoria ? { categoria: body.categoria }       : {}),
        ...(body.tamanho   !== undefined ? { tamanho: body.tamanho }   : {}),
        ...(body.condicao  ? { condicao: body.condicao }         : {}),
        ...(body.status    ? { status: body.status }             : {}),
        ...(body.whatsapp  !== undefined ? { whatsapp: body.whatsapp?.replace(/\D/g, "") || null } : {}),
        ...(body.imageUrls ? { imageUrls: JSON.stringify(body.imageUrls) } : {}),
      },
    });

    return NextResponse.json({ listing: updated });
  } catch (err) {
    console.error("listing PUT error:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// DELETE — excluir anúncio
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { userId, unauthorized } = await getRequiredUser();
    if (!userId) return unauthorized!;

    const { id } = await params;
    const deleted = await prisma.listing.deleteMany({ where: { id, userId } });
    if (!deleted.count) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("listing DELETE error:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
