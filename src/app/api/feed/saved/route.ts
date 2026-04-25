import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequiredUser } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const { userId, unauthorized } = await getRequiredUser();
    if (!userId) return unauthorized!;

    const saves = await prisma.feedSave.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        feedLook: {
          include: {
            user: { select: { id: true, name: true } },
            _count: { select: { curtidas: true, salvos: true } },
            curtidas: { where: { userId }, select: { userId: true } },
          },
        },
      },
    });

    const items = saves.map(s => {
      const l = s.feedLook;
      return {
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
        salvo: true,
        isMine: l.userId === userId,
        createdAt: l.createdAt,
      };
    });

    return NextResponse.json({ looks: items });
  } catch (err) {
    console.error("feed saved GET error:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
