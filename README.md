# Porto Seguro

Sistema moderno, intuitivo e responsivo para gestão preventiva de Saúde e Segurança do Trabalho (**SST**), monitoramento de **ASOs** (Atestados de Saúde Ocupacional), exames admissionais, periódicos, demissionais e conformidade com as Normas Regulamentadoras (**NR-07 / PCMSO**, **NR-01**, **NR-09**).

---

## 📋 Sumário

- [Visão Geral](#-visão-geral)
- [Funcionalidades Principais](#-funcionalidades-principais)
- [Arquitetura & Engenharia de Frontend](#-arquitetura--engenharia-de-frontend)
- [Design System & UI/UX Responsivo](#-design-system--uiux-responsivo)
  - [Experiência Mobile Especializada (320px a 768px)](#experiência-mobile-especializada-320px-a-768px)
- [Estrutura de Arquivos](#-estrutura-de-arquivos)
- [Armazenamento e Persistência (Local-First)](#-armazenamento-e-persistência-local-first)
- [Como Executar o Projeto](#-como-executar-o-projeto)
- [Regras de Negócio e Cálculos de Validade](#-regras-de-negócio-e-cálculos-de-validade)
- [Acessibilidade e Boas Práticas](#-acessibilidade-e-boas-práticas)

---

## 🌟 Visão Geral

O **Porto Seguro · Gestão Ocupacional** é uma aplicação web no modelo **Single Page Application (SPA)** desenvolvida em **Vanilla JavaScript (ES Modules), HTML5 e CSS3 modular**, projetada para substituir planilhas fragmentadas por um painel centralizado, responsivo e de alta legibilidade.

O sistema permite a equipes de RH, SESMT e clínicas ocupacionais controlar prontuários, programar renovações antes do vencimento legal, anexar laudos digitais e emitir relatórios auditáveis com privacidade **Local-First**.

---

## 🚀 Funcionalidades Principais

### 1. Dashboard Executivo & Monitoramento em Tempo Real

- **Métricas Globais (KPIs) com Contadores Animados:** Total de exames, colaboradores ativos, exames em dia, a vencer (próximos 30 dias) e vencidos, com transição numérica progressiva (`requestAnimationFrame`).
- **Gráfico de Evolução (Últimos 12 Meses):** Distribuição mensal de exames realizados com destaque para o mês corrente e valores exibidos acima de cada barra.
- **Painel Histórico Ocupacional Dividido:** Seleção rápida de colaborador à esquerda (lista vertical no desktop / carrossel horizontal com _scroll-snap_ no mobile) e linha do tempo cronológica de exames à direita.
- **Auditoria de Conformidade Geral:** Percentual dinâmico de colaboradores em situação regular perante as NRs com barra de progresso e mini-sparklines.
- **Próximos Vencimentos & Distribuição por Tipo:** Alertas ordenados por urgência com contagem regressiva de dias e barras de participação percentual por procedimento.

### 2. Gestão de Trabalhadores

- Cadastro, consulta, edição e exclusão em cascata de colaboradores.
- Campos estruturados: Nome completo, CPF (com máscara automática e validação matemática dos dígitos verificadores), cargo/setor e empresa/unidade.
- Geração dinâmica de avatares com paleta pastel determinística e iniciais do colaborador.
- Contadores de exames vinculados e badges de conformidade individual.

### 3. Registro de Exames & ASOs

- Registro de exames vinculados ao trabalhador (**ASO**, **Admissional**, **Periódico**, **Demissional**, **Audiometria** e **Ultrassom**).
- Definição de clínica/laboratório, médico responsável com registro de classe (CRM/CRFa), data de realização e data de vencimento.
- **Automação Inteligente:** Ao preencher a data de realização, o sistema sugere automaticamente o vencimento para **+1 ano** e valida que a validade seja posterior à realização.

### 4. Anexos e Documentos Digitais

- **Link externo:** Integração com Google Drive, SharePoint, OneDrive ou URLs HTTPS.
- **Arquivo local (Upload / Drag & Drop):** Armazenamento de PDFs e imagens (PNG, JPG) de até 10 MB no navegador.
- **Visualizador Integrado:** Modal nativo para leitura direta do PDF ou imagem e opção de abertura em nova aba.

### 5. Relatórios, Auditoria Preventiva & Modo Demonstração

- Painel focado em auditorias com índice de conformidade, contagem de pendências e recomendações individuais (_Irregular_, _Atenção_, _Em dia_, _Sem registros_).
- **Exportação CSV:** Download de planilha formatada com BOM UTF-8 compatível com Excel e Google Planilhas.
- **Modo Impressão / PDF Otimizado:** Folha de estilos `@media print` dedicada que oculta menus, filtros e barras móveis para impressão limpa ou salvamento em PDF.
- **Ferramentas para Pitch / Demonstração:**
  - Botão **"Preencher exemplo"** nos modais de _Novo Trabalhador_ (gera dados completos com CPF válido e único) e _Registrar Exame_ em 1 clique.
  - Botão **"Resetar Demo"** em _Relatórios_ para restaurar os 5 trabalhadores e 8 exames originais após testes ao vivo.

### 6. Busca Global & Filtros Dinâmicos

- **Busca Instantânea:** Atalho de teclado `/` para focar o campo; filtra por nome, CPF, empresa, setor, tipo de exame, laboratório ou médico.
- **Filtros Combinados & Atalhos via KPI:** Filtragem simultânea por tipo, status e ordenação, além de clique direto nos cards de KPI do dashboard.

---

## 🛠️ Arquitetura & Engenharia de Frontend

A aplicação foi estruturada sem frameworks ou etapas de build, mantendo separação clara de responsabilidades:

- **Zero Build / Zero Dependências:** Roda diretamente no navegador utilizando padrões nativos da Web (**ES6 Modules** e **`@import` CSS**).
- **Arquitetura JavaScript Modular (`js/modules/`):**
  - `state.js`: Estado reativo centralizado, seletores, regras de filtragem, cálculos de conformidade e sanitização HTML (`esc`).
  - `navigation.js`: Roteamento entre views, gaveta lateral mobile, controle de modais/_bottom-sheets_, restauração de foco, visualizador de documentos e exportação CSV/impressão.
  - `tables.js`: Renderização reativa do Dashboard, gráficos, linha do tempo, grid de colaboradores e tabelas adaptáveis (`data-label`).
  - `forms.js`: Validação inline por campo com rolagem e foco automáticos no primeiro erro, upload _drag-and-drop_ e gerador de exemplos para demonstração.
  - `animations.js`: Contadores numéricos progressivos e sistema de notificações _toast_ acessíveis (`aria-live`).
- **Arquitetura CSS Escalável (`css/`):** Dividida em tokens fluidos, estilos base, layout responsivo, componentes e animações.

---

## 🎨 Design System & UI/UX Responsivo

Baseado nos princípios de **Soft UI / Flat 2.0**, com escala fluida (`clamp()`) que se adapta continuamente de `320px` a `1640px`:

- **Tipografia:** `Plus Jakarta Sans` com `font-variant-numeric: tabular-nums` nos indicadores e datas.
- **Paleta Semântica:**
  - Primária (Porto Seguro): `#2f68ee`
  - Válido / Em dia: `#059669` (fundo `#ecfdf5`)
  - A vencer (30 dias): `#d97706` (fundo `#fffbeb`)
  - Vencido / Crítico: `#e11d48` (fundo `#fff1f2`)
- **Proteção de Sticky & Overflow:** Uso de `overflow-x: clip` no container raiz, eliminando rolagem horizontal acidental sem quebrar o `position: sticky` da sidebar e cabeçalhos.

---

### Experiência Mobile Especializada (320px a 768px)

Projetada segundo as diretrizes da **Apple Human Interface Guidelines** e do **Google Material Design**, com áreas de toque mínimas de `44px–48px` e suporte a `safe-area-inset-bottom`:

| Componente                            | Desktop (> 900px)             | Mobile (320px a 768px)                                                                                   |
| ------------------------------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------- |
| **Navegação Principal**               | Sidebar fixa lateral de 260px | **Barra Inferior Fixa (Bottom Nav)** + Drawer lateral deslizante com botão fechar (**X**)                |
| **Ação Rápida**                       | Botão no topo                 | **Botão Central Flutuante (FAB)** na barra inferior para registro imediato de exames                     |
| **Cabeçalho (Topbar)**                | Linha única horizontal        | 2 níveis: Menu, marca e ações na linha 1; Busca em **100% de largura** na linha 2                        |
| **Filtros**                           | Barra horizontal compacta     | Grid adaptativo (2 colunas em smartphones, 1 coluna em telas `<= 400px`)                                 |
| **Lista de Colaboradores**            | Coluna vertical fixa          | Carrossel horizontal com _scroll-snap_ e rolagem automática para o histórico                             |
| **Tabelas (`Exames` e `Relatórios`)** | Tabela tradicional em colunas | **Cards empilhados (`<= 680px`)** via atributos `data-label`, com ações em largura total na base         |
| **Formulários / Modais**              | Caixa centralizada com blur   | **Bottom Sheet deslizante** com alça visual e inputs de **16px** (previne zoom automático no iOS Safari) |

---

## 📁 Estrutura de Arquivos

```text
porto-seguro/
│
├── index.html                 # Estrutura semântica SPA, views, modais e barra mobile
├── README.md                  # Documentação técnica e funcional do projeto
│
├── css/
│   ├── main.css               # Ponto de entrada CSS (@import dos módulos)
│   ├── tokens.css             # Design tokens, escalas fluidas clamp(), cores e z-index
│   ├── base.css               # Reset moderno, tipografia, scrollbars e @media print
│   ├── layout.css             # Grid principal, sidebar, topbar e breakpoints responsivos
│   ├── components.css         # Cards, KPIs, modais/bottom-sheets e tabelas em cards mobile
│   └── animations.css         # Transições de view, stagger, barras animadas e reduced-motion
│
└── js/
    ├── data.js                # Persistência (LocalStorage + IndexedDB), seed demo e regras de CPF/data
    ├── main.js                # Orquestrador da SPA, delegação de eventos e atalhos de teclado
    └── modules/
        ├── state.js           # Estado central, seletores, filtros, métricas e sanitização XSS
        ├── navigation.js      # Navegação SPA, drawer, modais, visualizador e exportação CSV/PDF
        ├── tables.js          # Renderização de Dashboard, gráficos, timeline, cards e tabelas
        ├── forms.js           # Validação inline, upload drag-and-drop e preenchimento demo
        └── animations.js      # Contadores numéricos animados e notificações toast
```

---

## 💾 Armazenamento e Persistência (Local-First)

1. **LocalStorage (`localStorage`):**
   - Armazena listas de trabalhadores e exames em JSON com fallback automático para memória caso o navegador restrinja armazenamento local.
2. **IndexedDB (`fileStore`):**
   - Armazena arquivos binários (**Blobs de PDF e imagens**) de até 10 MB, evitando o limite de ~5 MB do LocalStorage.
3. **Dados Demonstrativos (Seed Inicial):**
   - Carrega automaticamente 5 trabalhadores e 8 exames realistas no primeiro acesso, podendo ser restaurados a qualquer momento pelo botão **Resetar Demo**.

---

## 💻 Como Executar o Projeto

> **Importante:** Como o projeto utiliza **JavaScript ES Modules nativos** (`<script type="module">`), os navegadores bloqueiam o carregamento modular quando o `index.html` é aberto diretamente pelo sistema de arquivos (`file://`). Execute sempre através de um servidor HTTP local:

### Opção 1: Extensão Live Server (VS Code)

Clique com o botão direito em `index.html` e selecione **"Open with Live Server"**.

### Opção 2: Via Python

```bash
python -m http.server 8000
```

Acesse: `http://localhost:8000`

### Opção 3: Via Node.js (`npx`)

```bash
npx serve .
```

---

## ⚖️ Regras de Negócio e Cálculos de Validade

- **Válido / Em dia (`validos`):** Data de vencimento superior a **30 dias** a partir da data atual.
- **A vencer / Alerta (`alerta`):** Data de vencimento dentro dos próximos **30 dias** (`0 <= dias <= 30`).
- **Vencido (`vencidos`):** Data de vencimento ultrapassada (`dias < 0`).
- **Conformidade por Colaborador:** Um colaborador é contabilizado como regular apenas quando não possui nenhum exame vencido registrado.

---

## ♿ Acessibilidade e Boas Práticas

- **Contraste & Foco Visível:** Atendimento aos critérios WCAG 2.1 AA e anéis de foco (`:focus-visible`) em todos os controles interativos.
- **Validação Acessível:** Atributos `aria-invalid`, mensagens de erro vinculadas por campo (`[data-err-for]`) e foco automático no primeiro campo inválido.
- **Proteção contra XSS:** Escapamento completo de caracteres especiais (`&`, `<`, `>`, `"`, `'`) em todas as renderizações dinâmicas.
- **Safe Areas & Movimento Reduzido:** Suporte a `env(safe-area-inset-bottom)` em dispositivos móveis com entalhe e respeito à preferência `@media (prefers-reduced-motion: reduce)`.
