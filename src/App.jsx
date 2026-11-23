import {
  AlertTriangle,
  Backpack,
  BookOpen,
  Calculator,
  CheckCircle2,
  ChevronRight,
  Compass,
  Dices,
  Download,
  Flame,
  RotateCcw,
  ScrollText,
  Shield,
  Sparkles,
  Sword,
  Trophy,
  Volume2,
  VolumeX,
  XCircle
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

/**
 * ============================================================================
 * MATH RPG: A TÁVOLA OCTOGONAL E A FÚRIA DE CÓGON (EDIÇÃO D&D / GRIMÓRIO)
 * Aplicação Educacional para 1º Ano do Ensino Médio (PA e PG)
 *
 * Arquitetura Modular (Single-File React • Pronto para Auto-Hospedagem):
 * 1. CONFIG & SHEETS_API : Leitura via .env, GET dinâmico das abas e Modo Teste
 * 2. BANCO_QUESTOES      : 20 questões de PA e PG divididas nos 4 blocos narrativos
 * 3. ROTEIRO_ETAPAS      : Os 4 capítulos, NPCs, cenários e recompensas/relíquias
 * 4. MOTOR_SONORO        : Sintetizador 16-bits via Web Audio API (zero dependências)
 * 5. ENGINE_PIXEL_16BITS : Carregamento condicional (/assets/images/) + Canvas 16-bits
 * 6. COMPONENTE APP      : Controlador principal de estado (gameState) e telas D&D
 * ============================================================================
 */

// ============================================================================
// 1. CONFIGURAÇÃO VIA .ENV E MÓDULO ISOLADO DE INTEGRAÇÃO (sheetsApi)
// ============================================================================

/**
 * Lê a URL do Web App do Google Apps Script a partir das variáveis de ambiente (.env).
 * Suporta Vite (VITE_GOOGLE_SHEETS_URL) e Create React App (REACT_APP_GOOGLE_SHEETS_URL).
 * @returns {string}
 */
function obterUrlPlanilhaEnv() {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_SHEETS_URL) {
      return import.meta.env.VITE_GOOGLE_SHEETS_URL;
    }
  } catch (e) {
    // Ignora caso import.meta não exista no ambiente
  }

  try {
    if (typeof process !== 'undefined' && process.env?.REACT_APP_GOOGLE_SHEETS_URL) {
      return process.env.REACT_APP_GOOGLE_SHEETS_URL;
    }
  } catch (e) {
    // Ignora caso process.env não exista no navegador
  }

  return '';
}

const CONFIG_AMBIENTE = {
  sheetsWebhookUrl: obterUrlPlanilhaEnv(),
  // Abas padrão não renomeadas do Google Sheets que devem ser ignoradas como turma
  abasIgnoradasPadrao: ['página1', 'pagina1', 'sheet1', 'folha1', 'planilha1']
};

/**
 * Módulo isolado responsável pela comunicação com o Google Sheets.
 * - Faz GET para buscar os nomes das abas inferiores (Turmas).
 * - Se não houver URL no .env ou nenhuma aba de turma criada, ativa Modo Teste
 *   e oculta o seletor de turma na tela inicial.
 */
const sheetsApi = {
  /**
   * Busca as abas inferiores da planilha via GET.
   * @returns {Promise<{turmas: string[], temTurmas: boolean, modoProducao: boolean}>}
   */
  async carregarTurmas() {
    const urlAtiva = (CONFIG_AMBIENTE.sheetsWebhookUrl || '').trim();

    if (!urlAtiva) {
      console.info('Math RPG: Variável .env não configurada. Executando em Modo Teste.');
      return {
        turmas: [],
        temTurmas: false,
        modoProducao: false
      };
    }

    try {
      const separador = urlAtiva.includes('?') ? '&' : '?';
      const response = await fetch(`${urlAtiva}${separador}action=getTurmas`, {
        method: 'GET',
        headers: { Accept: 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const dados = await response.json();
      const listaBruta = Array.isArray(dados.turmas) ? dados.turmas : [];

      // Filtra abas vazias ou abas padrão não configuradas ("Página1", "Sheet1")
      const turmasValidas = listaBruta
        .map((nome) => String(nome || '').trim())
        .filter(
          (nome) =>
            nome.length > 0 &&
            !CONFIG_AMBIENTE.abasIgnoradasPadrao.includes(nome.toLowerCase())
        );

      if (turmasValidas.length > 0) {
        return {
          turmas: turmasValidas,
          temTurmas: true,
          modoProducao: true
        };
      }

      // Planilha conectada, mas sem abas de turma nomeadas ainda -> roda como Modo Teste
      console.info('Math RPG: Nenhuma aba de turma encontrada na planilha. Ativando Modo Teste.');
      return {
        turmas: [],
        temTurmas: false,
        modoProducao: false
      };
    } catch (erro) {
      console.warn('Math RPG: Não foi possível consultar a planilha. Executando em Modo Teste:', erro);
      return {
        turmas: [],
        temTurmas: false,
        modoProducao: false
      };
    }
  },

  /**
   * Envia o resultado final do aluno via POST para a aba correspondente à turma.
   * @param {Object} registro - Dados consolidados da partida
   * @param {boolean} possuiTurmaAtiva - Indica se uma turma real foi selecionada
   * @returns {Promise<{sucesso: boolean, modoProducao: boolean, mensagem: string}>}
   */
  async salvarPontuacaoFinal(registro, possuiTurmaAtiva) {
    const urlAtiva = (CONFIG_AMBIENTE.sheetsWebhookUrl || '').trim();

    if (!urlAtiva || !possuiTurmaAtiva) {
      return {
        sucesso: true,
        modoProducao: false,
        mensagem: 'Modo Teste: Desempenho registrado localmente nesta sessão.'
      };
    }

    try {
      await fetch(urlAtiva, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registro)
      });

      return {
        sucesso: true,
        modoProducao: true,
        mensagem: 'Dados gravados com sucesso na aba da turma!'
      };
    } catch (erro) {
      console.warn('Erro ao enviar pontuação para o Google Sheets:', erro);
      return {
        sucesso: false,
        modoProducao: false,
        mensagem: 'Modo Teste (Offline): Falha ao alcançar a planilha.'
      };
    }
  }
};

// ============================================================================
// 2. BANCO DE 20 QUESTÕES OBJETIVAS (PA E PG - 1º ANO DO ENSINO MÉDIO)
// ============================================================================

const BANCO_QUESTOES = [
  // --- BLOCO 1: A Armaria de Poliedra (Capítulo I - Questões 1 a 3) ---
  {
    id: 'Q01',
    bloco: 1,
    tema: 'PA • Identificação de Razão',
    enunciado: 'Qual é a razão da Progressão Aritmética (PA) dada por: (2, 7, 12, 17, 22)?',
    alternativas: ['2', '5', '7', '10'],
    correta: 1,
    justificativa: 'Na PA, subtraímos um termo pelo seu antecessor: r = 7 - 2 = 5.'
  },
  {
    id: 'Q02',
    bloco: 1,
    tema: 'Identificação • PA vs PG',
    enunciado: 'Dada a sequência numérica (3, 6, 12, 24, 48), podemos classificá-la como:',
    alternativas: [
      'Uma PA de razão 3',
      'Uma PA de razão 2',
      'Uma PG de razão 2',
      'Uma PG de razão 3'
    ],
    correta: 2,
    justificativa: 'Cada termo é multiplicado por 2 para obter o próximo (6 ÷ 3 = 2), logo é uma PG de razão q = 2.'
  },
  {
    id: 'Q03',
    bloco: 1,
    tema: 'PA • Sequência Constante',
    enunciado: 'Analise a sequência de escudos da guarda: (3, 3, 3, 3, 3). É correto afirmar que:',
    alternativas: [
      'Não é uma progressão matemática.',
      'É uma PA constante de razão r = 0.',
      'É uma PA de razão r = 3.',
      'É uma PG de razão q = 0.'
    ],
    correta: 1,
    justificativa: 'Quando todos os termos são iguais, a diferença entre eles é zero (3 - 3 = 0), formando uma PA constante.'
  },
  {
    id: 'Q04',
    bloco: 1,
    tema: 'PG • Identificação de Razão',
    enunciado: 'Qual é a razão da Progressão Geométrica (PG): (5, 15, 45, 135)?',
    alternativas: ['3', '5', '10', '15'],
    correta: 0,
    justificativa: 'Dividindo o segundo termo pelo primeiro, encontramos q = 15 ÷ 5 = 3.'
  },
  {
    id: 'Q05',
    bloco: 1,
    tema: 'Classificação de Sequências',
    enunciado: 'Qual das sequências abaixo NÃO é uma Progressão Aritmética (PA)?',
    alternativas: [
      '(1, 4, 7, 10)',
      '(10, 8, 6, 4)',
      '(2, 4, 8, 16)',
      '(0, 5, 10, 15)'
    ],
    correta: 2,
    justificativa: 'A sequência (2, 4, 8, 16) cresce multiplicando por 2 a cada passo, portanto é uma PG e não uma PA.'
  },
  {
    id: 'Q06',
    bloco: 1,
    tema: 'PA • Razão Decrescente',
    enunciado: 'Qual é a razão da PA decrescente: (20, 16, 12, 8, 4)?',
    alternativas: ['4', '-4', '5', '-5'],
    correta: 1,
    justificativa: 'Como a PA é decrescente, fazemos a₂ - a₁ = 16 - 20 = -4.'
  },

  // --- BLOCO 2: Os Suprimentos do Alquimista (Capítulo II - Questões 4 a 6) ---
  {
    id: 'Q07',
    bloco: 2,
    tema: 'PA • Termo Geral',
    enunciado: 'Numa PA de primeiro termo a₁ = 4 e razão r = 3, qual é o valor do 6º termo (a₆)?',
    alternativas: ['16', '18', '19', '22'],
    correta: 2,
    justificativa: 'Pela fórmula do termo geral: a₆ = a₁ + 5·r = 4 + 5 × 3 = 4 + 15 = 19.'
  },
  {
    id: 'Q08',
    bloco: 2,
    tema: 'PG • Razão Alternada',
    enunciado: 'Qual é a razão da PG: (2, -6, 18, -54)?',
    alternativas: ['3', '-3', '-4', '6'],
    correta: 1,
    justificativa: 'Dividindo o segundo termo pelo primeiro: q = (-6) ÷ 2 = -3.'
  },
  {
    id: 'Q09',
    bloco: 2,
    tema: 'PA • Próximo Termo',
    enunciado: 'Qual é o próximo termo da PA: (-5, -1, 3, 7, ...)?',
    alternativas: ['9', '10', '11', '12'],
    correta: 2,
    justificativa: 'A razão é r = -1 - (-5) = +4. Somando 4 ao último termo: 7 + 4 = 11.'
  },
  {
    id: 'Q10',
    bloco: 2,
    tema: 'PG • Termo Geral',
    enunciado: 'Em uma PG onde a₁ = 3 e a razão q = 2, qual é o valor do 5º termo (a₅)?',
    alternativas: ['24', '30', '48', '96'],
    correta: 2,
    justificativa: 'Usando a₅ = a₁ · q⁴ = 3 × 2⁴ = 3 × 16 = 48.'
  },
  {
    id: 'Q11',
    bloco: 2,
    tema: 'PG • Constante (Razão 1)',
    enunciado: 'A sequência (7, 7, 7, 7) pode ser considerada uma PG. Qual é a sua razão q?',
    alternativas: ['q = 0', 'q = 1', 'q = 7', 'Não é possível ser uma PG'],
    correta: 1,
    justificativa: 'Todo número multiplicado por 1 permanece igual (7 × 1 = 7), logo q = 1.'
  },
  {
    id: 'Q12',
    bloco: 2,
    tema: 'PA • Problema Aplicado',
    enunciado: 'O herói ganha 5 moedas no 1º dia de jornada e, a cada dia seguinte, ganha 3 moedas a mais que no dia anterior. Quantas moedas ele ganhará no 4º dia?',
    alternativas: ['11', '14', '17', '20'],
    correta: 1,
    justificativa: 'Dia 1: 5 | Dia 2: 8 | Dia 3: 11 | Dia 4: 14 moedas (a₄ = 5 + 3 × 3 = 14).'
  },

  // --- BLOCO 3: O Mago Hypatio (Capítulo III - Questões 7 a 9) ---
  {
    id: 'Q13',
    bloco: 3,
    tema: 'PA • Descobrir a Razão',
    enunciado: 'Em uma PA, o 1º termo é a₁ = 2 e o 10º termo é a₁₀ = 29. Qual é a razão r?',
    alternativas: ['2', '3', '4', '5'],
    correta: 1,
    justificativa: 'a₁₀ = a₁ + 9r ⇒ 29 = 2 + 9r ⇒ 27 = 9r ⇒ r = 3.'
  },
  {
    id: 'Q14',
    bloco: 3,
    tema: 'PG • Termo Médio',
    enunciado: 'Em uma PG de termos positivos (4, x, 36), qual é o valor do termo central x?',
    alternativas: ['12', '16', '18', '20'],
    correta: 0,
    justificativa: 'Na PG, o quadrado do termo médio é igual ao produto dos vizinhos: x² = 4 × 36 = 144 ⇒ x = 12.'
  },
  {
    id: 'Q15',
    bloco: 3,
    tema: 'PA • Número de Termos',
    enunciado: 'Quantos termos possui a PA finita: (3, 7, 11, ..., 35)?',
    alternativas: ['7', '8', '9', '10'],
    correta: 2,
    justificativa: 'Temos a₁ = 3, r = 4 e aₙ = 35. Então 35 = 3 + (n - 1)·4 ⇒ 32 = 4(n - 1) ⇒ n - 1 = 8 ⇒ n = 9 termos.'
  },
  {
    id: 'Q16',
    bloco: 3,
    tema: 'PG • Cálculo de Termo',
    enunciado: 'Numa PG de razão q = 3, o primeiro termo é a₁ = 2. Qual é o valor do 4º termo (a₄)?',
    alternativas: ['18', '36', '54', '162'],
    correta: 2,
    justificativa: 'a₄ = a₁ · q³ = 2 × 3³ = 2 × 27 = 54.'
  },
  {
    id: 'Q17',
    bloco: 3,
    tema: 'PA • Termos Negativos',
    enunciado: 'O 1º termo de uma PA é -10 e a razão é r = 4. Qual é o valor do 6º termo (a₆)?',
    alternativas: ['6', '10', '14', '20'],
    correta: 1,
    justificativa: 'a₆ = -10 + 5 × 4 = -10 + 20 = 10.'
  },
  {
    id: 'Q18',
    bloco: 3,
    tema: 'PG • Razão Fracionária',
    enunciado: 'Qual é a razão da PG decrescente: (100, 50, 25, 12.5)?',
    alternativas: ['2', '-2', '0,5 (ou 1/2)', '0,25'],
    correta: 2,
    justificativa: 'Cada termo é metade do anterior: q = 50 ÷ 100 = 0,5 (ou 1/2).'
  },

  // --- BLOCO 4: O Portão de Cógon (Capítulo IV - Questão 10) ---
  {
    id: 'Q19',
    bloco: 4,
    tema: 'PA • Soma dos Termos',
    enunciado: 'Para quebrar o lacre do portão, o herói deve calcular a soma dos 5 primeiros termos da PA: (2, 5, 8, 11, 14). Qual é o resultado?',
    alternativas: ['35', '40', '45', '50'],
    correta: 1,
    justificativa: 'Somando os termos: 2 + 5 + 8 + 11 + 14 = 40 (ou S₅ = (2 + 14) × 5 ÷ 2 = 40).'
  },
  {
    id: 'Q20',
    bloco: 4,
    tema: 'PG • Soma dos Termos',
    enunciado: 'O último encanto exige a soma dos 4 primeiros termos da PG: (1, 2, 4, 8). Qual é o resultado?',
    alternativas: ['14', '15', '16', '31'],
    correta: 1,
    justificativa: 'Somando os 4 primeiros termos: 1 + 2 + 4 + 8 = 15.'
  }
];

// ============================================================================
// 3. ROTEIRO NARRATIVO DAS 10 ETAPAS (4 CAPÍTULOS DE POLIEDRA)
// ============================================================================

const ROTEIRO_ETAPAS = [
  {
    etapa: 1,
    capitulo: 'Ato I • A Armaria de Poliedra',
    local: 'A Forja Hexagonal',
    cenario: 'forja',
    npcNome: 'Mestre Ferreiro Kael',
    npcCargo: 'Forjador da Coroa',
    fala: 'Cógon despertou no Pico Octogonal! Para perfurar suas escamas rígidas, temperei esta lâmina geométrica. Decifre o enigma da forja e ela será sua!',
    recompensa: {
      id: 'espada_angulo',
      nome: 'Espada de Ângulo Afiado',
      tipo: 'PASSIVO',
      descricao: '+12 de Ataque (FOR) permanente em todos os golpes.',
      icone: '⚔️'
    }
  },
  {
    etapa: 2,
    capitulo: 'Ato I • A Armaria de Poliedra',
    local: 'Vale do Reino • Portões de Poliedra',
    cenario: 'portao_cidade',
    npcNome: 'Capitã Lyra',
    npcCargo: 'Comandante da Muralha',
    fala: 'Nenhuma lâmina basta sem proteção! Os sentinelas de Poliedra confiam o Escudo Poligonal apenas a quem domina o ritmo das progressões.',
    recompensa: {
      id: 'escudo_poligonal',
      nome: 'Escudo Poligonal',
      tipo: 'PASSIVO',
      descricao: '+25 de PV Máximo e +4 de Classe de Armadura (CA).',
      icone: '🛡️'
    }
  },
  {
    etapa: 3,
    capitulo: 'Ato I • A Armaria de Poliedra',
    local: 'Oficina da Liga Numérica',
    cenario: 'oficina',
    npcNome: 'Artesão Euler',
    npcCargo: 'Mestre Armeiro',
    fala: 'Forjei uma couraça entrelaçada em proporções exatas. Prove seu raciocínio e vista a Armadura de Liga Numérica antes de cruzar os portões!',
    recompensa: {
      id: 'armadura_numerica',
      nome: 'Armadura de Liga Numérica',
      tipo: 'PASSIVO',
      descricao: '+6 de Classe de Armadura (reduz o dano de Cógon).',
      icone: '🦺'
    }
  },
  {
    etapa: 4,
    capitulo: 'Ato II • Suprimentos e Artefatos',
    local: 'Laboratório do Alquimista',
    cenario: 'alquimista',
    npcNome: 'Alquimista Meridian',
    npcCargo: 'Sábio das Curvas',
    fala: 'A escalada até o pico cobra seu preço. Destilei dois frascos de néctar vital, mas preciso estabilizar a razão da fórmula!',
    recompensa: {
      id: 'pocao_vitalidade',
      nome: '2x Poção de Vitalidade',
      tipo: 'CONSUMIVEL',
      quantidade: 2,
      efeito: 'CURA',
      valor: 45,
      descricao: 'Restaura +45 PV na batalha (consome 1 ação de turno).',
      icone: '🧪'
    }
  },
  {
    etapa: 5,
    capitulo: 'Ato II • Suprimentos e Artefatos',
    local: 'O Mercado de Esferas',
    cenario: 'mercado',
    npcNome: 'Mercador Vektor',
    npcCargo: 'Comerciante de Relíquias',
    fala: 'Psiu, viajante! Guardo um engenho alquímico capaz de rachar escamas de dragão. Resolva este cálculo e leve a Bomba de Matriz!',
    recompensa: {
      id: 'bomba_matriz',
      nome: 'Bomba de Matriz',
      tipo: 'CONSUMIVEL',
      quantidade: 1,
      efeito: 'DANO',
      valor: 45,
      descricao: 'Explosão arcana que causa 45 de dano direto em Cógon.',
      icone: '💣'
    }
  },
  {
    etapa: 6,
    capitulo: 'Ato II • Suprimentos e Artefatos',
    local: 'Ruínas dos Antigos',
    cenario: 'ruinas',
    npcNome: 'Inscrição Rúnica',
    npcCargo: 'Monólito Ancestral',
    fala: 'Nas pedras tomadas pelo musgo brilha um selo arcano. Apenas quem compreender a sequência libertará o Pergaminho de Feitiço Arcano.',
    recompensa: {
      id: 'pergaminho_arcano',
      nome: 'Pergaminho de Feitiço Arcano',
      tipo: 'CONSUMIVEL',
      quantidade: 1,
      efeito: 'DANO',
      valor: 55,
      descricao: 'Conjura um raio rúnico causando 55 de dano mágico.',
      icone: '📜'
    }
  },
  {
    etapa: 7,
    capitulo: 'Ato III • O Pacto de Hypatia',
    local: 'Torre do Observatório — Relíquia 1/3',
    cenario: 'observatorio',
    npcNome: 'Maga Hypatia',
    npcCargo: 'Arquimaga da Corte',
    fala: 'Saudações, guardião! Só marcharei ao seu lado contra Cógon se reunirmos as 3 Relíquias do Ritual. Primeiro, liberte o Amuleto do Vértice!',
    recompensa: {
      id: 'reliquia_amuleto',
      nome: 'Amuleto do Vértice (Relíquia 1/3)',
      tipo: 'RELIQUIA',
      reliquiaIndex: 1,
      descricao: 'Peça do ritual de Hypatia. Se usado solo, concede +5 CA.',
      icone: '🧿'
    }
  },
  {
    etapa: 8,
    capitulo: 'Ato III • O Pacto de Hypatia',
    local: 'Câmara dos Cristais — Relíquia 2/3',
    cenario: 'observatorio',
    npcNome: 'Maga Hypatia',
    npcCargo: 'Arquimaga da Corte',
    fala: 'Mente afiada! Agora concentre-se na segunda peça do ritual: a Gema do Prisma Brilhante, onde a luz se multiplica em progressão!',
    recompensa: {
      id: 'reliquia_gema',
      nome: 'Gema do Prisma Brilhante (Relíquia 2/3)',
      tipo: 'RELIQUIA',
      reliquiaIndex: 2,
      descricao: 'Peça do ritual de Hypatia. Se usada solo, dispara 50 de dano.',
      icone: '💎'
    }
  },
  {
    etapa: 9,
    capitulo: 'Ato III • O Pacto de Hypatia',
    local: 'Altar da Constante — Relíquia 3/3',
    cenario: 'observatorio',
    npcNome: 'Maga Hypatia',
    npcCargo: 'Arquimaga da Corte',
    fala: 'Esta é a prova derradeira do nosso pacto! Conquiste o Elixir da Constante e provaremos se estou pronta para entrar na arena com você!',
    recompensa: {
      id: 'reliquia_elixir',
      nome: 'Elixir da Constante (Relíquia 3/3)',
      tipo: 'RELIQUIA',
      reliquiaIndex: 3,
      descricao: 'Peça do ritual de Hypatia. Se usado solo, cura 60% dos PV.',
      icone: '⚗️'
    }
  },
  {
    etapa: 10,
    capitulo: 'Ato IV • O Santuário do Pico',
    local: 'Portão de Obsidiana de Cógon',
    cenario: 'pico_dragao',
    npcNome: 'Guardião do Selo',
    npcCargo: 'Sentinela da Távola',
    fala: 'Atrás desta porta colossal repousa Cógon, o Dragão das Escalas! Quebre o selo final para empunhar a Lança de Ouro e restaurar seu vigor!',
    recompensa: {
      id: 'lanca_ouro',
      nome: 'Lança de Ouro + Vigor Final',
      tipo: 'PASSIVO',
      descricao: '+8 FOR, Crítico (d20) elevado para 40% e +20 PV!',
      icone: '🔱'
    }
  }
];

// ============================================================================
// 4. MOTOR SONORO 16-BITS & REGRAS DE BALANCEAMENTO DA CAMPANHA
// ============================================================================

/**
 * Sintetizador de efeitos sonoros 16-bits via Web Audio API (zero arquivos MP3).
 * @param {'acerto'|'erro'|'ataque'|'cura'|'vitoria'} tipo
 * @param {boolean} ativo
 */
function tocarEfeitoSonoro(tipo, ativo) {
  if (!ativo) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const agora = ctx.currentTime;
    gain.gain.setValueAtTime(0.12, agora);

    if (tipo === 'acerto') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, agora);
      osc.frequency.setValueAtTime(659.25, agora + 0.08);
      osc.frequency.setValueAtTime(783.99, agora + 0.16);
      gain.gain.exponentialRampToValueAtTime(0.001, agora + 0.34);
      osc.start(agora);
      osc.stop(agora + 0.35);
    } else if (tipo === 'erro') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, agora);
      osc.frequency.linearRampToValueAtTime(146.83, agora + 0.28);
      gain.gain.exponentialRampToValueAtTime(0.001, agora + 0.32);
      osc.start(agora);
      osc.stop(agora + 0.33);
    } else if (tipo === 'ataque') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(190, agora);
      osc.frequency.exponentialRampToValueAtTime(65, agora + 0.22);
      gain.gain.exponentialRampToValueAtTime(0.001, agora + 0.24);
      osc.start(agora);
      osc.stop(agora + 0.25);
    } else if (tipo === 'cura') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, agora);
      osc.frequency.exponentialRampToValueAtTime(880, agora + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, agora + 0.32);
      osc.start(agora);
      osc.stop(agora + 0.33);
    } else if (tipo === 'vitoria') {
      osc.type = 'triangle';
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        osc.frequency.setValueAtTime(freq, agora + idx * 0.11);
      });
      gain.gain.exponentialRampToValueAtTime(0.001, agora + 0.6);
      osc.start(agora);
      osc.stop(agora + 0.62);
    }
  } catch (e) {
    // Ignora bloqueios de autoplay do navegador
  }
}

/**
 * Sorteia 10 questões balanceadas pelos 4 capítulos (3 do Bloco 1, 3 do 2, 3 do 3 e 1 do 4).
 * @returns {Array}
 */
function sortearQuestoesPartida() {
  const embaralhar = (lista) => {
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

/**
 * Calcula dinamicamente os atributos de Cógon conforme os acertos do aluno no Quiz (0-4, 5-7, 8-10).
 * @param {number} acertos
 */
function calcularAtributosDragao(acertos) {
  if (acertos >= 8) {
    return {
      nivel: 'Selo Enfraquecido • Favorável (8–10 acertos)',
      corBadge: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50',
      descricao: 'A magia dos seus acertos selou grande parte do poder dracônico de Cógon!',
      hpMaximo: 105,
      ataqueBase: 14
    };
  }
  if (acertos >= 5) {
    return {
      nivel: 'Escamas Rachadas • Equilibrado (5–7 acertos)',
      corBadge: 'bg-amber-950/80 text-amber-300 border-amber-500/50',
      descricao: 'Seus preparativos enfraqueceram parte da couraça de Cógon. Luta equilibrada!',
      hpMaximo: 145,
      ataqueBase: 20
    };
  }
  return {
    nivel: 'Fúria Máxima • Muito Difícil (0–4 acertos)',
    corBadge: 'bg-rose-950/80 text-rose-300 border-rose-500/50',
    descricao: 'Poucos enigmas foram resolvidos. Cógon luta com força total — use cada item com sabedoria!',
    hpMaximo: 190,
    ataqueBase: 26
  };
}

/**
 * Seleciona o epílogo narrativo correspondente ao desempenho final da partida.
 * @param {boolean} venceu
 * @param {number} acertos
 */
function determinarEpilogo(venceu, acertos) {
  if (!venceu) {
    return {
      cenarioId: 'epilogo_retirada',
      icone: '📜',
      titulo: 'A Retirada Estratégica',
      subtitulo: 'Derrota no Santuário do Pico',
      texto:
        'Cógon provou ser forte demais desta vez. O herói precisou recuar para se preparar melhor. Estude novos conceitos, fortaleça seu inventário e tente novamente!',
      tema: 'from-[#1d1316] to-[#120e0b]',
      borda: 'border-rose-500/55'
    };
  }
  if (acertos >= 8) {
    return {
      cenarioId: 'epilogo_lenda',
      icone: '🌟',
      titulo: 'Lenda da Távola Octogonal',
      subtitulo: 'Vitória Gloriosa (8 a 10 Acertos)',
      texto:
        'Com precisão impecável e bravura sem igual, Cógon foi selado para sempre. O Reino de Poliedra entra em uma Era de Ouro e seu nome é gravado na Távola Octogonal!',
      tema: 'from-[#291d0e] to-[#120e0b]',
      borda: 'border-amber-400/75'
    };
  }
  if (acertos >= 5) {
    return {
      cenarioId: 'epilogo_custeada',
      icone: '⚔️',
      titulo: 'A Vitória Custeada',
      subtitulo: 'Vitória Estratégica (5 a 7 Acertos)',
      texto:
        'Após uma batalha intensa e estratégica, o Dragão Cógon foi derrotado. O reino sofreu algumas cicatrizes, mas a paz foi restaurada graças aos seus esforços.',
      tema: 'from-[#14222c] to-[#120e0b]',
      borda: 'border-sky-400/60'
    };
  }
  return {
    cenarioId: 'epilogo_desesperado',
    icone: '🛡️',
    titulo: 'O Triunfo Desesperado',
    subtitulo: 'Vitória Heroica (0 a 4 Acertos)',
    texto:
      'Contra todas as probabilidades e dependendo puramente da sua garra no combate, você derrubou Cógon! Poliedra celebra sua coragem heroica.',
    tema: 'from-[#231528] to-[#120e0b]',
    borda: 'border-purple-400/60'
  };
}

// ============================================================================
// 5. MOTOR GRÁFICO 16-BITS EM CANVAS & MOLDURA D&D
// ============================================================================

/**
 * Renderizador base de Pixel Art 16-bits em Canvas com upscaling nítido.
 */
function PixelCanvas({ width, height, draw, className = '' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, width, height);

    const art = {
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
      }
    };

    draw(art, width, height);
  }, [width, height, draw]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ imageRendering: 'pixelated' }}
      className={className}
    />
  );
}

/**
 * Painel ornamentado estilo Grimório / Ficha de D&D.
 */
function MolduraDnD({ children, destaque = false, className = '' }) {
  return (
    <div
      className={`relative rounded-xl border-2 ${
        destaque
          ? 'border-amber-400/65 shadow-[0_12px_36px_rgba(217,119,6,0.16)]'
          : 'border-amber-600/35 shadow-xl'
      } bg-[#16120e]/95 backdrop-blur-sm ${className}`}
    >
      <span className="pointer-events-none absolute top-1 left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-amber-400/70 rounded-tl-xs" />
      <span className="pointer-events-none absolute top-1 right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-amber-400/70 rounded-tr-xs" />
      <span className="pointer-events-none absolute bottom-1 left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-amber-400/70 rounded-bl-xs" />
      <span className="pointer-events-none absolute bottom-1 right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-amber-400/70 rounded-br-xs" />
      {children}
    </div>
  );
}

/**
 * Mini-Mapa RPG Compacto (inspirado no canto superior direito das referências).
 */
function MiniMapaJornada({ etapaAtualIndex, naArena = false }) {
  return (
    <div
      title="Mapa da Campanha em Poliedra (10 Etapas + Pico de Cógon)"
      className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#142318] border-2 border-amber-500/60 shadow-inner"
    >
      {Array.from({ length: 10 }).map((_, idx) => {
        const concluida = naArena || idx < etapaAtualIndex;
        const atual = !naArena && idx === etapaAtualIndex;
        return (
          <span
            key={idx}
            className={`w-2 h-2 rounded-full transition-all ${
              atual
                ? 'bg-amber-300 ring-2 ring-amber-400/60 scale-125'
                : concluida
                ? 'bg-emerald-400'
                : 'bg-stone-600'
            }`}
          />
        );
      })}
      <span className="text-xs ml-0.5">{naArena ? '🔥' : '🐉'}</span>
    </div>
  );
}

/**
 * Testa silenciosamente se algum arquivo PNG existe em /assets/images/.
 * Enquanto não existir (ou se falhar), retorna null para exibir o desenho
 * em Pixel Art 16-bits imediatamente sem ícone quebrado ou atraso.
 * @param {string|string[]} caminhos
 * @returns {string|null}
 */
function useImagemCondicional(caminhos) {
  const lista = Array.isArray(caminhos) ? caminhos : [caminhos];
  const chave = lista.join('|');
  const [urlValida, setUrlValida] = useState(null);

  useEffect(() => {
    let cancelado = false;
    setUrlValida(null);

    function testarIndice(idx) {
      if (cancelado || idx >= lista.length) return;
      const img = new window.Image();
      img.onload = () => {
        if (!cancelado && img.naturalWidth > 0) {
          setUrlValida(lista[idx]);
        } else if (!cancelado) {
          testarIndice(idx + 1);
        }
      };
      img.onerror = () => {
        if (!cancelado) {
          testarIndice(idx + 1);
        }
      };
      img.src = lista[idx];
    }

    testarIndice(0);
    return () => {
      cancelado = true;
    };
  }, [chave]);

  return urlValida;
}

/**
 * Herói de Poliedra (túnica verde, capa vermelha, espada prateada e escudo com brasão).
 * Busca /assets/images/heroi_frente.png e /assets/images/heroi_costas.png
 * com fallback automático para Pixel Art 16-bits em Canvas caso não existam.
 */
function HeroSprite({
  equipamentos = [],
  atingido = false,
  tamanho = 'arena',
  direcao = 'frente'
}) {
  const caminhoSprite =
    direcao === 'costas'
      ? '/assets/images/heroi_costas.png'
      : '/assets/images/heroi_frente.png';

  const imagemValida = useImagemCondicional(caminhoSprite);

  const temEspada = equipamentos.includes('espada_angulo');
  const temEscudo = equipamentos.includes('escudo_poligonal');
  const temArmadura = equipamentos.includes('armadura_numerica');
  const temLanca = equipamentos.includes('lanca_ouro');

  const desenharHeroi = (g) => {
    g.rect(14, 44, 20, 2, 'rgba(0,0,0,0.5)');
    g.rect(17, 43, 14, 4, 'rgba(0,0,0,0.35)');

    if (direcao === 'costas') {
      // Vista de costas / 3/4 diagonal (inspirada nas cenas internas e batalha)
      // Botas de couro
      g.rect(18, 37, 5, 7, '#451a03');
      g.rect(19, 37, 3, 5, '#78350f');
      g.rect(25, 37, 5, 7, '#451a03');
      g.rect(26, 37, 3, 5, '#78350f');

      // Túnica Verde Esmeralda
      g.rect(16, 20, 15, 16, '#14532d');
      g.rect(17, 21, 13, 14, '#16a34a');

      // Capa Vermelha cobrindo as costas
      g.rect(14, 20, 17, 16, '#7f1d1d');
      g.rect(15, 21, 15, 14, '#dc2626');
      g.rect(17, 22, 4, 12, '#ef4444');
      g.rect(25, 22, 3, 11, '#b91c1c');

      // Cabeça vista de trás (cabelo castanho repicado)
      g.rect(16, 6, 15, 13, '#78350f');
      g.rect(17, 5, 13, 12, '#92400e');
      g.rect(18, 7, 11, 7, '#b45309');
      g.rect(27, 11, 3, 6, '#fdba74'); // Perfil leve do rosto

      // Escudo no braço esquerdo
      g.rect(10, 21, 8, 12, temEscudo ? '#92400e' : '#451a03');
      g.rect(11, 22, 6, 10, temEscudo ? '#fbbf24' : '#92400e');
      g.rect(12, 23, 4, 8, '#78350f');
      g.px(13, 26, '#fef08a');

      // Arma empunhada à direita
      if (temLanca) {
        g.rect(34, 3, 2, 41, '#92400e');
        g.rect(33, 2, 4, 6, '#fbbf24');
        g.rect(34, 0, 2, 5, '#fef08a');
      } else {
        g.rect(33, 7, 3, 19, '#64748b');
        g.rect(34, 6, 2, 20, '#e2e8f0');
        g.rect(31, 25, 7, 2, '#2563eb');
        g.rect(33, 27, 3, 4, '#1d4ed8');
      }
      return;
    }

    // Vista Frontal / 3/4 Direita
    g.rect(10, 21, 19, 17, '#7f1d1d');
    g.rect(12, 21, 15, 15, '#dc2626');
    g.rect(9, 26, 5, 11, '#991b1b');
    g.rect(13, 23, 3, 12, '#ef4444');

    g.rect(17, 37, 5, 7, '#451a03');
    g.rect(18, 37, 3, 5, '#78350f');
    g.rect(25, 37, 5, 7, '#451a03');
    g.rect(26, 37, 3, 5, '#78350f');
    g.rect(18, 33, 4, 4, '#291509');
    g.rect(25, 33, 4, 4, '#291509');

    g.rect(16, 20, 15, 14, '#14532d');
    g.rect(17, 21, 13, 11, '#16a34a');
    g.rect(19, 22, 9, 7, '#22c55e');
    g.rect(16, 30, 15, 3, '#451a03');
    g.rect(22, 30, 3, 3, '#fbbf24');

    if (temArmadura) {
      g.rect(18, 21, 11, 8, '#94a3b8');
      g.rect(19, 22, 9, 6, '#cbd5e1');
      g.rect(22, 22, 3, 7, '#f59e0b');
      g.rect(14, 19, 4, 5, '#cbd5e1');
      g.rect(29, 19, 4, 5, '#94a3b8');
    }

    g.rect(17, 9, 13, 11, '#d97706');
    g.rect(18, 9, 12, 10, '#fdba74');
    g.rect(19, 10, 10, 8, '#fed7aa');
    g.rect(26, 13, 2, 3, '#1e293b');
    g.px(26, 13, '#ffffff');
    g.rect(15, 5, 16, 5, '#78350f');
    g.rect(17, 4, 12, 4, '#92400e');
    g.rect(14, 7, 4, 6, '#78350f');
    g.rect(29, 7, 3, 4, '#92400e');
    g.px(16, 3, '#92400e');
    g.px(23, 3, '#b45309');

    if (temEscudo) {
      g.rect(9, 21, 9, 12, '#92400e');
      g.rect(10, 22, 7, 10, '#fbbf24');
      g.rect(11, 23, 5, 8, '#78350f');
      g.rect(12, 24, 3, 5, '#f59e0b');
      g.px(13, 26, '#fef08a');
    } else {
      g.rect(10, 22, 8, 10, '#78350f');
      g.rect(11, 23, 6, 8, '#b45309');
      g.rect(12, 24, 4, 5, '#fbbf24');
    }

    g.rect(31, 22, 3, 8, temArmadura ? '#94a3b8' : '#fed7aa');
    if (temLanca) {
      g.rect(35, 3, 2, 41, '#92400e');
      g.rect(35, 4, 1, 39, '#d97706');
      g.rect(33, 6, 6, 3, '#f59e0b');
      g.rect(34, 2, 4, 5, '#fbbf24');
      g.rect(35, 0, 2, 6, '#fef08a');
      g.px(35, 1, '#ffffff');
    } else if (temEspada) {
      g.rect(34, 6, 3, 19, '#64748b');
      g.rect(35, 5, 2, 20, '#e2e8f0');
      g.rect(35, 4, 1, 20, '#ffffff');
      g.rect(36, 7, 1, 16, '#38bdf8');
      g.rect(32, 25, 7, 2, '#2563eb');
      g.rect(33, 25, 5, 1, '#60a5fa');
      g.rect(34, 27, 3, 4, '#1d4ed8');
      g.rect(34, 31, 3, 1, '#fbbf24');
    } else {
      g.rect(34, 13, 2, 13, '#94a3b8');
      g.rect(35, 12, 1, 14, '#e2e8f0');
      g.rect(33, 26, 4, 2, '#2563eb');
      g.rect(34, 28, 2, 3, '#1e40af');
    }
  };

  const classeTamanho =
    tamanho === 'mini'
      ? 'w-16 h-16 sm:w-20 sm:h-20'
      : 'w-24 h-24 sm:w-32 sm:h-32';

  return (
    <div
      className={`relative select-none transition-transform duration-200 ${
        atingido ? 'animate-flash-hit' : 'animate-float-slow'
      }`}
    >
      {temLanca && (
        <div className="absolute -inset-2 rounded-full bg-amber-400/20 blur-md animate-pulse" />
      )}
      {imagemValida ? (
        <img
          src={imagemValida}
          alt="Herói de Poliedra"
          style={{ imageRendering: 'pixelated' }}
          className={`${classeTamanho} object-contain drop-shadow-[0_8px_10px_rgba(0,0,0,0.85)]`}
        />
      ) : (
        <PixelCanvas
          width={48}
          height={48}
          draw={desenharHeroi}
          className={`${classeTamanho} drop-shadow-[0_8px_10px_rgba(0,0,0,0.85)]`}
        />
      )}
    </div>
  );
}

/**
 * Arquimaga Hypatia (cabelos prateados, chapéu pontudo e manto azul-royal com borda dourada).
 * Busca /assets/images/ipatia_frente.png e /assets/images/ipatia_costas.png
 * (aceitando também hypatia_*.png) com fallback automático para Pixel Art 16-bits.
 */
function HypatiaSprite({ tamanho = 'arena', direcao = 'frente' }) {
  const candidatosSprite =
    direcao === 'costas'
      ? ['/assets/images/ipatia_costas.png', '/assets/images/hypatia_costas.png']
      : ['/assets/images/ipatia_frente.png', '/assets/images/hypatia_frente.png'];

  const imagemValida = useImagemCondicional(candidatosSprite);

  const desenharMaga = (g) => {
    if (direcao === 'costas') {
      // Manto azul-royal visto de costas + cabelo prateado longo
      g.rect(13, 20, 18, 23, '#1e3a8a');
      g.rect(15, 20, 14, 22, '#2563eb');
      g.rect(14, 41, 16, 2, '#f59e0b');
      g.rect(15, 42, 14, 1, '#fde047');

      // Cabelo prateado descendo pelas costas
      g.rect(16, 12, 12, 14, '#cbd5e1');
      g.rect(17, 13, 10, 12, '#f8fafc');

      // Chapéu de feiticeira pontudo
      g.rect(11, 11, 22, 2, '#1e3a8a');
      g.rect(13, 10, 18, 2, '#2563eb');
      g.rect(15, 9, 14, 1, '#fbbf24');
      g.rect(15, 6, 14, 3, '#2563eb');
      g.rect(17, 3, 10, 3, '#3b82f6');
      g.rect(19, 1, 6, 2, '#2563eb');

      // Cajado mágico erguido
      g.rect(34, 11, 2, 33, '#78350f');
      g.circle(35, 7, 5, 'rgba(56, 189, 248, 0.35)');
      g.circle(35, 7, 3, '#38bdf8');
      g.px(34, 6, '#ffffff');
      return;
    }

    g.rect(13, 21, 18, 22, '#1e3a8a');
    g.rect(15, 21, 14, 21, '#2563eb');
    g.rect(19, 22, 6, 20, '#fef3c7');
    g.rect(14, 41, 16, 2, '#f59e0b');
    g.rect(15, 42, 14, 1, '#fde047');

    g.rect(18, 12, 9, 8, '#fed7aa');
    g.rect(24, 14, 2, 2, '#1d4ed8');
    g.rect(16, 12, 3, 12, '#cbd5e1');
    g.rect(17, 13, 2, 11, '#f8fafc');
    g.rect(26, 13, 2, 9, '#e2e8f0');
    g.rect(17, 20, 11, 2, '#fbbf24');

    g.rect(11, 11, 22, 2, '#1e3a8a');
    g.rect(13, 10, 18, 2, '#2563eb');
    g.rect(15, 9, 14, 1, '#fbbf24');
    g.rect(15, 6, 14, 3, '#2563eb');
    g.rect(17, 3, 10, 3, '#3b82f6');
    g.rect(19, 1, 6, 2, '#2563eb');
    g.rect(15, 2, 4, 2, '#1d4ed8');

    g.rect(35, 11, 2, 33, '#78350f');
    g.rect(35, 12, 1, 31, '#b45309');
    g.circle(36, 7, 5, 'rgba(56, 189, 248, 0.35)');
    g.circle(36, 7, 3, '#38bdf8');
    g.circle(36, 7, 2, '#bae6fd');
    g.px(35, 6, '#ffffff');
  };

  const classeTamanho =
    tamanho === 'mini'
      ? 'w-16 h-16 sm:w-20 sm:h-20'
      : 'w-20 h-20 sm:w-28 sm:h-28';

  return (
    <div className="relative select-none animate-float-delayed">
      <div className="absolute -inset-1 rounded-full bg-sky-400/25 blur-md" />
      {imagemValida ? (
        <img
          src={imagemValida}
          alt="Arquimaga Hypatia"
          style={{ imageRendering: 'pixelated' }}
          className={`${classeTamanho} object-contain drop-shadow-[0_8px_10px_rgba(0,0,0,0.85)]`}
        />
      ) : (
        <PixelCanvas
          width={48}
          height={48}
          draw={desenharMaga}
          className={`${classeTamanho} drop-shadow-[0_8px_10px_rgba(0,0,0,0.85)]`}
        />
      )}
    </div>
  );
}

/**
 * Dragão Cógon (escamas verde-esmeralda, ventre blindado dourado e membrana bronze).
 * Busca /assets/images/cogon.png com fallback automático para Pixel Art 16-bits.
 */
function CogonSprite({ atingido = false, tamanho = 'arena' }) {
  const imagemValida = useImagemCondicional('/assets/images/cogon.png');

  const desenharDragao = (g) => {
    g.rect(20, 66, 48, 4, 'rgba(0,0,0,0.55)');
    g.rect(26, 65, 36, 6, 'rgba(0,0,0,0.35)');

    g.rect(42, 8, 22, 18, '#14532d');
    g.rect(44, 10, 18, 14, '#166534');

    g.rect(54, 48, 20, 9, '#14532d');
    g.rect(56, 49, 17, 6, '#15803d');
    g.rect(68, 45, 11, 7, '#166534');
    g.rect(75, 42, 6, 5, '#22c55e');
    g.rect(60, 46, 3, 2, '#eab308');
    g.rect(66, 44, 3, 2, '#eab308');

    g.rect(46, 50, 11, 14, '#14532d');
    g.rect(48, 51, 8, 12, '#166534');
    g.rect(43, 62, 12, 4, '#14532d');
    g.rect(41, 63, 3, 3, '#fef08a');
    g.rect(45, 63, 3, 3, '#fef08a');

    g.rect(28, 28, 28, 28, '#14532d');
    g.rect(30, 29, 24, 25, '#15803d');
    g.rect(33, 31, 18, 18, '#16a34a');
    g.rect(29, 34, 13, 20, '#92400e');
    g.rect(30, 35, 10, 18, '#d97706');
    g.rect(31, 36, 7, 3, '#fbbf24');
    g.rect(31, 41, 7, 3, '#fbbf24');
    g.rect(31, 46, 7, 3, '#fbbf24');

    g.rect(23, 42, 8, 13, '#166534');
    g.rect(24, 43, 6, 10, '#16a34a');
    g.rect(19, 53, 8, 4, '#14532d');
    g.rect(17, 54, 3, 3, '#fef08a');

    g.rect(32, 54, 10, 12, '#166534');
    g.rect(29, 64, 11, 3, '#14532d');
    g.rect(27, 64, 3, 3, '#fef08a');

    g.rect(19, 14, 18, 18, '#166534');
    g.rect(21, 15, 14, 15, '#16a34a');
    g.rect(7, 17, 16, 11, '#166534');
    g.rect(8, 18, 14, 8, '#16a34a');
    g.rect(10, 19, 10, 3, '#22c55e');
    g.rect(9, 28, 13, 4, '#14532d');
    g.rect(9, 26, 2, 3, '#ffffff');
    g.rect(14, 26, 2, 3, '#ffffff');
    g.rect(4, 25, 4, 3, '#f97316');
    g.px(5, 26, '#fef08a');

    g.rect(17, 19, 5, 4, '#7f1d1d');
    g.rect(18, 20, 4, 3, '#facc15');
    g.rect(19, 20, 1, 3, '#000000');

    g.rect(28, 10, 6, 5, '#a16207');
    g.rect(32, 6, 6, 5, '#ca8a04');
    g.rect(36, 3, 5, 4, '#fde047');
    g.rect(22, 11, 4, 4, '#ca8a04');
    g.rect(24, 8, 4, 3, '#fde047');

    g.rect(40, 16, 26, 6, '#14532d');
    g.rect(46, 11, 26, 6, '#15803d');
    g.rect(54, 7, 24, 5, '#16a34a');
    g.dither(43, 22, 32, 12, '#92400e', '#b45309');
    g.dither(48, 34, 24, 8, '#78350f', '#92400e');
    g.rect(52, 6, 3, 2, '#fde047');
  };

  const classeTamanho =
    tamanho === 'mini'
      ? 'w-28 h-24 sm:w-32 sm:h-28'
      : 'w-40 h-32 sm:w-56 sm:h-44';

  return (
    <div
      className={`relative select-none transition-transform duration-200 ${
        atingido ? 'animate-flash-hit' : 'animate-dragon-idle'
      }`}
    >
      <div className="absolute inset-4 rounded-full bg-emerald-500/20 blur-xl" />
      {imagemValida ? (
        <img
          src={imagemValida}
          alt="Cógon, o Dragão das Escalas"
          style={{ imageRendering: 'pixelated' }}
          className={`${classeTamanho} object-contain drop-shadow-[0_12px_16px_rgba(0,0,0,0.85)]`}
        />
      ) : (
        <PixelCanvas
          width={84}
          height={72}
          draw={desenharDragao}
          className={`${classeTamanho} drop-shadow-[0_12px_16px_rgba(0,0,0,0.85)]`}
        />
      )}
    </div>
  );
}

/**
 * Cenários 16-bits sombreados baseados nas ilustrações de referência.
 * Carrega automaticamente /assets/images/{tipo}.png e usa o renderizador
 * 16-bits em Canvas como fallback caso o arquivo ainda não exista na pasta.
 */
function CenarioPixelArt({ tipo, className = '' }) {
  const imagemValida = useImagemCondicional(`/assets/images/${tipo}.png`);

  const desenharCena = (g, W, H) => {
    if (tipo === 'forja') {
      g.gradV(0, 0, W, H, ['#1c1917', '#292524', '#44403c', '#292524']);
      for (let y = 6; y < 86; y += 12) {
        for (let x = y % 24 === 0 ? 4 : 14; x < W - 10; x += 22) {
          g.rect(x, y, 18, 9, '#1c1917');
          g.rect(x + 1, y + 1, 16, 7, '#44403c');
        }
      }
      g.rect(0, 86, W, 49, '#292524');
      g.dither(0, 86, W, 49, '#57534e', '#292524');

      g.rect(12, 64, 38, 22, '#64748b');
      g.rect(15, 66, 32, 8, '#38bdf8');
      g.dither(16, 67, 30, 6, '#7dd3fc', '#0284c7');

      g.rect(64, 24, 56, 64, '#57534e');
      g.rect(68, 28, 48, 60, '#78716c');
      g.rect(74, 48, 36, 34, '#7c2d12');
      g.rect(77, 52, 30, 28, '#ea580c');
      g.rect(81, 58, 22, 22, '#f59e0b');
      g.rect(85, 64, 14, 14, '#fef08a');

      [148, 160, 172, 184].forEach((tx, idx) => {
        g.rect(tx, 26, 3, 18 + (idx % 2) * 4, '#94a3b8');
        g.rect(tx - 1, 24, 5, 3, '#78350f');
      });

      g.rect(114, 82, 92, 32, '#451a03');
      g.rect(110, 78, 98, 7, '#92400e');
      g.rect(112, 79, 94, 4, '#b45309');
      g.rect(132, 76, 38, 5, '#fef3c7');
      g.rect(136, 77, 26, 2, '#e2e8f0');
      g.rect(162, 76, 3, 4, '#2563eb');

      [4, 214].forEach((ax) => {
        g.rect(ax + 6, 48, 4, 42, '#78350f');
        g.rect(ax, 52, 16, 22, '#94a3b8');
        g.rect(ax + 2, 54, 12, 18, '#cbd5e1');
      });
    } else if (tipo === 'portao_cidade') {
      g.gradV(0, 0, W, 74, ['#38bdf8', '#7dd3fc', '#bae6fd', '#e0f2fe']);
      g.rect(24, 12, 34, 7, '#ffffff');
      g.rect(168, 16, 42, 7, '#ffffff');
      for (let i = 0; i < 40; i++) {
        g.rect(135 + i, 72 - i, 90 - i * 2, 1, '#64748b');
      }
      g.rect(0, 58, W, 24, '#15803d');
      g.dither(0, 58, W, 6, '#22c55e', '#15803d');
      g.rect(112, 32, 72, 34, '#cbd5e1');
      g.rect(116, 34, 64, 30, '#e2e8f0');
      g.rect(106, 24, 16, 42, '#94a3b8');
      g.rect(138, 18, 20, 48, '#cbd5e1');
      g.rect(174, 24, 16, 42, '#94a3b8');
      g.rect(144, 52, 8, 14, '#451a03');
      g.rect(142, 14, 12, 4, '#dc2626');
      g.rect(108, 20, 12, 4, '#dc2626');
      g.rect(176, 20, 12, 4, '#dc2626');

      g.rect(0, 74, W, 61, '#16a34a');
      g.dither(0, 74, W, 61, '#22c55e', '#15803d');
      g.rect(68, 74, 48, 61, '#a16207');
      g.dither(72, 74, 40, 61, '#ca8a04', '#854d0e');

      g.rect(182, 74, 58, 61, '#0284c7');
      g.dither(186, 74, 50, 61, '#38bdf8', '#0284c7');

      g.rect(42, 92, 4, 20, '#451a03');
      g.rect(30, 84, 30, 12, '#92400e');
      g.rect(32, 86, 26, 8, '#b45309');
    } else if (tipo === 'oficina') {
      g.gradV(0, 0, W, H, ['#1e293b', '#334155', '#475569', '#1e293b']);
      g.rect(24, 14, 44, 46, '#bae6fd');
      g.rect(45, 14, 2, 46, '#451a03');
      g.rect(24, 36, 44, 2, '#451a03');
      g.dither(34, 60, 56, 36, 'rgba(254,240,138,0.22)', 'transparent');
      g.rect(0, 94, W, 41, '#451a03');
      g.dither(0, 94, W, 4, '#78350f', '#451a03');
      [108, 152].forEach((mx) => {
        g.rect(mx + 8, 44, 4, 50, '#78350f');
        g.rect(mx, 48, 20, 26, '#94a3b8');
        g.rect(mx + 2, 50, 16, 22, '#cbd5e1');
        g.rect(mx + 8, 52, 4, 16, '#fbbf24');
      });
      g.rect(180, 68, 52, 28, '#78350f');
      g.rect(178, 66, 56, 4, '#92400e');
    } else if (tipo === 'alquimista') {
      g.gradV(0, 0, W, H, ['#022c22', '#064e3b', '#065f46', '#022c22']);
      [22, 48, 74].forEach((py) => {
        g.rect(16, py, 92, 4, '#451a03');
        g.rect(136, py, 88, 4, '#451a03');
      });
      const coresPocao = ['#ef4444', '#38bdf8', '#a855f7', '#facc15', '#10b981'];
      for (let i = 0; i < 6; i++) {
        g.rect(22 + i * 14, 13, 7, 9, coresPocao[i % coresPocao.length]);
        g.rect(142 + i * 13, 39, 7, 9, coresPocao[(i + 2) % coresPocao.length]);
      }
      g.rect(0, 96, W, 39, '#0f172a');
      g.rect(102, 72, 36, 26, '#1e293b');
      g.rect(104, 67, 32, 4, '#10b981');
      g.circle(114, 56, 3, '#34d399');
      g.circle(125, 48, 2, '#a7f3d0');
    } else if (tipo === 'mercado') {
      g.gradV(0, 0, W, 94, ['#1e1b4b', '#312e81', '#4338ca', '#6366f1']);
      g.rect(0, 94, W, 41, '#44403c');
      g.dither(0, 94, W, 41, '#57534e', '#292524');
      for (let sx = 24; sx < 216; sx += 16) {
        g.rect(sx, 18, 8, 24, '#dc2626');
        g.rect(sx + 8, 18, 8, 24, '#fbbf24');
      }
      g.rect(42, 68, 156, 28, '#78350f');
      g.rect(40, 66, 160, 4, '#b45309');
      g.circle(74, 58, 7, '#38bdf8');
      g.circle(112, 57, 8, '#c084fc');
    } else if (tipo === 'ruinas') {
      g.gradV(0, 0, W, 96, ['#042f2e', '#115e59', '#0f766e', '#134e4a']);
      g.rect(0, 96, W, 39, '#064e3b');
      g.dither(0, 96, W, 8, '#10b981', '#064e3b');
      g.rect(32, 34, 18, 62, '#94a3b8');
      g.rect(188, 48, 18, 48, '#94a3b8');
      g.rect(102, 26, 36, 70, '#334155');
      g.rect(116, 40, 8, 8, '#22d3ee');
      g.rect(114, 56, 12, 3, '#38bdf8');
    } else if (tipo === 'observatorio') {
      g.gradV(0, 0, W, H, ['#090d16', '#1e1b4b', '#311042', '#1e1b4b']);
      g.rect(72, 12, 96, 82, '#020617');
      g.circle(142, 28, 9, '#fef08a');
      g.circle(138, 26, 8, '#020617');
      [
        [84, 22],
        [98, 36],
        [116, 20],
        [155, 48]
      ].forEach(([sx, sy]) => g.px(sx, sy, '#ffffff'));
      g.rect(0, 94, W, 41, '#1e1b4b');
      g.rect(64, 102, 112, 16, '#4c1d95');
      g.rect(42, 38, 8, 16, '#38bdf8');
      g.rect(190, 34, 8, 16, '#c084fc');
    } else if (tipo === 'pico_dragao') {
      g.gradV(0, 0, W, 96, ['#1f090d', '#450a0a', '#7f1d1d', '#9a3412']);
      g.rect(0, 88, W, 12, '#ea580c');
      g.rect(0, 92, W, 6, '#facc15');
      g.rect(48, 96, 144, 39, '#18181b');
      g.rect(72, 18, 96, 80, '#18181b');
      g.rect(78, 24, 84, 74, '#27272a');
      g.rect(104, 42, 32, 32, '#d97706');
      g.rect(108, 46, 24, 24, '#fbbf24');
    } else if (tipo === 'arena_batalha') {
      g.gradV(0, 0, W, 94, ['#0f172a', '#1e293b', '#334155', '#1e293b']);
      for (let y = 8; y < 90; y += 11) {
        for (let x = y % 22 === 0 ? 4 : 14; x < W - 8; x += 22) {
          g.rect(x, y, 18, 8, '#0f172a');
          g.rect(x + 1, y + 1, 16, 6, '#334155');
        }
      }
      [26, 66, 106].forEach((wx) => {
        g.rect(wx, 16, 12, 34, '#020617');
        g.rect(wx + 2, 18, 8, 30, '#38bdf8');
        g.rect(wx + 2, 32, 8, 16, '#fdba74');
        g.dither(wx + 4, 48, 28, 44, 'rgba(254,240,138,0.16)', 'transparent');
      });

      g.rect(136, 62, 92, 32, '#475569');
      g.rect(138, 64, 88, 6, '#94a3b8');
      g.dither(140, 70, 84, 22, '#64748b', '#334155');

      g.rect(0, 92, W, 43, '#1e293b');
      g.rect(18, 96, W - 36, 35, '#78716c');
      g.rect(36, 101, W - 72, 25, '#a8a29e');
      g.rect(58, 106, W - 116, 15, '#d6d3d1');
      g.rect(82, 110, W - 164, 7, '#a8a29e');
    } else if (tipo === 'epilogo_lenda') {
      g.gradV(0, 0, W, 94, ['#451a03', '#92400e', '#d97706', '#fef08a']);
      [42, 108, 174].forEach((vx) => {
        g.rect(vx, 14, 24, 48, '#1e1b4b');
        g.rect(vx + 3, 17, 18, 20, '#38bdf8');
        g.rect(vx + 3, 39, 18, 20, '#fbbf24');
      });
      g.rect(0, 94, W, 41, '#78350f');
      g.rect(68, 86, 104, 24, '#cbd5e1');
      g.rect(108, 92, 24, 10, '#fbbf24');
    } else if (tipo === 'epilogo_custeada') {
      g.gradV(0, 0, W, 88, ['#1e3a8a', '#0284c7', '#f59e0b', '#fef08a']);
      g.circle(120, 68, 18, '#fef9c3');
      g.rect(0, 88, W, 47, '#15803d');
      g.rect(76, 68, 88, 20, '#475569');
    } else if (tipo === 'epilogo_desesperado') {
      g.gradV(0, 0, W, 92, ['#311042', '#9d174d', '#ea580c', '#fde047']);
      g.rect(0, 92, W, 43, '#292524');
      g.rect(118, 56, 4, 36, '#f8fafc');
      g.rect(112, 64, 16, 3, '#fbbf24');
    } else {
      g.gradV(0, 0, W, 94, ['#020617', '#0f172a', '#1e293b', '#334155']);
      g.circle(178, 28, 14, '#f8fafc');
      g.rect(0, 94, W, 41, '#064e3b');
      g.rect(88, 94, 64, 41, '#334155');
    }
  };

  if (imagemValida) {
    return (
      <img
        src={imagemValida}
        alt={`Cenário ${tipo}`}
        style={{ imageRendering: 'pixelated' }}
        className={`w-full h-full object-cover block ${className}`}
      />
    );
  }

  return (
    <PixelCanvas
      width={240}
      height={135}
      draw={desenharCena}
      className={`w-full h-full object-cover block ${className}`}
    />
  );
}

// ============================================================================
// 6. COMPONENTE PRINCIPAL DA APLICAÇÃO (App)
// ============================================================================

export default function App() {
  // --- Controle de Telas ---
  // 'LOGIN' | 'QUIZ' | 'TRANSICAO_ARENA' | 'COMBATE' | 'EPILOGO'
  const [telaAtual, setTelaAtual] = useState('LOGIN');

  // --- Conexão Google Sheets via .env & GET Dinâmico das Abas ---
  const [turmasDisponiveis, setTurmasDisponiveis] = useState([]);
  const [temTurmasConfiguradas, setTemTurmasConfiguradas] = useState(false);
  const [modoProducao, setModoProducao] = useState(false);
  const [carregandoTurmas, setCarregandoTurmas] = useState(true);
  const [statusSalvamento, setStatusSalvamento] = useState(null);

  // --- Dados do Formulário de Login ---
  const [nomeInput, setNomeInput] = useState('');
  const [turmaInput, setTurmaInput] = useState('');
  const [erroLogin, setErroLogin] = useState('');

  // --- Preferências de Sala de Aula ---
  const [somAtivo, setSomAtivo] = useState(true);
  const [mostrarRascunho, setMostrarRascunho] = useState(false);
  const [textoRascunho, setTextoRascunho] = useState('');

  // --- Estado Central do Jogo (gameState) ---
  const [gameState, setGameState] = useState({
    jogador: { nome: '', turma: '' },
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
    statusBatalha: 'EM_ANDAMENTO'
  });

  // --- Estado da Fase 1: Quiz & Narrativa ---
  const [questoesPartida, setQuestoesPartida] = useState([]);
  const [indiceEtapa, setIndiceEtapa] = useState(0);
  const [alternativaSelecionada, setAlternativaSelecionada] = useState(null);
  const [questaoRespondida, setQuestaoRespondida] = useState(false);
  const [historicoRespostas, setHistoricoRespostas] = useState([]);

  // --- Estado da Fase 2: Combate JRPG / D&D em Turnos ---
  const [dragaoEstado, setDragaoEstado] = useState({
    nivel: 'Moderado',
    corBadge: '',
    descricao: '',
    hpAtual: 145,
    hpMaximo: 145,
    ataqueBase: 20
  });
  const [turnoDoJogador, setTurnoDoJogador] = useState(true);
  const [bolsaAberta, setBolsaAberta] = useState(false);
  const [logCombate, setLogCombate] = useState([]);

  // --- Estados de Animações CSS Puras ---
  const [animacaoShake, setAnimacaoShake] = useState(false);
  const [heroFlashHit, setHeroFlashHit] = useState(false);
  const [dragonFlashHit, setDragonFlashHit] = useState(false);
  const [mostrarSlash, setMostrarSlash] = useState(false);
  const [danosFlutuantes, setDanosFlutuantes] = useState([]);
  const idFlutuanteRef = useRef(0);

  // Faz GET na planilha ao abrir para buscar os nomes das abas inferiores (Turmas)
  useEffect(() => {
    let ativo = true;
    async function inicializarTurmas() {
      setCarregandoTurmas(true);
      const resultado = await sheetsApi.carregarTurmas();
      if (!ativo) return;

      setTurmasDisponiveis(resultado.turmas);
      setTemTurmasConfiguradas(resultado.temTurmas);
      setModoProducao(resultado.modoProducao);
      setTurmaInput(resultado.temTurmas ? resultado.turmas[0] : 'Modo Teste');
      setCarregandoTurmas(false);
    }
    inicializarTurmas();
    return () => {
      ativo = false;
    };
  }, []);

  function exibirTextoFlutuante(texto, alvo = 'dragao', tipo = 'dano') {
    const id = ++idFlutuanteRef.current;
    setDanosFlutuantes((prev) => [...prev, { id, texto, alvo, tipo }]);
    setTimeout(() => {
      setDanosFlutuantes((prev) => prev.filter((item) => item.id !== id));
    }, 1150);
  }

  function iniciarJornada(e) {
    if (e) e.preventDefault();
    const nomeLimpo = nomeInput.trim();
    if (!nomeLimpo) {
      setErroLogin('Inscreva o seu nome no Pergaminho da Guilda para começar.');
      return;
    }

    if (temTurmasConfiguradas && !turmaInput) {
      setErroLogin('Selecione a sua turma antes de iniciar a campanha.');
      return;
    }

    const turmaDefinida = temTurmasConfiguradas ? turmaInput : 'Modo Teste';

    setErroLogin('');
    const questoesSorteadas = sortearQuestoesPartida();

    setQuestoesPartida(questoesSorteadas);
    setIndiceEtapa(0);
    setAlternativaSelecionada(null);
    setQuestaoRespondida(false);
    setHistoricoRespostas([]);
    setTextoRascunho('');
    setStatusSalvamento(null);

    setGameState({
      jogador: { nome: nomeLimpo, turma: turmaDefinida },
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
      statusBatalha: 'EM_ANDAMENTO'
    });

    tocarEfeitoSonoro('acerto', somAtivo);
    setTelaAtual('QUIZ');
  }

  function responderQuestao(indiceAlternativa) {
    if (questaoRespondida) return;

    const questaoAtual = questoesPartida[indiceEtapa];
    const etapaInfo = ROTEIRO_ETAPAS[indiceEtapa];
    const acertou = indiceAlternativa === questaoAtual.correta;

    setAlternativaSelecionada(indiceAlternativa);
    setQuestaoRespondida(true);
    tocarEfeitoSonoro(acertou ? 'acerto' : 'erro', somAtivo);

    setHistoricoRespostas((prev) => [
      ...prev,
      {
        etapa: etapaInfo.etapa,
        tema: questaoAtual.tema,
        acertou
      }
    ]);

    if (!acertou) return;

    setGameState((prev) => {
      let novoHpMax = prev.hpMaximo;
      let novoHpAtual = prev.hpAtual;
      let novoAtaque = prev.ataqueBase;
      let novaDefesa = prev.defesa;
      let novaCrit = prev.chanceCritico;
      const novosEquip = [...prev.equipamentos];
      const novoInv = prev.inventario.map((item) => ({ ...item }));
      const novasReliquias = [...prev.reliquiasColetadas];

      const rec = etapaInfo.recompensa;

      if (rec.id === 'espada_angulo') {
        novosEquip.push(rec.id);
        novoAtaque += 12;
      } else if (rec.id === 'escudo_poligonal') {
        novosEquip.push(rec.id);
        novoHpMax += 25;
        novoHpAtual += 25;
        novaDefesa += 4;
      } else if (rec.id === 'armadura_numerica') {
        novosEquip.push(rec.id);
        novaDefesa += 6;
      } else if (rec.id === 'lanca_ouro') {
        novosEquip.push(rec.id);
        novoAtaque += 8;
        novaCrit = 0.4;
        novoHpAtual = Math.min(novoHpMax, novoHpAtual + 20);
      } else if (rec.tipo === 'CONSUMIVEL') {
        novoInv.push({
          id: rec.id,
          nome: rec.id === 'pocao_vitalidade' ? 'Poção de Vitalidade' : rec.nome,
          quantidade: rec.quantidade || 1,
          efeito: rec.efeito,
          valor: rec.valor,
          icone: rec.icone,
          descricao: rec.descricao
        });
      } else if (rec.tipo === 'RELIQUIA') {
        novasReliquias.push(rec.reliquiaIndex);
      }

      return {
        ...prev,
        hpMaximo: novoHpMax,
        hpAtual: novoHpAtual,
        ataqueBase: novoAtaque,
        defesa: novaDefesa,
        chanceCritico: novaCrit,
        acertosQuiz: prev.acertosQuiz + 1,
        equipamentos: novosEquip,
        inventario: novoInv,
        reliquiasColetadas: novasReliquias
      };
    });
  }

  function avancarEtapa() {
    if (indiceEtapa < 9) {
      setIndiceEtapa((prev) => prev + 1);
      setAlternativaSelecionada(null);
      setQuestaoRespondida(false);
      return;
    }

    const qtdReliquias = gameState.reliquiasColetadas.length;
    const magoRecrutado = qtdReliquias === 3;

    setGameState((prev) => {
      let novaDefesa = prev.defesa;
      const novoInventario = prev.inventario.map((i) => ({ ...i }));

      if (!magoRecrutado && qtdReliquias > 0) {
        if (prev.reliquiasColetadas.includes(1)) {
          novaDefesa += 5;
        }
        if (prev.reliquiasColetadas.includes(2)) {
          novoInventario.push({
            id: 'gema_prisma',
            nome: 'Gema do Prisma Brilhante',
            quantidade: 1,
            efeito: 'DANO',
            valor: 50,
            icone: '💎',
            descricao: 'Dispara um raio luminoso causando 50 de dano em Cógon.'
          });
        }
        if (prev.reliquiasColetadas.includes(3)) {
          novoInventario.push({
            id: 'elixir_constante',
            nome: 'Elixir da Constante',
            quantidade: 1,
            efeito: 'CURA_PERCENTUAL',
            valor: 60,
            icone: '⚗️',
            descricao: 'Recupera 60% dos seus PV Máximos instantaneamente.'
          });
        }
      }

      return {
        ...prev,
        defesa: novaDefesa,
        inventario: novoInventario,
        magoPresente: magoRecrutado
      };
    });

    const configDragao = calcularAtributosDragao(gameState.acertosQuiz);
    setDragaoEstado({
      nivel: configDragao.nivel,
      corBadge: configDragao.corBadge,
      descricao: configDragao.descricao,
      hpAtual: configDragao.hpMaximo,
      hpMaximo: configDragao.hpMaximo,
      ataqueBase: configDragao.ataqueBase
    });

    setTelaAtual('TRANSICAO_ARENA');
  }

  function iniciarCombateArena() {
    setTurnoDoJogador(true);
    setBolsaAberta(false);
    const introLog = [
      `🐉 Iniciativa rolada! Cógon, o Dragão das Escalas, ergue-se no Santuário do Pico!`
    ];
    if (gameState.magoPresente) {
      introLog.push(
        '🔮 Arquimaga Hypatia ergue seu cajado ao seu lado: "Minhas magias arcanas golpearão a cada turno!"'
      );
    }
    setLogCombate(introLog);
    setTelaAtual('COMBATE');
  }

  async function encerrarBatalha(venceu) {
    const statusFinal = venceu ? 'VITORIA' : 'DERROTA';
    const pontoBonus = venceu ? 1 : 0;
    const notaFinal = gameState.acertosQuiz + pontoBonus;

    setGameState((prev) => ({
      ...prev,
      statusBatalha: statusFinal
    }));

    tocarEfeitoSonoro(venceu ? 'vitoria' : 'erro', somAtivo);

    const registroAluno = {
      nomeAluno: gameState.jogador.nome,
      turma: gameState.jogador.turma,
      acertosQuiz: gameState.acertosQuiz,
      derrotouDragao: venceu ? 'Sim' : 'Não',
      pontoBonus,
      notaFinal,
      dataHora: new Date().toLocaleString('pt-BR')
    };

    const resultadoEnvio = await sheetsApi.salvarPontuacaoFinal(
      registroAluno,
      temTurmasConfiguradas && modoProducao
    );
    setStatusSalvamento(resultadoEnvio);

    setTimeout(() => {
      setTelaAtual('EPILOGO');
    }, 900);
  }

  function executarTurnoDragao(hpHeroiAposTurnoJogador) {
    if (hpHeroiAposTurnoJogador <= 0) return;

    setTimeout(() => {
      const variacao = Math.floor(Math.random() * 7) - 3;
      const danoBruto = Math.max(8, dragaoEstado.ataqueBase + variacao);
      const danoFinal = Math.max(4, danoBruto - gameState.defesa);

      tocarEfeitoSonoro('ataque', somAtivo);
      setAnimacaoShake(true);
      setHeroFlashHit(true);
      exibirTextoFlutuante(`-${danoFinal} PV`, 'heroi', 'dano');

      setTimeout(() => {
        setAnimacaoShake(false);
        setHeroFlashHit(false);
      }, 450);

      const novoHpHeroi = Math.max(0, hpHeroiAposTurnoJogador - danoFinal);

      setGameState((prev) => ({
        ...prev,
        hpAtual: novoHpHeroi
      }));

      setLogCombate((prev) => [
        `🔥 Turno do Chefe: Cógon exala fogo dracônico e causa ${danoFinal} de dano${
          gameState.defesa > 0 ? ` (${gameState.defesa} absorvido pela CA)` : ''
        }!`,
        ...prev.slice(0, 4)
      ]);

      if (novoHpHeroi <= 0) {
        encerrarBatalha(false);
      } else {
        setTurnoDoJogador(true);
      }
    }, 900);
  }

  function executarAtaqueJogador() {
    if (!turnoDoJogador || gameState.statusBatalha !== 'EM_ANDAMENTO') return;

    setTurnoDoJogador(false);
    setBolsaAberta(false);

    const critico = Math.random() < gameState.chanceCritico;
    const variacao = Math.floor(Math.random() * 5) - 2;
    let danoHeroi = Math.max(10, gameState.ataqueBase + variacao);
    if (critico) {
      danoHeroi = Math.round(danoHeroi * 1.5);
    }

    const danoHypatio = gameState.magoPresente ? 18 : 0;
    const danoTotal = danoHeroi + danoHypatio;

    tocarEfeitoSonoro('ataque', somAtivo);
    setMostrarSlash(true);
    setDragonFlashHit(true);
    exibirTextoFlutuante(
      critico ? `-${danoHeroi} CRÍTICO (20)!` : `-${danoHeroi} PV`,
      'dragao',
      'dano'
    );

    if (danoHypatio > 0) {
      setTimeout(() => {
        exibirTextoFlutuante(`-${danoHypatio} Arcano`, 'dragao', 'magia');
      }, 220);
    }

    setTimeout(() => {
      setMostrarSlash(false);
      setDragonFlashHit(false);
    }, 450);

    const novoHpDragao = Math.max(0, dragaoEstado.hpAtual - danoTotal);
    setDragaoEstado((prev) => ({ ...prev, hpAtual: novoHpDragao }));

    const mensagensTurno = [
      `⚔️ Seu Turno: Golpe certeiro em Cógon causando ${danoHeroi} de dano${
        critico ? ' (ACERTO CRÍTICO NATURAL!)' : ''
      }!`
    ];
    if (danoHypatio > 0) {
      mensagensTurno.unshift(
        `🔮 Arquimaga Hypatia conjurou Raio Prismático causando +${danoHypatio} de dano!`
      );
    }

    setLogCombate((prev) => [...mensagensTurno, ...prev.slice(0, 3)]);

    if (novoHpDragao <= 0) {
      encerrarBatalha(true);
      return;
    }

    executarTurnoDragao(gameState.hpAtual);
  }

  function usarItemBolsa(itemId) {
    if (!turnoDoJogador || gameState.statusBatalha !== 'EM_ANDAMENTO') return;

    const item = gameState.inventario.find((i) => i.id === itemId && i.quantidade > 0);
    if (!item) return;

    setTurnoDoJogador(false);
    setBolsaAberta(false);

    const novoInventario = gameState.inventario
      .map((i) => (i.id === itemId ? { ...i, quantidade: i.quantidade - 1 } : i))
      .filter((i) => i.quantidade > 0);

    let hpHeroiAtualizado = gameState.hpAtual;
    let hpDragaoAtualizado = dragaoEstado.hpAtual;
    const mensagens = [];

    if (item.efeito === 'CURA' || item.efeito === 'CURA_PERCENTUAL') {
      const curaCalculada =
        item.efeito === 'CURA_PERCENTUAL'
          ? Math.round((gameState.hpMaximo * item.valor) / 100)
          : item.valor;

      hpHeroiAtualizado = Math.min(gameState.hpMaximo, gameState.hpAtual + curaCalculada);
      tocarEfeitoSonoro('cura', somAtivo);
      exibirTextoFlutuante(`+${curaCalculada} PV`, 'heroi', 'cura');
      mensagens.push(`🧪 Ação de Item: Você usou ${item.nome} e recuperou +${curaCalculada} PV!`);
    } else if (item.efeito === 'DANO') {
      tocarEfeitoSonoro('ataque', somAtivo);
      setDragonFlashHit(true);
      exibirTextoFlutuante(`-${item.valor} PV`, 'dragao', 'magia');
      setTimeout(() => setDragonFlashHit(false), 450);

      hpDragaoAtualizado = Math.max(0, dragaoEstado.hpAtual - item.valor);
      mensagens.push(`💥 Ação de Item: Você lançou ${item.nome} causando ${item.valor} de dano!`);
    }

    if (gameState.magoPresente && hpDragaoAtualizado > 0) {
      const danoApoio = 16;
      hpDragaoAtualizado = Math.max(0, hpDragaoAtualizado - danoApoio);
      setTimeout(() => {
        exibirTextoFlutuante(`-${danoApoio} Arcano`, 'dragao', 'magia');
      }, 240);
      mensagens.unshift(`🔮 Arquimaga Hypatia aproveitou a brecha e causou +${danoApoio} de dano!`);
    }

    setGameState((prev) => ({
      ...prev,
      hpAtual: hpHeroiAtualizado,
      inventario: novoInventario
    }));
    setDragaoEstado((prev) => ({
      ...prev,
      hpAtual: hpDragaoAtualizado
    }));
    setLogCombate((prev) => [...mensagens, ...prev.slice(0, 3)]);

    if (hpDragaoAtualizado <= 0) {
      encerrarBatalha(true);
      return;
    }

    executarTurnoDragao(hpHeroiAtualizado);
  }

  function baixarComprovanteCSV() {
    const pontoBonus = gameState.statusBatalha === 'VITORIA' ? 1 : 0;
    const notaFinal = gameState.acertosQuiz + pontoBonus;
    const cabecalho = 'Nome do Aluno,Turma,Acertos Quiz,Derrotou Dragao,Ponto Bonus,Nota Final,Data\n';
    const linha = `"${gameState.jogador.nome}","${gameState.jogador.turma}",${gameState.acertosQuiz},${
      gameState.statusBatalha === 'VITORIA' ? 'Sim' : 'Nao'
    },${pontoBonus},${notaFinal},"${new Date().toLocaleString('pt-BR')}"\n`;

    const blob = new Blob([cabecalho + linha], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ficha_math_rpg_${gameState.jogador.nome.replace(/\s+/g, '_')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function reiniciarParaInicio() {
    setTelaAtual('LOGIN');
    setAlternativaSelecionada(null);
    setQuestaoRespondida(false);
    setBolsaAberta(false);
    setStatusSalvamento(null);
  }

  const questaoAtual = questoesPartida[indiceEtapa];
  const etapaAtual = ROTEIRO_ETAPAS[indiceEtapa];

  return (
    <div className="min-h-dvh lg:h-dvh lg:overflow-hidden bg-[#0c0a09] text-stone-100 font-sans selection:bg-amber-400 selection:text-stone-950 flex flex-col relative overflow-x-hidden">
      {/* Textura sutil de pedra/pergaminho escuro no fundo + Tipografia D&D + Animações GPU */}
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

      {/* HUD Superior Compacto estilo JRPG 16-bits (PV, Atributos e Mini-Mapa) */}
      <header className="border-b border-amber-600/35 bg-[#120e0b]/95 backdrop-blur-md shrink-0 z-30 shadow-md">
        <div className="max-w-6xl mx-auto px-3 sm:px-5 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 via-amber-600 to-red-800 border border-amber-300/60 flex items-center justify-center shadow">
              <Dices className="w-4 h-4 text-amber-100" />
            </div>
            <div>
              <h1 className="font-dnd-title text-xs sm:text-sm font-extrabold tracking-wide text-amber-300 leading-none">
                A Távola Octogonal
              </h1>
              <p className="text-[10px] text-stone-400 hidden sm:block mt-0.5">
                Math RPG • 1º Ano (PA & PG)
              </p>
            </div>
          </div>

          {/* Barra de Status em Tempo Real durante a Jornada / Combate */}
          {(telaAtual === 'QUIZ' || telaAtual === 'COMBATE') && (
            <div className="flex items-center gap-2 sm:gap-3 text-xs font-bold">
              <div className="flex items-center gap-1.5 bg-[#1b1510] px-2.5 py-1 rounded-lg border border-emerald-500/40">
                <span className="text-emerald-400 font-extrabold">PV</span>
                <div className="w-14 sm:w-20 h-2 bg-stone-900 rounded-sm overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${(gameState.hpAtual / gameState.hpMaximo) * 100}%` }}
                  />
                </div>
                <span className="text-stone-200 text-[11px]">
                  {gameState.hpAtual}/{gameState.hpMaximo}
                </span>
              </div>

              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-950/70 border border-amber-500/40 text-amber-300 text-[11px]">
                <Sword className="w-3 h-3" /> {gameState.ataqueBase}
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded bg-sky-950/70 border border-sky-500/40 text-sky-300 text-[11px]">
                <Shield className="w-3 h-3" /> {gameState.defesa}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-purple-950/70 border border-purple-500/40 text-purple-300 text-[11px]">
                <Sparkles className="w-3 h-3" /> {gameState.reliquiasColetadas.length}/3
              </span>
            </div>
          )}

          <div className="flex items-center gap-2">
            {(telaAtual === 'QUIZ' || telaAtual === 'COMBATE') && (
              <MiniMapaJornada
                etapaAtualIndex={indiceEtapa}
                naArena={telaAtual === 'COMBATE'}
              />
            )}

            <span
              className={`hidden sm:inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                modoProducao && temTurmasConfiguradas
                  ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40'
                  : 'bg-amber-950/60 text-amber-300 border-amber-500/40'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  modoProducao && temTurmasConfiguradas ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
              {modoProducao && temTurmasConfiguradas ? 'Guilda Conectada' : 'Modo Teste'}
            </span>

            <button
              type="button"
              onClick={() => setSomAtivo(!somAtivo)}
              title={somAtivo ? 'Silenciar efeitos sonoros' : 'Ativar efeitos sonoros'}
              className="p-1.5 rounded-lg bg-[#1e1813] hover:bg-[#2a221b] border border-amber-600/30 text-amber-200 transition-colors cursor-pointer"
            >
              {somAtivo ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Palco Principal Zero-Scroll (ocupa exatamente o restante da altura da tela) */}
      <main className="relative z-10 flex-1 min-h-0 flex flex-col justify-center max-w-6xl w-full mx-auto px-3 sm:px-5 py-2.5 sm:py-3">
        {/* ================================================================== */}
        {/* TELA 1: CAPA DA CAMPANHA & FICHA DE INSCRIÇÃO (LAYOUT COMPACTO)    */}
        {/* ================================================================== */}
        {telaAtual === 'LOGIN' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch max-w-5xl mx-auto w-full">
            <MolduraDnD destaque className="lg:col-span-7 overflow-hidden flex flex-col justify-between">
              <div className="relative h-44 sm:h-56 w-full overflow-hidden border-b border-amber-500/35">
                <CenarioPixelArt tipo="portao_cidade" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#16120e] via-transparent to-black/25" />
                <div className="absolute inset-x-0 bottom-1 flex justify-center items-end gap-3 px-4">
                  <HeroSprite equipamentos={['espada_angulo', 'escudo_poligonal']} />
                  <HypatiaSprite />
                  <CogonSprite />
                </div>
              </div>

              <div className="p-4 sm:p-5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-widest bg-amber-500/15 text-amber-300 border border-amber-500/35 mb-2">
                  <Sparkles className="w-3 h-3" />
                  Crônicas de Poliedra • 1º Ano
                </span>
                <h2 className="font-dnd-title text-xl sm:text-2xl font-black text-amber-100 tracking-wide">
                  A Távola Octogonal e a Fúria de Cógon
                </h2>
                <p className="font-dnd-lore text-sm sm:text-base text-stone-300 mt-1.5 leading-relaxed">
                  O dragão <strong className="text-emerald-400">Cógon</strong> despertou no Pico
                  Octogonal! Percorra o Reino de <strong className="text-amber-300">Poliedra</strong>,
                  decifre 10 enigmas de <strong>PA e PG</strong> para forjar relíquias, recrutar a{' '}
                  <strong className="text-sky-300">Arquimaga Hypatia</strong> e vencer a batalha final!
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
                  <span className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold">
                    Nível 1
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-amber-200/80 mb-1.5">
                    Nome Completo do Jogador
                  </label>
                  <input
                    type="text"
                    value={nomeInput}
                    onChange={(e) => setNomeInput(e.target.value)}
                    placeholder="Ex: Arthur Pendragon da Silva"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#0d0a08] border border-amber-600/35 text-amber-50 placeholder-stone-500 focus:outline-none focus:border-amber-400 text-sm sm:text-base"
                  />
                </div>

                {carregandoTurmas ? (
                  <div className="p-2.5 rounded-lg bg-[#0d0a08] border border-amber-600/20 text-xs text-stone-400 flex items-center gap-2">
                    <Dices className="w-4 h-4 text-amber-400 animate-spin" />
                    <span>Consultando turmas na guilda...</span>
                  </div>
                ) : temTurmasConfiguradas ? (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-amber-200/80 mb-1.5">
                      Selecione sua Turma
                    </label>
                    <select
                      value={turmaInput}
                      onChange={(e) => setTurmaInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[#0d0a08] border border-amber-600/35 text-amber-50 focus:outline-none focus:border-amber-400 text-sm sm:text-base"
                    >
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

                <button
                  type="submit"
                  className="w-full py-3 px-5 rounded-lg bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-stone-950 font-dnd-title font-black text-base border border-amber-300/60 shadow-lg shadow-amber-600/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Iniciar Campanha</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              </form>
            </MolduraDnD>
          </div>
        )}

        {/* ================================================================== */}
        {/* TELA 2: FASE 1 — SPLIT-SCREEN ZERO-SCROLL (CENA ESQ | QUIZ DIR)   */}
        {/* ================================================================== */}
        {telaAtual === 'QUIZ' && questaoAtual && etapaAtual && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 h-full min-h-0 items-stretch">
            {/* COLUNA ESQUERDA (5 cols): Cenário 16-bits + Sprites + Diálogo NPC */}
            <MolduraDnD className="lg:col-span-5 flex flex-col justify-between overflow-hidden">
              {/* Quadro Visual 16-bits */}
              <div className="relative flex-1 min-h-[150px] sm:min-h-[190px] w-full overflow-hidden border-b border-amber-500/35 bg-[#0c0a09]">
                <CenarioPixelArt tipo={etapaAtual.cenario} />
                <div className="absolute inset-0 bg-gradient-to-t from-[#16120e] via-transparent to-black/35" />

                {/* Etiqueta da Etapa no topo da cena */}
                <div className="absolute top-2.5 left-3 right-3 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-[#14100c]/90 text-amber-300 border border-amber-500/45">
                    <Compass className="w-3 h-3 text-amber-400" />
                    {etapaAtual.capitulo}
                  </span>
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded bg-[#14100c]/90 text-amber-200 border border-amber-500/45">
                    Etapa {etapaAtual.etapa}/10
                  </span>
                </div>

                {/* Personagens na Cena (Reutilizando sprite de costas em trânsito) */}
                <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between pointer-events-none">
                  <div className="flex items-end gap-1">
                    <HeroSprite
                      equipamentos={gameState.equipamentos}
                      tamanho="mini"
                      direcao="costas"
                    />
                    {(etapaAtual.cenario === 'observatorio' ||
                      gameState.reliquiasColetadas.length === 3) && (
                      <HypatiaSprite
                        tamanho="mini"
                        direcao={etapaAtual.cenario === 'observatorio' ? 'frente' : 'costas'}
                      />
                    )}
                  </div>
                  <div className="text-right bg-[#120e0b]/85 px-2.5 py-1 rounded border border-amber-500/30">
                    <p className="font-dnd-title text-xs sm:text-sm font-black text-amber-100 leading-tight">
                      {etapaAtual.local}
                    </p>
                  </div>
                </div>
              </div>

              {/* Caixa de Diálogo JRPG + Espólio da Etapa */}
              <div className="p-3.5 sm:p-4 bg-[#19140f] space-y-2.5 shrink-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-lg">
                      {etapaAtual.recompensa.icone}
                    </span>
                    <div>
                      <p className="font-dnd-title font-bold text-amber-300 text-xs sm:text-sm leading-tight">
                        {etapaAtual.npcNome}
                      </p>
                      <p className="text-[10px] text-stone-400">{etapaAtual.npcCargo}</p>
                    </div>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-200 border border-amber-500/40 font-semibold">
                    {etapaAtual.recompensa.nome}
                  </span>
                </div>

                <p className="font-dnd-lore text-sm sm:text-base text-stone-200 leading-snug italic">
                  “{etapaAtual.fala}”
                </p>
              </div>
            </MolduraDnD>

            {/* COLUNA DIREITA (7 cols): Enigma Matemático + 4 Botões + Feedback */}
            <MolduraDnD className="lg:col-span-7 p-4 sm:p-5 flex flex-col justify-between gap-3 overflow-y-auto">
              <div className="space-y-3">
                {/* Cabeçalho da Questão + Grimório de Fórmulas */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-purple-950/75 text-purple-200 border border-purple-500/40">
                    <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                    {questaoAtual.tema}
                  </span>

                  <button
                    type="button"
                    onClick={() => setMostrarRascunho(!mostrarRascunho)}
                    className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-[#221b15] hover:bg-[#2d231b] border border-amber-600/35 text-amber-200 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Calculator className="w-3.5 h-3.5 text-amber-400" />
                    {mostrarRascunho ? 'Ocultar Fórmulas' : 'Fórmulas PA/PG'}
                  </button>
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
                    <input
                      type="text"
                      value={textoRascunho}
                      onChange={(e) => setTextoRascunho(e.target.value)}
                      placeholder="Rascunho rápido de cálculo..."
                      className="w-full px-2.5 py-1.5 rounded bg-[#16120e] border border-amber-600/30 text-stone-200 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                )}

                {/* Enunciado */}
                <h3 className="text-sm sm:text-base lg:text-lg font-bold text-amber-50 leading-snug">
                  {questaoAtual.enunciado}
                </h3>

                {/* 4 Botões de Alternativas Sempre Visíveis */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {questaoAtual.alternativas.map((alt, idx) => {
                    const letras = ['A', 'B', 'C', 'D'];
                    const ehCorreta = idx === questaoAtual.correta;
                    const ehSelecionada = idx === alternativaSelecionada;

                    let estiloBotao =
                      'bg-[#0f0c0a] hover:bg-[#1e1812] border-amber-600/30 text-stone-100';

                    if (questaoRespondida) {
                      if (ehCorreta) {
                        estiloBotao =
                          'bg-emerald-950/65 border-emerald-400 text-emerald-100 ring-2 ring-emerald-400/30';
                      } else if (ehSelecionada) {
                        estiloBotao =
                          'bg-rose-950/65 border-rose-500 text-rose-200 ring-2 ring-rose-500/30';
                      } else {
                        estiloBotao = 'bg-[#0c0908] border-stone-800 text-stone-500 opacity-60';
                      }
                    }

                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={questaoRespondida}
                        onClick={() => responderQuestao(idx)}
                        className={`w-full min-h-[48px] p-3 rounded-lg border-2 text-left font-semibold transition-all flex items-center gap-2.5 cursor-pointer active:scale-[0.99] ${estiloBotao}`}
                      >
                        <span className="font-dnd-title w-7 h-7 rounded bg-[#1d1712] border border-amber-500/45 text-amber-300 flex items-center justify-center font-black text-xs shrink-0">
                          {letras[idx]}
                        </span>
                        <span className="text-xs sm:text-sm leading-snug">{alt}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Barra Compacta de Resultado & Botão Próximo (dentro da mesma tela) */}
              {questaoRespondida ? (
                <div
                  className={`p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    alternativaSelecionada === questaoAtual.correta
                      ? 'bg-emerald-950/50 border-emerald-500/50'
                      : 'bg-rose-950/50 border-rose-500/50'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {alternativaSelecionada === questaoAtual.correta ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div className="text-xs leading-snug">
                      <p className="font-extrabold text-amber-50">
                        {alternativaSelecionada === questaoAtual.correta
                          ? `Acertou! +${etapaAtual.recompensa.nome}`
                          : 'Resposta incorreta — sem espólio nesta etapa.'}
                      </p>
                      <p className="text-stone-300 mt-0.5">{questaoAtual.justificativa}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={avancarEtapa}
                    className="shrink-0 px-4 py-2.5 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-dnd-title font-black text-xs sm:text-sm shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>{indiceEtapa < 9 ? 'Próxima Etapa' : 'Ir para Arena'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="text-[11px] text-stone-400 border-t border-amber-600/15 pt-2 flex items-center justify-between">
                  <span>Escolha uma das 4 runas acima para responder.</span>
                  <span className="text-amber-300/80 font-semibold">
                    {gameState.jogador.nome}
                  </span>
                </div>
              )}
            </MolduraDnD>
          </div>
        )}

        {/* ================================================================== */}
        {/* TELA 3: TRANSIÇÃO & FICHA PRÉ-COMBATE                              */}
        {/* ================================================================== */}
        {telaAtual === 'TRANSICAO_ARENA' && (
          <MolduraDnD destaque className="max-w-3xl mx-auto w-full p-5 sm:p-6 space-y-4">
            <div className="text-center space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-widest text-amber-400">
                Preparativos da Campanha Concluídos
              </span>
              <h2 className="font-dnd-title text-xl sm:text-2xl font-black text-amber-50">
                Os Portões do Santuário de Cógon se Abrem!
              </h2>
              <p className="text-xs sm:text-sm text-stone-300">
                Você superou <strong className="text-emerald-400">{gameState.acertosQuiz} de 10</strong>{' '}
                desafios matemáticos em Poliedra.
              </p>
            </div>

            <div
              className={`p-3.5 rounded-lg border ${
                gameState.magoPresente
                  ? 'bg-sky-950/45 border-sky-400/60'
                  : 'bg-[#0f0c0a] border-amber-600/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔮</span>
                <div>
                  <h3 className="font-dnd-title font-bold text-xs sm:text-sm text-sky-200">
                    {gameState.magoPresente
                      ? 'Arquimaga Hypatia Juntou-se ao Grupo! (3/3 Relíquias)'
                      : `Ritual de Hypatia Incompleto (${gameState.reliquiasColetadas.length}/3 Relíquias)`}
                  </h3>
                  <p className="text-xs text-stone-300 mt-0.5 leading-snug">
                    {gameState.magoPresente
                      ? 'Impressionada com sua sabedoria, Hypatia lutará ao seu lado lançando raios prismáticos a cada turno!'
                      : gameState.reliquiasColetadas.length > 0
                      ? 'Hypatia permaneceu na torre, mas deixou você ficar com as relíquias conquistadas para o combate!'
                      : 'Nenhuma relíquia foi reunida. Você enfrentará Cógon contando com suas armas e bravura!'}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-lg bg-[#0f0c0a] border border-amber-500/35 space-y-1.5">
                <h4 className="font-dnd-title text-xs font-bold uppercase tracking-wider text-amber-300">
                  Ficha do Guardião
                </h4>
                <ul className="text-xs sm:text-sm space-y-1 text-stone-200">
                  <li>❤️ Pontos de Vida (PV): <strong>{gameState.hpMaximo}</strong></li>
                  <li>⚔️ Força de Ataque (FOR): <strong>{gameState.ataqueBase}</strong></li>
                  <li>🛡️ Classe de Armadura (CA): <strong>{gameState.defesa}</strong></li>
                  <li>🎲 Crítico Natural (d20): <strong>{Math.round(gameState.chanceCritico * 100)}%</strong> • 🎒 Itens: <strong>{gameState.inventario.reduce((acc, i) => acc + i.quantidade, 0)}</strong></li>
                </ul>
              </div>

              <div className="p-3.5 rounded-lg bg-[#0f0c0a] border border-emerald-500/40 space-y-1.5">
                <h4 className="font-dnd-title text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Ficha do Chefe • Cógon
                </h4>
                <span
                  className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded border ${dragaoEstado.corBadge}`}
                >
                  {dragaoEstado.nivel}
                </span>
                <p className="text-xs text-stone-300 leading-snug">{dragaoEstado.descricao}</p>
                <p className="text-xs sm:text-sm text-emerald-300 font-bold">
                  🐉 PV de Cógon: {dragaoEstado.hpMaximo} / {dragaoEstado.hpMaximo}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={iniciarCombateArena}
              className="w-full py-3.5 px-6 rounded-lg bg-gradient-to-r from-red-700 via-rose-600 to-orange-600 hover:from-red-600 hover:to-orange-500 text-amber-50 font-dnd-title font-black text-base border border-amber-400/50 shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Flame className="w-5 h-5 text-amber-300" />
              <span>Rolar Iniciativa e Combater!</span>
            </button>
          </MolduraDnD>
        )}

        {/* ================================================================== */}
        {/* TELA 4: FASE 2 — ARENA DE COMBATE ZERO-SCROLL (SPLIT JRPG)         */}
        {/* ================================================================== */}
        {telaAtual === 'COMBATE' && (
          <div
            className={`grid grid-cols-1 lg:grid-cols-12 gap-3.5 h-full min-h-0 items-stretch ${
              animacaoShake ? 'animate-screen-shake' : ''
            }`}
          >
            {/* ESQUERDA (8 cols): Arena 16-bits no Santuário Circular */}
            <MolduraDnD
              destaque
              className="lg:col-span-8 p-3.5 sm:p-5 overflow-hidden min-h-[300px] flex flex-col justify-between"
            >
              <div className="pointer-events-none absolute inset-0 rounded-xl overflow-hidden">
                <CenarioPixelArt tipo="arena_batalha" />
                <div className="absolute inset-0 bg-black/15" />
              </div>

              {/* Topo: Barra do Dragão Cógon + Sprite sobre a plataforma */}
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div className="bg-[#120d0a]/92 border-2 border-emerald-500/60 rounded-lg p-2.5 max-w-xs w-full shadow-xl">
                  <div className="flex items-center justify-between text-xs font-extrabold mb-1">
                    <span className="font-dnd-title text-emerald-300">
                      🐉 Cógon, Dragão das Escalas
                    </span>
                    <span className="text-stone-200">
                      {dragaoEstado.hpAtual}/{dragaoEstado.hpMaximo}
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-stone-900 rounded-sm overflow-hidden border border-emerald-500/40">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-600 via-green-500 to-lime-400 transition-all duration-300"
                      style={{
                        width: `${(dragaoEstado.hpAtual / dragaoEstado.hpMaximo) * 100}%`
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-stone-400 mt-0.5 block">
                    {dragaoEstado.nivel}
                  </span>
                </div>

                <div className="relative self-end sm:self-center mr-1 sm:mr-6">
                  <CogonSprite atingido={dragonFlashHit} />

                  {mostrarSlash && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center animate-slash">
                      <svg viewBox="0 0 100 100" className="w-28 h-28">
                        <path
                          d="M15,85 Q50,45 88,12"
                          stroke="#fbbf24"
                          strokeWidth="8"
                          strokeLinecap="round"
                          fill="none"
                        />
                        <path
                          d="M20,82 Q50,45 85,15"
                          stroke="#ffffff"
                          strokeWidth="3"
                          strokeLinecap="round"
                          fill="none"
                        />
                      </svg>
                    </div>
                  )}

                  {danosFlutuantes
                    .filter((d) => d.alvo === 'dragao')
                    .map((d) => (
                      <div
                        key={d.id}
                        className={`pointer-events-none absolute -top-4 left-1/2 -translate-x-1/2 font-dnd-title font-black text-base sm:text-lg whitespace-nowrap drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] animate-floating-damage ${
                          d.tipo === 'magia' ? 'text-sky-300' : 'text-amber-300'
                        }`}
                      >
                        {d.texto}
                      </div>
                    ))}
                </div>
              </div>

              {/* Base: Herói + Arquimaga Hypatia & Placa do Jogador */}
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                <div className="relative flex items-end gap-1 ml-1 sm:ml-4">
                  <HeroSprite
                    equipamentos={gameState.equipamentos}
                    atingido={heroFlashHit}
                    direcao="costas"
                  />
                  {gameState.magoPresente && <HypatiaSprite direcao="costas" />}

                  {danosFlutuantes
                    .filter((d) => d.alvo === 'heroi')
                    .map((d) => (
                      <div
                        key={d.id}
                        className={`pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 font-dnd-title font-black text-base sm:text-lg whitespace-nowrap drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] animate-floating-damage ${
                          d.tipo === 'cura' ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {d.texto}
                      </div>
                    ))}
                </div>

                <div className="bg-[#120d0a]/92 border-2 border-amber-500/55 rounded-lg p-2.5 max-w-xs w-full shadow-xl self-end">
                  <div className="flex items-center justify-between text-xs font-extrabold mb-1">
                    <span className="font-dnd-title text-amber-300">
                      🛡️ {gameState.jogador.nome}
                    </span>
                    <span className="text-stone-200">
                      {gameState.hpAtual}/{gameState.hpMaximo} PV
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-stone-900 rounded-sm overflow-hidden border border-amber-500/40">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-600 to-teal-400 transition-all duration-300"
                      style={{
                        width: `${(gameState.hpAtual / gameState.hpMaximo) * 100}%`
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-stone-300 mt-1 font-semibold">
                    <span>
                      FOR: {gameState.ataqueBase} • CA: {gameState.defesa} • d20:{' '}
                      {Math.round(gameState.chanceCritico * 100)}%
                    </span>
                    {gameState.magoPresente && (
                      <span className="text-sky-300 font-bold">+Hypatia</span>
                    )}
                  </div>
                </div>
              </div>
            </MolduraDnD>

            {/* DIREITA (4 cols): Comandos de Turno, Bolsa & Crônicas da Batalha */}
            <MolduraDnD className="lg:col-span-4 p-4 flex flex-col justify-between gap-3 overflow-y-auto">
              <div className="space-y-3">
                <div className="border-b border-amber-600/25 pb-2 flex items-center justify-between">
                  <h3 className="font-dnd-title text-xs sm:text-sm font-extrabold text-amber-300 uppercase tracking-wider">
                    Comandos de Turno
                  </h3>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      turnoDoJogador
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                        : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {turnoDoJogador ? 'Sua Vez' : 'Turno de Cógon...'}
                  </span>
                </div>

                {/* Botões Principais */}
                <div className="grid grid-cols-2 lg:grid-cols-1 gap-2.5">
                  <button
                    type="button"
                    disabled={!turnoDoJogador || gameState.statusBatalha !== 'EM_ANDAMENTO'}
                    onClick={executarAtaqueJogador}
                    className="min-h-[50px] py-3 px-4 rounded-lg bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-40 text-stone-950 font-dnd-title font-black text-sm sm:text-base border border-amber-300/60 shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                  >
                    <Sword className="w-4 h-4" />
                    <span>Atacar com Arma</span>
                  </button>

                  <button
                    type="button"
                    disabled={!turnoDoJogador || gameState.statusBatalha !== 'EM_ANDAMENTO'}
                    onClick={() => setBolsaAberta(!bolsaAberta)}
                    className="min-h-[50px] py-3 px-4 rounded-lg bg-[#192338] hover:bg-[#22304d] disabled:opacity-40 text-sky-100 font-dnd-title font-black text-sm sm:text-base border border-sky-400/50 shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                  >
                    <Backpack className="w-4 h-4 text-sky-300" />
                    <span>
                      Bolsa ({gameState.inventario.reduce((acc, item) => acc + item.quantidade, 0)})
                    </span>
                  </button>
                </div>

                {/* Lista de Itens da Bolsa */}
                {bolsaAberta && (
                  <div className="p-2.5 rounded-lg bg-[#0d0a08] border border-sky-500/40 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-sky-300">
                      <span>🎒 Consumíveis (1 turno)</span>
                      <button
                        type="button"
                        onClick={() => setBolsaAberta(false)}
                        className="text-stone-400 hover:text-white cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                    {gameState.inventario.length === 0 ? (
                      <p className="text-xs text-stone-400 py-1">Bolsa vazia.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {gameState.inventario.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => usarItemBolsa(item.id)}
                            className="w-full p-2 rounded bg-[#18130f] hover:bg-[#241c16] border border-amber-500/35 text-left flex items-center gap-2 cursor-pointer"
                          >
                            <span className="text-lg">{item.icone}</span>
                            <div className="min-w-0">
                              <p className="font-bold text-xs text-amber-50 truncate">
                                {item.nome} ×{item.quantidade}
                              </p>
                              <p className="text-[10px] text-stone-400 truncate">
                                {item.descricao}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Crônicas da Batalha */}
              <div className="p-3 rounded-lg bg-[#0d0a08] border border-amber-600/25 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                  Crônicas do Combate
                </span>
                {logCombate.map((linha, i) => (
                  <p
                    key={i}
                    className={`text-xs leading-snug ${
                      i === 0 ? 'text-amber-100 font-bold' : 'text-stone-400'
                    }`}
                  >
                    {linha}
                  </p>
                ))}
              </div>
            </MolduraDnD>
          </div>
        )}

        {/* ================================================================== */}
        {/* TELA 5: EPÍLOGO DA CAMPANHA & BOLETIM FINAL (COMPACTO)             */}
        {/* ================================================================== */}
        {telaAtual === 'EPILOGO' && (() => {
          const venceu = gameState.statusBatalha === 'VITORIA';
          const epilogo = determinarEpilogo(venceu, gameState.acertosQuiz);
          const pontoBonus = venceu ? 1 : 0;
          const notaFinal = gameState.acertosQuiz + pontoBonus;

          return (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch max-w-5xl mx-auto w-full">
              <div
                className={`lg:col-span-6 relative rounded-xl border-2 ${epilogo.borda} bg-gradient-to-b ${epilogo.tema} overflow-hidden shadow-2xl flex flex-col justify-between text-center`}
              >
                <div className="relative h-40 sm:h-48 w-full border-b border-amber-500/30">
                  <CenarioPixelArt tipo={epilogo.cenarioId} />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#14110e] via-transparent to-transparent" />
                  <div className="absolute bottom-2 inset-x-0 text-4xl drop-shadow-lg">
                    {epilogo.icone}
                  </div>
                </div>

                <div className="p-5 space-y-2">
                  <span className="inline-block text-[11px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/35">
                    Epílogo da Campanha
                  </span>
                  <h2 className="font-dnd-title text-xl sm:text-2xl font-black text-amber-50">
                    {epilogo.titulo}
                  </h2>
                  <p className="text-xs font-bold text-amber-300">{epilogo.subtitulo}</p>
                  <p className="font-dnd-lore text-sm sm:text-base text-stone-200 leading-relaxed">
                    “{epilogo.texto}”
                  </p>
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
                        {gameState.jogador.nome} • {gameState.jogador.turma}
                      </p>
                    </div>

                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                        statusSalvamento?.modoProducao
                          ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40'
                          : 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      {statusSalvamento?.modoProducao
                        ? '🟢 Salvo na Planilha!'
                        : '🟡 Modo Teste'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5 text-center">
                    <div className="p-3 rounded-lg bg-[#0d0a08] border border-amber-600/25">
                      <span className="text-[11px] text-stone-400 block">Enigmas (Quiz)</span>
                      <strong className="font-dnd-title text-lg sm:text-xl font-black text-sky-400">
                        {gameState.acertosQuiz}/10
                      </strong>
                    </div>

                    <div className="p-3 rounded-lg bg-[#0d0a08] border border-amber-600/25">
                      <span className="text-[11px] text-stone-400 block">Bônus Dragão</span>
                      <strong
                        className={`font-dnd-title text-lg sm:text-xl font-black ${
                          venceu ? 'text-emerald-400' : 'text-stone-500'
                        }`}
                      >
                        +{pontoBonus} pt
                      </strong>
                    </div>

                    <div className="p-3 rounded-lg bg-[#0d0a08] border border-amber-400/55">
                      <span className="text-[11px] text-amber-300 block">Nota Final</span>
                      <strong className="font-dnd-title text-lg sm:text-xl font-black text-amber-400">
                        {notaFinal} pts
                      </strong>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                      Registro dos 10 Capítulos:
                    </span>
                    <div className="grid grid-cols-5 gap-1.5">
                      {historicoRespostas.map((resp) => (
                        <div
                          key={resp.etapa}
                          title={`Etapa ${resp.etapa}: ${resp.tema} (${
                            resp.acertou ? 'Acertou' : 'Errou'
                          })`}
                          className={`py-1.5 rounded text-center text-xs font-extrabold border ${
                            resp.acertou
                              ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                              : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                          }`}
                        >
                          Q{resp.etapa}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={reiniciarParaInicio}
                    className="flex-1 py-3 px-4 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-stone-950 font-dnd-title font-black text-sm border border-amber-300/60 shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Nova Campanha</span>
                  </button>

                  <button
                    type="button"
                    onClick={baixarComprovanteCSV}
                    className="py-3 px-4 rounded-lg bg-[#221b15] hover:bg-[#2d231b] text-amber-100 font-bold text-xs sm:text-sm border border-amber-600/35 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-amber-400" />
                    <span>Baixar Ficha (.CSV)</span>
                  </button>
                </div>
              </MolduraDnD>
            </div>
          );
        })()}
      </main>
    </div>
  );
}