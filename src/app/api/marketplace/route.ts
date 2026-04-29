import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequiredUser } from "@/lib/auth-helpers";

// GET — listar anúncios (com filtros opcionais)
export async function GET(req: NextRequest) {
  try {
    const { userId } = await getRequiredUser();
    const { searchParams } = new URL(req.url);
    const categoria = searchParams.get("categoria") ?? undefined;
    const condicao  = searchParams.get("condicao")  ?? undefined;
    const tamanho   = searchParams.get("tamanho")   ?? undefined;
    const mine      = searchParams.get("mine") === "1";
    const cursor    = searchParams.get("cursor")    ?? undefined;
    const q         = searchParams.get("q")         ?? undefined;
    const take = 16;

    const where = {
      status: mine ? undefined : "ativo",
      ...(mine && userId ? { userId } : {}),
      ...(categoria ? { categoria } : {}),
      ...(condicao  ? { condicao }  : {}),
      ...(tamanho   ? { tamanho }   : {}),
      ...(q ? { OR: [
        { titulo:    { contains: q, mode: "insensitive" as const } },
        { descricao: { contains: q, mode: "insensitive" as const } },
      ]} : {}),
    };

    const listings = await prisma.listing.findMany({
      take: take + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      where,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { id: true, name: true } } },
    });

    const hasMore = listings.length > take;
    const items = listings.slice(0, take).map(l => ({
      id: l.id,
      titulo: l.titulo,
      preco: l.preco,
      categoria: l.categoria,
      tamanho: l.tamanho,
      condicao: l.condicao,
      status: l.status,
      views: l.views,
      thumbUrl: (() => {
        try { const arr = JSON.parse(l.imageUrls); return arr[0] ?? null; }
        catch { return null; }
      })(),
      vendedorId:   l.userId,
      vendedorNome: l.user.name ?? "Usuário",
      hasWhatsapp:  !!l.whatsapp,
      isMine: l.userId === userId,
      createdAt: l.createdAt,
    }));

    return NextResponse.json({ listings: items, nextCursor: hasMore ? items[items.length - 1].id : null });
  } catch (err) {
    console.error("marketplace GET error:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// POST — criar anúncio
export async function POST(req: NextRequest) {
  try {
    const { userId, unauthorized } = await getRequiredUser();
    if (!userId) return unauthorized!;

    const { titulo, descricao, preco, categoria, tamanho, condicao, imageUrls, whatsapp } = await req.json();
    if (!titulo?.trim()) return NextResponse.json({ error: "Título obrigatório" }, { status: 400 });
    if (!preco || preco <= 0) return NextResponse.json({ error: "Preço inválido" }, { status: 400 });
    if (!imageUrls?.length) return NextResponse.json({ error: "Adicione pelo menos uma foto" }, { status: 400 });

    const listing = await prisma.listing.create({
      data: {
        userId,
        titulo: titulo.trim(),
        descricao: descricao?.trim() ?? null,
        preco: Number(preco),
        categoria: categoria ?? "vestuario",
        tamanho: tamanho ?? null,
        condicao: condicao ?? "seminovo",
        imageUrls: JSON.stringify(imageUrls),
        whatsapp: whatsapp?.replace(/\D/g, "") || null,
      },
      include: { user: { select: { id: true, name: true } } },
    });

    return NextResponse.json({ listing });
  } catch (err) {
    console.error("marketplace POST error:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
