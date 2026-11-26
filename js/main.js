/**
 * Ponto de Entrada da Aplicação SPA - Porto Seguro · Gestão Ocupacional
 */

import {
  state,
  $,
  persistirTudo,
  restaurarDemoState,
} from "./modules/state.js";
import {
  abrirMenu,
  fecharMenu,
  irPara,
  setDocModo,
  abrirModal,
  fecharModal,
  pedirConfirmacao,
  abrirDocumento,
  exportarCSV,
  imprimirRelatorio,
} from "./modules/navigation.js";
import {
  syncFiltroUI,
  badgeNav,
  renderDashboard,
  renderTrabalhadores,
  renderExames,
  renderRelatorios,
  prepararExclusaoExame,
  prepararExclusaoTrabalhador,
  prepararExclusaoGestor,
} from "./modules/tables.js";
import { initForms, anexarArquivoRapido } from "./modules/forms.js";
import { toast } from "./modules/animations.js";

function render() {
  syncFiltroUI();
  badgeNav();
  ({
    dashboard: renderDashboard,
    trabalhadores: renderTrabalhadores,
    exames: renderExames,
    relatorios: renderRelatorios,
  })[state.vista]();
}

document.addEventListener("DOMContentLoaded", () => {
  // Navegação principal (Sidebar + Barra Inferior Mobile)
  document.querySelectorAll(".nav-item, .bottom-nav-item").forEach((n) =>
    n.addEventListener("click", (e) => {
      e.preventDefault();
      irPara(n.dataset.view, render);
    }),
  );

  // Gaveta lateral mobile
  $("menu-btn")?.addEventListener("click", abrirMenu);
  $("sidebar-close-btn")?.addEventListener("click", fecharMenu);
  $("overlay")?.addEventListener("click", fecharMenu);

  // Busca e filtros
  ["q", "f-empresa", "f-tipo", "f-status", "f-ordem"].forEach((id) =>
    $(id)?.addEventListener(id === "q" ? "input" : "change", render),
  );

  $("f-clear")?.addEventListener("click", () => {
    $("q").value = "";
    if ($("f-empresa")) $("f-empresa").value = "todas";
    $("f-tipo").value = "todos";
    $("f-status").value = "todos";
    render();
  });

  // Botão único (+ Novo Registro) com menu dropdown
  const btnNovoReg = $("btn-novo-registro");
  const menuNovoReg = $("novo-registro-menu");
  const fecharMenuNovoReg = () => {
    menuNovoReg?.classList.add("hidden");
    btnNovoReg?.setAttribute("aria-expanded", "false");
  };
  btnNovoReg?.addEventListener("click", (e) => {
    e.stopPropagation();
    const aberto = !menuNovoReg?.classList.contains("hidden");
    menuNovoReg?.classList.toggle("hidden", aberto);
    btnNovoReg.setAttribute("aria-expanded", String(!aberto));
  });

  // Exportação rápida no Card de Conformidade
  $("btn-quick-pdf")?.addEventListener("click", imprimirRelatorio);
  $("btn-quick-csv")?.addEventListener("click", exportarCSV);

  // Drag & Drop direto na Central de Documentos Digitais
  const docsCard = $("docs-central-card");
  if (docsCard) {
    ["dragover", "dragenter"].forEach((ev) =>
      docsCard.addEventListener(ev, (e) => {
        e.preventDefault();
        docsCard.classList.add("drag-over");
      }),
    );
    ["dragleave", "drop"].forEach((ev) =>
      docsCard.addEventListener(ev, (e) => {
        e.preventDefault();
        docsCard.classList.remove("drag-over");
      }),
    );
    docsCard.addEventListener("drop", (e) => {
      const file = e.dataTransfer?.files?.[0];
      if (file) anexarArquivoRapido(file);
    });
  }

  // Atalho de filtro pelos cards de KPI
  document.querySelectorAll(".kpi").forEach((k) =>
    k.addEventListener("click", () => {
      const v = k.dataset.kpi;
      $("f-status").value =
        v === "todos" || $("f-status").value === v ? "todos" : v;
      render();
    }),
  );

  // Ações de Relatórios
  $("btn-csv")?.addEventListener("click", exportarCSV);
  $("btn-print")?.addEventListener("click", imprimirRelatorio);
  $("btn-reset-demo")?.addEventListener("click", () => {
    pedirConfirmacao(
      "Restaurar os 5 trabalhadores e 8 exames originais da demonstração?",
      () => {
        restaurarDemoState();
        render();
        toast("Dados da demonstração restaurados.");
      },
    );
  });

  // Modal de Confirmação
  $("form-confirm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const fn = state.confirmarFn;
    state.confirmarFn = null;
    fecharModal($("modal-confirm"));
    fn?.();
  });

  // Delegação global de cliques
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".cta-menu-wrap")) {
      fecharMenuNovoReg();
    }

    const el = e.target.closest(
      "[data-open],[data-close],[data-docid],[data-sel],[data-add],[data-hist],[data-doc],[data-edit-ex],[data-del-ex],[data-renew-ex],[data-edit-trab],[data-del-trab],[data-edit-gestor],[data-del-gestor],[data-periodo],[data-pend-tab],[data-equipe-tab]",
    );
    if (!el) return;

    if (el.dataset.open) {
      fecharMenuNovoReg();
      state.editTrabId = null;
      state.editExId = null;
      state.editGestorId = null;
      state.renewExId = null;
      abrirModal(el.dataset.open);
    } else if (el.hasAttribute("data-close")) {
      fecharModal(el.closest(".modal"));
    } else if (el.dataset.docid) {
      abrirDocumento(el.dataset.docid);
    } else if (el.dataset.add) {
      state.editExId = null;
      state.renewExId = null;
      abrirModal("modal-exame", el.dataset.add);
    } else if (el.dataset.renewEx) {
      state.editExId = null;
      state.renewExId = el.dataset.renewEx;
      abrirModal("modal-exame");
    } else if (el.dataset.editEx) {
      state.renewExId = null;
      state.editExId = el.dataset.editEx;
      abrirModal("modal-exame");
    } else if (el.dataset.delEx) {
      prepararExclusaoExame(el.dataset.delEx, pedirConfirmacao, (msg) => {
        persistirTudo();
        render();
        toast(msg);
      });
    } else if (el.dataset.editTrab) {
      state.editTrabId = el.dataset.editTrab;
      abrirModal("modal-trabalhador");
    } else if (el.dataset.delTrab) {
      prepararExclusaoTrabalhador(
        el.dataset.delTrab,
        pedirConfirmacao,
        (msg) => {
          persistirTudo();
          render();
          toast(msg);
        },
      );
    } else if (el.dataset.editGestor) {
      state.editGestorId = el.dataset.editGestor;
      abrirModal("modal-gestor");
    } else if (el.dataset.delGestor) {
      prepararExclusaoGestor(el.dataset.delGestor, pedirConfirmacao, (msg) => {
        persistirTudo();
        render();
        toast(msg);
      });
    } else if (el.dataset.periodo) {
      state.periodoGrafico = el.dataset.periodo;
      render();
    } else if (el.dataset.pendTab) {
      state.pendTab = el.dataset.pendTab;
      render();
    } else if (el.dataset.equipeTab) {
      state.equipeTab = el.dataset.equipeTab;
      render();
    } else if (el.dataset.hist) {
      state.selecionadoId = el.dataset.hist;
      $("q").value = "";
      irPara("dashboard", render);
    } else if (el.dataset.sel) {
      state.selecionadoId = el.dataset.sel;
      renderDashboard();
      if (window.innerWidth <= 900) {
        $("worker-banner")?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    } else if (el.dataset.doc) {
      setDocModo(el.dataset.doc);
    }
  });

  // Fechar modal clicando fora
  document.querySelectorAll(".modal").forEach((m) =>
    m.addEventListener("mousedown", (e) => {
      if (e.target === m) fecharModal(m);
    }),
  );

  // Atalhos de teclado (Escape, Tab trap em modais e / para busca)
  document.addEventListener("keydown", (e) => {
    const modalAtivo = document.querySelector(".modal:not(.hidden)");
    if (e.key === "Tab" && modalAtivo) {
      const focaveis = [
        ...modalAtivo.querySelectorAll(
          'button:not([disabled]):not(.hidden), [href], input:not([disabled]):not([type="hidden"]):not(.sr-only), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ].filter((el) => el.offsetParent !== null);
      if (focaveis.length) {
        const primeiro = focaveis[0];
        const ultimo = focaveis[focaveis.length - 1];
        if (e.shiftKey && document.activeElement === primeiro) {
          e.preventDefault();
          ultimo.focus();
        } else if (!e.shiftKey && document.activeElement === ultimo) {
          e.preventDefault();
          primeiro.focus();
        }
      }
      return;
    }

    if (e.key === "Escape") {
      fecharMenuNovoReg();
      if (modalAtivo) fecharModal(modalAtivo);
      else fecharMenu();
    }
    if (
      e.key === "/" &&
      !/INPUT|SELECT|TEXTAREA/.test(document.activeElement?.tagName ?? "")
    ) {
      e.preventDefault();
      $("q")?.focus();
    }
  });

  initForms(render);
  render();
});
