/**
 * Lógica da Aplicação SPA - Saúde Unificada
 * Redesenhada para proporcionar uma experiência acolhedora, amigável e de alta clareza
 */
document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);
  let trabalhadores = obterTrabalhadores();
  let exames = obterExames();
  let selecionadoId = trabalhadores[0]?.id ?? null;
  let vista = "dashboard";
  let docModo = "link",
    arquivoBlob = null,
    arquivoNome = "";
  const emIframe = (() => {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
  })();

  const ST = {
    validos: { l: "Válido", c: "ok" },
    alerta: { l: "A vencer", c: "warn" },
    vencidos: { l: "Vencido", c: "err" },
  };
  const MESES = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];

  /* Paleta amigável de avatares com base no nome */
  const AVATAR_PALETTES = [
    { bg: "#eff6ff", color: "#2563eb" },
    { bg: "#f5f3ff", color: "#7c3aed" },
    { bg: "#ecfdf5", color: "#059669" },
    { bg: "#fff7ed", color: "#ea580c" },
    { bg: "#fdf2f8", color: "#db2777" },
    { bg: "#f0fdfa", color: "#0d9488" },
  ];
  function avatarColor(name) {
    let hash = 0;
    for (let i = 0; i < (name || "").length; i++) hash += name.charCodeAt(i);
    return AVATAR_PALETTES[hash % AVATAR_PALETTES.length];
  }

  /* ---------- utilidades ---------- */
  const esc = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const norm = (s) =>
    String(s ?? "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  const iniciais = (n) =>
    n
      .split(" ")
      .filter(Boolean)
      .map((p) => p[0])
      .filter((_, i, a) => i === 0 || i === a.length - 1)
      .join("")
      .toUpperCase();
  const badge = (st) => `<span class="badge ${ST[st].c}">${ST[st].l}</span>`;
  const trabPorId = (id) => trabalhadores.find((t) => t.id === id);
  const examesDe = (id) => exames.filter((e) => e.trabalhadorId === id);
  const piorStatus = (lista) =>
    lista.some((e) => calcularStatusExame(e.dataVencimento) === "vencidos")
      ? "vencidos"
      : lista.some((e) => calcularStatusExame(e.dataVencimento) === "alerta")
        ? "alerta"
        : lista.length
          ? "validos"
          : "none";
  const docBtn = (ex, label = "Ver documento") =>
    `<button class="btn btn-ghost btn-sm" data-docid="${esc(ex.id)}"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> ${label}</button>`;
  const ICO_EDIT = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>`;
  const ICO_DEL = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>`;
  const acoesExame = (ex) =>
    `<button class="icon-act" data-edit-ex="${esc(ex.id)}" aria-label="Editar exame" title="Editar">${ICO_EDIT}</button><button class="icon-act del" data-del-ex="${esc(ex.id)}" aria-label="Excluir exame" title="Excluir">${ICO_DEL}</button>`;
  const empty = (t, s) =>
    `<div class="empty"><svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><strong>${t}</strong><span>${s}</span></div>`;
  function toast(msg) {
    document.querySelector(".toast")?.remove();
    const t = document.createElement("div");
    t.className = "toast";
    t.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg> <span>${esc(msg)}</span>`;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2800);
  }

  /* ---------- filtros ---------- */
  const filtros = () => ({
    q: norm($("q").value.trim()),
    tipo: $("f-tipo").value,
    status: $("f-status").value,
    ordem: $("f-ordem").value,
  });
  function aplicarFiltros(lista, { tipo, status, ordem }) {
    let r = lista;
    if (tipo !== "todos") r = r.filter((e) => e.tipo === tipo);
    if (status !== "todos")
      r = r.filter((e) => calcularStatusExame(e.dataVencimento) === status);
    const by =
      ordem === "vencimento"
        ? (a, b) => a.dataVencimento.localeCompare(b.dataVencimento)
        : ordem === "antigos"
          ? (a, b) => a.dataRealizacao.localeCompare(b.dataRealizacao)
          : (a, b) => b.dataRealizacao.localeCompare(a.dataRealizacao);
    return [...r].sort(by);
  }
  const exameCasaTermo = (e, q) =>
    !q ||
    norm(e.tipo).includes(q) ||
    norm(e.medico).includes(q) ||
    norm(e.laboratorio).includes(q);
  const trabCasaTermo = (t, q) =>
    !q ||
    norm(t.nome).includes(q) ||
    t.cpf.replace(/\D/g, "").includes(q.replace(/\D/g, "") || "§") ||
    t.cpf.includes(q) ||
    norm(t.setor).includes(q) ||
    norm(t.empresa).includes(q);
  function syncFiltroUI() {
    const f = filtros();
    $("f-tipo").classList.toggle("is-set", f.tipo !== "todos");
    $("f-status").classList.toggle("is-set", f.status !== "todos");
    $("f-clear").classList.toggle(
      "hidden",
      f.tipo === "todos" && f.status === "todos" && !f.q,
    );
    document
      .querySelectorAll(".kpi")
      .forEach((k) =>
        k.classList.toggle(
          "selected",
          k.dataset.kpi !== "todos" && k.dataset.kpi === f.status,
        ),
      );
    $("filters").classList.toggle(
      "hidden",
      !["dashboard", "exames"].includes(vista),
    );
  }

  /* ---------- navegação ---------- */
  function irPara(v) {
    vista = v;
    document
      .querySelectorAll(".nav-item, .bottom-nav-item")
      .forEach((n) => n.classList.toggle("active", n.dataset.view === v));
    document
      .querySelectorAll(".view")
      .forEach((s) => s.classList.toggle("hidden", s.id !== `view-${v}`));
    fecharMenu();
    render();
  }
  function render() {
    syncFiltroUI();
    badgeNav();
    ({
      dashboard: renderDashboard,
      trabalhadores: renderTrabalhadores,
      exames: renderExames,
      relatorios: renderRelatorios,
    })[vista]();
  }
  function contagens() {
    const c = { validos: 0, alerta: 0, vencidos: 0 };
    exames.forEach((e) => c[calcularStatusExame(e.dataVencimento)]++);
    const comExame = trabalhadores.filter((t) => examesDe(t.id).length);
    const conformes = comExame.filter(
      (t) => piorStatus(examesDe(t.id)) !== "vencidos",
    ).length;
    c.conf = comExame.length
      ? Math.round((conformes / comExame.length) * 100)
      : 100;
    c.conformes = conformes;
    c.base = comExame.length;
    return c;
  }
  function badgeNav() {
    const n = trabalhadores.filter(
      (t) => piorStatus(examesDe(t.id)) === "vencidos",
    ).length;
    $("nav-pend").textContent = n;
    $("nav-pend").classList.toggle("hidden", !n);
    const bp = $("bottom-nav-pend");
    if (bp) {
      bp.textContent = n;
      bp.classList.toggle("hidden", !n);
    }
  }

  /* ---------- DASHBOARD ---------- */
  function renderDashboard() {
    const c = contagens(),
      f = filtros();
    $("k-total").textContent = exames.length;
    $("k-trab").textContent = trabalhadores.length;
    $("k-ok").textContent = c.validos;
    $("k-warn").textContent = c.alerta;
    $("k-err").textContent = c.vencidos;
    $("conf-num").textContent = c.conf + "%";
    $("conf-bar").style.width = c.conf + "%";
    $("conf-frac").textContent = `${c.conformes}/${c.base}`;
    renderGrafico();
    renderAside();

    // Filtro de trabalhadores
    const lista = trabalhadores.filter(
      (t) =>
        trabCasaTermo(t, f.q) ||
        examesDe(t.id).some((e) => exameCasaTermo(e, f.q)),
    );
    $("count-trab").textContent = lista.length;
    if (lista.length && !lista.some((t) => t.id === selecionadoId))
      selecionadoId = lista[0].id;
    $("worker-list").innerHTML = lista.length
      ? lista
          .map((t) => {
            const ps = piorStatus(examesDe(t.id));
            const pal = avatarColor(t.nome);
            return `
      <button class="worker-item ${t.id === selecionadoId ? "active" : ""}" data-sel="${esc(t.id)}" role="option" aria-selected="${t.id === selecionadoId}">
        <span class="avatar" style="background:${pal.bg};color:${pal.color}">${esc(iniciais(t.nome))}</span>
        <div><div class="w-name">${esc(t.nome)}</div><div class="w-sub">${esc(t.setor)}</div></div>
        <span class="dot ${ps === "none" ? "none" : ST[ps].c}"></span>
      </button>`;
          })
          .join("")
      : empty("Nenhum trabalhador", "Ajuste os termos da busca.");
    renderHistorico(
      lista.some((t) => t.id === selecionadoId)
        ? trabPorId(selecionadoId)
        : null,
      f,
    );
  }

  function renderHistorico(t, f) {
    if (!t) {
      $("worker-banner").innerHTML = "";
      $("timeline").innerHTML = empty(
        "Nenhum trabalhador selecionado",
        "Selecione um colaborador na lista ao lado.",
      );
      return;
    }
    const todos = examesDe(t.id);
    const pal = avatarColor(t.nome);
    $("worker-banner").innerHTML =
      `<div class="worker-banner"><span class="avatar lg" style="background:${pal.bg};color:${pal.color}">${esc(iniciais(t.nome))}</span>
      <div style="flex:1;min-width:0"><div class="h2">${esc(t.nome)}</div>
      <div class="meta"><span>CPF: ${esc(t.cpf)}</span><span>${esc(t.setor)}</span><span>${esc(t.empresa)}</span></div></div>
      <div class="acts"><button class="icon-act" data-edit-trab="${esc(t.id)}" aria-label="Editar trabalhador" title="Editar">${ICO_EDIT}</button><button class="btn btn-primary btn-sm" data-add="${esc(t.id)}">+ Novo Exame</button></div></div>`;
    
    // termo só filtra exames se NÃO for o próprio trabalhador que casou
    let lista = trabCasaTermo(t, f.q)
      ? todos
      : todos.filter((e) => exameCasaTermo(e, f.q));
    lista = aplicarFiltros(lista, f);
    if (!lista.length) {
      $("timeline").innerHTML = todos.length
        ? empty("Nenhum exame com esses filtros", "Tente limpar os filtros selecionados.")
        : empty(
            "Sem exames registrados",
            "Registre o primeiro exame ocupacional deste colaborador.",
          );
      return;
    }
    $("timeline").innerHTML = lista
      .map((ex) => {
        const st = calcularStatusExame(ex.dataVencimento),
          d = parseLocalDate(ex.dataRealizacao),
          dias = diasAte(ex.dataVencimento);
        const rel =
          st === "vencidos"
            ? `venceu há ${-dias} dia(s)`
            : st === "alerta"
              ? `vence em ${dias} dia(s)`
              : "";
        return `<article class="exam">
        <div class="exam-date"><b>${String(d.getDate()).padStart(2, "0")}</b><small>${MESES[d.getMonth()]} ${String(d.getFullYear()).slice(2)}</small></div>
        <div style="min-width:0"><div class="exam-title">${esc(ex.tipo)} ${badge(st)}</div>
          <div class="exam-meta">Realização: ${formatarDataBR(ex.dataRealizacao)} · Validade: ${formatarDataBR(ex.dataVencimento)}${rel ? ` · <strong class="c-${ST[st].c}">${rel}</strong>` : ""}</div>
          <div class="exam-meta2">${esc(ex.laboratorio)} · ${esc(ex.medico)}</div></div>
        <div class="acts">${docBtn(ex)}${acoesExame(ex)}</div>
      </article>`;
      })
      .join("");
  }

  function renderGrafico() {
    const hoje = new Date(),
      cols = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      cols.push({ y: d.getFullYear(), m: d.getMonth(), n: 0 });
    }
    exames.forEach((e) => {
      const d = parseLocalDate(e.dataRealizacao);
      const c = cols.find(
        (c) => c.y === d.getFullYear() && c.m === d.getMonth(),
      );
      if (c) c.n++;
    });
    const max = Math.max(1, ...cols.map((c) => c.n));
    $("chart").innerHTML = cols
      .map(
        (c, i) =>
          `<div class="bar-col" title="${MESES[c.m]}/${c.y}: ${c.n} exame(s)"><div class="bar-track"><div class="bar ${i === 11 ? "current" : ""}" data-n="${c.n}" style="height:${Math.max(8, (c.n / max) * 100)}%"></div></div><span>${MESES[c.m]}</span></div>`,
      )
      .join("");
  }

  function renderAside() {
    const prox = exames
      .filter((e) => calcularStatusExame(e.dataVencimento) !== "validos")
      .sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento))
      .slice(0, 5);
    $("upcoming").innerHTML = prox.length
      ? prox
          .map((e) => {
            const t = trabPorId(e.trabalhadorId),
              d = diasAte(e.dataVencimento),
              st = calcularStatusExame(e.dataVencimento);
            return `<button class="up-item" data-sel="${esc(e.trabalhadorId)}"><span class="dot ${ST[st].c}"></span><div style="min-width:0"><div class="up-name">${esc(t?.nome ?? "N/A")}</div><div class="subtle">${esc(e.tipo)} · ${formatarDataBR(e.dataVencimento)}</div></div><span class="up-days c-${ST[st].c}">${d < 0 ? `${-d}d atrás` : `em ${d}d`}</span></button>`;
          })
          .join("")
      : `<p class="subtle" style="padding:8px 0">Todos os exames estão com a validade em dia! 🎉</p>`;
    const cnt = {};
    exames.forEach((e) => (cnt[e.tipo] = (cnt[e.tipo] || 0) + 1));
    const tot = exames.length || 1;
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
  function renderTrabalhadores() {
    const q = filtros().q,
      lista = trabalhadores.filter((t) => trabCasaTermo(t, q));
    $("grid-trab").innerHTML = lista.length
      ? lista
          .map((t) => {
            const ex = examesDe(t.id),
              c = { validos: 0, alerta: 0, vencidos: 0 };
            ex.forEach((e) => c[calcularStatusExame(e.dataVencimento)]++);
            const pal = avatarColor(t.nome);
            return `<article class="card w-card">
        <div class="w-card-head"><span class="avatar lg" style="background:${pal.bg};color:${pal.color}">${esc(iniciais(t.nome))}</span><div style="min-width:0;flex:1"><h3>${esc(t.nome)}</h3><div class="subtle">${esc(t.setor)}</div></div>
          <div class="acts"><button class="icon-act" data-edit-trab="${esc(t.id)}" aria-label="Editar trabalhador" title="Editar">${ICO_EDIT}</button><button class="icon-act del" data-del-trab="${esc(t.id)}" aria-label="Excluir trabalhador" title="Excluir">${ICO_DEL}</button></div></div>
        <dl class="kv"><dt>CPF</dt><dd>${esc(t.cpf)}</dd><dt>Empresa</dt><dd>${esc(t.empresa)}</dd><dt>Exames</dt><dd>${ex.length}</dd></dl>
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
        <div class="w-actions"><button class="btn btn-ghost btn-sm" data-hist="${esc(t.id)}">Ver Histórico</button><button class="btn btn-primary btn-sm" data-add="${esc(t.id)}">+ Exame</button></div>
      </article>`;
          })
          .join("")
      : `<div class="card" style="grid-column:1/-1;padding:24px">${empty("Nenhum trabalhador encontrado", "Ajuste os termos da busca ou cadastre um novo colaborador.")}</div>`;
  }

  /* ---------- EXAMES ---------- */
  function renderExames() {
    const f = filtros();
    const lista = aplicarFiltros(
      exames.filter((e) => {
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
            return `<tr><td><div class="cell-person"><span class="avatar" style="background:${pal.bg};color:${pal.color}">${esc(iniciais(t?.nome ?? "?"))}</span><strong>${esc(t?.nome ?? "N/A")}</strong></div></td>
      <td><span class="chip">${esc(e.tipo)}</span></td><td class="nowrap">${formatarDataBR(e.dataRealizacao)}</td><td class="nowrap">${formatarDataBR(e.dataVencimento)}</td>
      <td>${esc(e.laboratorio)}</td><td class="muted">${esc(e.medico)}</td><td>${badge(calcularStatusExame(e.dataVencimento))}</td><td style="text-align:right"><div class="acts">${docBtn(e, "Abrir")}${acoesExame(e)}</div></td></tr>`;
          })
          .join("")
      : `<tr><td colspan="8" style="padding:32px">${empty("Nenhum exame encontrado", "Ajuste a busca ou os filtros de tipo e status.")}</td></tr>`;
  }

  /* ---------- RELATÓRIOS ---------- */
  function linhasPendencia() {
    const ordem = { vencidos: 0, alerta: 1, none: 2, validos: 3 };
    return trabalhadores
      .map((t) => {
        const st = piorStatus(examesDe(t.id));
        const info = {
          vencidos: [
            "err",
            "Irregular",
            "Renovar imediatamente ASO/exame vencido.",
          ],
          alerta: ["warn", "Atenção", "Agendar exame nos próximos 30 dias."],
          validos: ["ok", "Em dia", "Nenhuma ação pendente."],
          none: [
            "neutral",
            "Sem registros",
            "Registrar ASO admissional/periódico.",
          ],
        }[st];
        return { t, st, info };
      })
      .sort((a, b) => ordem[a.st] - ordem[b.st]);
  }
  function renderRelatorios() {
    const c = contagens();
    $("r-conf").textContent = c.conf + "%";
    $("r-err").textContent = c.vencidos;
    $("r-warn").textContent = c.alerta;
    $("tb-pend").innerHTML =
      linhasPendencia()
        .map(
          ({ t, info }) => {
            const pal = avatarColor(t.nome);
            return `<tr><td><div class="cell-person"><span class="avatar" style="background:${pal.bg};color:${pal.color}">${esc(iniciais(t.nome))}</span><strong>${esc(t.nome)}</strong></div></td><td>${esc(t.setor)}</td><td>${esc(t.empresa)}</td><td><span class="badge ${info[0]}">${info[1]}</span></td><td class="muted">${info[2]}</td></tr>`;
          }
        )
        .join("") ||
      `<tr><td colspan="5" style="padding:32px">${empty("Sem trabalhadores", "Cadastre o primeiro colaborador para monitorar.")}</td></tr>`;
  }
  function exportarCSV() {
    const q = (v) => `"${String(v).replace(/"/g, '""')}"`;
    const rows = [
      [
        "Trabalhador",
        "CPF",
        "Setor",
        "Empresa",
        "Situação",
        "Ação recomendada",
      ],
      ...linhasPendencia().map(({ t, info }) => [
        t.nome,
        t.cpf,
        t.setor,
        t.empresa,
        info[1],
        info[2],
      ]),
    ];
    const csv = rows.map((r) => r.map(q).join(";")).join("\n"),
      nome = `conformidade-${new Date().toISOString().slice(0, 10)}.csv`;
    const url = URL.createObjectURL(
      new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }),
    );
    if (emIframe) {
      docUrl = url;
      $("md-title").textContent = "Relatório CSV";
      $("md-body").innerHTML =
        `<p class="subtle" style="margin-bottom:12px;">Se o download for bloqueado neste ambiente, copie o conteúdo abaixo.</p><textarea class="input viewer" style="height:50vh;padding:12px;font:12px ui-monospace,monospace" readonly></textarea>`;
      $("md-body").querySelector("textarea").value = csv;
      Object.assign($("md-open"), {
        href: url,
        download: nome,
        textContent: "Baixar CSV",
      });
      return abrirModal("modal-doc");
    }
    const a = Object.assign(document.createElement("a"), {
      href: url,
      download: nome,
    });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast("Relatório CSV gerado.");
  }
  function imprimir() {
    $("print-date").textContent =
      "Gerado em " + new Date().toLocaleString("pt-BR");
    if (emIframe)
      return toast(
        "Na pré-visualização, use Exportar → PDF do painel. Abrindo o arquivo localmente, este botão gera o PDF.",
      );
    window.print();
  }

  /* ---------- documentos ---------- */
  function mostrarDoc(titulo, url, tipo, nome) {
    docUrl = url;
    $("md-title").textContent = titulo;
    $("md-body").innerHTML = tipo.startsWith("image/")
      ? `<img class="viewer" alt="${esc(nome)}">`
      : `<iframe class="viewer" title="${esc(nome)}"></iframe>`;
    $("md-body").firstElementChild.src = url;
    $("md-open").removeAttribute("download");
    Object.assign($("md-open"), {
      href: url,
      textContent: "Abrir em nova aba",
    });
    abrirModal("modal-doc");
  }
  async function abrirDocumento(id) {
    const ex = exames.find((e) => e.id === id);
    if (!ex) return;
    let blob = null;
    try {
      if (ex.arquivoId) blob = await fileStore.get(ex.arquivoId);
      else if (ex.arquivo) blob = await (await fetch(ex.arquivo)).blob();
    } catch (e) {}
    if (blob)
      return mostrarDoc(
        `${ex.tipo} · ${trabPorId(ex.trabalhadorId)?.nome ?? ""}`,
        URL.createObjectURL(blob),
        blob.type || ex.arquivoTipo || "",
        ex.arquivoNome || "documento",
      );
    if (ex.arquivoId || ex.arquivo)
      return toast("Arquivo não encontrado neste navegador.");
    if (ex.linkDocumento) window.open(ex.linkDocumento, "_blank", "noopener");
    else toast("Documento não disponível.");
  }

  /* ---------- exclusão ---------- */
  function pedirConfirmacao(msg, fn) {
    $("mc-msg").textContent = msg;
    confirmar = fn;
    abrirModal("modal-confirm");
    setTimeout(
      () => $("form-confirm").querySelector(".btn-danger").focus(),
      40,
    );
  }
  function excluirExame(id) {
    const ex = exames.find((e) => e.id === id);
    if (!ex) return;
    pedirConfirmacao(
      `Excluir o exame "${ex.tipo}" realizado em ${formatarDataBR(ex.dataRealizacao)}? Esta ação não pode ser desfeita.`,
      () => {
        exames = exames.filter((e) => e.id !== id);
        salvarExames(exames);
        if (ex.arquivoId) fileStore.del(ex.arquivoId);
        render();
        toast("Exame excluído com sucesso.");
      },
    );
  }
  function excluirTrabalhador(id) {
    const t = trabPorId(id);
    if (!t) return;
    const ex = examesDe(id);
    pedirConfirmacao(
      `Excluir ${t.nome}${ex.length ? ` e seus ${ex.length} exame(s)` : ""}? Esta ação não pode ser desfeita.`,
      () => {
        ex.forEach((e) => e.arquivoId && fileStore.del(e.arquivoId));
        exames = exames.filter((e) => e.trabalhadorId !== id);
        trabalhadores = trabalhadores.filter((x) => x.id !== id);
        salvarExames(exames);
        salvarTrabalhadores(trabalhadores);
        if (selecionadoId === id) selecionadoId = trabalhadores[0]?.id ?? null;
        render();
        toast("Trabalhador excluído com sucesso.");
      },
    );
  }

  /* ---------- modais ---------- */
  let ultimoFoco = null,
    editTrabId = null,
    editExId = null,
    docUrl = null,
    confirmar = null;
  function abrirModal(id, trabId) {
    ultimoFoco = document.activeElement;
    if (id === "modal-trabalhador") {
      const t = editTrabId && trabPorId(editTrabId);
      $("mt-title").textContent = t ? "Editar Trabalhador" : "Novo Trabalhador";
      $("mt-submit").textContent = t
        ? "Salvar Alterações"
        : "Salvar Trabalhador";
      if (t) {
        $("t-nome").value = t.nome;
        $("t-cpf").value = t.cpf;
        $("t-setor").value = t.setor;
        $("t-emp").value = t.empresa;
      }
    }
    if (id === "modal-exame") {
      if (!trabalhadores.length) {
        toast("Cadastre um trabalhador primeiro.");
        return abrirModal("modal-trabalhador");
      }
      $("e-trab").innerHTML = trabalhadores
        .map(
          (t) =>
            `<option value="${esc(t.id)}">${esc(t.nome)} — ${esc(t.setor)}</option>`,
        )
        .join("");
      $("e-trab").value = trabId || selecionadoId || trabalhadores[0].id;
      if (!$("e-real").value)
        $("e-real").value = new Date().toISOString().slice(0, 10);
      const ex = editExId && exames.find((e) => e.id === editExId);
      $("me-title").textContent = ex
        ? "Editar Exame"
        : "Registrar Exame ou ASO";
      $("me-submit").textContent = ex ? "Salvar Alterações" : "Registrar Exame";
      if (ex) {
        $("e-trab").value = ex.trabalhadorId;
        $("e-tipo").value = ex.tipo;
        $("e-lab").value = ex.laboratorio;
        $("e-real").value = ex.dataRealizacao;
        $("e-venc").value = ex.dataVencimento;
        $("e-med").value = ex.medico;
        if (ex.arquivoId || ex.arquivo) {
          setDocModo("file");
          $("file-name").textContent =
            `📎 ${ex.arquivoNome || "arquivo atual"} (mantido se não for trocado)`;
        } else $("e-link").value = ex.linkDocumento || "";
      }
    }
    $(id).classList.remove("hidden");
    setTimeout(
      () =>
        $(id)
          .querySelector("input:not([type=hidden]):not(.sr-only),select")
          ?.focus(),
      30,
    );
  }
  function fecharModal(m) {
    m.classList.add("hidden");
    const f = m.querySelector("form");
    f.reset();
    f.querySelectorAll("[aria-invalid]").forEach((i) =>
      i.removeAttribute("aria-invalid"),
    );
    f.querySelectorAll(".error").forEach((e) => e.classList.add("hidden"));
    if (m.id === "modal-exame") setDocModo("link");
    if (m.id === "modal-doc") {
      $("md-body").innerHTML = "";
      if (docUrl) URL.revokeObjectURL(docUrl);
      docUrl = null;
    }
    if (m.id !== "modal-confirm") {
      editTrabId = null;
      editExId = null;
    }
    ultimoFoco?.focus?.();
  }
  function setDocModo(m) {
    docModo = m;
    arquivoBlob = null;
    arquivoNome = "";
    $("file-name").textContent = "";
    $("e-file").value = "";
    document
      .querySelectorAll("[data-doc]")
      .forEach((b) => b.classList.toggle("on", b.dataset.doc === m));
    $("doc-link").classList.toggle("hidden", m !== "link");
    $("doc-file").classList.toggle("hidden", m !== "file");
    $("doc-err").classList.add("hidden");
  }
  function lerArquivo(file) {
    if (!file) return;
    if (!/^(application\/pdf|image\/)/.test(file.type)) {
      toast("Envie um PDF ou uma imagem.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast("Arquivo acima de 10 MB. Use um link (Drive/URL).");
      return;
    }
    arquivoBlob = file;
    arquivoNome = file.name;
    $("file-name").textContent = "📎 " + file.name;
    $("doc-err").classList.add("hidden");
  }
  function validar(form) {
    let ok = true;
    form.querySelectorAll("[required]").forEach((i) => {
      const bad = !String(i.value).trim();
      i.setAttribute("aria-invalid", bad);
      if (bad) ok = false;
    });
    return ok;
  }

  /* ---------- menu mobile ---------- */
  const fecharMenu = () => {
    $("sidebar").classList.remove("open");
    $("overlay").classList.remove("on");
  };

  /* ---------- eventos ---------- */
  document.querySelectorAll(".nav-item, .bottom-nav-item").forEach((n) =>
    n.addEventListener("click", (e) => {
      e.preventDefault();
      irPara(n.dataset.view);
    }),
  );
  $("menu-btn").addEventListener("click", () => {
    $("sidebar").classList.add("open");
    $("overlay").classList.add("on");
  });
  $("sidebar-close-btn")?.addEventListener("click", fecharMenu);
  $("overlay").addEventListener("click", fecharMenu);
  ["q", "f-tipo", "f-status", "f-ordem"].forEach((id) =>
    $(id).addEventListener(id === "q" ? "input" : "change", render),
  );
  $("f-clear").addEventListener("click", () => {
    $("q").value = "";
    $("f-tipo").value = "todos";
    $("f-status").value = "todos";
    render();
  });
  document.querySelectorAll(".kpi").forEach((k) =>
    k.addEventListener("click", () => {
      const v = k.dataset.kpi;
      $("f-status").value =
        v === "todos" || $("f-status").value === v ? "todos" : v;
      render();
    }),
  );
  $("btn-csv").addEventListener("click", exportarCSV);
  $("btn-print").addEventListener("click", imprimir);
  $("form-confirm").addEventListener("submit", (e) => {
    e.preventDefault();
    const fn = confirmar;
    confirmar = null;
    fecharModal($("modal-confirm"));
    fn?.();
  });

  // delegação global
  document.addEventListener("click", (e) => {
    const el = e.target.closest(
      "[data-open],[data-close],[data-docid],[data-sel],[data-add],[data-hist],[data-doc],[data-edit-ex],[data-del-ex],[data-edit-trab],[data-del-trab]",
    );
    if (!el) return;
    if (el.dataset.open) {
      editTrabId = editExId = null;
      abrirModal(el.dataset.open);
    } else if (el.hasAttribute("data-close")) fecharModal(el.closest(".modal"));
    else if (el.dataset.docid) abrirDocumento(el.dataset.docid);
    else if (el.dataset.add) {
      editExId = null;
      abrirModal("modal-exame", el.dataset.add);
    } else if (el.dataset.editEx) {
      editExId = el.dataset.editEx;
      abrirModal("modal-exame");
    } else if (el.dataset.delEx) excluirExame(el.dataset.delEx);
    else if (el.dataset.editTrab) {
      editTrabId = el.dataset.editTrab;
      abrirModal("modal-trabalhador");
    } else if (el.dataset.delTrab) excluirTrabalhador(el.dataset.delTrab);
    else if (el.dataset.hist) {
      selecionadoId = el.dataset.hist;
      $("q").value = "";
      irPara("dashboard");
    } else if (el.dataset.sel) {
      selecionadoId = el.dataset.sel;
      renderDashboard();
      if (innerWidth <= 900)
        $("worker-banner").scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    } else if (el.dataset.doc) setDocModo(el.dataset.doc);
  });
  document.querySelectorAll(".modal").forEach((m) =>
    m.addEventListener("mousedown", (e) => {
      if (e.target === m) fecharModal(m);
    }),
  );
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const m = document.querySelector(".modal:not(.hidden)");
      if (m) fecharModal(m);
      else fecharMenu();
    }
    if (
      e.key === "/" &&
      !/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)
    ) {
      e.preventDefault();
      $("q").focus();
    }
  });
  document
    .querySelectorAll(".input")
    .forEach((i) =>
      i.addEventListener("input", () => i.removeAttribute("aria-invalid")),
    );

  // máscara de CPF
  $("t-cpf").addEventListener("input", (e) => {
    const d = e.target.value.replace(/\D/g, "");
    if (d.length <= 11 && /^\d*$/.test(e.target.value.replace(/[.\-]/g, "")))
      e.target.value = d
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  });
  // sugere vencimento +1 ano
  $("e-real").addEventListener("change", () => {
    if (!$("e-venc").value && $("e-real").value) {
      const d = parseLocalDate($("e-real").value);
      d.setFullYear(d.getFullYear() + 1);
      $("e-venc").value =
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    }
  });
  // arquivo: clique e arrastar
  $("e-file").addEventListener("change", (e) => lerArquivo(e.target.files[0]));
  const drop = $("drop");
  ["dragover", "dragenter"].forEach((ev) =>
    drop.addEventListener(ev, (e) => {
      e.preventDefault();
      drop.classList.add("over");
    }),
  );
  ["dragleave", "drop"].forEach((ev) =>
    drop.addEventListener(ev, (e) => {
      e.preventDefault();
      drop.classList.remove("over");
    }),
  );
  drop.addEventListener("drop", (e) => lerArquivo(e.dataTransfer.files[0]));

  $("form-trab").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target;
    if (!validar(f)) return;
    const cpf = $("t-cpf").value.trim();
    if (trabalhadores.some((t) => t.cpf === cpf && t.id !== editTrabId)) {
      $("t-cpf").setAttribute("aria-invalid", true);
      $("t-cpf-err").textContent = "CPF já cadastrado.";
      $("t-cpf-err").classList.remove("hidden");
      return;
    }
    const dados = {
      nome: $("t-nome").value.trim(),
      cpf,
      setor: $("t-setor").value.trim(),
      empresa: $("t-emp").value.trim(),
    };
    const editando = !!editTrabId;
    let t;
    if (editando) {
      t = trabPorId(editTrabId);
      Object.assign(t, dados);
    } else {
      t = { id: "trab-" + Date.now(), ...dados };
      trabalhadores.push(t);
    }
    salvarTrabalhadores(trabalhadores);
    selecionadoId = t.id;
    fecharModal($("modal-trabalhador"));
    render();
    toast(
      editando
        ? "Dados do colaborador atualizados."
        : `${t.nome.split(" ")[0]} cadastrado(a) com sucesso!`,
    );
  });

  $("form-exame").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target;
    let ok = validar(f);
    const r = $("e-real").value,
      v = $("e-venc").value;
    const datasOk = !(r && v && v < r);
    $("e-venc-err").classList.toggle("hidden", datasOk);
    if (!datasOk) {
      $("e-venc").setAttribute("aria-invalid", true);
      ok = false;
    }
    const link = $("e-link").value.trim();
    const atual = editExId && exames.find((x) => x.id === editExId);
    const docOk =
      docModo === "file"
        ? !!(arquivoBlob || atual?.arquivoId || atual?.arquivo)
        : /^https?:\/\/\S+$/i.test(link);
    $("doc-err").classList.toggle("hidden", docOk);
    if (docModo === "link") $("e-link").setAttribute("aria-invalid", !docOk);
    if (!docOk) ok = false;
    if (!ok) return;
    const id = atual ? atual.id : "ex-" + Date.now();
    const ex = {
      id,
      trabalhadorId: $("e-trab").value,
      tipo: $("e-tipo").value,
      laboratorio: $("e-lab").value.trim(),
      dataRealizacao: r,
      dataVencimento: v,
      medico: $("e-med").value.trim(),
      linkDocumento: docModo === "link" ? link : "",
    };
    if (docModo === "file") {
      if (arquivoBlob) {
        await fileStore.put(id, arquivoBlob);
        Object.assign(ex, {
          arquivoId: id,
          arquivoNome,
          arquivoTipo: arquivoBlob.type,
        });
      } else
        Object.assign(ex, {
          arquivoId: atual.arquivoId,
          arquivo: atual.arquivo,
          arquivoNome: atual.arquivoNome,
          arquivoTipo: atual.arquivoTipo,
        });
    } else if (atual?.arquivoId) fileStore.del(atual.arquivoId);
    const backup = exames;
    exames = atual
      ? exames.map((x) => (x.id === id ? ex : x))
      : [...exames, ex];
    if (!salvarExames(exames)) {
      exames = backup;
      toast("Não foi possível salvar os dados.");
      return;
    }
    selecionadoId = ex.trabalhadorId;
    fecharModal($("modal-exame"));
    render();
    toast(atual ? "Exame atualizado." : "Exame registrado com sucesso!");
  });

  render();
});
