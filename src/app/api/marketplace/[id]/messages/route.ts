import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequiredUser } from "@/lib/auth-helpers";

type Params = { params: Promise<{ id: string }> };

// GET — buscar mensagens da conversa sobre este anúncio
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { userId, unauthorized } = await getRequiredUser();
    if (!userId) return unauthorized!;

    const { id: listingId } = await params;

    const listing = await prisma.listing.findUnique({ where: { id: listingId }, select: { userId: true } });
    if (!listing) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

    const isSeller = listing.userId === userId;

    // Busca todas as mensagens onde este usuário está envolvido
    const messages = await prisma.marketMsg.findMany({
      where: {
        listingId,
        OR: [{ fromUserId: userId }, { toUserId: userId }],
      },
      orderBy: { createdAt: "asc" },
      include: {
        fromUser: { select: { id: true, name: true } },
      },
    });

    // Marcar como lidas as mensagens recebidas
    await prisma.marketMsg.updateMany({
      where: { listingId, toUserId: userId, lido: false },
      data: { lido: true },
    });

    // Se for vendedor, buscar lista de compradores que enviaram msg
    let conversations: { userId: string; userName: string; unread: number }[] = [];
    if (isSeller) {
      const buyers = await prisma.marketMsg.groupBy({
        by: ["fromUserId"],
        where: { listingId, toUserId: userId },
        _count: { id: true },
      });
      const unreadCounts = await prisma.marketMsg.groupBy({
        by: ["fromUserId"],
        where: { listingId, toUserId: userId, lido: false },
        _count: { id: true },
      });
      const unreadMap = Object.fromEntries(unreadCounts.map(u => [u.fromUserId, u._count.id]));

      const buyerUsers = await prisma.user.findMany({
        where: { id: { in: buyers.map(b => b.fromUserId) } },
        select: { id: true, name: true },
      });
      conversations = buyerUsers.map(u => ({
        userId: u.id,
        userName: u.name ?? "Usuário",
        unread: unreadMap[u.id] ?? 0,
      }));
    }

    return NextResponse.json({ messages, conversations, isSeller });
  } catch (err) {
    console.error("messages GET error:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// POST — enviar mensagem
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { userId, unauthorized } = await getRequiredUser();
    if (!userId) return unauthorized!;

    const { id: listingId } = await params;
    const { content, toUserId } = await req.json();

    if (!content?.trim()) return NextResponse.json({ error: "Mensagem vazia" }, { status: 400 });

    const listing = await prisma.listing.findUnique({ where: { id: listingId }, select: { userId: true, status: true } });
    if (!listing) return NextResponse.json({ error: "Anúncio não encontrado" }, { status: 404 });

    // Destinatário: se enviando para vendedor → listing.userId; se vendedor respondendo → toUserId
    const recipientId = userId === listing.userId ? toUserId : listing.userId;
    if (!recipientId) return NextResponse.json({ error: "Destinatário inválido" }, { status: 400 });

    const msg = await prisma.marketMsg.create({
      data: { listingId, fromUserId: userId, toUserId: recipientId, content: content.trim() },
      include: { fromUser: { select: { id: true, name: true } } },
    });

    return NextResponse.json({ message: msg });
  } catch (err) {
    console.error("messages POST error:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
