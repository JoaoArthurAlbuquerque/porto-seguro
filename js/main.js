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
} from "./modules/tables.js";
import { initForms } from "./modules/forms.js";
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
  ["q", "f-tipo", "f-status", "f-ordem"].forEach((id) =>
    $(id)?.addEventListener(id === "q" ? "input" : "change", render),
  );

  $("f-clear")?.addEventListener("click", () => {
    $("q").value = "";
    $("f-tipo").value = "todos";
    $("f-status").value = "todos";
    render();
  });

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
    const el = e.target.closest(
      "[data-open],[data-close],[data-docid],[data-sel],[data-add],[data-hist],[data-doc],[data-edit-ex],[data-del-ex],[data-edit-trab],[data-del-trab]",
    );
    if (!el) return;

    if (el.dataset.open) {
      state.editTrabId = null;
      state.editExId = null;
      abrirModal(el.dataset.open);
    } else if (el.hasAttribute("data-close")) {
      fecharModal(el.closest(".modal"));
    } else if (el.dataset.docid) {
      abrirDocumento(el.dataset.docid);
    } else if (el.dataset.add) {
      state.editExId = null;
      abrirModal("modal-exame", el.dataset.add);
    } else if (el.dataset.editEx) {
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

  // Atalhos de teclado (Escape e / para busca)
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const m = document.querySelector(".modal:not(.hidden)");
      if (m) fecharModal(m);
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
