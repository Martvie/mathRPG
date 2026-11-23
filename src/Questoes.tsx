import { BookOpen, Calculator, CheckCircle2, ChevronRight, Compass, XCircle, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CenarioPixelArt, HeroSprite, HypatiaSprite, MolduraDnD } from "./Graficos";
import { tocarEfeitoSonoro } from "./Servicos";
import { EstadoJogo, EtapaRoteiro, Questao } from "./Tipos";

export const BANCO_QUESTOES: Questao[] = [
    // --- BLOCO 1: A Armaria de Poliedra (Capitulo I) ---
    {
        id: "Q01",
        bloco: 1,
        tema: "PA • Identificação de Razão",
        enunciado: "Qual é a razão da Progressão Aritmética (PA) dada por: (2, 7, 12, 17, 22)?",
        alternativas: ["2", "5", "7", "10"],
        correta: 1,
        justificativa: "Na PA, subtraímos um termo pelo seu antecessor: r = 7 - 2 = 5.",
    },
    {
        id: "Q02",
        bloco: 1,
        tema: "Identificação • PA vs PG",
        enunciado: "Dada a sequência numérica (3, 6, 12, 24, 48), podemos classificá-la como:",
        alternativas: ["Uma PA de razão 3", "Uma PA de razão 2", "Uma PG de razão 2", "Uma PG de razão 3"],
        correta: 2,
        justificativa: "Cada termo é multiplicado por 2 para obter o próximo (6 ÷ 3 = 2), logo é uma PG de razão q = 2.",
    },
    {
        id: "Q03",
        bloco: 1,
        tema: "PA • Sequência Constante",
        enunciado: "Analise a sequência de escudos da guarda: (3, 3, 3, 3, 3). É correto afirmar que:",
        alternativas: ["Não é uma progressão matemática.", "É uma PA constante de razão r = 0.", "É uma PA de razão r = 3.", "É uma PG de razão q = 0."],
        correta: 1,
        justificativa: "Quando todos os termos são iguais, a diferença entre eles é zero (3 - 3 = 0), formando uma PA constante.",
    },
    {
        id: "Q04",
        bloco: 1,
        tema: "PG • Identificação de Razão",
        enunciado: "Qual é a razão da Progressão Geométrica (PG): (5, 15, 45, 135)?",
        alternativas: ["3", "5", "10", "15"],
        correta: 0,
        justificativa: "Dividindo o segundo termo pelo primeiro, encontramos q = 15 ÷ 5 = 3.",
    },
    {
        id: "Q05",
        bloco: 1,
        tema: "Classificação de Sequências",
        enunciado: "Qual das sequências abaixo NÃO é uma Progressão Aritmética (PA)?",
        alternativas: ["(1, 4, 7, 10)", "(10, 8, 6, 4)", "(2, 4, 8, 16)", "(0, 5, 10, 15)"],
        correta: 2,
        justificativa: "A sequência (2, 4, 8, 16) cresce multiplicando por 2 a cada passo, portanto é uma PG e não uma PA.",
    },
    {
        id: "Q06",
        bloco: 1,
        tema: "PA • Razão Decrescente",
        enunciado: "Qual é a razão da PA decrescente: (20, 16, 12, 8, 4)?",
        alternativas: ["4", "-4", "5", "-5"],
        correta: 1,
        justificativa: "Como a PA é decrescente, fazemos a₂ - a₁ = 16 - 20 = -4.",
    },

    // --- BLOCO 2: Os Suprimentos do Alquimista (Capitulo II) ---
    {
        id: "Q07",
        bloco: 2,
        tema: "PA • Termo Geral",
        enunciado: "Numa PA de primeiro termo a₁ = 4 e razão r = 3, qual é o valor do 6º termo (a₆)?",
        alternativas: ["16", "18", "19", "22"],
        correta: 2,
        justificativa: "Pela fórmula do termo geral: a₆ = a₁ + 5·r = 4 + 5 × 3 = 4 + 15 = 19.",
    },
    {
        id: "Q08",
        bloco: 2,
        tema: "PG • Razão Alternada",
        enunciado: "Qual é a razão da PG: (2, -6, 18, -54)?",
        alternativas: ["3", "-3", "-4", "6"],
        correta: 1,
        justificativa: "Dividindo o segundo termo pelo primeiro: q = (-6) ÷ 2 = -3.",
    },
    {
        id: "Q09",
        bloco: 2,
        tema: "PA • Próximo Termo",
        enunciado: "Qual é o próximo termo da PA: (-5, -1, 3, 7, ...)?",
        alternativas: ["9", "10", "11", "12"],
        correta: 2,
        justificativa: "A razão é r = -1 - (-5) = +4. Somando 4 ao último termo: 7 + 4 = 11.",
    },
    {
        id: "Q10",
        bloco: 2,
        tema: "PG • Termo Geral",
        enunciado: "Em uma PG onde a₁ = 3 e a razão q = 2, qual é o valor do 5º termo (a₅)?",
        alternativas: ["24", "30", "48", "96"],
        correta: 2,
        justificativa: "Usando a₅ = a₁ · q⁴ = 3 × 2⁴ = 3 × 16 = 48.",
    },
    {
        id: "Q11",
        bloco: 2,
        tema: "PG • Constante (Razão 1)",
        enunciado: "A sequência (7, 7, 7, 7) pode ser considerada uma PG. Qual é a sua razão q?",
        alternativas: ["q = 0", "q = 1", "q = 7", "Não é possível ser uma PG"],
        correta: 1,
        justificativa: "Todo número multiplicado por 1 permanece igual (7 × 1 = 7), logo q = 1.",
    },
    {
        id: "Q12",
        bloco: 2,
        tema: "PA • Problema Aplicado",
        enunciado: "O herói ganha 5 moedas no 1º dia de jornada e, a cada dia seguinte, ganha 3 moedas a mais que no dia anterior. Quantas moedas ele ganhará no 4º dia?",
        alternativas: ["11", "14", "17", "20"],
        correta: 1,
        justificativa: "Dia 1: 5 | Dia 2: 8 | Dia 3: 11 | Dia 4: 14 moedas (a₄ = 5 + 3 × 3 = 14).",
    },

    // --- BLOCO 3: O Mago Hypatio (Capitulo III) ---
    {
        id: "Q13",
        bloco: 3,
        tema: "PA • Descobrir a Razão",
        enunciado: "Em uma PA, o 1º termo é a₁ = 2 e o 10º termo é a₁₀ = 29. Qual é a razão r?",
        alternativas: ["2", "3", "4", "5"],
        correta: 1,
        justificativa: "a₁₀ = a₁ + 9r ⇒ 29 = 2 + 9r ⇒ 27 = 9r ⇒ r = 3.",
    },
    {
        id: "Q14",
        bloco: 3,
        tema: "PG • Termo Médio",
        enunciado: "Em uma PG de termos positivos (4, x, 36), qual é o valor do termo central x?",
        alternativas: ["12", "16", "18", "20"],
        correta: 0,
        justificativa: "Na PG, o quadrado do termo médio é igual ao produto dos vizinhos: x² = 4 × 36 = 144 ⇒ x = 12.",
    },
    {
        id: "Q15",
        bloco: 3,
        tema: "PA • Número de Termos",
        enunciado: "Quantos termos possui a PA finita: (3, 7, 11, ..., 35)?",
        alternativas: ["7", "8", "9", "10"],
        correta: 2,
        justificativa: "Temos a₁ = 3, r = 4 e aₙ = 35. Então 35 = 3 + (n - 1)·4 ⇒ 32 = 4(n - 1) ⇒ n - 1 = 8 ⇒ n = 9 termos.",
    },
    {
        id: "Q16",
        bloco: 3,
        tema: "PG • Cálculo de Termo",
        enunciado: "Numa PG de razão q = 3, o primeiro termo é a₁ = 2. Qual é o valor do 4º termo (a₄)?",
        alternativas: ["18", "36", "54", "162"],
        correta: 2,
        justificativa: "a₄ = a₁ · q³ = 2 × 3³ = 2 × 27 = 54.",
    },
    {
        id: "Q17",
        bloco: 3,
        tema: "PA • Termos Negativos",
        enunciado: "O 1º termo de uma PA é -10 e a razão é r = 4. Qual é o valor do 6º termo (a₆)?",
        alternativas: ["6", "10", "14", "20"],
        correta: 1,
        justificativa: "a₆ = -10 + 5 × 4 = -10 + 20 = 10.",
    },
    {
        id: "Q18",
        bloco: 3,
        tema: "PG • Razão Fracionária",
        enunciado: "Qual é a razão da PG decrescente: (100, 50, 25, 12.5)?",
        alternativas: ["2", "-2", "0,5 (ou 1/2)", "0,25"],
        correta: 2,
        justificativa: "Cada termo é metade do anterior: q = 50 ÷ 100 = 0,5 (ou 1/2).",
    },

    // --- BLOCO 4: O Portao de Cogon (Capitulo IV) ---
    {
        id: "Q19",
        bloco: 4,
        tema: "PA • Soma dos Termos",
        enunciado: "Para quebrar o lacre do portão, o herói deve calcular a soma dos 5 primeiros termos da PA: (2, 5, 8, 11, 14). Qual é o resultado?",
        alternativas: ["35", "40", "45", "50"],
        correta: 1,
        justificativa: "Somando os termos: 2 + 5 + 8 + 11 + 14 = 40 (ou S₅ = (2 + 14) × 5 ÷ 2 = 40).",
    },
    {
        id: "Q20",
        bloco: 4,
        tema: "PG • Soma dos Termos",
        enunciado: "O último encanto exige a soma dos 4 primeiros termos da PG: (1, 2, 4, 8). Qual é o resultado?",
        alternativas: ["14", "15", "16", "31"],
        correta: 1,
        justificativa: "Somando os 4 primeiros termos: 1 + 2 + 4 + 8 = 15.",
    },
];

export const ROTEIRO_ETAPAS: EtapaRoteiro[] = [
    {
        etapa: 1,
        capitulo: "Ato I • A Armaria de Poliedra",
        local: "A Forja Hexagonal",
        cenario: "forja",
        npcNome: "Mestre Ferreiro Kael",
        npcCargo: "Forjador da Coroa",
        fala: "Cógon despertou no Pico Octogonal! Para perfurar suas escamas rígidas, temperei esta lâmina geométrica. Decifre o enigma da forja e ela será sua!",
        recompensa: {
            id: "espada_angulo",
            nome: "Espada de Ângulo Afiado",
            tipo: "PASSIVO",
            descricao: "+12 de Ataque (FOR) permanente em todos os golpes.",
            icone: "⚔️",
        },
    },
    {
        etapa: 2,
        capitulo: "Ato I • A Armaria de Poliedra",
        local: "Vale do Reino • Portões de Poliedra",
        cenario: "portao_cidade",
        npcNome: "Capitã Lyra",
        npcCargo: "Comandante da Muralha",
        fala: "Nenhuma lâmina basta sem proteção! Os sentinelas de Poliedra confiam o Escudo Poligonal apenas a quem domina o ritmo das progressões.",
        recompensa: {
            id: "escudo_poligonal",
            nome: "Escudo Poligonal",
            tipo: "PASSIVO",
            descricao: "+25 de PV Máximo e +4 de Classe de Armadura (CA).",
            icone: "🛡️",
        },
    },
    {
        etapa: 3,
        capitulo: "Ato I • A Armaria de Poliedra",
        local: "Oficina da Liga Numérica",
        cenario: "oficina",
        npcNome: "Artesão Euler",
        npcCargo: "Mestre Armeiro",
        fala: "Forjei uma couraça entrelaçada em proporções exatas. Prove seu raciocínio e vista a Armadura de Liga Numérica antes de cruzar os portões!",
        recompensa: {
            id: "armadura_numerica",
            nome: "Armadura de Liga Numérica",
            tipo: "PASSIVO",
            descricao: "+6 de Classe de Armadura (reduz o dano de Cógon).",
            icone: "🦺",
        },
    },
    {
        etapa: 4,
        capitulo: "Ato II • Suprimentos e Artefatos",
        local: "Laboratório do Alquimista",
        cenario: "alquimista",
        npcNome: "Alquimista Meridian",
        npcCargo: "Sábio das Curvas",
        fala: "A escalada até o pico cobra seu preço. Destilei dois frascos de néctar vital, mas preciso estabilizar a razão da fórmula!",
        recompensa: {
            id: "pocao_vitalidade",
            nome: "2x Poção de Vitalidade",
            tipo: "CONSUMIVEL",
            quantidade: 2,
            efeito: "CURA",
            valor: 45,
            descricao: "Restaura +45 PV na batalha (consome 1 ação de turno).",
            icone: "🧪",
        },
    },
    {
        etapa: 5,
        capitulo: "Ato II • Suprimentos e Artefatos",
        local: "O Mercado de Esferas",
        cenario: "mercado",
        npcNome: "Mercador Vektor",
        npcCargo: "Comerciante de Relíquias",
        fala: "Psiu, viajante! Guardo um engenho alquímico capaz de rachar escamas de dragão. Resolva este cálculo e leve a Bomba de Matriz!",
        recompensa: {
            id: "bomba_matriz",
            nome: "Bomba de Matriz",
            tipo: "CONSUMIVEL",
            quantidade: 1,
            efeito: "DANO",
            valor: 45,
            descricao: "Explosão arcana que causa 45 de dano direto em Cógon.",
            icone: "💣",
        },
    },
    {
        etapa: 6,
        capitulo: "Ato II • Suprimentos e Artefatos",
        local: "Ruínas dos Antigos",
        cenario: "ruinas",
        npcNome: "Inscrição Rúnica",
        npcCargo: "Monólito Ancestral",
        fala: "Nas pedras tomadas pelo musgo brilha um selo arcano. Apenas quem compreender a sequência libertará o Pergaminho de Feitiço Arcano.",
        recompensa: {
            id: "pergaminho_arcano",
            nome: "Pergaminho de Feitiço Arcano",
            tipo: "CONSUMIVEL",
            quantidade: 1,
            efeito: "DANO",
            valor: 55,
            descricao: "Conjura um raio rúnico causando 55 de dano mágico.",
            icone: "📜",
        },
    },
    {
        etapa: 7,
        capitulo: "Ato III • O Pacto de Hypatia",
        local: "Torre do Observatório — Relíquia 1/3",
        cenario: "observatorio",
        npcNome: "Maga Hypatia",
        npcCargo: "Arquimaga da Corte",
        fala: "Saudações, guardião! Só marcharei ao seu lado contra Cógon se reunirmos as 3 Relíquias do Ritual. Primeiro, liberte o Amuleto do Vértice!",
        recompensa: {
            id: "reliquia_amuleto",
            nome: "Amuleto do Vértice (Relíquia 1/3)",
            tipo: "RELIQUIA",
            reliquiaIndex: 1,
            descricao: "Peça do ritual de Hypatia. Se usado solo, concede +5 CA.",
            icone: "🧿",
        },
    },
    {
        etapa: 8,
        capitulo: "Ato III • O Pacto de Hypatia",
        local: "Câmara dos Cristais — Relíquia 2/3",
        cenario: "observatorio",
        npcNome: "Maga Hypatia",
        npcCargo: "Arquimaga da Corte",
        fala: "Mente afiada! Agora concentre-se na segunda peça do ritual: a Gema do Prisma Brilhante, onde a luz se multiplica em progressão!",
        recompensa: {
            id: "reliquia_gema",
            nome: "Gema do Prisma Brilhante (Relíquia 2/3)",
            tipo: "RELIQUIA",
            reliquiaIndex: 2,
            descricao: "Peça do ritual de Hypatia. Se usada solo, dispara 50 de dano.",
            icone: "💎",
        },
    },
    {
        etapa: 9,
        capitulo: "Ato III • O Pacto de Hypatia",
        local: "Altar da Constante — Relíquia 3/3",
        cenario: "observatorio",
        npcNome: "Maga Hypatia",
        npcCargo: "Arquimaga da Corte",
        fala: "Esta é a prova derradeira do nosso pacto! Conquiste o Elixir da Constante e provaremos se estou pronta para entrar na arena com você!",
        recompensa: {
            id: "reliquia_elixir",
            nome: "Elixir da Constante (Relíquia 3/3)",
            tipo: "RELIQUIA",
            reliquiaIndex: 3,
            descricao: "Peça do ritual de Hypatia. Se usado solo, cura 60% dos PV.",
            icone: "⚗️",
        },
    },
    {
        etapa: 10,
        capitulo: "Ato IV • O Santuário do Pico",
        local: "Portão de Obsidiana de Cógon",
        cenario: "pico_dragao",
        npcNome: "Guardião do Selo",
        npcCargo: "Sentinela da Távola",
        fala: "Atrás desta porta colossal repousa Cógon, o Dragão das Escalas! Quebre o selo final para empunhar a Lança de Ouro e restaurar seu vigor!",
        recompensa: {
            id: "lanca_ouro",
            nome: "Lança de Ouro + Vigor Final",
            tipo: "PASSIVO",
            descricao: "+8 FOR, Crítico (d20) elevado para 40% e +20 PV!",
            icone: "🔱",
        },
    },
];

export function sortearQuestoesPartida(): Questao[] {
    const embaralhar = (lista: Questao[]) => {
        const copia = [...lista];
        for (let i = copia.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copia[i], copia[j]] = [copia[j], copia[i]];
        }
        return copia;
    };

    const b1 = embaralhar(BANCO_QUESTOES.filter((q) => q.bloco === 1)).slice(0, 3);
    const b2 = embaralhar(BANCO_QUESTOES.filter((q) => q.bloco === 2)).slice(0, 3);
    const b3 = embaralhar(BANCO_QUESTOES.filter((q) => q.bloco === 3)).slice(0, 3);
    const b4 = embaralhar(BANCO_QUESTOES.filter((q) => q.bloco === 4)).slice(0, 1);

    return [...b1, ...b2, ...b3, ...b4];
}

interface QuestoesProps {
    questoesPartida: Questao[];
    indiceEtapa: number;
    estadoJogo: EstadoJogo;
    somAtivo: boolean;
    modoDev?: boolean;
    onResponderEtapa: (acertou: boolean, etapaInfo: EtapaRoteiro, questao: Questao) => void;
    onAvancarEtapa: () => void;
    onPularParaArena?: () => void;
}

export default function Questoes({ questoesPartida, indiceEtapa, estadoJogo, somAtivo, modoDev = false, onResponderEtapa, onAvancarEtapa, onPularParaArena }: QuestoesProps) {
    const [alternativaSelecionada, setAlternativaSelecionada] = useState<number | null>(null);
    const [questaoRespondida, setQuestaoRespondida] = useState(false);
    const [mostrarRascunho, setMostrarRascunho] = useState(false);
    const [textoRascunho, setTextoRascunho] = useState("");
    const etapasRegistradasRef = useRef<Set<number>>(new Set());

    const questaoAtual = questoesPartida[indiceEtapa];
    const etapaAtual = ROTEIRO_ETAPAS[indiceEtapa];

    useEffect(() => {
        etapasRegistradasRef.current = new Set();
    }, [questoesPartida]);

    useEffect(() => {
        if (!modoDev || !questaoAtual || !etapaAtual) return;

        setAlternativaSelecionada(questaoAtual.correta);
        setQuestaoRespondida(true);

        if (!etapasRegistradasRef.current.has(indiceEtapa)) {
            etapasRegistradasRef.current.add(indiceEtapa);
            onResponderEtapa(true, etapaAtual, questaoAtual);
        }
    }, [modoDev, indiceEtapa, questaoAtual, etapaAtual]);

    if (!questaoAtual || !etapaAtual) return null;

    function lidarComResposta(indiceAlternativa: number) {
        if (questaoRespondida) return;

        const acertou = indiceAlternativa === questaoAtual.correta;
        setAlternativaSelecionada(indiceAlternativa);
        setQuestaoRespondida(true);
        etapasRegistradasRef.current.add(indiceEtapa);
        tocarEfeitoSonoro(acertou ? "acerto" : "erro", somAtivo);

        onResponderEtapa(acertou, etapaAtual, questaoAtual);
    }

    function lidarComProximoPasso() {
        setAlternativaSelecionada(null);
        setQuestaoRespondida(false);
        onAvancarEtapa();
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 h-full min-h-0 items-stretch">
            {/* COLUNA ESQUERDA (5 cols): Cenario 16-bits + Sprites + Dialogo NPC */}
            <MolduraDnD className="lg:col-span-5 flex flex-col justify-between overflow-hidden">
                <div className="relative flex-1 min-h-[150px] sm:min-h-[190px] w-full overflow-hidden border-b border-amber-500/35 bg-[#0c0a09]">
                    <CenarioPixelArt tipo={etapaAtual.cenario} />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#16120e] via-transparent to-black/35" />

                    <div className="absolute top-2.5 left-3 right-3 flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-[#14100c]/90 text-amber-300 border border-amber-500/45">
                            <Compass className="w-3 h-3 text-amber-400" />
                            {etapaAtual.capitulo}
                        </span>
                        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded bg-[#14100c]/90 text-amber-200 border border-amber-500/45">Etapa {etapaAtual.etapa}/10</span>
                    </div>

                    <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between pointer-events-none">
                        <div className="flex items-end gap-1">
                            <HeroSprite equipamentos={estadoJogo.equipamentos} tamanho="mini" direcao="costas" />
                            {(etapaAtual.cenario === "observatorio" || estadoJogo.reliquiasColetadas.length === 3) && <HypatiaSprite tamanho="mini" direcao={etapaAtual.cenario === "observatorio" ? "frente" : "costas"} />}
                        </div>
                        <div className="text-right bg-[#120e0b]/85 px-2.5 py-1 rounded border border-amber-500/30">
                            <p className="font-dnd-title text-xs sm:text-sm font-black text-amber-100 leading-tight">{etapaAtual.local}</p>
                        </div>
                    </div>
                </div>

                <div className="p-3.5 sm:p-4 bg-[#19140f] space-y-2.5 shrink-0">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <span className="w-8 h-8 rounded bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-lg">{etapaAtual.recompensa.icone}</span>
                            <div>
                                <p className="font-dnd-title font-bold text-amber-300 text-xs sm:text-sm leading-tight">{etapaAtual.npcNome}</p>
                                <p className="text-[10px] text-stone-400">{etapaAtual.npcCargo}</p>
                            </div>
                        </div>
                        <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-200 border border-amber-500/40 font-semibold">{etapaAtual.recompensa.nome}</span>
                    </div>

                    <p className="font-dnd-lore text-sm sm:text-base text-stone-200 leading-snug italic">“{etapaAtual.fala}”</p>
                </div>
            </MolduraDnD>

            {/* COLUNA DIREITA (7 cols): Enigma Matematico + 4 Botoes + Feedback */}
            <MolduraDnD className="lg:col-span-7 p-4 sm:p-5 flex flex-col justify-between gap-3 overflow-y-auto">
                <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-purple-950/75 text-purple-200 border border-purple-500/40">
                            <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                            {questaoAtual.tema}
                        </span>

                        <div className="flex items-center gap-2">
                            {modoDev && onPularParaArena && (
                                <button type="button" onClick={onPularParaArena} className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-fuchsia-950/80 hover:bg-fuchsia-900 border border-fuchsia-400/50 text-fuchsia-200 inline-flex items-center gap-1 transition-colors cursor-pointer">
                                    <Zap className="w-3.5 h-3.5 text-fuchsia-300" />
                                    <span>Ir Direto para Arena (10/10)</span>
                                </button>
                            )}

                            <button type="button" onClick={() => setMostrarRascunho(!mostrarRascunho)} className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-[#221b15] hover:bg-[#2d231b] border border-amber-600/35 text-amber-200 inline-flex items-center gap-1.5 transition-colors cursor-pointer">
                                <Calculator className="w-3.5 h-3.5 text-amber-400" />
                                {mostrarRascunho ? "Ocultar Fórmulas" : "Fórmulas PA/PG"}
                            </button>
                        </div>
                    </div>

                    {mostrarRascunho && (
                        <div className="p-2.5 rounded-lg bg-[#0e0b09] border border-amber-500/30 space-y-2 text-[11px]">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-stone-300">
                                <div className="p-2 rounded bg-[#18130f] border border-amber-600/25">
                                    <strong className="text-amber-300">PA:</strong> r = a₂ - a₁ | aₙ = a₁ + (n - 1)·r
                                </div>
                                <div className="p-2 rounded bg-[#18130f] border border-purple-500/25">
                                    <strong className="text-purple-300">PG:</strong> q = a₂ ÷ a₁ | aₙ = a₁ · qⁿ⁻¹
                                </div>
                            </div>
                            <input type="text" value={textoRascunho} onChange={(e) => setTextoRascunho(e.target.value)} placeholder="Rascunho rápido de cálculo..." className="w-full px-2.5 py-1.5 rounded bg-[#16120e] border border-amber-600/30 text-stone-200 focus:outline-none focus:border-amber-400" />
                        </div>
                    )}

                    <h3 className="text-sm sm:text-base lg:text-lg font-bold text-amber-50 leading-snug">{questaoAtual.enunciado}</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {questaoAtual.alternativas.map((alt, idx) => {
                            const letras = ["A", "B", "C", "D"];
                            const ehCorreta = idx === questaoAtual.correta;
                            const ehSelecionada = idx === alternativaSelecionada;

                            let estiloBotao = "bg-[#0f0c0a] hover:bg-[#1e1812] border-amber-600/30 text-stone-100";

                            if (questaoRespondida) {
                                if (ehCorreta) {
                                    estiloBotao = "bg-emerald-950/65 border-emerald-400 text-emerald-100 ring-2 ring-emerald-400/30";
                                } else if (ehSelecionada) {
                                    estiloBotao = "bg-rose-950/65 border-rose-500 text-rose-200 ring-2 ring-rose-500/30";
                                } else {
                                    estiloBotao = "bg-[#0c0908] border-stone-800 text-stone-500 opacity-60";
                                }
                            }

                            return (
                                <button key={idx} type="button" disabled={questaoRespondida} onClick={() => lidarComResposta(idx)} className={`w-full min-h-[48px] p-3 rounded-lg border-2 text-left font-semibold transition-all flex items-center gap-2.5 cursor-pointer active:scale-[0.99] ${estiloBotao}`}>
                                    <span className="font-dnd-title w-7 h-7 rounded bg-[#1d1712] border border-amber-500/45 text-amber-300 flex items-center justify-center font-black text-xs shrink-0">{letras[idx]}</span>
                                    <span className="text-xs sm:text-sm leading-snug">{alt}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {questaoRespondida ? (
                    <div className={`p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${alternativaSelecionada === questaoAtual.correta ? "bg-emerald-950/50 border-emerald-500/50" : "bg-rose-950/50 border-rose-500/50"}`}>
                        <div className="flex items-start gap-2">
                            {alternativaSelecionada === questaoAtual.correta ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
                            <div className="text-xs leading-snug">
                                <p className="font-extrabold text-amber-50">{alternativaSelecionada === questaoAtual.correta ? `${modoDev ? "[DEV] Marcada como certa! " : "Acertou! "}+${etapaAtual.recompensa.nome}` : "Resposta incorreta — sem espólio nesta etapa."}</p>
                                <p className="text-stone-300 mt-0.5">{questaoAtual.justificativa}</p>
                            </div>
                        </div>

                        <button type="button" onClick={lidarComProximoPasso} className="shrink-0 px-4 py-2.5 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-dnd-title font-black text-xs sm:text-sm shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                            <span>{indiceEtapa < 9 ? "Próxima Etapa" : "Ir para Arena"}</span>
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <div className="text-[11px] text-stone-400 border-t border-amber-600/15 pt-2 flex items-center justify-between">
                        <span>Escolha uma das 4 runas acima para responder.</span>
                        <span className="text-amber-300/80 font-semibold">{estadoJogo.jogador.nome}</span>
                    </div>
                )}
            </MolduraDnD>
        </div>
    );
}
