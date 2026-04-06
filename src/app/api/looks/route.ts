import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const looks = await prisma.look.findMany({
      orderBy: { createdAt: "desc" },
      include: { pecas: true },
    });
    return NextResponse.json({ looks });
  } catch (error) {
    console.error("Erro ao buscar looks:", error);
    return NextResponse.json(
      { error: "Erro ao buscar looks" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const look = await prisma.look.create({
      data: {
        nome: body.nome,
        descricao: body.descricao,
        estilo: body.estilo,
        ocasiao: body.ocasiao,
        genero: body.genero || null,
        precoEstimado: body.precoEstimado,
        orcamento: body.orcamento,
        explicacao: body.explicacao,
        cores: JSON.stringify(body.cores),
        outfitJson: JSON.stringify(body.outfitJson),
        pecas: {
          create: body.pecas.map((peca: {
            categoria: string;
            nome: string;
            descricao: string;
            cor: string;
            preco: number;
            tecido?: string;
            corte?: string;
            detalhes?: string;
            lojas?: string[];
          }) => ({
            categoria: peca.categoria,
            nome: peca.nome,
            descricao: peca.descricao,
            cor: peca.cor,
            preco: peca.preco,
            tecido: peca.tecido || null,
            corte: peca.corte || null,
            detalhes: peca.detalhes || null,
            lojas: peca.lojas ? JSON.stringify(peca.lojas) : null,
          })),
        },
      },
      include: { pecas: true },
    });

    return NextResponse.json({ id: look.id, look });
  } catch (error) {
    console.error("Erro ao salvar look:", error);
    return NextResponse.json(
      { error: "Erro ao salvar look" },
      { status: 500 }
    );
  }
}
