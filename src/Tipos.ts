export type TelaJogo = "LOGIN" | "QUIZ" | "TRANSICAO_ARENA" | "COMBATE" | "EPILOGO";

export type TipoSom = "acerto" | "erro" | "ataque" | "cura" | "vitoria";

export type DirecaoSprite = "frente" | "costas";

export type TipoLutaDev = "AUTO" | "FACIL" | "MEDIO" | "DIFICIL";

export type FinalForcadoDev = "AUTO" | "LENDA" | "CUSTEADA" | "DESESPERADO" | "RETIRADA";

export interface ConfigDev {
    ativo: boolean;
    tipoLuta: TipoLutaDev;
    finalForcado: FinalForcadoDev;
    forcarHypatia: boolean;
    equipamentoCompleto: boolean;
}

export type TipoCenario = "forja" | "portao_cidade" | "oficina" | "alquimista" | "mercado" | "ruinas" | "observatorio" | "pico_dragao" | "arena_batalha" | "epilogo_lenda" | "epilogo_custeada" | "epilogo_desesperado" | "epilogo_retirada";

export interface Questao {
    id: string;
    bloco: 1 | 2 | 3 | 4;
    tema: string;
    enunciado: string;
    alternativas: string[];
    correta: number;
    justificativa: string;
}

export interface RecompensaEtapa {
    id: string;
    nome: string;
    tipo: "PASSIVO" | "CONSUMIVEL" | "RELIQUIA";
    descricao: string;
    icone: string;
    quantidade?: number;
    efeito?: "CURA" | "DANO" | "CURA_PERCENTUAL";
    valor?: number;
    reliquiaIndex?: number;
}

export interface EtapaRoteiro {
    etapa: number;
    capitulo: string;
    local: string;
    cenario: TipoCenario;
    npcNome: string;
    npcCargo: string;
    fala: string;
    recompensa: RecompensaEtapa;
}

export interface ItemInventario {
    id: string;
    nome: string;
    quantidade: number;
    efeito: "CURA" | "DANO" | "CURA_PERCENTUAL";
    valor: number;
    icone: string;
    descricao: string;
}

export interface EstadoJogo {
    jogador: {
        nome: string;
        turma: string;
    };
    hpAtual: number;
    hpMaximo: number;
    ataqueBase: number;
    defesa: number;
    chanceCritico: number;
    acertosQuiz: number;
    equipamentos: string[];
    inventario: ItemInventario[];
    reliquiasColetadas: number[];
    magoPresente: boolean;
    statusBatalha: "EM_ANDAMENTO" | "VITORIA" | "DERROTA";
}

export interface EstadoDragao {
    nivel: string;
    corBadge: string;
    descricao: string;
    hpAtual: number;
    hpMaximo: number;
    ataqueBase: number;
}

export interface RegistroResposta {
    etapa: number;
    tema: string;
    acertou: boolean;
}

export interface ResultadoSalvamento {
    sucesso: boolean;
    modoProducao: boolean;
    mensagem: string;
}

export interface EpilogoInfo {
    cenarioId: TipoCenario;
    icone: string;
    titulo: string;
    subtitulo: string;
    texto: string;
    tema: string;
    borda: string;
}
