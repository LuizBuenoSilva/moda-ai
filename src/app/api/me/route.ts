import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequiredUser } from "@/lib/auth-helpers";
import { normalizeProfileImageInput } from "@/lib/profile-image-server";

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
    let image: string | null | undefined = undefined;
    if (body.image === null) {
      image = null;
    } else if (body.image !== undefined) {
      try {
        image = normalizeProfileImageInput(body.image);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Foto inválida";
        return NextResponse.json({ error: msg }, { status: 400 });
      }
    }

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
