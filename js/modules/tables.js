/**
 * Módulo de Renderização de Views, Tabelas Responsivas, Cards e Gráficos
 * Porto Seguro · Gestão Ocupacional
 */

import {
  fileStore,
  formatarDataBR,
  diasAte,
  calcularStatusExame,
  parseLocalDate,
} from "../data.js";
import {
  state,
  $,
  ST,
  MESES,
  esc,
  iniciais,
  avatarColor,
  badge,
  trabPorId,
  gestorPorId,
  gestorDaEmpresa,
  empresasDisponiveis,
  examesDe,
  piorStatus,
  lerFiltros,
  aplicarFiltros,
  exameCasaTermo,
  trabCasaTermo,
  calcularContagens,
  linhasPendencia,
} from "./state.js";
import { animarContador } from "./animations.js";

const ICO_EDIT = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>`;
const ICO_DEL = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>`;

const docBtn = (ex, label = "Ver documento") =>
  `<button type="button" class="btn btn-ghost btn-sm" data-docid="${esc(ex.id)}"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> ${label}</button>`;

const acoesExame = (ex) =>
  `<button type="button" class="icon-act" data-edit-ex="${esc(ex.id)}" aria-label="Editar exame" title="Editar">${ICO_EDIT}</button><button type="button" class="icon-act del" data-del-ex="${esc(ex.id)}" aria-label="Excluir exame" title="Excluir">${ICO_DEL}</button>`;

export const emptyState = (t, s) =>
  `<div class="empty"><svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><strong>${t}</strong><span>${s}</span></div>`;

export function syncFiltroUI() {
  const selEmp = $("f-empresa");
  if (selEmp) {
    const atual = selEmp.value || "todas";
    const empresas = empresasDisponiveis();
    selEmp.innerHTML =
      `<option value="todas">Todas as empresas</option>` +
      empresas
        .map((e) => `<option value="${esc(e)}">${esc(e)}</option>`)
        .join("");
    selEmp.value = empresas.includes(atual) ? atual : "todas";
    selEmp.classList.toggle("is-set", selEmp.value !== "todas");
  }

  const f = lerFiltros();
  const temFiltro =
    f.tipo !== "todos" ||
    f.status !== "todos" ||
    f.empresa !== "todas" ||
    !!f.q;
  $("f-tipo")?.classList.toggle("is-set", f.tipo !== "todos");
  $("f-status")?.classList.toggle("is-set", f.status !== "todos");
  $("f-clear")?.classList.toggle("hidden", !temFiltro);

  const summary = $("filter-summary");
  if (summary) {
    summary.textContent = temFiltro ? "Filtros ativos" : "";
  }

  document.querySelectorAll(".kpi").forEach((k) => {
    const selecionado =
      k.dataset.kpi !== "todos" && k.dataset.kpi === f.status;
    k.classList.toggle("selected", selecionado);
    k.setAttribute("aria-pressed", String(selecionado));
  });

  document.querySelectorAll("[data-periodo]").forEach((b) => {
    const ativo = b.dataset.periodo === state.periodoGrafico;
    b.classList.toggle("on", ativo);
    b.setAttribute("aria-pressed", String(ativo));
  });

  document.querySelectorAll("[data-pend-tab]").forEach((b) => {
    const ativo = b.dataset.pendTab === state.pendTab;
    b.classList.toggle("on", ativo);
    b.setAttribute("aria-selected", String(ativo));
  });

  document.querySelectorAll("[data-equipe-tab]").forEach((b) => {
    const ativo = b.dataset.equipeTab === state.equipeTab;
    b.classList.toggle("on", ativo);
    b.setAttribute("aria-selected", String(ativo));
  });

  $("grid-trab")?.classList.toggle("hidden", state.equipeTab !== "colaboradores");
  $("grid-gestores")?.classList.toggle("hidden", state.equipeTab !== "gestores");

  $("filters")?.classList.toggle(
    "hidden",
    !["dashboard", "exames"].includes(state.vista),
  );
}

export function badgeNav() {
  const n = state.trabalhadores.filter(
    (t) => piorStatus(examesDe(t.id)) === "vencidos",
  ).length;

  const navPend = $("nav-pend");
  if (navPend) {
    navPend.textContent = n;
    navPend.classList.toggle("hidden", !n);
  }
  const bp = $("bottom-nav-pend");
  if (bp) {
    bp.textContent = n;
    bp.classList.toggle("hidden", !n);
  }
}

/* ---------- CRONOGRAMA DE ASO E EXAMES PERIÓDICOS ---------- */
function renderCronograma(c, empresa = "todas") {
  const track = $("cronograma-track");
  const pctEl = $("cronograma-pct");
  if (!track) return;

  const examesBase =
    empresa === "todas"
      ? state.exames
      : state.exames.filter((e) => trabPorId(e.trabalhadorId)?.empresa === empresa);

  const total = examesBase.length || 1;
  const pctEmDia = Math.round(((c.validos + c.alerta) / total) * 100);
  if (pctEl) pctEl.textContent = `${pctEmDia}% monitorado`;

  const marcos = [...examesBase]
    .sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento))
    .slice(0, 4);

  if (!marcos.length) {
    track.innerHTML = `<p class="subtle">Nenhum exame registrado no cronograma.</p>`;
    return;
  }

  track.innerHTML = marcos
    .map((ex) => {
      const st = calcularStatusExame(ex.dataVencimento);
      const t = trabPorId(ex.trabalhadorId);
      const cls = st === "validos" ? "ok" : st === "alerta" ? "warn" : "err";
      const icon =
        st === "validos"
          ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>`
          : st === "alerta"
            ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>`
            : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

      return `
        <button type="button" class="cronograma-step ${cls}" data-sel="${esc(ex.trabalhadorId)}">
          <span class="cronograma-node ${cls}" aria-hidden="true">${icon}</span>
          <div class="cronograma-info">
            <strong>${esc(ex.tipo)} · ${esc(t?.nome.split(" ")[0] ?? "Colaborador")}</strong>
            <span>Venc. ${formatarDataBR(ex.dataVencimento)}</span>
          </div>
        </button>`;
    })
    .join("");
}

/* ---------- GRÁFICO DONUT SVG DE CONFORMIDADE ---------- */
function renderDonutConformidade(c) {
  const el = $("conf-donut");
  if (!el) return;

  const total = Math.max(1, c.validos + c.alerta + c.vencidos);
  const r = 30;
  const circ = 2 * Math.PI * r;
  const segOk = (c.validos / total) * circ;
  const segWarn = (c.alerta / total) * circ;
  const segErr = (c.vencidos / total) * circ;

  el.innerHTML = `
    <svg width="76" height="76" viewBox="0 0 76 76">
      <circle cx="38" cy="38" r="${r}" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="8" />
      <circle cx="38" cy="38" r="${r}" fill="none" stroke="#34d399" stroke-width="8"
        stroke-dasharray="${segOk} ${circ}" stroke-dashoffset="0" transform="rotate(-90 38 38)" />
      <circle cx="38" cy="38" r="${r}" fill="none" stroke="#fbbf24" stroke-width="8"
        stroke-dasharray="${segWarn} ${circ}" stroke-dashoffset="${-segOk}" transform="rotate(-90 38 38)" />
      <circle cx="38" cy="38" r="${r}" fill="none" stroke="#fb7185" stroke-width="8"
        stroke-dasharray="${segErr} ${circ}" stroke-dashoffset="${-(segOk + segWarn)}" transform="rotate(-90 38 38)" />
    </svg>`;
}

/* ---------- DASHBOARD ---------- */
export function renderDashboard() {
  const f = lerFiltros();
  const c = calcularContagens(f.empresa);
  const filtroDeExameAtivo = f.tipo !== "todos" || f.status !== "todos";

  const total12m = renderGrafico(f.empresa);
  const totalExibido = state.periodoGrafico === "12m" ? total12m : c.total;
  const heroEyebrow = $("hero-eyebrow");
  if (heroEyebrow) {
    heroEyebrow.textContent =
      state.periodoGrafico === "12m"
        ? "Exames nos Últimos 12 Meses"
        : "Total de Exames Registrados";
  }

  animarContador($("k-total"), totalExibido);
  animarContador($("k-trab"), c.trabs);
  animarContador($("k-ok"), c.validos);
  animarContador($("k-warn"), c.alerta);
  animarContador($("k-err"), c.vencidos);
  animarContador($("conf-num"), c.conf, { sufixo: "%" });

  const confBar = $("conf-bar");
  if (confBar) {
    confBar.style.width = c.conf + "%";
    confBar.parentElement?.setAttribute("aria-valuenow", c.conf);
  }
  const confFrac = $("conf-frac");
  if (confFrac) confFrac.textContent = `${c.conformes}/${c.base}`;

  renderCronograma(c, f.empresa);
  renderDonutConformidade(c);
  renderAside(c, f.empresa);

  const lista = state.trabalhadores.filter((t) => {
    if (f.empresa !== "todas" && t.empresa !== f.empresa) return false;
    const exTrab = examesDe(t.id);
    const exFiltrados = aplicarFiltros(exTrab, f);
    if (filtroDeExameAtivo && !exFiltrados.length) return false;
    return (
      trabCasaTermo(t, f.q) || exFiltrados.some((e) => exameCasaTermo(e, f.q))
    );
  });

  $("count-trab").textContent = lista.length;
  if (lista.length && !lista.some((t) => t.id === state.selecionadoId)) {
    state.selecionadoId = lista[0].id;
  }

  $("worker-list").innerHTML = lista.length
    ? lista
        .map((t) => {
          const exTrab = examesDe(t.id);
          const ps = piorStatus(exTrab);
          const pal = avatarColor(t.nome);
          const selecionado = t.id === state.selecionadoId;
          return `
            <button type="button" class="worker-item ${selecionado ? "active" : ""}" data-sel="${esc(t.id)}" role="option" aria-selected="${selecionado}">
              <span class="avatar" style="background:${pal.bg};color:${pal.color}">${esc(iniciais(t.nome))}</span>
              <div>
                <div class="w-name">${esc(t.nome)}</div>
                <div class="w-sub">${esc(t.setor)}</div>
              </div>
              <span class="dot ${ps === "none" ? "none" : ST[ps].c}" aria-hidden="true"></span>
            </button>`;
        })
        .join("")
    : emptyState(
        "Nenhum trabalhador",
        "Ajuste os termos ou filtros selecionados.",
      );

  renderHistorico(
    lista.some((t) => t.id === state.selecionadoId)
      ? trabPorId(state.selecionadoId)
      : null,
    f,
  );
}

export function renderHistorico(t, f) {
  if (!t) {
    $("worker-banner").innerHTML = "";
    $("timeline").innerHTML = emptyState(
      "Nenhum trabalhador selecionado",
      "Selecione um colaborador para visualizar a linha do tempo.",
    );
    return;
  }

  const todos = examesDe(t.id);
  const pal = avatarColor(t.nome);
  $("worker-banner").innerHTML = `
    <div class="worker-banner">
      <span class="avatar lg" style="background:${pal.bg};color:${pal.color}">${esc(iniciais(t.nome))}</span>
      <div style="flex:1;min-width:0">
        <div class="h2">${esc(t.nome)}</div>
        <div class="meta">
          <span>CPF: ${esc(t.cpf)}</span>
          <span>${esc(t.setor)}</span>
          <span>${esc(t.empresa)}</span>
        </div>
      </div>
      <div class="acts">
        <button type="button" class="icon-act" data-edit-trab="${esc(t.id)}" aria-label="Editar trabalhador" title="Editar">${ICO_EDIT}</button>
      </div>
    </div>`;

  let lista = trabCasaTermo(t, f.q)
    ? todos
    : todos.filter((e) => exameCasaTermo(e, f.q));
  lista = aplicarFiltros(lista, f);

  if (!lista.length) {
    $("timeline").innerHTML = todos.length
      ? emptyState(
          "Nenhum exame com esses filtros",
          "Tente limpar os filtros selecionados.",
        )
      : emptyState(
          "Sem exames registrados",
          "Use o botão Novo Exame no topo para registrar o primeiro exame.",
        );
    return;
  }

  $("timeline").innerHTML = lista
    .map((ex) => {
      const st = calcularStatusExame(ex.dataVencimento);
      const d = parseLocalDate(ex.dataRealizacao);
      const dias = diasAte(ex.dataVencimento);
      const rel =
        st === "vencidos"
          ? `venceu há ${-dias} dia(s)`
          : st === "alerta"
            ? `vence em ${dias} dia(s)`
            : "";
      return `
        <article class="exam">
          <div class="exam-date">
            <b>${String(d.getDate()).padStart(2, "0")}</b>
            <small>${MESES[d.getMonth()]} ${String(d.getFullYear()).slice(2)}</small>
          </div>
          <div style="min-width:0">
            <div class="exam-title">${esc(ex.tipo)} ${badge(st)}</div>
            <div class="exam-meta">Realização: ${formatarDataBR(ex.dataRealizacao)} · Validade: ${formatarDataBR(ex.dataVencimento)}${rel ? ` · <strong class="c-${ST[st].c}">${rel}</strong>` : ""}</div>
            <div class="exam-meta2">${esc(ex.laboratorio)} · ${esc(ex.medico)}</div>
          </div>
          <div class="acts">${st === "vencidos" ? `<button type="button" class="btn-renew btn-renew-inline" data-renew-ex="${esc(ex.id)}" title="Renovar exame em 1 clique">Renovar</button>` : ""}${docBtn(ex)}${acoesExame(ex)}</div>
        </article>`;
    })
    .join("");
}

function renderGrafico(empresa = "todas") {
  const hoje = new Date();
  const cols = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    cols.push({ y: d.getFullYear(), m: d.getMonth(), n: 0 });
  }
  const examesBase =
    empresa === "todas"
      ? state.exames
      : state.exames.filter((e) => trabPorId(e.trabalhadorId)?.empresa === empresa);

  examesBase.forEach((e) => {
    const d = parseLocalDate(e.dataRealizacao);
    const c = cols.find(
      (col) => col.y === d.getFullYear() && col.m === d.getMonth(),
    );
    if (c) c.n++;
  });

  const max = Math.max(4, ...cols.map((c) => c.n));
  const total12m = cols.reduce((acc, c) => acc + c.n, 0);
  const chartEl = $("chart");
  if (!chartEl) return total12m;

  let yAxis = $("chart-y-axis");
  if (!yAxis && chartEl.parentElement) {
    yAxis = document.createElement("div");
    yAxis.id = "chart-y-axis";
    yAxis.className = "chart-y-axis";
    yAxis.setAttribute("aria-hidden", "true");
    chartEl.parentElement.insertBefore(yAxis, chartEl);
  }
  if (yAxis) {
    yAxis.innerHTML = `<span>${max}</span><span>${Math.round(max / 2)}</span><span>0</span>`;
  }

  chartEl.setAttribute(
    "aria-label",
    `Gráfico de exames realizados nos últimos 12 meses: ${total12m} exame(s) no período`,
  );
  chartEl.innerHTML = cols
    .map(
      (c, i) => `
        <div class="bar-col ${c.n > 0 ? "has-data" : "is-empty"}" title="${MESES[c.m]}/${c.y}: ${c.n} exame(s)" aria-hidden="true">
          <span class="bar-val">${c.n}</span>
          <div class="bar-track">
            <div class="bar ${i === 11 ? "current" : ""}" style="height:${c.n > 0 ? Math.max(12, Math.round((c.n / max) * 100)) : 4}%"></div>
          </div>
          <span class="bar-lbl">${MESES[c.m]}</span>
        </div>`,
    )
    .join("");

  return total12m;
}

function renderAside(c, empresa = "todas") {
  const examesBase =
    empresa === "todas"
      ? state.exames
      : state.exames.filter((e) => trabPorId(e.trabalhadorId)?.empresa === empresa);

  // 1. Central de Documentos Digitais + Pré-visualização Inline
  const docsList = $("docs-central-list");
  const docsPreview = $("docs-central-preview");
  if (docsList && docsPreview) {
    const recentes = [...examesBase]
      .sort((a, b) => b.dataRealizacao.localeCompare(a.dataRealizacao))
      .slice(0, 3);

    if (!recentes.length) {
      docsList.innerHTML = `<p class="subtle">Nenhum documento anexado.</p>`;
      docsPreview.innerHTML = "";
    } else {
      docsList.innerHTML = recentes
        .map((ex) => {
          const t = trabPorId(ex.trabalhadorId);
          const nomeArquivo =
            ex.arquivoNome ||
            `${ex.tipo} · ${t?.nome || "Colaborador"} (PDF)`;
          const st = calcularStatusExame(ex.dataVencimento);
          return `
            <button type="button" class="doc-mini-item" data-docid="${esc(ex.id)}">
              <span class="doc-pdf-tag">PDF</span>
              <div class="doc-mini-info">
                <strong>${esc(nomeArquivo)}</strong>
                <span>${esc(t?.empresa ?? "Unidade")} · ${formatarDataBR(ex.dataRealizacao)}</span>
              </div>
              <span class="dot ${ST[st].c}" aria-hidden="true"></span>
            </button>`;
        })
        .join("");

      const destaque =
        recentes.find((e) => e.trabalhadorId === state.selecionadoId) ||
        recentes[0];
      const trabDestaque = trabPorId(destaque.trabalhadorId);
      docsPreview.innerHTML = `
        <div class="doc-preview-box">
          <div class="doc-preview-sheet">
            <div class="doc-preview-lines">
              <span></span><span></span><span></span>
            </div>
            <span class="doc-preview-badge">PDF</span>
          </div>
          <div class="doc-preview-meta">
            <strong>${esc(destaque.tipo)} · ${esc(trabDestaque?.nome ?? "")}</strong>
            <span>${esc(destaque.laboratorio)}</span>
            <button type="button" class="doc-preview-link" data-docid="${esc(destaque.id)}">
              Visualizar laudo completo →
            </button>
          </div>
        </div>`;
    }
  }

  // 2. Pendências e Vencimentos (Abas: Vencidos | A vencer)
  const vencidosList = examesBase
    .filter((e) => calcularStatusExame(e.dataVencimento) === "vencidos")
    .sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento));
  const alertaList = examesBase
    .filter((e) => calcularStatusExame(e.dataVencimento) === "alerta")
    .sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento));

  const errCountEl = $("pend-tab-err-count");
  const warnCountEl = $("pend-tab-warn-count");
  if (errCountEl) errCountEl.textContent = vencidosList.length;
  if (warnCountEl) warnCountEl.textContent = alertaList.length;

  const listaAtiva =
    state.pendTab === "vencidos" ? vencidosList.slice(0, 5) : alertaList.slice(0, 5);

  $("upcoming").innerHTML = listaAtiva.length
    ? listaAtiva
        .map((e) => {
          const t = trabPorId(e.trabalhadorId);
          const d = diasAte(e.dataVencimento);
          const st = calcularStatusExame(e.dataVencimento);
          const prazoTxt =
            d < 0 ? `${-d}d atrás` : d === 0 ? "hoje" : `em ${d}d`;
          return `
            <div class="up-row">
              <button type="button" class="up-item" data-sel="${esc(e.trabalhadorId)}">
                <span class="dot ${ST[st].c}" aria-hidden="true"></span>
                <div style="min-width:0">
                  <div class="up-name">${esc(t?.nome ?? "N/A")}</div>
                  <div class="subtle">${esc(e.tipo)} · ${formatarDataBR(e.dataVencimento)} (${prazoTxt})</div>
                </div>
              </button>
              ${
                st === "vencidos"
                  ? `<button type="button" class="btn-renew" data-renew-ex="${esc(e.id)}" title="Renovar exame em 1 clique">Renovar</button>`
                  : `<span class="up-days c-${ST[st].c}">${prazoTxt}</span>`
              }
            </div>`;
        })
        .join("")
    : `<p class="subtle" style="padding:10px 0">${
        state.pendTab === "vencidos"
          ? "Nenhum exame vencido no momento."
          : "Nenhum exame vencendo nos próximos 30 dias."
      }</p>`;

  // 3. Distribuição por Tipo
  const cnt = {};
  examesBase.forEach((e) => (cnt[e.tipo] = (cnt[e.tipo] || 0) + 1));
  const tot = examesBase.length || 1;
  $("dist").innerHTML =
    Object.entries(cnt)
      .sort((a, b) => b[1] - a[1])
      .map(
        ([t, n]) =>
          `<div class="dist-row"><span class="muted">${esc(t)}</span><strong>${n} <span class="subtle">(${Math.round((n / tot) * 100)}%)</span></strong><div class="track"><i style="width:${(n / tot) * 100}%"></i></div></div>`,
      )
      .join("") || `<p class="subtle">Sem dados para exibição.</p>`;
}

/* ---------- TRABALHADORES & GESTORES ---------- */
export function renderTrabalhadores() {
  const f = lerFiltros();
  const lista = state.trabalhadores.filter(
    (t) =>
      (f.empresa === "todas" || t.empresa === f.empresa) &&
      trabCasaTermo(t, f.q),
  );
  const listaGestores = state.gestores.filter((g) => {
    if (f.empresa !== "todas" && g.empresa !== f.empresa) return false;
    if (!f.q) return true;
    const q = f.q;
    return (
      g.nome.toLowerCase().includes(q) ||
      g.cargo.toLowerCase().includes(q) ||
      g.empresa.toLowerCase().includes(q) ||
      g.email.toLowerCase().includes(q)
    );
  });

  const tabTrab = $("tab-count-trab");
  const tabGest = $("tab-count-gest");
  if (tabTrab) tabTrab.textContent = lista.length;
  if (tabGest) tabGest.textContent = listaGestores.length;

  $("grid-trab").innerHTML = lista.length
    ? lista
        .map((t) => {
          const ex = examesDe(t.id);
          const c = { validos: 0, alerta: 0, vencidos: 0 };
          ex.forEach((e) => c[calcularStatusExame(e.dataVencimento)]++);
          const pal = avatarColor(t.nome);
          const gestor = gestorDaEmpresa(t.empresa);
          return `
            <article class="card w-card">
              <div class="w-card-head">
                <span class="avatar lg" style="background:${pal.bg};color:${pal.color}">${esc(iniciais(t.nome))}</span>
                <div style="min-width:0;flex:1">
                  <h3>${esc(t.nome)}</h3>
                  <div class="subtle">${esc(t.setor)}</div>
                </div>
                <div class="acts">
                  <button type="button" class="icon-act" data-edit-trab="${esc(t.id)}" aria-label="Editar trabalhador" title="Editar">${ICO_EDIT}</button>
                  <button type="button" class="icon-act del" data-del-trab="${esc(t.id)}" aria-label="Excluir trabalhador" title="Excluir">${ICO_DEL}</button>
                </div>
              </div>
              <dl class="kv">
                <dt>CPF</dt><dd>${esc(t.cpf)}</dd>
                <dt>Empresa</dt><dd>${esc(t.empresa)}</dd>
                <dt>Gestor</dt><dd>${esc(gestor?.nome ?? "Não vinculado")}</dd>
                <dt>Exames</dt><dd>${ex.length}</dd>
              </dl>
              <div class="w-stats">${
                ex.length
                  ? ["validos", "alerta", "vencidos"]
                      .filter((s) => c[s])
                      .map(
                        (s) =>
                          `<span class="badge ${ST[s].c}">${c[s]} ${ST[s].l.toLowerCase()}</span>`,
                      )
                      .join("")
                  : `<span class="badge neutral">Sem exames</span>`
              }</div>
              <div class="w-actions single-action">
                <button type="button" class="btn btn-ghost btn-sm" data-hist="${esc(t.id)}">Ver Histórico Ocupacional</button>
              </div>
            </article>`;
        })
        .join("")
    : `<div class="card" style="grid-column:1/-1;padding:24px">${emptyState("Nenhum trabalhador encontrado", "Ajuste os termos da busca ou cadastre um novo colaborador.")}</div>`;

  const gridGest = $("grid-gestores");
  if (gridGest) {
    gridGest.innerHTML = listaGestores.length
      ? listaGestores
          .map((g) => {
            const pal = avatarColor(g.nome);
            const vinculados = state.trabalhadores.filter(
              (t) => t.empresa === g.empresa,
            ).length;
            return `
              <article class="card w-card">
                <div class="w-card-head">
                  <span class="avatar lg" style="background:${pal.bg};color:${pal.color}">${esc(iniciais(g.nome))}</span>
                  <div style="min-width:0;flex:1">
                    <h3>${esc(g.nome)}</h3>
                    <div class="subtle">${esc(g.cargo)}</div>
                  </div>
                  <div class="acts">
                    <button type="button" class="icon-act" data-edit-gestor="${esc(g.id)}" aria-label="Editar gestor" title="Editar">${ICO_EDIT}</button>
                    <button type="button" class="icon-act del" data-del-gestor="${esc(g.id)}" aria-label="Excluir gestor" title="Excluir">${ICO_DEL}</button>
                  </div>
                </div>
                <dl class="kv">
                  <dt>Empresa</dt><dd>${esc(g.empresa)}</dd>
                  <dt>E-mail</dt><dd>${esc(g.email)}</dd>
                  <dt>Telefone</dt><dd>${esc(g.telefone || "—")}</dd>
                  <dt>Colaboradores</dt><dd>${vinculados} vinculado(s)</dd>
                </dl>
              </article>`;
          })
          .join("")
      : `<div class="card" style="grid-column:1/-1;padding:24px">${emptyState("Nenhum gestor cadastrado", "Cadastre um gestor responsável por empresa ou unidade.")}</div>`;
  }
}

/* ---------- EXAMES (TABELA -> CARDS NO MOBILE) ---------- */
export function renderExames() {
  const f = lerFiltros();
  const lista = aplicarFiltros(
    state.exames.filter((e) => {
      const t = trabPorId(e.trabalhadorId);
      if (f.empresa !== "todas" && t?.empresa !== f.empresa) return false;
      return (t && trabCasaTermo(t, f.q)) || exameCasaTermo(e, f.q);
    }),
    f,
  );

  $("tb-exames").innerHTML = lista.length
    ? lista
        .map((e) => {
          const t = trabPorId(e.trabalhadorId);
          const pal = avatarColor(t?.nome ?? "");
          const st = calcularStatusExame(e.dataVencimento);
          return `
            <tr>
              <td data-label="Trabalhador">
                <div class="cell-person">
                  <span class="avatar" style="background:${pal.bg};color:${pal.color}">${esc(iniciais(t?.nome ?? "?"))}</span>
                  <strong>${esc(t?.nome ?? "N/A")}</strong>
                </div>
              </td>
              <td data-label="Tipo"><span class="chip">${esc(e.tipo)}</span></td>
              <td data-label="Realização" class="nowrap">${formatarDataBR(e.dataRealizacao)}</td>
              <td data-label="Vencimento" class="nowrap">${formatarDataBR(e.dataVencimento)}</td>
              <td data-label="Laboratório">${esc(e.laboratorio)}</td>
              <td data-label="Médico" class="muted">${esc(e.medico)}</td>
              <td data-label="Situação">${badge(st)}</td>
              <td class="td-actions" style="text-align:right"><div class="acts">${st === "vencidos" ? `<button type="button" class="btn-renew btn-renew-inline" data-renew-ex="${esc(e.id)}" title="Renovar exame em 1 clique">Renovar</button>` : ""}${docBtn(e, "Abrir")}${acoesExame(e)}</div></td>
            </tr>`;
        })
        .join("")
    : `<tr class="empty-row"><td colspan="8" style="padding:32px">${emptyState("Nenhum exame encontrado", "Ajuste a busca ou os filtros de tipo e status.")}</td></tr>`;
}

/* ---------- RELATÓRIOS (TABELA -> CARDS NO MOBILE) ---------- */
export function renderRelatorios() {
  const empresa = lerFiltros().empresa;
  const c = calcularContagens(empresa);
  animarContador($("r-conf"), c.conf, { sufixo: "%" });
  animarContador($("r-err"), c.vencidos);
  animarContador($("r-warn"), c.alerta);

  $("tb-pend").innerHTML =
    linhasPendencia(empresa)
      .map(({ t, info }) => {
        const pal = avatarColor(t.nome);
        return `
          <tr>
            <td data-label="Trabalhador">
              <div class="cell-person">
                <span class="avatar" style="background:${pal.bg};color:${pal.color}">${esc(iniciais(t.nome))}</span>
                <strong>${esc(t.nome)}</strong>
              </div>
            </td>
            <td data-label="Cargo / Setor">${esc(t.setor)}</td>
            <td data-label="Empresa">${esc(t.empresa)}</td>
            <td data-label="Situação"><span class="badge ${info[0]}">${info[1]}</span></td>
            <td data-label="Ação Recomendada" class="muted">${info[2]}</td>
          </tr>`;
      })
      .join("") ||
    `<tr class="empty-row"><td colspan="5" style="padding:32px">${emptyState("Sem trabalhadores", "Cadastre o primeiro colaborador para monitorar.")}</td></tr>`;
}

/* ---------- EXCLUSÕES EM CASCATA ---------- */
export function prepararExclusaoExame(id, pedirConfirmacao, onDone) {
  const ex = state.exames.find((e) => e.id === id);
  if (!ex) return;
  pedirConfirmacao(
    `Excluir o exame "${ex.tipo}" realizado em ${formatarDataBR(ex.dataRealizacao)}? Esta ação não pode ser desfeita.`,
    () => {
      state.exames = state.exames.filter((e) => e.id !== id);
      if (ex.arquivoId) fileStore.del(ex.arquivoId);
      onDone("Exame excluído com sucesso.");
    },
  );
}

export function prepararExclusaoTrabalhador(id, pedirConfirmacao, onDone) {
  const t = trabPorId(id);
  if (!t) return;
  const ex = examesDe(id);
  pedirConfirmacao(
    `Excluir ${t.nome}${ex.length ? ` e seus ${ex.length} exame(s)` : ""}? Esta ação não pode ser desfeita.`,
    () => {
      ex.forEach((e) => e.arquivoId && fileStore.del(e.arquivoId));
      state.exames = state.exames.filter((e) => e.trabalhadorId !== id);
      state.trabalhadores = state.trabalhadores.filter((x) => x.id !== id);
      if (state.selecionadoId === id) {
        state.selecionadoId = state.trabalhadores[0]?.id ?? null;
      }
      onDone("Trabalhador excluído com sucesso.");
    },
  );
}

export function prepararExclusaoGestor(id, pedirConfirmacao, onDone) {
  const g = gestorPorId(id);
  if (!g) return;
  pedirConfirmacao(
    `Excluir o gestor ${g.nome} (${g.empresa})? Esta ação não pode ser desfeita.`,
    () => {
      state.gestores = state.gestores.filter((x) => x.id !== id);
      onDone("Gestor excluído com sucesso.");
    },
  );
}
