/**
 * Módulo de Dados, Persistência e Utilitários de Domínio
 * Porto Seguro · Gestão Ocupacional
 */

export const STORAGE_KEY_TRABALHADORES = "saude_unificada_trabalhadores";
export const STORAGE_KEY_EXAMES = "saude_unificada_exames";

/* Armazenamento com fallback em memória (caso localStorage esteja bloqueado) */
const storage = (() => {
  const mem = {};
  try {
    const k = "__su_test";
    localStorage.setItem(k, k);
    localStorage.removeItem(k);
    return {
      get: (k) => localStorage.getItem(k),
      set: (k, v) => localStorage.setItem(k, v),
      remove: (k) => localStorage.removeItem(k),
    };
  } catch {
    return {
      get: (k) => (k in mem ? mem[k] : null),
      set: (k, v) => {
        mem[k] = v;
      },
      remove: (k) => {
        delete mem[k];
      },
    };
  }
})();

/* Arquivos (Blob) no IndexedDB — sem limite de ~5 MB do localStorage; fallback em memória */
export const fileStore = (() => {
  const mem = new Map();
  let dbp;
  try {
    dbp = new Promise((res, rej) => {
      const r = indexedDB.open("saude_unificada_files", 1);
      r.onupgradeneeded = () => r.result.createObjectStore("files");
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    }).catch(() => null);
  } catch {
    dbp = Promise.resolve(null);
  }

  const tx = async (mode, fn) => {
    const db = await dbp;
    if (!db) throw new Error("IndexedDB indisponível");
    return new Promise((res, rej) => {
      const t = db.transaction("files", mode);
      const q = fn(t.objectStore("files"));
      t.oncomplete = () => res(q.result);
      t.onerror = () => rej(t.error);
    });
  };

  return {
    put: async (k, blob) => {
      try {
        await tx("readwrite", (s) => s.put(blob, k));
      } catch {
        mem.set(k, blob);
      }
    },
    get: async (k) => {
      try {
        const v = await tx("readonly", (s) => s.get(k));
        if (v) return v;
      } catch {}
      return mem.get(k) ?? null;
    },
    del: async (k) => {
      mem.delete(k);
      try {
        await tx("readwrite", (s) => s.delete(k));
      } catch {}
    },
  };
})();

/* Helper para gerar datas ISO relativas ao dia atual (mantém o pitch sempre realista) */
function isoDiasRelativos(offsetDias) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offsetDias);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const SAMPLE_DOC_URL =
  "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";

export const INITIAL_TRABALHADORES = [
  {
    id: "trab-1",
    nome: "João Arthur Belmiro",
    cpf: "529.982.247-25",
    setor: "Técnico de Operações Industriais",
    empresa: "Masterboi Indústria S.A.",
  },
  {
    id: "trab-2",
    nome: "Cailane Maria Cavalcante",
    cpf: "111.444.777-35",
    setor: "Analista de Qualidade e Segurança",
    empresa: "Porto Digital Recife",
  },
  {
    id: "trab-3",
    nome: "Arhyel Alves Neves",
    cpf: "714.287.938-60",
    setor: "Supervisor de Manutenção",
    empresa: "Masterboi Indústria S.A.",
  },
  {
    id: "trab-4",
    nome: "Mariana Costa Vasconcelos",
    cpf: "390.533.447-05",
    setor: "Engenheira de Segurança do Trabalho",
    empresa: "Porto Digital Recife",
  },
  {
    id: "trab-5",
    nome: "Rafael Henrique Moura",
    cpf: "842.195.604-12",
    setor: "Operador de Logística Fria",
    empresa: "Masterboi Indústria S.A.",
  },
];

export function criarExamesIniciais() {
  return [
    {
      id: "ex-101",
      trabalhadorId: "trab-1",
      tipo: "ASO",
      laboratorio: "Clínica de Saúde Ocupacional do Recife",
      dataRealizacao: isoDiasRelativos(-45),
      dataVencimento: isoDiasRelativos(320),
      medico: "Dr. Anderson Marcolino (CRM/PE 45123)",
      linkDocumento: SAMPLE_DOC_URL,
    },
    {
      id: "ex-102",
      trabalhadorId: "trab-1",
      tipo: "Audiometria",
      laboratorio: "Centro Auditivo do Recife",
      dataRealizacao: isoDiasRelativos(-353),
      dataVencimento: isoDiasRelativos(12),
      medico: "Dra. Patricia Lima (CRFa 8912)",
      linkDocumento: SAMPLE_DOC_URL,
    },
    {
      id: "ex-103",
      trabalhadorId: "trab-2",
      tipo: "Admissional",
      laboratorio: "Laboratório Saúde Recife",
      dataRealizacao: isoDiasRelativos(-18),
      dataVencimento: isoDiasRelativos(347),
      medico: "Dr. Roberto Santos (CRM/PE 11234)",
      linkDocumento: SAMPLE_DOC_URL,
    },
    {
      id: "ex-104",
      trabalhadorId: "trab-3",
      tipo: "Periódico",
      laboratorio: "Centro Ocupacional Ibura",
      dataRealizacao: isoDiasRelativos(-379),
      dataVencimento: isoDiasRelativos(-14),
      medico: "Dr. Anderson Marcolino (CRM/PE 45123)",
      linkDocumento: SAMPLE_DOC_URL,
    },
    {
      id: "ex-105",
      trabalhadorId: "trab-4",
      tipo: "ASO",
      laboratorio: "Clínica Medicina do Trabalho Boa Viagem",
      dataRealizacao: isoDiasRelativos(-110),
      dataVencimento: isoDiasRelativos(255),
      medico: "Dra. Camila Albuquerque (CRM/PE 28910)",
      linkDocumento: SAMPLE_DOC_URL,
    },
    {
      id: "ex-106",
      trabalhadorId: "trab-4",
      tipo: "Ultrassom",
      laboratorio: "Diagnóstico Imagem Recife",
      dataRealizacao: isoDiasRelativos(-210),
      dataVencimento: isoDiasRelativos(155),
      medico: "Dr. Henrique Vasconcelos (CRM/PE 33412)",
      linkDocumento: SAMPLE_DOC_URL,
    },
    {
      id: "ex-107",
      trabalhadorId: "trab-5",
      tipo: "Periódico",
      laboratorio: "Clínica de Saúde Ocupacional do Recife",
      dataRealizacao: isoDiasRelativos(-342),
      dataVencimento: isoDiasRelativos(23),
      medico: "Dr. Anderson Marcolino (CRM/PE 45123)",
      linkDocumento: SAMPLE_DOC_URL,
    },
    {
      id: "ex-108",
      trabalhadorId: "trab-2",
      tipo: "Audiometria",
      laboratorio: "Centro Auditivo do Recife",
      dataRealizacao: isoDiasRelativos(-270),
      dataVencimento: isoDiasRelativos(95),
      medico: "Dra. Patricia Lima (CRFa 8912)",
      linkDocumento: SAMPLE_DOC_URL,
    },
  ];
}

function carregar(key, criarInicial) {
  const raw = storage.get(key);
  if (!raw) {
    const base = criarInicial();
    storage.set(key, JSON.stringify(base));
    return base;
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : criarInicial();
  } catch {
    return criarInicial();
  }
}

function salvar(key, data) {
  try {
    storage.set(key, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export const obterTrabalhadores = () =>
  carregar(STORAGE_KEY_TRABALHADORES, () =>
    structuredClone(INITIAL_TRABALHADORES),
  );

export const obterExames = () =>
  carregar(STORAGE_KEY_EXAMES, criarExamesIniciais);

export const salvarTrabalhadores = (t) => salvar(STORAGE_KEY_TRABALHADORES, t);
export const salvarExames = (e) => salvar(STORAGE_KEY_EXAMES, e);

export function resetarDadosDemo() {
  const trabs = structuredClone(INITIAL_TRABALHADORES);
  const exs = criarExamesIniciais();
  salvarTrabalhadores(trabs);
  salvarExames(exs);
  return { trabalhadores: trabs, exames: exs };
}

/* Utilitários de CPF */
export function formatarCPF(valor) {
  const d = String(valor || "")
    .replace(/\D/g, "")
    .slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function validarCPF(cpf) {
  const d = String(cpf || "").replace(/\D/g, "");
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) soma += Number(d[i]) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  if (resto !== Number(d[9])) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) soma += Number(d[i]) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  return resto === Number(d[10]);
}

/* Utilitários de Data */
export function parseLocalDate(s) {
  if (!s) return new Date();
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function formatarDataBR(s) {
  if (!s) return "—";
  const p = s.split("-");
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : s;
}

export function diasAte(s) {
  const h = new Date();
  h.setHours(0, 0, 0, 0);
  return Math.round((parseLocalDate(s) - h) / 864e5);
}

export function calcularStatusExame(venc) {
  if (!venc) return "validos";
  const d = diasAte(venc);
  return d < 0 ? "vencidos" : d <= 30 ? "alerta" : "validos";
}
