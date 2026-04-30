import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequiredUser } from "@/lib/auth-helpers";

// GET — retorna se o usuário tem conta MP conectada
export async function GET() {
  const { userId, unauthorized } = await getRequiredUser();
  if (!userId) return unauthorized!;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { mpUserId: true, mpAccessToken: true },
  });

  return NextResponse.json({
    connected: !!(user?.mpAccessToken && user?.mpUserId),
    mpUserId:  user?.mpUserId ?? null,
  });
}

// DELETE — desconectar conta MP
export async function DELETE() {
  const { userId, unauthorized } = await getRequiredUser();
  if (!userId) return unauthorized!;

  await prisma.user.update({
    where: { id: userId },
    data: { mpAccessToken: null, mpRefreshToken: null, mpUserId: null, mpPublicKey: null },
  });

  return NextResponse.json({ ok: true });
}
