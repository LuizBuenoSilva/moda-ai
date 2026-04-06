"use client";

import { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from "react";
import { PecaDesignGerada } from "@/types/designer";

export interface PecaSketchHandle {
  exportImage: () => string | null;
  clearDrawing: () => void;
}

interface PecaSketchProps {
  peca: PecaDesignGerada;
  editable?: boolean;
}

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : { r: 26, g: 26, b: 46 };
}

function darken(hex: string, amount: number) {
  const { r, g, b } = hexToRgb(hex);
  const f = 1 - amount;
  return `rgb(${Math.round(r * f)}, ${Math.round(g * f)}, ${Math.round(b * f)})`;
}

function lighten(hex: string, amount: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgb(${Math.round(r + (255 - r) * amount)}, ${Math.round(g + (255 - g) * amount)}, ${Math.round(b + (255 - b) * amount)})`;
}

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

const DRAW_COLORS = ["#ffffff", "#000000", "#e53935", "#1565c0", "#2e7d32", "#fdd835", "#f06292", "#7b1fa2", "#ef6c00", "#78909c"];
const BRUSH_SIZES = [2, 4, 8, 14, 22];

const PecaSketch = forwardRef<PecaSketchHandle, PecaSketchProps>(function PecaSketch({ peca, editable = false }, ref) {
  const baseCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [drawMode, setDrawMode] = useState(false);
  const [tool, setTool] = useState<"brush" | "eraser">("brush");
  const [brushColor, setBrushColor] = useState("#ffffff");
  const [brushSize, setBrushSize] = useState(4);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  // Render base sketch
  useEffect(() => {
    const canvas = baseCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const mainColor = peca.cores[0] || "#1a1a2e";
    const accentColor = peca.cores[1] || "#ffffff";
    const thirdColor = peca.cores[2] || accentColor;

    const seed = `${peca.nome}-${peca.estilo}-${peca.tipo}-${peca.inspiracao || ""}-${peca.cores.join("")}-${peca.corte}-${peca.tecido}`;
    const rand = seededRandom(seed);

    ctx.clearRect(0, 0, w, h);

    const bgGrad = ctx.createRadialGradient(cx, h / 2, 50, cx, h / 2, h * 0.7);
    bgGrad.addColorStop(0, "#1e1e2e");
    bgGrad.addColorStop(1, "#0a0a14");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "rgba(255,255,255,0.03)";
    ctx.lineWidth = 0.5;
    for (let i = 0; i < w; i += 20) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke();
    }
    for (let i = 0; i < h; i += 20) {
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke();
    }

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const estilo = peca.estilo.toLowerCase();
    const corte = (peca.corte || "").toLowerCase();
    const isOversized = corte.includes("oversized") || corte.includes("solto") || corte.includes("fluido");
    const isSlim = corte.includes("slim") || corte.includes("angular") || corte.includes("reto");
    const fitScale = isOversized ? 1.2 : isSlim ? 0.85 : 1.0;
    const tipo = peca.tipo.toLowerCase();

    if (tipo === "camiseta" || tipo === "camisa" || tipo === "regata") {
      drawTop(ctx, cx, h, mainColor, accentColor, thirdColor, tipo, estilo, fitScale, rand);
    } else if (tipo === "jaqueta" || tipo === "blazer" || tipo === "moletom") {
      drawOuterwear(ctx, cx, h, mainColor, accentColor, thirdColor, tipo, estilo, fitScale, rand);
    } else if (tipo === "calca" || tipo === "shorts") {
      drawBottom(ctx, cx, h, mainColor, accentColor, thirdColor, tipo, estilo, fitScale, rand);
    } else if (tipo === "saia" || tipo === "vestido") {
      drawSkirtDress(ctx, cx, h, mainColor, accentColor, thirdColor, tipo, estilo, fitScale, rand);
    } else if (tipo === "tenis" || tipo === "bota") {
      drawShoe(ctx, cx, h, mainColor, accentColor, thirdColor, tipo, estilo, rand);
    } else if (tipo === "bolsa" || tipo === "acessorio") {
      drawAccessory(ctx, cx, h, mainColor, accentColor, thirdColor, tipo, estilo, rand);
    } else {
      drawTop(ctx, cx, h, mainColor, accentColor, thirdColor, "camiseta", estilo, fitScale, rand);
    }

    drawStyleOverlays(ctx, w, h, estilo, accentColor, thirdColor, rand);

    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "italic 14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${peca.estilo.toUpperCase()} • ${peca.tipo.toUpperCase()}`, cx, h - 15);

    if (peca.inspiracao) {
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.font = "italic 12px sans-serif";
      ctx.fillText(`Inspired by: ${peca.inspiracao}`, cx, h - 34);
    }
  }, [peca]);

  const getCanvasPos = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      const t = e.touches[0];
      return { x: (t.clientX - rect.left) * scaleX, y: (t.clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  }, []);

  const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!drawMode) return;
    e.preventDefault();
    setDrawing(true);
    lastPos.current = getCanvasPos(e);
  }, [drawMode, getCanvasPos]);

  const moveDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing || !drawMode) return;
    e.preventDefault();
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pos = getCanvasPos(e);
    if (!pos || !lastPos.current) return;

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = brushSize;

    if (tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = brushColor;
    }

    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    lastPos.current = pos;
  }, [drawing, drawMode, tool, brushColor, brushSize, getCanvasPos]);

  const stopDraw = useCallback(() => {
    setDrawing(false);
    lastPos.current = null;
  }, []);

  const clearDrawing = useCallback(() => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  const exportImage = useCallback((): string | null => {
    const base = baseCanvasRef.current;
    const draw = drawCanvasRef.current;
    if (!base) return null;
    const merged = document.createElement("canvas");
    merged.width = base.width;
    merged.height = base.height;
    const ctx = merged.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(base, 0, 0);
    if (draw) ctx.drawImage(draw, 0, 0);
    return merged.toDataURL("image/png");
  }, []);

  useImperativeHandle(ref, () => ({ exportImage, clearDrawing }), [exportImage, clearDrawing]);

  return (
    <div className="relative">
      <div className="relative w-full max-w-[400px] mx-auto">
        <canvas
          ref={baseCanvasRef}
          width={400}
          height={500}
          className="w-full rounded-2xl border border-zinc-800"
        />
        {editable && (
          <canvas
            ref={drawCanvasRef}
            width={400}
            height={500}
            className={`absolute inset-0 w-full h-full rounded-2xl ${drawMode ? "cursor-crosshair" : "pointer-events-none"}`}
            onMouseDown={startDraw}
            onMouseMove={moveDraw}
            onMouseUp={stopDraw}
            onMouseLeave={stopDraw}
            onTouchStart={startDraw}
            onTouchMove={moveDraw}
            onTouchEnd={stopDraw}
          />
        )}
        <div className="absolute top-3 right-3 bg-zinc-900/80 backdrop-blur px-2 py-1 rounded-lg">
          <span className="text-xs text-purple-400 font-medium">SKETCH</span>
        </div>
      </div>

      {/* Drawing toolbar */}
      {editable && (
        <div className="mt-3 max-w-[400px] mx-auto space-y-2">
          {/* Toggle draw mode */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDrawMode(!drawMode)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                drawMode
                  ? "gradient-bg text-white"
                  : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700"
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              {drawMode ? "Desenho: ON" : "Desenhar"}
            </button>
            {drawMode && (
              <button
                onClick={clearDrawing}
                className="px-3 py-2 rounded-xl text-sm bg-zinc-800 text-red-400 hover:bg-red-500/20 border border-zinc-700 transition-colors"
                title="Limpar desenho"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>

          {/* Tools */}
          {drawMode && (
            <>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTool("brush")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    tool === "brush" ? "gradient-bg text-white" : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                  }`}
                >
                  Pincel
                </button>
                <button
                  onClick={() => setTool("eraser")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    tool === "eraser" ? "gradient-bg text-white" : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                  }`}
                >
                  Borracha
                </button>
                <div className="flex-1" />
                <div className="flex gap-1">
                  {BRUSH_SIZES.map((s) => (
                    <button
                      key={s}
                      onClick={() => setBrushSize(s)}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                        brushSize === s ? "bg-zinc-600 ring-1 ring-purple-500" : "bg-zinc-800 hover:bg-zinc-700"
                      }`}
                      title={`${s}px`}
                    >
                      <div className="rounded-full bg-zinc-300" style={{ width: Math.min(s, 16), height: Math.min(s, 16) }} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Colors */}
              {tool === "brush" && (
                <div className="flex items-center gap-1.5">
                  {DRAW_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setBrushColor(c)}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${
                        brushColor === c ? "border-white scale-110" : "border-zinc-700 hover:border-zinc-500"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  {peca.cores.filter((c) => !DRAW_COLORS.includes(c)).map((c) => (
                    <button
                      key={c}
                      onClick={() => setBrushColor(c)}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${
                        brushColor === c ? "border-white scale-110" : "border-zinc-700 hover:border-zinc-500"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
});

export default PecaSketch;

// Style-specific decorative overlays
function drawStyleOverlays(ctx: CanvasRenderingContext2D, w: number, h: number, estilo: string, accent: string, third: string, rand: () => number) {
  if (estilo === "cyberpunk" || estilo === "futurista") {
    // Neon glow lines
    ctx.globalAlpha = 0.15;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const x1 = rand() * w; const y1 = rand() * h;
      const x2 = rand() * w; const y2 = rand() * h;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  } else if (estilo === "grunge") {
    // Splatter dots
    ctx.globalAlpha = 0.08;
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = rand() > 0.5 ? accent : third;
      ctx.beginPath();
      ctx.arc(rand() * w, rand() * h, rand() * 4 + 1, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  } else if (estilo === "boho") {
    // Small flower/circle patterns along edges
    ctx.globalAlpha = 0.1;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 0.8;
    for (let i = 0; i < 12; i++) {
      const x = rand() * w;
      const y = rand() * h;
      const r = rand() * 6 + 3;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
      for (let p = 0; p < 5; p++) {
        const a = (p / 5) * Math.PI * 2;
        ctx.beginPath(); ctx.arc(x + Math.cos(a) * r * 1.5, y + Math.sin(a) * r * 1.5, r * 0.4, 0, Math.PI * 2); ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }
}

function drawTop(ctx: CanvasRenderingContext2D, cx: number, h: number, color: string, accent: string, third: string, tipo: string, estilo: string, fit: number, rand: () => number) {
  const y = 80;
  const bodyW = 140 * fit;
  const bodyH = 200 + (rand() * 30 - 15);
  const shoulderW = (tipo === "regata" ? 100 : 170) * fit;
  const sleeveLen = tipo === "regata" ? 0 : (50 + rand() * 40);
  const sleeveW = 30 + rand() * 20;
  const neckW = 25 + rand() * 15;
  const neckDepth = tipo === "camisa" ? 15 + rand() * 10 : 10 + rand() * 20;

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.beginPath(); ctx.ellipse(cx, y + bodyH + 10, bodyW * 0.6, 15, 0, 0, Math.PI * 2); ctx.fill();

  // Main gradient
  const gradAngle = rand() * 0.3;
  const grad = ctx.createLinearGradient(cx - bodyW / 2, y + bodyH * gradAngle, cx + bodyW / 2, y + bodyH);
  grad.addColorStop(0, lighten(color, 0.15));
  grad.addColorStop(0.5, color);
  grad.addColorStop(1, darken(color, 0.2));
  ctx.fillStyle = grad;

  ctx.beginPath();
  if (tipo === "regata") {
    ctx.moveTo(cx - neckW, y);
    ctx.quadraticCurveTo(cx - bodyW / 2 - 10, y + 20, cx - bodyW / 2, y + 50);
    ctx.quadraticCurveTo(cx - bodyW / 2 + rand() * 5, y + bodyH * 0.7, cx - bodyW / 2 + 10, y + bodyH);
    ctx.lineTo(cx + bodyW / 2 - 10, y + bodyH);
    ctx.quadraticCurveTo(cx + bodyW / 2 - rand() * 5, y + bodyH * 0.7, cx + bodyW / 2, y + 50);
    ctx.quadraticCurveTo(cx + bodyW / 2 + 10, y + 20, cx + neckW, y);
    ctx.quadraticCurveTo(cx, y - neckDepth, cx - neckW, y);
  } else {
    ctx.moveTo(cx - neckW, y);
    ctx.lineTo(cx - shoulderW / 2, y + 10 + rand() * 5);
    ctx.lineTo(cx - shoulderW / 2 - sleeveW, y + sleeveLen + 10);
    ctx.lineTo(cx - shoulderW / 2 - sleeveW + 15, y + sleeveLen + 15);
    ctx.lineTo(cx - shoulderW / 2, y + sleeveLen);
    ctx.quadraticCurveTo(cx - bodyW / 2 - 5, y + 50, cx - bodyW / 2 + 10, y + bodyH);
    ctx.lineTo(cx + bodyW / 2 - 10, y + bodyH);
    ctx.quadraticCurveTo(cx + bodyW / 2 + 5, y + 50, cx + shoulderW / 2, y + sleeveLen);
    ctx.lineTo(cx + shoulderW / 2 + sleeveW - 15, y + sleeveLen + 15);
    ctx.lineTo(cx + shoulderW / 2 + sleeveW, y + sleeveLen + 10);
    ctx.lineTo(cx + shoulderW / 2, y + 10 + rand() * 5);
    ctx.lineTo(cx + neckW, y);
    ctx.quadraticCurveTo(cx, y - neckDepth, cx - neckW, y);
  }
  ctx.closePath();
  ctx.fill();

  // Outline
  ctx.strokeStyle = darken(color, 0.4);
  ctx.lineWidth = 2;
  ctx.stroke();

  // Collar style varies
  if (tipo === "camisa") {
    // Pointed collar
    ctx.fillStyle = darken(color, 0.1);
    ctx.beginPath();
    ctx.moveTo(cx - neckW - 5, y - 2);
    ctx.lineTo(cx - neckW - 20, y + 25);
    ctx.lineTo(cx - 8, y + 12);
    ctx.lineTo(cx, y + 5);
    ctx.lineTo(cx + 8, y + 12);
    ctx.lineTo(cx + neckW + 20, y + 25);
    ctx.lineTo(cx + neckW + 5, y - 2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = darken(color, 0.35);
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Buttons
    ctx.fillStyle = accent;
    const btnCount = 4 + Math.floor(rand() * 3);
    for (let i = 0; i < btnCount; i++) {
      const by = y + 18 + (i * (bodyH - 30) / btnCount);
      ctx.beginPath(); ctx.arc(cx, by, 3, 0, Math.PI * 2); ctx.fill();
    }
  } else {
    // Round/V neck
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx - neckW, y);
    ctx.quadraticCurveTo(cx, y + neckDepth, cx + neckW, y);
    ctx.stroke();
  }

  // Style-specific details on the garment
  if (estilo === "streetwear") {
    // Bold graphic block
    const gx = cx - 30 + rand() * 10;
    const gy = y + 60 + rand() * 30;
    const gw = 60 + rand() * 20;
    const gh = 40 + rand() * 20;
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.3;
    ctx.fillRect(gx, gy, gw, gh);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1;
    ctx.strokeRect(gx, gy, gw, gh);
  } else if (estilo === "minimalista") {
    // Subtle pocket
    ctx.strokeStyle = darken(color, 0.12);
    ctx.lineWidth = 1;
    const px = cx - 35 + rand() * 10;
    ctx.beginPath();
    ctx.roundRect(px, y + 55 + rand() * 15, 30, 35, 3);
    ctx.stroke();
  } else if (estilo === "vintage") {
    // Faded logo circle
    ctx.globalAlpha = 0.2;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, y + 90 + rand() * 30, 25 + rand() * 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  } else if (estilo === "cyberpunk" || estilo === "futurista") {
    // Geometric accent lines
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.5;
    const lineY = y + 40 + rand() * 60;
    ctx.beginPath();
    ctx.moveTo(cx - bodyW / 2 + 10, lineY);
    ctx.lineTo(cx - 10, lineY + 15);
    ctx.lineTo(cx + bodyW / 2 - 10, lineY);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // Seam line (varied position)
  ctx.strokeStyle = darken(color, 0.15);
  ctx.lineWidth = 1;
  ctx.setLineDash([3 + rand() * 3, 3 + rand() * 3]);
  ctx.beginPath();
  ctx.moveTo(cx, y + neckDepth + 5);
  ctx.lineTo(cx, y + bodyH - 5);
  ctx.stroke();
  ctx.setLineDash([]);

  // Hem
  ctx.strokeStyle = darken(color, 0.25);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - bodyW / 2 + 15, y + bodyH);
  ctx.quadraticCurveTo(cx, y + bodyH + 3 * (rand() - 0.5), cx + bodyW / 2 - 15, y + bodyH);
  ctx.stroke();

  // Secondary color stripe/band
  if (third !== accent) {
    ctx.fillStyle = third;
    ctx.globalAlpha = 0.25;
    const stripeY = y + bodyH - 20 - rand() * 30;
    ctx.fillRect(cx - bodyW / 2 + 10, stripeY, bodyW - 20, 8 + rand() * 6);
    ctx.globalAlpha = 1;
  }
}

function drawOuterwear(ctx: CanvasRenderingContext2D, cx: number, h: number, color: string, accent: string, third: string, tipo: string, estilo: string, fit: number, rand: () => number) {
  const y = 50;
  const bodyW = 160 * fit;
  const bodyH = 240 + rand() * 20;
  const sleeveExtend = 40 + rand() * 20;

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.beginPath(); ctx.ellipse(cx, y + bodyH + 10, bodyW * 0.6, 15, 0, 0, Math.PI * 2); ctx.fill();

  // Main body
  const grad = ctx.createLinearGradient(cx - bodyW / 2, y, cx + bodyW / 2, y + bodyH);
  grad.addColorStop(0, lighten(color, 0.1));
  grad.addColorStop(1, darken(color, 0.25));
  ctx.fillStyle = grad;

  const shoulderDrop = 15 + rand() * 10;
  ctx.beginPath();
  ctx.moveTo(cx - 25, y);
  ctx.lineTo(cx - bodyW / 2 - 20, y + shoulderDrop);
  ctx.lineTo(cx - bodyW / 2 - sleeveExtend, y + 110 + rand() * 20);
  ctx.lineTo(cx - bodyW / 2 - sleeveExtend + 20, y + 115 + rand() * 20);
  ctx.lineTo(cx - bodyW / 2, y + 50);
  ctx.quadraticCurveTo(cx - bodyW / 2 + rand() * 5, y + bodyH * 0.6, cx - bodyW / 2 + 5, y + bodyH);
  ctx.lineTo(cx + bodyW / 2 - 5, y + bodyH);
  ctx.quadraticCurveTo(cx + bodyW / 2 - rand() * 5, y + bodyH * 0.6, cx + bodyW / 2, y + 50);
  ctx.lineTo(cx + bodyW / 2 + sleeveExtend - 20, y + 115 + rand() * 20);
  ctx.lineTo(cx + bodyW / 2 + sleeveExtend, y + 110 + rand() * 20);
  ctx.lineTo(cx + bodyW / 2 + 20, y + shoulderDrop);
  ctx.lineTo(cx + 25, y);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = darken(color, 0.4);
  ctx.lineWidth = 2;
  ctx.stroke();

  // Center zipper/opening
  const zipStyle = rand();
  if (zipStyle > 0.5) {
    // Zipper with teeth
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx, y + 5); ctx.lineTo(cx, y + bodyH - 5); ctx.stroke();
    ctx.lineWidth = 1;
    for (let i = 0; i < 15; i++) {
      const zy = y + 15 + i * ((bodyH - 25) / 15);
      ctx.beginPath(); ctx.moveTo(cx - 4, zy); ctx.lineTo(cx + 4, zy); ctx.stroke();
    }
  } else {
    // Button line
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(cx, y + 10); ctx.lineTo(cx, y + bodyH - 5); ctx.stroke();
    ctx.fillStyle = accent;
    const btns = 4 + Math.floor(rand() * 3);
    for (let i = 0; i < btns; i++) {
      ctx.beginPath();
      ctx.arc(cx, y + 30 + i * ((bodyH - 50) / btns), 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Collar based on type
  if (tipo === "blazer") {
    ctx.fillStyle = darken(color, 0.15);
    const lapelW = 20 + rand() * 15;
    ctx.beginPath();
    ctx.moveTo(cx - 25, y);
    ctx.lineTo(cx - 25 - lapelW, y + 50 + rand() * 15);
    ctx.lineTo(cx - 20, y + 40);
    ctx.lineTo(cx, y + 10);
    ctx.lineTo(cx + 20, y + 40);
    ctx.lineTo(cx + 25 + lapelW, y + 50 + rand() * 15);
    ctx.lineTo(cx + 25, y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = darken(color, 0.4);
    ctx.lineWidth = 1.5;
    ctx.stroke();
  } else if (tipo === "moletom") {
    // Hood with varied size
    const hoodH = 35 + rand() * 20;
    ctx.fillStyle = darken(color, 0.1);
    ctx.beginPath();
    ctx.moveTo(cx - 35, y);
    ctx.quadraticCurveTo(cx - 45 - rand() * 10, y - hoodH, cx, y - hoodH - 5);
    ctx.quadraticCurveTo(cx + 45 + rand() * 10, y - hoodH, cx + 35, y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = darken(color, 0.35);
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Drawstrings
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 8, y + 5);
    ctx.lineTo(cx - 10, y + 50 + rand() * 20);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 8, y + 5);
    ctx.lineTo(cx + 10, y + 50 + rand() * 20);
    ctx.stroke();
  } else {
    // Jaqueta - stand collar
    ctx.fillStyle = darken(color, 0.15);
    ctx.beginPath();
    ctx.roundRect(cx - 28, y - 12, 56, 15, 4);
    ctx.fill();
    ctx.strokeStyle = darken(color, 0.35);
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Pockets - varied positions
  ctx.strokeStyle = darken(color, 0.2);
  ctx.lineWidth = 1.5;
  const pocketY = y + 120 + rand() * 40;
  const pocketW = 40 + rand() * 15;
  ctx.beginPath(); ctx.roundRect(cx - bodyW / 2 + 15, pocketY, pocketW, 5 + rand() * 15, 2); ctx.stroke();
  ctx.beginPath(); ctx.roundRect(cx + bodyW / 2 - 15 - pocketW, pocketY, pocketW, 5 + rand() * 15, 2); ctx.stroke();

  // Estilo-specific detail
  if (estilo === "streetwear") {
    // Patch/logo on chest
    ctx.fillStyle = third;
    ctx.globalAlpha = 0.3;
    ctx.beginPath(); ctx.roundRect(cx - 55, y + 60, 35, 25, 4); ctx.fill();
    ctx.globalAlpha = 1;
  } else if (estilo === "cyberpunk" || estilo === "futurista") {
    // Reflective strips
    ctx.strokeStyle = accent;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.4;
    ctx.beginPath(); ctx.moveTo(cx - bodyW / 2 + 10, y + 70); ctx.lineTo(cx - bodyW / 2 + 10, y + bodyH - 10); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + bodyW / 2 - 10, y + 70); ctx.lineTo(cx + bodyW / 2 - 10, y + bodyH - 10); ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // Arm seams
  ctx.strokeStyle = darken(color, 0.12);
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 4]);
  ctx.beginPath(); ctx.moveTo(cx - bodyW / 2, y + 50); ctx.lineTo(cx - bodyW / 2 - sleeveExtend + 10, y + 115); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + bodyW / 2, y + 50); ctx.lineTo(cx + bodyW / 2 + sleeveExtend - 10, y + 115); ctx.stroke();
  ctx.setLineDash([]);
}

function drawBottom(ctx: CanvasRenderingContext2D, cx: number, h: number, color: string, accent: string, third: string, tipo: string, estilo: string, fit: number, rand: () => number) {
  const y = 60;
  const waistW = (125 + rand() * 20) * fit;
  const isShorts = tipo === "shorts";
  const legH = isShorts ? (130 + rand() * 30) : (280 + rand() * 40);
  const legOpenW = isShorts ? (waistW * 0.5) : (30 + rand() * 30);
  const hipW = waistW + 10 + rand() * 10;

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.beginPath(); ctx.ellipse(cx, y + legH + 50, waistW * 0.5, 12, 0, 0, Math.PI * 2); ctx.fill();

  const grad = ctx.createLinearGradient(cx, y, cx, y + legH + 40);
  grad.addColorStop(0, lighten(color, 0.1));
  grad.addColorStop(1, darken(color, 0.2));
  ctx.fillStyle = grad;

  const crotchY = y + 70 + rand() * 20;

  ctx.beginPath();
  ctx.moveTo(cx - waistW / 2, y);
  ctx.quadraticCurveTo(cx - hipW / 2, y + 30, cx - hipW / 2 + 5, crotchY);
  // Left leg
  if (isShorts) {
    ctx.lineTo(cx - legOpenW, y + legH + 40);
    ctx.lineTo(cx - 5, y + legH + 40);
  } else {
    ctx.quadraticCurveTo(cx - legOpenW - 15, y + legH * 0.5, cx - legOpenW, y + legH + 40);
    ctx.lineTo(cx - legOpenW + legOpenW * 0.8, y + legH + 40);
  }
  ctx.lineTo(cx, crotchY + 5);
  // Right leg
  if (isShorts) {
    ctx.lineTo(cx + 5, y + legH + 40);
    ctx.lineTo(cx + legOpenW, y + legH + 40);
  } else {
    ctx.lineTo(cx + legOpenW - legOpenW * 0.8, y + legH + 40);
    ctx.lineTo(cx + legOpenW, y + legH + 40);
  }
  ctx.quadraticCurveTo(cx + hipW / 2 - 5, y + 30, cx + hipW / 2 - 5, crotchY);
  ctx.quadraticCurveTo(cx + hipW / 2, y + 30, cx + waistW / 2, y);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = darken(color, 0.4);
  ctx.lineWidth = 2;
  ctx.stroke();

  // Waistband
  const wbH = 15 + rand() * 8;
  ctx.fillStyle = darken(color, 0.15);
  ctx.beginPath();
  ctx.moveTo(cx - waistW / 2, y);
  ctx.lineTo(cx - waistW / 2 + 2, y + wbH);
  ctx.lineTo(cx + waistW / 2 - 2, y + wbH);
  ctx.lineTo(cx + waistW / 2, y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = darken(color, 0.3);
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Belt loops
  ctx.strokeStyle = darken(color, 0.25);
  ctx.lineWidth = 1.5;
  const loops = 3 + Math.floor(rand() * 3);
  for (let i = 0; i < loops; i++) {
    const dx = -waistW / 2 + 15 + i * ((waistW - 30) / (loops - 1));
    ctx.beginPath(); ctx.moveTo(cx + dx, y); ctx.lineTo(cx + dx, y + wbH); ctx.stroke();
  }

  // Center seam
  ctx.strokeStyle = darken(color, 0.15);
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(cx, y + wbH); ctx.lineTo(cx, crotchY + 3); ctx.stroke();
  ctx.setLineDash([]);

  // Inner leg seams
  if (!isShorts) {
    ctx.strokeStyle = darken(color, 0.1);
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(cx - 10, crotchY + 5); ctx.lineTo(cx - legOpenW + legOpenW * 0.4, y + legH + 38); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 10, crotchY + 5); ctx.lineTo(cx + legOpenW - legOpenW * 0.4, y + legH + 38); ctx.stroke();
    ctx.setLineDash([]);
  }

  // Estilo details
  if (estilo === "streetwear") {
    // Cargo pocket
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.4;
    ctx.beginPath(); ctx.roundRect(cx - hipW / 2 + 10, crotchY + 30, 35, 30, 3); ctx.stroke();
    ctx.globalAlpha = 1;
  } else if (estilo === "classico" || estilo === "minimalista") {
    // Crease line
    ctx.strokeStyle = darken(color, 0.1);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx - waistW / 4, y + wbH + 5); ctx.lineTo(cx - legOpenW + legOpenW * 0.4, y + legH + 35); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + waistW / 4, y + wbH + 5); ctx.lineTo(cx + legOpenW - legOpenW * 0.4, y + legH + 35); ctx.stroke();
  }

  // Button/fly
  ctx.fillStyle = accent;
  ctx.beginPath(); ctx.arc(cx, y + wbH + 8, 3.5, 0, Math.PI * 2); ctx.fill();
}

function drawSkirtDress(ctx: CanvasRenderingContext2D, cx: number, h: number, color: string, accent: string, third: string, tipo: string, estilo: string, fit: number, rand: () => number) {
  const isDress = tipo === "vestido";
  const y = isDress ? 40 : 80;
  const waistW = (isDress ? 90 : 110) * fit;
  const hemW = (isDress ? 180 : 160) * fit + rand() * 30;
  const length = isDress ? (300 + rand() * 40) : (180 + rand() * 50);

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.beginPath(); ctx.ellipse(cx, y + length + 10, hemW * 0.5, 15, 0, 0, Math.PI * 2); ctx.fill();

  // Main gradient with varied direction
  const grad = ctx.createLinearGradient(cx - rand() * 30, y, cx + rand() * 30, y + length);
  grad.addColorStop(0, lighten(color, 0.15));
  grad.addColorStop(0.6, color);
  grad.addColorStop(1, darken(color, 0.15));
  ctx.fillStyle = grad;

  ctx.beginPath();
  if (isDress) {
    // Bodice + skirt
    const bustW = waistW + 20 + rand() * 10;
    const neckW = 20 + rand() * 15;
    ctx.moveTo(cx - neckW, y);
    ctx.lineTo(cx - bustW / 2, y + 20);
    // Straps or sleeves
    if (rand() > 0.5) {
      ctx.lineTo(cx - bustW / 2 - 20, y + 50);
      ctx.lineTo(cx - bustW / 2, y + 55);
    }
    ctx.quadraticCurveTo(cx - waistW / 2 - 5, y + 80, cx - waistW / 2, y + 100);
    ctx.quadraticCurveTo(cx - hemW / 2 - 10, y + length * 0.5, cx - hemW / 2, y + length);
    ctx.quadraticCurveTo(cx, y + length + 12, cx + hemW / 2, y + length);
    ctx.quadraticCurveTo(cx + hemW / 2 + 10, y + length * 0.5, cx + waistW / 2, y + 100);
    ctx.quadraticCurveTo(cx + waistW / 2 + 5, y + 80, cx + bustW / 2, y + 55);
    if (rand() > 0.5) {
      ctx.lineTo(cx + bustW / 2, y + 55);
      ctx.lineTo(cx + bustW / 2 + 20, y + 50);
    }
    ctx.lineTo(cx + bustW / 2, y + 20);
    ctx.lineTo(cx + neckW, y);
    ctx.quadraticCurveTo(cx, y - 8, cx - neckW, y);
  } else {
    ctx.moveTo(cx - waistW / 2, y);
    ctx.quadraticCurveTo(cx - hemW / 2 - 15, y + length * 0.5, cx - hemW / 2, y + length);
    ctx.quadraticCurveTo(cx, y + length + 15, cx + hemW / 2, y + length);
    ctx.quadraticCurveTo(cx + hemW / 2 + 15, y + length * 0.5, cx + waistW / 2, y);
  }
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = darken(color, 0.4);
  ctx.lineWidth = 2;
  ctx.stroke();

  // Folds/pleats - varied count and style
  const foldCount = 2 + Math.floor(rand() * 4);
  ctx.strokeStyle = darken(color, 0.12);
  ctx.lineWidth = 1;
  for (let i = 0; i < foldCount; i++) {
    const dx = -waistW / 2 + 10 + i * (waistW / foldCount);
    ctx.beginPath();
    ctx.moveTo(cx + dx, y + (isDress ? 100 : 30));
    ctx.quadraticCurveTo(cx + dx * 1.8, y + length * 0.6, cx + dx * 2.2, y + length - 5);
    ctx.stroke();
  }

  // Waistband / belt accent
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2.5;
  const waistY = isDress ? y + 100 : y;
  ctx.beginPath();
  ctx.moveTo(cx - waistW / 2, waistY);
  ctx.lineTo(cx + waistW / 2, waistY);
  ctx.stroke();

  // Hem decoration based on style
  if (estilo === "boho") {
    ctx.strokeStyle = third;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.4;
    for (let i = 0; i < 20; i++) {
      const x = cx - hemW / 2 + i * (hemW / 20);
      ctx.beginPath(); ctx.moveTo(x, y + length - 2); ctx.lineTo(x + rand() * 6 - 3, y + length + 8 + rand() * 5); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  } else if (estilo === "high-fashion") {
    // Asymmetric hem indicator
    ctx.fillStyle = third;
    ctx.globalAlpha = 0.15;
    ctx.beginPath();
    ctx.moveTo(cx - hemW / 2, y + length);
    ctx.quadraticCurveTo(cx - hemW / 4, y + length + 25, cx, y + length);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function drawShoe(ctx: CanvasRenderingContext2D, cx: number, h: number, color: string, accent: string, third: string, tipo: string, estilo: string, rand: () => number) {
  const y = 140;
  const isBoot = tipo === "bota";

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.beginPath();
  ctx.ellipse(cx, y + (isBoot ? 230 : 140), 100, 15, 0, 0, Math.PI * 2);
  ctx.fill();

  const grad = ctx.createLinearGradient(cx - 80, y, cx + 80, y + 200);
  grad.addColorStop(0, lighten(color, 0.15));
  grad.addColorStop(1, darken(color, 0.2));
  ctx.fillStyle = grad;

  if (isBoot) {
    const shaftH = 140 + rand() * 40;
    const shaftW = 48 + rand() * 12;
    const toeExt = 60 + rand() * 20;

    ctx.beginPath();
    ctx.moveTo(cx - shaftW, y);
    ctx.quadraticCurveTo(cx - shaftW - 3, y + shaftH * 0.5, cx - shaftW - 5, y + shaftH);
    ctx.quadraticCurveTo(cx - shaftW - 10, y + shaftH + 30, cx - 35, y + shaftH + 35);
    ctx.lineTo(cx + toeExt, y + shaftH + 35);
    ctx.quadraticCurveTo(cx + toeExt + 10, y + shaftH + 25, cx + toeExt + 5, y + shaftH);
    ctx.lineTo(cx + shaftW, y + shaftH);
    ctx.quadraticCurveTo(cx + shaftW + 3, y + shaftH * 0.5, cx + shaftW, y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = darken(color, 0.4);
    ctx.lineWidth = 2;
    ctx.stroke();

    // Sole
    ctx.fillStyle = "#1a1a1a";
    ctx.beginPath();
    ctx.moveTo(cx - shaftW - 5, y + shaftH + 30);
    ctx.lineTo(cx + toeExt + 5, y + shaftH + 30);
    ctx.lineTo(cx + toeExt, y + shaftH + 40);
    ctx.lineTo(cx - 35, y + shaftH + 40);
    ctx.closePath();
    ctx.fill();

    // Boot details
    if (estilo === "grunge" || estilo === "streetwear") {
      // Lace hooks
      ctx.fillStyle = accent;
      for (let i = 0; i < 6; i++) {
        const ly = y + 20 + i * (shaftH / 7);
        ctx.beginPath(); ctx.arc(cx - shaftW + 5, ly, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + shaftW - 5, ly, 2.5, 0, Math.PI * 2); ctx.fill();
      }
    }

    // Pull tab
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 5, y + 5);
    ctx.lineTo(cx - 5, y - 10);
    ctx.lineTo(cx + 5, y - 10);
    ctx.lineTo(cx + 5, y + 5);
    ctx.stroke();
  } else {
    // Sneaker/tenis - varied shapes
    const toeRound = 10 + rand() * 15;
    const heelH = 80 + rand() * 20;
    const toeLen = 80 + rand() * 20;

    ctx.beginPath();
    ctx.moveTo(cx - 40, y + 20);
    ctx.quadraticCurveTo(cx - 50, y + heelH * 0.5, cx - 45, y + heelH);
    ctx.quadraticCurveTo(cx - 50, y + heelH + 20, cx - 25, y + heelH + 25);
    ctx.lineTo(cx + toeLen, y + heelH + 25);
    ctx.quadraticCurveTo(cx + toeLen + toeRound, y + heelH + 15, cx + toeLen + toeRound - 5, y + heelH - 10);
    ctx.quadraticCurveTo(cx + toeLen, y + 40, cx + 20, y + 30);
    ctx.quadraticCurveTo(cx - 10, y + 20, cx - 40, y + 20);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = darken(color, 0.4);
    ctx.lineWidth = 2;
    ctx.stroke();

    // Sole
    const soleH = 12 + rand() * 8;
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.moveTo(cx - 48, y + heelH + 10);
    ctx.lineTo(cx + toeLen + toeRound - 5, y + heelH + 10);
    ctx.lineTo(cx + toeLen + toeRound - 10, y + heelH + 10 + soleH);
    ctx.lineTo(cx - 30, y + heelH + 10 + soleH);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = darken(accent, 0.3);
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Swoosh/stripe
    ctx.strokeStyle = third;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx + toeLen - 10, y + heelH - 5);
    ctx.quadraticCurveTo(cx + 20, y + 50, cx - 30, y + heelH - 15);
    ctx.stroke();

    // Laces
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.5;
    const laceCount = 3 + Math.floor(rand() * 3);
    for (let i = 0; i < laceCount; i++) {
      const lx = cx - 15 + i * 18;
      const ly = y + 40 + i * 8;
      ctx.beginPath(); ctx.moveTo(lx - 8, ly); ctx.lineTo(lx + 8, ly); ctx.stroke();
    }

    // Toe cap
    if (estilo === "classico" || estilo === "minimalista") {
      ctx.strokeStyle = darken(color, 0.15);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx + toeLen + toeRound - 15, y + heelH, 20, -0.5, 0.5);
      ctx.stroke();
    }
  }
}

function drawAccessory(ctx: CanvasRenderingContext2D, cx: number, h: number, color: string, accent: string, third: string, tipo: string, estilo: string, rand: () => number) {
  const y = 80;

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.beginPath(); ctx.ellipse(cx, y + 280, 90, 15, 0, 0, Math.PI * 2); ctx.fill();

  if (tipo === "bolsa") {
    const bagW = 140 + rand() * 40;
    const bagH = 170 + rand() * 40;
    const flapH = 40 + rand() * 30;
    const roundness = 5 + rand() * 15;

    const grad = ctx.createLinearGradient(cx - bagW / 2, y + 50, cx + bagW / 2, y + 50 + bagH);
    grad.addColorStop(0, lighten(color, 0.1));
    grad.addColorStop(1, darken(color, 0.2));
    ctx.fillStyle = grad;

    // Bag body
    ctx.beginPath();
    ctx.roundRect(cx - bagW / 2, y + 50, bagW, bagH, roundness);
    ctx.fill();
    ctx.strokeStyle = darken(color, 0.4);
    ctx.lineWidth = 2;
    ctx.stroke();

    // Flap
    ctx.fillStyle = darken(color, 0.1);
    ctx.beginPath();
    ctx.moveTo(cx - bagW / 2, y + 50);
    ctx.lineTo(cx - bagW / 2, y + 50 + flapH);
    ctx.quadraticCurveTo(cx, y + 50 + flapH + 15 + rand() * 10, cx + bagW / 2, y + 50 + flapH);
    ctx.lineTo(cx + bagW / 2, y + 50);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = darken(color, 0.35);
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Clasp
    ctx.fillStyle = accent;
    const claspShape = rand();
    if (claspShape > 0.5) {
      ctx.beginPath(); ctx.ellipse(cx, y + 50 + flapH + 5, 10, 8, 0, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.beginPath(); ctx.roundRect(cx - 8, y + 50 + flapH, 16, 10, 2); ctx.fill();
    }

    // Strap
    ctx.strokeStyle = darken(color, 0.15);
    const strapW = 5 + rand() * 4;
    ctx.lineWidth = strapW;
    ctx.beginPath();
    ctx.moveTo(cx - bagW / 2 + 15, y + 50);
    ctx.quadraticCurveTo(cx, y - 10 - rand() * 30, cx + bagW / 2 - 15, y + 50);
    ctx.stroke();

    // Hardware
    ctx.fillStyle = accent;
    ctx.beginPath(); ctx.arc(cx - bagW / 2 + 15, y + 52, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + bagW / 2 - 15, y + 52, 4, 0, Math.PI * 2); ctx.fill();

    // Stitching
    if (estilo !== "minimalista") {
      ctx.strokeStyle = darken(color, 0.15);
      ctx.lineWidth = 0.8;
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.roundRect(cx - bagW / 2 + 8, y + 58, bagW - 16, bagH - 16, roundness - 3);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  } else {
    // Generic accessory - could be bracelet, necklace, ring etc.
    const accessoryType = Math.floor(rand() * 3);

    if (accessoryType === 0) {
      // Watch/bracelet
      const watchW = 60 + rand() * 20;
      const watchH = 60 + rand() * 20;
      const bandW = 25 + rand() * 10;

      // Band
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(cx - bandW / 2, y + 40, bandW, 250, 8);
      ctx.fill();
      ctx.strokeStyle = darken(color, 0.4);
      ctx.lineWidth = 2;
      ctx.stroke();

      // Watch face
      ctx.fillStyle = darken(color, 0.3);
      ctx.beginPath();
      ctx.roundRect(cx - watchW / 2, y + 130, watchW, watchH, 10);
      ctx.fill();
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Watch details
      ctx.fillStyle = accent;
      ctx.beginPath(); ctx.arc(cx, y + 130 + watchH / 2, watchH / 3, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, y + 130 + watchH / 2); ctx.lineTo(cx, y + 130 + watchH / 2 - 15); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, y + 130 + watchH / 2); ctx.lineTo(cx + 10, y + 130 + watchH / 2 + 3); ctx.stroke();
    } else if (accessoryType === 1) {
      // Necklace/pendant
      const chainR = 70 + rand() * 20;

      ctx.strokeStyle = accent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, y + 80, chainR, 0.2, Math.PI - 0.2);
      ctx.stroke();

      // Pendant
      const grad = ctx.createRadialGradient(cx, y + 80 + chainR + 15, 5, cx, y + 80 + chainR + 15, 25);
      grad.addColorStop(0, lighten(color, 0.3));
      grad.addColorStop(1, color);
      ctx.fillStyle = grad;

      const pendantShape = rand();
      if (pendantShape > 0.6) {
        // Diamond shape
        ctx.beginPath();
        ctx.moveTo(cx, y + 80 + chainR - 5);
        ctx.lineTo(cx + 18, y + 80 + chainR + 15);
        ctx.lineTo(cx, y + 80 + chainR + 40);
        ctx.lineTo(cx - 18, y + 80 + chainR + 15);
        ctx.closePath();
      } else if (pendantShape > 0.3) {
        // Circle
        ctx.beginPath();
        ctx.arc(cx, y + 80 + chainR + 15, 18, 0, Math.PI * 2);
      } else {
        // Heart
        ctx.beginPath();
        ctx.moveTo(cx, y + 80 + chainR + 5);
        ctx.bezierCurveTo(cx - 20, y + 80 + chainR - 15, cx - 30, y + 80 + chainR + 10, cx, y + 80 + chainR + 35);
        ctx.bezierCurveTo(cx + 30, y + 80 + chainR + 10, cx + 20, y + 80 + chainR - 15, cx, y + 80 + chainR + 5);
      }
      ctx.fill();
      ctx.strokeStyle = darken(color, 0.4);
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Gem on pendant
      ctx.fillStyle = third;
      ctx.beginPath(); ctx.arc(cx, y + 80 + chainR + 15, 6, 0, Math.PI * 2); ctx.fill();
    } else {
      // Sunglasses
      const lensW = 50 + rand() * 15;
      const lensH = 35 + rand() * 15;
      const bridge = 15 + rand() * 10;
      const lensR = rand() > 0.5 ? lensH / 2 : 5;

      // Temples
      ctx.strokeStyle = darken(color, 0.2);
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(cx - bridge / 2 - lensW, y + 150); ctx.lineTo(cx - bridge / 2 - lensW - 50, y + 155); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + bridge / 2 + lensW, y + 150); ctx.lineTo(cx + bridge / 2 + lensW + 50, y + 155); ctx.stroke();

      // Bridge
      ctx.strokeStyle = accent;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx - bridge / 2, y + 150);
      ctx.quadraticCurveTo(cx, y + 145, cx + bridge / 2, y + 150);
      ctx.stroke();

      // Lenses
      const lensGrad = ctx.createLinearGradient(0, y + 140, 0, y + 140 + lensH);
      lensGrad.addColorStop(0, lighten(color, 0.1));
      lensGrad.addColorStop(1, darken(color, 0.3));
      ctx.fillStyle = lensGrad;

      ctx.beginPath();
      ctx.roundRect(cx - bridge / 2 - lensW, y + 140, lensW, lensH, lensR);
      ctx.fill();
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.roundRect(cx + bridge / 2, y + 140, lensW, lensH, lensR);
      ctx.fill();
      ctx.stroke();

      // Lens reflection
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.beginPath(); ctx.ellipse(cx - bridge / 2 - lensW / 2 + 5, y + 150, 8, 5, -0.3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx + bridge / 2 + lensW / 2 + 5, y + 150, 8, 5, -0.3, 0, Math.PI * 2); ctx.fill();
    }
  }
}
