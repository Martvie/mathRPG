import { AlertTriangle, ChevronRight, Dices, Download, RotateCcw, ScrollText, Shield, Sparkles, Sword, Trophy, Volume2, VolumeX, Wrench } from "lucide-react";
import React, { useEffect, useState } from "react";
import Batalha, { TransicaoArena } from "./Batalha";
import { CenarioPixelArt, CogonSprite, HeroSprite, HypatiaSprite, MiniMapaJornada, MolduraDnD } from "./Graficos";
import Questoes, { ROTEIRO_ETAPAS, sortearQuestoesPartida } from "./Questoes";
import { SheetsApi, baixarComprovanteCsv, calcularAtributosDragao, determinarEpilogo, tocarEfeitoSonoro } from "./Servicos";
import { ConfigDev, EstadoDragao, EstadoJogo, EtapaRoteiro, FinalForcadoDev, ItemInventario, Questao, RegistroResposta, ResultadoSalvamento, TelaJogo, TipoLutaDev } from "./Tipos";

const ESTADO_INICIAL_JOGO: EstadoJogo = {
    jogador: { nome: "", turma: "" },
    hpAtual: 100,
    hpMaximo: 100,
    ataqueBase: 16,
    defesa: 0,
    chanceCritico: 0.12,
    acertosQuiz: 0,
    equipamentos: [],
    inventario: [],
    reliquiasColetadas: [],
    magoPresente: false,
    statusBatalha: "EM_ANDAMENTO",
};

const EQUIPAMENTOS_COMPLETOS = ["espada_angulo", "escudo_poligonal", "armadura_numerica", "lanca_ouro"];

function detectarRotaDev(): boolean {
    if (typeof window === "undefined") return false;
    const caminho = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    const params = new URLSearchParams(window.location.search);
    return caminho.endsWith("/dev") || caminho.includes("/dev/") || hash.includes("dev") || params.has("dev");
}

function obterDragaoPorTipoLuta(acertos: number, tipoLuta: TipoLutaDev): EstadoDragao {
    if (tipoLuta === "FACIL") return calcularAtributosDragao(10);
    if (tipoLuta === "MEDIO") return calcularAtributosDragao(6);
    if (tipoLuta === "DIFICIL") return calcularAtributosDragao(0);
    return calcularAtributosDragao(acertos);
}

export default function App() {
    const [telaAtual, setTelaAtual] = useState<TelaJogo>("LOGIN");

    // Modo Dev (/dev na URL ou icone de chave inglesa apenas antes de iniciar partida normal)
    const [configDev, setConfigDev] = useState<ConfigDev>(() => ({
        ativo: detectarRotaDev(),
        tipoLuta: "AUTO",
        finalForcado: "AUTO",
        forcarHypatia: false,
        equipamentoCompleto: false,
    }));
    const [painelDevAberto, setPainelDevAberto] = useState<boolean>(() => detectarRotaDev());

    // Conexao Google Sheets via .env & GET Dinamico das Abas
    const [turmasDisponiveis, setTurmasDisponiveis] = useState<string[]>([]);
    const [temTurmasConfiguradas, setTemTurmasConfiguradas] = useState(false);
    const [modoProducao, setModoProducao] = useState(false);
    const [carregandoTurmas, setCarregandoTurmas] = useState(true);
    const [statusSalvamento, setStatusSalvamento] = useState<ResultadoSalvamento | null>(null);

    // Dados do Formulario de Login
    const [nomeInput, setNomeInput] = useState(() => (detectarRotaDev() ? "Desenvolvedor (Modo Teste)" : ""));
    const [turmaInput, setTurmaInput] = useState("");
    const [erroLogin, setErroLogin] = useState("");

    // Preferencias de Sala de Aula
    const [somAtivo, setSomAtivo] = useState(true);

    // Estado Central do Jogo
    const [estadoJogo, setEstadoJogo] = useState<EstadoJogo>(ESTADO_INICIAL_JOGO);

    // Controle da Fase 1 (Quiz)
    const [questoesPartida, setQuestoesPartida] = useState<Questao[]>([]);
    const [indiceEtapa, setIndiceEtapa] = useState(0);
    const [historicoRespostas, setHistoricoRespostas] = useState<RegistroResposta[]>([]);

    // Configuracao Inicial do Chefe para a Fase 2 (Batalha)
    const [dragaoInicial, setDragaoInicial] = useState<EstadoDragao>(() => calcularAtributosDragao(0));

    useEffect(() => {
        let ativo = true;
        async function inicializarTurmas() {
            setCarregandoTurmas(true);
            const resultado = await SheetsApi.carregarTurmas();
            if (!ativo) return;

            setTurmasDisponiveis(resultado.turmas);
            setTemTurmasConfiguradas(resultado.temTurmas);
            setModoProducao(resultado.modoProducao);
            setTurmaInput(resultado.temTurmas ? resultado.turmas[0] : "Modo Teste");
            setCarregandoTurmas(false);
        }
        inicializarTurmas();
        return () => {
            ativo = false;
        };
    }, []);

    function alternarModoDev() {
        setConfigDev((prev) => {
            // Bloqueia ativacao do Modo Dev depois que uma partida normal ja iniciou
            if (!prev.ativo && telaAtual !== "LOGIN") {
                return prev;
            }

            const proximoAtivo = !prev.ativo;
            if (proximoAtivo && !nomeInput.trim()) {
                setNomeInput("Desenvolvedor (Modo Teste)");
            }
            setPainelDevAberto(proximoAtivo);
            return {
                ...prev,
                ativo: proximoAtivo,
            };
        });
    }

    function atualizarConfigDev(parcial: Partial<ConfigDev>) {
        setConfigDev((prev) => {
            if (!prev.ativo && telaAtual !== "LOGIN") return prev;
            const atualizado = { ...prev, ...parcial, ativo: true };

            if (parcial.tipoLuta !== undefined) {
                setDragaoInicial(obterDragaoPorTipoLuta(estadoJogo.acertosQuiz, atualizado.tipoLuta));
            }

            if (parcial.equipamentoCompleto !== undefined || parcial.forcarHypatia !== undefined) {
                setEstadoJogo((jogoAtual) => {
                    const usarEquip = atualizado.equipamentoCompleto;
                    const usarHypatia = atualizado.forcarHypatia;
                    return {
                        ...jogoAtual,
                        hpMaximo: usarEquip ? 125 : 100,
                        hpAtual: usarEquip ? 125 : Math.min(100, jogoAtual.hpAtual),
                        ataqueBase: usarEquip ? 36 : 16,
                        defesa: usarEquip ? 10 : 0,
                        chanceCritico: usarEquip ? 0.4 : 0.12,
                        equipamentos: usarEquip ? [...EQUIPAMENTOS_COMPLETOS] : [],
                        magoPresente: usarHypatia,
                        reliquiasColetadas: usarHypatia ? [1, 2, 3] : [],
                    };
                });
            }

            return atualizado;
        });
    }

    function prepararEstadoCompletoParaArena(tipoOverride?: TipoLutaDev) {
        const tipoEfetivo = tipoOverride ?? configDev.tipoLuta;
        const sorteadas = questoesPartida.length === 10 ? questoesPartida : sortearQuestoesPartida();
        setQuestoesPartida(sorteadas);

        const acertosSimulados = tipoEfetivo === "DIFICIL" ? 2 : tipoEfetivo === "MEDIO" ? 6 : 10;

        const historicoSimulado: RegistroResposta[] = ROTEIRO_ETAPAS.map((etapa, idx) => ({
            etapa: etapa.etapa,
            tema: sorteadas[idx]?.tema || "PA & PG",
            acertou: idx < acertosSimulados,
        }));
        setHistoricoRespostas(historicoSimulado);

        const ehCompleto = configDev.equipamentoCompleto || tipoEfetivo === "FACIL" || tipoEfetivo === "AUTO";

        const usarHypatia = configDev.forcarHypatia || tipoEfetivo === "FACIL" || tipoEfetivo === "AUTO";

        if (ehCompleto) {
            setEstadoJogo({
                jogador: {
                    nome: nomeInput.trim() || "Desenvolvedor (Modo Teste)",
                    turma: "Modo Dev",
                },
                hpAtual: 125,
                hpMaximo: 125,
                ataqueBase: 36,
                defesa: 10,
                chanceCritico: 0.4,
                acertosQuiz: acertosSimulados,
                equipamentos: [...EQUIPAMENTOS_COMPLETOS],
                inventario: [
                    {
                        id: "pocao_vitalidade",
                        nome: "Poção de Vitalidade",
                        quantidade: 2,
                        efeito: "CURA",
                        valor: 45,
                        icone: "🧪",
                        descricao: "Restaura +45 PV na batalha (consome 1 ação de turno).",
                    },
                    {
                        id: "bomba_matriz",
                        nome: "Bomba de Matriz",
                        quantidade: 1,
                        efeito: "DANO",
                        valor: 45,
                        icone: "💣",
                        descricao: "Explosão arcana que causa 45 de dano direto em Cógon.",
                    },
                    {
                        id: "pergaminho_arcano",
                        nome: "Pergaminho de Feitiço Arcano",
                        quantidade: 1,
                        efeito: "DANO",
                        valor: 55,
                        icone: "📜",
                        descricao: "Conjura um raio rúnico causando 55 de dano mágico.",
                    },
                ],
                reliquiasColetadas: usarHypatia ? [1, 2, 3] : [1],
                magoPresente: usarHypatia,
                statusBatalha: "EM_ANDAMENTO",
            });
        } else if (tipoEfetivo === "MEDIO") {
            setEstadoJogo({
                jogador: {
                    nome: nomeInput.trim() || "Desenvolvedor (Modo Teste)",
                    turma: "Modo Dev",
                },
                hpAtual: 110,
                hpMaximo: 110,
                ataqueBase: 26,
                defesa: 4,
                chanceCritico: 0.2,
                acertosQuiz: 6,
                equipamentos: ["espada_angulo", "escudo_poligonal"],
                inventario: [
                    {
                        id: "pocao_vitalidade",
                        nome: "Poção de Vitalidade",
                        quantidade: 1,
                        efeito: "CURA",
                        valor: 45,
                        icone: "🧪",
                        descricao: "Restaura +45 PV na batalha (consome 1 ação de turno).",
                    },
                    {
                        id: "bomba_matriz",
                        nome: "Bomba de Matriz",
                        quantidade: 1,
                        efeito: "DANO",
                        valor: 40,
                        icone: "💣",
                        descricao: "Explosão arcana que causa 40 de dano direto em Cógon.",
                    },
                ],
                reliquiasColetadas: usarHypatia ? [1, 2, 3] : [1],
                magoPresente: usarHypatia,
                statusBatalha: "EM_ANDAMENTO",
            });
        } else {
            // DIFICIL: Herói com poucos recursos para testar sobrevivência tática real
            setEstadoJogo({
                jogador: {
                    nome: nomeInput.trim() || "Desenvolvedor (Modo Teste)",
                    turma: "Modo Dev",
                },
                hpAtual: 100,
                hpMaximo: 100,
                ataqueBase: 18,
                defesa: 0,
                chanceCritico: 0.12,
                acertosQuiz: 2,
                equipamentos: [],
                inventario: [
                    {
                        id: "pocao_vitalidade",
                        nome: "Poção de Vitalidade",
                        quantidade: 1,
                        efeito: "CURA",
                        valor: 40,
                        icone: "🧪",
                        descricao: "Restaura +40 PV na batalha (consome 1 ação de turno).",
                    },
                ],
                reliquiasColetadas: usarHypatia ? [1, 2, 3] : [],
                magoPresente: usarHypatia,
                statusBatalha: "EM_ANDAMENTO",
            });
        }

        setDragaoInicial(obterDragaoPorTipoLuta(acertosSimulados, tipoEfetivo));
    }

    function iniciarJornada(e?: React.FormEvent) {
        if (e) e.preventDefault();
        const nomeLimpo = nomeInput.trim() || (configDev.ativo ? "Desenvolvedor (Modo Teste)" : "");
        if (!nomeLimpo) {
            setErroLogin("Inscreva o seu nome no Pergaminho da Guilda para começar.");
            return;
        }

        if (!configDev.ativo && temTurmasConfiguradas && !turmaInput) {
            setErroLogin("Selecione a sua turma antes de iniciar a campanha.");
            return;
        }

        if (!configDev.ativo) {
            setPainelDevAberto(false);
        }

        const turmaDefinida = configDev.ativo ? "Modo Dev" : temTurmasConfiguradas ? turmaInput : "Modo Teste";

        setErroLogin("");
        setQuestoesPartida(sortearQuestoesPartida());
        setIndiceEtapa(0);
        setHistoricoRespostas([]);
        setStatusSalvamento(null);

        setEstadoJogo({
            ...ESTADO_INICIAL_JOGO,
            jogador: { nome: nomeLimpo, turma: turmaDefinida },
            hpAtual: configDev.ativo && configDev.equipamentoCompleto ? 125 : 100,
            hpMaximo: configDev.ativo && configDev.equipamentoCompleto ? 125 : 100,
            ataqueBase: configDev.ativo && configDev.equipamentoCompleto ? 36 : 16,
            defesa: configDev.ativo && configDev.equipamentoCompleto ? 10 : 0,
            chanceCritico: configDev.ativo && configDev.equipamentoCompleto ? 0.4 : 0.12,
            equipamentos: configDev.ativo && configDev.equipamentoCompleto ? [...EQUIPAMENTOS_COMPLETOS] : [],
            magoPresente: configDev.ativo ? configDev.forcarHypatia : false,
            reliquiasColetadas: configDev.ativo && configDev.forcarHypatia ? [1, 2, 3] : [],
        });

        tocarEfeitoSonoro("acerto", somAtivo);
        setTelaAtual("QUIZ");
    }

    function registrarRespostaEtapa(acertou: boolean, etapaInfo: EtapaRoteiro, questao: Questao) {
        setHistoricoRespostas((prev) => {
            const jaRegistrada = prev.some((r) => r.etapa === etapaInfo.etapa);
            if (jaRegistrada) return prev;
            return [
                ...prev,
                {
                    etapa: etapaInfo.etapa,
                    tema: questao.tema,
                    acertou,
                },
            ];
        });

        if (!acertou) return;

        setEstadoJogo((prev) => {
            let novoHpMax = prev.hpMaximo;
            let novoHpAtual = prev.hpAtual;
            let novoAtaque = prev.ataqueBase;
            let novaDefesa = prev.defesa;
            let novaCrit = prev.chanceCritico;
            const novosEquip = [...prev.equipamentos];
            const novoInv = prev.inventario.map((item) => ({ ...item }));
            const novasReliquias = [...prev.reliquiasColetadas];

            const rec = etapaInfo.recompensa;

            if (rec.id === "espada_angulo" && !novosEquip.includes(rec.id)) {
                novosEquip.push(rec.id);
                novoAtaque += 12;
            } else if (rec.id === "escudo_poligonal" && !novosEquip.includes(rec.id)) {
                novosEquip.push(rec.id);
                novoHpMax += 25;
                novoHpAtual += 25;
                novaDefesa += 4;
            } else if (rec.id === "armadura_numerica" && !novosEquip.includes(rec.id)) {
                novosEquip.push(rec.id);
                novaDefesa += 6;
            } else if (rec.id === "lanca_ouro" && !novosEquip.includes(rec.id)) {
                novosEquip.push(rec.id);
                novoAtaque += 8;
                novaCrit = 0.4;
                novoHpAtual = Math.min(novoHpMax, novoHpAtual + 20);
            } else if (rec.tipo === "CONSUMIVEL" && rec.efeito && rec.valor !== undefined) {
                if (!novoInv.some((i) => i.id === rec.id)) {
                    novoInv.push({
                        id: rec.id,
                        nome: rec.id === "pocao_vitalidade" ? "Poção de Vitalidade" : rec.nome,
                        quantidade: rec.quantidade || 1,
                        efeito: rec.efeito,
                        valor: rec.valor,
                        icone: rec.icone,
                        descricao: rec.descricao,
                    });
                }
            } else if (rec.tipo === "RELIQUIA" && rec.reliquiaIndex !== undefined) {
                if (!novasReliquias.includes(rec.reliquiaIndex)) {
                    novasReliquias.push(rec.reliquiaIndex);
                }
            }

            return {
                ...prev,
                hpMaximo: novoHpMax,
                hpAtual: novoHpAtual,
                ataqueBase: novoAtaque,
                defesa: novaDefesa,
                chanceCritico: novaCrit,
                acertosQuiz: Math.min(10, prev.acertosQuiz + 1),
                equipamentos: novosEquip,
                inventario: novoInv,
                reliquiasColetadas: novasReliquias,
            };
        });
    }

    function avancarEtapaQuiz() {
        if (indiceEtapa < 9) {
            setIndiceEtapa((prev) => prev + 1);
            return;
        }

        const qtdReliquias = estadoJogo.reliquiasColetadas.length;
        const magoRecrutado = configDev.ativo && configDev.forcarHypatia ? true : qtdReliquias === 3;

        setEstadoJogo((prev) => {
            let novaDefesa = prev.defesa;
            const novoInventario = prev.inventario.map((i) => ({ ...i }));

            if (!magoRecrutado && qtdReliquias > 0) {
                if (prev.reliquiasColetadas.includes(1)) {
                    novaDefesa += 5;
                }
                if (prev.reliquiasColetadas.includes(2)) {
                    novoInventario.push({
                        id: "gema_prisma",
                        nome: "Gema do Prisma Brilhante",
                        quantidade: 1,
                        efeito: "DANO",
                        valor: 50,
                        icone: "💎",
                        descricao: "Dispara um raio luminoso causando 50 de dano em Cógon.",
                    });
                }
                if (prev.reliquiasColetadas.includes(3)) {
                    novoInventario.push({
                        id: "elixir_constante",
                        nome: "Elixir da Constante",
                        quantidade: 1,
                        efeito: "CURA_PERCENTUAL",
                        valor: 60,
                        icone: "⚗️",
                        descricao: "Recupera 60% dos seus PV Máximos instantaneamente.",
                    });
                }
            }

            return {
                ...prev,
                defesa: novaDefesa,
                inventario: novoInventario,
                magoPresente: magoRecrutado,
            };
        });

        setDragaoInicial(obterDragaoPorTipoLuta(estadoJogo.acertosQuiz, configDev.tipoLuta));
        setTelaAtual("TRANSICAO_ARENA");
    }

    function atualizarHeroiEmCombate(hpAtual: number, inventario: ItemInventario[]) {
        setEstadoJogo((prev) => ({
            ...prev,
            hpAtual,
            inventario,
        }));
    }

    async function finalizarBatalha(venceu: boolean) {
        let venceuFinal = venceu;
        if (configDev.ativo && configDev.finalForcado !== "AUTO") {
            venceuFinal = configDev.finalForcado !== "RETIRADA";
        }

        const statusFinal = venceuFinal ? "VITORIA" : "DERROTA";
        const pontoBonus = venceuFinal ? 1 : 0;
        const notaFinal = estadoJogo.acertosQuiz + pontoBonus;

        setEstadoJogo((prev) => ({
            ...prev,
            statusBatalha: statusFinal,
        }));

        tocarEfeitoSonoro(venceuFinal ? "vitoria" : "erro", somAtivo);

        if (configDev.ativo) {
            setStatusSalvamento({
                sucesso: true,
                modoProducao: false,
                mensagem: "Modo Dev: Nenhum dado foi registrado na planilha.",
            });
            setTimeout(() => {
                setTelaAtual("EPILOGO");
            }, 650);
            return;
        }

        const resultadoEnvio = await SheetsApi.salvarPontuacaoFinal(
            {
                nomeAluno: estadoJogo.jogador.nome,
                turma: estadoJogo.jogador.turma,
                acertosQuiz: estadoJogo.acertosQuiz,
                derrotouDragao: venceuFinal ? "Sim" : "Não",
                pontoBonus,
                notaFinal,
                dataHora: new Date().toLocaleString("pt-BR"),
            },
            temTurmasConfiguradas && modoProducao,
        );
        setStatusSalvamento(resultadoEnvio);

        setTimeout(() => {
            setTelaAtual("EPILOGO");
        }, 900);
    }

    function reiniciarParaInicio() {
        setTelaAtual("LOGIN");
        setStatusSalvamento(null);
    }

    const podeAcessarFerramentaDev = telaAtual === "LOGIN" || configDev.ativo;

    return (
        <div className="min-h-dvh lg:h-dvh lg:overflow-hidden bg-[#0c0a09] text-stone-100 font-sans selection:bg-amber-400 selection:text-stone-950 flex flex-col relative overflow-x-hidden">
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800;900&family=Crimson+Pro:ital,wght@0,500;0,600;1,400;1,600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        body {
          font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
          background-color: #0c0a09;
        }
        .font-dnd-title {
          font-family: 'Cinzel', Georgia, serif;
        }
        .font-dnd-lore {
          font-family: 'Crimson Pro', Georgia, serif;
        }
        .bg-tavern-pattern {
          background-image:
            radial-gradient(circle at 50% 0%, rgba(217, 119, 6, 0.08), transparent 60%),
            radial-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 0);
          background-size: 100% 100%, 24px 24px;
        }
        @keyframes shake {
          0% { transform: translate(1px, 1px) rotate(0deg); }
          20% { transform: translate(-4px, 0px) rotate(-1deg); }
          40% { transform: translate(4px, 2px) rotate(1deg); }
          60% { transform: translate(-3px, 1px) rotate(0deg); }
          80% { transform: translate(3px, -1px) rotate(1deg); }
          100% { transform: translate(0, 0) rotate(0deg); }
        }
        .animate-screen-shake {
          animation: shake 0.42s cubic-bezier(.36,.07,.19,.97) both;
        }
        @keyframes flashHit {
          0%, 100% { filter: brightness(1); transform: translateX(0); }
          25% { filter: brightness(2.2) sepia(1) hue-rotate(-50deg) saturate(6); transform: translateX(-6px); }
          50% { filter: brightness(0.7); transform: translateX(6px); }
          75% { filter: brightness(2) sepia(1) hue-rotate(-50deg) saturate(5); transform: translateX(-3px); }
        }
        .animate-flash-hit {
          animation: flashHit 0.4s ease-in-out;
        }
        @keyframes floatUpFade {
          0% { opacity: 1; transform: translateY(0) scale(0.95); }
          30% { opacity: 1; transform: translateY(-16px) scale(1.12); }
          100% { opacity: 0; transform: translateY(-48px) scale(1); }
        }
        .animate-floating-damage {
          animation: floatUpFade 1.1s ease-out forwards;
        }
        @keyframes slashSweep {
          0% { opacity: 0; transform: scale(0.4) rotate(-35deg); }
          40% { opacity: 1; transform: scale(1.15) rotate(0deg); }
          100% { opacity: 0; transform: scale(1.3) rotate(15deg); }
        }
        .animate-slash {
          animation: slashSweep 0.38s ease-out forwards;
        }
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
        .animate-float-slow {
          animation: floatSlow 2.8s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: floatSlow 3.2s ease-in-out 0.6s infinite;
        }
        @keyframes dragonIdle {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-5px) scale(1.02); }
        }
        .animate-dragon-idle {
          animation: dragonIdle 2.5s ease-in-out infinite;
        }
      `}</style>

            <div className="bg-tavern-pattern fixed inset-0 pointer-events-none" />

            {/* HUD Superior Compacto */}
            <header className="border-b border-amber-600/35 bg-[#120e0b]/95 backdrop-blur-md shrink-0 z-30 shadow-md">
                <div className="max-w-6xl mx-auto px-3 sm:px-5 py-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 via-amber-600 to-red-800 border border-amber-300/60 flex items-center justify-center shadow">
                            <Dices className="w-4 h-4 text-amber-100" />
                        </div>
                        <div>
                            <h1 className="font-dnd-title text-xs sm:text-sm font-extrabold tracking-wide text-amber-300 leading-none">A Távola Octogonal</h1>
                            <p className="text-[10px] text-stone-400 hidden sm:block mt-0.5">Math RPG • 1º Ano (PA & PG)</p>
                        </div>
                    </div>

                    {(telaAtual === "QUIZ" || telaAtual === "COMBATE") && (
                        <div className="flex items-center gap-2 sm:gap-3 text-xs font-bold">
                            <div className="flex items-center gap-1.5 bg-[#1b1510] px-2.5 py-1 rounded-lg border border-emerald-500/40">
                                <span className="text-emerald-400 font-extrabold">PV</span>
                                <div className="w-14 sm:w-20 h-2 bg-stone-900 rounded-sm overflow-hidden">
                                    <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${(estadoJogo.hpAtual / estadoJogo.hpMaximo) * 100}%` }} />
                                </div>
                                <span className="text-stone-200 text-[11px]">
                                    {estadoJogo.hpAtual}/{estadoJogo.hpMaximo}
                                </span>
                            </div>

                            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-950/70 border border-amber-500/40 text-amber-300 text-[11px]">
                                <Sword className="w-3 h-3" /> {estadoJogo.ataqueBase}
                            </span>
                            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded bg-sky-950/70 border border-sky-500/40 text-sky-300 text-[11px]">
                                <Shield className="w-3 h-3" /> {estadoJogo.defesa}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-purple-950/70 border border-purple-500/40 text-purple-300 text-[11px]">
                                <Sparkles className="w-3 h-3" /> {estadoJogo.reliquiasColetadas.length}/3
                            </span>
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        {(telaAtual === "QUIZ" || telaAtual === "COMBATE") && <MiniMapaJornada etapaAtualIndex={indiceEtapa} naArena={telaAtual === "COMBATE"} />}

                        <span className={`hidden sm:inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${configDev.ativo ? "bg-fuchsia-950/80 text-fuchsia-300 border-fuchsia-400/50" : modoProducao && temTurmasConfiguradas ? "bg-emerald-950/70 text-emerald-300 border-emerald-500/40" : "bg-amber-950/60 text-amber-300 border-amber-500/40"}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${configDev.ativo ? "bg-fuchsia-400 animate-pulse" : modoProducao && temTurmasConfiguradas ? "bg-emerald-400" : "bg-amber-400"}`} />
                            {configDev.ativo ? "Modo Dev (Sem Registro)" : modoProducao && temTurmasConfiguradas ? "Guilda Conectada" : "Modo Teste"}
                        </span>

                        {podeAcessarFerramentaDev && (
                            <button
                                type="button"
                                onClick={() => {
                                    if (!configDev.ativo) {
                                        alternarModoDev();
                                    } else {
                                        setPainelDevAberto(!painelDevAberto);
                                    }
                                }}
                                title="Abrir ou ativar Painel Dev (/dev)"
                                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${configDev.ativo ? "bg-fuchsia-950/80 hover:bg-fuchsia-900 border-fuchsia-400/60 text-fuchsia-200" : "bg-[#1e1813] hover:bg-[#2a221b] border-amber-600/30 text-stone-400 hover:text-amber-200"}`}
                            >
                                <Wrench className="w-4 h-4" />
                            </button>
                        )}

                        <button type="button" onClick={() => setSomAtivo(!somAtivo)} title={somAtivo ? "Silenciar efeitos sonoros" : "Ativar efeitos sonoros"} className="p-1.5 rounded-lg bg-[#1e1813] hover:bg-[#2a221b] border border-amber-600/30 text-amber-200 transition-colors cursor-pointer">
                            {somAtivo ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                {/* Barra de Controle Exclusiva do Modo Dev */}
                {configDev.ativo && painelDevAberto && (
                    <div className="border-t border-fuchsia-500/35 bg-[#191021]/95 px-3 sm:px-5 py-2 text-xs">
                        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
                            <div className="flex flex-wrap items-center gap-2.5">
                                <span className="font-extrabold text-fuchsia-300 uppercase tracking-wider text-[11px]">🛠️ Painel Dev:</span>

                                <label className="flex items-center gap-1.5 text-stone-200">
                                    <span className="text-[11px] text-fuchsia-200/80">Tipo de Luta:</span>
                                    <select
                                        value={configDev.tipoLuta}
                                        onChange={(e) => {
                                            const novoTipo = e.target.value as TipoLutaDev;
                                            atualizarConfigDev({ tipoLuta: novoTipo });
                                            if (telaAtual === "COMBATE" || telaAtual === "TRANSICAO_ARENA") {
                                                prepararEstadoCompletoParaArena(novoTipo);
                                            }
                                        }}
                                        className="px-2 py-1 rounded bg-[#100a16] border border-fuchsia-500/45 text-fuchsia-100 text-[11px] focus:outline-none"
                                    >
                                        <option value="AUTO">Automático (pelo Quiz)</option>
                                        <option value="FACIL">Fácil • Épico 8–10 (420 PV / 42 ATQ)</option>
                                        <option value="MEDIO">Médio • Equilibrado 5–7 (310 PV / 34 ATQ)</option>
                                        <option value="DIFICIL">Difícil • Sobrevivência 0–4 (230 PV / 30 ATQ)</option>
                                    </select>
                                </label>

                                <label className="flex items-center gap-1.5 text-stone-200">
                                    <span className="text-[11px] text-fuchsia-200/80">Final Pós-Luta:</span>
                                    <select value={configDev.finalForcado} onChange={(e) => atualizarConfigDev({ finalForcado: e.target.value as FinalForcadoDev })} className="px-2 py-1 rounded bg-[#100a16] border border-fuchsia-500/45 text-fuchsia-100 text-[11px] focus:outline-none">
                                        <option value="AUTO">Automático (pelo combate)</option>
                                        <option value="LENDA">🌟 Lenda da Távola (8–10)</option>
                                        <option value="CUSTEADA">⚔️ Vitória Custeada (5–7)</option>
                                        <option value="DESESPERADO">🛡️ Triunfo Desesperado (0–4)</option>
                                        <option value="RETIRADA">📜 Retirada Estratégica (Derrota)</option>
                                    </select>
                                </label>

                                <label className="inline-flex items-center gap-1.5 text-[11px] text-stone-200 cursor-pointer select-none">
                                    <input type="checkbox" checked={configDev.equipamentoCompleto} onChange={(e) => atualizarConfigDev({ equipamentoCompleto: e.target.checked })} className="accent-fuchsia-500" />
                                    <span>Sprites Full Equip</span>
                                </label>

                                <label className="inline-flex items-center gap-1.5 text-[11px] text-stone-200 cursor-pointer select-none">
                                    <input type="checkbox" checked={configDev.forcarHypatia} onChange={(e) => atualizarConfigDev({ forcarHypatia: e.target.checked })} className="accent-fuchsia-500" />
                                    <span>Sprite Hypatia</span>
                                </label>
                            </div>

                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => {
                                        prepararEstadoCompletoParaArena();
                                        setTelaAtual("COMBATE");
                                    }}
                                    className="px-2.5 py-1 rounded bg-fuchsia-800/70 hover:bg-fuchsia-700 text-fuchsia-100 font-bold text-[11px] cursor-pointer"
                                >
                                    Ir para Luta
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        prepararEstadoCompletoParaArena();
                                        finalizarBatalha(configDev.finalForcado !== "RETIRADA");
                                    }}
                                    className="px-2.5 py-1 rounded bg-amber-600/80 hover:bg-amber-500 text-stone-950 font-extrabold text-[11px] cursor-pointer"
                                >
                                    Ver Final
                                </button>
                                <button type="button" onClick={alternarModoDev} className="px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 text-[11px] cursor-pointer">
                                    Desativar Dev
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </header>

            {/* Palco Principal */}
            <main className="relative z-10 flex-1 min-h-0 flex flex-col justify-center max-w-6xl w-full mx-auto px-3 sm:px-5 py-2.5 sm:py-3">
                {/* TELA 1: LOGIN */}
                {telaAtual === "LOGIN" && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch max-w-5xl mx-auto w-full">
                        <MolduraDnD destaque className="lg:col-span-7 overflow-hidden flex flex-col justify-between">
                            <div className="relative h-44 sm:h-56 w-full overflow-hidden border-b border-amber-500/35">
                                <CenarioPixelArt tipo="portao_cidade" />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#16120e] via-transparent to-black/25" />
                                <div className="absolute inset-x-0 bottom-1 flex justify-center items-end gap-3 px-4">
                                    <HeroSprite equipamentos={["espada_angulo", "escudo_poligonal"]} />
                                    <HypatiaSprite />
                                    <CogonSprite />
                                </div>
                            </div>

                            <div className="p-4 sm:p-5">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-widest bg-amber-500/15 text-amber-300 border border-amber-500/35 mb-2">
                                    <Sparkles className="w-3 h-3" />
                                    Crônicas de Poliedra • 1º Ano
                                </span>
                                <h2 className="font-dnd-title text-xl sm:text-2xl font-black text-amber-100 tracking-wide">A Távola Octogonal e a Fúria de Cógon</h2>
                                <p className="font-dnd-lore text-sm sm:text-base text-stone-300 mt-1.5 leading-relaxed">
                                    O dragão <strong className="text-emerald-400">Cógon</strong> despertou no Pico Octogonal! Percorra o Reino de <strong className="text-amber-300">Poliedra</strong>, decifre 10 enigmas de <strong>PA e PG</strong> para forjar relíquias, recrutar a <strong className="text-sky-300">Arquimaga Hypatia</strong> e vencer a batalha final!
                                </p>
                            </div>
                        </MolduraDnD>

                        <MolduraDnD className="lg:col-span-5 p-5 flex flex-col justify-center">
                            <form onSubmit={iniciarJornada} className="space-y-4">
                                <div className="flex items-center justify-between border-b border-amber-600/25 pb-2">
                                    <h3 className="font-dnd-title text-base font-bold text-amber-200 flex items-center gap-2">
                                        <ScrollText className="w-4 h-4 text-amber-400" />
                                        Ficha do Aventureiro
                                    </h3>
                                    <span className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold">Nível 1</span>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-amber-200/80 mb-1.5">Nome Completo do Jogador</label>
                                    <input type="text" value={nomeInput} onChange={(e) => setNomeInput(e.target.value)} placeholder="Ex: Arthur Pendragon da Silva" className="w-full px-3.5 py-2.5 rounded-lg bg-[#0d0a08] border border-amber-600/35 text-amber-50 placeholder-stone-500 focus:outline-none focus:border-amber-400 text-sm sm:text-base" />
                                </div>

                                {!configDev.ativo && carregandoTurmas ? (
                                    <div className="p-2.5 rounded-lg bg-[#0d0a08] border border-amber-600/20 text-xs text-stone-400 flex items-center gap-2">
                                        <Dices className="w-4 h-4 text-amber-400 animate-spin" />
                                        <span>Consultando turmas na guilda...</span>
                                    </div>
                                ) : !configDev.ativo && temTurmasConfiguradas ? (
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-amber-200/80 mb-1.5">Selecione sua Turma</label>
                                        <select value={turmaInput} onChange={(e) => setTurmaInput(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg bg-[#0d0a08] border border-amber-600/35 text-amber-50 focus:outline-none focus:border-amber-400 text-sm sm:text-base">
                                            {turmasDisponiveis.map((turma) => (
                                                <option key={turma} value={turma}>
                                                    {turma}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                ) : null}

                                {erroLogin && (
                                    <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                                        <span>{erroLogin}</span>
                                    </div>
                                )}

                                <button type="submit" className="w-full py-3 px-5 rounded-lg bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-stone-950 font-dnd-title font-black text-base border border-amber-300/60 shadow-lg shadow-amber-600/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer">
                                    <span>{configDev.ativo ? "Iniciar Campanha (Modo Dev)" : "Iniciar Campanha"}</span>
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </form>
                        </MolduraDnD>
                    </div>
                )}

                {/* TELA 2: FASE 1 — QUESTOES & ROTEIRO */}
                {telaAtual === "QUIZ" && (
                    <Questoes
                        questoesPartida={questoesPartida}
                        indiceEtapa={indiceEtapa}
                        estadoJogo={estadoJogo}
                        somAtivo={somAtivo}
                        modoDev={configDev.ativo}
                        onResponderEtapa={registrarRespostaEtapa}
                        onAvancarEtapa={avancarEtapaQuiz}
                        onPularParaArena={() => {
                            prepararEstadoCompletoParaArena();
                            setTelaAtual("TRANSICAO_ARENA");
                        }}
                    />
                )}

                {/* TELA 3: TRANSICAO PRE-COMBATE */}
                {telaAtual === "TRANSICAO_ARENA" && <TransicaoArena estadoJogo={estadoJogo} dragaoInicial={dragaoInicial} onIniciarCombate={() => setTelaAtual("COMBATE")} />}

                {/* TELA 4: FASE 2 — BATALHA CONTRA COGON */}
                {telaAtual === "COMBATE" && <Batalha key={`${dragaoInicial.nivel}-${configDev.tipoLuta}-${estadoJogo.ataqueBase}-${estadoJogo.magoPresente}`} estadoJogo={estadoJogo} dragaoInicial={dragaoInicial} somAtivo={somAtivo} modoDev={configDev.ativo} onAtualizarHeroi={atualizarHeroiEmCombate} onEncerrarBatalha={finalizarBatalha} />}

                {/* TELA 5: EPILOGO DA CAMPANHA */}
                {telaAtual === "EPILOGO" &&
                    (() => {
                        let venceu = estadoJogo.statusBatalha === "VITORIA";
                        let acertosEpilogo = estadoJogo.acertosQuiz;

                        if (configDev.ativo && configDev.finalForcado !== "AUTO") {
                            if (configDev.finalForcado === "LENDA") {
                                venceu = true;
                                acertosEpilogo = 10;
                            } else if (configDev.finalForcado === "CUSTEADA") {
                                venceu = true;
                                acertosEpilogo = 6;
                            } else if (configDev.finalForcado === "DESESPERADO") {
                                venceu = true;
                                acertosEpilogo = 2;
                            } else if (configDev.finalForcado === "RETIRADA") {
                                venceu = false;
                                acertosEpilogo = 0;
                            }
                        }

                        const epilogo = determinarEpilogo(venceu, acertosEpilogo);
                        const pontoBonus = venceu ? 1 : 0;
                        const notaFinal = acertosEpilogo + pontoBonus;

                        return (
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch max-w-5xl mx-auto w-full">
                                <div className={`lg:col-span-6 relative rounded-xl border-2 ${epilogo.borda} bg-gradient-to-b ${epilogo.tema} overflow-hidden shadow-2xl flex flex-col justify-between text-center`}>
                                    <div className="relative h-40 sm:h-48 w-full border-b border-amber-500/30">
                                        <CenarioPixelArt tipo={epilogo.cenarioId} />
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#14110e] via-transparent to-transparent" />
                                        <div className="absolute bottom-2 inset-x-0 text-4xl drop-shadow-lg">{epilogo.icone}</div>
                                    </div>

                                    <div className="p-5 space-y-2">
                                        <span className="inline-block text-[11px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/35">Epílogo da Campanha</span>
                                        <h2 className="font-dnd-title text-xl sm:text-2xl font-black text-amber-50">{epilogo.titulo}</h2>
                                        <p className="text-xs font-bold text-amber-300">{epilogo.subtitulo}</p>
                                        <p className="font-dnd-lore text-sm sm:text-base text-stone-200 leading-relaxed">“{epilogo.texto}”</p>
                                    </div>
                                </div>

                                <MolduraDnD className="lg:col-span-6 p-5 flex flex-col justify-between gap-4">
                                    <div className="space-y-4">
                                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-600/25 pb-2.5">
                                            <div>
                                                <h3 className="font-dnd-title font-extrabold text-sm sm:text-base text-amber-100 flex items-center gap-2">
                                                    <Trophy className="w-4 h-4 text-amber-400" />
                                                    Crônica Final do Guardião
                                                </h3>
                                                <p className="text-xs text-stone-400">
                                                    {estadoJogo.jogador.nome} • {estadoJogo.jogador.turma}
                                                </p>
                                            </div>

                                            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${configDev.ativo ? "bg-fuchsia-950/80 text-fuchsia-300 border-fuchsia-400/50" : statusSalvamento?.modoProducao ? "bg-emerald-950/70 text-emerald-300 border-emerald-500/40" : "bg-amber-950/60 text-amber-300 border-amber-500/40"}`}>{configDev.ativo ? "🛠️ Modo Dev (Não Registrado)" : statusSalvamento?.modoProducao ? "🟢 Salvo na Planilha!" : "🟡 Modo Teste"}</span>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2.5 text-center">
                                            <div className="p-3 rounded-lg bg-[#0d0a08] border border-amber-600/25">
                                                <span className="text-[11px] text-stone-400 block">Enigmas (Quiz)</span>
                                                <strong className="font-dnd-title text-lg sm:text-xl font-black text-sky-400">{acertosEpilogo}/10</strong>
                                            </div>

                                            <div className="p-3 rounded-lg bg-[#0d0a08] border border-amber-600/25">
                                                <span className="text-[11px] text-stone-400 block">Bônus Dragão</span>
                                                <strong className={`font-dnd-title text-lg sm:text-xl font-black ${venceu ? "text-emerald-400" : "text-stone-500"}`}>+{pontoBonus} pt</strong>
                                            </div>

                                            <div className="p-3 rounded-lg bg-[#0d0a08] border border-amber-400/55">
                                                <span className="text-[11px] text-amber-300 block">Nota Final</span>
                                                <strong className="font-dnd-title text-lg sm:text-xl font-black text-amber-400">{notaFinal} pts</strong>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Registro dos 10 Capítulos:</span>
                                            <div className="grid grid-cols-5 gap-1.5">
                                                {historicoRespostas.map((resp) => (
                                                    <div key={resp.etapa} title={`Etapa ${resp.etapa}: ${resp.tema} (${resp.acertou ? "Acertou" : "Errou"})`} className={`py-1.5 rounded text-center text-xs font-extrabold border ${resp.acertou ? "bg-emerald-950/60 border-emerald-500/50 text-emerald-300" : "bg-rose-950/60 border-rose-500/40 text-rose-300"}`}>
                                                        Q{resp.etapa}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                                        <button type="button" onClick={reiniciarParaInicio} className="flex-1 py-3 px-4 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-stone-950 font-dnd-title font-black text-sm border border-amber-300/60 shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer">
                                            <RotateCcw className="w-4 h-4" />
                                            <span>Nova Campanha</span>
                                        </button>

                                        {!configDev.ativo && (
                                            <button type="button" onClick={() => baixarComprovanteCsv(estadoJogo)} className="py-3 px-4 rounded-lg bg-[#221b15] hover:bg-[#2d231b] text-amber-100 font-bold text-xs sm:text-sm border border-amber-600/35 transition-all flex items-center justify-center gap-2 cursor-pointer">
                                                <Download className="w-4 h-4 text-amber-400" />
                                                <span>Baixar Ficha (.CSV)</span>
                                            </button>
                                        )}
                                    </div>
                                </MolduraDnD>
                            </div>
                        );
                    })()}
            </main>
        </div>
    );
}
