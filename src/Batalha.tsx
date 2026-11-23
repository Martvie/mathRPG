import { Backpack, Flame, Shield, Skull, Sword, Timer, Zap } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { CenarioPixelArt, CogonSprite, HeroSprite, HypatiaSprite, MolduraDnD } from "./Graficos";
import { tocarEfeitoSonoro } from "./Servicos";
import { EstadoDragao, EstadoJogo, ItemInventario } from "./Tipos";

const TEMPO_LIMITE_ESCUDO_MS = 8000;

interface DanoFlutuante {
    id: number;
    texto: string;
    alvo: "dragao" | "heroi";
    tipo: "dano" | "magia" | "cura";
}

interface DesafioTabuada {
    enunciado: string;
    respostaCorreta: number;
    opcoes: number[];
    ehSopro: boolean;
    posturaFocada: boolean;
    hpHeroiPendente: number;
    inventarioPendente: ItemInventario[];
}

function gerarDesafioTabuada(ehSopro: boolean, posturaFocada: boolean, hpHeroiPendente: number, inventarioPendente: ItemInventario[]): DesafioTabuada {
    // Tabuada entre 4x6 e 9x9 (evita contas triviais como 3x3 para exigir calculo mental)
    const a = Math.floor(Math.random() * 6) + 4; // 4 a 9
    const b = Math.floor(Math.random() * 5) + 5; // 5 a 9
    const correta = a * b;

    const candidatos = new Set<number>([correta]);
    const desvios = [a * (b + 1), a * (b - 1), (a + 1) * b, (a - 1) * b, correta + 3, correta - 3, correta + 6, correta - 6];

    for (const val of desvios) {
        if (candidatos.size >= 4) break;
        if (val > 0 && val !== correta) {
            candidatos.add(val);
        }
    }

    while (candidatos.size < 4) {
        const extra = correta + Math.floor(Math.random() * 13) - 6;
        if (extra > 0 && extra !== correta) {
            candidatos.add(extra);
        }
    }

    const opcoes = Array.from(candidatos).sort(() => Math.random() - 0.5);

    return {
        enunciado: `${a} × ${b} = ?`,
        respostaCorreta: correta,
        opcoes,
        ehSopro,
        posturaFocada,
        hpHeroiPendente,
        inventarioPendente,
    };
}

interface TransicaoArenaProps {
    estadoJogo: EstadoJogo;
    dragaoInicial: EstadoDragao;
    onIniciarCombate: () => void;
}

export function TransicaoArena({ estadoJogo, dragaoInicial, onIniciarCombate }: TransicaoArenaProps) {
    return (
        <MolduraDnD destaque className="max-w-3xl mx-auto w-full p-5 sm:p-6 space-y-4">
            <div className="text-center space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-widest text-amber-400">Preparativos da Campanha Concluídos</span>
                <h2 className="font-dnd-title text-xl sm:text-2xl font-black text-amber-50">Os Portões do Santuário de Cógon se Abrem!</h2>
                <p className="text-xs sm:text-sm text-stone-300">
                    Você superou <strong className="text-emerald-400">{estadoJogo.acertosQuiz} de 10</strong> desafios matemáticos em Poliedra.
                </p>
            </div>

            <div className={`p-3.5 rounded-lg border ${estadoJogo.magoPresente ? "bg-sky-950/45 border-sky-400/60" : "bg-[#0f0c0a] border-amber-600/30"}`}>
                <div className="flex items-center gap-3">
                    <span className="text-2xl">🛡️</span>
                    <div>
                        <h3 className="font-dnd-title font-bold text-xs sm:text-sm text-amber-200">Mecânica de Reflexo: Escudo da Tabuada (5 segundos)</h3>
                        <p className="text-xs text-stone-300 mt-0.5 leading-snug">
                            Sempre que Cógon atacar, surgirá um <strong>cálculo surpresa de tabuada</strong> com <strong>5 segundos</strong> no relógio. Acerte para levantar o escudo e bloquear a maior parte do dano!
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-lg bg-[#0f0c0a] border border-amber-500/35 space-y-1.5">
                    <h4 className="font-dnd-title text-xs font-bold uppercase tracking-wider text-amber-300">Ficha do Guardião</h4>
                    <ul className="text-xs sm:text-sm space-y-1 text-stone-200">
                        <li>
                            ❤️ Pontos de Vida (PV): <strong>{estadoJogo.hpMaximo}</strong>
                        </li>
                        <li>
                            ⚔️ Força de Ataque (FOR): <strong>{estadoJogo.ataqueBase}</strong>
                        </li>
                        <li>
                            🛡️ Classe de Armadura (CA): <strong>{estadoJogo.defesa}</strong>
                        </li>
                        <li>
                            🔮 Aliada Hypatia: <strong>{estadoJogo.magoPresente ? "Ativa (+16/turno)" : "Ausente"}</strong> • 🎒 Itens: <strong>{estadoJogo.inventario.reduce((acc, i) => acc + i.quantidade, 0)}</strong>
                        </li>
                    </ul>
                </div>

                <div className="p-3.5 rounded-lg bg-[#0f0c0a] border border-emerald-500/40 space-y-1.5">
                    <h4 className="font-dnd-title text-xs font-bold uppercase tracking-wider text-emerald-400">Ficha do Chefe • Cógon</h4>
                    <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded border ${dragaoInicial.corBadge}`}>{dragaoInicial.nivel}</span>
                    <p className="text-xs text-stone-300 leading-snug">{dragaoInicial.descricao}</p>
                    <p className="text-xs sm:text-sm text-emerald-300 font-bold">
                        🐉 {dragaoInicial.hpMaximo} PV • 🔥 {dragaoInicial.ataqueBase} ATQ
                    </p>
                </div>
            </div>

            <button type="button" onClick={onIniciarCombate} className="w-full py-3.5 px-6 rounded-lg bg-gradient-to-r from-red-700 via-rose-600 to-orange-600 hover:from-red-600 hover:to-orange-500 text-amber-50 font-dnd-title font-black text-base border border-amber-400/50 shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer">
                <Flame className="w-5 h-5 text-amber-300" />
                <span>Rolar Iniciativa e Combater!</span>
            </button>
        </MolduraDnD>
    );
}

interface BatalhaProps {
    estadoJogo: EstadoJogo;
    dragaoInicial: EstadoDragao;
    somAtivo: boolean;
    modoDev?: boolean;
    onAtualizarHeroi: (hpAtual: number, inventario: ItemInventario[]) => void;
    onEncerrarBatalha: (venceu: boolean) => void;
}

export default function Batalha({ estadoJogo, dragaoInicial, somAtivo, modoDev = false, onAtualizarHeroi, onEncerrarBatalha }: BatalhaProps) {
    const [dragaoEstado, setDragaoEstado] = useState<EstadoDragao>(dragaoInicial);
    const [turnoDoJogador, setTurnoDoJogador] = useState(true);
    const [bolsaAberta, setBolsaAberta] = useState(false);
    const [logCombate, setLogCombate] = useState<string[]>([]);
    const [batalhaFinalizada, setBatalhaFinalizada] = useState(false);
    const [rodadaAtual, setRodadaAtual] = useState(1);

    // Mecanica de Sopro Carregado + Desafio Surpresa de Tabuada (5s)
    const [dragaoCarregando, setDragaoCarregando] = useState(false);
    const [desafioEscudo, setDesafioEscudo] = useState<DesafioTabuada | null>(null);
    const [tempoRestanteMs, setTempoRestanteMs] = useState(TEMPO_LIMITE_ESCUDO_MS);
    const turnoDragaoRef = useRef(0);
    const desafioResolvidoRef = useRef(false);

    const [animacaoShake, setAnimacaoShake] = useState(false);
    const [heroFlashHit, setHeroFlashHit] = useState(false);
    const [dragonFlashHit, setDragonFlashHit] = useState(false);
    const [mostrarSlash, setMostrarSlash] = useState(false);
    const [danosFlutuantes, setDanosFlutuantes] = useState<DanoFlutuante[]>([]);
    const idFlutuanteRef = useRef(0);

    useEffect(() => {
        setDragaoEstado(dragaoInicial);
        setDragaoCarregando(false);
        setDesafioEscudo(null);
        setRodadaAtual(1);
        turnoDragaoRef.current = 0;
    }, [dragaoInicial]);

    useEffect(() => {
        const introLog = ["🐉 Iniciativa rolada! Cógon, o Dragão das Escalas, ruge no Santuário do Pico!"];
        if (estadoJogo.magoPresente) {
            introLog.push('🔮 Arquimaga Hypatia ergue seu cajado: "Minhas magias ajudam no ataque, mas erga o escudo na tabuada quando Cógon investir!"');
        } else {
            introLog.push("🛡️ Reflexo de Escudo: Quando Cógon atacar, resolva a tabuada em até 5s para erguer o escudo!");
        }
        setLogCombate(introLog);
    }, [estadoJogo.magoPresente]);

    const exibirTextoFlutuante = useCallback((texto: string, alvo: "dragao" | "heroi" = "dragao", tipo: "dano" | "magia" | "cura" = "dano") => {
        const id = ++idFlutuanteRef.current;
        setDanosFlutuantes((prev) => [...prev, { id, texto, alvo, tipo }]);
        setTimeout(() => {
            setDanosFlutuantes((prev) => prev.filter((item) => item.id !== id));
        }, 1150);
    }, []);

    const finalizarConfronto = useCallback(
        (venceu: boolean) => {
            if (batalhaFinalizada) return;
            setBatalhaFinalizada(true);
            setDesafioEscudo(null);
            onEncerrarBatalha(venceu);
        },
        [batalhaFinalizada, onEncerrarBatalha],
    );

    const concluirAtaqueDragao = useCallback(
        (desafio: DesafioTabuada, escudoLevantado: boolean, motivoFalha?: "ERRO" | "TEMPO") => {
            if (desafioResolvidoRef.current) return;
            desafioResolvidoRef.current = true;
            setDesafioEscudo(null);

            if (desafio.ehSopro) {
                setDragaoCarregando(false);
            }

            const variacao = desafio.ehSopro ? 0 : Math.floor(Math.random() * 5) - 2;
            const danoBruto = desafio.ehSopro ? Math.round(dragaoEstado.ataqueBase * 1.65) : Math.max(14, dragaoEstado.ataqueBase + variacao);

            const danoAposCA = Math.max(8, danoBruto - estadoJogo.defesa);

            // Reducao ao erguer o escudo com sucesso na tabuada de 5s
            let multiplicador = 1;
            if (escudoLevantado) {
                if (desafio.posturaFocada) {
                    multiplicador = 0.25; // Bloqueio fortificado (-75%)
                } else if (desafio.ehSopro) {
                    multiplicador = 0.4; // Bloqueia 60% do Sopro
                } else {
                    multiplicador = 0.5; // Bloqueia 50% do golpe normal
                }
            }

            const danoFinal = escudoLevantado ? Math.max(5, Math.round(danoAposCA * multiplicador)) : danoAposCA;

            tocarEfeitoSonoro(escudoLevantado ? "acerto" : "ataque", somAtivo);
            setAnimacaoShake(true);
            setHeroFlashHit(true);

            if (escudoLevantado) {
                exibirTextoFlutuante(`-${danoFinal} PV (Escudo!)`, "heroi", "cura");
            } else {
                exibirTextoFlutuante(desafio.ehSopro ? `-${danoFinal} SOPRO!` : `-${danoFinal} PV`, "heroi", "dano");
            }

            setTimeout(() => {
                setAnimacaoShake(false);
                setHeroFlashHit(false);
            }, 450);

            const novoHpHeroi = Math.max(0, desafio.hpHeroiPendente - danoFinal);
            onAtualizarHeroi(novoHpHeroi, desafio.inventarioPendente);

            const textoMotivo = motivoFalha === "TEMPO" ? "Tempo esgotado (5s)!" : motivoFalha === "ERRO" ? `Cálculo incorreto (era ${desafio.respostaCorreta})!` : "";

            setLogCombate((prev) => [escudoLevantado ? `🛡️ ESCUDO ERGUIDO! Cálculo exato! Você aparou ${desafio.ehSopro ? "o Sopro Incandescente" : "a investida de Cógon"} e sofreu ${danoFinal} de dano!` : `💥 GUARDA QUEBRADA (${textoMotivo}) Cógon acerta em cheio causando ${danoFinal} de dano!`, ...prev.slice(0, 4)]);

            if (novoHpHeroi <= 0) {
                finalizarConfronto(false);
            } else {
                setRodadaAtual((r) => r + 1);
                setTurnoDoJogador(true);
            }
        },
        [dragaoEstado.ataqueBase, estadoJogo.defesa, exibirTextoFlutuante, finalizarConfronto, onAtualizarHeroi, somAtivo],
    );

    // Cronometro de 5 segundos do Desafio Surpresa de Tabuada
    useEffect(() => {
        if (!desafioEscudo || batalhaFinalizada) return;

        const inicio = Date.now();
        setTempoRestanteMs(TEMPO_LIMITE_ESCUDO_MS);

        const intervalo = window.setInterval(() => {
            const decorrido = Date.now() - inicio;
            const restante = Math.max(0, TEMPO_LIMITE_ESCUDO_MS - decorrido);
            setTempoRestanteMs(restante);

            if (restante <= 0) {
                window.clearInterval(intervalo);
                concluirAtaqueDragao(desafioEscudo, false, "TEMPO");
            }
        }, 50);

        return () => window.clearInterval(intervalo);
    }, [desafioEscudo, batalhaFinalizada, concluirAtaqueDragao]);

    // Atalho de teclado (teclas 1, 2, 3, 4) para responder o calculo rapido
    useEffect(() => {
        if (!desafioEscudo || batalhaFinalizada) return;

        function aoPressionarTecla(e: KeyboardEvent) {
            const idx = ["1", "2", "3", "4"].indexOf(e.key);
            if (idx >= 0 && desafioEscudo && desafioEscudo.opcoes[idx] !== undefined) {
                const escolhida = desafioEscudo.opcoes[idx];
                const acertou = escolhida === desafioEscudo.respostaCorreta;
                concluirAtaqueDragao(desafioEscudo, acertou, acertou ? undefined : "ERRO");
            }
        }

        window.addEventListener("keydown", aoPressionarTecla);
        return () => window.removeEventListener("keydown", aoPressionarTecla);
    }, [desafioEscudo, batalhaFinalizada, concluirAtaqueDragao]);

    function iniciarTurnoDragao(hpHeroiAposTurnoJogador: number, inventarioAtual: ItemInventario[], posturaFocada = false) {
        if (hpHeroiAposTurnoJogador <= 0) return;

        setTimeout(() => {
            // 1) Se Cogon ja estava carregando o sopro, abre o desafio de 5s para defender o Sopro
            if (dragaoCarregando) {
                desafioResolvidoRef.current = false;
                setDesafioEscudo(gerarDesafioTabuada(true, posturaFocada, hpHeroiAposTurnoJogador, inventarioAtual));
                return;
            }

            // 2) Turno regular: a cada 3 turnos (turno 2, 5, 8...) ele inspira e prepara o Sopro
            turnoDragaoRef.current += 1;
            if (turnoDragaoRef.current % 3 === 2) {
                setDragaoCarregando(true);
                tocarEfeitoSonoro("erro", somAtivo);
                setLogCombate((prev) => ["⚠️ ALERTA DE TURNO: Cógon inspira profundamente concentrando chamas incandescentes! Use Postura Defensiva!", ...prev.slice(0, 4)]);
                setRodadaAtual((r) => r + 1);
                setTurnoDoJogador(true);
                return;
            }

            // 3) Investida normal de Cogon -> abre calculo surpresa de 5s para erguer o escudo
            desafioResolvidoRef.current = false;
            setDesafioEscudo(gerarDesafioTabuada(false, posturaFocada, hpHeroiAposTurnoJogador, inventarioAtual));
        }, 650);
    }

    function executarAtaqueJogador() {
        if (!turnoDoJogador || batalhaFinalizada || desafioEscudo) return;

        setTurnoDoJogador(false);
        setBolsaAberta(false);

        const critico = Math.random() < estadoJogo.chanceCritico;
        const variacao = Math.floor(Math.random() * 5) - 2;
        let danoHeroi = Math.max(10, estadoJogo.ataqueBase + variacao);
        if (critico) {
            danoHeroi = Math.round(danoHeroi * 1.45);
        }

        const danoHypatia = estadoJogo.magoPresente ? 16 : 0;
        const danoTotal = danoHeroi + danoHypatia;

        tocarEfeitoSonoro("ataque", somAtivo);
        setMostrarSlash(true);
        setDragonFlashHit(true);
        exibirTextoFlutuante(critico ? `-${danoHeroi} CRÍTICO (20)!` : `-${danoHeroi} PV`, "dragao", "dano");

        if (danoHypatia > 0) {
            setTimeout(() => {
                exibirTextoFlutuante(`-${danoHypatia} Arcano`, "dragao", "magia");
            }, 220);
        }

        setTimeout(() => {
            setMostrarSlash(false);
            setDragonFlashHit(false);
        }, 450);

        const novoHpDragao = Math.max(0, dragaoEstado.hpAtual - danoTotal);
        setDragaoEstado((prev) => ({ ...prev, hpAtual: novoHpDragao }));

        const mensagensTurno = [`⚔️ Rodada ${rodadaAtual}: Golpe em Cógon causando ${danoHeroi} de dano${critico ? " (CRÍTICO NATURAL!)" : ""}!`];
        if (danoHypatia > 0) {
            mensagensTurno.unshift(`🔮 Arquimaga Hypatia conjurou Raio Prismático causando +${danoHypatia} de dano!`);
        }

        setLogCombate((prev) => [...mensagensTurno, ...prev.slice(0, 3)]);

        if (novoHpDragao <= 0) {
            finalizarConfronto(true);
            return;
        }

        iniciarTurnoDragao(estadoJogo.hpAtual, estadoJogo.inventario, false);
    }

    function executarPosturaDefensiva() {
        if (!turnoDoJogador || batalhaFinalizada || desafioEscudo) return;

        setTurnoDoJogador(false);
        setBolsaAberta(false);

        tocarEfeitoSonoro("acerto", somAtivo);
        exibirTextoFlutuante("FOCO NO ESCUDO!", "heroi", "cura");

        let novoHpDragao = dragaoEstado.hpAtual;
        const mensagensTurno = [`🛡️ Rodada ${rodadaAtual}: Postura Defensiva ativada! Acerte a tabuada em 5s para bloquear 75% do golpe!`];

        if (estadoJogo.magoPresente) {
            const danoCobertura = 10;
            novoHpDragao = Math.max(0, dragaoEstado.hpAtual - danoCobertura);
            setDragaoEstado((prev) => ({ ...prev, hpAtual: novoHpDragao }));
            setDragonFlashHit(true);
            exibirTextoFlutuante(`-${danoCobertura} Arcano`, "dragao", "magia");
            setTimeout(() => setDragonFlashHit(false), 450);
            mensagensTurno.unshift(`🔮 Arquimaga Hypatia cobriu sua posição disparando +${danoCobertura} de dano arcano!`);
        }

        setLogCombate((prev) => [...mensagensTurno, ...prev.slice(0, 3)]);

        if (novoHpDragao <= 0) {
            finalizarConfronto(true);
            return;
        }

        iniciarTurnoDragao(estadoJogo.hpAtual, estadoJogo.inventario, true);
    }

    function usarItemBolsa(itemId: string) {
        if (!turnoDoJogador || batalhaFinalizada || desafioEscudo) return;

        const item = estadoJogo.inventario.find((i) => i.id === itemId && i.quantidade > 0);
        if (!item) return;

        setTurnoDoJogador(false);
        setBolsaAberta(false);

        const novoInventario = estadoJogo.inventario.map((i) => (i.id === itemId ? { ...i, quantidade: i.quantidade - 1 } : i)).filter((i) => i.quantidade > 0);

        let hpHeroiAtualizado = estadoJogo.hpAtual;
        let hpDragaoAtualizado = dragaoEstado.hpAtual;
        const mensagens: string[] = [];

        if (item.efeito === "CURA" || item.efeito === "CURA_PERCENTUAL") {
            const curaCalculada = item.efeito === "CURA_PERCENTUAL" ? Math.round((estadoJogo.hpMaximo * item.valor) / 100) : item.valor;

            hpHeroiAtualizado = Math.min(estadoJogo.hpMaximo, estadoJogo.hpAtual + curaCalculada);
            tocarEfeitoSonoro("cura", somAtivo);
            exibirTextoFlutuante(`+${curaCalculada} PV`, "heroi", "cura");
            mensagens.push(`🧪 Rodada ${rodadaAtual}: Você usou ${item.nome} e recuperou +${curaCalculada} PV!`);
        } else if (item.efeito === "DANO") {
            tocarEfeitoSonoro("ataque", somAtivo);
            setDragonFlashHit(true);
            exibirTextoFlutuante(`-${item.valor} PV`, "dragao", "magia");
            setTimeout(() => setDragonFlashHit(false), 450);

            hpDragaoAtualizado = Math.max(0, dragaoEstado.hpAtual - item.valor);
            mensagens.push(`💥 Rodada ${rodadaAtual}: Você lançou ${item.nome} causando ${item.valor} de dano!`);
        }

        if (estadoJogo.magoPresente && hpDragaoAtualizado > 0) {
            const danoApoio = 14;
            hpDragaoAtualizado = Math.max(0, hpDragaoAtualizado - danoApoio);
            setTimeout(() => {
                exibirTextoFlutuante(`-${danoApoio} Arcano`, "dragao", "magia");
            }, 240);
            mensagens.unshift(`🔮 Arquimaga Hypatia aproveitou a brecha e causou +${danoApoio} de dano!`);
        }

        onAtualizarHeroi(hpHeroiAtualizado, novoInventario);
        setDragaoEstado((prev) => ({ ...prev, hpAtual: hpDragaoAtualizado }));
        setLogCombate((prev) => [...mensagens, ...prev.slice(0, 3)]);

        if (hpDragaoAtualizado <= 0) {
            finalizarConfronto(true);
            return;
        }

        iniciarTurnoDragao(hpHeroiAtualizado, novoInventario, false);
    }

    const porcentagemTempo = Math.max(0, Math.min(100, (tempoRestanteMs / TEMPO_LIMITE_ESCUDO_MS) * 100));

    return (
        <div className={`grid grid-cols-1 lg:grid-cols-12 gap-3.5 h-full min-h-0 items-stretch ${animacaoShake ? "animate-screen-shake" : ""}`}>
            {/* ESQUERDA (8 cols): Arena 16-bits no Santuario Circular */}
            <MolduraDnD destaque className="lg:col-span-8 p-3.5 sm:p-5 overflow-hidden min-h-[300px] flex flex-col justify-between">
                <div className="pointer-events-none absolute inset-0 rounded-xl overflow-hidden">
                    <CenarioPixelArt tipo="arena_batalha" />
                    <div className="absolute inset-0 bg-black/15" />
                </div>

                {/* MODAL DE REACAO RAPIDA (5 SEGUNDOS) PARA ERGUER O ESCUDO */}
                {desafioEscudo && !batalhaFinalizada && (
                    <div className="absolute inset-0 z-30 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
                        <div className="w-full max-w-md rounded-xl border-2 border-amber-400 bg-[#140f0b]/98 p-4 sm:p-5 shadow-[0_0_40px_rgba(245,158,11,0.35)] space-y-3.5">
                            <div className="flex items-center justify-between gap-2">
                                <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-300">
                                    <Shield className="w-4 h-4 text-amber-400 animate-bounce" />
                                    {desafioEscudo.ehSopro ? "🔥 BLOQUEAR SOPRO DE FOGO!" : "🛡️ ERGUER ESCUDO AGORA!"}
                                </span>
                                <span className={`inline-flex items-center gap-1 text-xs font-black px-2 py-0.5 rounded border ${tempoRestanteMs <= 2000 ? "bg-rose-950 text-rose-300 border-rose-500 animate-pulse" : "bg-amber-950 text-amber-200 border-amber-500/50"}`}>
                                    <Timer className="w-3.5 h-3.5" />
                                    {(tempoRestanteMs / 1000).toFixed(1)}s
                                </span>
                            </div>

                            {/* Barra regressiva de 5 segundos */}
                            <div className="w-full h-2.5 bg-stone-900 rounded-full overflow-hidden border border-stone-700">
                                <div className={`h-full transition-all duration-75 ${porcentagemTempo > 50 ? "bg-emerald-500" : porcentagemTempo > 25 ? "bg-amber-400" : "bg-rose-500"}`} style={{ width: `${porcentagemTempo}%` }} />
                            </div>

                            <div className="text-center py-2 px-3 rounded-lg bg-[#0b0806] border border-amber-500/35">
                                <p className="text-[11px] text-stone-400 uppercase tracking-wider font-bold">Cálculo Surpresa • Resolva para defender!</p>
                                <p className="font-dnd-title text-3xl sm:text-4xl font-black text-amber-100 mt-1 tracking-wide">{desafioEscudo.enunciado}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-2.5">
                                {desafioEscudo.opcoes.map((opcao, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => {
                                            const acertou = opcao === desafioEscudo.respostaCorreta;
                                            concluirAtaqueDragao(desafioEscudo, acertou, acertou ? undefined : "ERRO");
                                        }}
                                        className="py-3 px-4 rounded-lg bg-gradient-to-b from-[#261d15] to-[#1a130e] hover:from-amber-500 hover:to-amber-600 hover:text-stone-950 text-amber-100 font-dnd-title font-black text-xl border border-amber-500/50 shadow-md transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <span className="text-[10px] font-sans opacity-60">[{idx + 1}]</span>
                                        <span>{opcao}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Topo: Barra do Dragao Cogon + Sprite sobre a plataforma */}
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div className={`bg-[#120d0a]/92 border-2 rounded-lg p-2.5 max-w-xs w-full shadow-xl transition-colors ${dragaoCarregando ? "border-orange-400 ring-2 ring-orange-500/40" : "border-emerald-500/60"}`}>
                        <div className="flex items-center justify-between text-xs font-extrabold mb-1">
                            <span className="font-dnd-title text-emerald-300">🐉 Cógon, Dragão das Escalas</span>
                            <span className="text-stone-200">
                                {dragaoEstado.hpAtual}/{dragaoEstado.hpMaximo}
                            </span>
                        </div>
                        <div className="w-full h-2.5 bg-stone-900 rounded-sm overflow-hidden border border-emerald-500/40">
                            <div
                                className="h-full bg-gradient-to-r from-emerald-600 via-green-500 to-lime-400 transition-all duration-300"
                                style={{
                                    width: `${(dragaoEstado.hpAtual / dragaoEstado.hpMaximo) * 100}%`,
                                }}
                            />
                        </div>
                        {dragaoCarregando ? (
                            <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-orange-300 animate-pulse">
                                <Flame className="w-3 h-3 text-orange-400" />
                                Sopro Carregado! Use Postura Defensiva!
                            </span>
                        ) : (
                            <span className="text-[10px] text-stone-400 mt-0.5 block">
                                ATQ: {dragaoEstado.ataqueBase} • {dragaoEstado.nivel}
                            </span>
                        )}
                    </div>

                    <div className="relative self-end sm:self-center mr-1 sm:mr-6">
                        {dragaoCarregando && <div className="pointer-events-none absolute -inset-3 rounded-full bg-orange-500/30 blur-xl animate-pulse" />}
                        <CogonSprite atingido={dragonFlashHit} />

                        {mostrarSlash && (
                            <div className="pointer-events-none absolute inset-0 flex items-center justify-center animate-slash">
                                <svg viewBox="0 0 100 100" className="w-28 h-28">
                                    <path d="M15,85 Q50,45 88,12" stroke="#fbbf24" strokeWidth="8" strokeLinecap="round" fill="none" />
                                    <path d="M20,82 Q50,45 85,15" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" fill="none" />
                                </svg>
                            </div>
                        )}

                        {danosFlutuantes
                            .filter((d) => d.alvo === "dragao")
                            .map((d) => (
                                <div key={d.id} className={`pointer-events-none absolute -top-4 left-1/2 -translate-x-1/2 font-dnd-title font-black text-base sm:text-lg whitespace-nowrap drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] animate-floating-damage ${d.tipo === "magia" ? "text-sky-300" : "text-amber-300"}`}>
                                    {d.texto}
                                </div>
                            ))}
                    </div>
                </div>

                {/* Base: Heroi + Arquimaga Hypatia & Placa do Jogador */}
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                    <div className="relative flex items-end gap-1 ml-1 sm:ml-4">
                        <HeroSprite equipamentos={estadoJogo.equipamentos} atingido={heroFlashHit} direcao="costas" />
                        {estadoJogo.magoPresente && <HypatiaSprite direcao="costas" />}

                        {danosFlutuantes
                            .filter((d) => d.alvo === "heroi")
                            .map((d) => (
                                <div key={d.id} className={`pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 font-dnd-title font-black text-base sm:text-lg whitespace-nowrap drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] animate-floating-damage ${d.tipo === "cura" ? "text-emerald-400" : "text-rose-400"}`}>
                                    {d.texto}
                                </div>
                            ))}
                    </div>

                    <div className="bg-[#120d0a]/92 border-2 border-amber-500/55 rounded-lg p-2.5 max-w-xs w-full shadow-xl self-end">
                        <div className="flex items-center justify-between text-xs font-extrabold mb-1">
                            <span className="font-dnd-title text-amber-300">🛡️ {estadoJogo.jogador.nome}</span>
                            <span className="text-stone-200">
                                {estadoJogo.hpAtual}/{estadoJogo.hpMaximo} PV
                            </span>
                        </div>
                        <div className="w-full h-2.5 bg-stone-900 rounded-sm overflow-hidden border border-amber-500/40">
                            <div
                                className="h-full bg-gradient-to-r from-emerald-600 to-teal-400 transition-all duration-300"
                                style={{
                                    width: `${(estadoJogo.hpAtual / estadoJogo.hpMaximo) * 100}%`,
                                }}
                            />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-stone-300 mt-1 font-semibold">
                            <span>
                                FOR: {estadoJogo.ataqueBase} • CA: {estadoJogo.defesa} • d20: {Math.round(estadoJogo.chanceCritico * 100)}%
                            </span>
                            {estadoJogo.magoPresente && <span className="text-sky-300 font-bold">+Hypatia</span>}
                        </div>
                    </div>
                </div>
            </MolduraDnD>

            {/* DIREITA (4 cols): Comandos de Turno, Bolsa & Cronicas da Batalha */}
            <MolduraDnD className="lg:col-span-4 p-4 flex flex-col justify-between gap-3 overflow-y-auto">
                <div className="space-y-2.5">
                    <div className="border-b border-amber-600/25 pb-2 flex items-center justify-between">
                        <h3 className="font-dnd-title text-xs sm:text-sm font-extrabold text-amber-300 uppercase tracking-wider">Rodada {rodadaAtual} • Ações</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${desafioEscudo ? "bg-rose-950 text-rose-300 border border-rose-500/50 animate-pulse" : turnoDoJogador ? "bg-emerald-950 text-emerald-300 border border-emerald-500/40" : "bg-amber-950 text-amber-300 border border-amber-500/40"}`}>{desafioEscudo ? "Escudo (5s)!" : turnoDoJogador ? "Sua Vez" : "Turno de Cógon..."}</span>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                        <button type="button" disabled={!turnoDoJogador || batalhaFinalizada || Boolean(desafioEscudo)} onClick={executarAtaqueJogador} className="min-h-[46px] py-2.5 px-4 rounded-lg bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-40 text-stone-950 font-dnd-title font-black text-sm border border-amber-300/60 shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]">
                            <Sword className="w-4 h-4" />
                            <span>Atacar com Arma</span>
                        </button>

                        <button type="button" disabled={!turnoDoJogador || batalhaFinalizada || Boolean(desafioEscudo)} onClick={executarPosturaDefensiva} className={`min-h-[46px] py-2.5 px-4 rounded-lg disabled:opacity-40 font-dnd-title font-black text-sm border shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] ${dragaoCarregando ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border-emerald-300 ring-2 ring-emerald-400/50" : "bg-[#172822] hover:bg-[#1f362e] text-emerald-100 border-emerald-500/45"}`}>
                            <Shield className="w-4 h-4 text-emerald-300" />
                            <span>Postura Defensiva (Bloqueio -75%)</span>
                        </button>

                        <button type="button" disabled={!turnoDoJogador || batalhaFinalizada || Boolean(desafioEscudo)} onClick={() => setBolsaAberta(!bolsaAberta)} className="min-h-[46px] py-2.5 px-4 rounded-lg bg-[#192338] hover:bg-[#22304d] disabled:opacity-40 text-sky-100 font-dnd-title font-black text-sm border border-sky-400/50 shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]">
                            <Backpack className="w-4 h-4 text-sky-300" />
                            <span>Bolsa ({estadoJogo.inventario.reduce((acc, item) => acc + item.quantidade, 0)})</span>
                        </button>
                    </div>

                    {/* Atalhos rapidos exclusivos do Modo Dev */}
                    {modoDev && (
                        <div className="p-2.5 rounded-lg bg-fuchsia-950/45 border border-fuchsia-500/45 space-y-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-fuchsia-300 block">🛠️ Atalhos Dev de Combate</span>
                            <div className="grid grid-cols-2 gap-1.5">
                                <button
                                    type="button"
                                    disabled={batalhaFinalizada}
                                    onClick={() => {
                                        setDragaoEstado((prev) => ({ ...prev, hpAtual: 0 }));
                                        finalizarConfronto(true);
                                    }}
                                    className="py-1.5 px-2 rounded bg-emerald-900/70 hover:bg-emerald-800 border border-emerald-400/50 text-emerald-100 font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                                >
                                    <Zap className="w-3 h-3" />
                                    <span>Vencer Agora</span>
                                </button>
                                <button
                                    type="button"
                                    disabled={batalhaFinalizada}
                                    onClick={() => {
                                        onAtualizarHeroi(0, estadoJogo.inventario);
                                        finalizarConfronto(false);
                                    }}
                                    className="py-1.5 px-2 rounded bg-rose-900/70 hover:bg-rose-800 border border-rose-400/50 text-rose-100 font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                                >
                                    <Skull className="w-3 h-3" />
                                    <span>Perder Agora</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {bolsaAberta && (
                        <div className="p-2.5 rounded-lg bg-[#0d0a08] border border-sky-500/40 space-y-2">
                            <div className="flex items-center justify-between text-[11px] font-bold text-sky-300">
                                <span>🎒 Consumíveis (1 turno)</span>
                                <button type="button" onClick={() => setBolsaAberta(false)} className="text-stone-400 hover:text-white cursor-pointer">
                                    ✕
                                </button>
                            </div>
                            {estadoJogo.inventario.length === 0 ? (
                                <p className="text-xs text-stone-400 py-1">Bolsa vazia.</p>
                            ) : (
                                <div className="space-y-1.5">
                                    {estadoJogo.inventario.map((item) => (
                                        <button key={item.id} type="button" onClick={() => usarItemBolsa(item.id)} className="w-full p-2 rounded bg-[#18130f] hover:bg-[#241c16] border border-amber-500/35 text-left flex items-center gap-2 cursor-pointer">
                                            <span className="text-lg">{item.icone}</span>
                                            <div className="min-w-0">
                                                <p className="font-bold text-xs text-amber-50 truncate">
                                                    {item.nome} ×{item.quantidade}
                                                </p>
                                                <p className="text-[10px] text-stone-400 truncate">{item.descricao}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-3 rounded-lg bg-[#0d0a08] border border-amber-600/25 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">Crônicas do Combate</span>
                    {logCombate.map((linha, i) => (
                        <p key={i} className={`text-xs leading-snug ${i === 0 ? "text-amber-100 font-bold" : "text-stone-400"}`}>
                            {linha}
                        </p>
                    ))}
                </div>
            </MolduraDnD>
        </div>
    );
}
