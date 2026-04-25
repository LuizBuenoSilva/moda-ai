import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequiredUser } from "@/lib/auth-helpers";

// GET — paginated feed
export async function GET(req: NextRequest) {
  try {
    const { userId } = await getRequiredUser();
    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor") ?? undefined;
    const take = 12;

    const looks = await prisma.feedLook.findMany({
      take: take + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true } },
        _count: { select: { curtidas: true, salvos: true } },
        curtidas: userId ? { where: { userId }, select: { userId: true } } : false,
        salvos:   userId ? { where: { userId }, select: { userId: true } } : false,
      },
    });

    const hasMore = looks.length > take;
    const items = looks.slice(0, take).map(l => ({
      id: l.id,
      userId: l.userId,
      userName: l.user.name ?? "Usuário",
      imageUrl: l.imageUrl,
      titulo: l.titulo,
      descricao: l.descricao,
      tags: l.tags ? JSON.parse(l.tags) : [],
      curtidas: l._count.curtidas,
      salvos: l._count.salvos,
      curtido: Array.isArray(l.curtidas) && l.curtidas.length > 0,
      salvo:   Array.isArray(l.salvos)   && l.salvos.length   > 0,
      isMine: l.userId === userId,
      createdAt: l.createdAt,
    }));

    return NextResponse.json({
      looks: items,
      nextCursor: hasMore ? items[items.length - 1].id : null,
    });
  } catch (err) {
    console.error("feed GET error:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// POST — publish a look
export async function POST(req: NextRequest) {
  try {
    const { userId, unauthorized } = await getRequiredUser();
    if (!userId) return unauthorized!;

    const { imageUrl, titulo, descricao, tags } = await req.json();
    if (!imageUrl || !titulo?.trim()) {
      return NextResponse.json({ error: "Foto e título são obrigatórios" }, { status: 400 });
    }

    const look = await prisma.feedLook.create({
      data: {
        userId,
        imageUrl,
        titulo: titulo.trim(),
        descricao: descricao?.trim() ?? null,
        tags: tags?.length ? JSON.stringify(tags) : null,
      },
      include: { user: { select: { id: true, name: true } } },
    });

    return NextResponse.json({
      look: {
        id: look.id, userId: look.userId, userName: look.user.name ?? "Usuário",
        imageUrl: look.imageUrl, titulo: look.titulo, descricao: look.descricao,
        tags: [], curtidas: 0, salvos: 0, curtido: false, salvo: false, isMine: true,
        createdAt: look.createdAt,
      },
    });
  } catch (err) {
    console.error("feed POST error:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
