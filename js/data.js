/**
 * Módulo de Dados e Persistência - Saúde Unificada
 */
const STORAGE_KEY_TRABALHADORES = "saude_unificada_trabalhadores";
const STORAGE_KEY_EXAMES = "saude_unificada_exames";

/* Armazenamento com fallback em memória (localStorage indisponível/bloqueado) */
const storage = (() => {
  const mem = {};
  try {
    const k = "__su_test";
    localStorage.setItem(k, k);
    localStorage.removeItem(k);
    return {
      get: (k) => localStorage.getItem(k),
      set: (k, v) => localStorage.setItem(k, v),
    };
  } catch (e) {
    return {
      get: (k) => (k in mem ? mem[k] : null),
      set: (k, v) => {
        mem[k] = v;
      },
    };
  }
})();

/* Arquivos (Blob) no IndexedDB — sem o limite de ~5 MB do localStorage; fallback em memória */
const fileStore = (() => {
  const mem = new Map();
  let dbp;
  try {
    dbp = new Promise((res, rej) => {
      const r = indexedDB.open("saude_unificada_files", 1);
      r.onupgradeneeded = () => r.result.createObjectStore("files");
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    }).catch(() => null);
  } catch (e) {
    dbp = Promise.resolve(null);
  }
  const tx = async (mode, fn) => {
    const db = await dbp;
    if (!db) throw 0;
    return new Promise((res, rej) => {
      const t = db.transaction("files", mode),
        q = fn(t.objectStore("files"));
      t.oncomplete = () => res(q.result);
      t.onerror = () => rej(t.error);
    });
  };
  return {
    put: async (k, blob) => {
      try {
        await tx("readwrite", (s) => s.put(blob, k));
      } catch (e) {
        mem.set(k, blob);
      }
    },
    get: async (k) => {
      try {
        const v = await tx("readonly", (s) => s.get(k));
        if (v) return v;
      } catch (e) {}
      return mem.get(k) ?? null;
    },
    del: async (k) => {
      mem.delete(k);
      try {
        await tx("readwrite", (s) => s.delete(k));
      } catch (e) {}
    },
  };
})();

const INITIAL_TRABALHADORES = [
  {
    id: "trab-1",
    nome: "João Arthur Belmiro",
    cpf: "123.456.789-00",
    setor: "Técnico de Operações Industriais",
    empresa: "Masterboi Indústria S.A.",
  },
  {
    id: "trab-2",
    nome: "Cailane Maria Cavalcante",
    cpf: "987.654.321-11",
    setor: "Analista de Qualidade e Segurança",
    empresa: "Porto Digital Recife",
  },
  {
    id: "trab-3",
    nome: "Arhyel Alves Neves",
    cpf: "456.789.123-22",
    setor: "Supervisor de Manutenção",
    empresa: "Masterboi Indústria S.A.",
  },
];
const DUMMY =
  "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
const INITIAL_EXAMES = [
  {
    id: "ex-101",
    trabalhadorId: "trab-1",
    tipo: "ASO",
    laboratorio: "Clínica de Saúde Ocupacional do Recife",
    dataRealizacao: "2025-10-15",
    dataVencimento: "2026-10-15",
    medico: "Dr. Anderson Marcolino (CRM/PE 45123)",
    linkDocumento: DUMMY,
  },
  {
    id: "ex-102",
    trabalhadorId: "trab-1",
    tipo: "Audiometria",
    laboratorio: "Centro Auditivo do Recife",
    dataRealizacao: "2025-05-10",
    dataVencimento: "2026-05-10",
    medico: "Dra. Patricia Lima (CRFa 8912)",
    linkDocumento: DUMMY,
  },
  {
    id: "ex-103",
    trabalhadorId: "trab-2",
    tipo: "Admissional",
    laboratorio: "Laboratório Saúde Recife",
    dataRealizacao: "2026-01-20",
    dataVencimento: "2027-01-20",
    medico: "Dr. Roberto Santos (CRM/PE 11234)",
    linkDocumento: DUMMY,
  },
  {
    id: "ex-104",
    trabalhadorId: "trab-3",
    tipo: "Periódico",
    laboratorio: "Centro Ocupacional Ibura",
    dataRealizacao: "2025-09-01",
    dataVencimento: "2026-09-01",
    medico: "Dr. Anderson Marcolino (CRM/PE 45123)",
    linkDocumento: DUMMY,
  },
];

function carregar(key, inicial) {
  const raw = storage.get(key);
  if (!raw) {
    storage.set(key, JSON.stringify(inicial));
    return structuredClone(inicial);
  }
  try {
    return JSON.parse(raw);
  } catch {
    return structuredClone(inicial);
  }
}
function salvar(key, data) {
  try {
    storage.set(key, JSON.stringify(data));
    return true;
  } catch (e) {
    return false;
  } // cota excedida
}
const obterTrabalhadores = () =>
  carregar(STORAGE_KEY_TRABALHADORES, INITIAL_TRABALHADORES);
const obterExames = () => carregar(STORAGE_KEY_EXAMES, INITIAL_EXAMES);
const salvarTrabalhadores = (t) => salvar(STORAGE_KEY_TRABALHADORES, t);
const salvarExames = (e) => salvar(STORAGE_KEY_EXAMES, e);

function parseLocalDate(s) {
  if (!s) return new Date();
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function formatarDataBR(s) {
  if (!s) return "—";
  const p = s.split("-");
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : s;
}
function diasAte(s) {
  const h = new Date();
  h.setHours(0, 0, 0, 0);
  return Math.round((parseLocalDate(s) - h) / 864e5);
}
function calcularStatusExame(venc) {
  if (!venc) return "validos";
  const d = diasAte(venc);
  return d < 0 ? "vencidos" : d <= 30 ? "alerta" : "validos";
}
