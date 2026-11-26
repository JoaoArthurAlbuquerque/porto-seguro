/**
 * Módulo de Estado Central, Seletores e Regras de Negócio
 * Porto Seguro · Gestão Ocupacional
 */

import {
  obterTrabalhadores,
  obterExames,
  salvarTrabalhadores,
  salvarExames,
  resetarDadosDemo,
  calcularStatusExame,
} from "../data.js";

const iniciaisTrabalhadores = obterTrabalhadores();

export const state = {
  trabalhadores: iniciaisTrabalhadores,
  exames: obterExames(),
  selecionadoId: iniciaisTrabalhadores[0]?.id ?? null,
  vista: "dashboard",
  docModo: "link",
  arquivoBlob: null,
  arquivoNome: "",
  editTrabId: null,
  editExId: null,
  docUrl: null,
  confirmarFn: null,
  ultimoFoco: null,
};

export const ST = {
  validos: { l: "Válido", c: "ok" },
  alerta: { l: "A vencer", c: "warn" },
  vencidos: { l: "Vencido", c: "err" },
};

export const MESES = [
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

const AVATAR_PALETTES = [
  { bg: "#eff6ff", color: "#2563eb" },
  { bg: "#f5f3ff", color: "#7c3aed" },
  { bg: "#ecfdf5", color: "#059669" },
  { bg: "#fff7ed", color: "#ea580c" },
  { bg: "#fdf2f8", color: "#db2777" },
  { bg: "#f0fdfa", color: "#0d9488" },
];

export const $ = (id) => document.getElementById(id);

export const emIframe = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
})();

export function avatarColor(name) {
  let hash = 0;
  for (let i = 0; i < (name || "").length; i++) {
    hash += name.charCodeAt(i);
  }
  return AVATAR_PALETTES[hash % AVATAR_PALETTES.length];
}

export const esc = (s) =>
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

export const norm = (s) =>
  String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export const iniciais = (n) =>
  String(n || "?")
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .filter((_, i, a) => i === 0 || i === a.length - 1)
    .join("")
    .toUpperCase();

export const badge = (st) => `<span class="badge ${ST[st].c}">${ST[st].l}</span>`;

export const trabPorId = (id) => state.trabalhadores.find((t) => t.id === id);

export const examesDe = (id) =>
  state.exames.filter((e) => e.trabalhadorId === id);

export const piorStatus = (lista) =>
  lista.some((e) => calcularStatusExame(e.dataVencimento) === "vencidos")
    ? "vencidos"
    : lista.some((e) => calcularStatusExame(e.dataVencimento) === "alerta")
      ? "alerta"
      : lista.length
        ? "validos"
        : "none";

export function persistirTudo() {
  const okT = salvarTrabalhadores(state.trabalhadores);
  const okE = salvarExames(state.exames);
  return okT && okE;
}

export function restaurarDemoState() {
  const { trabalhadores, exames } = resetarDadosDemo();
  state.trabalhadores = trabalhadores;
  state.exames = exames;
  state.selecionadoId = trabalhadores[0]?.id ?? null;
}

/* ---------- Filtros e Métricas ---------- */
export const lerFiltros = () => ({
  q: norm($("q")?.value.trim() ?? ""),
  tipo: $("f-tipo")?.value ?? "todos",
  status: $("f-status")?.value ?? "todos",
  ordem: $("f-ordem")?.value ?? "recentes",
});

export function aplicarFiltros(lista, { tipo, status, ordem }) {
  let r = lista;
  if (tipo !== "todos") r = r.filter((e) => e.tipo === tipo);
  if (status !== "todos") {
    r = r.filter((e) => calcularStatusExame(e.dataVencimento) === status);
  }
  const by =
    ordem === "vencimento"
      ? (a, b) => a.dataVencimento.localeCompare(b.dataVencimento)
      : ordem === "antigos"
        ? (a, b) => a.dataRealizacao.localeCompare(b.dataRealizacao)
        : (a, b) => b.dataRealizacao.localeCompare(a.dataRealizacao);
  return [...r].sort(by);
}

export const exameCasaTermo = (e, q) =>
  !q ||
  norm(e.tipo).includes(q) ||
  norm(e.medico).includes(q) ||
  norm(e.laboratorio).includes(q);

export const trabCasaTermo = (t, q) =>
  !q ||
  norm(t.nome).includes(q) ||
  t.cpf.replace(/\D/g, "").includes(q.replace(/\D/g, "") || "§") ||
  t.cpf.includes(q) ||
  norm(t.setor).includes(q) ||
  norm(t.empresa).includes(q);

export function calcularContagens() {
  const c = { validos: 0, alerta: 0, vencidos: 0 };
  state.exames.forEach((e) => c[calcularStatusExame(e.dataVencimento)]++);
  const comExame = state.trabalhadores.filter((t) => examesDe(t.id).length);
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

export function linhasPendencia() {
  const ordem = { vencidos: 0, alerta: 1, none: 2, validos: 3 };
  return state.trabalhadores
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