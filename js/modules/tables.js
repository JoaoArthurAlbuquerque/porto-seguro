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
  const f = lerFiltros();
  const temFiltro = f.tipo !== "todos" || f.status !== "todos" || !!f.q;
  $("f-tipo")?.classList.toggle("is-set", f.tipo !== "todos");
  $("f-status")?.classList.toggle("is-set", f.status !== "todos");
  $("f-clear")?.classList.toggle("hidden", !temFiltro);

  const summary = $("filter-summary");
  if (summary) {
    summary.textContent = temFiltro ? "Filtros ativos" : "";
  }

  document
    .querySelectorAll(".kpi")
    .forEach((k) =>
      k.classList.toggle(
        "selected",
        k.dataset.kpi !== "todos" && k.dataset.kpi === f.status,
      ),
    );
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

/* ---------- DASHBOARD ---------- */
export function renderDashboard() {
  const c = calcularContagens();
  const f = lerFiltros();
  const filtroDeExameAtivo = f.tipo !== "todos" || f.status !== "todos";

  animarContador($("k-total"), state.exames.length);
  animarContador($("k-trab"), state.trabalhadores.length);
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

  renderGrafico();
  renderAside();

  const lista = state.trabalhadores.filter((t) => {
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
        <button type="button" class="btn btn-primary btn-sm" data-add="${esc(t.id)}">+ Novo Exame</button>
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
          "Registre o primeiro exame ocupacional deste colaborador.",
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
          <div class="acts">${docBtn(ex)}${acoesExame(ex)}</div>
        </article>`;
    })
    .join("");
}

function renderGrafico() {
  const hoje = new Date();
  const cols = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    cols.push({ y: d.getFullYear(), m: d.getMonth(), n: 0 });
  }
  state.exames.forEach((e) => {
    const d = parseLocalDate(e.dataRealizacao);
    const c = cols.find(
      (col) => col.y === d.getFullYear() && col.m === d.getMonth(),
    );
    if (c) c.n++;
  });
  const max = Math.max(1, ...cols.map((c) => c.n));
  $("chart").innerHTML = cols
    .map(
      (c, i) => `
        <div class="bar-col ${c.n > 0 ? "has-data" : ""}" title="${MESES[c.m]}/${c.y}: ${c.n} exame(s)">
          <span class="bar-val">${c.n}</span>
          <div class="bar-track">
            <div class="bar ${i === 11 ? "current" : ""}" style="height:${Math.max(8, (c.n / max) * 100)}%"></div>
          </div>
          <span class="bar-lbl">${MESES[c.m]}</span>
        </div>`,
    )
    .join("");
}

function renderAside() {
  const prox = state.exames
    .filter((e) => calcularStatusExame(e.dataVencimento) !== "validos")
    .sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento))
    .slice(0, 5);

  $("upcoming").innerHTML = prox.length
    ? prox
        .map((e) => {
          const t = trabPorId(e.trabalhadorId);
          const d = diasAte(e.dataVencimento);
          const st = calcularStatusExame(e.dataVencimento);
          return `
            <button type="button" class="up-item" data-sel="${esc(e.trabalhadorId)}">
              <span class="dot ${ST[st].c}" aria-hidden="true"></span>
              <div style="min-width:0">
                <div class="up-name">${esc(t?.nome ?? "N/A")}</div>
                <div class="subtle">${esc(e.tipo)} · ${formatarDataBR(e.dataVencimento)}</div>
              </div>
              <span class="up-days c-${ST[st].c}">${d < 0 ? `${-d}d atrás` : d === 0 ? "hoje" : `em ${d}d`}</span>
            </button>`;
        })
        .join("")
    : `<p class="subtle" style="padding:8px 0">Todos os exames estão com a validade em dia!</p>`;

  const cnt = {};
  state.exames.forEach((e) => (cnt[e.tipo] = (cnt[e.tipo] || 0) + 1));
  const tot = state.exames.length || 1;
  $("dist").innerHTML =
    Object.entries(cnt)
      .sort((a, b) => b[1] - a[1])
      .map(
        ([t, n]) =>
          `<div class="dist-row"><span class="muted">${esc(t)}</span><strong>${n} <span class="subtle">(${Math.round((n / tot) * 100)}%)</span></strong><div class="track"><i style="width:${(n / tot) * 100}%"></i></div></div>`,
      )
      .join("") || `<p class="subtle">Sem dados para exibição.</p>`;
}

/* ---------- TRABALHADORES ---------- */
export function renderTrabalhadores() {
  const q = lerFiltros().q;
  const lista = state.trabalhadores.filter((t) => trabCasaTermo(t, q));
  $("grid-trab").innerHTML = lista.length
    ? lista
        .map((t) => {
          const ex = examesDe(t.id);
          const c = { validos: 0, alerta: 0, vencidos: 0 };
          ex.forEach((e) => c[calcularStatusExame(e.dataVencimento)]++);
          const pal = avatarColor(t.nome);
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
              <div class="w-actions">
                <button type="button" class="btn btn-ghost btn-sm" data-hist="${esc(t.id)}">Ver Histórico</button>
                <button type="button" class="btn btn-primary btn-sm" data-add="${esc(t.id)}">+ Exame</button>
              </div>
            </article>`;
        })
        .join("")
    : `<div class="card" style="grid-column:1/-1;padding:24px">${emptyState("Nenhum trabalhador encontrado", "Ajuste os termos da busca ou cadastre um novo colaborador.")}</div>`;
}

/* ---------- EXAMES (TABELA -> CARDS NO MOBILE) ---------- */
export function renderExames() {
  const f = lerFiltros();
  const lista = aplicarFiltros(
    state.exames.filter((e) => {
      const t = trabPorId(e.trabalhadorId);
      return (t && trabCasaTermo(t, f.q)) || exameCasaTermo(e, f.q);
    }),
    f,
  );

  $("tb-exames").innerHTML = lista.length
    ? lista
        .map((e) => {
          const t = trabPorId(e.trabalhadorId);
          const pal = avatarColor(t?.nome ?? "");
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
              <td data-label="Situação">${badge(calcularStatusExame(e.dataVencimento))}</td>
              <td class="td-actions" style="text-align:right"><div class="acts">${docBtn(e, "Abrir")}${acoesExame(e)}</div></td>
            </tr>`;
        })
        .join("")
    : `<tr class="empty-row"><td colspan="8" style="padding:32px">${emptyState("Nenhum exame encontrado", "Ajuste a busca ou os filtros de tipo e status.")}</td></tr>`;
}

/* ---------- RELATÓRIOS (TABELA -> CARDS NO MOBILE) ---------- */
export function renderRelatorios() {
  const c = calcularContagens();
  animarContador($("r-conf"), c.conf, { sufixo: "%" });
  animarContador($("r-err"), c.vencidos);
  animarContador($("r-warn"), c.alerta);

  $("tb-pend").innerHTML =
    linhasPendencia()
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
