import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequiredUser } from "@/lib/auth-helpers";

export async function GET() {
  const { userId, unauthorized } = await getRequiredUser();
  if (!userId) return unauthorized!;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, image: true, createdAt: true },
  });
  return NextResponse.json({ user });
}

export async function PATCH(req: NextRequest) {
  const { userId, unauthorized } = await getRequiredUser();
  if (!userId) return unauthorized!;

  try {
    const body = await req.json();
    const name = body.name ? String(body.name).trim() : undefined;
    const image = body.image === null ? null : body.image ? String(body.image) : undefined;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(image !== undefined ? { image } : {}),
      },
      select: { id: true, name: true, email: true, image: true },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    return NextResponse.json({ error: "Erro ao atualizar perfil" }, { status: 500 });
  }
}
