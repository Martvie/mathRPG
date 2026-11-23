import { Questao } from "./Tipos";

export const BANCO_QUESTOES_EXTRAS: Questao[] = [
    // --- BLOCO 1: A Armaria de Poliedra ---
    {
        id: "E01",
        bloco: 1,
        tema: "PA • Expressão Algébrica",
        enunciado: "Em uma PA, os três primeiros termos são expressos por (x + 1, 2x + 3, 4x + 1). Qual é o valor da razão r dessa progressão?",
        alternativas: ["4", "5", "6", "8"],
        correta: 2,
        justificativa: "Pela propriedade do termo médio: 2(2x + 3) = (x + 1) + (4x + 1) ⇒ 4x + 6 = 5x + 2 ⇒ x = 4. Assim, a PA é (5, 11, 17) e sua razão é r = 11 - 5 = 6.",
    },
    {
        id: "E02",
        bloco: 1,
        tema: "PG • Razão com Frações",
        enunciado: "Considere a Progressão Geométrica: (3/4, 3/2, 3, 6, ...). Qual é o 7º termo (a₇) dessa sequência?",
        alternativas: ["24", "36", "48", "96"],
        correta: 2,
        justificativa: "A razão é q = (3/2) ÷ (3/4) = 2. Logo, a₇ = a₁ · q⁶ = (3/4) · 64 = 48.",
    },
    {
        id: "E03",
        bloco: 1,
        tema: "PA vs PG • Comparação",
        enunciado: "Uma PA e uma PG têm o mesmo primeiro termo a₁ = 2. Se a razão da PA é r = 5 e a razão da PG é q = 3, qual é a diferença entre o 4º termo da PG e o 4º termo da PA?",
        alternativas: ["32", "35", "37", "42"],
        correta: 2,
        justificativa: "Na PG: a₄ = 2 · 3³ = 54. Na PA: a₄ = 2 + 3 · 5 = 17. A diferença entre eles é 54 - 17 = 37.",
    },
    {
        id: "E04",
        bloco: 1,
        tema: "PA • Primeiro Termo Negativo",
        enunciado: "Dada a PA decrescente (47, 41, 35, 29, ...), qual é o primeiro termo negativo dessa sequência?",
        alternativas: ["-1", "-2", "-5", "-6"],
        correta: 0,
        justificativa: "A razão é r = -6. Subtraindo 6 sucessivamente: 29, 23, 17, 11, 5, -1. O primeiro termo negativo é -1 (9º termo).",
    },

    // --- BLOCO 2: Suprimentos e Artefatos ---
    {
        id: "E05",
        bloco: 2,
        tema: "PA • Sistema de Termos",
        enunciado: "Em uma Progressão Aritmética, o 3º termo é 14 e o 8º termo é 39. Qual é o valor do 15º termo (a₁₅) dessa PA?",
        alternativas: ["69", "74", "79", "84"],
        correta: 1,
        justificativa: "a₈ - a₃ = 5r ⇒ 39 - 14 = 25 ⇒ r = 5. Como a₃ = a₁ + 2r, temos a₁ = 14 - 10 = 4. Assim, a₁₅ = 4 + 14 · 5 = 74.",
    },
    {
        id: "E06",
        bloco: 2,
        tema: "PG • Termos Distantes",
        enunciado: "Em uma Progressão Geométrica crescente, o 2º termo é 6 e o 5º termo é 162. Qual é o valor do 1º termo (a₁)?",
        alternativas: ["1", "2", "3", "4"],
        correta: 1,
        justificativa: "a₅ = a₂ · q³ ⇒ 162 = 6q³ ⇒ q³ = 27 ⇒ q = 3. Como a₂ = a₁ · q, temos 6 = a₁ · 3 ⇒ a₁ = 2.",
    },
    {
        id: "E07",
        bloco: 2,
        tema: "PA • Interpolação Aritmética",
        enunciado: "Inserindo-se 4 meios aritméticos entre 8 e 43, qual será o 3º meio aritmético inserido (o 4º termo da PA)?",
        alternativas: ["22", "27", "29", "36"],
        correta: 2,
        justificativa: "Com 4 meios inseridos, temos 6 termos: 43 = 8 + 5r ⇒ r = 7. A PA é (8, 15, 22, 29, 36, 43), logo o 3º meio é 29.",
    },
    {
        id: "E08",
        bloco: 2,
        tema: "PG • Crescimento Exponencial",
        enunciado: "Uma colônia de esporos mágicos triplica de quantidade a cada 30 minutos. Se inicialmente havia 4 esporos, após quanto tempo haverá 972 esporos?",
        alternativas: ["120 minutos", "150 minutos", "180 minutos", "210 minutos"],
        correta: 1,
        justificativa: "4 · 3ᵏ = 972 ⇒ 3ᵏ = 243 = 3⁵ ⇒ k = 5 ciclos de 30 minutos = 150 minutos.",
    },

    // --- BLOCO 3: O Pacto de Hypatia ---
    {
        id: "E09",
        bloco: 3,
        tema: "PG • Termo Médio Algébrico",
        enunciado: "Os termos positivos (x - 2, x + 2, 3x - 2) formam, nessa ordem, uma Progressão Geométrica. Qual é a razão q dessa PG?",
        alternativas: ["2", "3", "4", "6"],
        correta: 0,
        justificativa: "(x + 2)² = (x - 2)(3x - 2) ⇒ x² + 4x + 4 = 3x² - 8x + 4 ⇒ 2x² = 12x ⇒ x = 6. A PG é (4, 8, 16), cuja razão é q = 2.",
    },
    {
        id: "E10",
        bloco: 3,
        tema: "PA • Simetria dos Termos",
        enunciado: "Em uma Progressão Aritmética, sabe-se que a₅ + a₁₆ = 64. Qual é o valor de a₂ + a₁₉ nessa mesma PA?",
        alternativas: ["32", "48", "64", "128"],
        correta: 2,
        justificativa: "Pela propriedade dos termos equidistantes em PA, como 2 + 19 = 5 + 16 = 21, temos a₂ + a₁₉ = a₅ + a₁₆ = 64.",
    },
    {
        id: "E11",
        bloco: 3,
        tema: "PG • Razão Negativa",
        enunciado: "Em uma PG de razão negativa, o 1º termo é 5 e o 3º termo é 45. Qual é o valor do 4º termo (a₄)?",
        alternativas: ["-135", "135", "-90", "-45"],
        correta: 0,
        justificativa: "45 = 5 · q² ⇒ q² = 9. Como a razão é negativa, q = -3. Assim, a₄ = 45 · (-3) = -135.",
    },
    {
        id: "E12",
        bloco: 3,
        tema: "PA • Múltiplos em Intervalo",
        enunciado: "Quantos múltiplos de 6 existem entre 15 e 140?",
        alternativas: ["19", "20", "21", "22"],
        correta: 2,
        justificativa: "O primeiro múltiplo é 18 e o último é 138. Pela fórmula: 138 = 18 + (n - 1)·6 ⇒ 120 = 6(n - 1) ⇒ n = 21.",
    },

    // --- BLOCO 4: O Santuário do Pico ---
    {
        id: "E13",
        bloco: 4,
        tema: "PA • Soma dos 20 Termos",
        enunciado: "Para abrir o Selo de Obsidiana, calcule a soma dos 20 primeiros termos da PA: (4, 7, 10, 13, ...).",
        alternativas: ["610", "630", "650", "670"],
        correta: 2,
        justificativa: "a₂₀ = 4 + 19 · 3 = 61. Aplicando a soma da PA: S₂₀ = (4 + 61) · 20 ÷ 2 = 65 · 10 = 650.",
    },
    {
        id: "E14",
        bloco: 4,
        tema: "PG • Soma dos 6 Termos",
        enunciado: "Um cristal multiplica sua carga segundo a PG (3, 6, 12, 24, ...). Qual é a soma dos 6 primeiros termos dessa PG?",
        alternativas: ["96", "186", "189", "192"],
        correta: 2,
        justificativa: "S₆ = a₁ · (q⁶ - 1) ÷ (q - 1) = 3 · (64 - 1) ÷ 1 = 3 · 63 = 189.",
    },
    {
        id: "E15",
        bloco: 4,
        tema: "PA • Número de Termos pela Soma",
        enunciado: "Um guardião empilha runas em PA: 2 na 1ª fileira, 5 na 2ª, 8 na 3ª, e assim por diante. Se ele usou 155 runas ao todo, quantas fileiras foram montadas?",
        alternativas: ["8 fileiras", "9 fileiras", "10 fileiras", "11 fileiras"],
        correta: 2,
        justificativa: "Sₙ = [2a₁ + (n - 1)r] · n ÷ 2 = (3n + 1)n ÷ 2 = 155. Testando n = 10: (31 · 10) ÷ 2 = 155 fileiras.",
    },
    {
        id: "E16",
        bloco: 4,
        tema: "PG Infinita • Soma Convergente",
        enunciado: "Uma runa arcana libera energia infinita seguindo a PG decrescente: (24, 12, 6, 3, ...). Qual é o valor da soma infinita (S∞) dessa progressão?",
        alternativas: ["36", "45", "48", "60"],
        correta: 2,
        justificativa: "Para |q| < 1, usamos S∞ = a₁ ÷ (1 - q) = 24 ÷ (1 - 1/2) = 24 ÷ 0,5 = 48.",
    },
];

export function sortearQuestaoExtra(blocoPreferencial: 1 | 2 | 3 | 4, idsJaUsados: Set<string>): Questao {
    const doMesmoBloco = BANCO_QUESTOES_EXTRAS.filter((q) => q.bloco === blocoPreferencial && !idsJaUsados.has(q.id));
    const qualquerInedita = BANCO_QUESTOES_EXTRAS.filter((q) => !idsJaUsados.has(q.id));

    const pool = doMesmoBloco.length > 0 ? doMesmoBloco : qualquerInedita.length > 0 ? qualquerInedita : BANCO_QUESTOES_EXTRAS;

    return pool[Math.floor(Math.random() * pool.length)];
}
