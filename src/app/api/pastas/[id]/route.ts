import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    // Remove folder reference from items, then delete folder
    await prisma.look.updateMany({ where: { pastaId: id }, data: { pastaId: null } });
    await prisma.pecaDesign.updateMany({ where: { pastaId: id }, data: { pastaId: null } });
    await prisma.pasta.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar pasta:", error);
    return NextResponse.json({ error: "Erro ao deletar pasta" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (body.action === "rename") {
      const pasta = await prisma.pasta.update({
        where: { id },
        data: { nome: body.nome, ...(body.cor ? { cor: body.cor } : {}) },
      });
      return NextResponse.json({ success: true, pasta });
    } else if (body.action === "addLook") {
      await prisma.look.update({ where: { id: body.lookId }, data: { pastaId: id } });
    } else if (body.action === "addDesign") {
      await prisma.pecaDesign.update({ where: { id: body.designId }, data: { pastaId: id } });
    } else if (body.action === "removeLook") {
      await prisma.look.update({ where: { id: body.lookId }, data: { pastaId: null } });
    } else if (body.action === "removeDesign") {
      await prisma.pecaDesign.update({ where: { id: body.designId }, data: { pastaId: null } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao atualizar pasta:", error);
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  }
}
