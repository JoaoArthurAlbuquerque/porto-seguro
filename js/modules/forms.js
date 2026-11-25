/**
 * Módulo de Formulários, Validação Inline, Uploads e Preenchimento Demo (Pitch)
 * Porto Seguro · Gestão Ocupacional
 */

import { fileStore, formatarCPF, validarCPF, parseLocalDate } from "../data.js";
import { state, $, trabPorId, persistirTudo } from "./state.js";
import { fecharModal, setDocModo } from "./navigation.js";
import { toast } from "./animations.js";

let demoTrabIdx = 0;
let demoExameIdx = 0;

const DEMO_TRABALHADORES = [
  {
    nome: "Lucas Gabriel Ferreira",
    setor: "Técnico em Segurança do Trabalho",
    empresa: "Porto Digital Recife",
  },
  {
    nome: "Beatriz Helena Nogueira",
    setor: "Supervisora de Controle Ambiental",
    empresa: "Masterboi Indústria S.A.",
  },
  {
    nome: "Thiago Henrique Santana",
    setor: "Eletricista Industrial NR-10",
    empresa: "Estaleiro Atlântico Sul",
  },
];

const DEMO_EXAMES = [
  {
    tipo: "ASO",
    laboratorio: "Clínica Ocupacional Boa Viagem",
    medico: "Dra. Fernanda Cavalcanti (CRM/PE 21984)",
    link: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
  },
  {
    tipo: "Periódico",
    laboratorio: "Centro Médico Saúde & Trabalho",
    medico: "Dr. Marcelo Montenegro (CRM/PE 18432)",
    link: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
  },
  {
    tipo: "Audiometria",
    laboratorio: "Instituto Auditivo Pernambucano",
    medico: "Dra. Juliana Barros (CRFa 9421)",
    link: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
  },
];

function gerarCPFValidoUnico() {
  let cpfFormatado = "";
  let tentativas = 0;

  while (tentativas < 20) {
    tentativas++;
    const base = Array.from(
      { length: 9 },
      () => Math.floor(Math.random() * 9) + 1,
    );
    let soma = base.reduce((acc, d, i) => acc + d * (10 - i), 0);
    let d1 = (soma * 10) % 11;
    if (d1 === 10) d1 = 0;

    soma = [...base, d1].reduce((acc, d, i) => acc + d * (11 - i), 0);
    let d2 = (soma * 10) % 11;
    if (d2 === 10) d2 = 0;

    cpfFormatado = formatarCPF([...base, d1, d2].join(""));
    if (!state.trabalhadores.some((t) => t.cpf === cpfFormatado)) {
      return cpfFormatado;
    }
  }
  return "248.613.905-24";
}

function preencherExemploTrabalhador() {
  const amostra = DEMO_TRABALHADORES[demoTrabIdx % DEMO_TRABALHADORES.length];
  demoTrabIdx++;

  $("t-nome").value = amostra.nome;
  $("t-cpf").value = gerarCPFValidoUnico();
  $("t-setor").value = amostra.setor;
  $("t-emp").value = amostra.empresa;

  $("form-trab")
    .querySelectorAll("[aria-invalid]")
    .forEach((el) => el.removeAttribute("aria-invalid"));
  $("form-trab")
    .querySelectorAll(".error")
    .forEach((el) => el.classList.add("hidden"));
}

function preencherExemploExame() {
  const amostra = DEMO_EXAMES[demoExameIdx % DEMO_EXAMES.length];
  demoExameIdx++;

  const hoje = new Date();
  const venc = new Date(
    hoje.getFullYear() + 1,
    hoje.getMonth(),
    hoje.getDate(),
  );
  const toISO = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  $("e-tipo").value = amostra.tipo;
  $("e-lab").value = amostra.laboratorio;
  $("e-real").value = toISO(hoje);
  $("e-venc").value = toISO(venc);
  $("e-med").value = amostra.medico;
  setDocModo("link");
  $("e-link").value = amostra.link;

  $("form-exame")
    .querySelectorAll("[aria-invalid]")
    .forEach((el) => el.removeAttribute("aria-invalid"));
  $("form-exame")
    .querySelectorAll(".error")
    .forEach((el) => el.classList.add("hidden"));
}

function lerArquivo(file) {
  if (!file) return;
  if (!/^(application\/pdf|image\/)/.test(file.type)) {
    toast("Envie um PDF ou uma imagem.", "warn");
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    toast("Arquivo acima de 10 MB. Use um link (Drive/URL).", "warn");
    return;
  }
  state.arquivoBlob = file;
  state.arquivoNome = file.name;
  $("file-name").textContent = "📎 " + file.name;
  $("doc-err").classList.add("hidden");
}

function validarCamposObrigatorios(form) {
  let ok = true;
  form.querySelectorAll("[required]").forEach((input) => {
    const invalido = !String(input.value).trim();
    input.setAttribute("aria-invalid", invalido);
    const errEl = form.querySelector(`[data-err-for="${input.id}"]`);
    if (errEl && input.id !== "t-cpf" && input.id !== "e-venc") {
      errEl.classList.toggle("hidden", !invalido);
    }
    if (invalido) ok = false;
  });
  return ok;
}

function focarPrimeiroInvalido(form) {
  const primeiro = form.querySelector('[aria-invalid="true"]');
  if (primeiro) {
    primeiro.scrollIntoView({ behavior: "smooth", block: "center" });
    primeiro.focus({ preventScroll: true });
  }
}

export function initForms(onRender) {
  // Limpeza automática de estado de erro ao digitar/alterar
  document.querySelectorAll(".input").forEach((i) =>
    i.addEventListener("input", () => {
      i.removeAttribute("aria-invalid");
      const errEl = document.querySelector(`[data-err-for="${i.id}"]`);
      if (errEl) errEl.classList.add("hidden");
    }),
  );

  // Máscara de CPF
  $("t-cpf")?.addEventListener("input", (e) => {
    e.target.value = formatarCPF(e.target.value);
  });

  // Sugere vencimento +1 ano automaticamente
  $("e-real")?.addEventListener("change", () => {
    if (!$("e-venc").value && $("e-real").value) {
      const d = parseLocalDate($("e-real").value);
      d.setFullYear(d.getFullYear() + 1);
      $("e-venc").value =
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    }
  });

  // Botões de demonstração rápida para o Pitch
  $("btn-demo-trab")?.addEventListener("click", preencherExemploTrabalhador);
  $("btn-demo-exame")?.addEventListener("click", preencherExemploExame);

  // Upload e Drag & Drop
  $("e-file")?.addEventListener("change", (e) => lerArquivo(e.target.files[0]));
  const drop = $("drop");
  if (drop) {
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
  }

  // Submit Trabalhador
  $("form-trab")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target;
    let ok = validarCamposObrigatorios(f);

    const cpf = $("t-cpf").value.trim();
    const tAtual = state.editTrabId ? trabPorId(state.editTrabId) : null;
    const cpfInalterado = tAtual && tAtual.cpf === cpf;

    if (cpf && !cpfInalterado && !validarCPF(cpf)) {
      $("t-cpf").setAttribute("aria-invalid", true);
      $("t-cpf-err").textContent = "Informe um CPF válido (11 dígitos).";
      $("t-cpf-err").classList.remove("hidden");
      ok = false;
    } else if (
      cpf &&
      state.trabalhadores.some(
        (t) => t.cpf === cpf && t.id !== state.editTrabId,
      )
    ) {
      $("t-cpf").setAttribute("aria-invalid", true);
      $("t-cpf-err").textContent = "CPF já cadastrado no sistema.";
      $("t-cpf-err").classList.remove("hidden");
      ok = false;
    }

    if (!ok) {
      focarPrimeiroInvalido(f);
      return;
    }

    const dados = {
      nome: $("t-nome").value.trim(),
      cpf,
      setor: $("t-setor").value.trim(),
      empresa: $("t-emp").value.trim(),
    };

    const editando = Boolean(state.editTrabId);
    let t;
    if (editando) {
      t = trabPorId(state.editTrabId);
      Object.assign(t, dados);
    } else {
      t = { id: "trab-" + Date.now(), ...dados };
      state.trabalhadores.push(t);
    }

    persistirTudo();
    state.selecionadoId = t.id;
    fecharModal($("modal-trabalhador"));
    onRender();
    toast(
      editando
        ? "Dados do colaborador atualizados."
        : `${t.nome.split(" ")[0]} cadastrado(a) com sucesso!`,
    );
  });

  // Submit Exame
  $("form-exame")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target;
    let ok = validarCamposObrigatorios(f);

    const r = $("e-real").value;
    const v = $("e-venc").value;
    const datasOk = !(r && v && v <= r);
    $("e-venc-err").classList.toggle("hidden", datasOk);
    if (!datasOk) {
      $("e-venc").setAttribute("aria-invalid", true);
      ok = false;
    }

    const link = $("e-link").value.trim();
    const atual =
      state.editExId && state.exames.find((x) => x.id === state.editExId);
    const docOk =
      state.docModo === "file"
        ? Boolean(state.arquivoBlob || atual?.arquivoId || atual?.arquivo)
        : /^https?:\/\/\S+$/i.test(link);

    $("doc-err").classList.toggle("hidden", docOk);
    if (state.docModo === "link") {
      $("e-link").setAttribute("aria-invalid", !docOk);
    }
    if (!docOk) ok = false;

    if (!ok) {
      focarPrimeiroInvalido(f);
      return;
    }

    const id = atual ? atual.id : "ex-" + Date.now();
    const ex = {
      id,
      trabalhadorId: $("e-trab").value,
      tipo: $("e-tipo").value,
      laboratorio: $("e-lab").value.trim(),
      dataRealizacao: r,
      dataVencimento: v,
      medico: $("e-med").value.trim(),
      linkDocumento: state.docModo === "link" ? link : "",
    };

    if (state.docModo === "file") {
      if (state.arquivoBlob) {
        await fileStore.put(id, state.arquivoBlob);
        Object.assign(ex, {
          arquivoId: id,
          arquivoNome: state.arquivoNome,
          arquivoTipo: state.arquivoBlob.type,
        });
      } else {
        Object.assign(ex, {
          arquivoId: atual.arquivoId,
          arquivo: atual.arquivo,
          arquivoNome: atual.arquivoNome,
          arquivoTipo: atual.arquivoTipo,
        });
      }
    } else if (atual?.arquivoId) {
      fileStore.del(atual.arquivoId);
    }

    const backup = state.exames;
    state.exames = atual
      ? state.exames.map((x) => (x.id === id ? ex : x))
      : [...state.exames, ex];

    if (!persistirTudo()) {
      state.exames = backup;
      toast("Não foi possível salvar os dados.", "err");
      return;
    }

    state.selecionadoId = ex.trabalhadorId;
    fecharModal($("modal-exame"));
    onRender();
    toast(atual ? "Exame atualizado." : "Exame registrado com sucesso!");
  });
}
