import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequiredUser } from "@/lib/auth-helpers";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId, unauthorized } = await getRequiredUser();
    if (!userId) return unauthorized!;

    const { id } = await params;
    // Remove folder reference from items, then delete folder
    await prisma.look.updateMany({ where: { pastaId: id, userId }, data: { pastaId: null } });
    await prisma.pecaDesign.updateMany({ where: { pastaId: id, userId }, data: { pastaId: null } });
    await prisma.pasta.deleteMany({ where: { id, userId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar pasta:", error);
    return NextResponse.json({ error: "Erro ao deletar pasta" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId, unauthorized } = await getRequiredUser();
    if (!userId) return unauthorized!;

    const { id } = await params;
    const body = await req.json();

    if (body.action === "rename") {
      const pasta = await prisma.pasta.updateMany({
        where: { id, userId },
        data: { nome: body.nome, ...(body.cor ? { cor: body.cor } : {}) },
      });
      return NextResponse.json({ success: true, pasta });
    } else if (body.action === "addLook") {
      await prisma.look.updateMany({ where: { id: body.lookId, userId }, data: { pastaId: id } });
    } else if (body.action === "addDesign") {
      await prisma.pecaDesign.updateMany({ where: { id: body.designId, userId }, data: { pastaId: id } });
    } else if (body.action === "removeLook") {
      await prisma.look.updateMany({ where: { id: body.lookId, userId }, data: { pastaId: null } });
    } else if (body.action === "removeDesign") {
      await prisma.pecaDesign.updateMany({ where: { id: body.designId, userId }, data: { pastaId: null } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao atualizar pasta:", error);
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  }
}
