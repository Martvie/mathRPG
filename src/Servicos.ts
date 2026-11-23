import { EpilogoInfo, EstadoDragao, EstadoJogo, ResultadoSalvamento, TipoSom } from "./Tipos";

export function calcularAtributosDragao(acertos: number): EstadoDragao {
    if (acertos >= 8) {
        return {
            nivel: "Guardião Ancestral • Carapaça Titânica",
            corBadge: "bg-emerald-950/80 text-emerald-300 border-emerald-500/50",
            descricao: "Os selos enfraqueceram parte das chamas de Cógon, mas sua carapaça colosal (420 PV) e golpes brutais (42 ATQ) exigem reflexos rápidos no escudo.",
            hpAtual: 420,
            hpMaximo: 420,
            ataqueBase: 42,
        };
    }

    if (acertos >= 5) {
        return {
            nivel: "Fúria Desperta • Dragão das Escalas",
            corBadge: "bg-amber-950/80 text-amber-300 border-amber-500/50",
            descricao: "Cógon conserva grande vigor (310 PV / 34 ATQ). Resolva a tabuada em 5s para erguer o escudo e poupe suas poções para os sopros de fogo.",
            hpAtual: 310,
            hpMaximo: 310,
            ataqueBase: 34,
        };
    }

    return {
        nivel: "Ira Primordial • Soberano Implacável",
        corBadge: "bg-rose-950/80 text-rose-300 border-rose-500/50",
        descricao: "Quase todos os selos permaneceram intactos! Sem armadura completa nem aliados, cada erro na tabuada de 5s pode ser fatal.",
        hpAtual: 230,
        hpMaximo: 230,
        ataqueBase: 30,
    };
}

export function determinarEpilogo(venceu: boolean, acertos: number): EpilogoInfo {
    if (!venceu) {
        return {
            cenarioId: "epilogo_retirada",
            icone: "📜",
            titulo: "Retirada Estratégica ao Vale",
            subtitulo: "Cógon permaneceu no Pico Octogonal, mas o aprendizado continua.",
            texto: "As chamas de Cógon forçaram seu recuo até as muralhas de Poliedra. Revisar as razões das progressões será a chave para voltar mais forte!",
            tema: "from-stone-900 via-slate-900 to-[#14110e]",
            borda: "border-slate-500/50",
        };
    }

    if (acertos >= 8) {
        return {
            cenarioId: "epilogo_lenda",
            icone: "👑",
            titulo: "Lenda Suprema da Távola Octogonal",
            subtitulo: "Vitória Gloriosa • Domínio Mestre de PA e PG",
            texto: "Com precisão matemática impecável e reflexos rápidos no escudo, você e seus aliados subjugaram Cógon e restauraram a paz em Poliedra!",
            tema: "from-amber-950 via-yellow-950/80 to-[#14110e]",
            borda: "border-amber-400/70",
        };
    }

    if (acertos >= 5) {
        return {
            cenarioId: "epilogo_custeada",
            icone: "⚔️",
            titulo: "Vitória Custeada nas Alturas",
            subtitulo: "Triunfo Honroso • Estratégia e Reflexo",
            texto: "Após uma batalha árdua no Pico Octogonal, sua tática e agilidade mental prevaleceram sobre a fúria do dragão. Poliedra celebra seu defensor!",
            tema: "from-sky-950 via-indigo-950/80 to-[#14110e]",
            borda: "border-sky-400/60",
        };
    }

    return {
        cenarioId: "epilogo_desesperado",
        icone: "🛡️",
        titulo: "Triunfo Desesperado por um Fio",
        subtitulo: "Sobrevivência Heroica • Reflexos Impecáveis",
        texto: "Mesmo com poucos artefatos forjados, você ergueu o escudo no instante exato em cada investida de Cógon e conquistou uma vitória histórica!",
        tema: "from-rose-950 via-orange-950/80 to-[#14110e]",
        borda: "border-orange-400/60",
    };
}

export function tocarEfeitoSonoro(tipo: TipoSom, ativo: boolean) {
    if (!ativo || typeof window === "undefined") return;

    try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return;

        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        const agora = ctx.currentTime;

        if (tipo === "acerto") {
            osc.type = "triangle";
            osc.frequency.setValueAtTime(523.25, agora);
            osc.frequency.setValueAtTime(659.25, agora + 0.08);
            gain.gain.setValueAtTime(0.12, agora);
            gain.gain.exponentialRampToValueAtTime(0.001, agora + 0.25);
            osc.start(agora);
            osc.stop(agora + 0.25);
        } else if (tipo === "erro") {
            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(210, agora);
            osc.frequency.linearRampToValueAtTime(140, agora + 0.25);
            gain.gain.setValueAtTime(0.1, agora);
            gain.gain.exponentialRampToValueAtTime(0.001, agora + 0.28);
            osc.start(agora);
            osc.stop(agora + 0.28);
        } else if (tipo === "ataque") {
            osc.type = "square";
            osc.frequency.setValueAtTime(180, agora);
            osc.frequency.exponentialRampToValueAtTime(65, agora + 0.18);
            gain.gain.setValueAtTime(0.12, agora);
            gain.gain.exponentialRampToValueAtTime(0.001, agora + 0.2);
            osc.start(agora);
            osc.stop(agora + 0.2);
        } else if (tipo === "cura") {
            osc.type = "sine";
            osc.frequency.setValueAtTime(440, agora);
            osc.frequency.exponentialRampToValueAtTime(880, agora + 0.28);
            gain.gain.setValueAtTime(0.12, agora);
            gain.gain.exponentialRampToValueAtTime(0.001, agora + 0.3);
            osc.start(agora);
            osc.stop(agora + 0.3);
        } else if (tipo === "vitoria") {
            osc.type = "triangle";
            osc.frequency.setValueAtTime(523.25, agora);
            osc.frequency.setValueAtTime(659.25, agora + 0.1);
            osc.frequency.setValueAtTime(783.99, agora + 0.2);
            osc.frequency.setValueAtTime(1046.5, agora + 0.32);
            gain.gain.setValueAtTime(0.14, agora);
            gain.gain.exponentialRampToValueAtTime(0.001, agora + 0.6);
            osc.start(agora);
            osc.stop(agora + 0.6);
        }
    } catch {
        // Ignora bloqueio de autoplay de audio do navegador
    }
}

export function baixarComprovanteCsv(estadoJogo: EstadoJogo) {
    const venceu = estadoJogo.statusBatalha === "VITORIA";
    const bonus = venceu ? 1 : 0;
    const notaFinal = estadoJogo.acertosQuiz + bonus;

    const linhas = [
        ["Jogador", "Turma", "Acertos Quiz", "Derrotou Dragao", "Bonus", "Nota Final", "Data"],
        [`"${estadoJogo.jogador.nome}"`, `"${estadoJogo.jogador.turma}"`, String(estadoJogo.acertosQuiz), venceu ? "Sim" : "Nao", String(bonus), String(notaFinal), `"${new Date().toLocaleString("pt-BR")}"`],
    ];
    const conteudo = linhas.map((l) => l.join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + conteudo], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ficha_poliedra_${estadoJogo.jogador.nome.replace(/\s+/g, "_").toLowerCase()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

interface PayloadPontuacao {
    nomeAluno: string;
    turma: string;
    acertosQuiz: number;
    derrotouDragao: string;
    pontoBonus: number;
    notaFinal: number;
    dataHora: string;
}

export const SheetsApi = {
    async carregarTurmas(): Promise<{
        turmas: string[];
        temTurmas: boolean;
        modoProducao: boolean;
    }> {
        const urlBase = import.meta.env.VITE_GOOGLE_SHEETS_URL as string | undefined;
        if (!urlBase || !urlBase.trim()) {
            return { turmas: [], temTurmas: false, modoProducao: false };
        }

        try {
            const separador = urlBase.includes("?") ? "&" : "?";
            const resposta = await fetch(`${urlBase}${separador}action=getTurmas`);
            if (!resposta.ok) {
                return { turmas: [], temTurmas: false, modoProducao: true };
            }

            const dados = await resposta.json();
            const lista = Array.isArray(dados) ? dados : Array.isArray(dados?.turmas) ? dados.turmas : [];

            const turmasLimpas = lista.map((t: unknown) => String(t).trim()).filter(Boolean);
            return {
                turmas: turmasLimpas,
                temTurmas: turmasLimpas.length > 0,
                modoProducao: true,
            };
        } catch {
            return { turmas: [], temTurmas: false, modoProducao: false };
        }
    },

    async salvarPontuacaoFinal(payload: PayloadPontuacao, enviarParaPlanilha: boolean): Promise<ResultadoSalvamento> {
        const urlBase = import.meta.env.VITE_GOOGLE_SHEETS_URL as string | undefined;
        if (!enviarParaPlanilha || !urlBase || !urlBase.trim()) {
            return {
                sucesso: true,
                modoProducao: false,
                mensagem: "Partida concluída em Modo Teste local.",
            };
        }

        try {
            await fetch(urlBase, {
                method: "POST",
                mode: "no-cors",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            return {
                sucesso: true,
                modoProducao: true,
                mensagem: "Pontuação registrada na planilha da guilda!",
            };
        } catch {
            return {
                sucesso: false,
                modoProducao: false,
                mensagem: "Não foi possível conectar à planilha. Baixe o comprovante CSV.",
            };
        }
    },
};
