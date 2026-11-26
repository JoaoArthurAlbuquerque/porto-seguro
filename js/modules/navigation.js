/**
 * Módulo de Navegação SPA, Drawer Mobile, Modais, Visualizador e Exportação
 * Porto Seguro · Gestão Ocupacional
 */

import { fileStore } from "../data.js";
import {
  state,
  $,
  emIframe,
  esc,
  trabPorId,
  gestorPorId,
  empresasDisponiveis,
  lerFiltros,
  linhasPendencia,
} from "./state.js";
import { toast } from "./animations.js";

export function syncBodyLock() {
  const modalAberto = !!document.querySelector(".modal:not(.hidden)");
  const menuAberto = $("sidebar")?.classList.contains("open");
  document.body.classList.toggle(
    "no-scroll",
    Boolean(modalAberto || menuAberto),
  );
}

/* ---------- Menu Lateral Mobile ---------- */
export function abrirMenu() {
  $("sidebar")?.classList.add("open");
  $("overlay")?.classList.add("on");
  $("menu-btn")?.setAttribute("aria-expanded", "true");
  syncBodyLock();
  setTimeout(() => $("sidebar-close-btn")?.focus(), 40);
}

export function fecharMenu() {
  const estavaAberto = $("sidebar")?.classList.contains("open");
  $("sidebar")?.classList.remove("open");
  $("overlay")?.classList.remove("on");
  $("menu-btn")?.setAttribute("aria-expanded", "false");
  syncBodyLock();
  if (estavaAberto) $("menu-btn")?.focus();
}

/* ---------- Troca de Views ---------- */
export function irPara(v, renderFn) {
  const destinos = ["dashboard", "trabalhadores", "exames", "relatorios"];
  if (!destinos.includes(v)) v = "dashboard";
  state.vista = v;

  document.querySelectorAll(".nav-item, .bottom-nav-item").forEach((n) => {
    const ativo = n.dataset.view === v;
    n.classList.toggle("active", ativo);
    if (ativo) n.setAttribute("aria-current", "page");
    else n.removeAttribute("aria-current");
  });

  document
    .querySelectorAll(".view")
    .forEach((s) => s.classList.toggle("hidden", s.id !== `view-${v}`));

  fecharMenu();
  window.scrollTo({ top: 0, behavior: "smooth" });
  renderFn?.();
}

/* ---------- Modo de Anexo no Modal de Exame ---------- */
export function setDocModo(m, preservarArquivo = false) {
  state.docModo = m;
  if (!preservarArquivo) {
    state.arquivoBlob = null;
    state.arquivoNome = "";
    const fileInput = $("e-file");
    if (fileInput) fileInput.value = "";
  }
  $("e-link")?.removeAttribute("aria-invalid");

  const atual =
    state.editExId && state.exames.find((x) => x.id === state.editExId);
  const fileNameTag = $("file-name");
  if (fileNameTag) {
    if (preservarArquivo && state.arquivoNome) {
      fileNameTag.textContent = `📎 ${state.arquivoNome}`;
    } else if (m === "file" && (atual?.arquivoId || atual?.arquivo)) {
      fileNameTag.textContent = `📎 ${atual.arquivoNome || "arquivo atual"} (mantido se não for trocado)`;
    } else {
      fileNameTag.textContent = "";
    }
  }

  document.querySelectorAll("[data-doc]").forEach((b) => {
    const ativo = b.dataset.doc === m;
    b.classList.toggle("on", ativo);
    b.setAttribute("aria-selected", ativo);
  });

  $("doc-link")?.classList.toggle("hidden", m !== "link");
  $("doc-file")?.classList.toggle("hidden", m !== "file");
  $("doc-err")?.classList.add("hidden");
}

function syncEmpresasDatalist() {
  const dl = $("empresas-datalist");
  if (!dl) return;
  dl.innerHTML = empresasDisponiveis()
    .map((emp) => `<option value="${esc(emp)}"></option>`)
    .join("");
}

/* ---------- Modais ---------- */
export function abrirModal(id, trabId) {
  state.ultimoFoco = document.activeElement;
  syncEmpresasDatalist();

  if (id === "modal-trabalhador") {
    const t = state.editTrabId && trabPorId(state.editTrabId);
    $("mt-title").textContent = t ? "Editar Trabalhador" : "Novo Trabalhador";
    $("mt-submit").textContent = t ? "Salvar Alterações" : "Salvar Trabalhador";
    $("btn-demo-trab")?.classList.toggle("hidden", Boolean(t));
    if (t) {
      $("t-nome").value = t.nome;
      $("t-cpf").value = t.cpf;
      $("t-setor").value = t.setor;
      $("t-emp").value = t.empresa;
    }
  }

  if (id === "modal-gestor") {
    const g = state.editGestorId && gestorPorId(state.editGestorId);
    $("mg-title").textContent = g ? "Editar Gestor" : "Novo Gestor";
    $("mg-submit").textContent = g ? "Salvar Alterações" : "Salvar Gestor";
    $("btn-demo-gestor")?.classList.toggle("hidden", Boolean(g));
    if (g) {
      $("g-nome").value = g.nome;
      $("g-cargo").value = g.cargo;
      $("g-emp").value = g.empresa;
      $("g-email").value = g.email;
      $("g-tel").value = g.telefone || "";
    }
  }

  if (id === "modal-exame") {
    if (!state.trabalhadores.length) {
      toast("Cadastre um trabalhador primeiro.", "warn");
      return abrirModal("modal-trabalhador");
    }
    $("e-trab").innerHTML = state.trabalhadores
      .map(
        (t) =>
          `<option value="${esc(t.id)}">${esc(t.nome)} — ${esc(t.setor)}</option>`,
      )
      .join("");
    $("e-trab").value =
      trabId || state.selecionadoId || state.trabalhadores[0].id;
    if (!$("e-real").value) {
      $("e-real").value = new Date().toISOString().slice(0, 10);
    }

    const ex =
      state.editExId && state.exames.find((e) => e.id === state.editExId);
    const renewEx =
      !ex &&
      state.renewExId &&
      state.exames.find((e) => e.id === state.renewExId);

    $("me-title").textContent = ex
      ? "Editar Exame"
      : renewEx
        ? "Renovar Exame / ASO"
        : "Registrar Exame ou ASO";
    $("me-submit").textContent = ex
      ? "Salvar Alterações"
      : renewEx
        ? "Registrar Renovação"
        : "Registrar Exame";
    $("btn-demo-exame")?.classList.toggle("hidden", Boolean(ex || renewEx));

    if (ex) {
      $("e-trab").value = ex.trabalhadorId;
      $("e-tipo").value = ex.tipo;
      $("e-lab").value = ex.laboratorio;
      $("e-real").value = ex.dataRealizacao;
      $("e-venc").value = ex.dataVencimento;
      $("e-med").value = ex.medico;
      if (ex.arquivoId || ex.arquivo) {
        setDocModo("file");
      } else {
        setDocModo("link");
        $("e-link").value = ex.linkDocumento || "";
      }
    } else if (renewEx) {
      const hoje = new Date();
      const venc = new Date(
        hoje.getFullYear() + 1,
        hoje.getMonth(),
        hoje.getDate(),
      );
      const toISO = (d) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

      $("e-trab").value = renewEx.trabalhadorId;
      $("e-tipo").value = renewEx.tipo;
      $("e-lab").value = renewEx.laboratorio;
      $("e-med").value = renewEx.medico;
      $("e-real").value = toISO(hoje);
      $("e-venc").value = toISO(venc);
      if (!state.arquivoBlob) {
        setDocModo("link");
      }
    }
  }

  const modal = $(id);
  if (!modal) return;
  modal.classList.remove("hidden");
  syncBodyLock();

  setTimeout(() => {
    modal
      .querySelector("input:not([type=hidden]):not(.sr-only), select")
      ?.focus();
  }, 40);
}

export function fecharModal(m) {
  if (!m) return;
  m.classList.add("hidden");
  const f = m.querySelector("form");
  f?.reset();
  f?.querySelectorAll("[aria-invalid]").forEach((i) =>
    i.removeAttribute("aria-invalid"),
  );
  f?.querySelectorAll(".error").forEach((e) => e.classList.add("hidden"));

  if (m.id !== "modal-confirm") {
    state.editTrabId = null;
    state.editExId = null;
    state.editGestorId = null;
    state.renewExId = null;
  }
  if (m.id === "modal-exame") setDocModo("link");
  if (m.id === "modal-doc") {
    $("md-body").innerHTML = "";
    if (state.docUrl) URL.revokeObjectURL(state.docUrl);
    state.docUrl = null;
  }
  syncBodyLock();
  state.ultimoFoco?.focus?.();
}

export function pedirConfirmacao(msg, fn) {
  $("mc-msg").textContent = msg;
  state.confirmarFn = fn;
  abrirModal("modal-confirm");
  setTimeout(
    () => $("form-confirm")?.querySelector(".btn-danger")?.focus(),
    40,
  );
}

/* ---------- Visualizador de Documentos ---------- */
function mostrarDoc(titulo, url, tipo, nome) {
  if (state.docUrl && state.docUrl !== url) URL.revokeObjectURL(state.docUrl);
  state.docUrl = url;
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

export async function abrirDocumento(id) {
  const ex = state.exames.find((e) => e.id === id);
  if (!ex) return;
  let blob = null;
  try {
    if (ex.arquivoId) blob = await fileStore.get(ex.arquivoId);
    else if (ex.arquivo) blob = await (await fetch(ex.arquivo)).blob();
  } catch {}

  if (blob) {
    return mostrarDoc(
      `${ex.tipo} · ${trabPorId(ex.trabalhadorId)?.nome ?? ""}`,
      URL.createObjectURL(blob),
      blob.type || ex.arquivoTipo || "",
      ex.arquivoNome || "documento",
    );
  }
  if (ex.arquivoId || ex.arquivo) {
    return toast("Arquivo não encontrado neste navegador.", "warn");
  }
  if (ex.linkDocumento && /^https?:\/\//i.test(ex.linkDocumento)) {
    window.open(ex.linkDocumento, "_blank", "noopener");
  } else if (ex.linkDocumento) {
    toast("Link de documento inválido.", "warn");
  } else {
    toast("Documento não disponível.", "warn");
  }
}

/* ---------- Exportação CSV e Impressão ---------- */
export function exportarCSV() {
  const q = (v) => `"${String(v).replace(/"/g, '""')}"`;
  const empresa = lerFiltros().empresa;
  const rows = [
    ["Trabalhador", "CPF", "Setor", "Empresa", "Situação", "Ação recomendada"],
    ...linhasPendencia(empresa).map(({ t, info }) => [
      t.nome,
      t.cpf,
      t.setor,
      t.empresa,
      info[1],
      info[2],
    ]),
  ];
  const csv = rows.map((r) => r.map(q).join(";")).join("\n");
  const nome = `conformidade-porto-seguro-${new Date().toISOString().slice(0, 10)}.csv`;
  const url = URL.createObjectURL(
    new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }),
  );

  if (emIframe) {
    if (state.docUrl) URL.revokeObjectURL(state.docUrl);
    state.docUrl = url;
    $("md-title").textContent = "Relatório CSV";
    $("md-body").innerHTML =
      `<p class="subtle" style="margin-bottom:12px;">Se o download for bloqueado neste ambiente, copie o conteúdo abaixo.</p><textarea class="input viewer" style="height:50dvh;padding:12px;font:12px var(--font-mono)" readonly></textarea>`;
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
  toast("Relatório CSV exportado com sucesso.");
}

export function imprimirRelatorio() {
  const printDate = $("print-date");
  if (printDate) {
    printDate.textContent = "Gerado em " + new Date().toLocaleString("pt-BR");
  }
  if (emIframe) {
    return toast(
      "Na pré-visualização, use Exportar → PDF do painel. Localmente, este botão abre a impressão.",
      "warn",
    );
  }
  window.print();
}
