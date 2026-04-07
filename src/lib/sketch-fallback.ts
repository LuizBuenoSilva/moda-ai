import { PecaDesignGerada } from "@/types/designer";

// Deterministic pseudo-random based on string seed
function seededRandom(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  }
  let s = Math.abs(h);
  return () => {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function darken(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const f = 1 - amount;
  return `rgb(${Math.round(r * f)},${Math.round(g * f)},${Math.round(b * f)})`;
}

function lighten(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.round(r + (255 - r) * amount)},${Math.round(g + (255 - g) * amount)},${Math.round(b + (255 - b) * amount)})`;
}

function generateManequimBase(rand: () => number): string {
  // Stylized fashion figure silhouette
  const headTilt = (rand() - 0.5) * 4;
  return `
    <!-- Manequim estilizado -->
    <g opacity="0.15" stroke="#888" stroke-width="0.8" fill="none">
      <!-- Cabeça -->
      <ellipse cx="${200 + headTilt}" cy="52" rx="14" ry="18"/>
      <!-- Pescoço -->
      <line x1="200" y1="70" x2="200" y2="90"/>
      <!-- Ombros -->
      <line x1="160" y1="95" x2="240" y2="95"/>
      <!-- Braço esquerdo -->
      <path d="M160,95 Q148,180 155,280"/>
      <!-- Braço direito -->
      <path d="M240,95 Q252,180 245,280"/>
      <!-- Pernas -->
      <line x1="185" y1="320" x2="178" y2="490"/>
      <line x1="215" y1="320" x2="222" y2="490"/>
    </g>`;
}

function generateStitchingDetail(x1: number, y1: number, x2: number, y2: number, rand: () => number): string {
  const dashLen = 3 + rand() * 3;
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke-dasharray="${dashLen} ${dashLen}" stroke="rgba(255,255,255,0.2)" stroke-width="0.5"/>`;
}

function generateCamiseta(peca: PecaDesignGerada, rand: () => number): string {
  const main = peca.cores[0] || "#1a1a2e";
  const accent = peca.cores[1] || "#ffffff";
  const isOversized = (peca.corte || "").toLowerCase().includes("oversized");
  const isCropped = (peca.corte || "").toLowerCase().includes("cropped");
  const isSlim = (peca.corte || "").toLowerCase().includes("slim");

  const shoulderW = isOversized ? 95 : isSlim ? 70 : 80;
  const bodyW = isOversized ? 90 : isSlim ? 60 : 72;
  const hemY = isCropped ? 260 : isOversized ? 310 : 290;
  const sleeveLen = 40 + rand() * 20;
  const neckW = 20 + rand() * 15;

  const elementos = (peca.elementosVisuais || "").toLowerCase();
  const hasEstampa = elementos.includes("estampa") || elementos.includes("gráfic");
  const hasBolso = elementos.includes("bolso");
  const hasBordado = elementos.includes("bordado");

  let svg = `
    <defs>
      <linearGradient id="mainGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${main}"/>
        <stop offset="100%" stop-color="${darken(main, 0.2)}"/>
      </linearGradient>
      <linearGradient id="shadowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="rgba(0,0,0,0)" />
        <stop offset="100%" stop-color="rgba(0,0,0,0.15)" />
      </linearGradient>
    </defs>`;

  svg += generateManequimBase(rand);

  // Body
  svg += `
    <path d="
      M${200 - neckW},90
      L${200 - shoulderW},100
      L${200 - shoulderW - 15},${100 + sleeveLen}
      L${200 - shoulderW + 15},${100 + sleeveLen + 5}
      L${200 - bodyW},160
      L${200 - bodyW - 3},${hemY}
      Q200,${hemY + 8} ${200 + bodyW + 3},${hemY}
      L${200 + bodyW},160
      L${200 + shoulderW - 15},${100 + sleeveLen + 5}
      L${200 + shoulderW + 15},${100 + sleeveLen}
      L${200 + shoulderW},100
      L${200 + neckW},90
      Q200,${85 - rand() * 8} ${200 - neckW},90
      Z"
      fill="url(#mainGrad)" stroke="${darken(main, 0.3)}" stroke-width="1.2"/>`;

  // Shadow overlay
  svg += `<path d="M${200 - bodyW},160 L${200 - bodyW - 3},${hemY} Q200,${hemY + 8} ${200 + bodyW + 3},${hemY} L${200 + bodyW},160 Z" fill="url(#shadowGrad)"/>`;

  // Collar
  svg += `<path d="M${200 - neckW},90 Q200,${95 + rand() * 8} ${200 + neckW},90" fill="none" stroke="${darken(main, 0.25)}" stroke-width="1.5"/>`;

  // Stitching lines
  svg += generateStitchingDetail(200 - shoulderW + 15, 100 + sleeveLen + 5, 200 - bodyW, 160, rand);
  svg += generateStitchingDetail(200 + shoulderW - 15, 100 + sleeveLen + 5, 200 + bodyW, 160, rand);
  svg += generateStitchingDetail(200 - bodyW - 2, hemY - 5, 200 + bodyW + 2, hemY - 5, rand);

  // Estampa gráfica
  if (hasEstampa) {
    const gx = 170 + rand() * 20;
    const gy = 170 + rand() * 30;
    const gw = 50 + rand() * 20;
    svg += `
      <rect x="${gx}" y="${gy}" width="${gw}" height="${gw * 0.7}" rx="3" fill="${accent}" opacity="0.7"/>
      <line x1="${gx + 5}" y1="${gy + gw * 0.35}" x2="${gx + gw - 5}" y2="${gy + gw * 0.35}" stroke="${main}" stroke-width="2"/>
      <circle cx="${gx + gw / 2}" cy="${gy + gw * 0.35}" r="${gw * 0.15}" fill="${main}" opacity="0.5"/>`;
  }

  // Bolso
  if (hasBolso) {
    const bx = 210 + rand() * 10;
    const by = 200 + rand() * 20;
    svg += `
      <rect x="${bx}" y="${by}" width="28" height="32" rx="2" fill="none" stroke="${darken(main, 0.2)}" stroke-width="0.8"/>
      <line x1="${bx}" y1="${by}" x2="${bx + 28}" y2="${by}" stroke="${darken(main, 0.3)}" stroke-width="1.2"/>`;
  }

  // Bordados
  if (hasBordado) {
    const bx = 175 + rand() * 50;
    const by = 180 + rand() * 40;
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const r = 8 + rand() * 6;
      svg += `<circle cx="${bx + Math.cos(angle) * r}" cy="${by + Math.sin(angle) * r}" r="${1.5 + rand()}" fill="${accent}" opacity="0.6"/>`;
    }
    svg += `<circle cx="${bx}" cy="${by}" r="3" fill="${accent}" opacity="0.4"/>`;
  }

  return svg;
}

function generateJaqueta(peca: PecaDesignGerada, rand: () => number): string {
  const main = peca.cores[0] || "#1a1a2e";
  const accent = peca.cores[1] || "#444";
  const shoulderW = 90;
  const hemY = 310;

  let svg = `
    <defs>
      <linearGradient id="mainGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${lighten(main, 0.1)}"/>
        <stop offset="100%" stop-color="${darken(main, 0.15)}"/>
      </linearGradient>
    </defs>`;

  svg += generateManequimBase(rand);

  // Body - jaqueta aberta
  svg += `
    <path d="M180,88 L${200 - shoulderW},100 L${200 - shoulderW - 20},170 L${200 - shoulderW + 10},175 L${200 - 75},160 L${200 - 75},${hemY} L195,${hemY} L195,110 Z"
      fill="url(#mainGrad)" stroke="${darken(main, 0.3)}" stroke-width="1"/>
    <path d="M220,88 L${200 + shoulderW},100 L${200 + shoulderW + 20},170 L${200 + shoulderW - 10},175 L${200 + 75},160 L${200 + 75},${hemY} L205,${hemY} L205,110 Z"
      fill="url(#mainGrad)" stroke="${darken(main, 0.3)}" stroke-width="1"/>`;

  // Zipper center
  svg += `<line x1="200" y1="95" x2="200" y2="${hemY}" stroke="${accent}" stroke-width="2"/>`;
  for (let y = 100; y < hemY; y += 12) {
    svg += `<line x1="198" y1="${y}" x2="202" y2="${y + 4}" stroke="${accent}" stroke-width="0.8"/>`;
  }

  // Collar
  svg += `<path d="M180,88 Q185,78 200,80 Q215,78 220,88" fill="${darken(main, 0.15)}" stroke="${darken(main, 0.3)}" stroke-width="1"/>`;

  // Pockets
  svg += `<rect x="135" y="220" width="42" height="35" rx="2" fill="none" stroke="${darken(main, 0.2)}" stroke-width="0.8"/>`;
  svg += `<rect x="223" y="220" width="42" height="35" rx="2" fill="none" stroke="${darken(main, 0.2)}" stroke-width="0.8"/>`;

  return svg;
}

function generateVestido(peca: PecaDesignGerada, rand: () => number): string {
  const main = peca.cores[0] || "#7b1fa2";
  const accent = peca.cores[1] || "#ffffff";
  const hemY = 420 + rand() * 40;
  const waistW = 55 + rand() * 10;
  const skirtW = 85 + rand() * 25;

  let svg = `
    <defs>
      <linearGradient id="mainGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${lighten(main, 0.1)}"/>
        <stop offset="60%" stop-color="${main}"/>
        <stop offset="100%" stop-color="${darken(main, 0.2)}"/>
      </linearGradient>
    </defs>`;

  svg += generateManequimBase(rand);

  // Dress body
  svg += `
    <path d="
      M185,88 L155,100 L148,140 L${200 - waistW},200
      Q${200 - waistW - 5},220 ${200 - skirtW},${hemY}
      Q200,${hemY + 15} ${200 + skirtW},${hemY}
      Q${200 + waistW + 5},220 ${200 + waistW},200
      L252,140 L245,100 L215,88
      Q200,82 185,88 Z"
      fill="url(#mainGrad)" stroke="${darken(main, 0.3)}" stroke-width="1.2"/>`;

  // Waist line
  svg += `<path d="M${200 - waistW},200 Q200,205 ${200 + waistW},200" fill="none" stroke="${darken(main, 0.2)}" stroke-width="1"/>`;

  // Draping lines
  for (let i = 0; i < 4; i++) {
    const x = 200 + (rand() - 0.5) * skirtW;
    svg += `<path d="M${x},${210 + rand() * 30} Q${x + (rand() - 0.5) * 20},${hemY - 40} ${x + (rand() - 0.5) * 15},${hemY - 5}" fill="none" stroke="${darken(main, 0.1)}" stroke-width="0.5" opacity="0.6"/>`;
  }

  // Accent detail at neckline
  svg += `<path d="M185,88 Q200,${92 + rand() * 8} 215,88" fill="none" stroke="${accent}" stroke-width="1.5" opacity="0.6"/>`;

  return svg;
}

function generateCalca(peca: PecaDesignGerada, rand: () => number): string {
  const main = peca.cores[0] || "#1e1e2e";
  const isSlim = (peca.corte || "").toLowerCase().includes("slim");
  const legW = isSlim ? 28 : 38;
  const hemY = 480;

  let svg = `
    <defs>
      <linearGradient id="mainGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${main}"/>
        <stop offset="100%" stop-color="${darken(main, 0.15)}"/>
      </linearGradient>
    </defs>`;

  svg += generateManequimBase(rand);

  // Waistband
  svg += `<rect x="135" y="180" width="130" height="18" rx="3" fill="${darken(main, 0.1)}" stroke="${darken(main, 0.3)}" stroke-width="1"/>`;

  // Left leg
  svg += `<path d="M140,198 L${185 - legW},${hemY} L${185 + legW},${hemY} L200,198 Z" fill="url(#mainGrad)" stroke="${darken(main, 0.3)}" stroke-width="1"/>`;
  // Right leg
  svg += `<path d="M200,198 L${215 - legW},${hemY} L${215 + legW},${hemY} L260,198 Z" fill="url(#mainGrad)" stroke="${darken(main, 0.3)}" stroke-width="1"/>`;

  // Center seam
  svg += `<line x1="200" y1="198" x2="200" y2="320" stroke="${darken(main, 0.15)}" stroke-width="0.8"/>`;

  // Pockets
  svg += `<path d="M148,200 L148,230 L165,225" fill="none" stroke="${darken(main, 0.2)}" stroke-width="0.8"/>`;
  svg += `<path d="M252,200 L252,230 L235,225" fill="none" stroke="${darken(main, 0.2)}" stroke-width="0.8"/>`;

  return svg;
}

function generateGenericPeca(peca: PecaDesignGerada, rand: () => number): string {
  const main = peca.cores[0] || "#1a1a2e";
  const accent = peca.cores[1] || "#ffffff";

  let svg = `
    <defs>
      <linearGradient id="mainGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${lighten(main, 0.1)}"/>
        <stop offset="100%" stop-color="${darken(main, 0.2)}"/>
      </linearGradient>
    </defs>`;

  // Generic item shape
  const cx = 200, cy = 250;
  const w = 120 + rand() * 40;
  const h = 140 + rand() * 60;

  svg += `<rect x="${cx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}" rx="12" fill="url(#mainGrad)" stroke="${darken(main, 0.3)}" stroke-width="1.5"/>`;
  svg += `<rect x="${cx - w / 2 + 10}" y="${cy - h / 2 + 10}" width="${w - 20}" height="${h - 20}" rx="6" fill="none" stroke="${accent}" stroke-width="0.5" opacity="0.3"/>`;

  // Detail circles
  for (let i = 0; i < 3; i++) {
    svg += `<circle cx="${cx + (rand() - 0.5) * w * 0.6}" cy="${cy + (rand() - 0.5) * h * 0.6}" r="${4 + rand() * 8}" fill="${accent}" opacity="${0.1 + rand() * 0.2}"/>`;
  }

  return svg;
}

function generateStyleOverlay(peca: PecaDesignGerada, rand: () => number): string {
  const estilo = (peca.estilo || "").toLowerCase();
  const accent = peca.cores[1] || peca.cores[0] || "#a855f7";
  let svg = "";

  if (estilo.includes("cyberpunk") || estilo.includes("futurista")) {
    // Neon lines
    for (let i = 0; i < 3; i++) {
      const y = 120 + rand() * 300;
      svg += `<line x1="${100 + rand() * 50}" y1="${y}" x2="${250 + rand() * 50}" y2="${y + (rand() - 0.5) * 30}" stroke="${accent}" stroke-width="0.5" opacity="0.4"/>`;
    }
    // Glow dots
    for (let i = 0; i < 5; i++) {
      svg += `<circle cx="${140 + rand() * 120}" cy="${130 + rand() * 250}" r="2" fill="${accent}" opacity="0.6">
        <animate attributeName="opacity" values="0.3;0.8;0.3" dur="${1.5 + rand() * 2}s" repeatCount="indefinite"/>
      </circle>`;
    }
  }

  if (estilo.includes("grunge")) {
    // Scratch marks
    for (let i = 0; i < 6; i++) {
      const x = 150 + rand() * 100;
      const y = 130 + rand() * 250;
      svg += `<line x1="${x}" y1="${y}" x2="${x + (rand() - 0.5) * 40}" y2="${y + rand() * 20}" stroke="rgba(255,255,255,0.1)" stroke-width="${0.5 + rand() * 1.5}"/>`;
    }
  }

  if (estilo.includes("boho")) {
    // Floral dots
    for (let i = 0; i < 8; i++) {
      const fx = 155 + rand() * 90;
      const fy = 200 + rand() * 150;
      svg += `<circle cx="${fx}" cy="${fy}" r="${2 + rand() * 3}" fill="${accent}" opacity="0.2"/>`;
    }
  }

  return svg;
}

export function gerarSketchFallback(peca: PecaDesignGerada): string {
  const seed = `${peca.nome}-${peca.estilo}-${peca.tipo}-${peca.inspiracao || ""}-${peca.cores.join("")}-${peca.corte}-${peca.tecido}-${peca.elementosVisuais}`;
  const rand = seededRandom(seed);

  const tipo = (peca.tipo || "").toLowerCase();
  const main = peca.cores[0] || "#1a1a2e";

  let innerSvg = "";

  // Background
  innerSvg += `
    <defs>
      <radialGradient id="bgGrad" cx="50%" cy="40%">
        <stop offset="0%" stop-color="${lighten(main, 0.95)}"/>
        <stop offset="100%" stop-color="${lighten(main, 0.85)}"/>
      </radialGradient>
    </defs>
    <rect width="400" height="550" fill="url(#bgGrad)"/>`;

  // Type-specific drawing
  if (tipo.includes("camiseta") || tipo.includes("camisa") || tipo.includes("regata") || tipo.includes("moletom")) {
    innerSvg += generateCamiseta(peca, rand);
  } else if (tipo.includes("jaqueta") || tipo.includes("blazer")) {
    innerSvg += generateJaqueta(peca, rand);
  } else if (tipo.includes("vestido") || tipo.includes("saia")) {
    innerSvg += generateVestido(peca, rand);
  } else if (tipo.includes("calca") || tipo.includes("shorts")) {
    innerSvg += generateCalca(peca, rand);
  } else {
    innerSvg += generateGenericPeca(peca, rand);
  }

  // Style overlay
  innerSvg += generateStyleOverlay(peca, rand);

  // Label
  innerSvg += `
    <text x="200" y="520" text-anchor="middle" fill="${darken(main, 0.3)}" font-size="10" font-family="system-ui, sans-serif" font-style="italic" opacity="0.6">
      ${peca.tipo} · ${peca.estilo} · sketch gerado
    </text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 550">${innerSvg}</svg>`;
}
