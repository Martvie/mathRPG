import React, { useEffect, useRef, useState } from "react";
import { DirecaoSprite, TipoCenario } from "./Tipos";

const EXTENSOES_IMAGEM = ["webp", "png", "jpg", "jpeg"];

const ORDEM_CENARIOS: TipoCenario[] = ["forja", "portao_cidade", "oficina", "alquimista", "mercado", "ruinas", "observatorio", "pico_dragao", "arena_batalha", "epilogo_lenda", "epilogo_custeada", "epilogo_desesperado", "epilogo_retirada"];

// Cache global em memoria: evita re-testar URLs e elimina o flash do Canvas
const cacheUrlsResolvidas = new Map<string, string | null>();
const cachePromessas = new Map<string, Promise<string | null>>();

function gerarCaminhosImagem(nomesBase: string | string[]): string[] {
    const bases = Array.isArray(nomesBase) ? nomesBase : [nomesBase];
    const caminhos: string[] = [];

    for (const base of bases) {
        for (const ext of EXTENSOES_IMAGEM) {
            caminhos.push(`/assets/images/${base}.${ext}`);
        }
    }

    return caminhos;
}

function testarUnicaImagem(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new window.Image();
        img.decoding = "async";
        img.onload = () => {
            if (img.naturalWidth > 0) {
                resolve(url);
            } else {
                reject(new Error("Imagem vazia"));
            }
        };
        img.onerror = () => reject(new Error("Falha ao carregar"));
        img.src = url;
    });
}

function resolverImagemEmCache(nomesBase: string | string[]): Promise<string | null> {
    const candidatos = gerarCaminhosImagem(nomesBase);
    const chave = candidatos.join("|");

    if (cacheUrlsResolvidas.has(chave)) {
        return Promise.resolve(cacheUrlsResolvidas.get(chave) ?? null);
    }

    const emAndamento = cachePromessas.get(chave);
    if (emAndamento) {
        return emAndamento;
    }

    // Testa todas as extensoes em paralelo em vez de esperar 404 um por um
    const promessa = Promise.any(candidatos.map((url) => testarUnicaImagem(url)))
        .then((urlValida) => {
            cacheUrlsResolvidas.set(chave, urlValida);
            cachePromessas.delete(chave);
            return urlValida;
        })
        .catch(() => {
            cacheUrlsResolvidas.set(chave, null);
            cachePromessas.delete(chave);
            return null;
        });

    cachePromessas.set(chave, promessa);
    return promessa;
}

// Pre-carrega sprites principais e primeiros cenarios assim que o app abre
if (typeof window !== "undefined") {
    setTimeout(() => {
        const assetsIniciais: (string | string[])[] = ["heroi_frente", "heroi_costas", ["ipatia_frente", "hypatia_frente"], ["ipatia_costas", "hypatia_costas"], "cogon", "portao_cidade", "forja"];
        assetsIniciais.forEach((asset) => {
            void resolverImagemEmCache(asset);
        });
    }, 50);
}

interface ArtTools {
    px: (x: number, y: number, color: string) => void;
    rect: (x: number, y: number, w: number, h: number, color: string) => void;
    dither: (x: number, y: number, w: number, h: number, c1: string, c2: string) => void;
    gradV: (x: number, y: number, w: number, h: number, palette: string[]) => void;
    circle: (cx: number, cy: number, r: number, color: string) => void;
}

interface PixelCanvasProps {
    width: number;
    height: number;
    draw: (art: ArtTools, width: number, height: number) => void;
    className?: string;
}

export function PixelCanvas({ width, height, draw, className = "" }: PixelCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, width, height);

        const art: ArtTools = {
            px(x, y, color) {
                ctx.fillStyle = color;
                ctx.fillRect(Math.floor(x), Math.floor(y), 1, 1);
            },
            rect(x, y, w, h, color) {
                ctx.fillStyle = color;
                ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
            },
            dither(x, y, w, h, c1, c2) {
                const x0 = Math.floor(x);
                const y0 = Math.floor(y);
                for (let py = y0; py < y0 + h; py++) {
                    for (let px = x0; px < x0 + w; px++) {
                        ctx.fillStyle = (px + py) % 2 === 0 ? c1 : c2;
                        ctx.fillRect(px, py, 1, 1);
                    }
                }
            },
            gradV(x, y, w, h, palette) {
                if (!palette || palette.length === 0) return;
                const bands = palette.length;
                const bandH = h / bands;
                for (let i = 0; i < bands; i++) {
                    const by = Math.floor(y + i * bandH);
                    const bh = Math.ceil(bandH);
                    art.rect(x, by, w, bh, palette[i]);
                    if (i < bands - 1 && bh >= 4) {
                        art.dither(x, by + bh - 2, w, 2, palette[i], palette[i + 1]);
                    }
                }
            },
            circle(cx, cy, r, color) {
                ctx.fillStyle = color;
                const r2 = r * r;
                for (let dy = -r; dy <= r; dy++) {
                    for (let dx = -r; dx <= r; dx++) {
                        if (dx * dx + dy * dy <= r2) {
                            ctx.fillRect(Math.floor(cx + dx), Math.floor(cy + dy), 1, 1);
                        }
                    }
                }
            },
        };

        draw(art, width, height);
    }, [width, height, draw]);

    return <canvas ref={canvasRef} width={width} height={height} style={{ imageRendering: "pixelated" }} className={className} />;
}

interface MolduraDnDProps {
    children: React.ReactNode;
    destaque?: boolean;
    className?: string;
}

export function MolduraDnD({ children, destaque = false, className = "" }: MolduraDnDProps) {
    return (
        <div className={`relative rounded-xl border-2 ${destaque ? "border-amber-400/65 shadow-[0_12px_36px_rgba(217,119,6,0.16)]" : "border-amber-600/35 shadow-xl"} bg-[#16120e]/95 backdrop-blur-sm ${className}`}>
            <span className="pointer-events-none absolute top-1 left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-amber-400/70 rounded-tl-xs" />
            <span className="pointer-events-none absolute top-1 right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-amber-400/70 rounded-tr-xs" />
            <span className="pointer-events-none absolute bottom-1 left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-amber-400/70 rounded-bl-xs" />
            <span className="pointer-events-none absolute bottom-1 right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-amber-400/70 rounded-br-xs" />
            {children}
        </div>
    );
}

interface MiniMapaJornadaProps {
    etapaAtualIndex: number;
    naArena?: boolean;
}

export function MiniMapaJornada({ etapaAtualIndex, naArena = false }: MiniMapaJornadaProps) {
    return (
        <div title="Mapa da Campanha em Poliedra (10 Etapas + Pico de Cogon)" className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#142318] border-2 border-amber-500/60 shadow-inner">
            {Array.from({ length: 10 }).map((_, idx) => {
                const concluida = naArena || idx < etapaAtualIndex;
                const atual = !naArena && idx === etapaAtualIndex;
                return <span key={idx} className={`w-2 h-2 rounded-full transition-all ${atual ? "bg-amber-300 ring-2 ring-amber-400/60 scale-125" : concluida ? "bg-emerald-400" : "bg-stone-600"}`} />;
            })}
            <span className="text-xs ml-0.5">{naArena ? "🔥" : "🐉"}</span>
        </div>
    );
}

function useImagemCondicional(nomesBase: string | string[]): {
    urlValida: string | null;
    mostrarFallback: boolean;
} {
    const chave = gerarCaminhosImagem(nomesBase).join("|");

    const [estado, setEstado] = useState<{
        urlValida: string | null;
        mostrarFallback: boolean;
    }>(() => {
        if (cacheUrlsResolvidas.has(chave)) {
            const emCache = cacheUrlsResolvidas.get(chave) ?? null;
            return {
                urlValida: emCache,
                mostrarFallback: emCache === null,
            };
        }
        return {
            urlValida: null,
            mostrarFallback: false,
        };
    });

    useEffect(() => {
        let cancelado = false;

        if (cacheUrlsResolvidas.has(chave)) {
            const emCache = cacheUrlsResolvidas.get(chave) ?? null;
            setEstado({
                urlValida: emCache,
                mostrarFallback: emCache === null,
            });
            return;
        }

        setEstado({ urlValida: null, mostrarFallback: false });

        // Aguarda 120ms antes de exibir o Canvas para evitar piscada quando a imagem ja esta local
        const timerCarencia = setTimeout(() => {
            if (!cancelado) {
                setEstado((prev) => (prev.urlValida ? prev : { ...prev, mostrarFallback: true }));
            }
        }, 120);

        resolverImagemEmCache(nomesBase).then((url) => {
            clearTimeout(timerCarencia);
            if (!cancelado) {
                setEstado({
                    urlValida: url,
                    mostrarFallback: url === null,
                });
            }
        });

        return () => {
            cancelado = true;
            clearTimeout(timerCarencia);
        };
    }, [chave]);

    return estado;
}

interface HeroSpriteProps {
    equipamentos?: string[];
    atingido?: boolean;
    tamanho?: "mini" | "arena";
    direcao?: DirecaoSprite;
}

export function HeroSprite({ equipamentos = [], atingido = false, tamanho = "arena", direcao = "frente" }: HeroSpriteProps) {
    const nomeBaseSprite = direcao === "costas" ? "heroi_costas" : "heroi_frente";
    const { urlValida, mostrarFallback } = useImagemCondicional(nomeBaseSprite);

    const temEspada = equipamentos.includes("espada_angulo");
    const temEscudo = equipamentos.includes("escudo_poligonal");
    const temArmadura = equipamentos.includes("armadura_numerica");
    const temLanca = equipamentos.includes("lanca_ouro");

    const desenharHeroi = (g: ArtTools) => {
        g.rect(14, 44, 20, 2, "rgba(0,0,0,0.5)");
        g.rect(17, 43, 14, 4, "rgba(0,0,0,0.35)");

        if (direcao === "costas") {
            g.rect(18, 37, 5, 7, "#451a03");
            g.rect(19, 37, 3, 5, "#78350f");
            g.rect(25, 37, 5, 7, "#451a03");
            g.rect(26, 37, 3, 5, "#78350f");

            g.rect(16, 20, 15, 16, "#14532d");
            g.rect(17, 21, 13, 14, "#16a34a");

            g.rect(14, 20, 17, 16, "#7f1d1d");
            g.rect(15, 21, 15, 14, "#dc2626");
            g.rect(17, 22, 4, 12, "#ef4444");
            g.rect(25, 22, 3, 11, "#b91c1c");

            g.rect(16, 6, 15, 13, "#78350f");
            g.rect(17, 5, 13, 12, "#92400e");
            g.rect(18, 7, 11, 7, "#b45309");
            g.rect(27, 11, 3, 6, "#fdba74");

            g.rect(10, 21, 8, 12, temEscudo ? "#92400e" : "#451a03");
            g.rect(11, 22, 6, 10, temEscudo ? "#fbbf24" : "#92400e");
            g.rect(12, 23, 4, 8, "#78350f");
            g.px(13, 26, "#fef08a");

            if (temLanca) {
                g.rect(34, 3, 2, 41, "#92400e");
                g.rect(33, 2, 4, 6, "#fbbf24");
                g.rect(34, 0, 2, 5, "#fef08a");
            } else {
                g.rect(33, 7, 3, 19, "#64748b");
                g.rect(34, 6, 2, 20, "#e2e8f0");
                g.rect(31, 25, 7, 2, "#2563eb");
                g.rect(33, 27, 3, 4, "#1d4ed8");
            }
            return;
        }

        g.rect(10, 21, 19, 17, "#7f1d1d");
        g.rect(12, 21, 15, 15, "#dc2626");
        g.rect(9, 26, 5, 11, "#991b1b");
        g.rect(13, 23, 3, 12, "#ef4444");

        g.rect(17, 37, 5, 7, "#451a03");
        g.rect(18, 37, 3, 5, "#78350f");
        g.rect(25, 37, 5, 7, "#451a03");
        g.rect(26, 37, 3, 5, "#78350f");
        g.rect(18, 33, 4, 4, "#291509");
        g.rect(25, 33, 4, 4, "#291509");

        g.rect(16, 20, 15, 14, "#14532d");
        g.rect(17, 21, 13, 11, "#16a34a");
        g.rect(19, 22, 9, 7, "#22c55e");
        g.rect(16, 30, 15, 3, "#451a03");
        g.rect(22, 30, 3, 3, "#fbbf24");

        if (temArmadura) {
            g.rect(18, 21, 11, 8, "#94a3b8");
            g.rect(19, 22, 9, 6, "#cbd5e1");
            g.rect(22, 22, 3, 7, "#f59e0b");
            g.rect(14, 19, 4, 5, "#cbd5e1");
            g.rect(29, 19, 4, 5, "#94a3b8");
        }

        g.rect(17, 9, 13, 11, "#d97706");
        g.rect(18, 9, 12, 10, "#fdba74");
        g.rect(19, 10, 10, 8, "#fed7aa");
        g.rect(26, 13, 2, 3, "#1e293b");
        g.px(26, 13, "#ffffff");
        g.rect(15, 5, 16, 5, "#78350f");
        g.rect(17, 4, 12, 4, "#92400e");
        g.rect(14, 7, 4, 6, "#78350f");
        g.rect(29, 7, 3, 4, "#92400e");
        g.px(16, 3, "#92400e");
        g.px(23, 3, "#b45309");

        if (temEscudo) {
            g.rect(9, 21, 9, 12, "#92400e");
            g.rect(10, 22, 7, 10, "#fbbf24");
            g.rect(11, 23, 5, 8, "#78350f");
            g.rect(12, 24, 3, 5, "#f59e0b");
            g.px(13, 26, "#fef08a");
        } else {
            g.rect(10, 22, 8, 10, "#78350f");
            g.rect(11, 23, 6, 8, "#b45309");
            g.rect(12, 24, 4, 5, "#fbbf24");
        }

        g.rect(31, 22, 3, 8, temArmadura ? "#94a3b8" : "#fed7aa");
        if (temLanca) {
            g.rect(35, 3, 2, 41, "#92400e");
            g.rect(35, 4, 1, 39, "#d97706");
            g.rect(33, 6, 6, 3, "#f59e0b");
            g.rect(34, 2, 4, 5, "#fbbf24");
            g.rect(35, 0, 2, 6, "#fef08a");
            g.px(35, 1, "#ffffff");
        } else if (temEspada) {
            g.rect(34, 6, 3, 19, "#64748b");
            g.rect(35, 5, 2, 20, "#e2e8f0");
            g.rect(35, 4, 1, 20, "#ffffff");
            g.rect(36, 7, 1, 16, "#38bdf8");
            g.rect(32, 25, 7, 2, "#2563eb");
            g.rect(33, 25, 5, 1, "#60a5fa");
            g.rect(34, 27, 3, 4, "#1d4ed8");
            g.rect(34, 31, 3, 1, "#fbbf24");
        } else {
            g.rect(34, 13, 2, 13, "#94a3b8");
            g.rect(35, 12, 1, 14, "#e2e8f0");
            g.rect(33, 26, 4, 2, "#2563eb");
            g.rect(34, 28, 2, 3, "#1e40af");
        }
    };

    const classeTamanho = tamanho === "mini" ? "w-16 h-16 sm:w-20 sm:h-20" : "w-24 h-24 sm:w-32 sm:h-32";

    return (
        <div className={`relative select-none transition-transform duration-200 ${atingido ? "animate-flash-hit" : "animate-float-slow"}`}>
            {temLanca && <div className="absolute -inset-2 rounded-full bg-amber-400/20 blur-md animate-pulse" />}
            {urlValida ? <img src={urlValida} alt="Heroi de Poliedra" style={{ imageRendering: "pixelated" }} className={`${classeTamanho} object-contain drop-shadow-[0_8px_10px_rgba(0,0,0,0.85)]`} /> : mostrarFallback ? <PixelCanvas width={48} height={48} draw={desenharHeroi} className={`${classeTamanho} drop-shadow-[0_8px_10px_rgba(0,0,0,0.85)]`} /> : <div className={classeTamanho} />}
        </div>
    );
}

interface HypatiaSpriteProps {
    tamanho?: "mini" | "arena";
    direcao?: DirecaoSprite;
}

export function HypatiaSprite({ tamanho = "arena", direcao = "frente" }: HypatiaSpriteProps) {
    const candidatosSprite = direcao === "costas" ? ["ipatia_costas", "hypatia_costas"] : ["ipatia_frente", "hypatia_frente"];

    const { urlValida, mostrarFallback } = useImagemCondicional(candidatosSprite);

    const desenharMaga = (g: ArtTools) => {
        if (direcao === "costas") {
            g.rect(13, 20, 18, 23, "#1e3a8a");
            g.rect(15, 20, 14, 22, "#2563eb");
            g.rect(14, 41, 16, 2, "#f59e0b");
            g.rect(15, 42, 14, 1, "#fde047");

            g.rect(16, 12, 12, 14, "#cbd5e1");
            g.rect(17, 13, 10, 12, "#f8fafc");

            g.rect(11, 11, 22, 2, "#1e3a8a");
            g.rect(13, 10, 18, 2, "#2563eb");
            g.rect(15, 9, 14, 1, "#fbbf24");
            g.rect(15, 6, 14, 3, "#2563eb");
            g.rect(17, 3, 10, 3, "#3b82f6");
            g.rect(19, 1, 6, 2, "#2563eb");

            g.rect(34, 11, 2, 33, "#78350f");
            g.circle(35, 7, 5, "rgba(56, 189, 248, 0.35)");
            g.circle(35, 7, 3, "#38bdf8");
            g.px(34, 6, "#ffffff");
            return;
        }

        g.rect(13, 21, 18, 22, "#1e3a8a");
        g.rect(15, 21, 14, 21, "#2563eb");
        g.rect(19, 22, 6, 20, "#fef3c7");
        g.rect(14, 41, 16, 2, "#f59e0b");
        g.rect(15, 42, 14, 1, "#fde047");

        g.rect(18, 12, 9, 8, "#fed7aa");
        g.rect(24, 14, 2, 2, "#1d4ed8");
        g.rect(16, 12, 3, 12, "#cbd5e1");
        g.rect(17, 13, 2, 11, "#f8fafc");
        g.rect(26, 13, 2, 9, "#e2e8f0");
        g.rect(17, 20, 11, 2, "#fbbf24");

        g.rect(11, 11, 22, 2, "#1e3a8a");
        g.rect(13, 10, 18, 2, "#2563eb");
        g.rect(15, 9, 14, 1, "#fbbf24");
        g.rect(15, 6, 14, 3, "#2563eb");
        g.rect(17, 3, 10, 3, "#3b82f6");
        g.rect(19, 1, 6, 2, "#2563eb");
        g.rect(15, 2, 4, 2, "#1d4ed8");

        g.rect(35, 11, 2, 33, "#78350f");
        g.rect(35, 12, 1, 31, "#b45309");
        g.circle(36, 7, 5, "rgba(56, 189, 248, 0.35)");
        g.circle(36, 7, 3, "#38bdf8");
        g.circle(36, 7, 2, "#bae6fd");
        g.px(35, 6, "#ffffff");
    };

    const classeTamanho = tamanho === "mini" ? "w-16 h-16 sm:w-20 sm:h-20" : "w-20 h-20 sm:w-28 sm:h-28";

    return (
        <div className="relative select-none animate-float-delayed">
            <div className="absolute -inset-1 rounded-full bg-sky-400/25 blur-md" />
            {urlValida ? <img src={urlValida} alt="Arquimaga Hypatia" style={{ imageRendering: "pixelated" }} className={`${classeTamanho} object-contain drop-shadow-[0_8px_10px_rgba(0,0,0,0.85)]`} /> : mostrarFallback ? <PixelCanvas width={48} height={48} draw={desenharMaga} className={`${classeTamanho} drop-shadow-[0_8px_10px_rgba(0,0,0,0.85)]`} /> : <div className={classeTamanho} />}
        </div>
    );
}

interface CogonSpriteProps {
    atingido?: boolean;
    tamanho?: "mini" | "arena";
}

export function CogonSprite({ atingido = false, tamanho = "arena" }: CogonSpriteProps) {
    const { urlValida, mostrarFallback } = useImagemCondicional("cogon");

    const desenharDragao = (g: ArtTools) => {
        g.rect(20, 66, 48, 4, "rgba(0,0,0,0.55)");
        g.rect(26, 65, 36, 6, "rgba(0,0,0,0.35)");

        g.rect(42, 8, 22, 18, "#14532d");
        g.rect(44, 10, 18, 14, "#166534");

        g.rect(54, 48, 20, 9, "#14532d");
        g.rect(56, 49, 17, 6, "#15803d");
        g.rect(68, 45, 11, 7, "#166534");
        g.rect(75, 42, 6, 5, "#22c55e");
        g.rect(60, 46, 3, 2, "#eab308");
        g.rect(66, 44, 3, 2, "#eab308");

        g.rect(46, 50, 11, 14, "#14532d");
        g.rect(48, 51, 8, 12, "#166534");
        g.rect(43, 62, 12, 4, "#14532d");
        g.rect(41, 63, 3, 3, "#fef08a");
        g.rect(45, 63, 3, 3, "#fef08a");

        g.rect(28, 28, 28, 28, "#14532d");
        g.rect(30, 29, 24, 25, "#15803d");
        g.rect(33, 31, 18, 18, "#16a34a");
        g.rect(29, 34, 13, 20, "#92400e");
        g.rect(30, 35, 10, 18, "#d97706");
        g.rect(31, 36, 7, 3, "#fbbf24");
        g.rect(31, 41, 7, 3, "#fbbf24");
        g.rect(31, 46, 7, 3, "#fbbf24");

        g.rect(23, 42, 8, 13, "#166534");
        g.rect(24, 43, 6, 10, "#16a34a");
        g.rect(19, 53, 8, 4, "#14532d");
        g.rect(17, 54, 3, 3, "#fef08a");

        g.rect(32, 54, 10, 12, "#166534");
        g.rect(29, 64, 11, 3, "#14532d");
        g.rect(27, 64, 3, 3, "#fef08a");

        g.rect(19, 14, 18, 18, "#166534");
        g.rect(21, 15, 14, 15, "#16a34a");
        g.rect(7, 17, 16, 11, "#166534");
        g.rect(8, 18, 14, 8, "#16a34a");
        g.rect(10, 19, 10, 3, "#22c55e");
        g.rect(9, 28, 13, 4, "#14532d");
        g.rect(9, 26, 2, 3, "#ffffff");
        g.rect(14, 26, 2, 3, "#ffffff");
        g.rect(4, 25, 4, 3, "#f97316");
        g.px(5, 26, "#fef08a");

        g.rect(17, 19, 5, 4, "#7f1d1d");
        g.rect(18, 20, 4, 3, "#facc15");
        g.rect(19, 20, 1, 3, "#000000");

        g.rect(28, 10, 6, 5, "#a16207");
        g.rect(32, 6, 6, 5, "#ca8a04");
        g.rect(36, 3, 5, 4, "#fde047");
        g.rect(22, 11, 4, 4, "#ca8a04");
        g.rect(24, 8, 4, 3, "#fde047");

        g.rect(40, 16, 26, 6, "#14532d");
        g.rect(46, 11, 26, 6, "#15803d");
        g.rect(54, 7, 24, 5, "#16a34a");
        g.dither(43, 22, 32, 12, "#92400e", "#b45309");
        g.dither(48, 34, 24, 8, "#78350f", "#92400e");
        g.rect(52, 6, 3, 2, "#fde047");
    };

    const classeTamanho = tamanho === "mini" ? "w-28 h-24 sm:w-32 sm:h-28" : "w-40 h-32 sm:w-56 sm:h-44";

    return (
        <div className={`relative select-none transition-transform duration-200 ${atingido ? "animate-flash-hit" : "animate-dragon-idle"}`}>
            <div className="absolute inset-4 rounded-full bg-emerald-500/20 blur-xl" />
            {urlValida ? <img src={urlValida} alt="Cogon, o Dragao das Escalas" style={{ imageRendering: "pixelated" }} className={`${classeTamanho} object-contain drop-shadow-[0_12px_16px_rgba(0,0,0,0.85)]`} /> : mostrarFallback ? <PixelCanvas width={84} height={72} draw={desenharDragao} className={`${classeTamanho} drop-shadow-[0_12px_16px_rgba(0,0,0,0.85)]`} /> : <div className={classeTamanho} />}
        </div>
    );
}

interface CenarioPixelArtProps {
    tipo: TipoCenario;
    className?: string;
}

export function CenarioPixelArt({ tipo, className = "" }: CenarioPixelArtProps) {
    const { urlValida, mostrarFallback } = useImagemCondicional(tipo);

    // Pre-carrega silenciosamente o cenario da proxima etapa enquanto o jogador le a atual
    useEffect(() => {
        const idxAtual = ORDEM_CENARIOS.indexOf(tipo);
        if (idxAtual >= 0 && idxAtual + 1 < ORDEM_CENARIOS.length) {
            void resolverImagemEmCache(ORDEM_CENARIOS[idxAtual + 1]);
        }
        if (tipo === "pico_dragao") {
            void resolverImagemEmCache("arena_batalha");
        }
    }, [tipo]);

    const desenharCena = (g: ArtTools, W: number, H: number) => {
        if (tipo === "forja") {
            g.gradV(0, 0, W, H, ["#1c1917", "#292524", "#44403c", "#292524"]);
            for (let y = 6; y < 86; y += 12) {
                for (let x = y % 24 === 0 ? 4 : 14; x < W - 10; x += 22) {
                    g.rect(x, y, 18, 9, "#1c1917");
                    g.rect(x + 1, y + 1, 16, 7, "#44403c");
                }
            }
            g.rect(0, 86, W, 49, "#292524");
            g.dither(0, 86, W, 49, "#57534e", "#292524");

            g.rect(12, 64, 38, 22, "#64748b");
            g.rect(15, 66, 32, 8, "#38bdf8");
            g.dither(16, 67, 30, 6, "#7dd3fc", "#0284c7");

            g.rect(64, 24, 56, 64, "#57534e");
            g.rect(68, 28, 48, 60, "#78716c");
            g.rect(74, 48, 36, 34, "#7c2d12");
            g.rect(77, 52, 30, 28, "#ea580c");
            g.rect(81, 58, 22, 22, "#f59e0b");
            g.rect(85, 64, 14, 14, "#fef08a");

            [148, 160, 172, 184].forEach((tx, idx) => {
                g.rect(tx, 26, 3, 18 + (idx % 2) * 4, "#94a3b8");
                g.rect(tx - 1, 24, 5, 3, "#78350f");
            });

            g.rect(114, 82, 92, 32, "#451a03");
            g.rect(110, 78, 98, 7, "#92400e");
            g.rect(112, 79, 94, 4, "#b45309");
            g.rect(132, 76, 38, 5, "#fef3c7");
            g.rect(136, 77, 26, 2, "#e2e8f0");
            g.rect(162, 76, 3, 4, "#2563eb");

            [4, 214].forEach((ax) => {
                g.rect(ax + 6, 48, 4, 42, "#78350f");
                g.rect(ax, 52, 16, 22, "#94a3b8");
                g.rect(ax + 2, 54, 12, 18, "#cbd5e1");
            });
        } else if (tipo === "portao_cidade") {
            g.gradV(0, 0, W, 74, ["#38bdf8", "#7dd3fc", "#bae6fd", "#e0f2fe"]);
            g.rect(24, 12, 34, 7, "#ffffff");
            g.rect(168, 16, 42, 7, "#ffffff");
            for (let i = 0; i < 40; i++) {
                g.rect(135 + i, 72 - i, 90 - i * 2, 1, "#64748b");
            }
            g.rect(0, 58, W, 24, "#15803d");
            g.dither(0, 58, W, 6, "#22c55e", "#15803d");
            g.rect(112, 32, 72, 34, "#cbd5e1");
            g.rect(116, 34, 64, 30, "#e2e8f0");
            g.rect(106, 24, 16, 42, "#94a3b8");
            g.rect(138, 18, 20, 48, "#cbd5e1");
            g.rect(174, 24, 16, 42, "#94a3b8");
            g.rect(144, 52, 8, 14, "#451a03");
            g.rect(142, 14, 12, 4, "#dc2626");
            g.rect(108, 20, 12, 4, "#dc2626");
            g.rect(176, 20, 12, 4, "#dc2626");

            g.rect(0, 74, W, 61, "#16a34a");
            g.dither(0, 74, W, 61, "#22c55e", "#15803d");
            g.rect(68, 74, 48, 61, "#a16207");
            g.dither(72, 74, 40, 61, "#ca8a04", "#854d0e");

            g.rect(182, 74, 58, 61, "#0284c7");
            g.dither(186, 74, 50, 61, "#38bdf8", "#0284c7");

            g.rect(42, 92, 4, 20, "#451a03");
            g.rect(30, 84, 30, 12, "#92400e");
            g.rect(32, 86, 26, 8, "#b45309");
        } else if (tipo === "oficina") {
            g.gradV(0, 0, W, H, ["#1e293b", "#334155", "#475569", "#1e293b"]);
            g.rect(24, 14, 44, 46, "#bae6fd");
            g.rect(45, 14, 2, 46, "#451a03");
            g.rect(24, 36, 44, 2, "#451a03");
            g.dither(34, 60, 56, 36, "rgba(254,240,138,0.22)", "transparent");
            g.rect(0, 94, W, 41, "#451a03");
            g.dither(0, 94, W, 4, "#78350f", "#451a03");
            [108, 152].forEach((mx) => {
                g.rect(mx + 8, 44, 4, 50, "#78350f");
                g.rect(mx, 48, 20, 26, "#94a3b8");
                g.rect(mx + 2, 50, 16, 22, "#cbd5e1");
                g.rect(mx + 8, 52, 4, 16, "#fbbf24");
            });
            g.rect(180, 68, 52, 28, "#78350f");
            g.rect(178, 66, 56, 4, "#92400e");
        } else if (tipo === "alquimista") {
            g.gradV(0, 0, W, H, ["#022c22", "#064e3b", "#065f46", "#022c22"]);
            [22, 48, 74].forEach((py) => {
                g.rect(16, py, 92, 4, "#451a03");
                g.rect(136, py, 88, 4, "#451a03");
            });
            const coresPocao = ["#ef4444", "#38bdf8", "#a855f7", "#facc15", "#10b981"];
            for (let i = 0; i < 6; i++) {
                g.rect(22 + i * 14, 13, 7, 9, coresPocao[i % coresPocao.length]);
                g.rect(142 + i * 13, 39, 7, 9, coresPocao[(i + 2) % coresPocao.length]);
            }
            g.rect(0, 96, W, 39, "#0f172a");
            g.rect(102, 72, 36, 26, "#1e293b");
            g.rect(104, 67, 32, 4, "#10b981");
            g.circle(114, 56, 3, "#34d399");
            g.circle(125, 48, 2, "#a7f3d0");
        } else if (tipo === "mercado") {
            g.gradV(0, 0, W, 94, ["#1e1b4b", "#312e81", "#4338ca", "#6366f1"]);
            g.rect(0, 94, W, 41, "#44403c");
            g.dither(0, 94, W, 41, "#57534e", "#292524");
            for (let sx = 24; sx < 216; sx += 16) {
                g.rect(sx, 18, 8, 24, "#dc2626");
                g.rect(sx + 8, 18, 8, 24, "#fbbf24");
            }
            g.rect(42, 68, 156, 28, "#78350f");
            g.rect(40, 66, 160, 4, "#b45309");
            g.circle(74, 58, 7, "#38bdf8");
            g.circle(112, 57, 8, "#c084fc");
        } else if (tipo === "ruinas") {
            g.gradV(0, 0, W, 96, ["#042f2e", "#115e59", "#0f766e", "#134e4a"]);
            g.rect(0, 96, W, 39, "#064e3b");
            g.dither(0, 96, W, 8, "#10b981", "#064e3b");
            g.rect(32, 34, 18, 62, "#94a3b8");
            g.rect(188, 48, 18, 48, "#94a3b8");
            g.rect(102, 26, 36, 70, "#334155");
            g.rect(116, 40, 8, 8, "#22d3ee");
            g.rect(114, 56, 12, 3, "#38bdf8");
        } else if (tipo === "observatorio") {
            g.gradV(0, 0, W, H, ["#090d16", "#1e1b4b", "#311042", "#1e1b4b"]);
            g.rect(72, 12, 96, 82, "#020617");
            g.circle(142, 28, 9, "#fef08a");
            g.circle(138, 26, 8, "#020617");
            [
                [84, 22],
                [98, 36],
                [116, 20],
                [155, 48],
            ].forEach(([sx, sy]) => g.px(sx, sy, "#ffffff"));
            g.rect(0, 94, W, 41, "#1e1b4b");
            g.rect(64, 102, 112, 16, "#4c1d95");
            g.rect(42, 38, 8, 16, "#38bdf8");
            g.rect(190, 34, 8, 16, "#c084fc");
        } else if (tipo === "pico_dragao") {
            g.gradV(0, 0, W, 96, ["#1f090d", "#450a0a", "#7f1d1d", "#9a3412"]);
            g.rect(0, 88, W, 12, "#ea580c");
            g.rect(0, 92, W, 6, "#facc15");
            g.rect(48, 96, 144, 39, "#18181b");
            g.rect(72, 18, 96, 80, "#18181b");
            g.rect(78, 24, 84, 74, "#27272a");
            g.rect(104, 42, 32, 32, "#d97706");
            g.rect(108, 46, 24, 24, "#fbbf24");
        } else if (tipo === "arena_batalha") {
            g.gradV(0, 0, W, 94, ["#0f172a", "#1e293b", "#334155", "#1e293b"]);
            for (let y = 8; y < 90; y += 11) {
                for (let x = y % 22 === 0 ? 4 : 14; x < W - 8; x += 22) {
                    g.rect(x, y, 18, 8, "#0f172a");
                    g.rect(x + 1, y + 1, 16, 6, "#334155");
                }
            }
            [26, 66, 106].forEach((wx) => {
                g.rect(wx, 16, 12, 34, "#020617");
                g.rect(wx + 2, 18, 8, 30, "#38bdf8");
                g.rect(wx + 2, 32, 8, 16, "#fdba74");
                g.dither(wx + 4, 48, 28, 44, "rgba(254,240,138,0.16)", "transparent");
            });

            g.rect(136, 62, 92, 32, "#475569");
            g.rect(138, 64, 88, 6, "#94a3b8");
            g.dither(140, 70, 84, 22, "#64748b", "#334155");

            g.rect(0, 92, W, 43, "#1e293b");
            g.rect(18, 96, W - 36, 35, "#78716c");
            g.rect(36, 101, W - 72, 25, "#a8a29e");
            g.rect(58, 106, W - 116, 15, "#d6d3d1");
            g.rect(82, 110, W - 164, 7, "#a8a29e");
        } else if (tipo === "epilogo_lenda") {
            g.gradV(0, 0, W, 94, ["#451a03", "#92400e", "#d97706", "#fef08a"]);
            [42, 108, 174].forEach((vx) => {
                g.rect(vx, 14, 24, 48, "#1e1b4b");
                g.rect(vx + 3, 17, 18, 20, "#38bdf8");
                g.rect(vx + 3, 39, 18, 20, "#fbbf24");
            });
            g.rect(0, 94, W, 41, "#78350f");
            g.rect(68, 86, 104, 24, "#cbd5e1");
            g.rect(108, 92, 24, 10, "#fbbf24");
        } else if (tipo === "epilogo_custeada") {
            g.gradV(0, 0, W, 88, ["#1e3a8a", "#0284c7", "#f59e0b", "#fef08a"]);
            g.circle(120, 68, 18, "#fef9c3");
            g.rect(0, 88, W, 47, "#15803d");
            g.rect(76, 68, 88, 20, "#475569");
        } else if (tipo === "epilogo_desesperado") {
            g.gradV(0, 0, W, 92, ["#311042", "#9d174d", "#ea580c", "#fde047"]);
            g.rect(0, 92, W, 43, "#292524");
            g.rect(118, 56, 4, 36, "#f8fafc");
            g.rect(112, 64, 16, 3, "#fbbf24");
        } else {
            g.gradV(0, 0, W, 94, ["#020617", "#0f172a", "#1e293b", "#334155"]);
            g.circle(178, 28, 14, "#f8fafc");
            g.rect(0, 94, W, 41, "#064e3b");
            g.rect(88, 94, 64, 41, "#334155");
        }
    };

    if (urlValida) {
        return <img src={urlValida} alt={`Cenario ${tipo}`} style={{ imageRendering: "pixelated" }} className={`w-full h-full object-cover block ${className}`} />;
    }

    if (mostrarFallback) {
        return <PixelCanvas width={240} height={135} draw={desenharCena} className={`w-full h-full object-cover block ${className}`} />;
    }

    return <div className={`w-full h-full bg-[#120e0b] ${className}`} />;
}
