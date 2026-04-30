import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET — recebe o code do OAuth e troca pelo access_token do vendedor
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code    = searchParams.get("code");
  const state   = searchParams.get("state");   // userId
  const error   = searchParams.get("error");

  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  if (error || !code || !state) {
    console.error("mp-callback: missing params", { error, code: !!code, state: !!state });
    return NextResponse.redirect(`${base}/marketplace/minhas-pecas?mp=error&reason=${error ?? "missing_params"}`);
  }

  const clientId     = process.env.MP_CLIENT_ID;
  const clientSecret = process.env.MP_CLIENT_SECRET;
  const redirectUri  = `${base}/api/marketplace/mp-callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${base}/marketplace/minhas-pecas?mp=not_configured`);
  }

  try {
    // Trocar code por access_token
    const tokenRes = await fetch("https://api.mercadopago.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id:     clientId,
        client_secret: clientSecret,
        grant_type:    "authorization_code",
        code,
        redirect_uri:  redirectUri,
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("MP token error:", JSON.stringify(tokenData));
      const reason = tokenData.error ?? tokenData.message ?? "token_failed";
      return NextResponse.redirect(`${base}/marketplace/minhas-pecas?mp=error&reason=${encodeURIComponent(reason)}`);
    }

    // Salvar no banco vinculado ao userId (state)
    await prisma.user.update({
      where: { id: state },
      data: {
        mpAccessToken:  tokenData.access_token,
        mpRefreshToken: tokenData.refresh_token ?? null,
        mpUserId:       String(tokenData.user_id),
        mpPublicKey:    tokenData.public_key ?? null,
      },
    });

    return NextResponse.redirect(`${base}/marketplace/minhas-pecas?mp=connected`);
  } catch (err) {
    console.error("mp-callback error:", err);
    return NextResponse.redirect(`${base}/marketplace/minhas-pecas?mp=error`);
  }
}
