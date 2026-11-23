# 🎮 Math RPG — Jogo de Matemática com Registro em Planilha Google

Jogo educativo em **React + Vite** onde o aluno enfrenta desafios de matemática ao lado
do Herói e da Arquimaga Hypatia. Ao final de cada partida, os dados do aluno
(nome, turma, acertos, se derrotou o dragão, nota final e data/hora) são enviados
automaticamente para uma **planilha Google**.

Este README explica **do zero** como:
1. Baixar e rodar o projeto no seu computador;
2. Criar e conectar a planilha Google (via Google Apps Script);
3. Publicar o jogo online (opcional);
4. Resolver os problemas mais comuns.

---

## 📋 Índice

- [🎮 Math RPG — Jogo de Matemática com Registro em Planilha Google](#-math-rpg--jogo-de-matemática-com-registro-em-planilha-google)
  - [📋 Índice](#-índice)
  - [✅ O que você vai precisar](#-o-que-você-vai-precisar)
  - [🚀 Passo 1 — Baixar e rodar o projeto](#-passo-1--baixar-e-rodar-o-projeto)
    - [1.1 Clonar o repositório](#11-clonar-o-repositório)
    - [1.2 Instalar as dependências](#12-instalar-as-dependências)
    - [1.3 Rodar em modo de desenvolvimento](#13-rodar-em-modo-de-desenvolvimento)
  - [🖼️ Passo 2 — Adicionar as imagens (opcional)](#️-passo-2--adicionar-as-imagens-opcional)
  - [📊 Passo 3 — Criar a planilha Google](#-passo-3--criar-a-planilha-google)
    - [3.1 Criar a planilha](#31-criar-a-planilha)
    - [3.2 Sobre as abas](#32-sobre-as-abas)
  - [⚙️ Passo 4 — Colar o código no Apps Script e publicar](#️-passo-4--colar-o-código-no-apps-script-e-publicar)
    - [4.1 Abrir o editor](#41-abrir-o-editor)
    - [4.2 Colar o código](#42-colar-o-código)
    - [4.3 Publicar como Web App](#43-publicar-como-web-app)
  - [🔌 Passo 5 — Conectar a planilha ao projeto (.env)](#-passo-5--conectar-a-planilha-ao-projeto-env)
    - [5.1 Criar o arquivo `.env`](#51-criar-o-arquivo-env)
    - [5.2 ⚠️ Nunca suba o `.env` para o GitHub](#52-️-nunca-suba-o-env-para-o-github)
    - [5.3 Reiniciar o servidor](#53-reiniciar-o-servidor)
  - [🧪 Passo 6 — Testar se está funcionando](#-passo-6--testar-se-está-funcionando)
  - [🌐 Passo 7 — Publicar online (opcional)](#-passo-7--publicar-online-opcional)
    - [Opção A — Vercel (recomendado)](#opção-a--vercel-recomendado)
    - [Opção B — Netlify](#opção-b--netlify)
  - [📁 Estrutura do projeto](#-estrutura-do-projeto)
  - [🛠️ Problemas comuns](#️-problemas-comuns)
  - [🔍 Como funciona por baixo dos panos](#-como-funciona-por-baixo-dos-panos)

---

## ✅ O que você vai precisar

Antes de começar, tenha instalado/em mãos:

- [Node.js 18 ou superior](https://nodejs.org/) (inclui o `npm`);
- Uma **conta Google** (para a planilha);
- Uma **conta GitHub** (para hospedar o código);
- (Opcional) Conta gratuita na **Vercel** ou **Netlify** para publicar online.

Para conferir se o Node está instalado, abra o terminal e rode:

```bash
node -v
npm -v
```

Se aparecerem números de versão (ex.: `v20.11.0`), está tudo certo.

---

## 🚀 Passo 1 — Baixar e rodar o projeto

### 1.1 Clonar o repositório

```bash
git clone https://github.com/SEU_USUARIO/math-rpg.git
cd math-rpg
```

> Se você não usa Git, também pode baixar o ZIP em **Code → Download ZIP** e extrair.

### 1.2 Instalar as dependências

```bash
npm install
```

Isso instala React, Vite, Tailwind, Lucide e tudo que o projeto precisa.

### 1.3 Rodar em modo de desenvolvimento

```bash
npm run dev
```

Abra o endereço que aparecer no terminal (geralmente **http://localhost:5173**).
O jogo deve carregar no navegador. 🎉

> **Atenção:** o jogo vai funcionar, mas **ainda não salva na planilha** até você fazer os Passos 3 a 5.

---

## 🖼️ Passo 2 — Adicionar as imagens (opcional)

O jogo já vem com um **desenho 16-bits** de fallback. Se quiser usar seus PNGs,
crie a pasta e coloque os arquivos com estes nomes exatos:

```
public/
└── assets/
    └── images/
        ├── heroi_frente.png
        ├── heroi_costas.png
        ├── ipatia_frente.png
        ├── ipatia_costas.png
        ├── cogon.png
        └── forja.png
```

Enquanto o arquivo não existir, o jogo usa o desenho 16-bits; quando você adicionar
o PNG, ele passa a usar a imagem automaticamente.

---

## 📊 Passo 3 — Criar a planilha Google

### 3.1 Criar a planilha

1. Acesse <https://sheets.google.com> e clique em **Em branco**.
2. Dê um nome à planilha (ex.: `Math RPG — Notas`).
3. Na parte de baixo, crie **uma aba para cada turma**, com o nome exato
   que você quer que o jogo use. Exemplos:
   - `1º Ano A`
   - `1º Ano B`
   - `2º Ano A`

> **Não digite nada nas células.** O código do Apps Script cria e formata
> os cabeçalhos automaticamente (Nome do Aluno, Turma, Acertos Quiz, etc.).

### 3.2 Sobre as abas

- O código ignora abas padrão (`Sheet1`, `Página1` etc.).
- Qualquer aba com nome diferente vira uma "turma" no jogo.
- A aba **só é criada no jogo** se já existir na planilha — crie todas antes de jogar.

---

## ⚙️ Passo 4 — Colar o código no Apps Script e publicar

O **Google Apps Script** é o "motor" que recebe os dados do jogo e escreve na planilha.

### 4.1 Abrir o editor

1. Na planilha, clique no menu **Extensões → Apps Script**.
2. Apague **todo** o conteúdo que aparecer (`function myFunction() {}` etc.).

### 4.2 Colar o código

Copie o código abaixo e cole no editor:

```javascript
const CABECALHO = [
  'Nome do Aluno',
  'Turma',
  'Acertos Quiz',
  'Derrotou Dragão',
  'Ponto Bônus',
  'Nota Final',
  'Data/Hora'
];

const ABAS_PADRAO = ['página1', 'pagina1', 'sheet1', 'folha1', 'planilha1'];

function organizarAba(aba) {
  if (!aba) return;
  const linha1 = aba.getRange(1, 1, 1, CABECALHO.length).getValues()[0];
  if (linha1[0] !== 'Nome do Aluno') {
    if (aba.getLastRow() > 0 && String(linha1[0]).trim() !== '') {
      aba.insertRowBefore(1);
    }
    const topo = aba.getRange(1, 1, 1, CABECALHO.length);
    topo.setValues([CABECALHO])
        .setFontWeight('bold')
        .setBackground('#1c1917')
        .setFontColor('#fbbf24')
        .setHorizontalAlignment('center');
    aba.setFrozenRows(1);
    aba.autoResizeColumns(1, CABECALHO.length);
  }
}

function doGet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const turmas = [];
  ss.getSheets().forEach(function (aba) {
    const nome = aba.getName().trim();
    if (!ABAS_PADRAO.includes(nome.toLowerCase())) {
      organizarAba(aba);
      turmas.push(nome);
    }
  });
  return ContentService
    .createTextOutput(JSON.stringify({ turmas: turmas }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const dados = JSON.parse(e.postData.contents);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let aba = ss.getSheetByName(dados.turma) || ss.insertSheet(dados.turma);
  organizarAba(aba);
  aba.appendRow([
    dados.nomeAluno,
    dados.turma,
    dados.acertosQuiz,
    dados.derrotouDragao,
    dados.pontoBonus,
    dados.notaFinal,
    dados.dataHora
  ]);
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

Salve com **Ctrl + S** (ou ⌘ + S).

### 4.3 Publicar como Web App

1. Clique no botão azul **Implantar → Nova implantação**.
2. Clique na **engrenagem ⚙️** ao lado de "Selecionar tipo" e escolha **App da Web**.
3. Preencha:
   - **Descrição:** `Math RPG API` (qualquer coisa).
   - **Executar como:** `Eu (seu-email@gmail.com)`.
   - **Quem pode acessar:** `Qualquer pessoa`.
4. Clique em **Implantar**.
5. O Google vai pedir autorização. Clique em **Autorizar acesso**, escolha sua conta,
   clique em **Avançado → Ir para (nome do projeto) (não seguro)** e **Permitir**.
   > Isso é normal: o Apps Script sempre mostra esse aviso quando o app é seu.
6. Ao final, **copie a URL** que termina com `/exec`. Exemplo:
   ```
   https://script.google.com/macros/s/AKfy.../exec
   ```

> **Importante:** se você alterar o código do Apps Script depois, precisa clicar em
> **Implantar → Gerenciar implantações → ✏️ Editar → Versão: Nova versão → Implantar**.
> Senão a planilha continua usando o código antigo.

---

## 🔌 Passo 5 — Conectar a planilha ao projeto (.env)

### 5.1 Criar o arquivo `.env`

Na **raiz do projeto** (mesma pasta do `package.json`), crie um arquivo chamado
`.env` (só isso, sem extensão) e coloque:

```env
VITE_GOOGLE_SHEETS_URL=https://script.google.com/macros/s/COLE_SUA_URL_AQUI/exec
```

Substitua `COLE_SUA_URL_AQUI` pela URL copiada no Passo 4.3.

### 5.2 ⚠️ Nunca suba o `.env` para o GitHub

A URL do Apps Script é como uma "senha": qualquer pessoa com ela pode escrever na
sua planilha. Por isso:

1. Abra o `.gitignore` na raiz do projeto.
2. Confirme que existe a linha `.env` (se não existir, adicione):

```gitignore
node_modules
dist
dist-ssr
*.local
.env
```

3. Crie também um arquivo **`.env.example`** (esse sim vai para o GitHub) só com o
   modelo, para o professor saber o que preencher:

```env
VITE_GOOGLE_SHEETS_URL=https://script.google.com/macros/s/COLE_SUA_URL_AQUI/exec
```

### 5.3 Reiniciar o servidor

Sempre que criar ou alterar o `.env`, **pare o terminal (Ctrl + C) e rode de novo**:

```bash
npm run dev
```

O Vite só lê o `.env` na inicialização.

---

## 🧪 Passo 6 — Testar se está funcionando

1. Abra o jogo em `http://localhost:5173`.
2. Jogue uma partida preenchendo o nome e escolhendo uma turma que exista na planilha.
3. Termine o jogo.
4. Volte na planilha Google e atualize a página (F5).
5. Deve aparecer **uma nova linha** na aba da turma com os dados do aluno.

Se apareceu: 🎉 **tudo conectado.** Se não apareceu, veja a seção
[Problemas comuns](#-problemas-comuns).

---

## 🌐 Passo 7 — Publicar online (opcional)

Para os alunos acessarem pelo celular, publique gratuitamente na **Vercel** ou **Netlify**.

### Opção A — Vercel (recomendado)

1. Suba o projeto para o GitHub:
   ```bash
   git init
   git add .
   git commit -m "Primeiro commit - Math RPG"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/math-rpg.git
   git push -u origin main
   ```
2. Acesse <https://vercel.com>, clique em **Add New → Project** e importe o repositório.
3. Em **Environment Variables**, adicione:
   - **Name:** `VITE_GOOGLE_SHEETS_URL`
   - **Value:** a mesma URL do `/exec`
4. Clique em **Deploy**.

### Opção B — Netlify

1. Importe o repositório em <https://app.netlify.com>.
2. **Build command:** `npm run build`
3. **Publish directory:** `dist`
4. Em **Site settings → Environment variables**, adicione `VITE_GOOGLE_SHEETS_URL`.
5. Faça o deploy.

> Em ambos os casos, **sempre que trocar a URL do Apps Script**, atualize a variável
> no painel da Vercel/Netlify e faça um novo deploy.

---

## 📁 Estrutura do projeto

```
math-rpg/
├── public/
│   └── assets/
│       └── images/          ← PNGs do herói, Hypatia, etc. (opcional)
├── src/
│   ├── App.jsx              ← código do jogo
│   ├── index.css            ← importa Tailwind
│   └── main.jsx             ← ponto de entrada do React
├── .env                     ← URL do Apps Script (NÃO versionar)
├── .env.example             ← modelo da variável (versionar)
├── .gitignore
├── index.html
├── package.json
└── vite.config.js           ← plugins React + Tailwind
```

---

## 🛠️ Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| Nada é salvo na planilha | `.env` não existe ou está com URL errada | Confira a URL no `.env` (termina com `/exec`), reinicie `npm run dev`. |
| Nada é salvo na planilha | Implantação do Apps Script não é "Qualquer pessoa" | Refaça o Passo 4.3 marcando **Quem pode acessar: Qualquer pessoa**. |
| Nada é salvo na planilha | Código do Apps Script alterado mas não reimplantado | **Implantar → Gerenciar implantações → Editar → Nova versão → Implantar**. |
| Aba da turma não aparece no jogo | A aba não existe na planilha | Crie a aba com o mesmo nome que o jogo usa (ex.: `1º Ano A`). |
| Cabeçalhos não aparecem | Aba já tinha conteúdo na linha 1 | O script insere uma linha acima; confira e apague manualmente se precisar. |
| Funciona local, mas não na Vercel/Netlify | Variável não configurada no painel | Adicione `VITE_GOOGLE_SHEETS_URL` no painel e faça novo deploy. |
| Erro "Falha ao buscar turmas" | URL do Apps Script inválida ou implantação removida | Gere nova implantação e atualize a URL no `.env` e no painel de deploy. |
| `.env` foi commitado por engano | `.gitignore` não o incluía | Remova do Git: `git rm --cached .env`, adicione ao `.gitignore`, gere nova implantação (a URL antiga vazou). |

---

## 🔍 Como funciona por baixo dos panos

Para quem quiser entender (ou adaptar):

- **Front-end (React/Vite):** ao final do jogo, o código faz um `POST` para a URL
  `VITE_GOOGLE_SHEETS_URL` enviando um JSON:
  ```json
  {
    "nomeAluno": "Maria",
    "turma": "1º Ano A",
    "acertosQuiz": 8,
    "derrotouDragao": true,
    "pontoBonus": 2,
    "notaFinal": 9.0,
    "dataHora": "2025-01-01 14:30"
  }
  ```
- **Apps Script `doPost`:** recebe esse JSON, procura (ou cria) a aba com o nome da
  turma, garante os cabeçalhos e adiciona uma linha.
- **Apps Script `doGet`:** devolve a lista de abas (turmas) para o jogo preencher o
  seletor de turma.
- **`organizarAba`:** cria/estiliza os cabeçalhos na primeira vez que a aba é usada.

É só isso — não é mágica, é uma API minúscula que escreve em uma planilha. 😉

---

Feito com ❤️ para professores de matemática que querem gamificar a sala.