import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function getRequiredUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return {
      userId: null as string | null,
      unauthorized: NextResponse.json({ error: "Não autenticado" }, { status: 401 }),
    };
  }

  return { userId: session.user.id, unauthorized: null };
}
