import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequiredUser } from "@/lib/auth-helpers";

export async function GET() {
  const { userId, unauthorized } = await getRequiredUser();
  if (!userId) return unauthorized!;

  const profile = await prisma.avatarProfile.findUnique({ where: { userId } });
  return NextResponse.json({ profile });
}

export async function PUT(req: NextRequest) {
  const { userId, unauthorized } = await getRequiredUser();
  if (!userId) return unauthorized!;

  try {
    const body = await req.json();
    const profile = await prisma.avatarProfile.upsert({
      where: { userId },
      create: {
        userId,
        skinTone:   body.skinTone   ?? null,
        hairStyle:  body.hairStyle  ?? null,
        hairColor:  body.hairColor  ?? null,
        bodyType:   body.bodyType   ?? null,
        height:     body.height     ?? null,
        shirtColor: body.shirtColor ?? null,
        pantsColor: body.pantsColor ?? null,
        shoeColor:  body.shoeColor  ?? null,
      },
      update: {
        skinTone:   body.skinTone   ?? null,
        hairStyle:  body.hairStyle  ?? null,
        hairColor:  body.hairColor  ?? null,
        bodyType:   body.bodyType   ?? null,
        height:     body.height     ?? null,
        shirtColor: body.shirtColor ?? null,
        pantsColor: body.pantsColor ?? null,
        shoeColor:  body.shoeColor  ?? null,
      },
    });
    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Erro ao salvar avatar profile:", error);
    return NextResponse.json({ error: "Erro ao salvar avatar" }, { status: 500 });
  }
}
