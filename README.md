# Saúde Unificada · Gestão Ocupacional

Sistema moderno, intuitivo e responsivo para gestão preventiva de Saúde e Segurança do Trabalho (**SST**), monitoramento de **ASOs** (Atestados de Saúde Ocupacional), exames periódicos, admissionais, demissionais e conformidade com as Normas Regulamentadoras (**NR-07 / PCMSO**, **NR-01**, **NR-09**).

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

O **Saúde Unificada** é uma aplicação web no modelo **Single Page Application (SPA)** desenvolvida em **Vanilla JavaScript, HTML5 e CSS3 moderno**, projetada para substituir planilhas fragmentadas por um painel centralizado, elegante e acolhedor.

O sistema permite a equipes de RH, SESMT e clínicas médicas controlar prontuários, programar renovações antes do vencimento legal e emitir relatórios auditáveis com total segurança e privacidade de dados.

---

## 🚀 Funcionalidades Principais

### 1. Dashboard Executivo & Monitoramento em Tempo Real
- **Métricas Globais (KPIs):** Total de colaboradores, exames em dia, a vencer (próximos 30 dias) e vencidos.
- **Gráfico de Evolução (Últimos 12 Meses):** Distribuição mensal de exames realizados com indicação do mês corrente e tooltip interativo.
- **Painel Histórico Ocupacional Dividido:** Seleção rápida de trabalhador à esquerda e linha do tempo cronológica de exames à direita.
- **Auditoria de Conformidade Geral:** Percentual dinâmico de colaboradores em situação regular perante as NRs com barra de progresso e mini-sparklines.
- **Próximos Vencimentos & Distribuição por Tipo:** Alertas com contagem regressiva de dias e barras de participação percentual por procedimento.

### 2. Gestão de Trabalhadores
- Cadastro, consulta, edição e exclusão de colaboradores.
- Campos estruturados: Nome completo, CPF/identificador, cargo/setor e empresa/unidade.
- Geração dinâmica de avatares com paleta pastel e iniciais do colaborador.
- Contadores de exames vinculados e status de conformidade individual.

### 3. Registro de Exames & ASOs
- Registro de exames vinculados ao trabalhador:
  - **ASO** (Atestado de Saúde Ocupacional)
  - **Admissional**
  - **Periódico**
  - **Demissional**
  - **Audiometria tonal**
  - **Ultrassom ocupacional**
- Definição de clínica/laboratório, médico responsável com CRM/registro de classe, data de realização e data de vencimento.
- Validação automática de datas (o vencimento deve ser posterior à realização).

### 4. Anexos e Documentos Digitais
- Suporte duplo para arquivamento:
  - **Link externo:** Google Drive, SharePoint, OneDrive ou URLs HTTPS seguras.
  - **Arquivo local (Upload):** PDFs e imagens (PNG, JPG) de até 10 MB.
- **Visualizador Integrado:** Modal nativo para visualização direta do PDF/imagem ou abertura em nova aba sem necessidade de softwares externos.

### 5. Relatórios & Auditoria Preventiva
- Painel focado em fiscalizações com cálculo automático de índice de conformidade.
- Tabela com ações recomendadas por trabalhador (*Irregular*, *Atenção*, *Em dia*, *Sem registros*).
- **Exportação CSV:** Download de relatório tabular compatível com Excel e Google Planilhas.
- **Modo Impressão / PDF Otimizado:** Estilos CSS `@media print` dedicados que ocultam barras de navegação e formatam a folha para relatórios físicos ou salvamento em PDF.

### 6. Busca Global & Filtros Dinâmicos
- **Busca em Tempo Real:** Atalho de teclado `/` para focar o campo; busca por nome, CPF, empresa, setor, tipo de exame, laboratório ou médico.
- **Filtros Combinados:** Filtragem instantânea por tipo de exame, status de validade e ordenação cronológica.
- **Filtro Rápido via KPIs:** Clique direto nos cards de indicadores do dashboard para filtrar exames automaticamente.

---

## 🛠️ Arquitetura & Engenharia de Frontend

A aplicação adota o paradigma **Local-First**, eliminando custos de infraestrutura e dependências externas pesadas:

- **Zero Dependências / Zero Build:** Não requer `npm install`, Node.js ou bundlers como Webpack/Vite. Roda diretamente em qualquer navegador moderno.
- **Vanilla JavaScript (ES6+):** Código limpo, modular, orientado a eventos e de alta performance.
- **Renderização Reativa:** Atualização da interface orientada a estado em memória sincronizado com os dados persistidos.

---

## 🎨 Design System & UI/UX Responsivo

O design system baseia-se nos princípios de **Soft UI / Flat 2.0**, priorizando acolhimento, legibilidade e clareza de informações:

- **Tipografia:** `Plus Jakarta Sans` via Google Fonts, com hierarquia bem definida e escala tipográfica balanceada.
- **Cores Semânticas:**
  - Primária: Azul Vibrante (`#2f68ee`)
  - Sucesso / Válido: Esmeralda (`#059669` / fundo `#ecfdf5`)
  - Atenção / 30 dias: Âmbar (`#d97706` / fundo `#fffbeb`)
  - Crítico / Vencido: Rosa/Rubi (`#e11d48` / fundo `#fff1f2`)
- **Sombras e Raios:** Bordas arredondadas suaves (`border-radius: 12px` a `20px`) com sombras difusas multicamadas.

---

### Experiência Mobile Especializada (320px a 768px)

A interface foi refinada para proporcionar uma experiência fluida no celular, alinhada às diretrizes da **Apple Human Interface Guidelines** e do **Google Material Design**:

| Componente | Desktop (> 900px) | Mobile (320px a 768px) |
|---|---|---|
| **Navegação Principal** | Sidebar fixa lateral de 260px | **Mobile Bottom Nav** fixa ao alcance do polegar + Drawer lateral deslizante com botão fechar (**X**) |
| **Ação Rápida** | Botão no cabeçalho | **Botão Central Flutuante (FAB)** na barra inferior para registro imediato de exames |
| **Cabeçalho (Topbar)** | Linha única horizontal | 2 níveis: Menu e Perfil na linha 1; Busca em **100% de largura** na linha 2 |
| **Filtros** | Barra horizontal compacta | Grid adaptativo (2 colunas em telas médias, 1 coluna fluida em telas `<= 400px`) com altura de toque de 42px |
| **Gráfico 12 Meses** | Barras fixas proporcionais | Container com rolagem horizontal suave por toque (`-webkit-overflow-scrolling: touch`) |
| **Cards de Indicadores** | Linha de 4 colunas | Grid 2×2 otimizado com padding e tipografia ajustados para não quebrar em telas de 320px |
| **Cards Laterais (Auditoria)** | Coluna vertical lateral | Cards compactos com sparklines refinadas e **respiro de 105px** para não serem sobrepostos pelo rodapé |
| **Linha do Tempo (Exames)** | Grid 3 colunas | Cards verticais completos com tag de data visível e botões de ação amplos |
| **Formulários / Modais** | Caixa centralizada com blur | **Bottom Sheet deslizante** a partir da base, com fontes de **16px** (previne zoom indesejado no iOS Safari) |
| **Tabelas de Dados** | Visualização completa | Container com rolagem horizontal fluida e largura mínima protegida contra quebra |

---

## 📁 Estrutura de Arquivos

```text
saude-unificada/
│
├── index.html          # Estrutura semântica SPA, views, modais e templates
├── README.md           # Documentação completa do projeto
│
├── css/
│   └── styles.css      # Design system, temas, layouts e media queries responsivas
│
└── js/
    ├── data.js         # Camada de persistência (Storage, IndexedDB, sementes e regras)
    └── app.js          # Controladores da SPA, renderização, rotas, filtros e eventos
```

---

## 💾 Armazenamento e Persistência (Local-First)

O projeto implementa uma arquitetura híbrida de armazenamento no navegador do cliente:

1. **LocalStorage (`localStorage`):**
   - Armazena listas de trabalhadores e registros de exames em formato JSON serializado.
   - Fallback gracioso para armazenamento em memória caso o modo anônimo ou políticas de cookies bloqueiem o LocalStorage.
2. **IndexedDB (`fileStore`):**
   - Utilizado para o armazenamento binário de **arquivos (Blobs de PDF e imagens)** de até 10 MB.
   - Supera o limite rígido de ~5 MB do LocalStorage tradicional, permitindo anexar dezenas de laudos sem estourar a cota.
3. **Dados Demonstrativos (Seed Inicial):**
   - Caso o sistema seja aberto pela primeira vez, carrega automaticamente dados exemplares de colaboradores e exames para teste imediato de todas as funcionalidades.

---

## 💻 Como Executar o Projeto

Como a aplicação é estática e não possui dependências de compilação:

### Opção 1: Abrir diretamente no navegador
1. Baixe ou clone o repositório.
2. Dê um duplo clique no arquivo `index.html` ou arraste-o para o seu navegador (Google Chrome, Microsoft Edge, Safari, Firefox).

### Opção 2: Executar com servidor HTTP local (Recomendado)
Para melhor suporte à visualização de iframes e IndexedDB:

**Via Python:**
```bash
python -m http.server 8000
```
Acesse: `http://localhost:8000`

**Via Node.js (npx):**
```bash
npx serve .
```

**Via Extensão Live Server (VS Code):**
Clique com o botão direito em `index.html` e selecione **"Open with Live Server"**.

---

## ⚖️ Regras de Negócio e Cálculos de Validade

O sistema aplica as regras ocupacionais de monitoramento contínuo:

- **Em dia / Válido (`validos`):** Exames cuja data de vencimento está a mais de 30 dias a partir da data atual. Indicador verde.
- **A vencer / Alerta (`alerta`):** Exames cuja validade expira em **30 dias ou menos** a partir da data atual (`0 <= dias <= 30`). Indicador âmbar.
- **Vencido (`vencidos`):** Exames cuja data de vencimento já foi ultrapassada (`dias < 0`). Indicador vermelho de renovação imediata.
- **Conformidade Geral por Colaborador:** Um colaborador só é considerado regular se **todos** os seus exames registrados estiverem válidos. A presença de um único exame vencido altera o status individual para irregular.

---

## ♿ Acessibilidade e Boas Práticas

- **Contraste de Cores:** Atendimento aos critérios WCAG 2.1 AA para texto normal e componentes de interface.
- **Navegação por Teclado:** Focos visíveis (`:focus-visible`) com anéis de realce suaves em botões, campos e opções de lista.
- **Tamanhos Mínimos de Toque:** Elementos interativos em telas móveis respeitam a área mínima recomendada de 40px–44px.
- **Compatibilidade com Entalhes (Safe Areas):** Uso de `viewport-fit=cover` e variáveis CSS `env(safe-area-inset-bottom)` para suporte nativo a iPhones com Dynamic Island ou entalhe superior/inferior.
- **Sanitização contra XSS:** Escapamento de caracteres especiais (`&`, `<`, `>`, `"`, `'`) em todas as interpolações dinâmicas de texto.
- **Prevenção de Movimento Excessivo:** Suporte à diretiva `@media (prefers-reduced-motion: reduce)`.

---

**Desenvolvido com foco em UI/UX moderna, performance e usabilidade mobile.**

