import { NextResponse } from "next/server";
import { getRequiredUser } from "@/lib/auth-helpers";

// GET — gera a URL de autorização OAuth do Mercado Pago
export async function GET() {
  const { userId, unauthorized } = await getRequiredUser();
  if (!userId) return unauthorized!;

  const clientId    = process.env.MP_CLIENT_ID;
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/marketplace/mp-callback`;

  if (!clientId) {
    return NextResponse.json({ error: "MP_CLIENT_ID não configurado" }, { status: 503 });
  }

  // state = userId para validar no callback
  const params = new URLSearchParams({
    client_id:     clientId,
    response_type: "code",
    platform_id:   "mp",
    redirect_uri:  redirectUri,
    state:         userId,
  });

  const url = `https://auth.mercadopago.com/authorization?${params}`;
  return NextResponse.json({ url });
}
